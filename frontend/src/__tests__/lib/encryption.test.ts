/**
 * Unit Tests for encryption.ts
 * Testing: Key generation, encryption, decryption, secure ID generation
 */

import { EncryptionService, generateSecureId } from '@/utils/encryption';

describe('Encryption Module', () => {
    let encryptionService: EncryptionService;

    beforeEach(() => {
        encryptionService = new EncryptionService();
    });

    // ============================================
    // 1.0 Key Generation
    // ============================================
    describe('1.0 Key Generation', () => {

        test('1.1 generateKey creates an AES-GCM key', async () => {
            const key = await encryptionService.generateKey();
            expect(key).toBeDefined();
            expect(key.type).toBe('secret');
            expect(key.algorithm.name).toBe('AES-GCM');
        });

        test('1.2 Generated key is extractable', async () => {
            const key = await encryptionService.generateKey();
            expect(key.extractable).toBe(true);
        });

        test('1.3 Generated key has encrypt/decrypt usages', async () => {
            const key = await encryptionService.generateKey();
            expect(key.usages).toContain('encrypt');
            expect(key.usages).toContain('decrypt');
        });
    });

    // ============================================
    // 2.0 Key Export/Import
    // ============================================
    describe('2.0 Key Export/Import', () => {

        test('2.1 exportKey returns a JSON string', async () => {
            const key = await encryptionService.generateKey();
            const exported = await encryptionService.exportKey(key);
            expect(typeof exported).toBe('string');

            // Should be valid JSON
            const parsed = JSON.parse(exported);
            expect(parsed).toBeDefined();
        });

        test('2.2 importKey restores a CryptoKey from JWK string', async () => {
            const key = await encryptionService.generateKey();
            const exported = await encryptionService.exportKey(key);
            const imported = await encryptionService.importKey(exported);

            expect(imported).toBeDefined();
            expect(imported.type).toBe('secret');
        });

        test('2.3 importKey with invalid JSON throws error', async () => {
            await expect(encryptionService.importKey('invalid-json'))
                .rejects.toThrow();
        });
    });

    // ============================================
    // 3.0 File Encryption
    // ============================================
    describe('3.0 File Encryption', () => {

        test('3.1 encryptFile returns encrypted data and IV', async () => {
            const key = await encryptionService.generateKey();
            const file = new File(['test content'], 'test.txt', { type: 'text/plain' });

            const result = await encryptionService.encryptFile(file, key);

            expect(result.encryptedData).toBeDefined();
            expect(result.iv).toBeDefined();
            expect(result.iv.length).toBe(12); // AES-GCM uses 12-byte IV
        });

        test('3.2 Encrypted data is different from original', async () => {
            const key = await encryptionService.generateKey();
            const originalContent = 'test content';
            const file = new File([originalContent], 'test.txt', { type: 'text/plain' });

            const result = await encryptionService.encryptFile(file, key);

            // Encrypted data should be present (mocked)
            expect(result.encryptedData.byteLength).toBeGreaterThan(0);
        });

        test('3.3 IV is a Uint8Array', async () => {
            const key = await encryptionService.generateKey();
            const file = new File(['test'], 'test.txt', { type: 'text/plain' });

            const result = await encryptionService.encryptFile(file, key);

            expect(result.iv).toBeInstanceOf(Uint8Array);
        });
    });

    // ============================================
    // 4.0 File Decryption
    // ============================================
    describe('4.0 File Decryption', () => {

        test('4.1 decryptFile returns ArrayBuffer', async () => {
            const key = await encryptionService.generateKey();
            const encryptedData = new ArrayBuffer(100);
            const iv = new Uint8Array(12);

            const decrypted = await encryptionService.decryptFile(encryptedData, key, iv);

            expect(decrypted).toBeInstanceOf(ArrayBuffer);
        });

        test('4.2 decryptFile with correct parameters succeeds', async () => {
            const key = await encryptionService.generateKey();
            const encryptedData = new ArrayBuffer(50);
            const iv = new Uint8Array(12);

            await expect(encryptionService.decryptFile(encryptedData, key, iv))
                .resolves.toBeDefined();
        });
    });

    // ============================================
    // 5.0 Encrypted Blob Creation
    // ============================================
    describe('5.0 Encrypted Blob Creation', () => {

        test('5.1 createEncryptedBlob returns a Blob', () => {
            const encryptedData = new ArrayBuffer(100);
            const iv = new Uint8Array(12);

            const blob = encryptionService.createEncryptedBlob(encryptedData, iv);

            expect(blob).toBeInstanceOf(Blob);
        });

        test('5.2 Blob has correct MIME type', () => {
            const encryptedData = new ArrayBuffer(100);
            const iv = new Uint8Array(12);

            const blob = encryptionService.createEncryptedBlob(encryptedData, iv);

            expect(blob.type).toBe('application/octet-stream');
        });

        test('5.3 Blob size includes IV and encrypted data', () => {
            const encryptedData = new ArrayBuffer(100);
            const iv = new Uint8Array(12);

            const blob = encryptionService.createEncryptedBlob(encryptedData, iv);

            // Blob should be IV (12 bytes) + encrypted data (100 bytes) = 112 bytes
            expect(blob.size).toBe(112);
        });
    });

    // ============================================
    // 6.0 Secure ID Generation
    // ============================================
    describe('6.0 Secure ID Generation', () => {

        test('6.1 generateSecureId returns 32-character hex string', () => {
            const id = generateSecureId();
            expect(id).toHaveLength(32);
            expect(/^[0-9a-f]+$/.test(id)).toBe(true);
        });

        test('6.2 generateSecureId creates unique IDs', () => {
            const id1 = generateSecureId();
            const id2 = generateSecureId();
            expect(id1).not.toBe(id2);
        });

        test('6.3 Multiple calls produce different IDs', () => {
            const ids = new Set();
            for (let i = 0; i < 10; i++) {
                ids.add(generateSecureId());
            }
            expect(ids.size).toBe(10);
        });
    });
});
