/**
 * Unit Tests for validation.ts
 * Testing: File validation, Ethereum address validation, filename sanitization
 */

import {
    isValidEthereumAddress,
    isValidFileSize,
    isValidFileType,
    isValidFileSizeSimple,
    isValidFileTypeSimple,
    sanitizeFileName,
    isValidFileName,
    validateDoctorAddresses,
} from '@/lib/validation';

// Helper to create mock File objects (memory efficient - doesn't create actual content)
function createMockFile(name: string, size: number, type: string): File {
    return {
        name,
        size,
        type,
        arrayBuffer: () => Promise.resolve(new ArrayBuffer(Math.min(size, 100))),
        slice: () => new Blob([]),
        text: () => Promise.resolve(''),
        stream: () => new ReadableStream(),
        lastModified: Date.now(),
    } as unknown as File;
}

describe('Validation Module', () => {

    // ============================================
    // 1.0 Ethereum Address Validation
    // ============================================
    describe('1.0 Ethereum Address Validation', () => {

        test('1.1 Valid lowercase address returns true', () => {
            const address = '0x742d35cc6634c0532925a3b844bc454e4438f44e';
            expect(isValidEthereumAddress(address)).toBe(true);
        });

        test('1.2 Valid uppercase address returns true', () => {
            const address = '0x742D35CC6634C0532925A3B844BC454E4438F44E';
            expect(isValidEthereumAddress(address)).toBe(true);
        });

        test('1.3 Valid mixed case address returns true', () => {
            const address = '0x742d35Cc6634C0532925a3b844Bc454e4438f44e';
            expect(isValidEthereumAddress(address)).toBe(true);
        });

        test('1.4 Address without 0x prefix returns false', () => {
            const address = '742d35cc6634c0532925a3b844bc454e4438f44e';
            expect(isValidEthereumAddress(address)).toBe(false);
        });

        test('1.5 Address with wrong length (too short) returns false', () => {
            const address = '0x742d35cc6634c0532925a3b844bc454e4438f4';
            expect(isValidEthereumAddress(address)).toBe(false);
        });

        test('1.6 Address with wrong length (too long) returns false', () => {
            const address = '0x742d35cc6634c0532925a3b844bc454e4438f44e00';
            expect(isValidEthereumAddress(address)).toBe(false);
        });

        test('1.7 Empty string returns false', () => {
            expect(isValidEthereumAddress('')).toBe(false);
        });

        test('1.8 Address with invalid characters returns false', () => {
            const address = '0x742d35cc6634c0532925a3b844bc454e4438gzzz';
            expect(isValidEthereumAddress(address)).toBe(false);
        });
    });

    // ============================================
    // 2.0 File Size Validation
    // ============================================
    describe('2.0 File Size Validation', () => {

        test('2.1 Empty file returns invalid', () => {
            const file = createMockFile('test.pdf', 0, 'application/pdf');
            const result = isValidFileSize(file);
            expect(result.valid).toBe(false);
            expect(result.error).toBe('File is empty');
        });

        test('2.2 Small file (1KB) returns valid', () => {
            const file = createMockFile('test.pdf', 1024, 'application/pdf');
            const result = isValidFileSize(file);
            expect(result.valid).toBe(true);
            expect(result.error).toBeUndefined();
        });

        test('2.3 Medium file (50MB) returns valid', () => {
            const file = createMockFile('scan.dcm', 50 * 1024 * 1024, 'application/dicom');
            const result = isValidFileSize(file);
            expect(result.valid).toBe(true);
        });

        test('2.4 File at limit (100MB) returns valid', () => {
            const file = createMockFile('large.zip', 100 * 1024 * 1024, 'application/zip');
            const result = isValidFileSize(file);
            expect(result.valid).toBe(true);
        });

        test('2.5 File over limit (150MB) returns invalid', () => {
            const file = createMockFile('huge.zip', 150 * 1024 * 1024, 'application/zip');
            const result = isValidFileSize(file);
            expect(result.valid).toBe(false);
            expect(result.error).toContain('File too large');
            expect(result.error).toContain('150.00MB');
        });

        test('2.6 Legacy simple validation returns boolean', () => {
            const validFile = createMockFile('test.pdf', 1024, 'application/pdf');
            const invalidFile = createMockFile('test.pdf', 0, 'application/pdf');
            expect(isValidFileSizeSimple(validFile)).toBe(true);
            expect(isValidFileSizeSimple(invalidFile)).toBe(false);
        });
    });

    // ============================================
    // 3.0 File Type Validation
    // ============================================
    describe('3.0 File Type Validation', () => {

        test('3.1 PDF file returns valid with document category', () => {
            const file = createMockFile('report.pdf', 1024, 'application/pdf');
            const result = isValidFileType(file);
            expect(result.valid).toBe(true);
            expect(result.category).toBe('document');
        });

        test('3.2 JPEG image returns valid with image category', () => {
            const file = createMockFile('xray.jpg', 1024, 'image/jpeg');
            const result = isValidFileType(file);
            expect(result.valid).toBe(true);
            expect(result.category).toBe('image');
        });

        test('3.3 PNG image returns valid', () => {
            const file = createMockFile('scan.png', 1024, 'image/png');
            const result = isValidFileType(file);
            expect(result.valid).toBe(true);
            expect(result.category).toBe('image');
        });

        test('3.4 DICOM medical file returns valid with medical category', () => {
            const file = createMockFile('ct_scan.dcm', 1024, 'application/dicom');
            const result = isValidFileType(file);
            expect(result.valid).toBe(true);
            expect(result.category).toBe('medical');
        });

        test('3.5 Excel spreadsheet returns valid', () => {
            const file = createMockFile('lab_results.xlsx', 1024,
                'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
            const result = isValidFileType(file);
            expect(result.valid).toBe(true);
            expect(result.category).toBe('spreadsheet');
        });

        test('3.6 ZIP archive returns valid', () => {
            const file = createMockFile('records.zip', 1024, 'application/zip');
            const result = isValidFileType(file);
            expect(result.valid).toBe(true);
            expect(result.category).toBe('archive');
        });

        test('3.7 Executable file returns invalid', () => {
            const file = createMockFile('malware.exe', 1024, 'application/x-msdownload');
            const result = isValidFileType(file);
            expect(result.valid).toBe(false);
            expect(result.error).toContain('Unsupported file type');
        });

        test('3.8 JavaScript file returns invalid', () => {
            const file = createMockFile('script.js', 1024, 'text/javascript');
            const result = isValidFileType(file);
            expect(result.valid).toBe(false);
            expect(result.error).toContain('Unsupported file type');
        });

        test('3.9 HTML file returns invalid', () => {
            const file = createMockFile('page.html', 1024, 'text/html');
            const result = isValidFileType(file);
            expect(result.valid).toBe(false);
        });

        test('3.10 Legacy simple validation returns boolean', () => {
            const validFile = createMockFile('doc.pdf', 1024, 'application/pdf');
            const invalidFile = createMockFile('script.js', 1024, 'text/javascript');
            expect(isValidFileTypeSimple(validFile)).toBe(true);
            expect(isValidFileTypeSimple(invalidFile)).toBe(false);
        });
    });

    // ============================================
    // 4.0 Filename Sanitization
    // ============================================
    describe('4.0 Filename Sanitization', () => {

        test('4.1 Removes special characters', () => {
            const result = sanitizeFileName('test<file>:name.pdf');
            expect(result).toBe('test_file_name.pdf');
        });

        test('4.2 Replaces spaces with underscores', () => {
            const result = sanitizeFileName('my medical report.pdf');
            expect(result).toBe('my_medical_report.pdf');
        });

        test('4.3 Converts to lowercase', () => {
            const result = sanitizeFileName('MyReport.PDF');
            expect(result).toBe('myreport.pdf');
        });

        test('4.4 Removes multiple consecutive underscores', () => {
            const result = sanitizeFileName('test___file.pdf');
            expect(result).toBe('test_file.pdf');
        });

        test('4.5 Removes leading and trailing underscores', () => {
            const result = sanitizeFileName('_test_file_.pdf');
            expect(result).toBe('test_file_.pdf');
        });
    });

    // ============================================
    // 5.0 Filename Validation
    // ============================================
    describe('5.0 Filename Validation', () => {

        test('5.1 Valid filename returns valid with sanitized version', () => {
            const result = isValidFileName('medical_report.pdf');
            expect(result.valid).toBe(true);
            expect(result.sanitized).toBeDefined();
        });

        test('5.2 Empty filename returns invalid', () => {
            const result = isValidFileName('');
            expect(result.valid).toBe(false);
            expect(result.error).toBe('Filename cannot be empty');
        });

        test('5.3 Whitespace-only filename returns invalid', () => {
            const result = isValidFileName('   ');
            expect(result.valid).toBe(false);
            expect(result.error).toBe('Filename cannot be empty');
        });

        test('5.4 Path traversal attempt returns invalid', () => {
            const result = isValidFileName('../../../etc/passwd');
            expect(result.valid).toBe(false);
            expect(result.error).toBe('Filename contains unsafe characters');
        });

        test('5.5 Filename with null byte returns invalid', () => {
            const result = isValidFileName('test\x00file.pdf');
            expect(result.valid).toBe(false);
            expect(result.error).toBe('Filename contains unsafe characters');
        });

        test('5.6 Very long filename (>255 chars) returns invalid', () => {
            const longName = 'a'.repeat(300) + '.pdf';
            const result = isValidFileName(longName);
            expect(result.valid).toBe(false);
            expect(result.error).toBe('Filename too long (max 255 characters)');
        });

        test('5.7 Filename with control characters returns invalid', () => {
            const result = isValidFileName('test\x1Ffile.pdf');
            expect(result.valid).toBe(false);
            expect(result.error).toBe('Filename contains unsafe characters');
        });
    });

    // ============================================
    // 6.0 Doctor Address Validation
    // ============================================
    describe('6.0 Doctor Address Validation', () => {

        test('6.1 Empty string returns valid (no doctors required)', () => {
            const result = validateDoctorAddresses('');
            expect(result.valid).toBe(true);
            expect(result.errors).toHaveLength(0);
        });

        test('6.2 Single valid address returns valid', () => {
            const address = '0x742d35cc6634c0532925a3b844bc454e4438f44e';
            const result = validateDoctorAddresses(address);
            expect(result.valid).toBe(true);
            expect(result.errors).toHaveLength(0);
        });

        test('6.3 Multiple valid addresses (comma-separated) returns valid', () => {
            const addresses = '0x742d35cc6634c0532925a3b844bc454e4438f44e, 0x123456789abcdef0123456789abcdef012345678';
            const result = validateDoctorAddresses(addresses);
            expect(result.valid).toBe(true);
            expect(result.errors).toHaveLength(0);
        });

        test('6.4 Single invalid address returns error', () => {
            const address = 'invalid_address';
            const result = validateDoctorAddresses(address);
            expect(result.valid).toBe(false);
            expect(result.errors).toHaveLength(1);
            expect(result.errors[0]).toContain('not a valid Ethereum address');
        });

        test('6.5 Mix of valid and invalid addresses returns errors for invalid ones', () => {
            const addresses = '0x742d35cc6634c0532925a3b844bc454e4438f44e, invalid_addr, 0x123456789abcdef0123456789abcdef012345678';
            const result = validateDoctorAddresses(addresses);
            expect(result.valid).toBe(false);
            expect(result.errors).toHaveLength(1);
            expect(result.errors[0]).toContain('Address 2');
        });

        test('6.6 Whitespace-only string returns valid', () => {
            const result = validateDoctorAddresses('   ');
            expect(result.valid).toBe(true);
        });
    });
});
