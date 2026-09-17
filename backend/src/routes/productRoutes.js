/*
 * Product Routes
 * Maps HTTP endpoints to product controller functions.
 */

'use strict';

const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const { validateProduct } = require('../middleware/validator');

// Product CRUD
router.post('/', validateProduct, productController.registerProduct);
router.get('/', productController.getAllProducts);
router.get('/:productId', productController.getProduct);

// Ownership transfer (O4)
router.post('/:productId/transfer', productController.transferOwnership);

// Product history (O5)
router.get('/:productId/history', productController.getProductHistory);

module.exports = router;
