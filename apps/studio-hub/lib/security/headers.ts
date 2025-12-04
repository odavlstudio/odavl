import { NextRequest, NextResponse } from 'next/server';

export function securityHeaders(request: NextRequest, response: NextResponse): NextResponse {
  const headers = new Headers(response.headers);
  
  // Content Security Policy
  const cspDirectives = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://cdn.jsdelivr.net",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "img-src 'self' data: https: blob:",
    "font-src 'self' https://fonts.gstatic.com",
    "connect-src 'self' https://api.sentry.io https://*.upstash.io",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join('; ');
  
  headers.set('Content-Security-Policy', cspDirectives);
  
  // Prevent clickjacking
  headers.set('X-Frame-Options', 'DENY');
  
  // Prevent MIME sniffing
  headers.set('X-Content-Type-Options', 'nosniff');
  
  // XSS Protection (legacy but still useful)
  headers.set('X-XSS-Protection', '1; mode=block');
  
  // Referrer Policy
  headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // Permissions Policy (formerly Feature Policy)
  const permissionsPolicy = [
    'camera=()',
    'microphone=()',
    'geolocation=()',
    'interest-cohort=()',
  ].join(', ');
  headers.set('Permissions-Policy', permissionsPolicy);
  
  // HSTS (Strict Transport Security)
  if (process.env.NODE_ENV === 'production') {
    headers.set(
      'Strict-Transport-Security',
      'max-age=31536000; includeSubDomains; preload'
    );
  }
  
  // Prevent DNS prefetching
  headers.set('X-DNS-Prefetch-Control', 'off');
  
  // Disable browser features
  headers.set('X-Download-Options', 'noopen');
  headers.set('X-Permitted-Cross-Domain-Policies', 'none');
  
  return NextResponse.next({
    request,
    headers,
  });
}

// Rate limit headers helper
export function addRateLimitHeaders(
  response: NextResponse,
  limit: number,
  remaining: number,
  reset: number
): NextResponse {
  response.headers.set('X-RateLimit-Limit', limit.toString());
  response.headers.set('X-RateLimit-Remaining', remaining.toString());
  response.headers.set('X-RateLimit-Reset', reset.toString());
  
  return response;
}
