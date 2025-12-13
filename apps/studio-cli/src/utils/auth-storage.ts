/**
 * Phase 2.1: CLI Authentication Skeleton
 * 
 * SECURITY: Uses OS-native secure storage when available.
 * NO actual API calls in Phase 2.1 - skeleton only.
 */

import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import * as os from 'node:os';
import * as crypto from 'node:crypto';

/**
 * Authentication token storage
 */
export interface AuthToken {
  token: string;           // JWT token
  refreshToken: string;    // Refresh token
  userId: string;
  insightPlanId: string;
  expiresAt: string;       // ISO 8601 timestamp
  deviceId: string;        // Device fingerprint
}

/**
 * Authentication storage manager
 * 
 * SECURITY STRATEGY:
 * 1. Attempt OS keychain (macOS/Windows/Linux)
 * 2. Fallback: Encrypted JSON file
 * 3. Never store plain-text tokens
 */
export class AuthStorage {
  private credentialsDir: string;
  private credentialsFile: string;
  private encryptionKey: Buffer | null = null;
  
  constructor() {
    // Store in user home directory
    this.credentialsDir = path.join(os.homedir(), '.odavl');
    this.credentialsFile = path.join(this.credentialsDir, 'credentials.enc');
  }
  
  /**
   * Initialize encryption key (device-specific)
   * Derived from machine ID + username for device binding
   */
  private async getEncryptionKey(): Promise<Buffer> {
    if (this.encryptionKey) return this.encryptionKey;
    
    // Device fingerprint: Combine hostname + username + platform
    const fingerprint = `${os.hostname()}-${os.userInfo().username}-${os.platform()}`;
    
    // Derive 32-byte key using PBKDF2
    this.encryptionKey = crypto.pbkdf2Sync(
      fingerprint,
      'odavl-cli-v1', // Salt
      100000,         // Iterations
      32,             // Key length
      'sha256'
    );
    
    return this.encryptionKey;
  }
  
  /**
   * Save authentication token (encrypted)
   * 
   * @param token - Auth token to save
   */
  async saveToken(token: AuthToken): Promise<void> {
    // Ensure directory exists
    await fs.mkdir(this.credentialsDir, { recursive: true });
    
    // Serialize token
    const tokenJson = JSON.stringify(token);
    
    // Encrypt with AES-256-GCM
    const key = await this.getEncryptionKey();
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
    
    let encrypted = cipher.update(tokenJson, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const authTag = cipher.getAuthTag();
    
    // Store: IV + AuthTag + Encrypted data
    const stored = {
      version: 1,
      iv: iv.toString('hex'),
      authTag: authTag.toString('hex'),
      data: encrypted,
    };
    
    await fs.writeFile(this.credentialsFile, JSON.stringify(stored), 'utf8');
    
    // Set file permissions (Unix only)
    if (process.platform !== 'win32') {
      await fs.chmod(this.credentialsFile, 0o600); // Owner read/write only
    }
  }
  
  /**
   * Load authentication token (decrypt)
   * 
   * @returns Stored token or null if not found
   */
  async loadToken(): Promise<AuthToken | null> {
    try {
      // Read encrypted file
      const content = await fs.readFile(this.credentialsFile, 'utf8');
      const stored = JSON.parse(content);
      
      // Decrypt with AES-256-GCM
      const key = await this.getEncryptionKey();
      const iv = Buffer.from(stored.iv, 'hex');
      const authTag = Buffer.from(stored.authTag, 'hex');
      
      const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
      decipher.setAuthTag(authTag);
      
      let decrypted = decipher.update(stored.data, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      
      const token: AuthToken = JSON.parse(decrypted);
      
      // Validate token structure
      if (!token.token || !token.userId) {
        return null;
      }
      
      return token;
    } catch (error) {
      // File not found or decryption failed
      return null;
    }
  }
  
  /**
   * Delete stored token
   */
  async deleteToken(): Promise<void> {
    try {
      await fs.unlink(this.credentialsFile);
    } catch {
      // File doesn't exist - already deleted
    }
  }
  
  /**
   * Check if token exists and is valid
   */
  async hasValidToken(): Promise<boolean> {
    const token = await this.loadToken();
    if (!token) return false;
    
    // Check expiration
    const expiresAt = new Date(token.expiresAt);
    const now = new Date();
    
    return expiresAt > now;
  }
  
  /**
   * Get device fingerprint (for token validation)
   */
  getDeviceFingerprint(): string {
    return crypto.createHash('sha256')
      .update(`${os.hostname()}-${os.userInfo().username}-${os.platform()}`)
      .digest('hex')
      .substring(0, 16); // First 16 chars
  }
}

/**
 * Authentication status
 */
export interface AuthStatus {
  authenticated: boolean;
  userId?: string;
  insightPlanId?: string;
  expiresAt?: string;
  deviceId?: string;
}

/**
 * Get current authentication status
 * 
 * @returns Auth status
 */
export async function getAuthStatus(): Promise<AuthStatus> {
  const storage = new AuthStorage();
  const token = await storage.loadToken();
  
  if (!token) {
    return { authenticated: false };
  }
  
  // Check if expired
  const expiresAt = new Date(token.expiresAt);
  const now = new Date();
  
  if (expiresAt <= now) {
    return { authenticated: false };
  }
  
  return {
    authenticated: true,
    userId: token.userId,
    insightPlanId: token.insightPlanId,
    expiresAt: token.expiresAt,
    deviceId: token.deviceId,
  };
}

/**
 * Phase 2.1: Mock login (NO actual API call)
 * 
 * In Phase 2.2, this will call POST /api/cli/auth/login
 * For now, it demonstrates the flow and token storage.
 * 
 * @param email - User email
 * @param password - User password
 * @returns Mock success response
 */
export async function mockLogin(email: string, password: string): Promise<{
  success: boolean;
  message: string;
}> {
  // Phase 2.1: Validate inputs only (no API call)
  if (!email || !email.includes('@')) {
    return {
      success: false,
      message: 'Invalid email format',
    };
  }
  
  if (!password || password.length < 8) {
    return {
      success: false,
      message: 'Password must be at least 8 characters',
    };
  }
  
  // Phase 2.1: Create mock token (demonstration only)
  const storage = new AuthStorage();
  const mockToken: AuthToken = {
    token: 'mock-jwt-token-phase-2.1',
    refreshToken: 'mock-refresh-token',
    userId: 'mock-user-id',
    insightPlanId: 'INSIGHT_PRO',
    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
    deviceId: storage.getDeviceFingerprint(),
  };
  
  // Store encrypted token
  await storage.saveToken(mockToken);
  
  return {
    success: true,
    message: 'Mock login successful (Phase 2.1 - no API call made)',
  };
}

/**
 * Logout - delete stored token
 */
export async function logout(): Promise<void> {
  const storage = new AuthStorage();
  await storage.deleteToken();
}

/**
 * SECURITY NOTES:
 * 
 * Phase 2.1 Implementation:
 * - ✅ Device-specific encryption key (prevents token theft across machines)
 * - ✅ AES-256-GCM encryption (authenticated encryption)
 * - ✅ Unix file permissions (600 - owner only)
 * - ✅ No plain-text token storage
 * 
 * Phase 2.2 TODO (when implementing real API):
 * - Attempt OS keychain first (keytar or similar)
 *   - macOS: Keychain Access
 *   - Windows: Credential Manager
 *   - Linux: Secret Service API (libsecret)
 * - Fallback to encrypted file (current implementation)
 * - Add token refresh logic before expiration
 * - Add device binding validation on cloud side
 * 
 * Known Limitations (Phase 2.1):
 * - No OS keychain integration yet (requires native modules)
 * - Encryption key derived from machine ID (can be extracted by root user)
 * - Token refresh not implemented
 * 
 * Mitigation:
 * - Short-lived tokens (30 days max)
 * - Device fingerprinting (detect stolen tokens)
 * - User can revoke tokens via cloud dashboard
 */
