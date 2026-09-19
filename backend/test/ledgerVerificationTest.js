/*
 * Live Fabric Ledger Verification Test for Product Authenticity
 * Tests against live Fabric network on mychannel:
 * 1. Query legacy product P000 -> verify status is LEGACY
 * 2. Register product TC-XXXX with SHA-256 and ECDSA signature -> verify successful commit
 * 3. Query TC-XXXX back from Fabric -> verify status is AUTHENTIC
 * 4. Duplicate registration rejection -> verify already exists error
 * 5. Query product history -> verify transaction history exists
 */

'use strict';

const fabricService = require('../src/services/fabricService');
const cryptoService = require('../src/services/cryptoService');

async function runLedgerVerification() {
    console.log('==========================================================');
    console.log('  LIVE FABRIC LEDGER AUTHENTICITY VERIFICATION TEST       ');
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

    try {
        await fabricService.connectToFabric();

        // 1. Verify Existing Legacy Product P000
        console.log('\n--- Test 1: Legacy Product Preservation (P000) ---');
        const p000Exists = await fabricService.evaluateTransaction('productExists', 'P000');
        assert(p000Exists === true || p000Exists === 'true', 'Legacy product P000 exists on the ledger (not lost)');

        const p000 = await fabricService.evaluateTransaction('getProduct', 'P000');
        assert(p000 && p000.productId === 'P000', 'P000 retrieved successfully from Fabric world state');

        const p000Auth = cryptoService.verifyProductAuthenticity(p000);
        assert(p000Auth.status === 'LEGACY', 'P000 classified as LEGACY');
        assert(p000Auth.authentic === false, 'P000 authentic is false');
        assert(p000Auth.message && p000Auth.message.includes('legacy record'), 'P000 has descriptive legacy message');

        // 2. Register New Authentic Product
        console.log('\n--- Test 2: Register New Authentic Product on Fabric ---');
        const testId = 'TC' + Date.now().toString().slice(-4);
        const testProduct = {
            productId: testId,
            productName: 'Cryptographic Edge Controller',
            batchNumber: 'BATCH-2026-SEC',
            manufacturer: 'ManufacturerOrg',
        };

        const canonical = cryptoService.getCanonicalString(testProduct);
        const hash = cryptoService.generateProductHash(testProduct);
        const sig = cryptoService.signProduct(canonical);

        console.log(`  Registering ${testId} with SHA-256 and ECDSA signature...`);
        const regResult = await fabricService.submitTransaction(
            'registerProduct',
            testProduct.productId,
            testProduct.productName,
            testProduct.batchNumber,
            testProduct.manufacturer,
            hash,
            sig
        );

        assert(regResult && regResult.productId === testId, `Product ${testId} registered successfully`);
        assert(regResult.productHash === hash, 'Registered productHash matches SHA-256 digest');
        assert(regResult.digitalSignature === sig, 'Registered digitalSignature matches ECDSA signature');

        // 3. Query Registered Product and Verify Authenticity
        console.log(`\n--- Test 3: Query ${testId} and Verify Authenticity ---`);
        const fetched = await fabricService.evaluateTransaction('getProduct', testId);
        assert(fetched && fetched.productId === testId, `Retrieved ${testId} from Fabric`);

        const verifyResult = cryptoService.verifyProductAuthenticity(fetched);
        assert(verifyResult.status === 'AUTHENTIC', 'Verification status is AUTHENTIC');
        assert(verifyResult.authentic === true, 'Verification authentic is true');
        assert(verifyResult.dataIntegrity === 'Verified', 'Data integrity is Verified');
        assert(verifyResult.digitalSignature === 'Valid', 'Digital signature is Valid');
        assert(verifyResult.manufacturerIdentity === 'Verified', 'Manufacturer identity is verified');

        // 4. Duplicate Registration Rejection
        console.log('\n--- Test 4: Duplicate Registration Rejection ---');
        let duplicateThrew = false;
        try {
            await fabricService.submitTransaction(
                'registerProduct',
                testProduct.productId,
                testProduct.productName,
                testProduct.batchNumber,
                testProduct.manufacturer,
                hash,
                sig
            );
        } catch (err) {
            duplicateThrew = true;
            console.log('  Caught expected duplicate error:', err.message);
            const isExpectedMsg = err.code === 10 || err.message.includes('ABORTED') || err.message.includes('already exists');
            assert(isExpectedMsg, 'Duplicate product registration rejected properly by Fabric endorsement');
        }
        assert(duplicateThrew, 'Duplicate registration attempt threw an error');

        // 5. Product History Verification
        console.log(`\n--- Test 5: Product History for ${testId} ---`);
        const history = await fabricService.evaluateTransaction('getProductHistory', testId);
        assert(Array.isArray(history) && history.length >= 1, 'Product history returned at least 1 transaction');
        assert(history[0].value && history[0].value.productId === testId, 'History record contains product state');

        console.log('\n==========================================================');
        console.log(`  LEDGER TESTS COMPLETED: ${passed} PASSED, ${failed} FAILED`);
        console.log('==========================================================\n');

        fabricService.disconnect();
        process.exit(failed === 0 ? 0 : 1);
    } catch (err) {
        console.error('Test execution error:', err);
        fabricService.disconnect();
        process.exit(1);
    }
}

runLedgerVerification();
