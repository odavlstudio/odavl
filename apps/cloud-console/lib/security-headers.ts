/**
 * CSP (Content Security Policy) configuration for production
 */

export function generateCSP(): string {
  const policies = [
    // Default: Only same-origin
    "default-src 'self'",
    
    // Scripts: Self + Vercel Analytics + inline scripts with nonce
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.vercel-insights.com https://va.vercel-scripts.com",
    
    // Styles: Self + inline styles (Tailwind)
    "style-src 'self' 'unsafe-inline'",
    
    // Images: Self + data URIs + Vercel + external OG images
    "img-src 'self' data: https://*.vercel.app https://odavl.com https://www.odavl.com",
    
    // Fonts: Self + data URIs
    "font-src 'self' data:",
    
    // Connect: Self + Vercel Analytics + API routes
    "connect-src 'self' https://*.vercel-insights.com https://*.vercel-scripts.com",
    
    // Frame: Deny (prevent clickjacking)
    "frame-ancestors 'none'",
    
    // Base URI: Self only
    "base-uri 'self'",
    
    // Form actions: Self only
    "form-action 'self'",
    
    // Upgrade insecure requests in production
    ...(process.env.NODE_ENV === 'production' ? ['upgrade-insecure-requests'] : []),
  ];

  return policies.join('; ');
}

/**
 * Security headers middleware
 */
export const securityHeaders = [
  {
    key: 'Content-Security-Policy',
    value: generateCSP(),
  },
  {
    key: 'X-DNS-Prefetch-Control',
    value: 'on',
  },
  {
    key: 'X-XSS-Protection',
    value: '1; mode=block',
  },
  {
    key: 'X-Download-Options',
    value: 'noopen',
  },
  {
    key: 'X-Permitted-Cross-Domain-Policies',
    value: 'none',
  },
];
