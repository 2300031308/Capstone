#!/bin/bash
#
# start-network.sh
# Starts the Hyperledger Fabric test-network, creates a channel,
# and deploys the supply chain chaincode.
#

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
TEST_NETWORK_DIR="${SCRIPT_DIR}/fabric-samples/test-network"
CHAINCODE_DIR="${PROJECT_ROOT}/chaincode"
CHANNEL_NAME="mychannel"
CHAINCODE_NAME="supplychain"
CHAINCODE_VERSION="1.0"
CHAINCODE_SEQUENCE="1"

echo "========================================"
echo "  Starting Fabric Network"
echo "========================================"

# Check prerequisites
if [ ! -d "${TEST_NETWORK_DIR}" ]; then
    echo "ERROR: test-network not found at ${TEST_NETWORK_DIR}"
    echo "Run ./install-fabric.sh first."
    exit 1
fi

# Add Fabric binaries to PATH
export PATH="${SCRIPT_DIR}/fabric-samples/bin:$PATH"
export FABRIC_CFG_PATH="${SCRIPT_DIR}/fabric-samples/config/"

echo ""
echo "Step 1: Bringing down any existing network..."
cd "${TEST_NETWORK_DIR}"
./network.sh down

echo ""
echo "Step 2: Starting the network with Certificate Authorities and CouchDB..."
./network.sh up createChannel -ca -s couchdb -c ${CHANNEL_NAME}

echo ""
echo "Step 3: Deploying chaincode..."

# Install chaincode dependencies
echo "Installing chaincode npm dependencies..."
cd "${CHAINCODE_DIR}"
npm install
cd "${TEST_NETWORK_DIR}"

# Deploy chaincode using the test-network script
./network.sh deployCC \
    -ccn ${CHAINCODE_NAME} \
    -ccp "${CHAINCODE_DIR}" \
    -ccl javascript \
    -c ${CHANNEL_NAME} \
    -ccv ${CHAINCODE_VERSION} \
    -ccs ${CHAINCODE_SEQUENCE}

echo ""
echo "Step 4: Initializing the ledger..."

# Set environment for Org1
export CORE_PEER_TLS_ENABLED=true
export CORE_PEER_LOCALMSPID="Org1MSP"
export CORE_PEER_TLS_ROOTCERT_FILE=${TEST_NETWORK_DIR}/organizations/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls/ca.crt
export CORE_PEER_MSPCONFIGPATH=${TEST_NETWORK_DIR}/organizations/peerOrganizations/org1.example.com/users/Admin@org1.example.com/msp
export CORE_PEER_ADDRESS=localhost:7051

peer chaincode invoke \
    -o localhost:7050 \
    --ordererTLSHostnameOverride orderer.example.com \
    --tls \
    --cafile "${TEST_NETWORK_DIR}/organizations/ordererOrganizations/example.com/orderers/orderer.example.com/msp/tlscacerts/tlsca.example.com-cert.pem" \
    -C ${CHANNEL_NAME} \
    -n ${CHAINCODE_NAME} \
    --peerAddresses localhost:7051 \
    --tlsRootCertFiles "${TEST_NETWORK_DIR}/organizations/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls/ca.crt" \
    --peerAddresses localhost:9051 \
    --tlsRootCertFiles "${TEST_NETWORK_DIR}/organizations/peerOrganizations/org2.example.com/peers/peer0.org2.example.com/tls/ca.crt" \
    -c '{"function":"initLedger","Args":[]}'

echo ""
echo "Step 5: Verifying deployment..."

peer chaincode query \
    -C ${CHANNEL_NAME} \
    -n ${CHAINCODE_NAME} \
    -c '{"Args":["getProduct","P000"]}'

echo ""
echo "========================================"
echo "  Fabric Network is READY!"
echo "========================================"
echo ""
echo "Network: test-network"
echo "Channel: ${CHANNEL_NAME}"
echo "Chaincode: ${CHAINCODE_NAME}"
echo "CouchDB UI: http://localhost:5984/_utils"
echo ""
echo "Org1 Peer: localhost:7051"
echo "Org2 Peer: localhost:9051"
echo "Orderer: localhost:7050"
echo ""
echo "To stop: ./stop-network.sh"
