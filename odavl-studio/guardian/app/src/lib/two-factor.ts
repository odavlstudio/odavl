/**
 * Two-Factor Authentication (2FA) Service
 * 
 * Week 12: Beta Launch - Security Enhancement
 * 
 * Provides TOTP-based two-factor authentication for Guardian users.
 * Supports:
 * - Secret generation
 * - QR code generation for authenticator apps
 * - Token verification
 * - Backup codes generation
 */

import { authenticator } from 'otplib';
import QRCode from 'qrcode';
import { randomBytes } from 'crypto';

/**
 * Generate a new TOTP secret for a user
 * @returns Base32-encoded secret
 */
export function generateSecret(): string {
    return authenticator.generateSecret();
}

/**
 * Generate a QR code URL for authenticator apps
 * @param userEmail - User's email address
 * @param secret - TOTP secret
 * @param issuer - Application name (default: "Guardian")
 * @returns OTP Auth URL
 */
export function generateOtpAuthUrl(
    userEmail: string,
    secret: string,
    issuer: string = 'Guardian'
): string {
    return authenticator.keyuri(userEmail, issuer, secret);
}

/**
 * Generate a QR code image as Data URL
 * @param otpAuthUrl - OTP Auth URL from generateOtpAuthUrl
 * @returns Promise<string> - Data URL for QR code image
 */
export async function generateQRCode(otpAuthUrl: string): Promise<string> {
    try {
        return await QRCode.toDataURL(otpAuthUrl);
    } catch (error) {
        throw new Error(`Failed to generate QR code: ${error}`);
    }
}

/**
 * Verify a TOTP token
 * @param token - 6-digit token from authenticator app
 * @param secret - User's TOTP secret
 * @returns boolean - True if token is valid
 */
export function verifyToken(token: string, secret: string): boolean {
    try {
        return authenticator.verify({ token, secret });
    } catch (error) {
        return false;
    }
}

/**
 * Generate backup codes for account recovery
 * @param count - Number of backup codes to generate (default: 8)
 * @returns string[] - Array of backup codes
 */
export function generateBackupCodes(count: number = 8): string[] {
    const codes: string[] = [];

    for (let i = 0; i < count; i++) {
        // Generate 8-character alphanumeric code
        const code = randomBytes(4).toString('hex').toUpperCase();
        // Format as XXXX-XXXX
        const formatted = `${code.slice(0, 4)}-${code.slice(4)}`;
        codes.push(formatted);
    }

    return codes;
}

/**
 * Hash a backup code for storage
 * @param code - Backup code
 * @returns Promise<string> - Hashed backup code
 */
export async function hashBackupCode(code: string): Promise<string> {
    const { createHash } = await import('crypto');
    return createHash('sha256').update(code).digest('hex');
}

/**
 * Verify a backup code against stored hash
 * @param code - Backup code provided by user
 * @param hashedCode - Stored hash of backup code
 * @returns Promise<boolean> - True if code matches
 */
export async function verifyBackupCode(
    code: string,
    hashedCode: string
): Promise<boolean> {
    const hash = await hashBackupCode(code);
    return hash === hashedCode;
}

/**
 * Enable 2FA for a user
 * Returns everything needed for 2FA setup
 */
export async function enableTwoFactor(userEmail: string): Promise<{
    secret: string;
    qrCode: string;
    backupCodes: string[];
}> {
    const secret = generateSecret();
    const otpAuthUrl = generateOtpAuthUrl(userEmail, secret);
    const qrCode = await generateQRCode(otpAuthUrl);
    const backupCodes = generateBackupCodes();

    return {
        secret,
        qrCode,
        backupCodes,
    };
}

/**
 * Configuration for TOTP
 */
export const totpConfig = {
    window: 1, // Allow 1 step before/after for clock skew
    step: 30, // 30-second time step
    digits: 6, // 6-digit codes
};
