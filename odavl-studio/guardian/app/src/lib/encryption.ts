/**
 * API Key Encryption Utility
 * 
 * Week 12: Beta Launch - Security Enhancement
 * 
 * Encrypts API keys at rest using AES-256-GCM.
 * Provides encryption/decryption functions for sensitive data.
 */

import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';

// Encryption algorithm
const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16; // AES block size
const TAG_LENGTH = 16; // Authentication tag length
const SALT_LENGTH = 64;

/**
 * Get encryption key from environment
 * In production, use AWS KMS, Azure Key Vault, or similar
 */
function getEncryptionKey(): Buffer {
    const key = process.env.ENCRYPTION_KEY;

    if (!key) {
        throw new Error('ENCRYPTION_KEY environment variable is not set');
    }

    // Key must be 32 bytes for AES-256
    if (Buffer.from(key, 'hex').length !== 32) {
        throw new Error('ENCRYPTION_KEY must be 32 bytes (64 hex characters)');
    }

    return Buffer.from(key, 'hex');
}

/**
 * Encrypt sensitive data (API keys, secrets, etc.)
 * @param plaintext - Data to encrypt
 * @returns Encrypted data with IV and auth tag (format: iv:encrypted:tag)
 */
export function encrypt(plaintext: string): string {
    try {
        const key = getEncryptionKey();
        const iv = randomBytes(IV_LENGTH);

        const cipher = createCipheriv(ALGORITHM, key, iv);

        let encrypted = cipher.update(plaintext, 'utf8', 'hex');
        encrypted += cipher.final('hex');

        const tag = cipher.getAuthTag();

        // Return format: iv:encrypted:tag (all hex-encoded)
        return `${iv.toString('hex')}:${encrypted}:${tag.toString('hex')}`;
    } catch (error) {
        throw new Error(`Encryption failed: ${error}`);
    }
}

/**
 * Decrypt sensitive data
 * @param ciphertext - Encrypted data (format: iv:encrypted:tag)
 * @returns Decrypted plaintext
 */
export function decrypt(ciphertext: string): string {
    try {
        const key = getEncryptionKey();

        // Parse format: iv:encrypted:tag
        const parts = ciphertext.split(':');
        if (parts.length !== 3) {
            throw new Error('Invalid ciphertext format');
        }

        const iv = Buffer.from(parts[0], 'hex');
        const encrypted = parts[1];
        const tag = Buffer.from(parts[2], 'hex');

        const decipher = createDecipheriv(ALGORITHM, key, iv);
        decipher.setAuthTag(tag);

        let decrypted = decipher.update(encrypted, 'hex', 'utf8');
        decrypted += decipher.final('utf8');

        return decrypted;
    } catch (error) {
        throw new Error(`Decryption failed: ${error}`);
    }
}

/**
 * Generate a secure encryption key
 * Run this once and store in environment variable
 * @returns 32-byte hex-encoded encryption key
 */
export function generateEncryptionKey(): string {
    return randomBytes(32).toString('hex');
}

/**
 * Encrypt API key before storing in database
 * @param apiKey - Plaintext API key
 * @returns Encrypted API key
 */
export function encryptApiKey(apiKey: string): string {
    return encrypt(apiKey);
}

/**
 * Decrypt API key from database
 * @param encryptedApiKey - Encrypted API key from database
 * @returns Plaintext API key
 */
export function decryptApiKey(encryptedApiKey: string): string {
    return decrypt(encryptedApiKey);
}

/**
 * Validate that encrypted data can be decrypted
 * Useful for testing encryption/decryption
 * @param ciphertext - Encrypted data
 * @returns boolean - True if valid
 */
export function validateEncryptedData(ciphertext: string): boolean {
    try {
        decrypt(ciphertext);
        return true;
    } catch {
        return false;
    }
}
