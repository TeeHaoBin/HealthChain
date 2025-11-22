// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import "forge-std/Test.sol";
import "../src/MyHealthSystem.sol";
import "../src/IPFSIntegration.sol";

contract MyHealthSystemTest is Test {
    MyHealthSystem public myHealthSystem;
    IPFSIntegration public ipfsIntegration;
    
    address public owner;
    address public patient1;
    address public patient2;
    address public doctor1;
    address public doctor2;
    address public admin1;
    
    // Test IPFS hashes
    string constant IPFS_HASH_1 = "QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG";
    string constant IPFS_HASH_2 = "QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdH";
    string constant INVALID_IPFS_HASH = "InvalidHash123";
    
    function setUp() public {
        owner = address(this);
        patient1 = vm.addr(1);
        patient2 = vm.addr(2);
        doctor1 = vm.addr(3);
        doctor2 = vm.addr(4);
        admin1 = vm.addr(5);
        
        vm.label(owner, "Owner");
        vm.label(patient1, "Patient1");
        vm.label(patient2, "Patient2");
        vm.label(doctor1, "Doctor1");
        vm.label(doctor2, "Doctor2");
        vm.label(admin1, "Admin1");
        
        // Deploy contracts
        myHealthSystem = new MyHealthSystem();
        ipfsIntegration = new IPFSIntegration();
        
        // Setup initial users
        _setupInitialUsers();
    }
    
    function _setupInitialUsers() internal {
        // Register patient1
        vm.prank(patient1);
        myHealthSystem.userRegistry().registerUser(IUserRegistry.UserRole.PATIENT);
        
        // Register patient2
        vm.prank(patient2);
        myHealthSystem.userRegistry().registerUser(IUserRegistry.UserRole.PATIENT);
        
        // Register doctor1
        vm.prank(doctor1);
        myHealthSystem.userRegistry().registerUser(IUserRegistry.UserRole.DOCTOR);
        
        // Register doctor2
        vm.prank(doctor2);
        myHealthSystem.userRegistry().registerUser(IUserRegistry.UserRole.DOCTOR);
        
        // Verify all users as KYC approved
        myHealthSystem.userRegistry().updateKYCStatus(patient1, IUserRegistry.KYCStatus.VERIFIED);
        myHealthSystem.userRegistry().updateKYCStatus(patient2, IUserRegistry.KYCStatus.VERIFIED);
        myHealthSystem.userRegistry().updateKYCStatus(doctor1, IUserRegistry.KYCStatus.VERIFIED);
        myHealthSystem.userRegistry().updateKYCStatus(doctor2, IUserRegistry.KYCStatus.VERIFIED);
    }
    
    function testSystemDeployment() public {
        assertTrue(myHealthSystem.isSystemReady());
        
        (address auditLog, address userRegistry, address healthRecords, address accessControl) = 
            myHealthSystem.getContractAddresses();
        
        assertTrue(auditLog != address(0));
        assertTrue(userRegistry != address(0));
        assertTrue(healthRecords != address(0));
        assertTrue(accessControl != address(0));
    }
    
    function testUserRegistration() public {
        // Test patient registration
        assertTrue(myHealthSystem.userRegistry().isVerifiedUser(patient1));
        assertEq(
            uint(myHealthSystem.userRegistry().getUserRole(patient1)),
            uint(IUserRegistry.UserRole.PATIENT)
        );
        
        // Test doctor registration
        assertTrue(myHealthSystem.userRegistry().isVerifiedUser(doctor1));
        assertEq(
            uint(myHealthSystem.userRegistry().getUserRole(doctor1)),
            uint(IUserRegistry.UserRole.DOCTOR)
        );
    }
    
    function testHealthRecordCreation() public {
        // Patient1 creates a health record
        vm.prank(patient1);
        bytes32 recordId = myHealthSystem.healthRecords().storeRecord(
            IPFS_HASH_1,
            "encryption-key-1",
            "Blood Test Results",
            "Lab Results"
        );
        
        // Verify record was created
        assertTrue(recordId != bytes32(0));
        
        // Get record details
        vm.prank(patient1);
        IHealthRecords.HealthRecord memory record = myHealthSystem.healthRecords().getRecord(recordId);
        
        assertEq(record.patient, patient1);
        assertEq(record.ipfsHash, IPFS_HASH_1);
        assertEq(record.title, "Blood Test Results");
        assertEq(record.category, "Lab Results");
        assertTrue(record.isActive);
    }
    
    function testAccessControlFlow() public {
        // Patient1 creates a health record
        vm.prank(patient1);
        bytes32 recordId = myHealthSystem.healthRecords().storeRecord(
            IPFS_HASH_1,
            "encryption-key-1",
            "Blood Test Results",
            "Lab Results"
        );
        
        // Doctor1 should not have access initially
        assertFalse(myHealthSystem.healthRecords().hasAccess(recordId, doctor1));
        
        // Patient1 grants access to doctor1
        vm.prank(patient1);
        myHealthSystem.healthRecords().grantAccess(
            recordId,
            doctor1,
            1 days,
            "Medical consultation"
        );
        
        // Doctor1 should now have access
        assertTrue(myHealthSystem.healthRecords().hasAccess(recordId, doctor1));
        
        // Doctor1 accesses the record
        vm.prank(doctor1);
        myHealthSystem.healthRecords().accessRecord(recordId);
        
        // Doctor1 can view the record
        vm.prank(doctor1);
        IHealthRecords.HealthRecord memory record = myHealthSystem.healthRecords().getRecord(recordId);
        assertEq(record.ipfsHash, IPFS_HASH_1);
        
        // Patient1 revokes access
        vm.prank(patient1);
        myHealthSystem.healthRecords().revokeAccess(recordId, doctor1);
        
        // Doctor1 should no longer have access
        assertFalse(myHealthSystem.healthRecords().hasAccess(recordId, doctor1));
    }
    
    function testIPFSIntegration() public {
        // Test valid IPFS hash
        assertTrue(ipfsIntegration.validateIPFSHash(IPFS_HASH_1));
        assertTrue(ipfsIntegration.validateIPFSHash(IPFS_HASH_2));
        
        // Test invalid IPFS hash
        assertFalse(ipfsIntegration.validateIPFSHash(INVALID_IPFS_HASH));
        
        // Store IPFS metadata
        ipfsIntegration.storeIPFSMetadata(
            IPFS_HASH_1,
            1024,
            "application/pdf",
            true,
            "AES-256"
        );
        
        // Verify metadata storage
        assertTrue(ipfsIntegration.isIPFSHashStored(IPFS_HASH_1));
        
        (uint256 size, string memory contentType, uint256 uploadedAt, address uploader, bool isEncrypted) = 
            ipfsIntegration.getFileInfo(IPFS_HASH_1);
        
        assertEq(size, 1024);
        assertEq(contentType, "application/pdf");
        assertEq(uploader, address(this));
        assertTrue(isEncrypted);
    }
    
    function testAccessRequestFlow() public {
        // Patient1 creates a health record
        vm.prank(patient1);
        bytes32 recordId = myHealthSystem.healthRecords().storeRecord(
            IPFS_HASH_1,
            "encryption-key-1",
            "Blood Test Results",
            "Lab Results"
        );
        
        // Doctor1 requests access
        vm.prank(doctor1);
        bytes32 requestId = myHealthSystem.accessControl().requestAccess(
            patient1,
            recordId,
            AccessControl.PermissionType.READ,
            1 days,
            "Medical consultation",
            "Patient exhibits symptoms requiring lab review"
        );
        
        // Verify request was created
        assertTrue(requestId != bytes32(0));
        
        // Check pending requests for patient1
        vm.prank(patient1);
        bytes32[] memory pendingRequests = myHealthSystem.accessControl().getPendingRequests(patient1);
        assertEq(pendingRequests.length, 1);
        assertEq(pendingRequests[0], requestId);
        
        // Patient1 approves the request
        vm.prank(patient1);
        myHealthSystem.accessControl().approveAccessRequest(requestId, 12 hours);
        
        // Verify request status
        vm.prank(patient1);
        AccessControl.AccessRequest memory request = myHealthSystem.accessControl().getAccessRequest(requestId);
        assertEq(uint(request.status), uint(AccessControl.RequestStatus.APPROVED));
    }
    
    function testSystemStats() public {
        // Create some test data
        vm.prank(patient1);
        myHealthSystem.healthRecords().storeRecord(
            IPFS_HASH_1,
            "key1",
            "Record 1",
            "Category 1"
        );
        
        vm.prank(patient2);
        myHealthSystem.healthRecords().storeRecord(
            IPFS_HASH_2,
            "key2",
            "Record 2",
            "Category 2"
        );
        
        // Get system statistics
        (uint256 totalUsers, uint256 totalRecords, uint256 totalAuditLogs) = 
            myHealthSystem.getSystemStats();
        
        // We have 5 users (owner + 4 registered users)
        assertEq(totalUsers, 5);
        assertEq(totalRecords, 2);
        assertTrue(totalAuditLogs > 0); // Should have audit logs from registration and record creation
    }
    
    function testFailUnauthorizedAccess() public {
        // Patient1 creates a health record
        vm.prank(patient1);
        bytes32 recordId = myHealthSystem.healthRecords().storeRecord(
            IPFS_HASH_1,
            "encryption-key-1",
            "Blood Test Results",
            "Lab Results"
        );
        
        // Doctor1 tries to access without permission (should fail)
        vm.prank(doctor1);
        vm.expectRevert("Access denied");
        myHealthSystem.healthRecords().getRecord(recordId);
    }
    
    function testFailInvalidIPFSHash() public {
        // Try to create record with invalid IPFS hash
        vm.prank(patient1);
        vm.expectRevert("IPFS hash cannot be empty");
        myHealthSystem.healthRecords().storeRecord(
            "",
            "encryption-key-1",
            "Blood Test Results",
            "Lab Results"
        );
    }
    
    function testEmergencyAccess() public {
        // Patient1 creates a health record
        vm.prank(patient1);
        bytes32 recordId = myHealthSystem.healthRecords().storeRecord(
            IPFS_HASH_1,
            "encryption-key-1",
            "Blood Test Results",
            "Lab Results"
        );
        
        // Owner grants emergency access to doctor1
        myHealthSystem.accessControl().addEmergencyProvider(doctor1);
        
        // Doctor1 uses emergency access
        vm.prank(doctor1);
        myHealthSystem.accessControl().grantEmergencyAccess(
            recordId,
            "Patient unconscious, need immediate access to medical history"
        );
        
        // Verify emergency access
        assertTrue(myHealthSystem.accessControl().hasEmergencyAccess(doctor1, recordId));
    }
}