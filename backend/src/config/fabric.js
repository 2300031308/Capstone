/*
 * Fabric connection configuration.
 * Reads paths to crypto materials and network settings.
 */

'use strict';

const path = require('path');

const PROJECT_ROOT = path.resolve(__dirname, '..', '..', '..');
const FABRIC_SAMPLES_DIR = path.join(PROJECT_ROOT, 'fabric-network', 'fabric-samples');
const TEST_NETWORK_DIR = path.join(FABRIC_SAMPLES_DIR, 'test-network');
const CRYPTO_PATH = path.join(TEST_NETWORK_DIR, 'organizations', 'peerOrganizations', 'org1.example.com');

const fabricConfig = {
    channelName: process.env.CHANNEL_NAME || 'mychannel',
    chaincodeName: process.env.CHAINCODE_NAME || 'supplychain',
    mspId: process.env.MSP_ID || 'Org1MSP',
    peerEndpoint: process.env.PEER_ENDPOINT || 'localhost:7051',
    peerHostAlias: process.env.PEER_HOST_ALIAS || 'peer0.org1.example.com',

    cryptoPath: CRYPTO_PATH,
    tlsCertPath: path.join(
        CRYPTO_PATH,
        'peers', 'peer0.org1.example.com', 'tls', 'ca.crt'
    ),
    certDirectoryPath: path.join(
        CRYPTO_PATH,
        'users', 'User1@org1.example.com', 'msp', 'signcerts'
    ),
    keyDirectoryPath: path.join(
        CRYPTO_PATH,
        'users', 'User1@org1.example.com', 'msp', 'keystore'
    ),
};

module.exports = fabricConfig;
