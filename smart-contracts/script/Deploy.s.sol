// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import "forge-std/Script.sol";
import "../src/MyHealthSystem.sol";
import "../src/IPFSIntegration.sol";

/**
 * @title Deploy
 * @dev Deployment script for the MyHealth EHR system
 */
contract Deploy is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        vm.startBroadcast(deployerPrivateKey);
        
        // Deploy the main system
        MyHealthSystem myHealthSystem = new MyHealthSystem();
        
        // Deploy IPFS integration
        IPFSIntegration ipfsIntegration = new IPFSIntegration();
        
        // Get contract addresses
        (
            address auditLog,
            address userRegistry,
            address healthRecords,
            address accessControl
        ) = myHealthSystem.getContractAddresses();
        
        // Log deployment information
        console.log("=== MyHealth EHR System Deployed ===");
        console.log("MyHealthSystem:", address(myHealthSystem));
        console.log("AuditLog:", auditLog);
        console.log("UserRegistry:", userRegistry);
        console.log("HealthRecords:", healthRecords);
        console.log("AccessControl:", accessControl);
        console.log("IPFSIntegration:", address(ipfsIntegration));
        
        // Verify system is ready
        require(myHealthSystem.isSystemReady(), "System not properly initialized");
        console.log("System initialization: SUCCESS");
        
        vm.stopBroadcast();
        
        // Write addresses to file for frontend integration
        _writeDeploymentInfo(
            address(myHealthSystem),
            auditLog,
            userRegistry,
            healthRecords,
            accessControl,
            address(ipfsIntegration)
        );
    }
    
    function _writeDeploymentInfo(
        address myHealthSystem,
        address auditLog,
        address userRegistry,
        address healthRecords,
        address accessControl,
        address ipfsIntegration
    ) internal {
        string memory json = string(abi.encodePacked(
            "{\n",
            '  "MyHealthSystem": "', vm.toString(myHealthSystem), '",\n',
            '  "AuditLog": "', vm.toString(auditLog), '",\n',
            '  "UserRegistry": "', vm.toString(userRegistry), '",\n',
            '  "HealthRecords": "', vm.toString(healthRecords), '",\n',
            '  "AccessControl": "', vm.toString(accessControl), '",\n',
            '  "IPFSIntegration": "', vm.toString(ipfsIntegration), '",\n',
            '  "deployedAt": ', vm.toString(block.timestamp), ',\n',
            '  "network": "', _getNetworkName(), '"\n',
            "}"
        ));
        
        vm.writeFile("./deployments/latest.json", json);
        console.log("Deployment info written to: ./deployments/latest.json");
    }
    
    function _getNetworkName() internal view returns (string memory) {
        uint256 chainId = block.chainid;
        
        if (chainId == 1) return "mainnet";
        if (chainId == 5) return "goerli";
        if (chainId == 11155111) return "sepolia";
        if (chainId == 137) return "polygon";
        if (chainId == 80001) return "mumbai";
        if (chainId == 31337) return "localhost";
        
        return "unknown";
    }
}