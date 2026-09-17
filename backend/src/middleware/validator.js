/*
 * Input Validation Middleware
 */

'use strict';

const { body, validationResult } = require('express-validator');

const validateProduct = [
    body('productId')
        .trim()
        .notEmpty()
        .withMessage('Product ID is required')
        .isLength({ min: 1, max: 50 })
        .withMessage('Product ID must be between 1 and 50 characters'),
    body('productName')
        .trim()
        .notEmpty()
        .withMessage('Product Name is required')
        .isLength({ min: 1, max: 200 })
        .withMessage('Product Name must be between 1 and 200 characters'),
    body('batchNumber')
        .trim()
        .notEmpty()
        .withMessage('Batch Number is required'),
    body('manufacturer')
        .trim()
        .notEmpty()
        .withMessage('Manufacturer is required'),

    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                errors: errors.array().map(e => e.msg),
            });
        }
        next();
    },
];

module.exports = {
    validateProduct,
};
