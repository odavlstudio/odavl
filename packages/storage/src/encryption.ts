/**
 * Encryption Utilities - AES-256-GCM
 */

import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const KEY_LENGTH = 32; // 256 bits
const IV_LENGTH = 16; // 128 bits
const AUTH_TAG_LENGTH = 16; // 128 bits
const SALT_LENGTH = 32; // 256 bits

export interface EncryptedData {
  data: Buffer;
  iv: Buffer;
  authTag: Buffer;
  salt: Buffer;
}

/**
 * Derive encryption key from password using PBKDF2
 */
export function deriveKey(password: string, salt: Buffer): Buffer {
  return crypto.pbkdf2Sync(password, salt, 100000, KEY_LENGTH, 'sha256');
}

/**
 * Generate random salt
 */
export function generateSalt(): Buffer {
  return crypto.randomBytes(SALT_LENGTH);
}

/**
 * Generate random IV
 */
export function generateIV(): Buffer {
  return crypto.randomBytes(IV_LENGTH);
}

/**
 * Encrypt data with AES-256-GCM
 */
export function encrypt(data: Buffer, password: string): EncryptedData {
  // Generate salt and derive key
  const salt = generateSalt();
  const key = deriveKey(password, salt);

  // Generate IV
  const iv = generateIV();

  // Create cipher
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  // Encrypt data
  const encrypted = Buffer.concat([cipher.update(data), cipher.final()]);

  // Get authentication tag
  const authTag = cipher.getAuthTag();

  return {
    data: encrypted,
    iv,
    authTag,
    salt,
  };
}

/**
 * Decrypt data with AES-256-GCM
 */
export function decrypt(
  encrypted: EncryptedData,
  password: string
): Buffer {
  // Derive key from password and salt
  const key = deriveKey(password, encrypted.salt);

  // Create decipher
  const decipher = crypto.createDecipheriv(ALGORITHM, key, encrypted.iv);

  // Set authentication tag
  decipher.setAuthTag(encrypted.authTag);

  // Decrypt data
  const decrypted = Buffer.concat([
    decipher.update(encrypted.data),
    decipher.final(),
  ]);

  return decrypted;
}

/**
 * Serialize encrypted data to Buffer
 */
export function serializeEncrypted(encrypted: EncryptedData): Buffer {
  // Format: [salt_length][salt][iv_length][iv][tag_length][tag][data]
  const saltLength = Buffer.alloc(4);
  saltLength.writeUInt32BE(encrypted.salt.length, 0);

  const ivLength = Buffer.alloc(4);
  ivLength.writeUInt32BE(encrypted.iv.length, 0);

  const tagLength = Buffer.alloc(4);
  tagLength.writeUInt32BE(encrypted.authTag.length, 0);

  return Buffer.concat([
    saltLength,
    encrypted.salt,
    ivLength,
    encrypted.iv,
    tagLength,
    encrypted.authTag,
    encrypted.data,
  ]);
}

/**
 * Deserialize encrypted data from Buffer
 */
export function deserializeEncrypted(buffer: Buffer): EncryptedData {
  let offset = 0;

  // Read salt
  const saltLength = buffer.readUInt32BE(offset);
  offset += 4;
  const salt = buffer.subarray(offset, offset + saltLength);
  offset += saltLength;

  // Read IV
  const ivLength = buffer.readUInt32BE(offset);
  offset += 4;
  const iv = buffer.subarray(offset, offset + ivLength);
  offset += ivLength;

  // Read auth tag
  const tagLength = buffer.readUInt32BE(offset);
  offset += 4;
  const authTag = buffer.subarray(offset, offset + tagLength);
  offset += tagLength;

  // Read encrypted data
  const data = buffer.subarray(offset);

  return { data, iv, authTag, salt };
}

/**
 * Encrypt file content
 */
export function encryptFile(content: Buffer, password: string): Buffer {
  const encrypted = encrypt(content, password);
  return serializeEncrypted(encrypted);
}

/**
 * Decrypt file content
 */
export function decryptFile(encrypted: Buffer, password: string): Buffer {
  const data = deserializeEncrypted(encrypted);
  return decrypt(data, password);
}

/**
 * Hash password for storage (SHA-256)
 */
export function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password).digest('hex');
}

/**
 * Verify password against hash
 */
export function verifyPassword(password: string, hash: string): boolean {
  return hashPassword(password) === hash;
}

/**
 * Generate random encryption key
 */
export function generateEncryptionKey(): string {
  return crypto.randomBytes(KEY_LENGTH).toString('hex');
}
