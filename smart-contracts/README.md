# MyHealth EHR Smart Contracts

This directory contains all the Solidity smart contracts for the MyHealth decentralized Electronic Health Records (EHR) system. The contracts are designed to work seamlessly with Supabase (Web2 database) and Pinata IPFS (decentralized storage).

## 🏗️ Architecture Overview

The smart contract system consists of several interconnected contracts that provide a complete healthcare data management solution:

### Core Contracts

1. **MyHealthSystem.sol** - Main system contract that deploys and manages all other contracts
2. **UserRegistry.sol** - Manages user registration, roles, and KYC verification
3. **HealthRecords.sol** - Core contract for storing and managing health records
4. **AuditLog.sol** - Comprehensive audit logging for HIPAA compliance
5. **AccessControl.sol** - Advanced access control and permission management
6. **IPFSIntegration.sol** - Utility contract for IPFS hash validation and metadata

### Interface Contracts

- **IUserRegistry.sol** - Interface for user management
- **IHealthRecords.sol** - Interface for health records management
- **IAuditLog.sol** - Interface for audit logging

## 🔄 Integration with Web2 & IPFS

### Data Flow
1. **Patient uploads medical file** → Frontend encrypts and uploads to Pinata IPFS
2. **IPFS returns hash** → Smart contract stores hash + metadata in blockchain
3. **Metadata stored in Supabase** → Database stores IPFS hash for fast queries
4. **Access control enforced** → Smart contracts manage permissions immutably
5. **Audit trail maintained** → All actions logged on blockchain for compliance

### Key Features

- **Immutable Access Control**: All permissions recorded on blockchain
- **HIPAA Compliance**: Comprehensive audit logging
- **Emergency Access**: Healthcare providers can access records in emergencies
- **KYC Integration**: Users must be verified before accessing system
- **Role-Based Permissions**: Patients, Doctors, and Admins have different capabilities

## 🚀 Quick Start

### Prerequisites

- [Foundry](https://book.getfoundry.sh/getting-started/installation) installed
- Node.js and npm (for frontend integration)
- Access to an Ethereum-compatible network

### Installation

```bash
# Clone the repository (if not already done)
cd smart-contracts

# Install dependencies
forge install

# Build contracts
forge build
```

### Environment Setup

```bash
# Copy environment template
cp .env.example .env

# Edit .env with your configuration
# Add your private key and RPC URLs
```

### Testing

```bash
# Run all tests
forge test

# Run tests with verbose output
forge test -vvv

# Run specific test
forge test --match-test testSystemDeployment

# Generate gas report
forge test --gas-report
```

### Deployment

```bash
# Deploy to local network (Anvil)
anvil # In another terminal
forge script script/Deploy.s.sol --rpc-url http://localhost:8545 --broadcast

# Deploy to testnet (e.g., Sepolia)
forge script script/Deploy.s.sol --rpc-url $SEPOLIA_RPC_URL --broadcast --verify

# Deploy to mainnet (use with caution)
forge script script/Deploy.s.sol --rpc-url $MAINNET_RPC_URL --broadcast --verify
```

## 📋 Contract Details

### UserRegistry Contract

Manages user registration and KYC verification:

```solidity
// Register as a patient
userRegistry.registerUser(UserRole.PATIENT);

// Submit KYC documents (IPFS hash)
userRegistry.submitKYC("QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG");

// Admin verifies KYC
userRegistry.updateKYCStatus(userAddress, KYCStatus.VERIFIED);
```

### HealthRecords Contract

Store and manage health records:

```solidity
// Store a new health record
bytes32 recordId = healthRecords.storeRecord(
    "QmIPFSHash...", // IPFS hash from Pinata
    "encryption-key-id", // Reference to encryption key
    "Blood Test Results", // Title
    "Lab Results" // Category
);

// Grant access to a doctor
healthRecords.grantAccess(
    recordId,
    doctorAddress,
    7 days, // Duration
    "Medical consultation" // Purpose
);
```

### AccessControl Contract

Advanced permission management:

```solidity
// Request access to patient records
bytes32 requestId = accessControl.requestAccess(
    patientAddress,
    recordId,
    PermissionType.READ,
    24 hours,
    "Emergency consultation",
    "Patient shows symptoms requiring immediate review"
);

// Patient approves the request
accessControl.approveAccessRequest(requestId, 12 hours);
```

## 🔒 Security Features

### Access Control
- Role-based permissions (Patient, Doctor, Admin)
- Time-limited access grants
- Emergency access for critical situations
- Immutable permission history

### Audit Compliance
- Every action logged with timestamp and details
- Comprehensive audit trails for HIPAA compliance
- Blockchain-based immutable records
- Gas-efficient logging system

### Data Protection
- IPFS hashes stored on-chain (not actual data)
- Encryption key references (actual keys stored securely off-chain)
- Patient-controlled access permissions
- Automated access expiration

## 🧪 Testing

The test suite covers:

- **Unit Tests**: Individual contract functionality
- **Integration Tests**: Contract interactions
- **Security Tests**: Access control and permissions
- **Gas Optimization**: Efficient contract execution

### Test Coverage

```bash
# Generate coverage report
forge coverage

# Generate detailed coverage report
forge coverage --report lcov
```

## 📊 Gas Optimization

The contracts are optimized for gas efficiency:

- Batch operations for multiple records
- Efficient storage patterns
- Minimal external calls
- Gas-optimized data structures

## 🔧 Frontend Integration

### Contract Addresses

After deployment, contract addresses are saved to `deployments/latest.json`:

```json
{
  "MyHealthSystem": "0x...",
  "UserRegistry": "0x...",
  "HealthRecords": "0x...",
  "AccessControl": "0x...",
  "AuditLog": "0x...",
  "IPFSIntegration": "0x..."
}
```

### Web3 Integration Example

```typescript
// In your frontend (using ethers.js)
import { ethers } from 'ethers';
import deployments from '../smart-contracts/deployments/latest.json';

const provider = new ethers.providers.Web3Provider(window.ethereum);
const signer = provider.getSigner();

const healthRecords = new ethers.Contract(
  deployments.HealthRecords,
  HealthRecordsABI,
  signer
);

// Store a record
const tx = await healthRecords.storeRecord(
  ipfsHash,
  encryptionKeyId,
  title,
  category
);
```

## 🔄 Integration Workflow

### Patient Upload Flow
1. Patient uploads file to Pinata IPFS via frontend
2. Frontend encrypts file and gets IPFS hash
3. Smart contract stores IPFS hash + metadata
4. Supabase stores record metadata for fast queries
5. Audit log records the action

### Doctor Access Flow
1. Doctor requests access via smart contract
2. Patient receives notification (via Supabase webhook)
3. Patient approves/rejects via smart contract
4. If approved, doctor can access IPFS file
5. All actions logged for audit compliance

## 📚 Additional Resources

- [Foundry Documentation](https://book.getfoundry.sh/)
- [Solidity Documentation](https://docs.soliditylang.org/)
- [IPFS Documentation](https://docs.ipfs.io/)
- [Ethereum Development Guide](https://ethereum.org/en/developers/)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Write tests for new functionality
4. Ensure all tests pass
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.
