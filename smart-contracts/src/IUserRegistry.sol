// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

/**
 * @title IUserRegistry
 * @dev Interface for user registration and KYC management
 */
interface IUserRegistry {
    // Enums
    enum UserRole { NONE, PATIENT, DOCTOR, ADMIN }
    enum KYCStatus { NONE, PENDING, VERIFIED, REJECTED }
    
    // Events
    event UserRegistered(
        address indexed user,
        UserRole role,
        uint256 timestamp
    );
    
    event KYCSubmitted(
        address indexed user,
        string ipfsHash,
        uint256 timestamp
    );
    
    event KYCStatusUpdated(
        address indexed user,
        KYCStatus status,
        address indexed admin,
        uint256 timestamp
    );
    
    event RoleUpdated(
        address indexed user,
        UserRole oldRole,
        UserRole newRole,
        address indexed admin
    );
    
    // Structs
    struct User {
        address wallet;
        UserRole role;
        KYCStatus kycStatus;
        string kycIpfsHash;
        uint256 registeredAt;
        uint256 kycSubmittedAt;
        uint256 kycVerifiedAt;
        bool isActive;
    }
    
    // Core functions
    function registerUser(UserRole role) external;
    
    function submitKYC(string calldata ipfsHash) external;
    
    function updateKYCStatus(
        address user,
        KYCStatus status
    ) external;
    
    function updateUserRole(
        address user,
        UserRole newRole
    ) external;
    
    function deactivateUser(address user) external;
    
    // View functions
    function getUser(address user) external view returns (User memory);
    
    function getUserRole(address user) external view returns (UserRole);
    
    function getKYCStatus(address user) external view returns (KYCStatus);
    
    function isUserActive(address user) external view returns (bool);
    
    function isVerifiedUser(address user) external view returns (bool);
    
    function getUsersByRole(UserRole role) external view returns (address[] memory);
}