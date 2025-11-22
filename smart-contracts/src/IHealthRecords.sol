// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

/**
 * @title IHealthRecords
 * @dev Interface for the main health records contract
 */
interface IHealthRecords {
    // Events
    event RecordStored(
        bytes32 indexed recordId,
        address indexed patient,
        string ipfsHash,
        uint256 timestamp
    );
    
    event AccessGranted(
        bytes32 indexed recordId,
        address indexed patient,
        address indexed provider,
        uint256 expiresAt
    );
    
    event AccessRevoked(
        bytes32 indexed recordId,
        address indexed patient,
        address indexed provider
    );
    
    event RecordAccessed(
        bytes32 indexed recordId,
        address indexed provider,
        uint256 timestamp
    );
    
    // Structs
    struct HealthRecord {
        bytes32 id;
        address patient;
        string ipfsHash;
        string encryptionKeyId;
        string title;
        string category;
        uint256 createdAt;
        bool isActive;
    }
    
    struct AccessPermission {
        address provider;
        uint256 grantedAt;
        uint256 expiresAt;
        bool isActive;
        string purpose;
    }
    
    // Core functions
    function storeRecord(
        string calldata ipfsHash,
        string calldata encryptionKeyId,
        string calldata title,
        string calldata category
    ) external returns (bytes32 recordId);
    
    function grantAccess(
        bytes32 recordId,
        address provider,
        uint256 duration,
        string calldata purpose
    ) external;
    
    function revokeAccess(bytes32 recordId, address provider) external;
    
    function accessRecord(bytes32 recordId) external;
    
    // View functions
    function getRecord(bytes32 recordId) external view returns (HealthRecord memory);
    
    function getPatientRecords(address patient) external view returns (bytes32[] memory);
    
    function hasAccess(bytes32 recordId, address provider) external view returns (bool);
    
    function getAccessPermission(bytes32 recordId, address provider) 
        external view returns (AccessPermission memory);
}