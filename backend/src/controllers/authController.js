/*
 * Authentication Controller
 * Handles user registration, credential verification, bcrypt password hashing,
 * and JWT token issuance.
 */

'use strict';

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const db = require('../config/db');
const { JWT_SECRET } = require('../middleware/auth');

// Map application roles to Fabric MSP organizations
const ROLE_MSP_MAP = {
    manufacturer: { mspId: 'Org1MSP', defaultOrg: 'ManufacturerOrg' },
    distributor: { mspId: 'Org2MSP', defaultOrg: 'DistributorOrg' },
    retailer: { mspId: 'RetailerMSP', defaultOrg: 'RetailerOrg' },
    customer: { mspId: 'ClientMSP', defaultOrg: 'ConsumerOrg' },
};

/**
 * Register a new user account.
 * POST /api/auth/register
 */
async function register(req, res, next) {
    try {
        const { name, email, password, confirmPassword, organization, role } = req.body;

        // 1. Validation
        if (!name || !email || !password || !role) {
            return res.status(400).json({
                success: false,
                error: 'Required fields missing: name, email, password, and role are mandatory.',
            });
        }

        const normalizedEmail = email.trim().toLowerCase();
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(normalizedEmail)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid email address format.',
            });
        }

        if (password.length < 6) {
            return res.status(400).json({
                success: false,
                error: 'Password must be at least 6 characters long.',
            });
        }

        if (confirmPassword !== undefined && password !== confirmPassword) {
            return res.status(400).json({
                success: false,
                error: 'Passwords do not match. Please verify confirmation password.',
            });
        }

        const normalizedRole = role.trim().toLowerCase();
        if (!ROLE_MSP_MAP[normalizedRole]) {
            return res.status(400).json({
                success: false,
                error: `Invalid role "${role}". Allowed roles: manufacturer, distributor, retailer, customer.`,
            });
        }

        // 2. Check for duplicate email
        const existingUser = db.prepare('SELECT id FROM users WHERE email = ?').get(normalizedEmail);
        if (existingUser) {
            return res.status(409).json({
                success: false,
                error: `An account with email "${normalizedEmail}" already exists. Please sign in instead.`,
            });
        }

        // 3. Hash password securely
        const passwordHash = await bcrypt.hash(password, 10);
        const mspConfig = ROLE_MSP_MAP[normalizedRole];
        const assignedOrg = organization?.trim() || mspConfig.defaultOrg;
        const userId = `usr-${crypto.randomBytes(4).toString('hex')}`;
        const now = new Date().toISOString();

        // 4. Save to SQLite database
        const insertStmt = db.prepare(`
            INSERT INTO users (id, name, email, password_hash, organization, role, msp_id, status, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, 'ACTIVE', ?)
        `);

        insertStmt.run(
            userId,
            name.trim(),
            normalizedEmail,
            passwordHash,
            assignedOrg,
            normalizedRole,
            mspConfig.mspId,
            now
        );

        res.status(201).json({
            success: true,
            message: 'User account registered successfully. You may now log in.',
            data: {
                user: {
                    id: userId,
                    name: name.trim(),
                    email: normalizedEmail,
                    role: normalizedRole,
                    organization: assignedOrg,
                    mspId: mspConfig.mspId,
                },
            },
        });
    } catch (error) {
        next(error);
    }
}

/**
 * Log in to an existing account.
 * POST /api/auth/login
 */
async function login(req, res, next) {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                error: 'Email and password are required.',
            });
        }

        const normalizedEmail = email.trim().toLowerCase();

        // 1. Fetch user from database
        const user = db.prepare('SELECT * FROM users WHERE email = ?').get(normalizedEmail);
        if (!user) {
            return res.status(401).json({
                success: false,
                error: 'Invalid credentials. User not found with this email.',
            });
        }

        if (user.status !== 'ACTIVE') {
            return res.status(403).json({
                success: false,
                error: 'Account is deactivated. Please contact network administrator.',
            });
        }

        // 2. Verify password hash
        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) {
            return res.status(401).json({
                success: false,
                error: 'Invalid credentials. Password does not match.',
            });
        }

        // 3. Generate signed JWT token
        const tokenPayload = {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            organization: user.organization,
            mspId: user.msp_id,
        };

        const token = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: '24h' });

        res.json({
            success: true,
            message: 'Authentication successful.',
            token,
            user: tokenPayload,
            data: {
                user: tokenPayload,
            },
        });
    } catch (error) {
        next(error);
    }
}

/**
 * Get current authenticated user profile.
 * GET /api/auth/me
 */
async function getMe(req, res) {
    res.json({
        success: true,
        data: {
            user: req.user,
        },
    });
}

module.exports = {
    register,
    login,
    getMe,
};
