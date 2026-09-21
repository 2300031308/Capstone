/*
 * Public Product Routes (Objective 5)
 * Unauthenticated read-only endpoints for consumers, evaluators, and QR code scanners.
 *
 * Security:
 * - NO JWT required (open public read access)
 * - Read-only (evaluateTransaction only)
 * - Sanitized cryptographic output (no private keys or raw signatures)
 */

'use strict';

const express = require('express');
const router = express.Router();
const publicController = require('../controllers/publicController');

// Public Product Verification
router.get('/products/:productId/verify', publicController.verifyProductPublic);

// Public Blockchain Provenance History
router.get('/products/:productId/history', publicController.getProductHistoryPublic);

// Public Product Tracking & Journey
router.get('/products/:productId/tracking', publicController.getProductTrackingPublic);

module.exports = router;
