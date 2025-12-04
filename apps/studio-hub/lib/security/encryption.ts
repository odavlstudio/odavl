/**
 * Data Encryption Utilities for SOC 2 Compliance
 * 
 * Provides encryption at rest and in transit for sensitive data.
 * Uses industry-standard algorithms (AES-256-GCM).
 * 
 * SOC 2 Requirements:
 * - CC6.7: Encryption of sensitive data
 * - CC6.6: Logical access security measures
 */

import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const KEY_LENGTH = 32; // 256 bits
const IV_LENGTH = 16;  // 128 bits
const AUTH_TAG_LENGTH = 16;

/**
 * Get encryption key from environment (rotatable)
 */
function getEncryptionKey(): Buffer {
  const key = process.env.ENCRYPTION_KEY;
  
  if (!key) {
    throw new Error('ENCRYPTION_KEY environment variable not set');
  }
  
  // Ensure key is exactly 32 bytes
  return Buffer.from(key, 'hex');
}

/**
 * Encrypt sensitive data using AES-256-GCM
 */
export function encrypt(plaintext: string): string {
  const key = getEncryptionKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  
  let encrypted = cipher.update(plaintext, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  const authTag = cipher.getAuthTag();
  
  // Return: iv:authTag:encrypted
  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
}

/**
 * Decrypt data encrypted with encrypt()
 */
export function decrypt(ciphertext: string): string {
  const key = getEncryptionKey();
  const [ivHex, authTagHex, encrypted] = ciphertext.split(':');
  
  if (!ivHex || !authTagHex || !encrypted) {
    throw new Error('Invalid ciphertext format');
  }
  
  const iv = Buffer.from(ivHex, 'hex');
  const authTag = Buffer.from(authTagHex, 'hex');
  
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);
  
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  
  return decrypted;
}

/**
 * Hash sensitive data (one-way, for comparison)
 */
export function hash(data: string): string {
  return crypto
    .createHash('sha256')
    .update(data)
    .digest('hex');
}

/**
 * Generate secure random token
 */
export function generateToken(length: number = 32): string {
  return crypto.randomBytes(length).toString('hex');
}

/**
 * Encrypt API keys for storage
 */
export function encryptApiKey(apiKey: string): string {
  return encrypt(apiKey);
}

/**
 * Decrypt API keys for usage
 */
export function decryptApiKey(encryptedKey: string): string {
  return decrypt(encryptedKey);
}

/**
 * Mask sensitive data for display (e.g., "sk_test_***abc123")
 */
export function maskSensitiveData(data: string, visibleStart: number = 4, visibleEnd: number = 6): string {
  if (data.length <= visibleStart + visibleEnd) {
    return '*'.repeat(data.length);
  }
  
  const start = data.substring(0, visibleStart);
  const end = data.substring(data.length - visibleEnd);
  const masked = '*'.repeat(Math.min(data.length - visibleStart - visibleEnd, 20));
  
  return `${start}${masked}${end}`;
}

/**
 * Encrypt database connection string
 */
export function encryptConnectionString(connectionString: string): string {
  return encrypt(connectionString);
}

/**
 * Decrypt database connection string
 */
export function decryptConnectionString(encrypted: string): string {
  return decrypt(encrypted);
}

/**
 * Rotate encryption key (for periodic key rotation)
 */
export async function rotateEncryptionKey(
  oldKey: string,
  newKey: string,
  encryptedData: string[]
): Promise<string[]> {
  // Temporarily set old key
  const originalKey = process.env.ENCRYPTION_KEY;
  process.env.ENCRYPTION_KEY = oldKey;
  
  // Decrypt with old key
  const decryptedData = encryptedData.map(data => decrypt(data));
  
  // Set new key
  process.env.ENCRYPTION_KEY = newKey;
  
  // Re-encrypt with new key
  const reencryptedData = decryptedData.map(data => encrypt(data));
  
  // Restore original key
  process.env.ENCRYPTION_KEY = originalKey;
  
  return reencryptedData;
}

/**
 * Verify data integrity using HMAC
 */
export function generateHMAC(data: string, secret?: string): string {
  const key = secret || process.env.HMAC_SECRET || getEncryptionKey().toString('hex');
  
  return crypto
    .createHmac('sha256', key)
    .update(data)
    .digest('hex');
}

/**
 * Verify HMAC signature
 */
export function verifyHMAC(data: string, signature: string, secret?: string): boolean {
  const expected = generateHMAC(data, secret);
  return crypto.timingSafeEqual(
    Buffer.from(signature, 'hex'),
    Buffer.from(expected, 'hex')
  );
}

/**
 * Encrypt PII (Personally Identifiable Information)
 */
export interface EncryptedPII {
  email?: string;
  phone?: string;
  address?: string;
  ssn?: string;
}

export function encryptPII(pii: EncryptedPII): EncryptedPII {
  const encrypted: EncryptedPII = {};
  
  if (pii.email) encrypted.email = encrypt(pii.email);
  if (pii.phone) encrypted.phone = encrypt(pii.phone);
  if (pii.address) encrypted.address = encrypt(pii.address);
  if (pii.ssn) encrypted.ssn = encrypt(pii.ssn);
  
  return encrypted;
}

export function decryptPII(encrypted: EncryptedPII): EncryptedPII {
  const decrypted: EncryptedPII = {};
  
  if (encrypted.email) decrypted.email = decrypt(encrypted.email);
  if (encrypted.phone) decrypted.phone = decrypt(encrypted.phone);
  if (encrypted.address) decrypted.address = decrypt(encrypted.address);
  if (encrypted.ssn) decrypted.ssn = decrypt(encrypted.ssn);
  
  return decrypted;
}

/**
 * Generate encryption key (for initial setup)
 */
export function generateEncryptionKey(): string {
  return crypto.randomBytes(KEY_LENGTH).toString('hex');
}
