/*
 * Fabric Gateway Service
 * Manages the connection to Hyperledger Fabric and provides
 * methods to submit and evaluate transactions.
 */

'use strict';

const grpc = require('@grpc/grpc-js');
const { connect, signers } = require('@hyperledger/fabric-gateway');
const crypto = require('node:crypto');
const fs = require('node:fs/promises');
const path = require('node:path');
const fabricConfig = require('../config/fabric');

const gateways = new Map();
const contracts = new Map();

/**
 * Read the first file from a directory.
 */
async function readFirstFile(dirPath) {
    const files = await fs.readdir(dirPath);
    if (files.length === 0) {
        throw new Error(`No files found in directory: ${dirPath}`);
    }
    const filePath = path.join(dirPath, files[0]);
    return fs.readFile(filePath);
}

/**
 * Resolve organization configuration.
 */
function getOrgConfig(mspId = 'Org1MSP') {
    if (fabricConfig.orgs && fabricConfig.orgs[mspId]) {
        return fabricConfig.orgs[mspId];
    }
    return {
        mspId: fabricConfig.mspId,
        peerEndpoint: fabricConfig.peerEndpoint,
        peerHostAlias: fabricConfig.peerHostAlias,
        tlsCertPath: fabricConfig.tlsCertPath,
        certDirectoryPath: fabricConfig.certDirectoryPath,
        keyDirectoryPath: fabricConfig.keyDirectoryPath,
    };
}

/**
 * Create a new gRPC connection to the Fabric peer for a specific MSP.
 */
async function newGrpcConnection(orgConfig) {
    const tlsRootCert = await fs.readFile(orgConfig.tlsCertPath);
    const tlsCredentials = grpc.credentials.createSsl(tlsRootCert);
    return new grpc.Client(
        orgConfig.peerEndpoint,
        tlsCredentials,
        {
            'grpc.ssl_target_name_override': orgConfig.peerHostAlias,
        }
    );
}

/**
 * Load the user identity (X.509 certificate) for a specific MSP.
 */
async function newIdentity(orgConfig) {
    const certBuffer = await readFirstFile(orgConfig.certDirectoryPath);
    const credentials = certBuffer.toString();
    return { mspId: orgConfig.mspId, credentials: Buffer.from(credentials) };
}

/**
 * Load the user's private key for signing for a specific MSP.
 */
async function newSigner(orgConfig) {
    const keyBuffer = await readFirstFile(orgConfig.keyDirectoryPath);
    const privateKey = crypto.createPrivateKey(keyBuffer);
    return signers.newPrivateKeySigner(privateKey);
}

/**
 * Initialize a Fabric Gateway connection for a specific MSP.
 */
async function connectToFabric(mspId = 'Org1MSP') {
    try {
        if (contracts.has(mspId)) {
            return contracts.get(mspId);
        }

        const orgConfig = getOrgConfig(mspId);
        console.log(`Connecting to Fabric network for ${mspId}...`);
        console.log(`  Channel: ${fabricConfig.channelName}`);
        console.log(`  Chaincode: ${fabricConfig.chaincodeName}`);
        console.log(`  MSP: ${orgConfig.mspId}`);
        console.log(`  Peer: ${orgConfig.peerEndpoint} (${orgConfig.peerHostAlias})`);

        const client = await newGrpcConnection(orgConfig);
        const identity = await newIdentity(orgConfig);
        const signer = await newSigner(orgConfig);

        const gateway = connect({
            client,
            identity,
            signer,
            evaluateOptions: () => ({ deadline: Date.now() + 5000 }),
            endorseOptions: () => ({ deadline: Date.now() + 15000 }),
            submitOptions: () => ({ deadline: Date.now() + 5000 }),
            commitStatusOptions: () => ({ deadline: Date.now() + 60000 }),
        });

        const network = gateway.getNetwork(fabricConfig.channelName);
        const contract = network.getContract(fabricConfig.chaincodeName);

        gateways.set(mspId, gateway);
        contracts.set(mspId, contract);

        console.log(`Successfully connected to Fabric network as ${mspId}!`);
        return contract;
    } catch (error) {
        console.error(`Failed to connect to Fabric network as ${mspId}:`, error);
        throw error;
    }
}

/**
 * Get the contract instance for a given MSP, connecting if necessary.
 */
async function getContract(mspId = 'Org1MSP') {
    if (!contracts.has(mspId)) {
        await connectToFabric(mspId);
    }
    return contracts.get(mspId);
}

/**
 * Submit a transaction as a specific MSP identity (write to ledger).
 */
async function submitTransactionAs(mspId, functionName, ...args) {
    const targetMsp = mspId || 'Org1MSP';
    const c = await getContract(targetMsp);
    console.log(`Submitting transaction as [${targetMsp}]: ${functionName}(${args.join(', ')})`);

    const resultBytes = await c.submitTransaction(functionName, ...args);
    const resultString = Buffer.from(resultBytes).toString('utf8');

    if (!resultString) {
        return null;
    }

    try {
        return JSON.parse(resultString);
    } catch {
        return resultString;
    }
}

/**
 * Submit a transaction using default Org1MSP (backward compatibility).
 */
async function submitTransaction(functionName, ...args) {
    return submitTransactionAs('Org1MSP', functionName, ...args);
}

/**
 * Evaluate a transaction (read from ledger, no write).
 */
async function evaluateTransaction(functionName, ...args) {
    const c = await getContract('Org1MSP');
    console.log(`Evaluating transaction: ${functionName}(${args.join(', ')})`);

    const resultBytes = await c.evaluateTransaction(functionName, ...args);
    const resultString = Buffer.from(resultBytes).toString('utf8');

    if (!resultString) {
        return null;
    }

    try {
        return JSON.parse(resultString);
    } catch {
        return resultString;
    }
}

/**
 * Disconnect from all Fabric gateways.
 */
function disconnect() {
    for (const [mspId, gw] of gateways.entries()) {
        try {
            gw.close();
            console.log(`Disconnected ${mspId} from Fabric network.`);
        } catch (e) {
            console.warn(`Error disconnecting ${mspId}:`, e.message);
        }
    }
    gateways.clear();
    contracts.clear();
}

module.exports = {
    connectToFabric,
    getContract,
    submitTransaction,
    submitTransactionAs,
    evaluateTransaction,
    disconnect,
};
