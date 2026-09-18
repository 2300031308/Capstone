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
        const { productId, productName, batchNumber, manufacturer } = req.body;

        const result = await fabricService.submitTransaction(
            'registerProduct',
            productId,
            productName,
            batchNumber,
            manufacturer
        );

        // Record confirmed blockchain transaction in real-time activity stream
        logTransactionActivity({
            type: 'REGISTER_PRODUCT',
            productId,
            productName,
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
 * Transfer product ownership (stub for O4).
 * POST /api/products/:productId/transfer
 */
async function transferOwnership(req, res, next) {
    try {
        const { productId } = req.params;
        const { newOwner, newStatus } = req.body;

        const result = await fabricService.submitTransaction(
            'transferOwnership',
            productId,
            newOwner,
            newStatus || 'TRANSFERRED'
        );

        res.json({
            success: true,
            message: 'Ownership transferred successfully',
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
