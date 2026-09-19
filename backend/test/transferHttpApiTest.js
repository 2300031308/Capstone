/*
 * End-to-End HTTP API Integration Test for Custody Transfer & RBAC
 * Tests the complete flow through Express router, JWT auth middleware,
 * role authorization, and Fabric multi-MSP gateway.
 */

'use strict';

const http = require('http');

const TEST_PORT = 5005;

// Helper for HTTP requests
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
                    resolve({ status: res.statusCode, data: parsed });
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

// Helper to post product transfer
async function transferProduct(token, productId) {
    return request({
        hostname: 'localhost',
        path: `/api/products/${productId}/transfer`,
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
        },
    }, {});
}

// Helper to register product
async function registerProduct(token, productData) {
    return request({
        hostname: 'localhost',
        path: '/api/products',
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
        },
    }, productData);
}

async function runHttpApiTests() {
    console.log('================================================================');
    console.log('  HTTP API END-TO-END CUSTODY TRANSFER & RBAC INTEGRATION TEST  ');
    console.log('================================================================\n');

    let passed = 0;
    let failed = 0;
    let server;

    function assert(condition, message) {
        if (condition) {
            console.log('  [PASS]', message);
            passed++;
        } else {
            console.error('  [FAIL]', message);
            failed++;
        }
    }

    try {
        const app = require('../src/app');
        server = await new Promise((resolve) => {
            const s = app.listen(TEST_PORT, () => resolve(s));
        });

        // 1. Authenticate users
        console.log('--- 1. Authenticating Supply Chain Participants ---');
        const mfgToken = await login('manufacturer@supplychain.com');
        assert(mfgToken, 'Manufacturer logged in successfully (Org1MSP, ManufacturerOrg)');

        const distToken = await login('distributor@supplychain.com');
        assert(distToken, 'Distributor logged in successfully (Org2MSP, DistributorOrg)');

        const rtlToken = await login('retailer@supplychain.com');
        assert(rtlToken, 'Retailer logged in successfully (Org2MSP, RetailerOrg)');

        const cstToken = await login('customer@supplychain.com');
        assert(cstToken, 'Customer logged in successfully (Customer, Consumer)');

        // 2. Register new product via HTTP
        console.log('\n--- 2. Register New Product via HTTP API (Manufacturer) ---');
        const testId = 'HTTP' + Date.now().toString().slice(-4);
        const regRes = await registerProduct(mfgToken, {
            productId: testId,
            productName: 'End-to-End Smart Sensor',
            batchNumber: 'BATCH-HTTP-01',
            manufacturer: 'ManufacturerOrg',
        });
        assert(regRes.status === 201, `Product ${testId} registered via HTTP (Status 201)`);
        assert(regRes.data?.data?.currentOwner === 'ManufacturerOrg', 'currentOwner is ManufacturerOrg');
        assert(regRes.data?.data?.status === 'REGISTERED', 'status is REGISTERED');

        // 3. Customer attempts to transfer -> Rejected by RBAC (403)
        console.log('\n--- 3. Unauthorized Role Rejection (Customer Role) ---');
        const cstAttempt = await transferProduct(cstToken, testId);
        assert(cstAttempt.status === 403, 'Customer transfer rejected with HTTP 403');
        assert(cstAttempt.data?.error?.includes('Access Denied') || cstAttempt.data?.error?.includes('not authorized'), 'Customer error mentions authorization');

        // 4. Distributor attempts to transfer before receipt -> Rejected by Ownership Check (403)
        console.log('\n--- 4. Non-Custodian Transfer Rejection (Distributor before receipt) ---');
        const prematureDistAttempt = await transferProduct(distToken, testId);
        assert(prematureDistAttempt.status === 403, 'Premature transfer rejected with HTTP 403');
        assert(prematureDistAttempt.data?.error?.includes('Ownership Check Failed'), 'Error indicates Ownership Check Failed');

        // 5. Hop 1: Manufacturer transfers to DistributorOrg via HTTP
        console.log('\n--- 5. Hop 1: Manufacturer -> Distributor via HTTP ---');
        const hop1Res = await transferProduct(mfgToken, testId);
        assert(hop1Res.status === 200, 'Hop 1 succeeded with HTTP 200');
        assert(hop1Res.data?.data?.currentOwner === 'DistributorOrg', 'currentOwner updated to DistributorOrg');
        assert(hop1Res.data?.data?.status === 'IN_TRANSIT_TO_DISTRIBUTOR', 'status is IN_TRANSIT_TO_DISTRIBUTOR');

        // 6. Manufacturer attempts to transfer again -> Rejected by Ownership Check (403)
        console.log('\n--- 6. Previous Custodian Re-Transfer Rejection ---');
        const mfgReAttempt = await transferProduct(mfgToken, testId);
        assert(mfgReAttempt.status === 403, 'Re-transfer attempt rejected with HTTP 403');
        assert(mfgReAttempt.data?.error?.includes('Ownership Check Failed'), 'Error notes product is currently in custody of DistributorOrg');

        // 7. Hop 2: Distributor transfers to RetailerOrg via HTTP (submits as Org2MSP)
        console.log('\n--- 7. Hop 2: Distributor -> Retailer via HTTP (Org2MSP) ---');
        const hop2Res = await transferProduct(distToken, testId);
        assert(hop2Res.status === 200, 'Hop 2 succeeded with HTTP 200');
        assert(hop2Res.data?.data?.currentOwner === 'RetailerOrg', 'currentOwner updated to RetailerOrg');
        assert(hop2Res.data?.data?.status === 'DELIVERED_TO_RETAILER', 'status is DELIVERED_TO_RETAILER');

        // 8. Hop 3: Retailer transfers to Consumer via HTTP (submits as Org2MSP)
        console.log('\n--- 8. Hop 3: Retailer -> Consumer via HTTP (Org2MSP) ---');
        const hop3Res = await transferProduct(rtlToken, testId);
        assert(hop3Res.status === 200, 'Hop 3 succeeded with HTTP 200');
        assert(hop3Res.data?.data?.currentOwner === 'Consumer', 'currentOwner updated to Consumer');
        assert(hop3Res.data?.data?.status === 'SOLD_TO_CONSUMER', 'status is SOLD_TO_CONSUMER');

        // 9. Retailer attempts to transfer after consumer sale -> Terminal State Rejected (400)
        console.log('\n--- 9. Terminal State Transfer Rejection ---');
        const terminalAttempt = await transferProduct(rtlToken, testId);
        assert(terminalAttempt.status === 400, 'Post-terminal transfer rejected with HTTP 400');
        assert(terminalAttempt.data?.error?.includes('Terminal State') || terminalAttempt.data?.error?.includes('already been sold'), 'Terminal state error message returned');

        // 10. Cryptographic Authenticity Check after all hops
        console.log('\n--- 10. Cryptographic Authenticity Verification via HTTP ---');
        const verifyRes = await request({
            hostname: 'localhost',
            path: `/api/products/${testId}/verify`,
            method: 'GET',
            headers: { 'Authorization': `Bearer ${cstToken}` },
        });
        assert(verifyRes.status === 200, 'Verification endpoint returned HTTP 200');
        assert(verifyRes.data?.data?.status === 'AUTHENTIC', 'Product remains AUTHENTIC after 3 custody transfers');
        assert(verifyRes.data?.data?.dataIntegrity === 'Verified', 'SHA-256 data integrity verified');
        assert(verifyRes.data?.data?.digitalSignature === 'Valid', 'ECDSA digital signature verified');

        console.log('\n================================================================');
        console.log(`  HTTP API TESTS COMPLETED: ${passed} PASSED, ${failed} FAILED`);
        console.log('================================================================\n');

        if (server) server.close();
        const fabricService = require('../src/services/fabricService');
        fabricService.disconnect();
        process.exit(failed === 0 ? 0 : 1);
    } catch (err) {
        console.error('HTTP Test error:', err);
        if (server) server.close();
        process.exit(1);
    }
}

runHttpApiTests();
