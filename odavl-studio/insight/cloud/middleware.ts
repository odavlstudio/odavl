/**
 * Security Middleware
 * Implements security headers, CORS, and request protection
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Get allowed CORS origins based on environment
 */
function getAllowedOrigins(): string[] {
  const env = process.env.NODE_ENV;

  if (env === 'development') {
    return [
      'http://localhost:3001',
      'http://localhost:3000',
      'http://127.0.0.1:3001',
      'http://127.0.0.1:3000',
    ];
  }

  if (env === 'production') {
    return [
      'https://odavl.com',
      'https://www.odavl.com',
      'https://app.odavl.com',
      'https://api.odavl.com',
    ];
  }

  // Staging/test environments
  return [
    'http://localhost:3001',
    'https://staging.odavl.com',
  ];
}

/**
 * Check if origin is allowed for CORS
 */
function isOriginAllowed(origin: string | null): boolean {
  if (!origin) return false;
  const allowedOrigins = getAllowedOrigins();
  return allowedOrigins.includes(origin);
}

/**
 * Main security middleware
 */
export function middleware(request: NextRequest) {
  const response = NextResponse.next();

  // ============================================
  // Security Headers (Always Applied)
  // ============================================

  // DNS Prefetch Control - Allow DNS prefetching for performance
  response.headers.set('X-DNS-Prefetch-Control', 'on');

  // HTTP Strict Transport Security (HSTS)
  // Force HTTPS for 1 year, include subdomains
  if (process.env.NODE_ENV === 'production') {
    response.headers.set(
      'Strict-Transport-Security',
      'max-age=31536000; includeSubDomains; preload'
    );
  }

  // X-Frame-Options - Prevent clickjacking
  response.headers.set('X-Frame-Options', 'DENY');

  // X-Content-Type-Options - Prevent MIME sniffing
  response.headers.set('X-Content-Type-Options', 'nosniff');

  // X-XSS-Protection - Enable browser XSS filter (legacy, but doesn't hurt)
  response.headers.set('X-XSS-Protection', '1; mode=block');

  // Referrer Policy - Control referrer information
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

  // Permissions Policy - Disable unused browser features
  response.headers.set(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=(), interest-cohort=()'
  );

  // Content Security Policy (CSP)
  const cspDirectives = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-eval' 'unsafe-inline'", // Next.js requires unsafe-eval
    "style-src 'self' 'unsafe-inline'", // Tailwind requires unsafe-inline
    "img-src 'self' data: https:",
    "font-src 'self' data:",
    "connect-src 'self' https://api.odavl.com wss://api.odavl.com",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "upgrade-insecure-requests",
  ];

  response.headers.set('Content-Security-Policy', cspDirectives.join('; '));

  // ============================================
  // CORS Headers (API Routes Only)
  // ============================================

  if (request.nextUrl.pathname.startsWith('/api/')) {
    const origin = request.headers.get('origin');

    // Allow requests from allowed origins
    if (origin && isOriginAllowed(origin)) {
      response.headers.set('Access-Control-Allow-Origin', origin);
      response.headers.set('Access-Control-Allow-Credentials', 'true');
      response.headers.set(
        'Access-Control-Allow-Methods',
        'GET, POST, PUT, DELETE, PATCH, OPTIONS'
      );
      response.headers.set(
        'Access-Control-Allow-Headers',
        'Content-Type, Authorization, X-Requested-With, X-CSRF-Token'
      );
      response.headers.set('Access-Control-Max-Age', '86400'); // 24 hours
    }

    // Handle preflight OPTIONS requests
    if (request.method === 'OPTIONS') {
      return new NextResponse(null, {
        status: 204,
        headers: response.headers,
      });
    }
  }

  // ============================================
  // Additional Security Measures
  // ============================================

  // Remove powered-by header (don't advertise tech stack)
  response.headers.delete('X-Powered-By');

  // Add custom security info header (for debugging, remove in production)
  if (process.env.NODE_ENV === 'development') {
    response.headers.set('X-Security-Headers', 'enabled');
  }

  return response;
}

/**
 * Configure which routes the middleware applies to
 * Apply to all routes except static files and Next.js internals
 */
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.png$|.*\\.jpg$|.*\\.jpeg$|.*\\.gif$|.*\\.svg$).*)',
  ],
};
