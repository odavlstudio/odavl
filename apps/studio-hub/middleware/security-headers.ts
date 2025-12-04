/**
 * Security Headers Middleware
 *
 * Implements comprehensive security headers for OWASP compliance
 * - Content Security Policy (CSP)
 * - HTTP Strict Transport Security (HSTS)
 * - X-Frame-Options
 * - X-Content-Type-Options
 * - Referrer-Policy
 * - Permissions-Policy
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { logger } from '@/lib/logger';
import { http } from '@/lib/utils/fetch';

/**
 * Generate Content Security Policy header
 */
function generateCSP(): string {
  const directives = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://cdn.jsdelivr.net https://unpkg.com https://www.googletagmanager.com",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com data:",
    "img-src 'self' https: data: blob:",
    "connect-src 'self' https://api.odavl.studio wss://ws.odavl.studio https://*.sentry.io",
    "frame-src 'self' https://www.youtube.com https://player.vimeo.com",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "upgrade-insecure-requests",
  ];

  return directives.join('; ');
}

/**
 * Apply security headers to response
 */
export function applySecurityHeaders(response: NextResponse): NextResponse {
  // Content Security Policy
  response.headers.set('Content-Security-Policy', generateCSP());

  // HTTP Strict Transport Security (HSTS)
  // Force HTTPS for 2 years, include subdomains
  response.headers.set(
    'Strict-Transport-Security',
    'max-age=63072000; includeSubDomains; preload'
  );

  // Prevent clickjacking attacks
  response.headers.set('X-Frame-Options', 'DENY');

  // Prevent MIME-type sniffing
  response.headers.set('X-Content-Type-Options', 'nosniff');

  // Referrer Policy (privacy-focused)
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

  // Permissions Policy (restrict browser features)
  const permissionsPolicy = [
    'camera=()',
    'microphone=()',
    'geolocation=()',
    'interest-cohort=()', // Disable FLoC
    'payment=()',
    'usb=()',
  ].join(', ');

  response.headers.set('Permissions-Policy', permissionsPolicy);

  // X-XSS-Protection (legacy browsers)
  response.headers.set('X-XSS-Protection', '1; mode=block');

  // X-DNS-Prefetch-Control
  response.headers.set('X-DNS-Prefetch-Control', 'on');

  // Cross-Origin-Opener-Policy
  response.headers.set('Cross-Origin-Opener-Policy', 'same-origin');

  // Cross-Origin-Resource-Policy
  response.headers.set('Cross-Origin-Resource-Policy', 'same-origin');

  // Cross-Origin-Embedder-Policy
  response.headers.set('Cross-Origin-Embedder-Policy', 'require-corp');

  // Remove server identification
  response.headers.delete('Server');
  response.headers.delete('X-Powered-By');

  return response;
}

/**
 * Security headers middleware for Next.js
 */
export function securityHeadersMiddleware(request: NextRequest): NextResponse {
  const response = NextResponse.next();
  return applySecurityHeaders(response);
}

/**
 * Apply headers to API routes
 */
export function apiSecurityHeaders(response: NextResponse): NextResponse {
  // Apply base security headers
  applySecurityHeaders(response);

  // Additional headers for API routes
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');

  // CORS headers (if needed)
  if (process.env.NEXT_PUBLIC_ALLOW_CORS === 'true') {
    response.headers.set('Access-Control-Allow-Origin', process.env.NEXT_PUBLIC_ALLOWED_ORIGINS || '*');
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    response.headers.set('Access-Control-Max-Age', '86400');
  }

  return response;
}

/**
 * Validate security headers are properly set
 */
export async function validateSecurityHeaders(url: string): Promise<{
  passed: boolean;
  results: Array<{
    header: string;
    present: boolean;
    value?: string;
    expected?: string;
    critical: boolean;
  }>;
}> {
  try {
    const response = await http.get(url);
    const headers = response.headers;

    const checks = [
      {
        header: 'Content-Security-Policy',
        critical: true,
        validator: (value: string | null) => value !== null && value.length > 0,
      },
      {
        header: 'Strict-Transport-Security',
        critical: true,
        validator: (value: string | null) => value !== null && value.includes('max-age'),
      },
      {
        header: 'X-Frame-Options',
        critical: true,
        validator: (value: string | null) => value === 'DENY' || value === 'SAMEORIGIN',
      },
      {
        header: 'X-Content-Type-Options',
        critical: true,
        validator: (value: string | null) => value === 'nosniff',
      },
      {
        header: 'Referrer-Policy',
        critical: false,
        validator: (value: string | null) => value !== null,
      },
      {
        header: 'Permissions-Policy',
        critical: false,
        validator: (value: string | null) => value !== null,
      },
      {
        header: 'Server',
        critical: false,
        validator: (value: string | null) => value === null, // Should be removed
      },
      {
        header: 'X-Powered-By',
        critical: false,
        validator: (value: string | null) => value === null, // Should be removed
      },
    ];

    const results = checks.map(check => {
      const value = headers.get(check.header);
      const passed = check.validator(value);

      return {
        header: check.header,
        present: value !== null,
        value: value || undefined,
        critical: check.critical,
      };
    });

    const passed = results
      .filter(r => r.critical)
      .every(r => r.present);

    return { passed, results };
  } catch (error) {
    logger.error('Failed to validate security headers', error as Error);
    return {
      passed: false,
      results: [],
    };
  }
}

/**
 * Generate security headers report
 */
export function generateSecurityHeadersReport(validation: Awaited<ReturnType<typeof validateSecurityHeaders>>): string {
  return `
# Security Headers Report

**Status:** ${validation.passed ? '✅ PASSED' : '❌ FAILED'}

## Critical Headers

${validation.results
  .filter(r => r.critical)
  .map(r => `
### ${r.header}
- Present: ${r.present ? '✅' : '❌'}
- Value: ${r.value || 'Not set'}
`).join('\n')}

## Optional Headers

${validation.results
  .filter(r => !r.critical)
  .map(r => `
### ${r.header}
- Present: ${r.present ? '✅' : '❌'}
- Value: ${r.value || 'Not set'}
`).join('\n')}

## Recommendations

${!validation.passed ? '⚠️  Critical security headers are missing. Implement immediately.\n' : ''}
${validation.results.find(r => r.header === 'Server' && r.present) ? '⚠️  Remove Server header to prevent fingerprinting\n' : ''}
${validation.results.find(r => r.header === 'X-Powered-By' && r.present) ? '⚠️  Remove X-Powered-By header to prevent fingerprinting\n' : ''}
${validation.passed ? '✅ All critical security headers are properly configured\n' : ''}
`;
}

/**
 * CSP report endpoint handler
 */
export async function handleCSPReport(request: NextRequest): Promise<NextResponse> {
  try {
    const report = await request.json();

    logger.error('CSP Violation', new Error('Content Security Policy violation detected'), {
      documentUri: report['csp-report']?.['document-uri'],
      violatedDirective: report['csp-report']?.['violated-directive'],
      blockedUri: report['csp-report']?.['blocked-uri'],
      sourceFile: report['csp-report']?.['source-file'],
      lineNumber: report['csp-report']?.['line-number'],
    });

    // Send to monitoring service (Sentry, Datadog, etc.)
    if (process.env.NODE_ENV === 'production') {
      // TODO: Send to monitoring service
    }

    return NextResponse.json({ received: true }, { status: 204 });
  } catch (error) {
    logger.error('Failed to handle CSP report', error as Error);
    return NextResponse.json({ error: 'Invalid report' }, { status: 400 });
  }
}
