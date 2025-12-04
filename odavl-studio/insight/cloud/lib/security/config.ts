/**
 * Security Configuration
 * Centralized security settings for the application
 */

/**
 * CORS Configuration
 */
export const corsConfig = {
  development: {
    origins: [
      'http://localhost:3001',
      'http://localhost:3000',
      'http://127.0.0.1:3001',
      'http://127.0.0.1:3000',
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-CSRF-Token'],
    maxAge: 86400, // 24 hours
  },
  production: {
    origins: [
      'https://odavl.com',
      'https://www.odavl.com',
      'https://app.odavl.com',
      'https://api.odavl.com',
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-CSRF-Token'],
    maxAge: 86400, // 24 hours
  },
  staging: {
    origins: ['https://staging.odavl.com', 'https://staging-app.odavl.com'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-CSRF-Token'],
    maxAge: 86400,
  },
};

/**
 * Content Security Policy Configuration
 */
export const cspConfig = {
  development: {
    'default-src': ["'self'"],
    'script-src': ["'self'", "'unsafe-eval'", "'unsafe-inline'"],
    'style-src': ["'self'", "'unsafe-inline'"],
    'img-src': ["'self'", 'data:', 'https:'],
    'font-src': ["'self'", 'data:'],
    'connect-src': ["'self'", 'ws://localhost:*', 'wss://localhost:*'],
    'frame-ancestors': ["'none'"],
    'base-uri': ["'self'"],
    'form-action': ["'self'"],
  },
  production: {
    'default-src': ["'self'"],
    'script-src': ["'self'", "'unsafe-eval'"], // Next.js requires unsafe-eval
    'style-src': ["'self'", "'unsafe-inline'"], // Tailwind requires unsafe-inline
    'img-src': ["'self'", 'data:', 'https:'],
    'font-src': ["'self'", 'data:'],
    'connect-src': ["'self'", 'https://api.odavl.com', 'wss://api.odavl.com'],
    'frame-ancestors': ["'none'"],
    'base-uri': ["'self'"],
    'form-action': ["'self'"],
    'upgrade-insecure-requests': [],
  },
};

/**
 * Security Headers Configuration
 */
export const securityHeaders = {
  // HSTS - Force HTTPS
  strictTransportSecurity: {
    maxAge: 31536000, // 1 year
    includeSubDomains: true,
    preload: true,
  },

  // X-Frame-Options - Prevent clickjacking
  frameOptions: 'DENY', // Alternative: 'SAMEORIGIN'

  // X-Content-Type-Options - Prevent MIME sniffing
  contentTypeOptions: 'nosniff',

  // X-XSS-Protection - Enable XSS filter
  xssProtection: {
    enabled: true,
    mode: 'block',
  },

  // Referrer-Policy
  referrerPolicy: 'strict-origin-when-cross-origin',

  // Permissions-Policy (formerly Feature-Policy)
  permissionsPolicy: {
    camera: [],
    microphone: [],
    geolocation: [],
    'interest-cohort': [], // Disable FLoC
    payment: [],
    usb: [],
    'sync-xhr': [],
  },
};

/**
 * Trusted Domains for External Resources
 */
export const trustedDomains = {
  images: [
    'https://avatars.githubusercontent.com',
    'https://lh3.googleusercontent.com',
    'https://cdn.odavl.com',
  ],
  scripts: [
    'https://www.googletagmanager.com',
    'https://www.google-analytics.com',
  ],
  styles: ['https://fonts.googleapis.com', 'https://cdn.odavl.com'],
  fonts: ['https://fonts.gstatic.com', 'https://cdn.odavl.com'],
  connect: [
    'https://api.odavl.com',
    'wss://api.odavl.com',
    'https://www.google-analytics.com',
    'https://sentry.io',
  ],
};

/**
 * Rate Limiting Configuration (for future use)
 */
export const rateLimitConfig = {
  auth: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 5, // 5 requests per window
  },
  api: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 100, // 100 requests per window
  },
  analysis: {
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 10, // 10 analyses per window
  },
};

/**
 * Security Best Practices Checklist
 */
export const securityChecklist = {
  headers: {
    hsts: '✅ HSTS enabled with preload',
    xfo: '✅ X-Frame-Options: DENY',
    xcto: '✅ X-Content-Type-Options: nosniff',
    csp: '✅ Content-Security-Policy configured',
    xss: '✅ X-XSS-Protection enabled',
    referrer: '✅ Referrer-Policy set',
    permissions: '✅ Permissions-Policy configured',
  },
  cors: {
    whitelist: '✅ Origin whitelist implemented',
    credentials: '✅ Credentials handling secure',
    preflight: '✅ OPTIONS preflight handled',
  },
  validation: {
    input: '✅ Zod validation on all inputs',
    sanitization: '✅ XSS sanitization enabled',
    sql: '✅ Parameterized queries (Prisma)',
  },
  authentication: {
    jwt: '✅ JWT tokens implemented',
    httpOnly: '✅ HTTP-only cookies',
    secure: '✅ Secure flag in production',
    bcrypt: '✅ Password hashing with bcrypt',
  },
};

/**
 * Get CORS configuration for current environment
 */
export function getCorsConfig() {
  const env = process.env.NODE_ENV || 'development';
  return corsConfig[env as keyof typeof corsConfig] || corsConfig.development;
}

/**
 * Get CSP configuration for current environment
 */
export function getCspConfig() {
  const env = process.env.NODE_ENV || 'development';
  return cspConfig[env as keyof typeof cspConfig] || cspConfig.development;
}

/**
 * Build CSP header string from config
 */
export function buildCspHeader(config: Record<string, string[]>): string {
  return Object.entries(config)
    .map(([directive, values]) => {
      if (values.length === 0) {
        return directive;
      }
      return `${directive} ${values.join(' ')}`;
    })
    .join('; ');
}

/**
 * Check if origin is allowed
 */
export function isOriginAllowed(origin: string | null): boolean {
  if (!origin) return false;
  const config = getCorsConfig();
  return config.origins.includes(origin);
}

/**
 * Get security headers as object
 */
export function getSecurityHeaders(): Record<string, string> {
  const env = process.env.NODE_ENV || 'development';
  const headers: Record<string, string> = {
    'X-DNS-Prefetch-Control': 'on',
    'X-Frame-Options': securityHeaders.frameOptions,
    'X-Content-Type-Options': securityHeaders.contentTypeOptions,
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': securityHeaders.referrerPolicy,
    'Permissions-Policy': Object.entries(securityHeaders.permissionsPolicy)
      .map(([feature, origins]) => {
        if (origins.length === 0) {
          return `${feature}=()`;
        }
        return `${feature}=(${origins.join(' ')})`;
      })
      .join(', '),
  };

  // Add HSTS only in production
  if (env === 'production') {
    const hsts = securityHeaders.strictTransportSecurity;
    headers['Strict-Transport-Security'] = `max-age=${hsts.maxAge}${
      hsts.includeSubDomains ? '; includeSubDomains' : ''
    }${hsts.preload ? '; preload' : ''}`;
  }

  // Add CSP
  headers['Content-Security-Policy'] = buildCspHeader(getCspConfig());

  return headers;
}
