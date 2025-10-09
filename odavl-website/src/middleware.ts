// ODAVL-WAVE-X4-INJECT: Enhanced security middleware with nonce-based CSP
// ODAVL-WAVE-X5-INJECT: AI Intelligence Layer integration
// ODAVL-WAVE-C8-INJECT: Static generation optimization
import createMiddleware from 'next-intl/middleware';
import { NextRequest, NextResponse } from 'next/server';
import { generateNonce, buildCSPPolicy } from '../config/security/csp.policy';
import { detectAnomalies } from '../config/security/ids.monitor';
import { checkRateLimit } from '../config/security/rate.limit';
import { aiBrain } from '../config/ai/ai.brain.compact';
import securityHeaders from '../config/security/security.headers.json';

const intlMiddleware = createMiddleware({
  locales: ['en', 'de', 'ar', 'fr', 'es', 'it', 'pt', 'ru', 'ja', 'zh'], // ODAVL-WAVE-X6-INJECT: 10 locales
  defaultLocale: 'en'
});

// Static CSP for prerendered pages (no nonce needed)
const STATIC_CSP = `default-src 'self'; script-src 'self' 'unsafe-inline' plausible.io; style-src 'self' 'unsafe-inline' fonts.googleapis.com; font-src 'self' fonts.gstatic.com; img-src 'self' data: https:; connect-src 'self' plausible.io; frame-ancestors 'none'; base-uri 'self'; form-action 'self'; upgrade-insecure-requests`;

// Routes that require dynamic security processing
const DYNAMIC_ROUTES = ['/api/', '/login', '/signup', '/demo'];
const STATIC_ROUTES = ['/', '/pricing', '/docs', '/contact', '/security', '/terms'];

function isStaticRoute(pathname: string): boolean {
  // Check if it's a known static route or matches static patterns
  const localePattern = /^\/[a-z]{2}\/?(pricing|docs|contact|security|terms)?$/;
  return STATIC_ROUTES.some(route => pathname === route || pathname.startsWith(route + '/')) ||
         localePattern.test(pathname);
}

function isDynamicRoute(pathname: string): boolean {
  return DYNAMIC_ROUTES.some(route => pathname.startsWith(route)) ||
         pathname.includes('/api/') ||
         pathname.includes('/_next/');
}

export default function middleware(request: NextRequest) {
  const response = intlMiddleware(request);
  const url = new URL(request.url);
  const pathname = url.pathname;

  // Skip middleware for Next.js internals and assets
  const assetPattern = /\.(js|css|png|jpg|jpeg|gif|svg|ico|woff|woff2)$/;
  if (pathname.startsWith('/_next/') || pathname.startsWith('/_vercel/') || assetPattern.test(pathname)) {
    return response;
  }

  // For static routes, use minimal security headers without dynamic operations
  if (isStaticRoute(pathname)) {
    // Apply basic security headers without accessing request headers
    Object.entries(securityHeaders.headers).forEach(([header, value]) => {
      response.headers.set(header, value);
    });

    // Use static CSP for prerendered pages
    response.headers.set('Content-Security-Policy', STATIC_CSP);

    /* <ODAVL-WAVE-X10-INJECT-START> */
    // Evolution telemetry hook (static-safe)
    response.headers.set('X-Evolution-Timestamp', Date.now().toString());
    /* <ODAVL-WAVE-X10-INJECT-END> */

    return response;
  }

  // For dynamic routes, apply full security suite
  if (isDynamicRoute(pathname) || pathname.startsWith('/api/')) {
    const clientIP = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
    
    // Rate limiting check
    const rateLimit = checkRateLimit(clientIP);
    if (!rateLimit.allowed) {
      return new NextResponse('Rate limit exceeded', { 
        status: 429, 
        headers: { 'Retry-After': rateLimit.retryAfter?.toString() || '60' } 
      });
    }

    // IDS anomaly detection
    const anomaly = detectAnomalies(request.url, Object.fromEntries(request.headers), request.headers.get('user-agent') || undefined);
    if (anomaly?.blocked) {
      console.warn('🚨 Security threat blocked:', anomaly);
      return new NextResponse('Security violation detected', { status: 403 });
    }

    // Apply enhanced security headers
    Object.entries(securityHeaders.headers).forEach(([header, value]) => {
      response.headers.set(header, value);
    });

    // Generate and apply nonce-based CSP for dynamic content
    const nonce = generateNonce();
    const cspPolicy = buildCSPPolicy(nonce, process.env.NODE_ENV === 'development');
    response.headers.set('Content-Security-Policy', cspPolicy);
    response.headers.set('X-CSP-Nonce', nonce);

    if (process.env.NODE_ENV === 'development') {
      console.log('🔒 WAVE X-4 Security + 🤖 WAVE X-5 AI applied to dynamic route:', { 
        route: pathname, 
        rateLimit: rateLimit.remaining, 
        anomaly: !!anomaly, 
        nonce 
      });
    }
  }

  // ODAVL-WAVE-X5-INJECT: Feed anonymized signals to AI brain (static-safe)
  if (!pathname.startsWith('/_next/') && !pathname.startsWith('/api/')) {
    aiBrain.collectSignal({
      type: 'page_view',
      path: pathname,
      timestamp: Date.now()
    });
  }

  return response;
}

export const config = {
  matcher: [
    '/',
    '/(en|de|ar|fr|es|it|pt|ru|ja|zh)/:path*'
  ]
};