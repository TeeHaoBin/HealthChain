// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import "./IUserRegistry.sol";
import "./IAuditLog.sol";

/**
 * @title UserRegistry
 * @dev Manages user registration, roles, and KYC verification
 */
contract UserRegistry is IUserRegistry {
    // State variables
    mapping(address => User) private users;
    mapping(UserRole => address[]) private usersByRole;
    mapping(address => bool) private admins;
    
    address public owner;
    IAuditLog public auditLog;
    
    // Modifiers
    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this function");
        _;
    }
    
    modifier onlyAdmin() {
        require(admins[msg.sender] || msg.sender == owner, "Only admin can call this function");
        _;
    }
    
    modifier onlyRegisteredUser() {
        require(users[msg.sender].wallet != address(0), "User not registered");
        require(users[msg.sender].isActive, "User account is deactivated");
        _;
    }
    
    modifier onlyVerifiedUser() {
        require(isVerifiedUser(msg.sender), "User not verified");
        _;
    }
    
    constructor(address _auditLogAddress) {
        owner = msg.sender;
        admins[msg.sender] = true;
        auditLog = IAuditLog(_auditLogAddress);
        
        // Register owner as admin
        users[msg.sender] = User({
            wallet: msg.sender,
            role: UserRole.ADMIN,
            kycStatus: KYCStatus.VERIFIED,
            kycIpfsHash: "",
            registeredAt: block.timestamp,
            kycSubmittedAt: block.timestamp,
            kycVerifiedAt: block.timestamp,
            isActive: true
        });
        
        usersByRole[UserRole.ADMIN].push(msg.sender);
        emit UserRegistered(msg.sender, UserRole.ADMIN, block.timestamp);
    }
    
    /**
     * @dev Register a new user with specified role
     */
    function registerUser(UserRole role) external override {
        require(role != UserRole.NONE, "Invalid role");
        require(role != UserRole.ADMIN, "Cannot self-register as admin");
        require(users[msg.sender].wallet == address(0), "User already registered");
        
        users[msg.sender] = User({
            wallet: msg.sender,
            role: role,
            kycStatus: KYCStatus.NONE,
            kycIpfsHash: "",
            registeredAt: block.timestamp,
            kycSubmittedAt: 0,
            kycVerifiedAt: 0,
            isActive: true
        });
        
        usersByRole[role].push(msg.sender);
        
        emit UserRegistered(msg.sender, role, block.timestamp);
        
        // Log to audit
        auditLog.logAction(
            msg.sender,
            msg.sender,
            IAuditLog.ActionType.USER_REGISTERED,
            bytes32(uint256(uint160(msg.sender))),
            string(abi.encodePacked("Role: ", _roleToString(role)))
        );
    }
    
    /**
     * @dev Submit KYC documents
     */
    function submitKYC(string calldata ipfsHash) external override onlyRegisteredUser {
        require(bytes(ipfsHash).length > 0, "IPFS hash cannot be empty");
        require(users[msg.sender].kycStatus != KYCStatus.VERIFIED, "KYC already verified");
        
        users[msg.sender].kycIpfsHash = ipfsHash;
        users[msg.sender].kycStatus = KYCStatus.PENDING;
        users[msg.sender].kycSubmittedAt = block.timestamp;
        
        emit KYCSubmitted(msg.sender, ipfsHash, block.timestamp);
        
        // Log to audit
        auditLog.logAction(
            msg.sender,
            msg.sender,
            IAuditLog.ActionType.KYC_SUBMITTED,
            bytes32(uint256(uint160(msg.sender))),
            string(abi.encodePacked("IPFS: ", ipfsHash))
        );
    }
    
    /**
     * @dev Update KYC status (admin only)
     */
    function updateKYCStatus(address user, KYCStatus status) external override onlyAdmin {
        require(users[user].wallet != address(0), "User not registered");
        require(status != KYCStatus.NONE, "Invalid status");
        
        KYCStatus oldStatus = users[user].kycStatus;
        users[user].kycStatus = status;
        
        if (status == KYCStatus.VERIFIED) {
            users[user].kycVerifiedAt = block.timestamp;
        }
        
        emit KYCStatusUpdated(user, status, msg.sender, block.timestamp);
        
        // Log to audit
        auditLog.logAction(
            msg.sender,
            user,
            IAuditLog.ActionType.KYC_VERIFIED,
            bytes32(uint256(uint160(user))),
            string(abi.encodePacked("Status: ", _statusToString(status)))
        );
    }
    
    /**
     * @dev Update user role (owner only)
     */
    function updateUserRole(address user, UserRole newRole) external override onlyOwner {
        require(users[user].wallet != address(0), "User not registered");
        require(newRole != UserRole.NONE, "Invalid role");
        
        UserRole oldRole = users[user].role;
        
        // Remove from old role array
        _removeFromRoleArray(user, oldRole);
        
        // Update role
        users[user].role = newRole;
        
        // Add to new role array
        usersByRole[newRole].push(user);
        
        // Update admin mapping
        if (newRole == UserRole.ADMIN) {
            admins[user] = true;
        } else {
            admins[user] = false;
        }
        
        emit RoleUpdated(user, oldRole, newRole, msg.sender);
        
        // Log to audit
        auditLog.logAction(
            msg.sender,
            user,
            IAuditLog.ActionType.ROLE_UPDATED,
            bytes32(uint256(uint160(user))),
            string(abi.encodePacked("From: ", _roleToString(oldRole), " To: ", _roleToString(newRole)))
        );
    }
    
    /**
     * @dev Deactivate user account (admin only)
     */
    function deactivateUser(address user) external override onlyAdmin {
        require(users[user].wallet != address(0), "User not registered");
        require(user != owner, "Cannot deactivate owner");
        
        users[user].isActive = false;
    }
    
    // View functions
    function getUser(address user) external view override returns (User memory) {
        return users[user];
    }
    
    function getUserRole(address user) external view override returns (UserRole) {
        return users[user].role;
    }
    
    function getKYCStatus(address user) external view override returns (KYCStatus) {
        return users[user].kycStatus;
    }
    
    function isUserActive(address user) external view override returns (bool) {
        return users[user].isActive && users[user].wallet != address(0);
    }
    
    function isVerifiedUser(address user) external view override returns (bool) {
        return users[user].wallet != address(0) && 
               users[user].isActive && 
               users[user].kycStatus == KYCStatus.VERIFIED;
    }
    
    function getUsersByRole(UserRole role) external view override returns (address[] memory) {
        return usersByRole[role];
    }
    
    // Helper functions
    function _removeFromRoleArray(address user, UserRole role) private {
        address[] storage roleArray = usersByRole[role];
        for (uint256 i = 0; i < roleArray.length; i++) {
            if (roleArray[i] == user) {
                roleArray[i] = roleArray[roleArray.length - 1];
                roleArray.pop();
                break;
            }
        }
    }
    
    function _roleToString(UserRole role) private pure returns (string memory) {
        if (role == UserRole.PATIENT) return "PATIENT";
        if (role == UserRole.DOCTOR) return "DOCTOR";
        if (role == UserRole.ADMIN) return "ADMIN";
        return "NONE";
    }
    
    function _statusToString(KYCStatus status) private pure returns (string memory) {
        if (status == KYCStatus.PENDING) return "PENDING";
        if (status == KYCStatus.VERIFIED) return "VERIFIED";
        if (status == KYCStatus.REJECTED) return "REJECTED";
        return "NONE";
    }
    
    // Admin management
    function addAdmin(address newAdmin) external onlyOwner {
        require(users[newAdmin].wallet != address(0), "User not registered");
        admins[newAdmin] = true;
        updateUserRole(newAdmin, UserRole.ADMIN);
    }
    
    function removeAdmin(address admin) external onlyOwner {
        require(admin != owner, "Cannot remove owner admin");
        admins[admin] = false;
    }
    
    function isAdmin(address user) external view returns (bool) {
        return admins[user];
    }
}