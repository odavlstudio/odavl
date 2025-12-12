/**
 * Device Code Flow - OAuth 2.0 Device Authorization Grant
 * 
 * Enables secure authentication for CLI and headless environments.
 * User logs in via browser while CLI polls for authorization.
 * 
 * Flow:
 * 1. CLI requests device code from server
 * 2. Server generates device code + user code
 * 3. CLI displays user code and opens browser
 * 4. User logs in and enters user code
 * 5. Server associates device code with user session
 * 6. CLI polls until authorized, receives tokens
 * 
 * Based on RFC 8628: https://tools.ietf.org/html/rfc8628
 */

import crypto from 'crypto';

/**
 * Device code request response
 * Returned to CLI after requesting device code
 */
export interface DeviceCodeResponse {
  /**
   * Device verification code (long-lived, internal)
   * CLI uses this to poll for authorization
   */
  deviceCode: string;
  
  /**
   * User verification code (short, human-readable)
   * User enters this in browser (e.g., "ABCD-1234")
   */
  userCode: string;
  
  /**
   * URL where user completes authorization
   * CLI opens this in browser
   */
  verificationUri: string;
  
  /**
   * Optional complete URI with user code embedded
   * Skips manual code entry (e.g., https://odavl.com/device?code=ABCD-1234)
   */
  verificationUriComplete?: string;
  
  /**
   * Seconds until device code expires (typically 600 = 10 minutes)
   */
  expiresIn: number;
  
  /**
   * Minimum seconds between polling requests (typically 5)
   */
  interval: number;
}

/**
 * Token response after successful authorization
 * Returned when CLI polls and user has authorized
 */
export interface DeviceTokenResponse {
  /**
   * Access token (JWT with user context)
   */
  accessToken: string;
  
  /**
   * Refresh token for obtaining new access tokens
   */
  refreshToken: string;
  
  /**
   * Token type (always "Bearer")
   */
  tokenType: 'Bearer';
  
  /**
   * Seconds until access token expires (typically 900 = 15 minutes)
   */
  expiresIn: number;
}

/**
 * Polling error types (RFC 8628 Section 3.5)
 */
export type DeviceFlowError =
  | 'authorization_pending'  // User hasn't completed authorization yet
  | 'slow_down'              // CLI polling too fast, increase interval
  | 'expired_token'          // Device code expired, start over
  | 'access_denied';         // User declined authorization

/**
 * Generate device code (40 chars, cryptographically secure)
 * 
 * Used internally by server to track authorization requests.
 * Never shown to user.
 */
export function generateDeviceCode(): string {
  return crypto.randomBytes(20).toString('hex'); // 40 hex chars
}

/**
 * Generate user code (8 chars, human-readable)
 * 
 * Format: XXXX-XXXX (uppercase letters/numbers, no ambiguous chars)
 * Excludes: 0, O, I, 1 to prevent confusion
 */
export function generateUserCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // No 0, O, I, 1
  let code = '';
  
  for (let i = 0; i < 8; i++) {
    if (i === 4) {
      code += '-'; // Add hyphen in middle for readability
    }
    const randomIndex = crypto.randomInt(0, chars.length);
    code += chars[randomIndex];
  }
  
  return code;
}

/**
 * Storage interface for device codes
 * Implement this interface with your preferred storage (Redis, DB, memory)
 */
export interface DeviceCodeStore {
  /**
   * Store device code with metadata
   * 
   * @param deviceCode Device verification code
   * @param data Device code metadata
   * @param ttlSeconds Time-to-live in seconds
   */
  set(
    deviceCode: string,
    data: {
      userCode: string;
      clientId: string;
      createdAt: Date;
      expiresAt: Date;
      userId?: string; // Set after user authorizes
    },
    ttlSeconds: number
  ): Promise<void>;
  
  /**
   * Retrieve device code metadata
   * 
   * @param deviceCode Device verification code
   * @returns Metadata or null if not found/expired
   */
  get(deviceCode: string): Promise<{
    userCode: string;
    clientId: string;
    createdAt: Date;
    expiresAt: Date;
    userId?: string;
  } | null>;
  
  /**
   * Retrieve device code by user code
   * 
   * @param userCode User-entered code (e.g., "ABCD-1234")
   * @returns Device code or null if not found
   */
  getByUserCode(userCode: string): Promise<string | null>;
  
  /**
   * Mark device code as authorized
   * 
   * @param deviceCode Device verification code
   * @param userId User ID who authorized
   */
  authorize(deviceCode: string, userId: string): Promise<void>;
  
  /**
   * Delete device code (after successful token exchange or expiry)
   * 
   * @param deviceCode Device verification code
   */
  delete(deviceCode: string): Promise<void>;
}

/**
 * Device code flow manager
 * Encapsulates device authorization logic
 */
export class DeviceCodeFlow {
  private store: DeviceCodeStore;
  private verificationBaseUrl: string;
  private defaultExpirySeconds: number;
  private defaultPollingInterval: number;
  
  constructor(
    store: DeviceCodeStore,
    options: {
      verificationBaseUrl: string;
      expirySeconds?: number;
      pollingInterval?: number;
    }
  ) {
    this.store = store;
    this.verificationBaseUrl = options.verificationBaseUrl;
    this.defaultExpirySeconds = options.expirySeconds || 600; // 10 minutes
    this.defaultPollingInterval = options.pollingInterval || 5; // 5 seconds
  }
  
  /**
   * Request device code (Step 1 - CLI calls this)
   * 
   * @param clientId Client identifier (e.g., "odavl-cli", "odavl-vscode")
   * @returns Device code response for CLI
   */
  async requestDeviceCode(clientId: string): Promise<DeviceCodeResponse> {
    const deviceCode = generateDeviceCode();
    const userCode = generateUserCode();
    const now = new Date();
    const expiresAt = new Date(now.getTime() + this.defaultExpirySeconds * 1000);
    
    // Store device code
    await this.store.set(
      deviceCode,
      {
        userCode,
        clientId,
        createdAt: now,
        expiresAt,
      },
      this.defaultExpirySeconds
    );
    
    // Build verification URLs
    const verificationUri = `${this.verificationBaseUrl}/device`;
    const verificationUriComplete = `${verificationUri}?user_code=${userCode}`;
    
    return {
      deviceCode,
      userCode,
      verificationUri,
      verificationUriComplete,
      expiresIn: this.defaultExpirySeconds,
      interval: this.defaultPollingInterval,
    };
  }
  
  /**
   * Authorize device with user session (Step 2 - Cloud backend calls this)
   * 
   * Called after user logs in and enters user code in browser.
   * 
   * @param userCode User-entered code (e.g., "ABCD-1234")
   * @param userId User ID from authenticated session
   * @throws Error if user code invalid or expired
   */
  async authorizeDevice(userCode: string, userId: string): Promise<void> {
    // Find device code by user code
    const deviceCode = await this.store.getByUserCode(userCode);
    if (!deviceCode) {
      throw new Error('Invalid or expired user code');
    }
    
    // Verify not expired
    const data = await this.store.get(deviceCode);
    if (!data || data.expiresAt < new Date()) {
      throw new Error('Device code expired');
    }
    
    // Mark as authorized
    await this.store.authorize(deviceCode, userId);
  }
  
  /**
   * Poll for token (Step 3 - CLI polls this)
   * 
   * Returns tokens if authorized, throws specific error if pending/denied/expired.
   * 
   * @param deviceCode Device verification code
   * @returns Token response or throws DeviceFlowError
   * @throws Error with DeviceFlowError type
   */
  async pollForToken(deviceCode: string): Promise<DeviceTokenResponse> {
    const data = await this.store.get(deviceCode);
    
    if (!data) {
      throw this.createError('expired_token', 'Device code not found or expired');
    }
    
    // Check expiry
    if (data.expiresAt < new Date()) {
      await this.store.delete(deviceCode);
      throw this.createError('expired_token', 'Device code expired');
    }
    
    // Check if authorized
    if (!data.userId) {
      throw this.createError('authorization_pending', 'User has not authorized yet');
    }
    
    // Authorization complete! Return tokens (caller should generate with userId)
    // Note: Actual token generation happens in caller (has access to user data)
    throw new Error('AUTHORIZED:' + data.userId);
  }
  
  /**
   * Delete device code after successful token exchange
   * 
   * @param deviceCode Device verification code
   */
  async consumeDeviceCode(deviceCode: string): Promise<void> {
    await this.store.delete(deviceCode);
  }
  
  /**
   * Create typed error for device flow
   */
  private createError(type: DeviceFlowError, message: string): Error {
    const error = new Error(message);
    error.name = type;
    return error;
  }
}

/**
 * In-memory device code store (for development/testing)
 * Production should use Redis or database
 */
export class InMemoryDeviceCodeStore implements DeviceCodeStore {
  private codes = new Map<string, {
    userCode: string;
    clientId: string;
    createdAt: Date;
    expiresAt: Date;
    userId?: string;
  }>();
  
  private userCodeIndex = new Map<string, string>(); // userCode → deviceCode
  
  async set(
    deviceCode: string,
    data: {
      userCode: string;
      clientId: string;
      createdAt: Date;
      expiresAt: Date;
      userId?: string;
    },
    ttlSeconds: number
  ): Promise<void> {
    this.codes.set(deviceCode, data);
    this.userCodeIndex.set(data.userCode, deviceCode);
    
    // Auto-delete after TTL
    setTimeout(() => {
      this.codes.delete(deviceCode);
      this.userCodeIndex.delete(data.userCode);
    }, ttlSeconds * 1000);
  }
  
  async get(deviceCode: string) {
    const data = this.codes.get(deviceCode);
    return data || null;
  }
  
  async getByUserCode(userCode: string): Promise<string | null> {
    return this.userCodeIndex.get(userCode) || null;
  }
  
  async authorize(deviceCode: string, userId: string): Promise<void> {
    const data = this.codes.get(deviceCode);
    if (data) {
      data.userId = userId;
      this.codes.set(deviceCode, data);
    }
  }
  
  async delete(deviceCode: string): Promise<void> {
    const data = this.codes.get(deviceCode);
    if (data) {
      this.userCodeIndex.delete(data.userCode);
    }
    this.codes.delete(deviceCode);
  }
}
