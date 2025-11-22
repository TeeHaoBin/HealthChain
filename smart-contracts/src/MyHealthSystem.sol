// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import "./UserRegistry.sol";
import "./HealthRecords.sol";
import "./AuditLog.sol";
import "./AccessControl.sol";

/**
 * @title MyHealthSystem
 * @dev Main contract that deploys and manages the entire EHR system
 */
contract MyHealthSystem {
    // Contract instances
    AuditLog public auditLog;
    UserRegistry public userRegistry;
    HealthRecords public healthRecords;
    AccessControl public accessControl;
    
    address public owner;
    string public constant VERSION = "1.0.0";
    
    // Events
    event SystemDeployed(
        address auditLog,
        address userRegistry,
        address healthRecords,
        address accessControl,
        uint256 timestamp
    );
    
    event SystemUpgraded(
        address newContract,
        string contractType,
        uint256 timestamp
    );
    
    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this function");
        _;
    }
    
    constructor() {
        owner = msg.sender;
        
        // Deploy contracts in correct order
        auditLog = new AuditLog();
        userRegistry = new UserRegistry(address(auditLog));
        healthRecords = new HealthRecords(address(userRegistry), address(auditLog));
        accessControl = new AccessControl(address(userRegistry), address(auditLog));
        
        // Authorize contracts to use audit log
        auditLog.authorizeContract(address(userRegistry));
        auditLog.authorizeContract(address(healthRecords));
        auditLog.authorizeContract(address(accessControl));
        
        emit SystemDeployed(
            address(auditLog),
            address(userRegistry),
            address(healthRecords),
            address(accessControl),
            block.timestamp
        );
    }
    
    /**
     * @dev Get all contract addresses
     */
    function getContractAddresses() external view returns (
        address _auditLog,
        address _userRegistry,
        address _healthRecords,
        address _accessControl
    ) {
        return (
            address(auditLog),
            address(userRegistry),
            address(healthRecords),
            address(accessControl)
        );
    }
    
    /**
     * @dev Check if system is properly initialized
     */
    function isSystemReady() external view returns (bool) {
        return address(auditLog) != address(0) &&
               address(userRegistry) != address(0) &&
               address(healthRecords) != address(0) &&
               address(accessControl) != address(0);
    }
    
    /**
     * @dev Get system statistics
     */
    function getSystemStats() external view returns (
        uint256 totalUsers,
        uint256 totalRecords,
        uint256 totalAuditLogs
    ) {
        // Get stats from individual contracts
        totalAuditLogs = auditLog.getTotalLogCount();
        totalRecords = healthRecords.getTotalRecordCount();
        
        // Count users by role
        address[] memory patients = userRegistry.getUsersByRole(IUserRegistry.UserRole.PATIENT);
        address[] memory doctors = userRegistry.getUsersByRole(IUserRegistry.UserRole.DOCTOR);
        address[] memory admins = userRegistry.getUsersByRole(IUserRegistry.UserRole.ADMIN);
        
        totalUsers = patients.length + doctors.length + admins.length;
        
        return (totalUsers, totalRecords, totalAuditLogs);
    }
    
    /**
     * @dev Emergency pause functionality
     */
    function emergencyPause() external onlyOwner {
        // In a production system, this would pause all operations
        // For now, we'll emit an event
        auditLog.logAction(
            msg.sender,
            address(this),
            IAuditLog.ActionType.USER_REGISTERED, // Using available action type
            bytes32(uint256(uint160(address(this)))),
            "System emergency pause activated"
        );
    }
    
    /**
     * @dev Transfer ownership of the system
     */
    function transferSystemOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "Invalid new owner");
        
        // Transfer ownership of all contracts
        auditLog.transferOwnership(newOwner);
        // Note: UserRegistry and other contracts don't have transferOwnership
        // In production, you'd implement this pattern across all contracts
        
        owner = newOwner;
    }
    
    /**
     * @dev Get contract version information
     */
    function getVersionInfo() external pure returns (
        string memory version,
        uint256 deployedAt
    ) {
        return (VERSION, block.timestamp);
    }
}