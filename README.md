# Permissioned Supply-Chain Provenance on Hyperledger Fabric

A blockchain-powered supply chain provenance system built on **Hyperledger Fabric** that provides secure product registration, authentication, ownership transfer, and provenance tracking.

## Architecture

```
React Frontend (Vite, port 5173)
       │
       │ REST API (Axios HTTP)
       ▼
Node.js + Express Backend (port 3001)
       │
       │ @hyperledger/fabric-gateway (gRPC)
       ▼
Hyperledger Fabric 2.5 Network
       │
       ├── Peer0.Org1 (ManufacturerOrg) — port 7051
       ├── Peer0.Org2 (DistributorOrg)  — port 9051
       ├── Orderer                       — port 7050
       ├── Fabric CA (Org1)             — port 7054
       ├── Fabric CA (Org2)             — port 8054
       ├── CouchDB                      — port 5984
       ├── Channel: mychannel
       └── Chaincode: supplychain (Node.js)
```

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, Vite, React Router, Axios |
| Backend | Node.js, Express.js, Fabric Gateway SDK |
| Blockchain | Hyperledger Fabric 2.5, Node.js Chaincode |
| Database | Fabric World State (CouchDB) |
| Security | SHA-256, ECDSA, X.509/MSP |
| Containers | Docker, Docker Compose |

## Project Structure

```
CP/
├── frontend/          # React + Vite application
├── backend/           # Express.js + Fabric Gateway
├── chaincode/         # Hyperledger Fabric chaincode (Node.js)
├── fabric-network/    # Network setup scripts
├── tests/             # Unit and integration tests
├── docs/              # Documentation
└── docker/            # Additional Docker configs
```

## Prerequisites

- **Docker Desktop** (with Docker Compose v2)
- **Node.js** >= 18
- **Git**
- **curl**

## Quick Start

### 1. Install Fabric

```bash
cd fabric-network
chmod +x install-fabric.sh
./install-fabric.sh
```

### 2. Start the Fabric Network

```bash
chmod +x start-network.sh
./start-network.sh
```

This will:
- Start peers, orderers, CAs, and CouchDB
- Create the `mychannel` channel
- Deploy the `supplychain` chaincode
- Initialize the ledger with a sample product

### 3. Start the Backend

```bash
cd backend
npm install
npm start
```

The API will be available at `http://localhost:3001/api`

### 4. Start the Frontend

```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173` in your browser.

### 5. Stop Everything

```bash
cd fabric-network
./stop-network.sh
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Health check |
| POST | `/api/products` | Register a new product |
| GET | `/api/products` | Get all products |
| GET | `/api/products/:id` | Get product by ID |
| POST | `/api/products/:id/transfer` | Transfer ownership |
| GET | `/api/products/:id/history` | Get product history |

## Objectives

- [x] **O1**: Fabric network setup + product storage/retrieval
- [ ] **O2**: Product registration with QR + SHA-256 + ECDSA
- [ ] **O3**: Digital signature verification
- [ ] **O4**: Ownership-based dynamic access control
- [ ] **O5**: Customer verification + provenance history

## System Actors

| Actor | Role |
|-------|------|
| Manufacturer | Register products, sign data, initiate transfers |
| Distributor | Receive/verify products, transfer to retailer |
| Retailer | Receive/verify products, complete sales |
| Customer | Scan QR, verify authenticity, view provenance |

## License

Academic Capstone Project
