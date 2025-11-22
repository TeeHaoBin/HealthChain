// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

/**
 * @title IPFSIntegration
 * @dev Utility contract for IPFS hash validation and management
 */
contract IPFSIntegration {
    // Events
    event IPFSHashValidated(string ipfsHash, bool isValid);
    event IPFSMetadataStored(string ipfsHash, string metadata);
    
    // Struct for IPFS metadata
    struct IPFSMetadata {
        string hash;
        uint256 size;
        string contentType;
        uint256 uploadedAt;
        address uploader;
        bool isEncrypted;
        string encryptionAlgorithm;
    }
    
    // State variables
    mapping(string => IPFSMetadata) private ipfsMetadata;
    mapping(string => bool) private validatedHashes;
    
    /**
     * @dev Validate IPFS hash format
     */
    function validateIPFSHash(string calldata ipfsHash) external pure returns (bool) {
        bytes memory hashBytes = bytes(ipfsHash);
        
        // Basic IPFS hash validation
        // CID v0: starts with "Qm" and is 46 characters long
        // CID v1: starts with "bafy" and is 59 characters long
        if (hashBytes.length == 46 && 
            hashBytes[0] == 0x51 && // 'Q'
            hashBytes[1] == 0x6D) { // 'm'
            return true;
        }
        
        if (hashBytes.length == 59 &&
            hashBytes[0] == 0x62 && // 'b'
            hashBytes[1] == 0x61 && // 'a'
            hashBytes[2] == 0x66 && // 'f'
            hashBytes[3] == 0x79) { // 'y'
            return true;
        }
        
        return false;
    }
    
    /**
     * @dev Store IPFS metadata
     */
    function storeIPFSMetadata(
        string calldata ipfsHash,
        uint256 size,
        string calldata contentType,
        bool isEncrypted,
        string calldata encryptionAlgorithm
    ) external {
        require(validateIPFSHash(ipfsHash), "Invalid IPFS hash format");
        require(size > 0, "Size must be greater than 0");
        require(bytes(contentType).length > 0, "Content type cannot be empty");
        
        ipfsMetadata[ipfsHash] = IPFSMetadata({
            hash: ipfsHash,
            size: size,
            contentType: contentType,
            uploadedAt: block.timestamp,
            uploader: msg.sender,
            isEncrypted: isEncrypted,
            encryptionAlgorithm: encryptionAlgorithm
        });
        
        validatedHashes[ipfsHash] = true;
        
        emit IPFSMetadataStored(ipfsHash, contentType);
    }
    
    /**
     * @dev Get IPFS metadata
     */
    function getIPFSMetadata(string calldata ipfsHash) external view returns (IPFSMetadata memory) {
        require(validatedHashes[ipfsHash], "IPFS hash not found");
        return ipfsMetadata[ipfsHash];
    }
    
    /**
     * @dev Check if IPFS hash exists in our system
     */
    function isIPFSHashStored(string calldata ipfsHash) external view returns (bool) {
        return validatedHashes[ipfsHash];
    }
    
    /**
     * @dev Get file info for UI display
     */
    function getFileInfo(string calldata ipfsHash) external view returns (
        uint256 size,
        string memory contentType,
        uint256 uploadedAt,
        address uploader,
        bool isEncrypted
    ) {
        require(validatedHashes[ipfsHash], "IPFS hash not found");
        
        IPFSMetadata memory metadata = ipfsMetadata[ipfsHash];
        return (
            metadata.size,
            metadata.contentType,
            metadata.uploadedAt,
            metadata.uploader,
            metadata.isEncrypted
        );
    }
    
    /**
     * @dev Batch validate multiple IPFS hashes
     */
    function batchValidateIPFSHashes(string[] calldata ipfsHashes) external pure returns (bool[] memory) {
        bool[] memory results = new bool[](ipfsHashes.length);
        
        for (uint256 i = 0; i < ipfsHashes.length; i++) {
            results[i] = validateIPFSHash(ipfsHashes[i]);
        }
        
        return results;
    }
    
    /**
     * @dev Generate file hash for integrity verification
     */
    function generateFileHash(
        string calldata ipfsHash,
        uint256 size,
        string calldata contentType
    ) external pure returns (bytes32) {
        return keccak256(abi.encodePacked(ipfsHash, size, contentType));
    }
    
    /**
     * @dev Verify file integrity
     */
    function verifyFileIntegrity(
        string calldata ipfsHash,
        bytes32 expectedHash
    ) external view returns (bool) {
        require(validatedHashes[ipfsHash], "IPFS hash not found");
        
        IPFSMetadata memory metadata = ipfsMetadata[ipfsHash];
        bytes32 actualHash = keccak256(abi.encodePacked(
            metadata.hash,
            metadata.size,
            metadata.contentType
        ));
        
        return actualHash == expectedHash;
    }
}