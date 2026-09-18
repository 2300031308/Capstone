#!/bin/bash
# =========================================================
# stop-all.sh
# Stops the complete Supply Chain Provenance project:
# 1. Kills frontend (port 5173) and backend (port 3001)
# 2. Tears down Hyperledger Fabric network & Docker containers
# =========================================================

PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"

echo "========================================================="
echo "  Stopping Permissioned Supply-Chain Provenance Stack    "
echo "========================================================="

echo "1. Stopping Frontend and Backend servers..."
lsof -ti:3001 | xargs kill -9 2>/dev/null || true
lsof -ti:5173 | xargs kill -9 2>/dev/null || true
echo "   Servers stopped."

echo "2. Tearing down Hyperledger Fabric network..."
cd "${PROJECT_DIR}/fabric-network"
./stop-network.sh 2>/dev/null || true

echo "✅ All services and Fabric containers stopped successfully."
