// ODAVL-WAVE-X4-INJECT: Enhanced security middleware with nonce-based CSP
// ODAVL-WAVE-X5-INJECT: AI Intelligence Layer integration
import createMiddleware from 'next-intl/middleware';
import { NextRequest } from 'next/server';
import { generateNonce, buildCSPPolicy } from '../config/security/csp.policy';
import { detectAnomalies } from '../config/security/ids.monitor';
import { checkRateLimit } from '../config/security/rate.limit';
import { aiBrain } from '../config/ai/ai.brain.compact';
import securityHeaders from '../config/security/security.headers.json';

const intlMiddleware = createMiddleware({
  locales: ['en', 'de', 'ar', 'fr', 'es', 'it', 'pt', 'ru', 'ja', 'zh'], // ODAVL-WAVE-X6-INJECT: 10 locales
  defaultLocale: 'en',
  localePrefix: 'as-needed'
});

export default function middleware(request: NextRequest) {
  const response = intlMiddleware(request);
  const clientIP = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
  
  // Rate limiting check
  const rateLimit = checkRateLimit(clientIP);
  if (!rateLimit.allowed) {
    return new Response('Rate limit exceeded', { status: 429, headers: { 'Retry-After': rateLimit.retryAfter?.toString() || '60' } });
  }

  // IDS anomaly detection
  const anomaly = detectAnomalies(request.url, Object.fromEntries(request.headers), request.headers.get('user-agent') || undefined);
  if (anomaly?.blocked) {
    console.warn('🚨 Security threat blocked:', anomaly);
    return new Response('Security violation detected', { status: 403 });
  }

  // ODAVL-WAVE-X5-INJECT: Feed anonymized signals to AI brain
  if (!request.url.includes('/_next/') && !request.url.includes('/api/')) {
    aiBrain.collectSignal({
      type: 'page_view',
      path: new URL(request.url).pathname,
      timestamp: Date.now()
    });
  }

  // Apply enhanced security headers
  Object.entries(securityHeaders.headers).forEach(([header, value]) => {
    response.headers.set(header, value);
  });

  // Generate and apply nonce-based CSP
  const nonce = generateNonce();
  const cspPolicy = buildCSPPolicy(nonce, process.env.NODE_ENV === 'development');
  response.headers.set('Content-Security-Policy', cspPolicy);
  response.headers.set('X-CSP-Nonce', nonce);

  /* <ODAVL-WAVE-X10-INJECT-START> */
  // Evolution telemetry hook (read-only)
  if (!request.url.includes('/_next/') && !request.url.includes('/api/')) {
    // Collect performance metrics for evolution system (safe)
    response.headers.set('X-Evolution-Timestamp', Date.now().toString());
  }
  /* <ODAVL-WAVE-X10-INJECT-END> */

  if (process.env.NODE_ENV === 'development') {
    console.log('🔒 WAVE X-4 Security + 🤖 WAVE X-5 AI + ♻️ WAVE X-10 Evolution applied:', { rateLimit: rateLimit.remaining, anomaly: !!anomaly, nonce });
  }

  return response;
}

export const config = {
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)']
};