// ODAVL-WAVE-X4-INJECT: CSRF Protection with double-token pattern
// @odavl-governance: SECURITY-SAFE mode active
import { NextResponse } from 'next/server';
import crypto from 'crypto';

export interface CSRFConfig {
  tokenName: string;
  cookieName: string;
  secret: string;
  maxAge: number;
}

const defaultConfig: CSRFConfig = {
  tokenName: 'csrf-token',
  cookieName: '__odavl-csrf',
  secret: process.env.CSRF_SECRET || 'odavl-default-secret',
  maxAge: 3600000
};

export function generateCSRFToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

export function createTokenHash(token: string, secret: string): string {
  return crypto.createHmac('sha256', secret).update(token).digest('hex');
}

export function verifyCSRFToken(token: string, cookieHash: string, secret: string): boolean {
  const expectedHash = createTokenHash(token, secret);
  return crypto.timingSafeEqual(Buffer.from(cookieHash, 'hex'), Buffer.from(expectedHash, 'hex'));
}

export function setCSRFCookie(response: NextResponse, token: string, config = defaultConfig): void {
  const hash = createTokenHash(token, config.secret);
  response.cookies.set(config.cookieName, hash, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: config.maxAge
  });
}