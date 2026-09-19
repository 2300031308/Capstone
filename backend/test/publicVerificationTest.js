/*
 * Objective 5: Public Product Verification, Provenance History & Security Boundary Test
 * Tests unauthenticated public verification and history against live Hyperledger Fabric.
 *
 * Verifies:
 * 1. Public unauthenticated verification returns HTTP 200 & AUTHENTIC status for genuine goods.
 * 2. Public unauthenticated history returns HTTP 200 & parsed chronological audit trail.
 * 3. Cryptographic data sanitization: NO raw signature hex, NO private keys, NO paths, NO secrets.
 * 4. Non-existent product handling returns HTTP 404 and NOT_FOUND.
 * 5. Legacy product handling returns HTTP 200 and LEGACY status.
 * 6. Enterprise routes (/api/products/...) remain strictly protected by 401 Unauthorized.
 * 7. Customer RBAC restriction: Customer cannot execute custody transfers (HTTP 403).
 */

'use strict';

const http = require('http');
const app = require('../src/app');

const TEST_PORT = 5006;
let server;
let passed = 0;
let failed = 0;

function assert(condition, message) {
    if (condition) {
        console.log(`  ✓ PASS: ${message}`);
        passed++;
    } else {
        console.error(`  ✗ FAIL: ${message}`);
        failed++;
    }
}

function request(options, data = null) {
    return new Promise((resolve, reject) => {
        const reqOptions = {
            ...options,
            port: TEST_PORT,
        };
        const req = http.request(reqOptions, (res) => {
            let body = '';
            res.on('data', (chunk) => body += chunk);
            res.on('end', () => {
                try {
                    const parsed = body ? JSON.parse(body) : null;
                    resolve({ status: res.statusCode, data: parsed, raw: body });
                } catch {
                    resolve({ status: res.statusCode, raw: body });
                }
            });
        });
        req.on('error', reject);
        if (data) {
            req.write(JSON.stringify(data));
        }
        req.end();
    });
}

// Helper to login and get token
async function login(email, password = 'Password@123') {
    const res = await request({
        hostname: 'localhost',
        path: '/api/auth/login',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
    }, { email, password });

    if (res.status !== 200 || !res.data?.token) {
        throw new Error(`Login failed for ${email}: ${JSON.stringify(res.data)}`);
    }
    return res.data.token;
}

async function runPublicVerificationTests() {
    console.log('\n================================================================');
    console.log('  STARTING OBJECTIVE 5 PUBLIC VERIFICATION & AUDIT TRAIL TESTS');
    console.log('================================================================\n');

    try {
        server = app.listen(TEST_PORT);
        await new Promise((resolve) => setTimeout(resolve, 500));

        // 1. Public Unauthenticated Verification of Authentic Product (TC2545)
        console.log('--- 1. Public Unauthenticated Verification (TC2545) ---');
        const pubVerifyRes = await request({
            hostname: 'localhost',
            path: '/api/public/products/TC2545/verify',
            method: 'GET',
            // No Authorization header sent!
        });

        assert(pubVerifyRes.status === 200, 'Public verify returns HTTP 200 without JWT');
        assert(pubVerifyRes.data?.success === true, 'Response success flag is true');
        assert(pubVerifyRes.data?.data?.authentic === true, 'Product authentic flag is true');
        assert(pubVerifyRes.data?.data?.status === 'AUTHENTIC', 'Product status is AUTHENTIC');
        assert(pubVerifyRes.data?.data?.dataIntegrity === 'Verified', 'Data integrity is Verified (SHA-256 matches)');
        assert(pubVerifyRes.data?.data?.digitalSignature === 'Valid', 'Digital signature is Valid (ECDSA verified)');
        assert(pubVerifyRes.data?.data?.manufacturerIdentity === 'Verified', 'Manufacturer identity is Verified');
        assert(pubVerifyRes.data?.data?.signerMsp === 'Org1MSP', 'Signer MSP is Org1MSP');
        assert(typeof pubVerifyRes.data?.data?.productHash === 'string' && pubVerifyRes.data.data.productHash.length === 64, 'SHA-256 productHash is present (64 hex characters)');

        // 2. Public Cryptographic Sanitization Verification (Correction 2)
        console.log('\n--- 2. Public Cryptographic Evidence Sanitization (No Sensitive Data) ---');
        const pubData = pubVerifyRes.data?.data || {};
        assert(pubData.signatureValue === undefined, 'Raw full ECDSA signature is NOT exposed in public response');
        assert(pubData.privateKey === undefined, 'Private key is NOT exposed');
        assert(pubData.certificate === undefined, 'Raw certificate material is NOT exposed');
        assert(pubData.keystore === undefined, 'Keystore metadata is NOT exposed');
        assert(pubData.password === undefined && pubData.token === undefined, 'No secrets, passwords, or tokens in response');

        // 3. Public Unauthenticated Provenance History (SENS-101)
        console.log('\n--- 3. Public Blockchain Provenance History (SENS-101) ---');
        const pubHistoryRes = await request({
            hostname: 'localhost',
            path: '/api/public/products/SENS-101/history',
            method: 'GET',
            // No Authorization header sent!
        });

        assert(pubHistoryRes.status === 200, 'Public history returns HTTP 200 without JWT');
        assert(pubHistoryRes.data?.success === true, 'History query success is true');
        assert(Array.isArray(pubHistoryRes.data?.data), 'History data is an array of transaction snapshots');
        assert(pubHistoryRes.data?.data?.length >= 2, `Product has ${pubHistoryRes.data?.data?.length} historical events (>= 2 recorded on Fabric)`);

        const firstEvent = pubHistoryRes.data?.data[0];
        assert(firstEvent.sequence === 1, 'First event sequence is 1');
        assert(firstEvent.event === 'PRODUCT_REGISTERED', 'First event type is PRODUCT_REGISTERED');
        assert(firstEvent.status === 'REGISTERED', 'First event status is REGISTERED');
        assert(typeof firstEvent.txId === 'string' && firstEvent.txId.length > 10, 'Fabric transaction ID is present');
        assert(typeof firstEvent.timestamp === 'string' && firstEvent.timestamp.includes('T'), 'ISO timestamp is properly formatted');
        assert(typeof firstEvent.formattedTime === 'string', 'Formatted local time string is present');

        const secondEvent = pubHistoryRes.data?.data[1];
        assert(secondEvent.sequence === 2, 'Second event sequence is 2');
        assert(secondEvent.previousOwner === 'ManufacturerOrg', 'Custody handover previousOwner is ManufacturerOrg');
        assert(secondEvent.currentOwner === 'DistributorOrg', 'Custody handover currentOwner is DistributorOrg');
        assert(secondEvent.previousStatus === 'REGISTERED', 'Status transition previousStatus is REGISTERED');
        assert(secondEvent.status === 'IN_TRANSIT_TO_DISTRIBUTOR', 'Status transition status is IN_TRANSIT_TO_DISTRIBUTOR');

        // 3b. Public Provenance History Security Audit: Leakage & Sanitization Verification
        console.log('\n--- 3b. Public History Security Audit: Leakage & Sanitization Verification ---');
        const historyRaw = pubHistoryRes.raw || JSON.stringify(pubHistoryRes.data);

        // Entire response body string scan
        assert(!historyRaw.includes('"digitalSignature"'), 'Public history response does NOT contain digitalSignature field');
        assert(!historyRaw.includes('"signatureValue"'), 'Public history response does NOT contain signatureValue field');
        assert(!historyRaw.includes('"privateKey"'), 'Public history response does NOT contain privateKey field');
        assert(!historyRaw.includes('"certificate"'), 'Public history response does NOT contain certificate field');
        assert(!historyRaw.includes('BEGIN CERTIFICATE'), 'Public history response does NOT contain raw certificates');
        assert(!historyRaw.includes('BEGIN PRIVATE KEY'), 'Public history response does NOT contain raw private keys');
        assert(!historyRaw.includes('keystore'), 'Public history response does NOT contain keystore metadata');
        assert(!historyRaw.includes('password'), 'Public history response does NOT contain passwords');
        assert(!historyRaw.includes('Bearer eyJ'), 'Public history response does NOT contain JWTs or tokens');
        assert(!historyRaw.includes('/Users/'), 'Public history response does NOT leak server filesystem paths');
        assert(!historyRaw.includes('organizations/peerOrganizations'), 'Public history response does NOT leak Fabric credential paths');

        // Snapshot object level field verification
        for (const evt of pubHistoryRes.data?.data || []) {
            assert(evt.digitalSignature === undefined, `Event #${evt.sequence} has no digitalSignature`);
            assert(evt.signatureValue === undefined, `Event #${evt.sequence} has no signatureValue`);
            if (evt.snapshot) {
                assert(evt.snapshot.digitalSignature === undefined, `Snapshot #${evt.sequence} has no digitalSignature`);
                assert(evt.snapshot.signatureValue === undefined, `Snapshot #${evt.sequence} has no signatureValue`);
                assert(evt.snapshot.privateKey === undefined, `Snapshot #${evt.sequence} has no privateKey`);
                assert(evt.snapshot.certificate === undefined, `Snapshot #${evt.sequence} has no certificate`);
                assert(evt.snapshot.keystore === undefined, `Snapshot #${evt.sequence} has no keystore`);
                assert(evt.snapshot.password === undefined, `Snapshot #${evt.sequence} has no password`);
                assert(typeof evt.snapshot.productId === 'string', `Snapshot #${evt.sequence} retains consumer-safe productId`);
                assert(typeof evt.snapshot.productName === 'string', `Snapshot #${evt.sequence} retains consumer-safe productName`);
                assert(typeof evt.snapshot.batchNumber === 'string', `Snapshot #${evt.sequence} retains consumer-safe batchNumber`);
                assert(typeof evt.snapshot.manufacturer === 'string', `Snapshot #${evt.sequence} retains consumer-safe manufacturer`);
                assert(typeof evt.snapshot.currentOwner === 'string', `Snapshot #${evt.sequence} retains consumer-safe currentOwner`);
                assert(typeof evt.snapshot.status === 'string', `Snapshot #${evt.sequence} retains consumer-safe status`);
            }
        }

        // 4. Non-Existent Product Public Verification (HTTP 404)
        console.log('\n--- 4. Non-Existent Product Verification (404) ---');
        const notFoundVerify = await request({
            hostname: 'localhost',
            path: '/api/public/products/FAKE-PROD-99999/verify',
            method: 'GET',
        });
        assert(notFoundVerify.status === 404, 'Non-existent product returns HTTP 404');
        assert(notFoundVerify.data?.data?.status === 'NOT_FOUND', 'Response status is NOT_FOUND');
        assert(notFoundVerify.data?.data?.authentic === false, 'authentic flag is false');

        // 5. Non-Existent Product Public History (HTTP 404)
        console.log('\n--- 5. Non-Existent Product History (404) ---');
        const notFoundHistory = await request({
            hostname: 'localhost',
            path: '/api/public/products/FAKE-PROD-99999/history',
            method: 'GET',
        });
        assert(notFoundHistory.status === 404, 'Non-existent product history returns HTTP 404');

        // 6. Legacy Genesis Product Verification (P000)
        console.log('\n--- 6. Legacy Genesis Product Handling (P000) ---');
        const legacyVerify = await request({
            hostname: 'localhost',
            path: '/api/public/products/P000/verify',
            method: 'GET',
        });
        assert(legacyVerify.status === 200, 'Legacy product returns HTTP 200');
        assert(legacyVerify.data?.data?.status === 'LEGACY', 'Legacy product evaluated as status LEGACY');
        assert(legacyVerify.data?.data?.authentic === false, 'Legacy product authentic is false (no digital signature)');

        // 7. Protected Enterprise Route Security Boundary
        console.log('\n--- 7. Enterprise Authenticated Route Security Boundary ---');
        const unauthEnterpriseVerify = await request({
            hostname: 'localhost',
            path: '/api/products/TC2545/verify',
            method: 'GET',
            // No Authorization header!
        });
        assert(unauthEnterpriseVerify.status === 401, 'Enterprise /api/products/:id/verify rejects unauthenticated requests with HTTP 401');

        const unauthTransfer = await request({
            hostname: 'localhost',
            path: '/api/products/TC2545/transfer',
            method: 'POST',
            // No Authorization header!
        });
        assert(unauthTransfer.status === 401, 'Enterprise /api/products/:id/transfer rejects unauthenticated requests with HTTP 401');

        // 8. Customer Access Restriction (RBAC: Customer cannot transfer custody)
        console.log('\n--- 8. Customer Role RBAC Restriction Check ---');
        const cstToken = await login('customer@supplychain.com');
        const cstTransferAttempt = await request({
            hostname: 'localhost',
            path: '/api/products/TC2545/transfer',
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${cstToken}`,
                'Content-Type': 'application/json',
            },
        }, { newOwner: 'AnotherCustomer', newStatus: 'DELIVERED_TO_RETAILER' });

        assert(cstTransferAttempt.status === 403, 'Customer role transfer attempt rejected with HTTP 403 Forbidden');
        assert(cstTransferAttempt.data?.error?.includes('Access denied') || cstTransferAttempt.data?.error?.includes('Role'), 'RBAC error indicates role is not authorized');

        console.log('\n================================================================');
        console.log(`  PUBLIC VERIFICATION TESTS: ${passed} PASSED, ${failed} FAILED`);
        console.log('================================================================\n');

        if (server) server.close();
        const fabricService = require('../src/services/fabricService');
        fabricService.disconnect();
        process.exit(failed === 0 ? 0 : 1);
    } catch (err) {
        console.error('Test execution error:', err);
        if (server) server.close();
        process.exit(1);
    }
}

runPublicVerificationTests();
