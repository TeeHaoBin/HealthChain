// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

/**
 * @title IAuditLog
 * @dev Interface for comprehensive audit logging
 */
interface IAuditLog {
    // Enums
    enum ActionType {
        RECORD_CREATED,
        RECORD_ACCESSED,
        ACCESS_GRANTED,
        ACCESS_REVOKED,
        USER_REGISTERED,
        KYC_SUBMITTED,
        KYC_VERIFIED,
        ROLE_UPDATED
    }
    
    // Events
    event ActionLogged(
        bytes32 indexed logId,
        address indexed actor,
        address indexed target,
        ActionType action,
        bytes32 resourceId,
        uint256 timestamp
    );
    
    // Structs
    struct AuditEntry {
        bytes32 id;
        address actor;
        address target;
        ActionType action;
        bytes32 resourceId;
        string details;
        uint256 timestamp;
        uint256 blockNumber;
        bytes32 transactionHash;
    }
    
    // Core functions
    function logAction(
        address actor,
        address target,
        ActionType action,
        bytes32 resourceId,
        string calldata details
    ) external returns (bytes32 logId);
    
    // View functions
    function getAuditEntry(bytes32 logId) external view returns (AuditEntry memory);
    
    function getAuditTrail(bytes32 resourceId) external view returns (bytes32[] memory);
    
    function getUserAuditTrail(address user) external view returns (bytes32[] memory);
    
    function getAuditEntriesByTimeRange(
        uint256 startTime,
        uint256 endTime
    ) external view returns (bytes32[] memory);
    
    function getAuditEntriesByAction(ActionType action) external view returns (bytes32[] memory);
}