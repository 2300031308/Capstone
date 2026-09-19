/*
 * Supply Chain Provenance Smart Contract
 * Manages product registration, retrieval, and lifecycle on Hyperledger Fabric.
 *
 * Objective 1: registerProduct, getProduct, getAllProducts, productExists
 * Future objectives will add: transferOwnership, verifyProduct, getProductHistory
 */

'use strict';

const { Contract } = require('fabric-contract-api');

class SupplyChainContract extends Contract {

    constructor() {
        super('SupplyChainContract');
    }

    /**
     * Deterministic transaction timestamp derived from client proposal.
     * Prevents endorsement mismatch across endorsing peers.
     */
    _getTxTimestamp(ctx) {
        try {
            const timestamp = ctx.stub.getTxTimestamp();
            let seconds = 0;
            if (timestamp && timestamp.seconds) {
                if (typeof timestamp.seconds.toNumber === 'function') {
                    seconds = timestamp.seconds.toNumber();
                } else if (typeof timestamp.seconds.low === 'number') {
                    seconds = timestamp.seconds.low;
                } else {
                    seconds = Number(timestamp.seconds);
                }
            }
            const nanos = (timestamp && timestamp.nanos) ? timestamp.nanos : 0;
            const millis = (seconds * 1000) + Math.round(nanos / 1000000);
            return new Date(millis).toISOString();
        } catch {
            return '2026-09-17T00:00:00.000Z';
        }
    }

    /**
     * Initialize the ledger with optional sample data.
     * Called once when chaincode is first instantiated.
     */
    async initLedger(ctx) {
        console.info('============= START : Initialize Ledger ===========');

        const timestamp = this._getTxTimestamp(ctx);
        const sampleProducts = [
            {
                productId: 'P000',
                productName: 'Sample Product',
                batchNumber: 'B000',
                manufacturer: 'ManufacturerOrg',
                currentOwner: 'ManufacturerOrg',
                status: 'REGISTERED',
                createdAt: timestamp,
                updatedAt: timestamp,
                docType: 'product',
            },
        ];

        for (const product of sampleProducts) {
            await ctx.stub.putState(
                product.productId,
                Buffer.from(JSON.stringify(product))
            );
            console.info(`Added product: ${product.productId}`);
        }

        console.info('============= END : Initialize Ledger ===========');
    }

    /**
     * Check whether a product with the given ID exists on the ledger.
     */
    async productExists(ctx, productId) {
        const productJSON = await ctx.stub.getState(productId);
        return productJSON && productJSON.length > 0;
    }

    /**
     * Register a new product on the ledger.
     */
    async registerProduct(ctx, productId, productName, batchNumber, manufacturer, productHash, digitalSignature) {
        if (!productId || !productName || !batchNumber || !manufacturer) {
            throw new Error('All fields are required: productId, productName, batchNumber, manufacturer');
        }

        const exists = await this.productExists(ctx, productId);
        if (exists) {
            throw new Error(`Product ${productId} already exists`);
        }

        const pHash = (productHash && typeof productHash === 'string' && productHash.trim().length > 0) ? productHash.trim() : null;
        const pSig = (digitalSignature && typeof digitalSignature === 'string' && digitalSignature.trim().length > 0) ? digitalSignature.trim() : null;

        const product = {
            productId,
            productName,
            batchNumber,
            manufacturer,
            currentOwner: manufacturer,
            status: 'REGISTERED',
            createdAt: this._getTxTimestamp(ctx),
            updatedAt: this._getTxTimestamp(ctx),
            docType: 'product',
            productHash: pHash,
            digitalSignature: pSig,
        };

        await ctx.stub.putState(productId, Buffer.from(JSON.stringify(product)));

        ctx.stub.setEvent('ProductRegistered', Buffer.from(JSON.stringify({
            productId,
            productName,
            manufacturer,
            productHash: product.productHash,
            digitalSignature: product.digitalSignature,
        })));

        return JSON.stringify(product);
    }

    /**
     * Retrieve a product by its ID.
     */
    async getProduct(ctx, productId) {
        const productJSON = await ctx.stub.getState(productId);
        if (!productJSON || productJSON.length === 0) {
            throw new Error(`Product ${productId} does not exist`);
        }
        return productJSON.toString();
    }

    /**
     * Retrieve all products from the ledger.
     */
    async getAllProducts(ctx) {
        const allResults = [];
        const iterator = await ctx.stub.getStateByRange('', '');

        let result = await iterator.next();
        while (!result.done) {
            const strValue = Buffer.from(result.value.value.toString()).toString('utf8');
            let record;
            try {
                record = JSON.parse(strValue);
            } catch (err) {
                console.log(err);
                record = strValue;
            }
            if (record && record.docType === 'product') {
                allResults.push(record);
            }
            result = await iterator.next();
        }

        return JSON.stringify(allResults);
    }

    // ===== STUBS FOR FUTURE OBJECTIVES =====

    /**
     * Transfer product ownership (O4).
     */
    async transferOwnership(ctx, productId, newOwner, newStatus) {
        const productJSON = await ctx.stub.getState(productId);
        if (!productJSON || productJSON.length === 0) {
            throw new Error(`Product ${productId} does not exist`);
        }

        const product = JSON.parse(productJSON.toString());
        const previousOwner = product.currentOwner;

        product.currentOwner = newOwner;
        product.status = newStatus || 'TRANSFERRED';
        product.updatedAt = this._getTxTimestamp(ctx);

        await ctx.stub.putState(productId, Buffer.from(JSON.stringify(product)));

        ctx.stub.setEvent('OwnershipTransferred', Buffer.from(JSON.stringify({
            productId,
            previousOwner,
            newOwner,
        })));

        return JSON.stringify(product);
    }

    /**
     * Get the history of a product (O5).
     */
    async getProductHistory(ctx, productId) {
        const exists = await this.productExists(ctx, productId);
        if (!exists) {
            throw new Error(`Product ${productId} does not exist`);
        }

        const allResults = [];
        const iterator = await ctx.stub.getHistoryForKey(productId);

        let result = await iterator.next();
        while (!result.done) {
            const record = {
                txId: result.value.txId,
                timestamp: result.value.timestamp,
                isDelete: result.value.isDelete,
            };

            if (!result.value.isDelete) {
                const strValue = Buffer.from(result.value.value.toString()).toString('utf8');
                try {
                    record.value = JSON.parse(strValue);
                } catch (err) {
                    record.value = strValue;
                }
            }

            allResults.push(record);
            result = await iterator.next();
        }

        return JSON.stringify(allResults);
    }
}

module.exports = SupplyChainContract;
