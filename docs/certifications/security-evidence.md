# Security Evidence Snippets

## CSP Policy Implementation

**File:** `config/security/csp.policy.ts`

```typescript
// ODAVL-WAVE-X4-INJECT: Nonce-based Content Security Policy
export function generateNonce(): string {
  return crypto.randomBytes(16).toString('base64');
}

export function buildCSPPolicy(nonce: string, isDev = false): string {
  const basePolicy = {
    'default-src': ["'self'"],
    'script-src': ["'self'", `'nonce-${nonce}'`, 'plausible.io'],
    'style-src': ["'self'", `'nonce-${nonce}'`, 'fonts.googleapis.com'],
    'font-src': ["'self'", 'fonts.gstatic.com'],
    'img-src': ["'self'", 'data:', 'https:'],
    'connect-src': ["'self'", 'plausible.io'],
    'frame-ancestors': ["'none'"],
    'base-uri': ["'self'"],
    'form-action': ["'self'"],
    'upgrade-insecure-requests': []
  };
}
```

## Security Headers Configuration

**File:** `config/security/security.headers.json`

```json
{
  "headers": {
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY", 
    "X-XSS-Protection": "1; mode=block",
    "Referrer-Policy": "strict-origin-when-cross-origin",
    "Permissions-Policy": "camera=(), microphone=(), geolocation=(), payment=()",
    "Strict-Transport-Security": "max-age=31536000; includeSubDomains; preload",
    "Cross-Origin-Embedder-Policy": "require-corp",
    "Cross-Origin-Opener-Policy": "same-origin",
    "Cross-Origin-Resource-Policy": "same-site"
  }
}
```

## Middleware Security Integration

**File:** `src/middleware.ts`

```typescript
// ODAVL-WAVE-X4-INJECT: Enhanced security middleware with nonce-based CSP
// Rate limiting check
const rateLimit = checkRateLimit(clientIP);
if (!rateLimit.allowed) {
  return new Response('Rate limit exceeded', { status: 429 });
}

// IDS anomaly detection
const anomaly = detectAnomalies(request.url, Object.fromEntries(request.headers));
if (anomaly?.blocked) {
  console.warn('🚨 Security threat blocked:', anomaly);
  return new Response('Security violation detected', { status: 403 });
}

// Generate and apply nonce-based CSP
const nonce = generateNonce();
const cspPolicy = buildCSPPolicy(nonce, process.env.NODE_ENV === 'development');
response.headers.set('Content-Security-Policy', cspPolicy);
```
