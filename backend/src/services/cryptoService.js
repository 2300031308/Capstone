/*
 * Cryptographic Service
 * Provides deterministic canonical hashing (SHA-256),
 * ECDSA digital signature generation using Fabric Org1MSP private key,
 * and multi-layer authenticity verification against Fabric X.509 certificates.
 *
 * Security Guarantee:
 * - Private key is strictly loaded in-memory on backend and NEVER exposed to clients or ledger.
 * - Public key is derived strictly server-side from trusted MSP credentials.
 */

'use strict';

const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const fabricConfig = require('../config/fabric');

/**
 * Normalizes input string by trimming leading/trailing whitespace.
 */
function normalizeField(val) {
    if (val === null || val === undefined) return '';
    return String(val).trim();
}

/**
 * Produces deterministic canonical string from product properties.
 * Format: productId|productName|batchNumber|manufacturer
 */
function getCanonicalString(product) {
    if (!product || typeof product !== 'object') {
        throw new Error('Product object is required to generate canonical string');
    }

    const cleanId = normalizeField(product.productId);
    const cleanName = normalizeField(product.productName);
    const cleanBatch = normalizeField(product.batchNumber);
    const cleanMfr = normalizeField(product.manufacturer);

    return `${cleanId}|${cleanName}|${cleanBatch}|${cleanMfr}`;
}

/**
 * Computes SHA-256 hex digest of the canonical product string.
 */
function generateProductHash(product) {
    const canonical = typeof product === 'string' ? product : getCanonicalString(product);
    return crypto.createHash('sha256').update(canonical, 'utf8').digest('hex');
}

/**
 * Reads the first file from a directory.
 */
function readFirstFileSync(dirPath) {
    const files = fs.readdirSync(dirPath);
    if (files.length === 0) {
        throw new Error(`No credential files found in directory: ${dirPath}`);
    }
    return fs.readFileSync(path.join(dirPath, files[0]));
}

/**
 * Loads the Manufacturer's private key directly from the Fabric MSP keystore.
 * Memory-only; never exposed to API or external storage.
 */
function getManufacturerPrivateKey() {
    const keyPem = readFirstFileSync(fabricConfig.keyDirectoryPath);
    return crypto.createPrivateKey(keyPem);
}

/**
 * Loads the Manufacturer's X.509 public key from the Fabric MSP signcerts.
 */
function getManufacturerPublicKey() {
    const certPem = readFirstFileSync(fabricConfig.certDirectoryPath);
    return crypto.createPublicKey(certPem);
}

/**
 * Generates an ECDSA digital signature over canonical data using Manufacturer Fabric private key.
 * Algorithm: ecdsa-with-SHA256 (curve P-256)
 * Output: Standard DER signature in hex format.
 */
function signProduct(canonicalData) {
    if (!canonicalData || typeof canonicalData !== 'string') {
        throw new Error('Canonical product data string is required for signing');
    }

    const privateKey = getManufacturerPrivateKey();
    const signature = crypto.sign('sha256', Buffer.from(canonicalData, 'utf8'), privateKey);
    return signature.toString('hex');
}

/**
 * Cryptographically verifies product authenticity.
 * Checks:
 * 1. Existence of cryptographic fields (legacy check)
 * 2. Authorization of manufacturer identity
 * 3. Data integrity (recalculated SHA-256 == stored productHash)
 * 4. Digital signature validity (ECDSA verification against Org1MSP public cert)
 */
function verifyProductAuthenticity(product) {
    if (!product || typeof product !== 'object') {
        return {
            status: 'INVALID',
            authentic: false,
            message: 'Product record is empty or invalid.',
        };
    }

    const cleanId = normalizeField(product.productId);
    const cleanName = normalizeField(product.productName);
    const cleanBatch = normalizeField(product.batchNumber);
    const cleanMfr = normalizeField(product.manufacturer);
    const storedHash = normalizeField(product.productHash);
    const storedSig = normalizeField(product.digitalSignature);

    // 1. Legacy Check: Existing products without cryptographic fields
    if (!storedHash || !storedSig) {
        return {
            status: 'LEGACY',
            authentic: false,
            productId: cleanId,
            productName: cleanName,
            manufacturer: cleanMfr,
            currentOwner: product.currentOwner || cleanMfr,
            message: 'Cryptographic verification data not available for this legacy record.',
        };
    }

    // 2. Canonical String Reconstruction & Recalculation
    const canonical = `${cleanId}|${cleanName}|${cleanBatch}|${cleanMfr}`;
    const calculatedHash = crypto.createHash('sha256').update(canonical, 'utf8').digest('hex');

    // 3. Data Integrity Check (SHA-256)
    if (calculatedHash.toLowerCase() !== storedHash.toLowerCase()) {
        return {
            status: 'DATA_TAMPERED',
            authentic: false,
            productId: cleanId,
            productName: cleanName,
            manufacturer: cleanMfr,
            currentOwner: product.currentOwner || cleanMfr,
            productRecord: 'Verified',
            dataIntegrity: 'Failed',
            digitalSignature: 'Invalid',
            manufacturerIdentity: 'Unverified',
            message: 'Data integrity check failed: Recalculated SHA-256 digest does not match the ledger hash.',
            calculatedHash,
            storedHash,
        };
    }

    // 4. ECDSA Signature Verification using server-loaded Manufacturer Public Key
    try {
        const publicKey = getManufacturerPublicKey();
        const isValidSignature = crypto.verify(
            'sha256',
            Buffer.from(canonical, 'utf8'),
            publicKey,
            Buffer.from(storedSig, 'hex')
        );

        if (!isValidSignature) {
            return {
                status: 'SIGNATURE_INVALID',
                authentic: false,
                productId: cleanId,
                productName: cleanName,
                manufacturer: cleanMfr,
                currentOwner: product.currentOwner || cleanMfr,
                productRecord: 'Verified',
                dataIntegrity: 'Verified',
                digitalSignature: 'Invalid',
                manufacturerIdentity: 'Unverified',
                message: 'Digital signature verification failed: signature does not match manufacturer identity.',
                calculatedHash,
                storedHash,
            };
        }

        // 5. All criteria passed -> Authentic Product
        return {
            status: 'AUTHENTIC',
            authentic: true,
            productId: cleanId,
            productName: cleanName,
            batchNumber: cleanBatch,
            manufacturer: cleanMfr,
            currentOwner: product.currentOwner || cleanMfr,
            productRecord: 'Verified',
            dataIntegrity: 'Verified',
            digitalSignature: 'Valid',
            manufacturerIdentity: 'Verified',
            productHash: storedHash,
            signatureValue: storedSig,
            signerMsp: fabricConfig.mspId,
            message: 'Product authenticity cryptographically verified.',
        };
    } catch (err) {
        console.error('[verifyProductAuthenticity] Cryptographic verification error:', err.message);
        return {
            status: 'VERIFICATION_ERROR',
            authentic: false,
            productId: cleanId,
            productName: cleanName,
            message: 'Cryptographic verification process encountered an internal error.',
        };
    }
}

module.exports = {
    normalizeField,
    getCanonicalString,
    generateProductHash,
    signProduct,
    verifyProductAuthenticity,
    getManufacturerPublicKey,
};
