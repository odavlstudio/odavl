/**
 * ODAVL CLI Authentication Service
 * Handles user login, API key management, and credential storage
 * 
 * Features:
 * - Interactive login flow
 * - API key authentication
 * - Secure credential storage
 * - Token refresh
 * - Multi-profile support
 */

import { promises as fs } from 'fs';
import { homedir } from 'os';
import { join } from 'path';
import * as crypto from 'crypto';

export interface AuthCredentials {
  apiKey: string;
  userId: string;
  organizationId: string;
  email: string;
  expiresAt: string;
  refreshToken?: string;
}

export interface AuthProfile {
  name: string;
  credentials: AuthCredentials;
  isDefault: boolean;
  createdAt: string;
  lastUsedAt: string;
}

export interface AuthConfig {
  profiles: Record<string, AuthProfile>;
  defaultProfile?: string;
  apiUrl: string;
}

const CONFIG_DIR = join(homedir(), '.odavl');
const CONFIG_FILE = join(CONFIG_DIR, 'auth.json');
const ENCRYPTION_KEY_FILE = join(CONFIG_DIR, '.key');

/**
 * CLI Authentication Service
 */
export class CLIAuthService {
  private static instance: CLIAuthService;
  private config: AuthConfig | null = null;
  private encryptionKey: Buffer | null = null;
  
  private constructor() {}
  
  public static getInstance(): CLIAuthService {
    if (!CLIAuthService.instance) {
      CLIAuthService.instance = new CLIAuthService();
    }
    return CLIAuthService.instance;
  }
  
  /**
   * Initialize encryption key
   */
  private async initEncryptionKey(): Promise<Buffer> {
    if (this.encryptionKey) {
      return this.encryptionKey;
    }
    
    try {
      // Try to read existing key
      const keyData = await fs.readFile(ENCRYPTION_KEY_FILE, 'utf8');
      this.encryptionKey = Buffer.from(keyData, 'hex');
      return this.encryptionKey;
    } catch {
      // Generate new key
      const key = crypto.randomBytes(32);
      await fs.mkdir(CONFIG_DIR, { recursive: true });
      await fs.writeFile(ENCRYPTION_KEY_FILE, key.toString('hex'), 'utf8');
      await fs.chmod(ENCRYPTION_KEY_FILE, 0o600); // Read/write for owner only
      this.encryptionKey = key;
      return key;
    }
  }
  
  /**
   * Encrypt credentials
   */
  private async encrypt(data: string): Promise<string> {
    const key = await this.initEncryptionKey();
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
    
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
   * Decrypt credentials
   */
  private async decrypt(encryptedData: string): Promise<string> {
    const key = await this.initEncryptionKey();
    const { iv, data, authTag } = JSON.parse(encryptedData);
    
    const decipher = crypto.createDecipheriv(
      'aes-256-gcm',
      key,
      Buffer.from(iv, 'hex')
    );
    
    decipher.setAuthTag(Buffer.from(authTag, 'hex'));
    
    let decrypted = decipher.update(data, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  }
  
  /**
   * Load auth config
   */
  private async loadConfig(): Promise<AuthConfig> {
    if (this.config) {
      return this.config;
    }
    
    try {
      const configData = await fs.readFile(CONFIG_FILE, 'utf8');
      const encryptedConfig = JSON.parse(configData);
      const decryptedData = await this.decrypt(encryptedConfig.data);
      this.config = JSON.parse(decryptedData);
      return this.config!;
    } catch {
      // Return default config if file doesn't exist
      this.config = {
        profiles: {},
        apiUrl: process.env.ODAVL_API_URL || 'https://api.odavl.studio',
      };
      return this.config;
    }
  }
  
  /**
   * Save auth config
   */
  private async saveConfig(): Promise<void> {
    if (!this.config) {
      throw new Error('No config to save');
    }
    
    await fs.mkdir(CONFIG_DIR, { recursive: true });
    
    const configJson = JSON.stringify(this.config, null, 2);
    const encrypted = await this.encrypt(configJson);
    
    await fs.writeFile(
      CONFIG_FILE,
      JSON.stringify({ data: encrypted }, null, 2),
      'utf8'
    );
    await fs.chmod(CONFIG_FILE, 0o600); // Read/write for owner only
  }
  
  /**
   * Login with API key
   */
  public async login(apiKey: string, profileName: string = 'default'): Promise<void> {
    const config = await this.loadConfig();
    
    // Validate API key with server
    const response = await fetch(`${config.apiUrl}/v1/auth/validate`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      throw new Error('Invalid API key');
    }
    
    const data = await response.json();
    
    // Store credentials
    const credentials: AuthCredentials = {
      apiKey,
      userId: data.userId,
      organizationId: data.organizationId,
      email: data.email,
      expiresAt: data.expiresAt,
      refreshToken: data.refreshToken,
    };
    
    const profile: AuthProfile = {
      name: profileName,
      credentials,
      isDefault: !config.defaultProfile || profileName === 'default',
      createdAt: new Date().toISOString(),
      lastUsedAt: new Date().toISOString(),
    };
    
    config.profiles[profileName] = profile;
    
    if (profile.isDefault) {
      config.defaultProfile = profileName;
    }
    
    this.config = config;
    await this.saveConfig();
  }
  
  /**
   * Logout (remove profile)
   */
  public async logout(profileName?: string): Promise<void> {
    const config = await this.loadConfig();
    const profile = profileName || config.defaultProfile;
    
    if (!profile) {
      throw new Error('No profile to logout');
    }
    
    delete config.profiles[profile];
    
    if (config.defaultProfile === profile) {
      // Set new default if available
      const remainingProfiles = Object.keys(config.profiles);
      config.defaultProfile = remainingProfiles.length > 0 ? remainingProfiles[0] : undefined;
    }
    
    this.config = config;
    await this.saveConfig();
  }
  
  /**
   * Get current credentials
   */
  public async getCredentials(profileName?: string): Promise<AuthCredentials | null> {
    const config = await this.loadConfig();
    const profile = profileName || config.defaultProfile;
    
    if (!profile || !config.profiles[profile]) {
      return null;
    }
    
    const profileData = config.profiles[profile];
    
    // Update last used
    profileData.lastUsedAt = new Date().toISOString();
    this.config = config;
    await this.saveConfig();
    
    // Check if expired
    if (new Date(profileData.credentials.expiresAt) < new Date()) {
      // Try to refresh
      try {
        await this.refreshToken(profile);
        return config.profiles[profile].credentials;
      } catch {
        return null;
      }
    }
    
    return profileData.credentials;
  }
  
  /**
   * Refresh token
   */
  public async refreshToken(profileName?: string): Promise<void> {
    const config = await this.loadConfig();
    const profile = profileName || config.defaultProfile;
    
    if (!profile || !config.profiles[profile]) {
      throw new Error('Profile not found');
    }
    
    const { refreshToken } = config.profiles[profile].credentials;
    
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }
    
    const response = await fetch(`${config.apiUrl}/v1/auth/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refreshToken }),
    });
    
    if (!response.ok) {
      throw new Error('Failed to refresh token');
    }
    
    const data = await response.json();
    
    // Update credentials
    config.profiles[profile].credentials = {
      ...config.profiles[profile].credentials,
      apiKey: data.apiKey,
      expiresAt: data.expiresAt,
      refreshToken: data.refreshToken,
    };
    
    this.config = config;
    await this.saveConfig();
  }
  
  /**
   * List all profiles
   */
  public async listProfiles(): Promise<AuthProfile[]> {
    const config = await this.loadConfig();
    return Object.values(config.profiles);
  }
  
  /**
   * Switch default profile
   */
  public async switchProfile(profileName: string): Promise<void> {
    const config = await this.loadConfig();
    
    if (!config.profiles[profileName]) {
      throw new Error(`Profile '${profileName}' not found`);
    }
    
    // Update default flags
    Object.values(config.profiles).forEach(profile => {
      profile.isDefault = profile.name === profileName;
    });
    
    config.defaultProfile = profileName;
    
    this.config = config;
    await this.saveConfig();
  }
  
  /**
   * Get API URL
   */
  public async getApiUrl(): Promise<string> {
    const config = await this.loadConfig();
    return config.apiUrl;
  }
  
  /**
   * Check if authenticated
   */
  public async isAuthenticated(): Promise<boolean> {
    const credentials = await this.getCredentials();
    return credentials !== null;
  }
  
  /**
   * Get current user info
   */
  public async getCurrentUser(): Promise<{
    userId: string;
    email: string;
    organizationId: string;
    profileName: string;
  } | null> {
    const config = await this.loadConfig();
    const profileName = config.defaultProfile;
    
    if (!profileName || !config.profiles[profileName]) {
      return null;
    }
    
    const profile = config.profiles[profileName];
    
    return {
      userId: profile.credentials.userId,
      email: profile.credentials.email,
      organizationId: profile.credentials.organizationId,
      profileName: profile.name,
    };
  }
}

// Singleton instance
export const cliAuthService = CLIAuthService.getInstance();
