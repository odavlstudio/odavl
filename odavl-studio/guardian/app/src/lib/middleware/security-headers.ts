/**
 * Security Headers Middleware
 * 
 * Provides comprehensive HTTP security headers using Helmet.js.
 * Protects against common web vulnerabilities (XSS, clickjacking, MITM attacks).
 * 
 * @module middleware/security-headers
 */

import helmet from 'helmet';
import type { NextRequest, NextResponse } from 'next/server';
import logger from '../logger';

/**
 * Security headers configuration
 */
export const SECURITY_HEADERS_CONFIG = {
    // Content Security Policy
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: [
                "'self'",
                "'unsafe-inline'", // Required for Next.js inline scripts
                "'unsafe-eval'", // Required for Next.js hot reload in dev
            ],
            styleSrc: ["'self'", "'unsafe-inline'"], // Required for styled-components
            imgSrc: ["'self'", 'data:', 'https:'],
            fontSrc: ["'self'", 'data:'],
            connectSrc: ["'self'"],
            frameSrc: ["'none'"],
            objectSrc: ["'none'"],
            baseUri: ["'self'"],
            formAction: ["'self'"],
            frameAncestors: ["'none'"], // Prevent clickjacking
            upgradeInsecureRequests: process.env.NODE_ENV === 'production' ? [] : null,
        },
    },

    // Strict Transport Security (HSTS)
    strictTransportSecurity: {
        maxAge: 31536000, // 1 year
        includeSubDomains: true,
        preload: true,
    },

    // X-Frame-Options
    frameguard: {
        action: 'deny', // Prevent clickjacking
    },

    // X-Content-Type-Options
    noSniff: true, // Prevent MIME-type sniffing

    // X-XSS-Protection (for older browsers)
    xssFilter: true,

    // Referrer Policy
    referrerPolicy: {
        policy: 'strict-origin-when-cross-origin' as const,
    },

    // X-Permitted-Cross-Domain-Policies
    permittedCrossDomainPolicies: {
        permittedPolicies: 'none',
    },

    // X-Download-Options (IE8+)
    ieNoOpen: true,

    // X-DNS-Prefetch-Control
    dnsPrefetchControl: {
        allow: false,
    },
};

/**
 * Create Helmet middleware with security configuration
 * 
 * @returns {Function} Express-style middleware function
 * 
 * @example
 * // In Next.js middleware
 * import { createSecurityHeadersMiddleware } from '@/lib/middleware/security-headers';
 * const helmet = createSecurityHeadersMiddleware();
 */
export function createSecurityHeadersMiddleware() {
    return helmet(SECURITY_HEADERS_CONFIG as any);
}

/**
 * Apply security headers to Next.js response
 * 
 * @param {NextResponse} response - Next.js response object
 * @returns {NextResponse} Response with security headers
 * 
 * @example
 * // In API route
 * export async function GET(request: Request) {
 *   const response = NextResponse.json({ data: 'value' });
 *   return applySecurityHeaders(response);
 * }
 */
export function applySecurityHeaders(response: NextResponse): NextResponse {
    const headers = response.headers;

    // Content Security Policy
    const csp = Object.entries(SECURITY_HEADERS_CONFIG.contentSecurityPolicy.directives)
        .filter(([, value]) => value !== null)
        .map(([key, value]) => {
            const directive = key.replace(/([A-Z])/g, '-$1').toLowerCase();
            const values = Array.isArray(value) ? value.join(' ') : value;
            return `${directive} ${values}`;
        })
        .join('; ');

    headers.set('Content-Security-Policy', csp);

    // Strict Transport Security (HSTS)
    if (process.env.NODE_ENV === 'production') {
        const hsts = SECURITY_HEADERS_CONFIG.strictTransportSecurity;
        headers.set(
            'Strict-Transport-Security',
            `max-age=${hsts.maxAge}; includeSubDomains${hsts.preload ? '; preload' : ''}`
        );
    }

    // X-Frame-Options
    headers.set('X-Frame-Options', 'DENY');

    // X-Content-Type-Options
    headers.set('X-Content-Type-Options', 'nosniff');

    // X-XSS-Protection
    headers.set('X-XSS-Protection', '1; mode=block');

    // Referrer-Policy
    headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

    // X-Permitted-Cross-Domain-Policies
    headers.set('X-Permitted-Cross-Domain-Policies', 'none');

    // X-Download-Options
    headers.set('X-Download-Options', 'noopen');

    // X-DNS-Prefetch-Control
    headers.set('X-DNS-Prefetch-Control', 'off');

    // Remove sensitive headers
    headers.delete('X-Powered-By');
    headers.delete('Server');

    logger.debug('[Security] Applied security headers');

    return response;
}

/**
 * Security headers for specific routes
 */
export const ROUTE_SPECIFIC_HEADERS: Record<string, Record<string, string>> = {
    // API routes - stricter CSP
    '/api': {
        'Content-Security-Policy': "default-src 'self'; script-src 'none'; style-src 'none'",
    },

    // Admin routes - additional security
    '/admin': {
        'X-Frame-Options': 'DENY',
        'X-Content-Type-Options': 'nosniff',
    },
};

/**
 * Get route-specific security headers
 * 
 * @param {string} pathname - Request pathname
 * @returns {Record<string, string>} Headers object
 * 
 * @example
 * const headers = getRouteSecurityHeaders('/api/users');
 * // Returns: { 'Content-Security-Policy': "..." }
 */
export function getRouteSecurityHeaders(pathname: string): Record<string, string> {
    for (const [route, headers] of Object.entries(ROUTE_SPECIFIC_HEADERS)) {
        if (pathname.startsWith(route)) {
            logger.debug('[Security] Applied route-specific headers', { route, pathname });
            return headers;
        }
    }

    return {};
}

/**
 * Middleware function for Next.js
 * 
 * @param {NextRequest} request - Next.js request object
 * @param {NextResponse} response - Next.js response object
 * @returns {NextResponse} Response with security headers
 * 
 * @example
 * // In middleware.ts
 * export function middleware(request: NextRequest) {
 *   const response = NextResponse.next();
 *   return securityHeadersMiddleware(request, response);
 * }
 */
export function securityHeadersMiddleware(
    request: NextRequest,
    response: NextResponse
): NextResponse {
    // Apply base security headers
    const secureResponse = applySecurityHeaders(response);

    // Apply route-specific headers
    const routeHeaders = getRouteSecurityHeaders(request.nextUrl.pathname);

    for (const [key, value] of Object.entries(routeHeaders)) {
        secureResponse.headers.set(key, value);
    }

    logger.debug('[Security] Applied security headers', {
        path: request.nextUrl.pathname,
    });

    return secureResponse;
}
