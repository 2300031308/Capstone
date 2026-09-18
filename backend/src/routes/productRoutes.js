/*
 * Product Routes
 * Maps HTTP endpoints to product controller functions with RBAC authorization.
 */

'use strict';

const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const { validateProduct } = require('../middleware/validator');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

// Product registration: Only Manufacturer can register new products (O1/O2)
router.post(
    '/',
    authenticateToken,
    authorizeRoles('manufacturer'),
    validateProduct,
    productController.registerProduct
);

// Product queries: All authenticated participants can view products
router.get('/', authenticateToken, productController.getAllProducts);
router.get('/:productId', authenticateToken, productController.getProduct);

// Ownership transfer: Authorized for supply chain custodians (O4)
router.post(
    '/:productId/transfer',
    authenticateToken,
    authorizeRoles('manufacturer', 'distributor', 'retailer'),
    productController.transferOwnership
);

// Product provenance history: Accessible to all participants (O5)
router.get('/:productId/history', authenticateToken, productController.getProductHistory);

module.exports = router;
