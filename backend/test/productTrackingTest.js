/*
 * Product Tracking & Supply Chain Journey Automated Test Suite
 * Validates:
 * 1. Public unauthenticated tracking endpoint returns HTTP 200 and complete journey.
 * 2. Real Hyperledger Fabric timestamps and transaction IDs are included for every stage.
 * 3. Dynamic 4-stage progress indicator accurately reflects actual ledger state.
 * 4. Cryptographic authenticity evidence is validated (SHA-256 integrity, ECDSA signature).
 * 5. Security boundary: complete sanitization (no private keys, raw signatures, JWTs, or paths).
 * 6. Authenticated enterprise tracking endpoint requires valid JWT (HTTP 401 on missing token).
 * 7. Non-existent product ID returns HTTP 404 NOT_FOUND.
 */

'use strict';

const http = require('http');
const app = require('../src/app');

const TEST_PORT = 5007;
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

async function runTrackingTests() {
    console.log('\n================================================================');
    console.log('  STARTING PRODUCT TRACKING & JOURNEY TIMELINE TESTS');
    console.log('================================================================\n');

    try {
        server = app.listen(TEST_PORT);
        await new Promise((resolve) => setTimeout(resolve, 500));

        // Use test product WB-CUSTODY-201 or register a fresh one if needed
        const testProductId = 'WB-CUSTODY-201';

        // 1. Public Unauthenticated Tracking Query
        console.log(`--- 1. Public Tracking Query (${testProductId}) ---`);
        const pubTrackRes = await request({
            hostname: 'localhost',
            path: `/api/public/products/${testProductId}/tracking`,
            method: 'GET',
            // Unauthenticated: No Authorization header sent!
        });

        assert(pubTrackRes.status === 200, 'Public tracking returns HTTP 200 without JWT');
        assert(pubTrackRes.data?.success === true, 'Response success flag is true');

        const trackData = pubTrackRes.data?.data || {};
        assert(trackData.productId === testProductId, `Product ID matches ${testProductId}`);
        assert(typeof trackData.productName === 'string', 'Product Name is present');
        assert(typeof trackData.batchNumber === 'string', 'Batch Number is present');
        assert(trackData.manufacturer === 'ManufacturerOrg', 'Manufacturer is ManufacturerOrg');
        assert(typeof trackData.currentCustodian === 'string', 'Current Custodian is present');
        assert(typeof trackData.currentStatus === 'string', 'Current Status is present');
        assert(typeof trackData.registrationDate === 'string', 'Registration timestamp is present');
        assert(typeof trackData.lastUpdated === 'string', 'Last Updated timestamp is present');

        // 2. Cryptographic Authenticity Proofs
        console.log('\n--- 2. Cryptographic Authenticity Verification ---');
        assert(trackData.authenticity?.status === 'AUTHENTIC', 'Authenticity status is AUTHENTIC');
        assert(trackData.authenticity?.authentic === true, 'Authentic boolean is true');
        assert(trackData.authenticity?.dataIntegrity === 'Verified', 'SHA-256 data integrity is Verified');
        assert(trackData.authenticity?.digitalSignature === 'Valid', 'ECDSA digital signature is Valid');
        assert(trackData.authenticity?.signerMsp === 'Org1MSP', 'Signer MSP is Org1MSP');
        assert(typeof trackData.authenticity?.productHash === 'string' && trackData.authenticity.productHash.length === 64, 'SHA-256 productHash is 64 hex characters');

        // 3. Dynamic 4-Stage Progress Stepper
        console.log('\n--- 3. Dynamic 4-Stage Progress Stepper Validation ---');
        assert(Array.isArray(trackData.progress), 'Progress is an array');
        assert(trackData.progress?.length === 4, 'Progress has exactly 4 supply chain stages');

        const [mfgStage, distStage, rtlStage, cstStage] = trackData.progress || [];
        assert(mfgStage.stage === 'MANUFACTURER', 'Stage 1 is MANUFACTURER');
        assert(mfgStage.state === 'completed', 'Stage 1 is completed');
        assert(typeof mfgStage.timestamp === 'string', 'Stage 1 has actual Fabric timestamp');
        assert(typeof mfgStage.transactionId === 'string', 'Stage 1 has Fabric transaction ID');

        assert(distStage.stage === 'DISTRIBUTOR', 'Stage 2 is DISTRIBUTOR');
        assert(distStage.targetStatus === 'IN_TRANSIT_TO_DISTRIBUTOR', 'Stage 2 targetStatus is IN_TRANSIT_TO_DISTRIBUTOR');

        assert(rtlStage.stage === 'RETAILER', 'Stage 3 is RETAILER');
        assert(rtlStage.targetStatus === 'DELIVERED_TO_RETAILER', 'Stage 3 targetStatus is DELIVERED_TO_RETAILER');

        assert(cstStage.stage === 'CONSUMER', 'Stage 4 is CONSUMER');
        assert(cstStage.targetStatus === 'SOLD_TO_CONSUMER', 'Stage 4 targetStatus is SOLD_TO_CONSUMER');

        // 4. Chronological Vertical Journey Events
        console.log('\n--- 4. Chronological Vertical Journey Events ---');
        assert(Array.isArray(trackData.events), 'Events is an array');
        assert(trackData.events.length >= 1, `Ledger recorded ${trackData.events.length} journey events`);

        const firstEvt = trackData.events[0];
        assert(firstEvt.sequence === 1, 'First event sequence is 1');
        assert(firstEvt.action === 'REGISTERED', 'First event action is REGISTERED');
        assert(firstEvt.from === null, 'First event has no previous custodian (Genesis)');
        assert(firstEvt.to === 'ManufacturerOrg', 'First event to is ManufacturerOrg');
        assert(firstEvt.status === 'REGISTERED', 'First event status is REGISTERED');
        assert(typeof firstEvt.transactionId === 'string' && firstEvt.transactionId.length > 10, 'First event has Fabric txId');
        assert(typeof firstEvt.timestamp === 'string' && firstEvt.timestamp.includes('T'), 'First event has ISO timestamp');
        assert(typeof firstEvt.formattedTime === 'string', 'First event has formatted local time');

        // 5. Security & Cryptographic Sanitization Audit
        console.log('\n--- 5. Public Tracking Security & Sanitization Audit ---');
        const rawString = pubTrackRes.raw || JSON.stringify(pubTrackRes.data);
        assert(!rawString.includes('"signatureValue"'), 'Public tracking does NOT expose raw signatureValue');
        assert(!rawString.includes('"privateKey"'), 'Public tracking does NOT expose privateKey');
        assert(!rawString.includes('"certificate"'), 'Public tracking does NOT expose certificate');
        assert(!rawString.includes('BEGIN PRIVATE KEY'), 'No raw private keys leaked');
        assert(!rawString.includes('BEGIN CERTIFICATE'), 'No raw certificates leaked');
        assert(!rawString.includes('keystore'), 'No keystore metadata leaked');
        assert(!rawString.includes('password'), 'No passwords leaked');
        assert(!rawString.includes('Bearer eyJ'), 'No JWT tokens leaked');
        assert(!rawString.includes('/Users/'), 'No server filesystem paths leaked');
        assert(!rawString.includes('organizations/peerOrganizations'), 'No Fabric credential paths leaked');

        // 6. Authenticated Enterprise Tracking Route Check
        console.log('\n--- 6. Authenticated Enterprise Route Security Boundary ---');
        const unauthRes = await request({
            hostname: 'localhost',
            path: `/api/products/${testProductId}/tracking`,
            method: 'GET',
            // No Authorization header!
        });
        assert(unauthRes.status === 401, 'Protected /api/products/:id/tracking rejects unauthenticated requests with HTTP 401');

        const mfgToken = await login('manufacturer@supplychain.com');
        const authRes = await request({
            hostname: 'localhost',
            path: `/api/products/${testProductId}/tracking`,
            method: 'GET',
            headers: { 'Authorization': `Bearer ${mfgToken}` },
        });
        assert(authRes.status === 200, 'Protected /api/products/:id/tracking succeeds with valid JWT');
        assert(authRes.data?.data?.productId === testProductId, 'Authenticated response contains product tracking');

        // 7. 404 Error Handling for Non-Existent Product
        console.log('\n--- 7. Non-Existent Product 404 Handling ---');
        const notFoundRes = await request({
            hostname: 'localhost',
            path: '/api/public/products/NON-EXISTENT-XYZ-9999/tracking',
            method: 'GET',
        });
        assert(notFoundRes.status === 404, 'Non-existent product returns HTTP 404');
        assert(notFoundRes.data?.data?.status === 'NOT_FOUND', 'Response status is NOT_FOUND');
        assert(notFoundRes.data?.data?.authentic === false, 'Authentic is false');

        console.log('\n================================================================');
        console.log(`  TRACKING TESTS COMPLETED: ${passed} PASSED, ${failed} FAILED`);
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

runTrackingTests();
