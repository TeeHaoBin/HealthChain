// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import "./IAuditLog.sol";

/**
 * @title AuditLog
 * @dev Comprehensive audit logging for HIPAA compliance
 */
contract AuditLog is IAuditLog {
    // State variables
    mapping(bytes32 => AuditEntry) private auditEntries;
    mapping(bytes32 => bytes32[]) private resourceAuditTrail;
    mapping(address => bytes32[]) private userAuditTrail;
    mapping(ActionType => bytes32[]) private actionAuditTrail;
    
    bytes32[] private allLogIds;
    mapping(address => bool) private authorizedContracts;
    address public owner;
    
    uint256 private logCounter;
    
    // Modifiers
    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this function");
        _;
    }
    
    modifier onlyAuthorized() {
        require(
            authorizedContracts[msg.sender] || msg.sender == owner,
            "Only authorized contracts can log"
        );
        _;
    }
    
    constructor() {
        owner = msg.sender;
        authorizedContracts[msg.sender] = true;
        logCounter = 0;
    }
    
    /**
     * @dev Log an action to the audit trail
     */
    function logAction(
        address actor,
        address target,
        ActionType action,
        bytes32 resourceId,
        string calldata details
    ) external override onlyAuthorized returns (bytes32 logId) {
        logCounter++;
        logId = keccak256(abi.encodePacked(
            block.timestamp,
            block.number,
            actor,
            target,
            action,
            resourceId,
            logCounter
        ));
        
        auditEntries[logId] = AuditEntry({
            id: logId,
            actor: actor,
            target: target,
            action: action,
            resourceId: resourceId,
            details: details,
            timestamp: block.timestamp,
            blockNumber: block.number,
            transactionHash: bytes32(0) // Will be set by external indexer
        });
        
        // Update indices
        allLogIds.push(logId);
        resourceAuditTrail[resourceId].push(logId);
        userAuditTrail[actor].push(logId);
        if (actor != target) {
            userAuditTrail[target].push(logId);
        }
        actionAuditTrail[action].push(logId);
        
        emit ActionLogged(logId, actor, target, action, resourceId, block.timestamp);
        
        return logId;
    }
    
    // View functions
    function getAuditEntry(bytes32 logId) external view override returns (AuditEntry memory) {
        require(auditEntries[logId].id != bytes32(0), "Audit entry not found");
        return auditEntries[logId];
    }
    
    function getAuditTrail(bytes32 resourceId) external view override returns (bytes32[] memory) {
        return resourceAuditTrail[resourceId];
    }
    
    function getUserAuditTrail(address user) external view override returns (bytes32[] memory) {
        return userAuditTrail[user];
    }
    
    function getAuditEntriesByTimeRange(
        uint256 startTime,
        uint256 endTime
    ) external view override returns (bytes32[] memory) {
        require(startTime <= endTime, "Invalid time range");
        
        bytes32[] memory result = new bytes32[](allLogIds.length);
        uint256 count = 0;
        
        for (uint256 i = 0; i < allLogIds.length; i++) {
            bytes32 logId = allLogIds[i];
            AuditEntry memory entry = auditEntries[logId];
            
            if (entry.timestamp >= startTime && entry.timestamp <= endTime) {
                result[count] = logId;
                count++;
            }
        }
        
        // Resize array to actual count
        bytes32[] memory filteredResult = new bytes32[](count);
        for (uint256 i = 0; i < count; i++) {
            filteredResult[i] = result[i];
        }
        
        return filteredResult;
    }
    
    function getAuditEntriesByAction(ActionType action) external view override returns (bytes32[] memory) {
        return actionAuditTrail[action];
    }
    
    // Additional view functions for compliance
    function getTotalLogCount() external view returns (uint256) {
        return allLogIds.length;
    }
    
    function getLogIdByIndex(uint256 index) external view returns (bytes32) {
        require(index < allLogIds.length, "Index out of bounds");
        return allLogIds[index];
    }
    
    function getRecentLogs(uint256 count) external view returns (bytes32[] memory) {
        require(count > 0, "Count must be greater than 0");
        
        uint256 totalLogs = allLogIds.length;
        uint256 actualCount = count > totalLogs ? totalLogs : count;
        
        bytes32[] memory recentLogs = new bytes32[](actualCount);
        
        for (uint256 i = 0; i < actualCount; i++) {
            recentLogs[i] = allLogIds[totalLogs - actualCount + i];
        }
        
        return recentLogs;
    }
    
    // Admin functions
    function authorizeContract(address contractAddress) external onlyOwner {
        require(contractAddress != address(0), "Invalid contract address");
        authorizedContracts[contractAddress] = true;
    }
    
    function revokeContractAuthorization(address contractAddress) external onlyOwner {
        authorizedContracts[contractAddress] = false;
    }
    
    function isAuthorizedContract(address contractAddress) external view returns (bool) {
        return authorizedContracts[contractAddress];
    }
    
    // Emergency functions
    function pause() external onlyOwner {
        // Implementation would pause logging if needed
        // For this audit log, we keep it simple and always active
    }
    
    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "Invalid new owner");
        owner = newOwner;
        authorizedContracts[newOwner] = true;
    }
}