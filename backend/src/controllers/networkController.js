/*
 * Network Controller
 * Provides real-time Hyperledger Fabric network health,
 * peer connectivity status, and transaction activity feed.
 */

'use strict';

const fabricService = require('../services/fabricService');
const fabricConfig = require('../config/fabric');

// In-memory activity log for blockchain transactions committed during runtime
const transactionActivities = [];

/**
 * Record a blockchain activity event.
 */
function logTransactionActivity(activity) {
    transactionActivities.unshift({
        id: `tx-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        timestamp: new Date().toISOString(),
        ...activity,
    });
    // Keep last 50 activities in memory
    if (transactionActivities.length > 50) {
        transactionActivities.pop();
    }
}

/**
 * Get live Fabric network status.
 * Evaluates connection to peers and returns current ledger state summary.
 * GET /api/network/status
 */
async function getNetworkStatus(req, res) {
    try {
        const startTime = Date.now();
        // Ping the ledger by fetching product records
        const products = await fabricService.evaluateTransaction('getAllProducts');
        const latency = Date.now() - startTime;

        res.json({
            success: true,
            data: {
                status: 'ONLINE',
                connected: true,
                latencyMs: latency,
                channel: fabricConfig.channelName,
                chaincode: fabricConfig.chaincodeName,
                mspId: fabricConfig.mspId,
                peerEndpoint: fabricConfig.peerEndpoint,
                peerHostAlias: fabricConfig.peerHostAlias,
                stateDatabase: 'CouchDB',
                productCount: Array.isArray(products) ? products.length : 0,
                lastSynchronized: new Date().toISOString(),
            },
        });
    } catch (error) {
        console.error('Fabric network health check failed:', error.message);
        res.json({
            success: false,
            data: {
                status: 'OFFLINE',
                connected: false,
                channel: fabricConfig.channelName,
                chaincode: fabricConfig.chaincodeName,
                peerEndpoint: fabricConfig.peerEndpoint,
                error: 'Unable to reach Hyperledger Fabric peer or channel',
                lastSynchronized: new Date().toISOString(),
            },
        });
    }
}

/**
 * Get real blockchain activity log.
 * Combines in-memory committed transactions with existing world-state records.
 * GET /api/network/activity
 */
async function getNetworkActivity(req, res, next) {
    try {
        // Retrieve products from world state to ensure initial seed/recorded items are present
        const products = await fabricService.evaluateTransaction('getAllProducts');
        const productList = Array.isArray(products) ? products : [];

        // Build activities from products if in-memory list is empty or smaller
        const existingProductIds = new Set(transactionActivities.map(a => a.productId));

        for (const prod of productList) {
            if (!existingProductIds.has(prod.productId)) {
                transactionActivities.push({
                    id: `tx-init-${prod.productId}`,
                    type: 'REGISTER_PRODUCT',
                    productId: prod.productId,
                    productName: prod.productName,
                    actor: prod.manufacturer || 'ManufacturerOrg',
                    currentOwner: prod.currentOwner || prod.manufacturer,
                    status: 'COMMITTED',
                    timestamp: prod.createdAt || new Date().toISOString(),
                    isGenesis: prod.productId === 'P000',
                });
                existingProductIds.add(prod.productId);
            }
        }

        // Sort chronologically newest first
        transactionActivities.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

        res.json({
            success: true,
            data: transactionActivities.slice(0, 20),
        });
    } catch (error) {
        next(error);
    }
}

module.exports = {
    getNetworkStatus,
    getNetworkActivity,
    logTransactionActivity,
};
