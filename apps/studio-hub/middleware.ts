import createMiddleware from 'next-intl/middleware';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { locales } from './i18n/request';
import { getToken } from 'next-auth/jwt';

// Create next-intl middleware
const intlMiddleware = createMiddleware({
  locales: locales,
  defaultLocale: 'en',
  localePrefix: 'always',
});

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip middleware for auth, static, and next internal routes
  if (
    pathname.startsWith('/api/auth') ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/static') ||
    pathname === '/favicon.ico'
  ) {
    return NextResponse.next();
  }

  // Multi-tenant context for API routes
  if (pathname.startsWith('/api/v1')) {
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    });

    if (!token) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Extract organization ID from path
    const orgIdMatch = pathname.match(/\/organizations\/([^/]+)/);
    if (orgIdMatch) {
      const orgId = orgIdMatch[1];

      // Add organization context to headers
      const requestHeaders = new Headers(request.headers);
      requestHeaders.set('x-organization-id', orgId);
      requestHeaders.set('x-user-id', token.sub || '');

      const response = NextResponse.next({
        request: {
          headers: requestHeaders,
        },
      });

      return response;
    }

    return NextResponse.next();
  }

  // Protect dashboard routes
  if (pathname.startsWith('/dashboard')) {
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    });

    if (!token) {
      const signInUrl = new URL('/api/auth/signin', request.url);
      signInUrl.searchParams.set('callbackUrl', pathname);
      return NextResponse.redirect(signInUrl);
    }
  }

  // Handle next-intl routing
  const intlResponse = intlMiddleware(request);

  // If intl middleware returned a response (redirect), return it
  if (intlResponse.status !== 200) {
    return intlResponse;
  }

  const response = intlResponse;

  // Content Security Policy
  const csp = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://accounts.google.com https://*.sentry.io",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com data:",
    "img-src 'self' data: https: blob:",
    "connect-src 'self' https://accounts.google.com https://www.googleapis.com https://*.sentry.io",
    "frame-src 'self' https://accounts.google.com",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "upgrade-insecure-requests",
  ].join('; ');

  response.headers.set('Content-Security-Policy', csp);
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - _error, 404, 500 (error pages - handled dynamically)
     */
    '/((?!api|_next|_error|404|500|favicon.ico).*)',
  ],
};
