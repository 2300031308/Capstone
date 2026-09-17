/*
 * Supply Chain Provenance Chaincode
 * Entry point - exports all smart contracts
 */

'use strict';

const SupplyChainContract = require('./lib/supplyChainContract');

module.exports.SupplyChainContract = SupplyChainContract;
module.exports.contracts = [SupplyChainContract];
