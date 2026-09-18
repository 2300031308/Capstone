/*
 * Authentication & Role Authorization Middleware
 * Verifies JWT access tokens and enforces role-based access control (RBAC).
 */

'use strict';

const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'supplychain-provenance-jwt-secret-key-2026';

/**
 * Middleware: Verifies JWT token from Authorization header.
 */
function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Extract Bearer <token>

    if (!token) {
        return res.status(401).json({
            success: false,
            error: 'Authentication required. No Bearer token provided in Authorization header.',
        });
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({
                success: false,
                error: 'Invalid or expired authentication token. Please log in again.',
            });
        }

        req.user = user;
        next();
    });
}

/**
 * Middleware Factory: Enforces role-based authorization.
 * @param  {...string} allowedRoles Roles permitted to access the endpoint (e.g. 'manufacturer')
 */
function authorizeRoles(...allowedRoles) {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                error: 'Authentication required before checking permissions.',
            });
        }

        const userRole = (req.user.role || '').toLowerCase();
        const normalizedAllowed = allowedRoles.map(r => r.toLowerCase());

        if (!normalizedAllowed.includes(userRole)) {
            return res.status(403).json({
                success: false,
                error: `Access Denied: Role "${req.user.role}" is not authorized to execute this operation. Authorized roles: [${allowedRoles.join(', ')}]`,
            });
        }

        next();
    };
}

module.exports = {
    authenticateToken,
    authorizeRoles,
    JWT_SECRET,
};
