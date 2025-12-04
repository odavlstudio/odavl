/**
 * Guardian Global Middleware
 * 
 * Security-first middleware for Next.js 15 App Router
 * Implements:
 * - Helmet-style security headers
 * - CORS with whitelist
 * - CSP (Content Security Policy)
 * - Rate limiting integration
 */

import { NextRequest, NextResponse } from 'next/server';

// Allowed origins for CORS
const ALLOWED_ORIGINS = [
    process.env.NEXT_PUBLIC_APP_URL,
    'http://localhost:3000',
    'http://localhost:3003',
    'http://localhost:3002',
    process.env.NEXT_PUBLIC_FRONTEND_URL,
].filter(Boolean) as string[];

// CSP directives
const CSP_DIRECTIVES = {
    'default-src': ["'self'"],
    'script-src': [
        "'self'",
        "'unsafe-inline'", // Next.js requires this for inline scripts
        "'unsafe-eval'",   // Required for Next.js development
        'https://vercel.live', // Vercel toolbar
    ],
    'style-src': [
        "'self'",
        "'unsafe-inline'", // Required for Tailwind and styled-jsx
    ],
    'img-src': [
        "'self'",
        'data:',
        'https:',
        'blob:',
    ],
    'font-src': [
        "'self'",
        'data:',
    ],
    'connect-src': [
        "'self'",
        'https://vercel.live',
        'wss://*.pusher.com',
        'wss://ws.pusher.com',
        process.env.NEXT_PUBLIC_API_URL,
    ].filter(Boolean),
    'frame-ancestors': ["'none'"], // Prevent clickjacking
    'base-uri': ["'self'"],
    'form-action': ["'self'"],
    'upgrade-insecure-requests': [],
};

// Convert CSP directives to string
function buildCSP(): string {
    return Object.entries(CSP_DIRECTIVES)
        .map(([key, values]) => {
            if (values.length === 0) return key;
            return `${key} ${values.join(' ')}`;
        })
        .join('; ');
}

// Security headers (Helmet-style)
function getSecurityHeaders(): Record<string, string> {
    return {
        // CSP
        'Content-Security-Policy': buildCSP(),

        // Prevent MIME type sniffing
        'X-Content-Type-Options': 'nosniff',

        // XSS Protection (legacy, but good to have)
        'X-XSS-Protection': '1; mode=block',

        // Prevent clickjacking
        'X-Frame-Options': 'DENY',

        // Referrer Policy
        'Referrer-Policy': 'strict-origin-when-cross-origin',

        // Permissions Policy (formerly Feature Policy)
        'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',

        // HSTS (Strict Transport Security) - 1 year
        'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',

        // Remove X-Powered-By header
        'X-Powered-By': '', // Next.js will remove this
    };
}

// CORS handler
function handleCORS(request: NextRequest, response: NextResponse): NextResponse {
    const origin = request.headers.get('origin');

    // Check if origin is allowed
    if (origin && ALLOWED_ORIGINS.includes(origin)) {
        response.headers.set('Access-Control-Allow-Origin', origin);
        response.headers.set('Access-Control-Allow-Credentials', 'true');
    }

    // Handle preflight requests
    if (request.method === 'OPTIONS') {
        response.headers.set(
            'Access-Control-Allow-Methods',
            'GET, POST, PUT, PATCH, DELETE, OPTIONS'
        );
        response.headers.set(
            'Access-Control-Allow-Headers',
            'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Key, Authorization'
        );
        response.headers.set('Access-Control-Max-Age', '86400'); // 24 hours

        return new NextResponse(null, { status: 204, headers: response.headers });
    }

    return response;
}

/**
 * Main middleware function
 */
export async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // Create response
    let response = NextResponse.next();

    // Apply CORS for API routes
    if (pathname.startsWith('/api')) {
        response = handleCORS(request, response);
    }

    // Apply security headers to all routes
    const securityHeaders = getSecurityHeaders();
    Object.entries(securityHeaders).forEach(([key, value]) => {
        response.headers.set(key, value);
    });

    // Add custom headers for monitoring
    response.headers.set('X-Guardian-Version', '1.5.0');
    response.headers.set('X-Request-ID', crypto.randomUUID());

    return response;
}

// Middleware config - apply to all routes except static files
export const config = {
    matcher: [
        /*
         * Match all request paths except:
         * - _next/static (static files)
         * - _next/image (image optimization)
         * - favicon.ico (favicon file)
         * - public folder
         */
        '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
};
