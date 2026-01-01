require('@testing-library/jest-dom');

// Mock window.crypto for encryption tests
Object.defineProperty(globalThis, 'crypto', {
    value: {
        getRandomValues: (arr) => {
            for (let i = 0; i < arr.length; i++) {
                arr[i] = Math.floor(Math.random() * 256);
            }
            return arr;
        },
        subtle: {
            generateKey: jest.fn().mockResolvedValue({
                type: 'secret',
                algorithm: { name: 'AES-GCM', length: 256 },
                extractable: true,
                usages: ['encrypt', 'decrypt'],
            }),
            exportKey: jest.fn().mockResolvedValue({
                kty: 'oct',
                k: 'test-key-base64',
                alg: 'A256GCM',
                ext: true,
            }),
            importKey: jest.fn().mockResolvedValue({
                type: 'secret',
                algorithm: { name: 'AES-GCM', length: 256 },
                extractable: false,
                usages: ['encrypt', 'decrypt'],
            }),
            encrypt: jest.fn().mockResolvedValue(new ArrayBuffer(100)),
            decrypt: jest.fn().mockResolvedValue(new ArrayBuffer(50)),
        },
    },
});

// Mock fetch for API calls
global.fetch = jest.fn();

// Mock File API
global.File = class MockFile {
    constructor(bits, name, options) {
        this.name = name;
        this.size = bits.reduce((acc, bit) => {
            if (typeof bit === 'string') return acc + bit.length;
            if (bit instanceof ArrayBuffer) return acc + bit.byteLength;
            return acc;
        }, 0);
        this.type = options?.type || '';
    }

    arrayBuffer() {
        return Promise.resolve(new ArrayBuffer(this.size));
    }
};

// Mock FileReader
global.FileReader = class MockFileReader {
    constructor() {
        this.result = null;
        this.onload = null;
        this.onerror = null;
    }

    readAsArrayBuffer(blob) {
        setTimeout(() => {
            this.result = new ArrayBuffer(16);
            if (this.onload) {
                this.onload({ target: { result: this.result } });
            }
        }, 0);
    }
};

// Mock Blob
global.Blob = class MockBlob {
    constructor(parts, options) {
        this.parts = parts;
        this.type = options?.type || '';
        this.size = parts.reduce((acc, part) => {
            if (part instanceof ArrayBuffer) return acc + part.byteLength;
            if (part instanceof Uint8Array) return acc + part.length;
            if (typeof part === 'string') return acc + part.length;
            return acc;
        }, 0);
    }

    arrayBuffer() {
        return Promise.resolve(new ArrayBuffer(this.size));
    }
};

// Mock process.env for validation tests
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-key';
process.env.NEXT_PUBLIC_PINATA_JWT = 'test-jwt';
process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID = 'test-project-id';
