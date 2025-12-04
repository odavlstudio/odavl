# Security Documentation

## Table of Contents

- [Security Overview](#security-overview)
- [Authentication & Authorization](#authentication--authorization)
- [CSRF Protection](#csrf-protection)
- [Input Sanitization](#input-sanitization)
- [Security Headers](#security-headers)
- [Request Signing](#request-signing)
- [Audit Logging](#audit-logging)
- [Rate Limiting & Brute Force Protection](#rate-limiting--brute-force-protection)
- [Vulnerability Scanning](#vulnerability-scanning)
- [Security Best Practices](#security-best-practices)
- [Incident Response](#incident-response)
- [Reporting Security Vulnerabilities](#reporting-security-vulnerabilities)

## Security Overview

Guardian implements defense-in-depth security with multiple layers of protection:

1. **Authentication & Authorization**: API key and JWT token-based authentication
2. **CSRF Protection**: Token-based protection for state-changing operations
3. **Input Sanitization**: Comprehensive validation and sanitization of all inputs
4. **Security Headers**: HTTP security headers via Helmet.js
5. **Request Signing**: HMAC-SHA256 signature verification for API requests
6. **Audit Logging**: Comprehensive security event logging
7. **Rate Limiting**: Brute force protection for authentication endpoints
8. **Dependency Scanning**: Automated vulnerability detection with Dependabot

## Authentication & Authorization

### API Key Authentication

```typescript
// In HTTP headers
X-API-Key: grd_live_abc123...
```

**Implementation:**

- API keys are hashed with bcrypt before storage
- Rate-limited per tier (FREE: 100/hour, PRO: 1000/hour, ENTERPRISE: unlimited)
- Tracked with last_used_at timestamps for monitoring
- Can be revoked instantly via admin dashboard

### JWT Tokens

```typescript
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
```

**Implementation:**

- Short-lived access tokens (15 minutes)
- Long-lived refresh tokens (7 days)
- Tokens are signed with HS256
- Token revocation via blacklist in Redis

### Role-Based Access Control (RBAC)

```typescript
enum Role {
  OWNER = 'OWNER',       // Full access
  ADMIN = 'ADMIN',       // Manage members and settings
  DEVELOPER = 'DEVELOPER', // Create/edit projects and tests
  VIEWER = 'VIEWER',     // Read-only access
}
```

## CSRF Protection

### Implementation

Guardian uses the **double-submit cookie pattern** for CSRF protection:

```typescript
import { csrfProtection, getCsrfToken } from '@/lib/csrf';

// Apply middleware to routes
app.post('/api/projects', csrfProtection(), createProjectHandler);

// Get CSRF token for forms
app.get('/api/csrf-token', (req, res) => {
  const token = getCsrfToken(req);
  res.json({ token });
});
```

### Usage in Frontend

```typescript
// Fetch CSRF token
const { token } = await fetch('/api/csrf-token').then(r => r.json());

// Include in requests (any of these methods works)
// 1. Cookie (automatic)
// 2. Header
fetch('/api/projects', {
  method: 'POST',
  headers: {
    'X-CSRF-Token': token,
  },
  body: JSON.stringify(data),
});

// 3. Body parameter
fetch('/api/projects', {
  method: 'POST',
  body: JSON.stringify({ ...data, _csrf: token }),
});
```

### Configuration

```typescript
// Token lifetime: 24 hours
// Cookie settings: httpOnly, secure (production), sameSite: 'strict'
// Timing-safe comparison prevents timing attacks
```

## Input Sanitization

### Available Sanitizers

```typescript
import {
  sanitizeInput,      // Basic string sanitization
  sanitizeHtml,       // HTML with DOMPurify
  sanitizeObject,     // Recursive object sanitization
  sanitizeEmail,      // Email validation & normalization
  sanitizeUrl,        // URL validation & protocol check
  sanitizeFilename,   // Prevent path traversal
  sanitizeSql,        // SQL injection prevention
  sanitizeInteger,    // Type coercion with bounds
  sanitizeFloat,      // Float with precision
  sanitizeBoolean,    // Boolean coercion
} from '@/lib/sanitization';
```

### Examples

```typescript
// Basic string sanitization
const safe = sanitizeInput(userInput);

// HTML sanitization with custom policy
const safeHtml = sanitizeHtml(htmlContent, {
  allowedTags: ['p', 'b', 'i', 'a'],
  allowedAttributes: { a: ['href', 'title'] },
});

// Email validation
const email = sanitizeEmail(input); // Returns string | null

// URL with protocol whitelist
const url = sanitizeUrl(input, {
  protocols: ['http:', 'https:'],
  requireProtocol: true,
});

// Filename (prevents ../../../etc/passwd)
const filename = sanitizeFilename(userFilename);

// Integer with bounds
const page = sanitizeInteger(req.query.page, {
  min: 1,
  max: 1000,
  defaultValue: 1,
});

// Recursive object sanitization
const safeData = sanitizeObject(requestBody);
```

### Best Practices

1. **Sanitize at the boundary**: Sanitize all user input at API entry points
2. **Validate before sanitize**: Check data types and required fields first
3. **Use specialized sanitizers**: Choose the right sanitizer for each field type
4. **Recursive sanitization**: Use `sanitizeObject()` for nested structures
5. **Log sanitization**: Monitor what gets sanitized to detect attack patterns

## Security Headers

### Helmet.js Configuration

```typescript
import { createSecurityHeadersMiddleware } from '@/lib/middleware/security-headers';

// Apply to all routes
app.use(createSecurityHeadersMiddleware());
```

### Headers Applied

| Header | Value | Purpose |
|--------|-------|---------|
| **Content-Security-Policy** | See CSP section below | Prevent XSS and injection attacks |
| **Strict-Transport-Security** | max-age=31536000; includeSubDomains; preload | Enforce HTTPS |
| **X-Frame-Options** | DENY | Prevent clickjacking |
| **X-Content-Type-Options** | nosniff | Prevent MIME sniffing |
| **X-XSS-Protection** | 1; mode=block | Legacy XSS protection |
| **Referrer-Policy** | strict-origin-when-cross-origin | Control referrer information |

### Content Security Policy (CSP)

```
default-src 'self';
script-src 'self' 'unsafe-inline' 'unsafe-eval';
style-src 'self' 'unsafe-inline';
img-src 'self' data: https:;
font-src 'self' data:;
connect-src 'self' ws: wss:;
frame-src 'none';
object-src 'none';
base-uri 'self';
form-action 'self';
frame-ancestors 'none';
```

**Note**: `unsafe-inline` and `unsafe-eval` are allowed for Next.js compatibility. Use nonces in production.

## Request Signing

### HMAC-SHA256 Signature

For API-to-API communication, use request signing for additional security:

```typescript
import { signRequest, validateRequestSignature } from '@/lib/request-signing';

// Client: Sign request
const { signature, timestamp, apiKey } = signRequest(
  'POST',
  '/api/projects',
  requestBody,
  'grd_live_abc123',
  'secret_key'
);

// Send with headers
fetch('/api/projects', {
  method: 'POST',
  headers: {
    'X-Signature': signature,
    'X-Timestamp': timestamp,
    'X-Nonce': generateNonce(),
  },
  body: JSON.stringify(requestBody),
});

// Server: Validate signature
app.use('/api/*', requestSigningMiddleware(async (apiKey) => {
  return await getSecretForApiKey(apiKey);
}));
```

### Signature Format

```
HMAC-SHA256 ${apiKey}:${timestamp}:${signature}
```

### Protection Mechanisms

1. **Timestamp validation**: Requests expire after 5 minutes (configurable)
2. **Nonce checking**: Prevents replay attacks (stored in Redis for 10 minutes)
3. **Timing-safe comparison**: Uses `crypto.timingSafeEqual()` to prevent timing attacks

### Configuration

```typescript
const options = {
  maxAgeSeconds: 300,    // 5 minutes
  checkNonce: true,      // Enable replay prevention
  nonceTTL: 600,         // 10 minutes
};
```

## Audit Logging

### Event Types

```typescript
enum AuditEventType {
  // Authentication
  LOGIN_SUCCESS = 'auth.login.success',
  LOGIN_FAILURE = 'auth.login.failure',
  TOKEN_REVOKED = 'auth.token.revoked',
  
  // Authorization
  ACCESS_DENIED = 'authz.access.denied',
  
  // Data operations
  DATA_CREATED = 'data.created',
  DATA_UPDATED = 'data.updated',
  DATA_DELETED = 'data.deleted',
  
  // Security events
  SECURITY_VIOLATION = 'security.violation',
  RATE_LIMIT_EXCEEDED = 'security.rate_limit',
  CSRF_VIOLATION = 'security.csrf',
  SIGNATURE_INVALID = 'security.signature',
}
```

### Usage

```typescript
import {
  logAuthEvent,
  logAuthzEvent,
  logDataOperation,
  logSecurityViolation,
} from '@/lib/audit-logger';

// Log authentication
logAuthEvent({
  type: 'login',
  userId: user.id,
  email: user.email,
  ipAddress: req.ip,
  userAgent: req.headers['user-agent'],
  success: true,
});

// Log security violation
logSecurityViolation({
  type: 'csrf',
  userId: req.user?.id,
  ipAddress: req.ip,
  resource: req.path,
  details: 'Invalid CSRF token',
});
```

### Log Storage

- **Location**: `logs/audit/audit-YYYY-MM-DD.log`
- **Critical logs**: `logs/audit/audit-critical-YYYY-MM-DD.log`
- **Retention**: 90 days (regular), 365 days (critical)
- **Rotation**: Daily, 20MB max size, compressed archives
- **Format**: JSON for machine parsing

### Querying Logs

```bash
# Search for failed logins
grep "auth.login.failure" logs/audit/audit-*.log | jq .

# Find security violations from specific IP
grep "1.2.3.4" logs/audit/audit-critical-*.log | jq .

# Monitor real-time
tail -f logs/audit/audit-$(date +%Y-%m-%d).log | jq .
```

## Rate Limiting & Brute Force Protection

### Authentication Rate Limiting

```typescript
import { authRateLimit } from '@/lib/middleware/rate-limit-auth';

// Apply to authentication routes
app.post('/api/auth/login', authRateLimit(), loginHandler);

// In login handler
app.post('/api/auth/login', authRateLimit(), async (req, res) => {
  const credentials = req.body;
  
  try {
    const user = await authenticate(credentials);
    
    // Success: reset attempts
    await req.rateLimit.resetAttempts();
    
    res.json({ success: true, user });
  } catch (error) {
    // Failure: record attempt
    const { attempts, blocked, resetTime } = await req.rateLimit.recordFailure();
    
    res.status(401).json({
      error: 'Invalid credentials',
      attemptsRemaining: 5 - attempts,
      blockedUntil: blocked ? new Date(resetTime) : undefined,
    });
  }
});
```

### Configuration

```typescript
// Default configuration
{
  maxAttempts: 5,              // 5 failed attempts
  windowSeconds: 900,          // 15-minute window
  blockDurationSeconds: 3600,  // 1-hour block
}

// Custom configuration
const strictLimit = createRateLimiter({
  maxAttempts: 3,
  windowSeconds: 600,          // 10 minutes
  blockDurationSeconds: 7200,  // 2 hours
});
```

### Response Headers

```
X-RateLimit-Limit: 5
X-RateLimit-Remaining: 3
X-RateLimit-Reset: 2025-01-15T10:30:00Z
Retry-After: 3600
```

## Vulnerability Scanning

### Dependabot

Automated dependency updates are configured via `.github/dependabot.yml`:

```yaml
version: 2
updates:
  - package-ecosystem: "npm"
    directory: "/apps/guardian"
    schedule:
      interval: "weekly"
    open-pull-requests-limit: 10
    labels: ["dependencies", "security"]
```

**Features:**

- Weekly scans for all workspaces
- Automatic security patch PRs
- Grouped updates (major, minor, patch)
- GitHub security alerts integration

### npm audit

```bash
# Check for vulnerabilities
pnpm audit

# Fix automatically
pnpm audit fix

# Production dependencies only
pnpm audit --production
```

### Snyk Integration (Optional)

```bash
# Install Snyk CLI
npm install -g snyk

# Authenticate
snyk auth

# Test for vulnerabilities
snyk test

# Monitor project
snyk monitor
```

## Security Best Practices

### Development

- [ ] Always sanitize user input
- [ ] Validate data types and bounds
- [ ] Use parameterized queries (Prisma handles this)
- [ ] Never log sensitive data (passwords, tokens, API keys)
- [ ] Use environment variables for secrets
- [ ] Enable strict TypeScript mode
- [ ] Run linting and type checks in CI

### Authentication

- [ ] Hash passwords with bcrypt (cost factor ≥12)
- [ ] Use short-lived access tokens (≤15 minutes)
- [ ] Implement token rotation
- [ ] Store tokens securely (httpOnly cookies)
- [ ] Never expose secrets in client-side code

### API Security

- [ ] Apply rate limiting to all endpoints
- [ ] Validate API keys on every request
- [ ] Use HTTPS in production
- [ ] Implement request signing for sensitive operations
- [ ] Log all authentication and authorization events

### Database

- [ ] Use least-privilege database users
- [ ] Enable connection pooling
- [ ] Encrypt data at rest
- [ ] Regular backups (automated daily)
- [ ] Test backup restoration quarterly

### Infrastructure

- [ ] Keep dependencies up to date
- [ ] Scan container images for vulnerabilities
- [ ] Use network policies in Kubernetes
- [ ] Encrypt secrets (Sealed Secrets, Vault)
- [ ] Enable audit logging at infrastructure level

## Incident Response

### Security Incident Procedure

1. **Detect**: Monitor logs, alerts, and user reports
2. **Contain**: Isolate affected systems, revoke compromised credentials
3. **Investigate**: Analyze logs, determine scope and impact
4. **Eradicate**: Remove threat, patch vulnerabilities
5. **Recover**: Restore services, verify security
6. **Post-mortem**: Document incident, improve processes

### Emergency Contacts

- **Security Team**: <security@odavl.com>
- **On-Call Engineer**: Check PagerDuty
- **Infrastructure Team**: <infra@odavl.com>

### Incident Severity

| Level | Description | Response Time |
|-------|-------------|---------------|
| **Critical** | Data breach, service outage | Immediate (< 15 min) |
| **High** | Security vulnerability exploited | < 1 hour |
| **Medium** | Suspicious activity detected | < 4 hours |
| **Low** | Potential vulnerability identified | < 24 hours |

### Rollback Procedure

```bash
# Kubernetes deployment rollback
kubectl rollout undo deployment/guardian -n guardian

# Database migration rollback
pnpx prisma migrate resolve --rolled-back <migration_name>

# Verify services
kubectl get pods -n guardian
curl https://api.guardian.odavl.com/health
```

## Reporting Security Vulnerabilities

### Responsible Disclosure

We appreciate security researchers and users who report vulnerabilities responsibly.

**Please DO NOT:**

- Post vulnerabilities publicly before we've had a chance to address them
- Access or modify data that doesn't belong to you
- Perform attacks that could harm service availability

### How to Report

**Email**: <security@odavl.com>

**Include**:

1. Description of the vulnerability
2. Steps to reproduce
3. Potential impact
4. Suggested fix (if available)

**GPG Key** (optional):

```
-----BEGIN PGP PUBLIC KEY BLOCK-----
[Key will be added when available]
-----END PGP PUBLIC KEY BLOCK-----
```

### Response Timeline

- **Acknowledgment**: Within 24 hours
- **Initial assessment**: Within 72 hours
- **Status updates**: Every 7 days
- **Resolution target**: 30-90 days depending on severity

### Bug Bounty

We currently do not have a formal bug bounty program, but we recognize and appreciate responsible security research. Significant vulnerabilities may be eligible for rewards on a case-by-case basis.

---

## Security Checklist (Production Deployment)

- [ ] All environment variables set correctly
- [ ] HTTPS enforced (redirect HTTP → HTTPS)
- [ ] Security headers middleware enabled
- [ ] CSRF protection on all state-changing endpoints
- [ ] Rate limiting configured for authentication routes
- [ ] Audit logging enabled and monitored
- [ ] Database connection uses SSL/TLS
- [ ] Redis requires password authentication
- [ ] Secrets encrypted in Kubernetes
- [ ] Dependabot enabled and monitored
- [ ] Incident response plan documented
- [ ] Security team contacts verified
- [ ] Backup and restore procedures tested
- [ ] Monitoring and alerting configured
- [ ] Vulnerability scanning in CI/CD pipeline

---

**Last Updated**: January 2025  
**Version**: 1.0.0  
**Maintainer**: ODAVL Security Team
