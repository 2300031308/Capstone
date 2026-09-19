/*
 * Controlled Development Test for Product Authenticity Verification
 * Tests:
 * 1. Canonical String Determinism
 * 2. SHA-256 Hashing
 * 3. ECDSA Digital Signature generation with Fabric Org1MSP private key
 * 4. Positive verification: Authentic product
 * 5. Negative verification: Tampered product name (data integrity failure)
 * 6. Negative verification: Tampered signature bytes (signature failure)
 * 7. Legacy product handling: Missing cryptographic fields
 */

'use strict';

const cryptoService = require('../src/services/cryptoService');

console.log('==========================================================');
console.log('  AUTHENTICITY CRYPTOGRAPHIC VERIFICATION TEST SUITE     ');
console.log('==========================================================\n');

let passed = 0;
let failed = 0;

function assert(condition, message) {
    if (condition) {
        console.log('  [PASS]', message);
        passed++;
    } else {
        console.error('  [FAIL]', message);
        failed++;
    }
}

// 1. Canonical String Test
const sampleProduct = {
    productId: 'TC1001',
    productName: 'Smart Sensor',
    batchNumber: 'B101',
    manufacturer: 'ManufacturerOrg',
};

const canonical = cryptoService.getCanonicalString(sampleProduct);
assert(canonical === 'TC1001|Smart Sensor|B101|ManufacturerOrg', 'Canonical format is deterministic');

// 2. SHA-256 Hash Test
const hash = cryptoService.generateProductHash(sampleProduct);
assert(typeof hash === 'string' && hash.length === 64, 'SHA-256 digest is 64 hex characters');
console.log('         SHA-256 Hash:', hash);

// 3. ECDSA Signing Test
const signature = cryptoService.signProduct(canonical);
assert(typeof signature === 'string' && signature.length > 100, 'ECDSA DER signature generated successfully');
console.log('         ECDSA Signature (truncated):', signature.substring(0, 36) + '...');

// 4. Verification Test: Authentic Product
const authenticRecord = {
    ...sampleProduct,
    currentOwner: 'ManufacturerOrg',
    productHash: hash,
    digitalSignature: signature,
};

const authResult = cryptoService.verifyProductAuthenticity(authenticRecord);
assert(authResult.status === 'AUTHENTIC', 'Authentic product status is AUTHENTIC');
assert(authResult.authentic === true, 'Authentic flag is true');
assert(authResult.dataIntegrity === 'Verified', 'Data integrity verified');
assert(authResult.digitalSignature === 'Valid', 'Digital signature valid');

// 5. Verification Test: Tampered Data (1 character changed in product name)
const tamperedRecord = {
    ...authenticRecord,
    productName: 'Tampered Sensor',
};

const tamperResult = cryptoService.verifyProductAuthenticity(tamperedRecord);
assert(tamperResult.status === 'DATA_TAMPERED', 'Tampered data detected as DATA_TAMPERED');
assert(tamperResult.authentic === false, 'Tampered product authenticity is false');
assert(tamperResult.dataIntegrity === 'Failed', 'Tampered data integrity failed');

// 6. Verification Test: Invalid Signature (signature byte altered)
const invalidSigRecord = {
    ...authenticRecord,
    digitalSignature: signature.substring(0, 20) + 'ff' + signature.substring(22),
};

const sigResult = cryptoService.verifyProductAuthenticity(invalidSigRecord);
assert(sigResult.status === 'SIGNATURE_INVALID', 'Altered signature detected as SIGNATURE_INVALID');
assert(sigResult.authentic === false, 'Invalid signature authenticity is false');
assert(sigResult.digitalSignature === 'Invalid', 'Signature validity is Invalid');

// 7. Legacy Product Test (Missing hash and signature, e.g. P000)
const legacyRecord = {
    productId: 'P000',
    productName: 'Sample Product',
    batchNumber: 'B000',
    manufacturer: 'ManufacturerOrg',
    currentOwner: 'ManufacturerOrg',
};

const legacyResult = cryptoService.verifyProductAuthenticity(legacyRecord);
assert(legacyResult.status === 'LEGACY', 'Legacy product returns status LEGACY');
assert(legacyResult.authentic === false, 'Legacy product is not falsely marked authentic');
assert(legacyResult.message.includes('legacy record'), 'Legacy product returns clear informative message');

console.log('\n==========================================================');
console.log(`  RESULTS: ${passed} passed, ${failed} failed`);
console.log('==========================================================\n');

if (failed > 0) process.exit(1);
