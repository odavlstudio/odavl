/**
 * Authentication layer for ODAVL Cloud API
 * JWT validation (stub - production requires real OAuth provider)
 */
import { cloudLogger } from '../../shared/utils/index.js';
import type { User } from './types.js';

export interface AuthService {
  validateToken(token: string): Promise<User | null>;
  verifyApiKey(apiKey: string): Promise<boolean>;
}

export class LocalAuthService implements AuthService {
  async validateToken(token: string): Promise<User | null> {
    // Stub: Accept any token starting with "odavl-"
    if (token.startsWith('odavl-')) {
      cloudLogger('info', 'Token validated (stub)', { token: token.substring(0, 10) });
      return {
        id: 'user-local',
        email: 'local@odavl.dev',
        role: 'admin',
      };
    }
    cloudLogger('warn', 'Invalid token', { token: token.substring(0, 10) });
    return null;
  }

  async verifyApiKey(apiKey: string): Promise<boolean> {
    // Stub: Accept any key with length >= 32
    const valid = apiKey.length >= 32;
    cloudLogger('info', 'API key verified (stub)', { valid });
    return valid;
  }
}

export const authService = new LocalAuthService();
