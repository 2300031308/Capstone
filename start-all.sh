#!/bin/bash
# =========================================================
# start-all.sh
# Starts the complete Supply Chain Provenance project:
# 1. Hyperledger Fabric Network (peers, CAs, CouchDB, chaincode)
# 2. Express Backend Server (port 3001)
# 3. React Vite Frontend (port 5173)
# =========================================================

set -e

PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"

echo "========================================================="
echo "  Starting Permissioned Supply-Chain Provenance Stack    "
echo "========================================================="

# 1. Check Docker
if ! docker info > /dev/null 2>&1; then
    echo "❌ Error: Docker Desktop is not running. Please start Docker Desktop first!"
    exit 1
fi
echo "✅ Docker Desktop is running."

# 2. Check if Fabric network is already up
if docker ps --format '{{.Names}}' | grep -q "peer0.org1.example.com"; then
    echo "✅ Hyperledger Fabric network is already running."
else
    echo "🚀 Starting Hyperledger Fabric network and deploying chaincode..."
    cd "${PROJECT_DIR}/fabric-network"
    ./start-network.sh
fi

# 3. Kill any existing backend/frontend instances on ports 3001 & 5173
echo "🧹 Checking ports..."
lsof -ti:3001 | xargs kill -9 2>/dev/null || true
lsof -ti:5173 | xargs kill -9 2>/dev/null || true

# 4. Start Backend Server
echo "🚀 Starting Express Backend on port 3001..."
cd "${PROJECT_DIR}/backend"
nohup node src/server.js > "${PROJECT_DIR}/backend.log" 2>&1 &
BACKEND_PID=$!
echo "   Backend started with PID: ${BACKEND_PID} (logs: backend.log)"

# Wait for backend to be healthy
echo "   Waiting for Fabric Gateway connection..."
for i in {1..30}; do
    if curl -s http://localhost:3001/api/health > /dev/null 2>&1; then
        echo "✅ Backend is healthy and connected to Fabric!"
        break
    fi
    sleep 1
done

# 5. Start Frontend Server
echo "🚀 Starting React Frontend on port 5173..."
cd "${PROJECT_DIR}/frontend"
nohup npx vite --host 0.0.0.0 --port 5173 > "${PROJECT_DIR}/frontend.log" 2>&1 &
FRONTEND_PID=$!
echo "   Frontend started with PID: ${FRONTEND_PID} (logs: frontend.log)"

echo ""
echo "========================================================="
echo "  🎉 Stack is UP and RUNNING!                            "
echo "========================================================="
echo "  • Frontend UI:    http://localhost:5173               "
echo "  • Backend API:    http://localhost:3001/api           "
echo "  • CouchDB UI:     http://localhost:5984/_utils        "
echo "                    (user: admin, pass: adminpw)         "
echo "========================================================="
echo "  To stop everything: ./stop-all.sh                     "
echo "========================================================="
