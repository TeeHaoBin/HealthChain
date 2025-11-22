// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import "./IHealthRecords.sol";
import "./IUserRegistry.sol";
import "./IAuditLog.sol";

/**
 * @title HealthRecords
 * @dev Main contract for managing health records with IPFS integration
 */
contract HealthRecords is IHealthRecords {
    // State variables
    mapping(bytes32 => HealthRecord) private records;
    mapping(address => bytes32[]) private patientRecords;
    mapping(bytes32 => mapping(address => AccessPermission)) private accessPermissions;
    mapping(bytes32 => address[]) private recordProviders;
    
    IUserRegistry public userRegistry;
    IAuditLog public auditLog;
    
    uint256 private recordCounter;
    
    // Modifiers
    modifier onlyVerifiedUser() {
        require(userRegistry.isVerifiedUser(msg.sender), "User not verified");
        _;
    }
    
    modifier onlyPatient() {
        require(
            userRegistry.getUserRole(msg.sender) == IUserRegistry.UserRole.PATIENT,
            "Only patients can call this function"
        );
        _;
    }
    
    modifier onlyProvider() {
        IUserRegistry.UserRole role = userRegistry.getUserRole(msg.sender);
        require(
            role == IUserRegistry.UserRole.DOCTOR || role == IUserRegistry.UserRole.ADMIN,
            "Only healthcare providers can call this function"
        );
        _;
    }
    
    modifier onlyRecordOwner(bytes32 recordId) {
        require(records[recordId].patient == msg.sender, "Only record owner can call this function");
        _;
    }
    
    modifier recordExists(bytes32 recordId) {
        require(records[recordId].id != bytes32(0), "Record does not exist");
        _;
    }
    
    modifier hasValidAccess(bytes32 recordId) {
        require(_hasValidAccess(recordId, msg.sender), "Access denied or expired");
        _;
    }
    
    constructor(address _userRegistryAddress, address _auditLogAddress) {
        userRegistry = IUserRegistry(_userRegistryAddress);
        auditLog = IAuditLog(_auditLogAddress);
        recordCounter = 0;
    }
    
    /**
     * @dev Store a new health record
     */
    function storeRecord(
        string calldata ipfsHash,
        string calldata encryptionKeyId,
        string calldata title,
        string calldata category
    ) external override onlyVerifiedUser onlyPatient returns (bytes32 recordId) {
        require(bytes(ipfsHash).length > 0, "IPFS hash cannot be empty");
        require(bytes(title).length > 0, "Title cannot be empty");
        
        recordCounter++;
        recordId = keccak256(abi.encodePacked(
            msg.sender,
            ipfsHash,
            block.timestamp,
            recordCounter
        ));
        
        records[recordId] = HealthRecord({
            id: recordId,
            patient: msg.sender,
            ipfsHash: ipfsHash,
            encryptionKeyId: encryptionKeyId,
            title: title,
            category: category,
            createdAt: block.timestamp,
            isActive: true
        });
        
        patientRecords[msg.sender].push(recordId);
        
        emit RecordStored(recordId, msg.sender, ipfsHash, block.timestamp);
        
        // Log to audit
        auditLog.logAction(
            msg.sender,
            msg.sender,
            IAuditLog.ActionType.RECORD_CREATED,
            recordId,
            string(abi.encodePacked("Title: ", title, ", Category: ", category))
        );
        
        return recordId;
    }
    
    /**
     * @dev Grant access to a healthcare provider
     */
    function grantAccess(
        bytes32 recordId,
        address provider,
        uint256 duration,
        string calldata purpose
    ) external override onlyVerifiedUser recordExists(recordId) onlyRecordOwner(recordId) {
        require(provider != address(0), "Invalid provider address");
        require(userRegistry.isVerifiedUser(provider), "Provider not verified");
        require(duration > 0, "Duration must be greater than 0");
        
        IUserRegistry.UserRole providerRole = userRegistry.getUserRole(provider);
        require(
            providerRole == IUserRegistry.UserRole.DOCTOR || 
            providerRole == IUserRegistry.UserRole.ADMIN,
            "Provider must be a doctor or admin"
        );
        
        uint256 expiresAt = block.timestamp + duration;
        
        // If provider doesn't have access yet, add to providers list
        if (!accessPermissions[recordId][provider].isActive) {
            recordProviders[recordId].push(provider);
        }
        
        accessPermissions[recordId][provider] = AccessPermission({
            provider: provider,
            grantedAt: block.timestamp,
            expiresAt: expiresAt,
            isActive: true,
            purpose: purpose
        });
        
        emit AccessGranted(recordId, msg.sender, provider, expiresAt);
        
        // Log to audit
        auditLog.logAction(
            msg.sender,
            provider,
            IAuditLog.ActionType.ACCESS_GRANTED,
            recordId,
            string(abi.encodePacked("Purpose: ", purpose, ", Duration: ", _uint256ToString(duration)))
        );
    }
    
    /**
     * @dev Revoke access from a healthcare provider
     */
    function revokeAccess(
        bytes32 recordId,
        address provider
    ) external override onlyVerifiedUser recordExists(recordId) onlyRecordOwner(recordId) {
        require(accessPermissions[recordId][provider].isActive, "No active access to revoke");
        
        accessPermissions[recordId][provider].isActive = false;
        
        emit AccessRevoked(recordId, msg.sender, provider);
        
        // Log to audit
        auditLog.logAction(
            msg.sender,
            provider,
            IAuditLog.ActionType.ACCESS_REVOKED,
            recordId,
            "Access revoked by patient"
        );
    }
    
    /**
     * @dev Access a health record (for providers)
     */
    function accessRecord(bytes32 recordId) external override onlyVerifiedUser onlyProvider recordExists(recordId) hasValidAccess(recordId) {
        emit RecordAccessed(recordId, msg.sender, block.timestamp);
        
        // Log to audit
        auditLog.logAction(
            msg.sender,
            records[recordId].patient,
            IAuditLog.ActionType.RECORD_ACCESSED,
            recordId,
            "Record accessed by provider"
        );
    }
    
    // View functions
    function getRecord(bytes32 recordId) external view override recordExists(recordId) returns (HealthRecord memory) {
        // Only patient or authorized providers can view
        require(
            records[recordId].patient == msg.sender || _hasValidAccess(recordId, msg.sender),
            "Access denied"
        );
        
        return records[recordId];
    }
    
    function getPatientRecords(address patient) external view override returns (bytes32[] memory) {
        require(
            patient == msg.sender || userRegistry.getUserRole(msg.sender) == IUserRegistry.UserRole.ADMIN,
            "Access denied"
        );
        
        return patientRecords[patient];
    }
    
    function hasAccess(bytes32 recordId, address provider) external view override returns (bool) {
        return _hasValidAccess(recordId, provider);
    }
    
    function getAccessPermission(
        bytes32 recordId,
        address provider
    ) external view override recordExists(recordId) returns (AccessPermission memory) {
        require(
            records[recordId].patient == msg.sender || 
            provider == msg.sender ||
            userRegistry.getUserRole(msg.sender) == IUserRegistry.UserRole.ADMIN,
            "Access denied"
        );
        
        return accessPermissions[recordId][provider];
    }
    
    // Additional view functions
    function getRecordProviders(bytes32 recordId) external view recordExists(recordId) returns (address[] memory) {
        require(
            records[recordId].patient == msg.sender ||
            userRegistry.getUserRole(msg.sender) == IUserRegistry.UserRole.ADMIN,
            "Access denied"
        );
        
        return recordProviders[recordId];
    }
    
    function getPatientRecordCount(address patient) external view returns (uint256) {
        require(
            patient == msg.sender || userRegistry.getUserRole(msg.sender) == IUserRegistry.UserRole.ADMIN,
            "Access denied"
        );
        
        return patientRecords[patient].length;
    }
    
    function getTotalRecordCount() external view returns (uint256) {
        require(
            userRegistry.getUserRole(msg.sender) == IUserRegistry.UserRole.ADMIN,
            "Only admin can view total count"
        );
        
        return recordCounter;
    }
    
    // Emergency functions
    function deactivateRecord(bytes32 recordId) external recordExists(recordId) onlyRecordOwner(recordId) {
        records[recordId].isActive = false;
        
        // Revoke all active permissions
        address[] memory providers = recordProviders[recordId];
        for (uint256 i = 0; i < providers.length; i++) {
            if (accessPermissions[recordId][providers[i]].isActive) {
                accessPermissions[recordId][providers[i]].isActive = false;
            }
        }
    }
    
    function reactivateRecord(bytes32 recordId) external recordExists(recordId) onlyRecordOwner(recordId) {
        records[recordId].isActive = true;
    }
    
    // Internal functions
    function _hasValidAccess(bytes32 recordId, address provider) internal view returns (bool) {
        if (records[recordId].patient == provider) {
            return true; // Patient always has access to their own records
        }
        
        AccessPermission memory permission = accessPermissions[recordId][provider];
        return permission.isActive && 
               permission.expiresAt > block.timestamp &&
               records[recordId].isActive;
    }
    
    function _uint256ToString(uint256 value) internal pure returns (string memory) {
        if (value == 0) {
            return "0";
        }
        uint256 temp = value;
        uint256 digits;
        while (temp != 0) {
            digits++;
            temp /= 10;
        }
        bytes memory buffer = new bytes(digits);
        while (value != 0) {
            digits -= 1;
            buffer[digits] = bytes1(uint8(48 + uint256(value % 10)));
            value /= 10;
        }
        return string(buffer);
    }
    
    // Batch operations for efficiency
    function grantMultipleAccess(
        bytes32[] calldata recordIds,
        address provider,
        uint256 duration,
        string calldata purpose
    ) external {
        for (uint256 i = 0; i < recordIds.length; i++) {
            grantAccess(recordIds[i], provider, duration, purpose);
        }
    }
    
    function revokeMultipleAccess(
        bytes32[] calldata recordIds,
        address provider
    ) external {
        for (uint256 i = 0; i < recordIds.length; i++) {
            revokeAccess(recordIds[i], provider);
        }
    }
}