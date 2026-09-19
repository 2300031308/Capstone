/*
 * Product Controller
 * Handles HTTP requests for product operations.
 */

'use strict';

const fabricService = require('../services/fabricService');
const cryptoService = require('../services/cryptoService');
const { logTransactionActivity } = require('./networkController');

/**
 * Register a new product.
 * POST /api/products
 */
async function registerProduct(req, res, next) {
    try {
        const { productId, productName, batchNumber } = req.body;

        // 1. Mandatory field validation
        if (!productId || !productName || !batchNumber) {
            return res.status(400).json({
                success: false,
                error: 'Product ID, Product Name, and Batch Number are all required.',
            });
        }

        const cleanId = productId.trim();
        const cleanName = productName.trim();
        const cleanBatch = batchNumber.trim();

        // 2. Pre-check if product already exists on the ledger to prevent raw Fabric transaction rejection stack traces
        try {
            const existsResult = await fabricService.evaluateTransaction('productExists', cleanId);
            const exists = existsResult === true || existsResult === 'true' || (typeof existsResult === 'string' && existsResult.toLowerCase() === 'true');
            if (exists) {
                return res.status(409).json({
                    success: false,
                    error: 'Product ID already exists on the ledger. Please use a different Product ID.',
                });
            }
        } catch (evalErr) {
            // Non-fatal: if evaluation fails (e.g. gateway timeout), log warning and allow submitTransaction to attempt
            console.warn(`[productExists] Pre-check evaluation warning for "${cleanId}":`, evalErr.message);
        }

        // 3. Server-side derivation: manufacturer identity is derived from authenticated user's organization
        const manufacturer = req.user?.organization || 'ManufacturerOrg';

        // 4. Deterministic Canonical Data, SHA-256 Hash, and ECDSA Digital Signature
        const canonicalData = cryptoService.getCanonicalString({
            productId: cleanId,
            productName: cleanName,
            batchNumber: cleanBatch,
            manufacturer,
        });
        const productHash = cryptoService.generateProductHash(canonicalData);
        const digitalSignature = cryptoService.signProduct(canonicalData);

        const result = await fabricService.submitTransaction(
            'registerProduct',
            cleanId,
            cleanName,
            cleanBatch,
            manufacturer,
            productHash,
            digitalSignature
        );

        // Record confirmed blockchain transaction in real-time activity stream
        logTransactionActivity({
            type: 'REGISTER_PRODUCT',
            productId: cleanId,
            productName: cleanName,
            actor: manufacturer,
            currentOwner: manufacturer,
            status: 'COMMITTED',
            timestamp: result?.createdAt || new Date().toISOString(),
            isGenesis: false,
        });

        res.status(201).json({
            success: true,
            message: 'Product registered successfully on the blockchain',
            data: result,
        });
    } catch (error) {
        console.error(`[registerProduct] Error committing transaction for "${req.body?.productId}":`, error.message);
        if (error.message && (error.message.includes('already exists') || error.message.includes('already registered'))) {
            return res.status(409).json({
                success: false,
                error: 'Product ID already exists on the ledger. Please use a different Product ID.',
            });
        }
        return res.status(500).json({
            success: false,
            error: 'Unable to commit the transaction. Please try again.',
        });
    }
}

/**
 * Get a product by ID.
 * GET /api/products/:productId
 */
async function getProduct(req, res, next) {
    try {
        const { productId } = req.params;

        const result = await fabricService.evaluateTransaction(
            'getProduct',
            productId
        );

        res.json({
            success: true,
            data: result,
        });
    } catch (error) {
        next(error);
    }
}

/**
 * Get all products.
 * GET /api/products
 */
async function getAllProducts(req, res, next) {
    try {
        const result = await fabricService.evaluateTransaction('getAllProducts');

        res.json({
            success: true,
            data: result || [],
        });
    } catch (error) {
        next(error);
    }
}

/**
 * Transfer product ownership (O4).
 * POST /api/products/:productId/transfer
 *
 * Strict Multi-Layer Authorization:
 * - Authenticated User & Token
 * - Verified Organization
 * - Authorized Role
 * - Current Custodian check against actual Fabric Ledger state
 * - Enforced supply chain lifecycle transition
 */
async function transferOwnership(req, res, next) {
    try {
        const { productId } = req.params;

        // 1. Fetch current product from Hyperledger Fabric ledger
        let currentProduct;
        try {
            const rawProduct = await fabricService.evaluateTransaction('getProduct', productId);
            currentProduct = typeof rawProduct === 'string' ? JSON.parse(rawProduct) : rawProduct;
        } catch (evalErr) {
            return res.status(404).json({
                success: false,
                error: `Product ${productId} not found in blockchain world state.`,
            });
        }

        if (!currentProduct) {
            return res.status(404).json({
                success: false,
                error: `Product ${productId} not found in blockchain world state.`,
            });
        }

        // 2. Derive caller role, organization, and MSP strictly from authenticated JWT claims
        const userOrg = req.user?.organization;
        const userRole = (req.user?.role || '').toLowerCase();
        const userMsp = req.user?.mspId || (userRole === 'manufacturer' ? 'Org1MSP' : 'Org2MSP');

        // Terminal state check
        if (currentProduct.status === 'SOLD_TO_CONSUMER') {
            return res.status(400).json({
                success: false,
                error: `Terminal State: Product ${productId} has already been sold to a consumer. No further custody transfers permitted.`,
            });
        }

        // 3. Ownership-based access control: Verify authenticated user's organization is current custodian
        if (currentProduct.currentOwner !== userOrg) {
            return res.status(403).json({
                success: false,
                error: `Ownership Check Failed: Product ${productId} is currently in custody of "${currentProduct.currentOwner}". Your authenticated organization is "${userOrg}". Only the verified custodian can transfer custody.`,
            });
        }

        // 4. Strict state machine transition: client-supplied newOwner and newStatus are discarded
        let targetOwner;
        let targetStatus;

        if (userRole === 'manufacturer') {
            if (currentProduct.status !== 'REGISTERED') {
                return res.status(400).json({
                    success: false,
                    error: `Invalid Transition: Manufacturer can only transfer products in 'REGISTERED' status. Current status is '${currentProduct.status}'.`,
                });
            }
            targetOwner = 'DistributorOrg';
            targetStatus = 'IN_TRANSIT_TO_DISTRIBUTOR';
        } else if (userRole === 'distributor') {
            if (currentProduct.status !== 'IN_TRANSIT_TO_DISTRIBUTOR') {
                return res.status(400).json({
                    success: false,
                    error: `Invalid Transition: Distributor can only transfer products in 'IN_TRANSIT_TO_DISTRIBUTOR' status. Current status is '${currentProduct.status}'.`,
                });
            }
            targetOwner = 'RetailerOrg';
            targetStatus = 'DELIVERED_TO_RETAILER';
        } else if (userRole === 'retailer') {
            if (currentProduct.status !== 'DELIVERED_TO_RETAILER') {
                return res.status(400).json({
                    success: false,
                    error: `Invalid Transition: Retailer can only transfer products in 'DELIVERED_TO_RETAILER' status. Current status is '${currentProduct.status}'.`,
                });
            }
            targetOwner = 'Consumer';
            targetStatus = 'SOLD_TO_CONSUMER';
        } else {
            return res.status(403).json({
                success: false,
                error: `Access Denied: Role "${userRole}" is not authorized to execute custody transfers.`,
            });
        }

        // 5. Submit transaction using the caller's verified Fabric MSP identity
        const result = await fabricService.submitTransactionAs(
            userMsp,
            'transferOwnership',
            productId,
            targetOwner,
            targetStatus
        );

        // 6. Log confirmed transaction in real-time activity stream
        logTransactionActivity({
            type: 'TRANSFER_CUSTODY',
            productId,
            productName: currentProduct.productName,
            actor: userOrg,
            previousOwner: currentProduct.currentOwner,
            currentOwner: targetOwner,
            status: targetStatus,
            timestamp: result?.updatedAt || new Date().toISOString(),
            isGenesis: false,
        });

        res.json({
            success: true,
            message: `Custody of product ${productId} successfully transferred from ${userOrg} to ${targetOwner} on the blockchain.`,
            data: result,
        });
    } catch (error) {
        console.error(`[transferOwnership] Error transferring product ${req.params?.productId}:`, error.message);
        next(error);
    }
}

/**
 * Get product history (stub for O5).
 * GET /api/products/:productId/history
 */
async function getProductHistory(req, res, next) {
    try {
        const { productId } = req.params;

        const result = await fabricService.evaluateTransaction(
            'getProductHistory',
            productId
        );

        res.json({
            success: true,
            data: result || [],
        });
    } catch (error) {
        next(error);
    }
}

/**
 * Verify product authenticity cryptographically.
 * GET /api/products/:productId/verify
 */
async function verifyProduct(req, res, next) {
    try {
        const { productId } = req.params;
        const cleanId = (productId || '').trim();
        if (!cleanId) {
            return res.status(400).json({
                success: false,
                error: 'Product ID is required for verification.',
            });
        }

        let rawProduct;
        try {
            rawProduct = await fabricService.evaluateTransaction('getProduct', cleanId);
        } catch (evalErr) {
            return res.status(404).json({
                success: false,
                data: {
                    status: 'NOT_FOUND',
                    authentic: false,
                    productId: cleanId,
                    message: `Product "${cleanId}" does not exist on the ledger.`,
                },
            });
        }

        const product = typeof rawProduct === 'string' ? JSON.parse(rawProduct) : rawProduct;
        if (!product || !product.productId) {
            return res.status(404).json({
                success: false,
                data: {
                    status: 'NOT_FOUND',
                    authentic: false,
                    productId: cleanId,
                    message: `Product "${cleanId}" was not found in world state.`,
                },
            });
        }

        const verification = cryptoService.verifyProductAuthenticity(product);
        return res.json({
            success: true,
            data: verification,
        });
    } catch (error) {
        console.error('[verifyProduct] Verification error:', error.message);
        return res.status(500).json({
            success: false,
            error: 'Unable to complete product verification. Please try again.',
        });
    }
}

module.exports = {
    registerProduct,
    getProduct,
    getAllProducts,
    transferOwnership,
    getProductHistory,
    verifyProduct,
};
