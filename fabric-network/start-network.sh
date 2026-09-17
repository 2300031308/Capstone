#!/bin/bash
#
# start-network.sh
# Starts the Hyperledger Fabric test-network, creates a channel,
# and deploys the supply chain chaincode.
#

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# Use the real (resolved) path for fabric-samples (not the symlink)
# This is needed because Docker on macOS cannot mount from ~/Desktop
FABRIC_SAMPLES_DIR="$(cd "${SCRIPT_DIR}/fabric-samples" && pwd -P)"
TEST_NETWORK_DIR="${FABRIC_SAMPLES_DIR}/test-network"

# Chaincode is copied to a Docker-accessible location
CHAINCODE_DIR="${FABRIC_SAMPLES_DIR}/chaincode-supplychain"

CHANNEL_NAME="mychannel"
CHAINCODE_NAME="supplychain"
CHAINCODE_VERSION="1.0"
CHAINCODE_SEQUENCE="1"

echo "========================================"
echo "  Starting Fabric Network"
echo "========================================"
echo ""
echo "  Fabric samples: ${FABRIC_SAMPLES_DIR}"
echo "  Test network:   ${TEST_NETWORK_DIR}"
echo "  Chaincode:      ${CHAINCODE_DIR}"

# Check prerequisites
if [ ! -d "${TEST_NETWORK_DIR}" ]; then
    echo "ERROR: test-network not found at ${TEST_NETWORK_DIR}"
    echo "Run ./install-fabric.sh first."
    exit 1
fi

# Sync chaincode from project to Docker-accessible location
echo ""
echo "Syncing chaincode to Docker-accessible location..."
rm -rf "${CHAINCODE_DIR}"
cp -r "${PROJECT_ROOT}/chaincode" "${CHAINCODE_DIR}"
rm -rf "${CHAINCODE_DIR}/node_modules"
find "${CHAINCODE_DIR}" -name '.DS_Store' -delete

# Add Fabric binaries to PATH
export PATH="${FABRIC_SAMPLES_DIR}/bin:$PATH"
export FABRIC_CFG_PATH="${FABRIC_SAMPLES_DIR}/config/"

echo ""
echo "Step 1: Bringing down any existing network..."
cd "${TEST_NETWORK_DIR}"
./network.sh down 2>/dev/null || true

echo ""
echo "Step 2: Starting the network with Certificate Authorities and CouchDB..."
./network.sh up createChannel -ca -s couchdb -c ${CHANNEL_NAME}

echo ""
echo "Step 3: Deploying chaincode..."
./network.sh deployCC \
    -ccn ${CHAINCODE_NAME} \
    -ccp "${CHAINCODE_DIR}" \
    -ccl javascript \
    -c ${CHANNEL_NAME} \
    -ccv ${CHAINCODE_VERSION} \
    -ccs ${CHAINCODE_SEQUENCE}

echo ""
echo "Step 5: Initializing the ledger..."

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
    --cafile "${TEST_NETWORK_DIR}/organizations/ordererOrganizations/example.com/tlsca/tlsca.example.com-cert.pem" \
    -C ${CHANNEL_NAME} \
    -n ${CHAINCODE_NAME} \
    --peerAddresses localhost:7051 \
    --tlsRootCertFiles "${TEST_NETWORK_DIR}/organizations/peerOrganizations/org1.example.com/tlsca/tlsca.org1.example.com-cert.pem" \
    --peerAddresses localhost:9051 \
    --tlsRootCertFiles "${TEST_NETWORK_DIR}/organizations/peerOrganizations/org2.example.com/tlsca/tlsca.org2.example.com-cert.pem" \
    -c '{"Args":["initLedger"]}'

sleep 3

echo ""
echo "Step 6: Verifying deployment..."

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
