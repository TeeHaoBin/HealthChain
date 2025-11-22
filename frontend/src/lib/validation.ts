// Environment validation utility
export function validateEnvironment() {
  const required = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'NEXT_PUBLIC_PINATA_JWT',
    'NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID'
  ];

  const missing = required.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
}

// Validate Ethereum address format
export function isValidEthereumAddress(address: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
}

// File validation configuration based on Pinata recommendations
const FILE_VALIDATION_CONFIG = {
  // Maximum file size based on Pinata's recommendations
  MAX_FILE_SIZE: 100 * 1024 * 1024, // 100MB - increased from 10MB for medical files
  
  // Allowed MIME types for healthcare files
  ALLOWED_MIME_TYPES: {
    // Documents
    'application/pdf': { extensions: ['.pdf'], category: 'document' },
    'application/msword': { extensions: ['.doc'], category: 'document' },
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': { 
      extensions: ['.docx'], category: 'document' 
    },
    'text/plain': { extensions: ['.txt'], category: 'document' },
    
    // Images - Medical imaging
    'image/jpeg': { extensions: ['.jpg', '.jpeg'], category: 'image' },
    'image/png': { extensions: ['.png'], category: 'image' },
    'image/gif': { extensions: ['.gif'], category: 'image' },
    'image/bmp': { extensions: ['.bmp'], category: 'image' },
    'image/tiff': { extensions: ['.tiff', '.tif'], category: 'image' },
    
    // Medical imaging formats
    'application/dicom': { extensions: ['.dcm', '.dicom'], category: 'medical' },
    
    // Spreadsheets for lab results
    'application/vnd.ms-excel': { extensions: ['.xls'], category: 'spreadsheet' },
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': { 
      extensions: ['.xlsx'], category: 'spreadsheet' 
    },
    
    // Archives (for bulk uploads)
    'application/zip': { extensions: ['.zip'], category: 'archive' },
    'application/x-rar-compressed': { extensions: ['.rar'], category: 'archive' },
  },
  
  // File extension to MIME type mapping for additional validation
  EXTENSION_MIME_MAP: {
    '.pdf': 'application/pdf',
    '.doc': 'application/msword',
    '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    '.txt': 'text/plain',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.gif': 'image/gif',
    '.bmp': 'image/bmp',
    '.tiff': 'image/tiff',
    '.tif': 'image/tiff',
    '.dcm': 'application/dicom',
    '.dicom': 'application/dicom',
    '.xls': 'application/vnd.ms-excel',
    '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    '.zip': 'application/zip',
    '.rar': 'application/x-rar-compressed',
  }
};

// Enhanced file size validation with detailed error messages
export function isValidFileSize(file: File): { valid: boolean; error?: string } {
  if (file.size === 0) {
    return { valid: false, error: 'File is empty' };
  }
  
  if (file.size > FILE_VALIDATION_CONFIG.MAX_FILE_SIZE) {
    const maxSizeMB = FILE_VALIDATION_CONFIG.MAX_FILE_SIZE / 1024 / 1024;
    const fileSizeMB = (file.size / 1024 / 1024).toFixed(2);
    return { 
      valid: false, 
      error: `File too large (${fileSizeMB}MB). Maximum allowed: ${maxSizeMB}MB` 
    };
  }
  
  return { valid: true };
}

// Enhanced file type validation with MIME type and extension checking
export function isValidFileType(file: File): { valid: boolean; error?: string; category?: string } {
  // Check if MIME type is allowed
  const mimeTypeInfo = FILE_VALIDATION_CONFIG.ALLOWED_MIME_TYPES[file.type as keyof typeof FILE_VALIDATION_CONFIG.ALLOWED_MIME_TYPES];
  
  // Get file extension
  const fileName = file.name.toLowerCase();
  const extension = fileName.substring(fileName.lastIndexOf('.'));
  
  // Validate MIME type
  if (!mimeTypeInfo) {
    return { 
      valid: false, 
      error: `Unsupported file type: ${file.type || 'unknown'}. Allowed types: PDF, DOC, DOCX, images, DICOM, etc.` 
    };
  }
  
  // Validate extension matches MIME type
  if (!mimeTypeInfo.extensions.includes(extension)) {
    const expectedMimeType = FILE_VALIDATION_CONFIG.EXTENSION_MIME_MAP[extension as keyof typeof FILE_VALIDATION_CONFIG.EXTENSION_MIME_MAP];
    
    if (expectedMimeType && expectedMimeType !== file.type) {
      return { 
        valid: false, 
        error: `File extension "${extension}" doesn't match MIME type "${file.type}". Expected: "${expectedMimeType}"` 
      };
    }
  }
  
  return { 
    valid: true, 
    category: mimeTypeInfo.category 
  };
}

// Legacy functions for backward compatibility
export function isValidFileSizeSimple(file: File): boolean {
  return isValidFileSize(file).valid;
}

export function isValidFileTypeSimple(file: File): boolean {
  return isValidFileType(file).valid;
}

// Sanitize filename for IPFS/Pinata upload
export function sanitizeFileName(fileName: string): string {
  // Remove or replace invalid characters
  return fileName
    .replace(/[<>:"/\\|?*]/g, '_') // Replace invalid file system characters
    .replace(/\s+/g, '_') // Replace spaces with underscores
    .replace(/_{2,}/g, '_') // Replace multiple underscores with single
    .replace(/^_+|_+$/g, '') // Remove leading/trailing underscores
    .toLowerCase(); // Convert to lowercase for consistency
}

// Validate filename security
export function isValidFileName(fileName: string): { valid: boolean; error?: string; sanitized?: string } {
  if (!fileName || fileName.trim().length === 0) {
    return { valid: false, error: 'Filename cannot be empty' };
  }

  // Check for dangerous patterns
  const dangerousPatterns = [
    /\.\./g, // Directory traversal
    /\0/g,   // Null bytes
    /[\x00-\x1f\x80-\x9f]/g, // Control characters
  ];

  for (const pattern of dangerousPatterns) {
    if (pattern.test(fileName)) {
      return { valid: false, error: 'Filename contains unsafe characters' };
    }
  }

  // Check filename length (Pinata recommendation)
  if (fileName.length > 255) {
    return { valid: false, error: 'Filename too long (max 255 characters)' };
  }

  const sanitized = sanitizeFileName(fileName);
  
  // Check if sanitization changed the filename significantly
  if (sanitized.length < fileName.length * 0.5) {
    return { 
      valid: false, 
      error: 'Filename contains too many invalid characters',
      sanitized 
    };
  }

  return { valid: true, sanitized };
}

// Validate file content type by checking file signature (magic numbers)
export function validateFileSignature(file: File): Promise<{ valid: boolean; error?: string; detectedType?: string }> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    
    reader.onload = (event) => {
      const arrayBuffer = event.target?.result as ArrayBuffer;
      if (!arrayBuffer) {
        resolve({ valid: false, error: 'Could not read file content' });
        return;
      }

      const uint8Array = new Uint8Array(arrayBuffer.slice(0, 16)); // Read first 16 bytes
      const hex = Array.from(uint8Array)
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');

      // Common file signatures
      const signatures: { [key: string]: string[] } = {
        'application/pdf': ['25504446'], // %PDF
        'image/jpeg': ['ffd8ff'], // JPEG
        'image/png': ['89504e47'], // PNG
        'application/zip': ['504b0304'], // ZIP
        'image/gif': ['474946383761', '474946383961'], // GIF87a, GIF89a
        'image/bmp': ['424d'], // BMP
        'image/tiff': ['49492a00', '4d4d002a'], // TIFF
        'application/msword': ['d0cf11e0'], // DOC (MS Office)
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['504b0304'], // DOCX (ZIP-based)
      };

      // Check if file signature matches expected type
      let detectedType: string | undefined;
      let signatureMatch = false;

      for (const [mimeType, sigs] of Object.entries(signatures)) {
        for (const sig of sigs) {
          if (hex.startsWith(sig.toLowerCase())) {
            detectedType = mimeType;
            signatureMatch = true;
            break;
          }
        }
        if (signatureMatch) break;
      }

      // For text files and some other formats, signature validation might not be applicable
      const textBasedTypes = ['text/plain', 'application/dicom'];
      const isTextBased = textBasedTypes.includes(file.type);

      if (!signatureMatch && !isTextBased && detectedType) {
        resolve({
          valid: false,
          error: `File signature mismatch. Expected: ${file.type}, Detected: ${detectedType}`,
          detectedType
        });
      } else if (!signatureMatch && !isTextBased) {
        // If we can't detect the type and it's not text-based, it's suspicious
        resolve({
          valid: false,
          error: 'Unable to verify file type from content',
          detectedType: 'unknown'
        });
      } else {
        resolve({
          valid: true,
          detectedType: detectedType || file.type
        });
      }
    };

    reader.onerror = () => {
      resolve({ valid: false, error: 'Failed to read file for signature validation' });
    };

    // Read first 16 bytes for signature checking
    reader.readAsArrayBuffer(file.slice(0, 16));
  });
}

// Comprehensive file validation that combines all checks
export async function validateFileComprehensive(file: File): Promise<{
  valid: boolean;
  errors: string[];
  warnings: string[];
  metadata: {
    originalName: string;
    sanitizedName: string;
    type: string;
    size: number;
    category?: string;
    detectedType?: string;
  };
}> {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  // Filename validation
  const nameValidation = isValidFileName(file.name);
  if (!nameValidation.valid) {
    errors.push(nameValidation.error!);
  }
  
  // Type validation
  const typeValidation = isValidFileType(file);
  if (!typeValidation.valid) {
    errors.push(typeValidation.error!);
  }
  
  // Size validation
  const sizeValidation = isValidFileSize(file);
  if (!sizeValidation.valid) {
    errors.push(sizeValidation.error!);
  }
  
  // File signature validation
  let detectedType: string | undefined;
  try {
    const signatureValidation = await validateFileSignature(file);
    if (!signatureValidation.valid) {
      warnings.push(signatureValidation.error!);
    }
    detectedType = signatureValidation.detectedType;
  } catch (error) {
    warnings.push('Could not validate file signature');
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    metadata: {
      originalName: file.name,
      sanitizedName: nameValidation.sanitized || file.name,
      type: file.type,
      size: file.size,
      category: typeValidation.category,
      detectedType
    }
  };
}

// Validate doctor addresses input
export function validateDoctorAddresses(addressString: string): { valid: boolean; errors: string[] } {
  if (!addressString.trim()) {
    return { valid: true, errors: [] }; // Empty is valid
  }

  const addresses = addressString.split(',').map(addr => addr.trim()).filter(addr => addr.length > 0);
  const errors: string[] = [];

  addresses.forEach((addr, index) => {
    if (!isValidEthereumAddress(addr)) {
      errors.push(`Address ${index + 1}: "${addr}" is not a valid Ethereum address`);
    }
  });

  return {
    valid: errors.length === 0,
    errors
  };
}