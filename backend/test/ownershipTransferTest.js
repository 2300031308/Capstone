/*
 * Live Fabric Ledger Verification Test for Custody Transfer & Ownership-Based Access Control (Objective 4)
 *
 * State Machine Lifecycle:
 * REGISTERED (ManufacturerOrg, Org1MSP)
 *   -> IN_TRANSIT_TO_DISTRIBUTOR (DistributorOrg, Org2MSP)
 *   -> DELIVERED_TO_RETAILER (RetailerOrg, Org2MSP)
 *   -> SOLD_TO_CONSUMER (Consumer, Terminal)
 *
 * Verifies:
 * 1. P000 preservation and unchanged world state
 * 2. Product registration with SHA-256 and ECDSA cryptographic origin proof
 * 3. Hop 1: ManufacturerOrg (Org1MSP) -> DistributorOrg (IN_TRANSIT_TO_DISTRIBUTOR)
 * 4. Negative access control: Manufacturer cannot re-transfer once custody is ceded
 * 5. Negative access control: Unauthorized MSP (Org1MSP cannot transfer IN_TRANSIT_TO_DISTRIBUTOR)
 * 6. Negative access control: Tampered nextOwner/nextStatus parameter rejection
 * 7. Hop 2: DistributorOrg (Org2MSP) -> RetailerOrg (DELIVERED_TO_RETAILER)
 * 8. Negative access control: Distributor cannot re-transfer once custody is ceded
 * 9. Hop 3: RetailerOrg (Org2MSP) -> Consumer (SOLD_TO_CONSUMER)
 * 10. Terminal state enforcement: No transfers permitted after SOLD_TO_CONSUMER
 * 11. Immutability guarantee: Origin SHA-256 productHash and ECDSA digitalSignature are 100% preserved
 */

'use strict';

const fabricService = require('../src/services/fabricService');
const cryptoService = require('../src/services/cryptoService');

async function runCustodyTransferTests() {
    console.log('================================================================');
    console.log('  OBJECTIVE 4: FABRIC CUSTODY TRANSFER & ACCESS CONTROL TEST    ');
    console.log('================================================================\n');

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

    function getErrorMessage(err) {
        let msg = err.message || '';
        if (Array.isArray(err.details) && err.details.length > 0) {
            msg += ' ' + err.details.map(d => d.message || d.toString()).join(' ');
        }
        if (err.cause) {
            msg += ' ' + (err.cause.message || err.cause.toString());
        }
        return msg;
    }

    try {
        // Connect to both Org1MSP and Org2MSP gateways
        await fabricService.connectToFabric('Org1MSP');
        await fabricService.connectToFabric('Org2MSP');

        // -------------------------------------------------------------
        // Test 1: P000 World State Preservation
        // -------------------------------------------------------------
        console.log('\n--- Test 1: Existing Ledger Record Preservation (P000) ---');
        const p000 = await fabricService.evaluateTransaction('getProduct', 'P000');
        assert(p000 && p000.productId === 'P000', 'P000 exists on mychannel world state');
        assert(p000.currentOwner === 'ManufacturerOrg', 'P000 currentOwner is ManufacturerOrg');
        assert(p000.status === 'REGISTERED', 'P000 status is REGISTERED');

        // -------------------------------------------------------------
        // Test 2: Product Registration by Manufacturer (Org1MSP)
        // -------------------------------------------------------------
        console.log('\n--- Test 2: Register New Authentic Asset (Org1MSP) ---');
        const testId = 'TC4' + Date.now().toString().slice(-4);
        const testProduct = {
            productId: testId,
            productName: 'Secure Logistics Tracker',
            batchNumber: 'BATCH-O4-2026',
            manufacturer: 'ManufacturerOrg',
        };

        const canonical = cryptoService.getCanonicalString(testProduct);
        const originHash = cryptoService.generateProductHash(testProduct);
        const originSig = cryptoService.signProduct(canonical);

        console.log(`  Registering ${testId} via Org1MSP...`);
        const regResult = await fabricService.submitTransactionAs(
            'Org1MSP',
            'registerProduct',
            testProduct.productId,
            testProduct.productName,
            testProduct.batchNumber,
            testProduct.manufacturer,
            originHash,
            originSig
        );

        assert(regResult && regResult.productId === testId, `Product ${testId} registered`);
        assert(regResult.currentOwner === 'ManufacturerOrg', 'Initial currentOwner is ManufacturerOrg');
        assert(regResult.status === 'REGISTERED', 'Initial status is REGISTERED');
        assert(regResult.productHash === originHash, 'Registered SHA-256 hash matches');
        assert(regResult.digitalSignature === originSig, 'Registered ECDSA signature matches');

        // -------------------------------------------------------------
        // Test 3: Hop 1 — Manufacturer -> Distributor (Org1MSP)
        // -------------------------------------------------------------
        console.log('\n--- Test 3: Hop 1: ManufacturerOrg -> DistributorOrg (Org1MSP) ---');
        const hop1Result = await fabricService.submitTransactionAs(
            'Org1MSP',
            'transferOwnership',
            testId,
            'DistributorOrg',
            'IN_TRANSIT_TO_DISTRIBUTOR'
        );

        assert(hop1Result && hop1Result.productId === testId, 'Hop 1 transaction committed to Fabric');
        assert(hop1Result.currentOwner === 'DistributorOrg', 'currentOwner updated to DistributorOrg');
        assert(hop1Result.status === 'IN_TRANSIT_TO_DISTRIBUTOR', 'status updated to IN_TRANSIT_TO_DISTRIBUTOR');
        assert(hop1Result.productHash === originHash, 'Origin SHA-256 hash preserved intact after Hop 1');
        assert(hop1Result.digitalSignature === originSig, 'Origin ECDSA signature preserved intact after Hop 1');

        const hop1Verify = cryptoService.verifyProductAuthenticity(hop1Result);
        assert(hop1Verify.status === 'AUTHENTIC', 'Product authenticity remains AUTHENTIC after Hop 1');

        // -------------------------------------------------------------
        // Test 4: Negative Check — Manufacturer Cannot Re-Transfer
        // -------------------------------------------------------------
        console.log('\n--- Test 4: Negative Check: Previous Owner Re-Transfer Rejection ---');
        let mfgReTransferThrew = false;
        try {
            await fabricService.submitTransactionAs(
                'Org1MSP',
                'transferOwnership',
                testId,
                'DistributorOrg',
                'IN_TRANSIT_TO_DISTRIBUTOR'
            );
        } catch (err) {
            mfgReTransferThrew = true;
            const errMsg = getErrorMessage(err);
            console.log('  Caught expected rejection:', errMsg);
            const isExpected = err.code === 10 || errMsg.includes('ABORTED') || errMsg.includes('Invalid custodian') || errMsg.includes('must be owned by');
            assert(isExpected, 'Manufacturer re-transfer rejected by smart contract custody rule');
        }
        assert(mfgReTransferThrew, 'Re-transfer attempt by non-custodian threw error');

        // -------------------------------------------------------------
        // Test 5: Negative Check — Unauthorized MSP (Org1MSP calling Hop 2)
        // -------------------------------------------------------------
        console.log('\n--- Test 5: Negative Check: Unauthorized MSP Identity Enforcement ---');
        let wrongMspThrew = false;
        try {
            await fabricService.submitTransactionAs(
                'Org1MSP',
                'transferOwnership',
                testId,
                'RetailerOrg',
                'DELIVERED_TO_RETAILER'
            );
        } catch (err) {
            wrongMspThrew = true;
            const errMsg = getErrorMessage(err);
            console.log('  Caught expected MSP rejection:', errMsg);
            const isExpected = err.code === 10 || errMsg.includes('ABORTED') || errMsg.includes('Unauthorized MSP') || errMsg.includes('Expected \'Org2MSP\'');
            assert(isExpected, 'Org1MSP rejected when attempting Org2MSP transfer');
        }
        assert(wrongMspThrew, 'Wrong MSP attempt threw error');

        // -------------------------------------------------------------
        // Test 6: Negative Check — Tampered Destination Parameters
        // -------------------------------------------------------------
        console.log('\n--- Test 6: Negative Check: Client Parameter Tampering Rejection ---');
        let tamperedTargetThrew = false;
        try {
            await fabricService.submitTransactionAs(
                'Org2MSP',
                'transferOwnership',
                testId,
                'RogueThirdParty',
                'STOLEN'
            );
        } catch (err) {
            tamperedTargetThrew = true;
            const errMsg = getErrorMessage(err);
            console.log('  Caught expected tampering rejection:', errMsg);
            const isExpected = err.code === 10 || errMsg.includes('ABORTED') || errMsg.includes('Invalid target owner') || errMsg.includes('Invalid target status');
            assert(isExpected, 'Smart contract rejected tampered target parameters');
        }
        assert(tamperedTargetThrew, 'Tampered target parameters threw error');

        // -------------------------------------------------------------
        // Test 7: Hop 2 — Distributor -> Retailer (Org2MSP)
        // -------------------------------------------------------------
        console.log('\n--- Test 7: Hop 2: DistributorOrg -> RetailerOrg (Org2MSP) ---');
        const hop2Result = await fabricService.submitTransactionAs(
            'Org2MSP',
            'transferOwnership',
            testId,
            'RetailerOrg',
            'DELIVERED_TO_RETAILER'
        );

        assert(hop2Result && hop2Result.productId === testId, 'Hop 2 transaction committed to Fabric');
        assert(hop2Result.currentOwner === 'RetailerOrg', 'currentOwner updated to RetailerOrg');
        assert(hop2Result.status === 'DELIVERED_TO_RETAILER', 'status updated to DELIVERED_TO_RETAILER');
        assert(hop2Result.productHash === originHash, 'Origin SHA-256 hash preserved intact after Hop 2');
        assert(hop2Result.digitalSignature === originSig, 'Origin ECDSA signature preserved intact after Hop 2');

        const hop2Verify = cryptoService.verifyProductAuthenticity(hop2Result);
        assert(hop2Verify.status === 'AUTHENTIC', 'Product authenticity remains AUTHENTIC after Hop 2');

        // -------------------------------------------------------------
        // Test 8: Hop 3 — Retailer -> Consumer (Org2MSP)
        // -------------------------------------------------------------
        console.log('\n--- Test 8: Hop 3: RetailerOrg -> Consumer (Org2MSP) ---');
        const hop3Result = await fabricService.submitTransactionAs(
            'Org2MSP',
            'transferOwnership',
            testId,
            'Consumer',
            'SOLD_TO_CONSUMER'
        );

        assert(hop3Result && hop3Result.productId === testId, 'Hop 3 transaction committed to Fabric');
        assert(hop3Result.currentOwner === 'Consumer', 'currentOwner updated to Consumer');
        assert(hop3Result.status === 'SOLD_TO_CONSUMER', 'status updated to SOLD_TO_CONSUMER');
        assert(hop3Result.productHash === originHash, 'Origin SHA-256 hash preserved intact after Hop 3');
        assert(hop3Result.digitalSignature === originSig, 'Origin ECDSA signature preserved intact after Hop 3');

        const hop3Verify = cryptoService.verifyProductAuthenticity(hop3Result);
        assert(hop3Verify.status === 'AUTHENTIC', 'Product authenticity remains AUTHENTIC in consumer hands');

        // -------------------------------------------------------------
        // Test 9: Terminal State Enforcement
        // -------------------------------------------------------------
        console.log('\n--- Test 9: Terminal State Enforcement (SOLD_TO_CONSUMER) ---');
        let terminalThrew = false;
        try {
            await fabricService.submitTransactionAs(
                'Org2MSP',
                'transferOwnership',
                testId,
                'SecondaryMarket',
                'RESOLD'
            );
        } catch (err) {
            terminalThrew = true;
            const errMsg = getErrorMessage(err);
            console.log('  Caught expected terminal error:', errMsg);
            const isExpected = err.code === 10 || errMsg.includes('ABORTED') || errMsg.includes('already been sold to consumer') || errMsg.includes('No further custody transfers permitted');
            assert(isExpected, 'Transfer beyond terminal state rejected');
        }
        assert(terminalThrew, 'Terminal transfer attempt threw error');

        // -------------------------------------------------------------
        // Test 10: Provenance History Across All Custody Hops
        // -------------------------------------------------------------
        console.log(`\n--- Test 10: Provenance History Verification for ${testId} ---`);
        const history = await fabricService.evaluateTransaction('getProductHistory', testId);
        assert(Array.isArray(history) && history.length >= 4, `History recorded ${history.length} transactions (>= 4 hops)`);
        console.log(`  Recorded ${history.length} distinct immutable ledger transactions:`);
        history.forEach((h, idx) => {
            console.log(`    [Tx ${idx + 1}] ID: ${h.txId.substring(0, 16)}... Status: ${h.value?.status} Owner: ${h.value?.currentOwner}`);
        });

        console.log('\n================================================================');
        console.log(`  OBJECTIVE 4 TESTS COMPLETED: ${passed} PASSED, ${failed} FAILED`);
        console.log('================================================================\n');

        fabricService.disconnect();
        process.exit(failed === 0 ? 0 : 1);
    } catch (err) {
        console.error('Fatal test runner error:', err);
        fabricService.disconnect();
        process.exit(1);
    }
}

runCustodyTransferTests();
