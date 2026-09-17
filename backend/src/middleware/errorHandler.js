/*
 * Centralized Error Handler Middleware
 */

'use strict';

function errorHandler(err, req, res, _next) {
    console.error('Error:', err.message);

    let message = err.message || 'Internal server error';
    let statusCode = 500;

    if (message.includes('does not exist')) {
        statusCode = 404;
    } else if (message.includes('already exists')) {
        statusCode = 409;
    } else if (message.includes('required') || message.includes('invalid')) {
        statusCode = 400;
    }

    // Extract actual error from Fabric gateway error wrapping
    const fabricErrorMatch = message.match(/message=(.+?)(?:,|$)/);
    if (fabricErrorMatch) {
        message = fabricErrorMatch[1];
    }

    res.status(statusCode).json({
        success: false,
        error: message,
    });
}

module.exports = errorHandler;
