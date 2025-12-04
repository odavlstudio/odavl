/**
 * Credential Store - Secure storage for API keys and tokens
 * 
 * Stores credentials in encrypted format at ~/.odavl/credentials.json
 */

import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import * as os from 'node:os';
import { createCipheriv, createDecipheriv, randomBytes, scrypt } from 'node:crypto';
import { promisify } from 'node:util';

const scryptAsync = promisify(scrypt);

export interface StoredCredentials {
  apiKey?: string;
  accessToken?: string;
  refreshToken?: string;
  expiresAt?: number;
  orgId?: string;
  userId?: string;
}

export class CredentialStore {
  private credentialsPath: string;
  private encryptionKey: Buffer | null = null;

  constructor() {
    const homeDir = os.homedir();
    const odavlDir = path.join(homeDir, '.odavl');
    this.credentialsPath = path.join(odavlDir, 'credentials.json');
  }

  /**
   * Initialize encryption key from password
   * Uses machine ID as default password for convenience
   */
  private async getEncryptionKey(): Promise<Buffer> {
    if (this.encryptionKey) {
      return this.encryptionKey;
    }

    // Use machine ID + hostname as password (basic security)
    const password = `${os.hostname()}-${os.userInfo().username}`;
    this.encryptionKey = (await scryptAsync(password, 'salt', 32)) as Buffer;
    return this.encryptionKey;
  }

  /**
   * Encrypt data using AES-256-GCM
   */
  private async encrypt(data: string): Promise<string> {
    const key = await this.getEncryptionKey();
    const iv = randomBytes(16);
    const cipher = createCipheriv('aes-256-gcm', key, iv);
    
    let encrypted = cipher.update(data, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const authTag = cipher.getAuthTag();
    
    return JSON.stringify({
      iv: iv.toString('hex'),
      data: encrypted,
      authTag: authTag.toString('hex'),
    });
  }

  /**
   * Decrypt data using AES-256-GCM
   */
  private async decrypt(encryptedData: string): Promise<string> {
    const key = await this.getEncryptionKey();
    const parsed = JSON.parse(encryptedData);
    
    const decipher = createDecipheriv(
      'aes-256-gcm',
      key,
      Buffer.from(parsed.iv, 'hex')
    );
    
    decipher.setAuthTag(Buffer.from(parsed.authTag, 'hex'));
    
    let decrypted = decipher.update(parsed.data, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  }

  /**
   * Save credentials to disk (encrypted)
   */
  async save(credentials: StoredCredentials): Promise<void> {
    const dir = path.dirname(this.credentialsPath);
    await fs.mkdir(dir, { recursive: true });
    
    const json = JSON.stringify(credentials, null, 2);
    const encrypted = await this.encrypt(json);
    
    await fs.writeFile(this.credentialsPath, encrypted, 'utf8');
  }

  /**
   * Load credentials from disk (decrypt)
   */
  async load(): Promise<StoredCredentials | null> {
    try {
      const encrypted = await fs.readFile(this.credentialsPath, 'utf8');
      const decrypted = await this.decrypt(encrypted);
      return JSON.parse(decrypted);
    } catch (error: any) {
      if (error.code === 'ENOENT') {
        return null; // File doesn't exist
      }
      throw error;
    }
  }

  /**
   * Clear credentials (delete file)
   */
  async clear(): Promise<void> {
    try {
      await fs.unlink(this.credentialsPath);
    } catch (error: any) {
      if (error.code !== 'ENOENT') {
        throw error;
      }
    }
  }

  /**
   * Check if credentials exist
   */
  async exists(): Promise<boolean> {
    try {
      await fs.access(this.credentialsPath);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get API key from credentials or environment variable
   */
  async getApiKey(): Promise<string | null> {
    // Priority 1: Environment variable
    if (process.env.ODAVL_API_KEY) {
      return process.env.ODAVL_API_KEY;
    }

    // Priority 2: Stored credentials
    const credentials = await this.load();
    return credentials?.apiKey || null;
  }

  /**
   * Get access token (check expiry)
   */
  async getAccessToken(): Promise<string | null> {
    const credentials = await this.load();
    
    if (!credentials?.accessToken) {
      return null;
    }

    // Check if token is expired
    if (credentials.expiresAt && Date.now() >= credentials.expiresAt) {
      return null; // Token expired
    }

    return credentials.accessToken;
  }
}
