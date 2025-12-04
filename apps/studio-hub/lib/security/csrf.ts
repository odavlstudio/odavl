import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { env } from '@/lib/env';

const CSRF_TOKEN_HEADER = 'x-csrf-token';

// Generate CSRF token for session
export async function generateCsrfToken(sessionId: string): Promise<string> {
  const data = `${sessionId}:${Date.now()}`;
  const encoder = new TextEncoder();
  const dataBuffer = encoder.encode(data + env.CSRF_SECRET);

  const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

  return hashHex;
}

// Validate CSRF token
export async function validateCsrfToken(
  token: string,
  sessionId: string
): Promise<boolean> {
  if (!token || !sessionId) {
    return false;
  }

  const expectedToken = await generateCsrfToken(sessionId);
  return token === expectedToken;
}

// Middleware to protect routes from CSRF attacks
export async function csrfProtection(
  request: NextRequest
): Promise<NextResponse | null> {
  // Skip CSRF check for GET, HEAD, OPTIONS
  const safeMethods = ['GET', 'HEAD', 'OPTIONS'];
  if (safeMethods.includes(request.method)) {
    return null;
  }

  // Skip CSRF check for public API routes (they use API keys)
  if (request.nextUrl.pathname.startsWith('/api/public')) {
    return null;
  }

  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return null; // Let auth middleware handle this
  }

  const csrfToken = request.headers.get(CSRF_TOKEN_HEADER);

  if (!csrfToken) {
    return NextResponse.json(
      { error: 'CSRF token missing' },
      { status: 403 }
    );
  }

  const isValid = await validateCsrfToken(csrfToken, session.user.id);

  if (!isValid) {
    return NextResponse.json(
      { error: 'Invalid CSRF token' },
      { status: 403 }
    );
  }

  return null; // Token is valid, continue
}

// React hook to get CSRF token
export async function getCsrfToken(): Promise<string> {
  const response = await fetch('/api/auth/csrf');
  const data = await response.json();
  return data.token;
}

