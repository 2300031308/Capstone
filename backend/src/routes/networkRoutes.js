/*
 * Network Routes
 * Maps endpoints for network health and activity feed.
 */

'use strict';

const express = require('express');
const router = express.Router();
const networkController = require('../controllers/networkController');

router.get('/status', networkController.getNetworkStatus);
router.get('/activity', networkController.getNetworkActivity);

module.exports = router;
