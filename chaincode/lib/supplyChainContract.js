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
     * Initialize the ledger with optional sample data.
     * Called once when chaincode is first instantiated.
     */
    async initLedger(ctx) {
        console.info('============= START : Initialize Ledger ===========');

        const sampleProducts = [
            {
                productId: 'P000',
                productName: 'Sample Product',
                batchNumber: 'B000',
                manufacturer: 'ManufacturerOrg',
                currentOwner: 'ManufacturerOrg',
                status: 'REGISTERED',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
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
    async registerProduct(ctx, productId, productName, batchNumber, manufacturer) {
        if (!productId || !productName || !batchNumber || !manufacturer) {
            throw new Error('All fields are required: productId, productName, batchNumber, manufacturer');
        }

        const exists = await this.productExists(ctx, productId);
        if (exists) {
            throw new Error(`Product ${productId} already exists`);
        }

        const product = {
            productId,
            productName,
            batchNumber,
            manufacturer,
            currentOwner: manufacturer,
            status: 'REGISTERED',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            docType: 'product',
        };

        await ctx.stub.putState(productId, Buffer.from(JSON.stringify(product)));

        ctx.stub.setEvent('ProductRegistered', Buffer.from(JSON.stringify({
            productId,
            productName,
            manufacturer,
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
            const strValue = Buffer.from(result.value.value.buffer).toString('utf8');
            let record;
            try {
                record = JSON.parse(strValue);
            } catch (err) {
                console.log(err);
                record = strValue;
            }
            if (record.docType === 'product') {
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
        product.updatedAt = new Date().toISOString();

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
                const strValue = Buffer.from(result.value.value.buffer).toString('utf8');
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
