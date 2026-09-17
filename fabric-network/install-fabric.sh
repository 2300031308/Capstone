#!/bin/bash
#
# install-fabric.sh
# Downloads Hyperledger Fabric binaries, Docker images, and fabric-samples.
# Run this once before starting the network.
#

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
FABRIC_SAMPLES_DIR="${SCRIPT_DIR}/fabric-samples"

echo "========================================"
echo "  Hyperledger Fabric Installer"
echo "========================================"

# Check prerequisites
command -v docker >/dev/null 2>&1 || { echo "ERROR: Docker is not installed."; exit 1; }
command -v curl >/dev/null 2>&1 || { echo "ERROR: curl is not installed."; exit 1; }

if [ -d "${FABRIC_SAMPLES_DIR}" ]; then
    echo "fabric-samples already exists at ${FABRIC_SAMPLES_DIR}"
    echo "Skipping download. Delete the directory to re-download."
else
    echo "Downloading Fabric samples, binaries, and Docker images..."
    cd "${SCRIPT_DIR}"
    curl -sSLO https://raw.githubusercontent.com/hyperledger/fabric/main/scripts/install-fabric.sh
    chmod +x install-fabric.sh
    bash install-fabric.sh --fabric-version 2.5.12 docker samples binary
    echo "Fabric installation completed."
fi

echo ""
echo "Verifying installation..."
echo "fabric-samples: $(ls ${FABRIC_SAMPLES_DIR} 2>/dev/null | head -5)"
echo "Docker images:"
docker images | grep hyperledger | head -10
echo ""
echo "Installation complete!"
echo "Next step: Run ./start-network.sh to start the Fabric network."
