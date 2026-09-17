# Supply Chain Provenance — Architecture

## System Overview

This project implements a permissioned supply-chain provenance system using Hyperledger Fabric as the blockchain layer.

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
Hyperledger Fabric Network
       ├── Peer0.Org1 (ManufacturerOrg) — port 7051
       ├── Peer0.Org2 (DistributorOrg)  — port 9051
       ├── Orderer                       — port 7050
       ├── Fabric CA (Org1, Org2)
       ├── CouchDB (state database)
       ├── Channel: mychannel
       └── Chaincode: supplychain (Node.js)
```

## Security Layers

1. **MSP / X.509**: Fabric participant identity and authorization
2. **SHA-256**: Product data hashing for integrity (O2)
3. **ECDSA**: Manufacturer digital signatures (O2+)
4. **TLS**: Peer-to-peer communication encryption

## Data Model

```json
{
    "productId": "P001",
    "productName": "Smart Device",
    "batchNumber": "B101",
    "manufacturer": "ManufacturerOrg",
    "currentOwner": "ManufacturerOrg",
    "status": "REGISTERED",
    "createdAt": "ISO-8601",
    "updatedAt": "ISO-8601",
    "docType": "product"
}
```
