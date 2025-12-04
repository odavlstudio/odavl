/**
 * Authentication Service
 * Handles user registration, login, and password management
 */

import { hashPassword, comparePassword, generateTokens, type TokenPayload } from './jwt.js';

export interface User {
  id: string;
  email: string;
  name?: string;
  passwordHash?: string;
  emailVerified: boolean;
  emailVerificationToken?: string;
  passwordResetToken?: string;
  passwordResetExpiry?: Date;
  role: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface RegisterInput {
  email: string;
  password: string;
  name?: string;
  emailVerificationToken?: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface AuthResult {
  user: User;
  accessToken: string;
  refreshToken: string;
}

/**
 * Password validation rules
 */
export function validatePassword(password: string): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (password.length < 8) {
    errors.push('Password must be at least 8 characters');
  }
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }
  if (!/[0-9]/.test(password)) {
    errors.push('Password must contain at least one number');
  }
  if (!/[^A-Za-z0-9]/.test(password)) {
    errors.push('Password must contain at least one special character');
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Email validation
 */
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * AuthService class
 * Requires a database adapter to be injected
 */
export class AuthService<TDbAdapter> {
  constructor(private db: TDbAdapter) {}

  /**
   * Register a new user
   */
  async register(input: RegisterInput): Promise<AuthResult> {
    const { email, password, name } = input;

    // Validate email
    if (!validateEmail(email)) {
      throw new Error('Invalid email address');
    }

    // Validate password
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.valid) {
      throw new Error(passwordValidation.errors.join('. '));
    }

    // Check if user exists (db adapter must implement findUserByEmail)
    const existing = await (this.db as any).findUserByEmail(email);
    if (existing) {
      throw new Error('User already exists with this email');
    }

    // Hash password
    const passwordHash = await hashPassword(password);

    // Create user (db adapter must implement createUser)
    const user = await (this.db as any).createUser({
      email,
      passwordHash,
      name,
      emailVerified: false,
      role: 'user',
    });

    // Generate tokens
    const payload: TokenPayload = {
      userId: user.id,
      email: user.email,
      role: user.role || 'user',
    };

    const tokens = generateTokens(payload);

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        emailVerified: user.emailVerified,
        role: user.role,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    };
  }

  /**
   * Login existing user
   */
  async login(input: LoginInput): Promise<AuthResult> {
    const { email, password } = input;

    // Find user (db adapter must implement findUserByEmail)
    const user = await (this.db as any).findUserByEmail(email);
    if (!user || !user.passwordHash) {
      throw new Error('Invalid email or password');
    }

    // Verify password
    const isValid = await comparePassword(password, user.passwordHash);
    if (!isValid) {
      throw new Error('Invalid email or password');
    }

    // Generate tokens
    const payload: TokenPayload = {
      userId: user.id,
      email: user.email,
      role: user.role || 'user',
    };

    const tokens = generateTokens(payload);

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        emailVerified: user.emailVerified,
        role: user.role,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    };
  }

  /**
   * Verify user's email
   */
  async verifyEmail(userId: string): Promise<void> {
    // db adapter must implement verifyUserEmail
    await (this.db as any).verifyUserEmail(userId);
  }

  /**
   * Request password reset
   */
  async requestPasswordReset(email: string): Promise<string> {
    // Find user
    const user = await (this.db as any).findUserByEmail(email);
    if (!user) {
      // Don't reveal if email exists
      return 'If the email exists, a reset link has been sent';
    }

    // Generate reset token (db adapter must implement createPasswordResetToken)
    const resetToken = await (this.db as any).createPasswordResetToken(user.id);

    return resetToken;
  }

  /**
   * Reset password with token
   */
  async resetPassword(token: string, newPassword: string): Promise<void> {
    // Validate new password
    const passwordValidation = validatePassword(newPassword);
    if (!passwordValidation.valid) {
      throw new Error(passwordValidation.errors.join('. '));
    }

    // Verify token and get user (db adapter must implement verifyPasswordResetToken)
    const userId = await (this.db as any).verifyPasswordResetToken(token);
    if (!userId) {
      throw new Error('Invalid or expired reset token');
    }

    // Hash new password
    const passwordHash = await hashPassword(newPassword);

    // Update password (db adapter must implement updatePassword)
    await (this.db as any).updatePassword(userId, passwordHash);
  }
}
