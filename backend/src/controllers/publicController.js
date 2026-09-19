/*
 * Public Product Controller (Objective 5)
 * Handles unauthenticated read-only product verification and blockchain history.
 *
 * Security Principles:
 * - Read-only: evaluates transactions via Fabric gateway; NEVER submits writes.
 * - Consumer-safe cryptographic evidence only:
 *     Allowed: productHash, verification status, dataIntegrity, digitalSignature validity, manufacturerIdentity, signer MSP
 *     Do NOT expose: complete raw ECDSA signature hex, private keys, certificates with internal metadata, keystores, paths, secrets
 * - No authentication/JWT required.
 */

'use strict';

const fabricService = require('../services/fabricService');
const cryptoService = require('../services/cryptoService');

/**
 * Convert Fabric protobuf timestamp to standard ISO and formatted string.
 */
function formatFabricTimestamp(ts) {
    if (!ts) {
        const now = new Date();
        return { iso: now.toISOString(), formatted: now.toLocaleString() };
    }

    let sec = 0;
    if (typeof ts.seconds === 'object' && ts.seconds !== null) {
        sec = Number(ts.seconds.low !== undefined ? ts.seconds.low : (ts.seconds || 0));
    } else {
        sec = Number(ts.seconds || 0);
    }

    const nanos = Number(ts.nanos || 0);
    const ms = (sec * 1000) + Math.floor(nanos / 1000000);
    const d = new Date(isNaN(ms) || ms <= 0 ? Date.now() : ms);

    return {
        iso: d.toISOString(),
        formatted: d.toLocaleString('en-US', {
            dateStyle: 'medium',
            timeStyle: 'medium',
        }),
    };
}

/**
 * Public Product Cryptographic Verification
 * GET /api/public/products/:productId/verify
 */
async function verifyProductPublic(req, res, next) {
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
                    message: `Product "${cleanId}" does not exist on the blockchain ledger.`,
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

        // Execute cryptographic authenticity check using server-side keys
        const verification = cryptoService.verifyProductAuthenticity(product);

        // Construct consumer-safe public response (sanitized)
        const sanitized = {
            status: verification.status,
            authentic: !!verification.authentic,
            productId: cleanId,
            productName: product.productName || verification.productName || 'Unknown Product',
            category: product.category || 'General',
            batchNumber: product.batchNumber || 'N/A',
            manufacturer: product.manufacturer || verification.manufacturer || 'Unknown',
            currentOwner: product.currentOwner || 'Unknown',
            currentStatus: product.status || 'UNKNOWN',
            description: product.description || '',
            price: product.price || 0,
            createdAt: product.createdAt || null,
            updatedAt: product.updatedAt || null,
            productRecord: verification.productRecord || 'Verified',
            dataIntegrity: verification.dataIntegrity || (verification.authentic ? 'Verified' : 'Failed'),
            digitalSignature: verification.digitalSignature || (verification.authentic ? 'Valid' : 'Invalid'),
            manufacturerIdentity: verification.manufacturerIdentity || (verification.authentic ? 'Verified' : 'Unverified'),
            productHash: verification.productHash || verification.storedHash || product.productHash || null,
            signerMsp: verification.authentic ? 'Org1MSP' : null,
            message: verification.message,
            verifiedAt: new Date().toISOString(),
        };

        return res.json({
            success: true,
            data: sanitized,
        });
    } catch (error) {
        console.error('[verifyProductPublic] Error:', error.message);
        return res.status(500).json({
            success: false,
            error: 'Unable to complete public product verification. Please try again later.',
        });
    }
}

/**
 * Public Product Provenance History
 * GET /api/public/products/:productId/history
 */
async function getProductHistoryPublic(req, res, next) {
    try {
        const { productId } = req.params;
        const cleanId = (productId || '').trim();

        if (!cleanId) {
            return res.status(400).json({
                success: false,
                error: 'Product ID is required to query provenance history.',
            });
        }

        let rawHistory;
        try {
            rawHistory = await fabricService.evaluateTransaction('getProductHistory', cleanId);
        } catch (evalErr) {
            return res.status(404).json({
                success: false,
                error: `Product "${cleanId}" does not exist on the ledger or has no recorded history.`,
            });
        }

        let historyRecords = [];
        if (typeof rawHistory === 'string') {
            try {
                historyRecords = JSON.parse(rawHistory);
            } catch {
                historyRecords = [];
            }
        } else if (Array.isArray(rawHistory)) {
            historyRecords = rawHistory;
        }

        if (!Array.isArray(historyRecords) || historyRecords.length === 0) {
            return res.status(404).json({
                success: false,
                error: `No blockchain transaction history found for product "${cleanId}".`,
            });
        }

        // Helper to extract epoch ms for accurate chronological ordering
        const getFabricEpochMs = (ts) => {
            if (!ts) return 0;
            let sec = 0;
            if (typeof ts.seconds === 'object' && ts.seconds !== null) {
                sec = Number(ts.seconds.low !== undefined ? ts.seconds.low : (ts.seconds || 0));
            } else {
                sec = Number(ts.seconds || 0);
            }
            const nanos = Number(ts.nanos || 0);
            return (sec * 1000) + Math.floor(nanos / 1000000);
        };

        // Sort history records chronologically (oldest first: registration -> transit -> retailer -> consumer)
        historyRecords.sort((a, b) => getFabricEpochMs(a.timestamp) - getFabricEpochMs(b.timestamp));

        // Format history entries in chronological order with transitions
        const formattedHistory = historyRecords.map((record, index) => {
            const tsInfo = formatFabricTimestamp(record.timestamp);
            let val = record.value;
            if (typeof val === 'string') {
                try {
                    val = JSON.parse(val);
                } catch {
                    // keep as string
                }
            }

            let previousOwner = 'None';
            let previousStatus = 'None';
            let event = 'PRODUCT_REGISTERED';

            if (index > 0) {
                let prevVal = historyRecords[index - 1].value;
                if (typeof prevVal === 'string') {
                    try {
                        prevVal = JSON.parse(prevVal);
                    } catch {}
                }
                previousOwner = prevVal?.currentOwner || 'Unknown';
                previousStatus = prevVal?.status || 'UNKNOWN';

                if (val?.status === 'SOLD_TO_CONSUMER') {
                    event = 'SOLD_TO_CONSUMER';
                } else {
                    event = 'CUSTODY_TRANSFER';
                }
            }

            return {
                sequence: index + 1,
                txId: record.txId,
                timestamp: tsInfo.iso,
                formattedTime: tsInfo.formatted,
                event,
                isDelete: !!record.isDelete,
                previousOwner,
                currentOwner: val?.currentOwner || 'Unknown',
                previousStatus,
                status: val?.status || 'UNKNOWN',
                productHash: val?.productHash || null,
                snapshot: val ? {
                    productId: val.productId,
                    productName: val.productName,
                    batchNumber: val.batchNumber,
                    manufacturer: val.manufacturer,
                    currentOwner: val.currentOwner,
                    status: val.status,
                    productHash: val.productHash || null,
                    createdAt: val.createdAt || null,
                    updatedAt: val.updatedAt || null,
                } : null,
            };
        });

        return res.json({
            success: true,
            productId: cleanId,
            totalTransactions: formattedHistory.length,
            data: formattedHistory,
        });
    } catch (error) {
        console.error('[getProductHistoryPublic] Error:', error.message);
        return res.status(500).json({
            success: false,
            error: 'Unable to retrieve blockchain provenance history.',
        });
    }
}

module.exports = {
    verifyProductPublic,
    getProductHistoryPublic,
};
