#!/bin/bash
#
# stop-network.sh
# Tears down the Hyperledger Fabric test-network.
#

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
TEST_NETWORK_DIR="${SCRIPT_DIR}/fabric-samples/test-network"

echo "========================================"
echo "  Stopping Fabric Network"
echo "========================================"

if [ ! -d "${TEST_NETWORK_DIR}" ]; then
    echo "test-network directory not found. Nothing to stop."
    exit 0
fi

cd "${TEST_NETWORK_DIR}"
./network.sh down

echo ""
echo "Fabric network stopped and cleaned up."
