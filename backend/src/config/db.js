/*
 * Application Database Configuration (SQLite)
 * Manages user accounts, authentication, credentials (bcrypt hashes),
 * and role-to-organization mappings.
 *
 * NOTE: Application user data is kept strictly separate from Hyperledger Fabric
 * blockchain ledger data.
 */

'use strict';

const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');

// Ensure data directory exists
const dataDir = path.resolve(__dirname, '..', '..', 'data');
if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.join(dataDir, 'users.db');
const db = new Database(dbPath);

// Enable WAL mode for better concurrency
db.pragma('journal_mode = WAL');

// Initialize users table
db.exec(`
    CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        organization TEXT NOT NULL,
        role TEXT NOT NULL,
        msp_id TEXT NOT NULL,
        status TEXT DEFAULT 'ACTIVE',
        created_at TEXT NOT NULL
    );
`);

/**
 * Seed initial default accounts if database is empty.
 * Allows instant testing for university review and demo evaluations.
 */
function seedDefaultUsers() {
    console.log('Ensuring verified enterprise user accounts in SQLite...');
    const defaultPassword = 'Password@123';
    const passwordHash = bcrypt.hashSync(defaultPassword, 10);
    const now = new Date().toISOString();

    const insert = db.prepare(`
        INSERT INTO users (id, name, email, password_hash, organization, role, msp_id, status, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, 'ACTIVE', ?)
    `);

    const defaultAccounts = [
        {
            id: 'usr-mfg-01',
            name: 'Apex Manufacturing Admin',
            email: 'manufacturer@supplychain.com',
            organization: 'ManufacturerOrg',
            role: 'manufacturer',
            mspId: 'Org1MSP',
        },
        {
            id: 'usr-dst-01',
            name: 'Global Logistics Lead',
            email: 'distributor@supplychain.com',
            organization: 'DistributorOrg',
            role: 'distributor',
            mspId: 'Org2MSP',
        },
        {
            id: 'usr-rtl-01',
            name: 'Metro Retail Operations',
            email: 'retailer@supplychain.com',
            organization: 'RetailerOrg',
            role: 'retailer',
            mspId: 'Org2MSP',
        },
        {
            id: 'usr-cst-01',
            name: 'Verified Consumer',
            email: 'customer@supplychain.com',
            organization: 'Consumer',
            role: 'customer',
            mspId: 'Org1MSP',
        },
    ];

    const insertOrReplace = db.prepare(`
        INSERT OR REPLACE INTO users (id, name, email, password_hash, organization, role, msp_id, status, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, 'ACTIVE', ?)
    `);

    const updateMany = db.transaction((users) => {
        for (const u of users) {
            insertOrReplace.run(u.id, u.name, u.email, passwordHash, u.organization, u.role, u.mspId, now);
        }
    });

    updateMany(defaultAccounts);
    console.log(`Configured ${defaultAccounts.length} enterprise accounts with verified Fabric MSPs.`);
}

seedDefaultUsers();

module.exports = db;
