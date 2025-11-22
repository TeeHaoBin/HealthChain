# MyHealth Smart Contracts Deployment Guide

This guide walks you through deploying the MyHealth EHR smart contracts to various networks and integrating them with your frontend application.

## 📋 Pre-Deployment Checklist

### 1. Environment Setup

```bash
# 1. Install Foundry
curl -L https://foundry.paradigm.xyz | bash
foundryup

# 2. Verify installation
forge --version
cast --version
anvil --version

# 3. Setup environment variables
cp .env.example .env
# Edit .env with your configuration
```

### 2. Required Environment Variables

```bash
# .env file
PRIVATE_KEY=0x... # Your deployment wallet private key
MAINNET_RPC_URL=https://eth-mainnet.alchemyapi.io/v2/YOUR_KEY
SEPOLIA_RPC_URL=https://eth-sepolia.alchemyapi.io/v2/YOUR_KEY
POLYGON_RPC_URL=https://polygon-mainnet.alchemyapi.io/v2/YOUR_KEY
MUMBAI_RPC_URL=https://polygon-mumbai.alchemyapi.io/v2/YOUR_KEY
ETHERSCAN_API_KEY=YOUR_ETHERSCAN_API_KEY
POLYGONSCAN_API_KEY=YOUR_POLYGONSCAN_API_KEY
```

### 3. Pre-Deployment Testing

```bash
# Run all tests
forge test

# Run tests with gas reporting
forge test --gas-report

# Check for compilation warnings
forge build --force
```

## 🚀 Deployment Steps

### Step 1: Local Development Deployment

```bash
# Terminal 1: Start local node
anvil

# Terminal 2: Deploy to local network
forge script script/Deploy.s.sol \
  --rpc-url http://localhost:8545 \
  --private-key 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80 \
  --broadcast

# Note: The private key above is the default anvil key #0
```

Expected output:
```
=== MyHealth EHR System Deployed ===
MyHealthSystem: 0x5FbDB2315678afecb367f032d93F642f64180aa3
AuditLog: 0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512
UserRegistry: 0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0
HealthRecords: 0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9
AccessControl: 0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9
IPFSIntegration: 0x5FC8d32690cc91D4c39d9d3abcBD16989F875707
System initialization: SUCCESS
```

### Step 2: Testnet Deployment (Sepolia)

```bash
# Deploy to Sepolia testnet
forge script script/Deploy.s.sol \
  --rpc-url $SEPOLIA_RPC_URL \
  --private-key $PRIVATE_KEY \
  --broadcast \
  --verify \
  --etherscan-api-key $ETHERSCAN_API_KEY

# Verify contracts individually if auto-verification fails
forge verify-contract \
  --chain-id 11155111 \
  --num-of-optimizations 200 \
  --watch \
  --constructor-args $(cast abi-encode "constructor()" ) \
  --etherscan-api-key $ETHERSCAN_API_KEY \
  --compiler-version v0.8.13+commit.abaa5c0e \
  CONTRACT_ADDRESS \
  src/MyHealthSystem.sol:MyHealthSystem
```

### Step 3: Mainnet Deployment

⚠️ **CAUTION: Mainnet deployment costs real ETH and is irreversible!**

```bash
# Final checks before mainnet
forge test --fork-url $MAINNET_RPC_URL
forge script script/Deploy.s.sol --rpc-url $MAINNET_RPC_URL --private-key $PRIVATE_KEY --dry-run

# Deploy to mainnet (only when ready!)
forge script script/Deploy.s.sol \
  --rpc-url $MAINNET_RPC_URL \
  --private-key $PRIVATE_KEY \
  --broadcast \
  --verify \
  --etherscan-api-key $ETHERSCAN_API_KEY
```

## 🔧 Post-Deployment Configuration

### 1. Contract Verification

If automatic verification fails:

```bash
# Verify MyHealthSystem
forge verify-contract \
  --chain-id 1 \
  --num-of-optimizations 200 \
  --watch \
  --etherscan-api-key $ETHERSCAN_API_KEY \
  --compiler-version v0.8.13+commit.abaa5c0e \
  YOUR_CONTRACT_ADDRESS \
  src/MyHealthSystem.sol:MyHealthSystem

# Verify other contracts similarly
```

### 2. Initial System Configuration

```bash
# Connect to deployed system
cast call YOUR_MYHEALTH_SYSTEM_ADDRESS \
  "isSystemReady()" \
  --rpc-url $SEPOLIA_RPC_URL

# Should return: 0x0000000000000000000000000000000000000000000000000000000000000001 (true)
```

### 3. Setup Initial Admin Users

```javascript
// Using cast or web3 interface
// Add emergency providers
cast send YOUR_ACCESS_CONTROL_ADDRESS \
  "addEmergencyProvider(address)" \
  EMERGENCY_DOCTOR_ADDRESS \
  --private-key $PRIVATE_KEY \
  --rpc-url $SEPOLIA_RPC_URL
```

## 🔗 Frontend Integration

### 1. Update Frontend Configuration

Copy contract addresses to your frontend:

```typescript
// frontend/src/constants/contracts.ts
export const CONTRACTS = {
  MyHealthSystem: "0x...",
  UserRegistry: "0x...",
  HealthRecords: "0x...",
  AccessControl: "0x...",
  AuditLog: "0x...",
  IPFSIntegration: "0x...",
} as const;

export const NETWORK_CONFIG = {
  chainId: 11155111, // Sepolia
  chainName: "Sepolia",
  rpcUrl: "https://sepolia.infura.io/v3/YOUR_KEY",
  blockExplorer: "https://sepolia.etherscan.io"
};
```

### 2. Update Supabase Configuration

Add contract addresses to your Supabase environment:

```sql
-- Add to Supabase settings or environment table
INSERT INTO app_config (key, value) VALUES 
('contract_myhealth_system', '0x...'),
('contract_user_registry', '0x...'),
('contract_health_records', '0x...'),
('contract_access_control', '0x...'),
('contract_audit_log', '0x...'),
('contract_ipfs_integration', '0x...');
```

### 3. Update Web3 Provider Configuration

```typescript
// frontend/src/lib/web3/config.ts
import { CONTRACTS, NETWORK_CONFIG } from '../constants/contracts';

export const web3Config = {
  ...NETWORK_CONFIG,
  contracts: CONTRACTS,
  // Add ABIs
  abis: {
    MyHealthSystem: MyHealthSystemABI,
    UserRegistry: UserRegistryABI,
    HealthRecords: HealthRecordsABI,
    // ... other ABIs
  }
};
```

## 📊 Monitoring and Maintenance

### 1. Contract Health Checks

Create monitoring scripts:

```bash
# Check system status
cast call $MYHEALTH_SYSTEM_ADDRESS \
  "isSystemReady()" \
  --rpc-url $RPC_URL

# Get system statistics
cast call $MYHEALTH_SYSTEM_ADDRESS \
  "getSystemStats()" \
  --rpc-url $RPC_URL
```

### 2. Gas Monitoring

```bash
# Monitor gas usage for common operations
forge test --gas-report > gas-report.txt

# Set up alerts for high gas usage
```

### 3. Event Monitoring

Set up event listeners for critical events:

```javascript
// Monitor critical events
const healthRecords = new ethers.Contract(address, abi, provider);

healthRecords.on("RecordStored", (recordId, patient, ipfsHash, timestamp) => {
  console.log("New record stored:", { recordId, patient, ipfsHash });
  // Send to monitoring system
});

healthRecords.on("AccessGranted", (recordId, patient, provider, expiresAt) => {
  console.log("Access granted:", { recordId, patient, provider });
  // Update Supabase
});
```

## 🚨 Emergency Procedures

### 1. Emergency Pause

```bash
# In case of emergency, pause the system
cast send $MYHEALTH_SYSTEM_ADDRESS \
  "emergencyPause()" \
  --private-key $ADMIN_PRIVATE_KEY \
  --rpc-url $RPC_URL
```

### 2. Contract Upgrades

The current contracts are not upgradeable. For upgrades:

1. Deploy new contracts
2. Migrate data (if possible)
3. Update frontend configuration
4. Notify users of the upgrade

### 3. Access Recovery

```bash
# Grant emergency access if needed
cast send $ACCESS_CONTROL_ADDRESS \
  "grantEmergencyAccess(bytes32,string)" \
  $RECORD_ID \
  "Emergency medical situation" \
  --private-key $EMERGENCY_PROVIDER_KEY \
  --rpc-url $RPC_URL
```

## 📈 Cost Optimization

### 1. Gas Optimization Tips

- Use batch operations when possible
- Deploy during low gas periods
- Consider Layer 2 solutions (Polygon, Arbitrum)

### 2. Network Selection

| Network | Gas Cost | Finality | Decentralization |
|---------|----------|----------|------------------|
| Ethereum Mainnet | High | ~15 min | High |
| Polygon | Low | ~30 sec | Medium |
| Arbitrum | Medium | ~1 min | Medium |
| Sepolia (Testnet) | Free | ~15 min | High |

### 3. Recommended Production Setup

For production, consider:

1. **Primary**: Ethereum Mainnet (for critical records)
2. **Secondary**: Polygon (for frequent operations)
3. **Bridge**: Cross-chain compatibility

## 🔒 Security Considerations

### 1. Private Key Management

- Use hardware wallets for mainnet deployments
- Implement multi-sig for critical operations
- Rotate keys regularly

### 2. Contract Security

- Regular security audits
- Bug bounty programs
- Formal verification for critical functions

### 3. Operational Security

- Monitor for unusual activity
- Implement rate limiting
- Set up alerting systems

## 📞 Support and Troubleshooting

### Common Issues

1. **"Insufficient funds for gas"**
   - Check ETH balance in deployment wallet
   - Reduce gas price or gas limit

2. **"Contract verification failed"**
   - Check compiler version matches
   - Verify constructor arguments
   - Try manual verification

3. **"Transaction reverted"**
   - Check function parameters
   - Verify caller permissions
   - Review error messages

### Getting Help

- Check the GitHub issues
- Review Foundry documentation
- Join the community Discord
- Contact the development team

## ✅ Deployment Checklist

- [ ] Environment variables configured
- [ ] Tests passing
- [ ] Gas costs estimated
- [ ] Deployment wallet funded
- [ ] Network configuration verified
- [ ] Backup deployment key secured
- [ ] Frontend integration planned
- [ ] Monitoring systems ready
- [ ] Emergency procedures documented
- [ ] Team notified of deployment

Congratulations! Your MyHealth EHR smart contracts are now deployed and ready for integration with your Supabase backend and Pinata IPFS storage system.