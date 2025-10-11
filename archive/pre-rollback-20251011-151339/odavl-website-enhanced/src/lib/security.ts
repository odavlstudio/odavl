export const securityConfig = {
  headers: {
    'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline' fonts.googleapis.com; font-src 'self' fonts.gstatic.com; img-src 'self' data: https:; connect-src 'self';",
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
    'X-Frame-Options': 'DENY',
    'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
    'X-XSS-Protection': '1; mode=block',
  },
  rateLimit: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 20,
    skipSuccessfulRequests: false,
  },
  cors: {
    origin: process.env.NODE_ENV === 'production' ? 'https://odavl.studio' : true,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  },
};

export function getSecurityHeaders() {
  return securityConfig.headers;
}

export function validateSecurityCompliance(request: Request): boolean {
  const userAgent = request.headers.get('user-agent') || '';
  const origin = request.headers.get('origin');
  
  // Block suspicious user agents
  const suspiciousPatterns = ['bot', 'crawler', 'scanner'];
  if (suspiciousPatterns.some(pattern => userAgent.toLowerCase().includes(pattern))) {
    return false;
  }

  // Validate origin for CORS
  if (origin && process.env.NODE_ENV === 'production') {
    return origin === 'https://odavl.studio';
  }

  return true;
}