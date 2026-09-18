/*
 * Product Controller
 * Handles HTTP requests for product operations.
 */

'use strict';

const fabricService = require('../services/fabricService');
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
            const exists = typeof existsResult === 'string' ? existsResult.toLowerCase() === 'true' : Boolean(existsResult);
            if (exists) {
                return res.status(409).json({
                    success: false,
                    error: `Product ID "${cleanId}" is already registered on the ledger. Product IDs must be globally unique.`,
                });
            }
        } catch (evalErr) {
            // Non-fatal: if evaluation fails (e.g. gateway timeout), log warning and allow submitTransaction to attempt
            console.warn(`[productExists] Pre-check evaluation warning for "${cleanId}":`, evalErr.message);
        }

        // 3. Server-side derivation: manufacturer identity is derived from authenticated user's organization
        const manufacturer = req.user?.organization || 'ManufacturerOrg';

        const result = await fabricService.submitTransaction(
            'registerProduct',
            cleanId,
            cleanName,
            cleanBatch,
            manufacturer
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
        next(error);
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
        const { newOwner, newStatus } = req.body;

        // 1. Fetch current product from Hyperledger Fabric ledger
        const rawProduct = await fabricService.evaluateTransaction('getProduct', productId);
        const currentProduct = typeof rawProduct === 'string' ? JSON.parse(rawProduct) : rawProduct;

        if (!currentProduct) {
            return res.status(404).json({
                success: false,
                error: `Product ${productId} not found in blockchain world state.`,
            });
        }

        // 2. Ownership-based access control: Verify authenticated user's organization matches currentOwner
        const userOrg = req.user?.organization;
        const userRole = (req.user?.role || '').toLowerCase();

        if (currentProduct.currentOwner !== userOrg) {
            return res.status(403).json({
                success: false,
                error: `Ownership Check Failed: Product ${productId} is currently owned by "${currentProduct.currentOwner}". Your authenticated organization is "${userOrg}". Only the current verified custodian can transfer custody.`,
            });
        }

        // 3. Validate valid next ownership state along the supply chain lifecycle
        let targetOwner = newOwner;
        let targetStatus = newStatus;

        if (userRole === 'manufacturer') {
            targetOwner = newOwner || 'DistributorOrg';
            targetStatus = newStatus || 'IN_TRANSIT_TO_DISTRIBUTOR';
        } else if (userRole === 'distributor') {
            targetOwner = newOwner || 'RetailerOrg';
            targetStatus = newStatus || 'DELIVERED_TO_RETAILER';
        } else if (userRole === 'retailer') {
            targetOwner = newOwner || 'Consumer';
            targetStatus = newStatus || 'SOLD_TO_CONSUMER';
        } else {
            return res.status(403).json({
                success: false,
                error: `Role "${userRole}" is not authorized to initiate supply chain custody transfers.`,
            });
        }

        // 4. Commit ownership transfer transaction to Fabric ledger
        const result = await fabricService.submitTransaction(
            'transferOwnership',
            productId,
            targetOwner,
            targetStatus
        );

        // 5. Log confirmed transaction in real-time activity stream
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

module.exports = {
    registerProduct,
    getProduct,
    getAllProducts,
    transferOwnership,
    getProductHistory,
};
