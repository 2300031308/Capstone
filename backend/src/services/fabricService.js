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

let gateway;
let contract;

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
 * Create a new gRPC connection to the Fabric peer.
 */
async function newGrpcConnection() {
    const tlsRootCert = await fs.readFile(fabricConfig.tlsCertPath);
    const tlsCredentials = grpc.credentials.createSsl(tlsRootCert);
    return new grpc.Client(
        fabricConfig.peerEndpoint,
        tlsCredentials,
        {
            'grpc.ssl_target_name_override': fabricConfig.peerHostAlias,
        }
    );
}

/**
 * Load the user identity (X.509 certificate).
 */
async function newIdentity() {
    const certBuffer = await readFirstFile(fabricConfig.certDirectoryPath);
    const credentials = certBuffer.toString();
    return { mspId: fabricConfig.mspId, credentials: Buffer.from(credentials) };
}

/**
 * Load the user's private key for signing.
 */
async function newSigner() {
    const keyBuffer = await readFirstFile(fabricConfig.keyDirectoryPath);
    const privateKey = crypto.createPrivateKey(keyBuffer);
    return signers.newPrivateKeySigner(privateKey);
}

/**
 * Initialize the Fabric Gateway connection.
 */
async function connectToFabric() {
    try {
        console.log('Connecting to Fabric network...');
        console.log(`  Channel: ${fabricConfig.channelName}`);
        console.log(`  Chaincode: ${fabricConfig.chaincodeName}`);
        console.log(`  MSP: ${fabricConfig.mspId}`);
        console.log(`  Peer: ${fabricConfig.peerEndpoint}`);

        const client = await newGrpcConnection();
        const identity = await newIdentity();
        const signer = await newSigner();

        gateway = connect({
            client,
            identity,
            signer,
            evaluateOptions: () => ({ deadline: Date.now() + 5000 }),
            endorseOptions: () => ({ deadline: Date.now() + 15000 }),
            submitOptions: () => ({ deadline: Date.now() + 5000 }),
            commitStatusOptions: () => ({ deadline: Date.now() + 60000 }),
        });

        const network = gateway.getNetwork(fabricConfig.channelName);
        contract = network.getContract(fabricConfig.chaincodeName);

        console.log('Successfully connected to Fabric network!');
        return contract;
    } catch (error) {
        console.error('Failed to connect to Fabric network:', error);
        throw error;
    }
}

/**
 * Get the contract instance, connecting if necessary.
 */
async function getContract() {
    if (!contract) {
        await connectToFabric();
    }
    return contract;
}

/**
 * Submit a transaction (write to ledger).
 */
async function submitTransaction(functionName, ...args) {
    const c = await getContract();
    console.log(`Submitting transaction: ${functionName}(${args.join(', ')})`);

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
 * Evaluate a transaction (read from ledger, no write).
 */
async function evaluateTransaction(functionName, ...args) {
    const c = await getContract();
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
 * Disconnect from the Fabric gateway.
 */
function disconnect() {
    if (gateway) {
        gateway.close();
        console.log('Disconnected from Fabric network.');
    }
}

module.exports = {
    connectToFabric,
    getContract,
    submitTransaction,
    evaluateTransaction,
    disconnect,
};
