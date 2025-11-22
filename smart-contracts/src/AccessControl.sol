// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import "./IUserRegistry.sol";
import "./IAuditLog.sol";

/**
 * @title AccessControl
 * @dev Advanced access control and permission management
 */
contract AccessControl {
    // Enums
    enum PermissionType {
        READ,
        WRITE,
        ADMIN,
        EMERGENCY
    }
    
    enum RequestStatus {
        PENDING,
        APPROVED,
        REJECTED,
        EXPIRED
    }
    
    // Structs
    struct AccessRequest {
        bytes32 id;
        address requester;
        address patient;
        bytes32 recordId;
        PermissionType permissionType;
        string purpose;
        uint256 requestedAt;
        uint256 requestedDuration;
        RequestStatus status;
        string justification;
    }
    
    struct EmergencyAccess {
        address provider;
        bytes32 recordId;
        uint256 grantedAt;
        uint256 expiresAt;
        string emergencyReason;
        bool isActive;
    }
    
    // Events
    event AccessRequested(
        bytes32 indexed requestId,
        address indexed requester,
        address indexed patient,
        bytes32 recordId,
        PermissionType permissionType
    );
    
    event AccessRequestApproved(
        bytes32 indexed requestId,
        address indexed patient,
        uint256 duration
    );
    
    event AccessRequestRejected(
        bytes32 indexed requestId,
        address indexed patient,
        string reason
    );
    
    event EmergencyAccessGranted(
        address indexed provider,
        bytes32 indexed recordId,
        string reason
    );
    
    event EmergencyAccessRevoked(
        address indexed provider,
        bytes32 indexed recordId
    );
    
    // State variables
    mapping(bytes32 => AccessRequest) private accessRequests;
    mapping(address => bytes32[]) private patientRequests;
    mapping(address => bytes32[]) private providerRequests;
    mapping(bytes32 => EmergencyAccess) private emergencyAccesses;
    mapping(address => bool) private emergencyProviders;
    
    IUserRegistry public userRegistry;
    IAuditLog public auditLog;
    address public owner;
    
    uint256 private requestCounter;
    uint256 public constant EMERGENCY_ACCESS_DURATION = 24 hours;
    uint256 public constant MAX_REQUEST_DURATION = 30 days;
    
    // Modifiers
    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this function");
        _;
    }
    
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
    
    modifier onlyEmergencyProvider() {
        require(emergencyProviders[msg.sender], "Not authorized for emergency access");
        _;
    }
    
    constructor(address _userRegistryAddress, address _auditLogAddress) {
        userRegistry = IUserRegistry(_userRegistryAddress);
        auditLog = IAuditLog(_auditLogAddress);
        owner = msg.sender;
        requestCounter = 0;
        
        // Owner is emergency provider by default
        emergencyProviders[msg.sender] = true;
    }
    
    /**
     * @dev Request access to a patient's records
     */
    function requestAccess(
        address patient,
        bytes32 recordId,
        PermissionType permissionType,
        uint256 duration,
        string calldata purpose,
        string calldata justification
    ) external onlyVerifiedUser onlyProvider returns (bytes32 requestId) {
        require(patient != address(0), "Invalid patient address");
        require(userRegistry.isVerifiedUser(patient), "Patient not verified");
        require(duration > 0 && duration <= MAX_REQUEST_DURATION, "Invalid duration");
        require(bytes(purpose).length > 0, "Purpose cannot be empty");
        
        requestCounter++;
        requestId = keccak256(abi.encodePacked(
            msg.sender,
            patient,
            recordId,
            block.timestamp,
            requestCounter
        ));
        
        accessRequests[requestId] = AccessRequest({
            id: requestId,
            requester: msg.sender,
            patient: patient,
            recordId: recordId,
            permissionType: permissionType,
            purpose: purpose,
            requestedAt: block.timestamp,
            requestedDuration: duration,
            status: RequestStatus.PENDING,
            justification: justification
        });
        
        patientRequests[patient].push(requestId);
        providerRequests[msg.sender].push(requestId);
        
        emit AccessRequested(requestId, msg.sender, patient, recordId, permissionType);
        
        // Log to audit
        auditLog.logAction(
            msg.sender,
            patient,
            IAuditLog.ActionType.ACCESS_GRANTED, // Using closest available action
            recordId,
            string(abi.encodePacked("Access requested: ", purpose))
        );
        
        return requestId;
    }
    
    /**
     * @dev Approve an access request (patient only)
     */
    function approveAccessRequest(
        bytes32 requestId,
        uint256 approvedDuration
    ) external onlyVerifiedUser onlyPatient {
        AccessRequest storage request = accessRequests[requestId];
        require(request.id != bytes32(0), "Request does not exist");
        require(request.patient == msg.sender, "Only patient can approve");
        require(request.status == RequestStatus.PENDING, "Request not pending");
        require(approvedDuration > 0 && approvedDuration <= request.requestedDuration, "Invalid duration");
        
        request.status = RequestStatus.APPROVED;
        
        emit AccessRequestApproved(requestId, msg.sender, approvedDuration);
        
        // Log to audit
        auditLog.logAction(
            msg.sender,
            request.requester,
            IAuditLog.ActionType.ACCESS_GRANTED,
            request.recordId,
            string(abi.encodePacked("Request approved: ", request.purpose))
        );
    }
    
    /**
     * @dev Reject an access request (patient only)
     */
    function rejectAccessRequest(
        bytes32 requestId,
        string calldata reason
    ) external onlyVerifiedUser onlyPatient {
        AccessRequest storage request = accessRequests[requestId];
        require(request.id != bytes32(0), "Request does not exist");
        require(request.patient == msg.sender, "Only patient can reject");
        require(request.status == RequestStatus.PENDING, "Request not pending");
        
        request.status = RequestStatus.REJECTED;
        
        emit AccessRequestRejected(requestId, msg.sender, reason);
        
        // Log to audit
        auditLog.logAction(
            msg.sender,
            request.requester,
            IAuditLog.ActionType.ACCESS_REVOKED,
            request.recordId,
            string(abi.encodePacked("Request rejected: ", reason))
        );
    }
    
    /**
     * @dev Grant emergency access (emergency providers only)
     */
    function grantEmergencyAccess(
        bytes32 recordId,
        string calldata emergencyReason
    ) external onlyVerifiedUser onlyEmergencyProvider {
        require(bytes(emergencyReason).length > 0, "Emergency reason required");
        
        bytes32 emergencyId = keccak256(abi.encodePacked(
            msg.sender,
            recordId,
            block.timestamp
        ));
        
        emergencyAccesses[emergencyId] = EmergencyAccess({
            provider: msg.sender,
            recordId: recordId,
            grantedAt: block.timestamp,
            expiresAt: block.timestamp + EMERGENCY_ACCESS_DURATION,
            emergencyReason: emergencyReason,
            isActive: true
        });
        
        emit EmergencyAccessGranted(msg.sender, recordId, emergencyReason);
        
        // Log to audit
        auditLog.logAction(
            msg.sender,
            address(0), // No specific target for emergency access
            IAuditLog.ActionType.ACCESS_GRANTED,
            recordId,
            string(abi.encodePacked("Emergency access: ", emergencyReason))
        );
    }
    
    /**
     * @dev Revoke emergency access
     */
    function revokeEmergencyAccess(bytes32 emergencyId) external onlyOwner {
        require(emergencyAccesses[emergencyId].provider != address(0), "Emergency access not found");
        
        emergencyAccesses[emergencyId].isActive = false;
        
        emit EmergencyAccessRevoked(
            emergencyAccesses[emergencyId].provider,
            emergencyAccesses[emergencyId].recordId
        );
    }
    
    // View functions
    function getAccessRequest(bytes32 requestId) external view returns (AccessRequest memory) {
        AccessRequest memory request = accessRequests[requestId];
        require(request.id != bytes32(0), "Request does not exist");
        
        // Only involved parties can view
        require(
            request.requester == msg.sender ||
            request.patient == msg.sender ||
            userRegistry.getUserRole(msg.sender) == IUserRegistry.UserRole.ADMIN,
            "Access denied"
        );
        
        return request;
    }
    
    function getPatientRequests(address patient) external view returns (bytes32[] memory) {
        require(
            patient == msg.sender ||
            userRegistry.getUserRole(msg.sender) == IUserRegistry.UserRole.ADMIN,
            "Access denied"
        );
        
        return patientRequests[patient];
    }
    
    function getProviderRequests(address provider) external view returns (bytes32[] memory) {
        require(
            provider == msg.sender ||
            userRegistry.getUserRole(msg.sender) == IUserRegistry.UserRole.ADMIN,
            "Access denied"
        );
        
        return providerRequests[provider];
    }
    
    function getPendingRequests(address patient) external view returns (bytes32[] memory) {
        require(
            patient == msg.sender ||
            userRegistry.getUserRole(msg.sender) == IUserRegistry.UserRole.ADMIN,
            "Access denied"
        );
        
        bytes32[] memory allRequests = patientRequests[patient];
        bytes32[] memory pendingRequests = new bytes32[](allRequests.length);
        uint256 count = 0;
        
        for (uint256 i = 0; i < allRequests.length; i++) {
            if (accessRequests[allRequests[i]].status == RequestStatus.PENDING) {
                pendingRequests[count] = allRequests[i];
                count++;
            }
        }
        
        // Resize array
        bytes32[] memory result = new bytes32[](count);
        for (uint256 i = 0; i < count; i++) {
            result[i] = pendingRequests[i];
        }
        
        return result;
    }
    
    function hasEmergencyAccess(address provider, bytes32 recordId) external view returns (bool) {
        // Check all emergency accesses for this provider and record
        // This is simplified - in practice, you'd want a more efficient lookup
        return emergencyProviders[provider]; // Simplified for now
    }
    
    // Admin functions
    function addEmergencyProvider(address provider) external onlyOwner {
        require(userRegistry.isVerifiedUser(provider), "Provider not verified");
        emergencyProviders[provider] = true;
    }
    
    function removeEmergencyProvider(address provider) external onlyOwner {
        emergencyProviders[provider] = false;
    }
    
    function isEmergencyProvider(address provider) external view returns (bool) {
        return emergencyProviders[provider];
    }
    
    // Cleanup expired requests
    function cleanupExpiredRequests(bytes32[] calldata requestIds) external {
        for (uint256 i = 0; i < requestIds.length; i++) {
            AccessRequest storage request = accessRequests[requestIds[i]];
            if (request.status == RequestStatus.PENDING && 
                block.timestamp > request.requestedAt + 7 days) {
                request.status = RequestStatus.EXPIRED;
            }
        }
    }
}