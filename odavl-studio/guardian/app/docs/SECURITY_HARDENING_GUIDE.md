# Security Hardening Guide for ODAVL Guardian

## Overview

This comprehensive guide covers security hardening best practices for ODAVL Guardian across all components: application, infrastructure, database, and operations.

**Last Updated:** Week 15 (Security Audit)  
**Guardian Version:** v2.0  
**Target Security Grade:** A+ (100/100)

---

## Table of Contents

1. [Application Security](#application-security)
2. [Infrastructure Security](#infrastructure-security)
3. [Database Security](#database-security)
4. [API Security](#api-security)
5. [Authentication & Authorization](#authentication--authorization)
6. [Secret Management](#secret-management)
7. [Monitoring & Logging](#monitoring--logging)
8. [Incident Response](#incident-response)
9. [Compliance & Audit](#compliance--audit)
10. [Security Checklist](#security-checklist)

---

## Application Security

### 1. Input Validation

**Principle:** Never trust user input. Validate and sanitize all input on the server side.

#### Implementation

```typescript
// ✅ Good: Comprehensive input validation
import { z } from 'zod';

const TestRunSchema = z.object({
  name: z.string().min(1).max(100),
  framework: z.enum(['playwright', 'jest', 'vitest', 'cypress']),
  parallelism: z.number().int().min(1).max(10),
  timeout: z.number().int().min(1000).max(300000),
  environment: z.string().regex(/^[a-z0-9-]+$/),
});

app.post('/api/test-runs', async (req, res) => {
  try {
    const validated = TestRunSchema.parse(req.body);
    // Process validated data
  } catch (error) {
    return res.status(400).json({ error: 'Invalid input' });
  }
});
```

```typescript
// ❌ Bad: No validation
app.post('/api/test-runs', async (req, res) => {
  const { name, framework } = req.body; // Dangerous!
  await db.createTestRun({ name, framework });
});
```

#### Checklist

- [ ] All API endpoints validate input using schemas (Zod, Joi, Yup)
- [ ] File uploads limited by size (max 10MB) and type (whitelist)
- [ ] SQL queries use parameterized statements (no string concatenation)
- [ ] URL parameters validated with regex patterns
- [ ] JSON payloads limited to 1MB max size
- [ ] Array lengths limited (max 1000 items)
- [ ] String lengths enforced (reasonable maximums)
- [ ] Numeric ranges validated (min/max)

### 2. Output Encoding

**Principle:** Encode all output to prevent XSS attacks.

#### Implementation

```typescript
// ✅ Good: Automatic escaping with React
function TestResult({ message }: { message: string }) {
  return <div>{message}</div>; // React auto-escapes
}

// ✅ Good: Manual encoding when needed
import DOMPurify from 'dompurify';

function renderHTML(html: string) {
  const clean = DOMPurify.sanitize(html);
  return <div dangerouslySetInnerHTML={{ __html: clean }} />;
}
```

```typescript
// ❌ Bad: Unsafe HTML rendering
function renderHTML(html: string) {
  return <div dangerouslySetInnerHTML={{ __html: html }} />; // XSS!
}
```

#### Checklist

- [ ] All user-generated content escaped before display
- [ ] HTML rendering uses DOMPurify or similar sanitizer
- [ ] Content Security Policy (CSP) headers configured
- [ ] No `eval()` or `Function()` constructors used
- [ ] No inline scripts or styles (use nonce/hash if needed)

### 3. Security Headers

**Principle:** Configure HTTP security headers to protect against common attacks.

#### Implementation

```typescript
// ✅ Good: Comprehensive security headers
import helmet from 'helmet';

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'nonce-{RANDOM}'"],
      styleSrc: ["'self'", "'unsafe-inline'"], // Only if necessary
      imgSrc: ["'self'", "data:", "https:"],
      fontSrc: ["'self'"],
      connectSrc: ["'self'", "https://api.guardian.app"],
      frameSrc: ["'none'"],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: [],
    },
  },
  hsts: {
    maxAge: 31536000, // 1 year
    includeSubDomains: true,
    preload: true,
  },
  frameguard: { action: 'deny' },
  noSniff: true,
  xssFilter: true,
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
}));

// Additional custom headers
app.use((req, res, next) => {
  res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  next();
});
```

#### Required Headers

| Header | Value | Purpose |
|--------|-------|---------|
| `Content-Security-Policy` | See above | Prevents XSS, injection attacks |
| `Strict-Transport-Security` | `max-age=31536000; includeSubDomains; preload` | Forces HTTPS |
| `X-Frame-Options` | `DENY` | Prevents clickjacking |
| `X-Content-Type-Options` | `nosniff` | Prevents MIME sniffing |
| `Referrer-Policy` | `strict-origin-when-cross-origin` | Limits referrer information |
| `Permissions-Policy` | `geolocation=(), microphone=(), camera=()` | Disables unused browser features |

### 4. Error Handling

**Principle:** Never expose sensitive information in error messages.

#### Implementation

```typescript
// ✅ Good: Generic errors for users, detailed logs for admins
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  // Log detailed error server-side
  logger.error('Request failed', {
    error: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    user: req.user?.id,
  });

  // Send generic error to client
  if (process.env.NODE_ENV === 'production') {
    res.status(500).json({ error: 'Internal server error' });
  } else {
    // Development: send stack trace
    res.status(500).json({ error: err.message, stack: err.stack });
  }
});
```

```typescript
// ❌ Bad: Exposing database errors
app.get('/api/users/:id', async (req, res) => {
  try {
    const user = await db.query('SELECT * FROM users WHERE id = $1', [req.params.id]);
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message }); // Leaks SQL structure!
  }
});
```

#### Checklist

- [ ] Production errors show generic messages only
- [ ] Stack traces never exposed to clients
- [ ] Database errors caught and logged server-side
- [ ] Error monitoring configured (Sentry, Rollbar)
- [ ] Rate limiting on error endpoints

---

## Infrastructure Security

### 1. Network Security

#### Firewall Rules

```bash
# Allow only necessary ports
ufw default deny incoming
ufw default allow outgoing
ufw allow 22/tcp    # SSH (restrict to VPN IPs)
ufw allow 80/tcp    # HTTP (redirect to HTTPS)
ufw allow 443/tcp   # HTTPS
ufw enable
```

#### TLS Configuration

```nginx
# Nginx: Strong TLS configuration
ssl_protocols TLSv1.2 TLSv1.3;
ssl_ciphers 'ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-ECDSA-CHACHA20-POLY1305:ECDHE-RSA-CHACHA20-POLY1305';
ssl_prefer_server_ciphers on;
ssl_session_cache shared:SSL:10m;
ssl_session_timeout 10m;
ssl_stapling on;
ssl_stapling_verify on;

# HSTS header
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;
```

### 2. Container Security

#### Dockerfile Hardening

```dockerfile
# ✅ Good: Security-hardened Dockerfile
FROM node:20-alpine AS base

# Run as non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nextjs -u 1001

# Install only production dependencies
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

# Copy application files
COPY --chown=nextjs:nodejs . .

# Switch to non-root user
USER nextjs

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node healthcheck.js

CMD ["node", "server.js"]
```

```dockerfile
# ❌ Bad: Insecure Dockerfile
FROM node:20
WORKDIR /app
COPY . .
RUN npm install # Installs dev dependencies
CMD ["node", "server.js"] # Running as root!
```

#### Kubernetes Security

```yaml
# ✅ Good: Security-hardened Pod
apiVersion: v1
kind: Pod
metadata:
  name: guardian-app
spec:
  securityContext:
    runAsNonRoot: true
    runAsUser: 1001
    fsGroup: 1001
  containers:
  - name: app
    image: guardian/app:latest
    securityContext:
      allowPrivilegeEscalation: false
      readOnlyRootFilesystem: true
      capabilities:
        drop:
        - ALL
    resources:
      limits:
        memory: "512Mi"
        cpu: "500m"
      requests:
        memory: "256Mi"
        cpu: "250m"
    livenessProbe:
      httpGet:
        path: /health
        port: 3000
      initialDelaySeconds: 10
      periodSeconds: 10
    readinessProbe:
      httpGet:
        path: /ready
        port: 3000
      initialDelaySeconds: 5
      periodSeconds: 5
```

### 3. Cloud Security (Azure)

#### Identity & Access Management

```bash
# Assign minimal required roles
az role assignment create \
  --assignee <user-or-service-principal> \
  --role "Contributor" \
  --scope /subscriptions/<subscription-id>/resourceGroups/guardian-prod

# Enable managed identity
az webapp identity assign \
  --name guardian-app \
  --resource-group guardian-prod

# Grant Key Vault access
az keyvault set-policy \
  --name guardian-vault \
  --object-id <managed-identity-id> \
  --secret-permissions get list
```

#### Network Isolation

```bash
# Create virtual network
az network vnet create \
  --name guardian-vnet \
  --resource-group guardian-prod \
  --address-prefix 10.0.0.0/16

# Create subnet for app services
az network vnet subnet create \
  --name app-subnet \
  --vnet-name guardian-vnet \
  --address-prefix 10.0.1.0/24 \
  --service-endpoints Microsoft.Sql Microsoft.KeyVault

# Configure private endpoint for database
az network private-endpoint create \
  --name guardian-db-endpoint \
  --resource-group guardian-prod \
  --vnet-name guardian-vnet \
  --subnet app-subnet \
  --private-connection-resource-id <db-resource-id> \
  --group-id sqlServer \
  --connection-name guardian-db-connection
```

---

## Database Security

### 1. Connection Security

```typescript
// ✅ Good: Secure database configuration
import { Pool } from 'pg';

const pool = new Pool({
  host: process.env.DB_HOST,
  port: 5432,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  ssl: {
    rejectUnauthorized: true,
    ca: process.env.DB_CA_CERT,
  },
  max: 20, // Connection pool size
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});
```

### 2. SQL Injection Prevention

```typescript
// ✅ Good: Parameterized queries
async function getUser(userId: string) {
  const result = await pool.query(
    'SELECT * FROM users WHERE id = $1',
    [userId]
  );
  return result.rows[0];
}

// ✅ Good: ORM with built-in protection
const user = await prisma.user.findUnique({
  where: { id: userId },
});
```

```typescript
// ❌ Bad: String concatenation (SQL injection!)
async function getUser(userId: string) {
  const result = await pool.query(
    `SELECT * FROM users WHERE id = '${userId}'`
  );
  return result.rows[0];
}
```

### 3. Database Hardening

```sql
-- PostgreSQL: Security best practices

-- 1. Create application user with minimal privileges
CREATE USER guardian_app WITH PASSWORD 'strong-password-here';

-- 2. Grant only necessary permissions
GRANT CONNECT ON DATABASE guardian TO guardian_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO guardian_app;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO guardian_app;

-- 3. Revoke public schema privileges
REVOKE ALL ON SCHEMA public FROM PUBLIC;
GRANT USAGE ON SCHEMA public TO guardian_app;

-- 4. Enable row-level security
ALTER TABLE test_runs ENABLE ROW LEVEL SECURITY;

CREATE POLICY user_test_runs ON test_runs
  FOR ALL
  TO guardian_app
  USING (user_id = current_setting('app.user_id')::uuid);

-- 5. Audit logging
ALTER DATABASE guardian SET log_statement = 'mod'; -- Log INSERT/UPDATE/DELETE
ALTER DATABASE guardian SET log_duration = on;
ALTER DATABASE guardian SET log_line_prefix = '%t [%p]: [%l-1] user=%u,db=%d,app=%a,client=%h ';
```

### 4. Data Encryption

```typescript
// Encrypt sensitive data at rest
import crypto from 'crypto';

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY!; // 32 bytes
const IV_LENGTH = 16;

function encrypt(text: string): string {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY, 'hex'), iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return iv.toString('hex') + ':' + encrypted;
}

function decrypt(text: string): string {
  const parts = text.split(':');
  const iv = Buffer.from(parts[0], 'hex');
  const encrypted = parts[1];
  const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY, 'hex'), iv);
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}
```

---

## API Security

### 1. Authentication

```typescript
// ✅ Good: JWT with short expiration + refresh tokens
import jwt from 'jsonwebtoken';

const ACCESS_TOKEN_EXPIRY = '15m'; // 15 minutes
const REFRESH_TOKEN_EXPIRY = '7d'; // 7 days

function generateTokens(userId: string) {
  const accessToken = jwt.sign(
    { userId, type: 'access' },
    process.env.JWT_SECRET!,
    { expiresIn: ACCESS_TOKEN_EXPIRY }
  );

  const refreshToken = jwt.sign(
    { userId, type: 'refresh' },
    process.env.JWT_REFRESH_SECRET!,
    { expiresIn: REFRESH_TOKEN_EXPIRY }
  );

  return { accessToken, refreshToken };
}

// Verify middleware
function authenticateToken(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  const token = authHeader?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string };
    req.user = { id: payload.userId };
    next();
  } catch (error) {
    return res.status(403).json({ error: 'Invalid or expired token' });
  }
}
```

### 2. Rate Limiting

```typescript
// ✅ Good: Multi-level rate limiting
import rateLimit from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';
import Redis from 'ioredis';

const redis = new Redis(process.env.REDIS_URL);

// Global rate limit
const globalLimiter = rateLimit({
  store: new RedisStore({ client: redis }),
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per window
  message: 'Too many requests from this IP',
  standardHeaders: true,
  legacyHeaders: false,
});

// Strict rate limit for authentication
const authLimiter = rateLimit({
  store: new RedisStore({ client: redis, prefix: 'auth_limit:' }),
  windowMs: 15 * 60 * 1000,
  max: 5, // 5 login attempts per 15 minutes
  skipSuccessfulRequests: true, // Don't count successful logins
});

// Apply rate limiters
app.use('/api', globalLimiter);
app.post('/api/auth/login', authLimiter, loginHandler);
```

### 3. CORS Configuration

```typescript
// ✅ Good: Restrictive CORS
import cors from 'cors';

const allowedOrigins = [
  'https://app.guardian.app',
  'https://guardian.app',
];

if (process.env.NODE_ENV === 'development') {
  allowedOrigins.push('http://localhost:3000');
}

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  maxAge: 86400, // 24 hours
}));
```

### 4. CSRF Protection

```typescript
// ✅ Good: CSRF tokens for state-changing operations
import csrf from 'csurf';

const csrfProtection = csrf({ cookie: true });

// Generate token
app.get('/api/csrf-token', csrfProtection, (req, res) => {
  res.json({ csrfToken: req.csrfToken() });
});

// Verify token on state-changing operations
app.post('/api/test-runs', csrfProtection, createTestRun);
app.put('/api/test-runs/:id', csrfProtection, updateTestRun);
app.delete('/api/test-runs/:id', csrfProtection, deleteTestRun);
```

---

## Authentication & Authorization

### 1. Password Security

```typescript
// ✅ Good: bcrypt with high cost factor
import bcrypt from 'bcrypt';

const SALT_ROUNDS = 12; // Adjust based on hardware (10-14)

async function hashPassword(password: string): Promise<string> {
  // Enforce password requirements
  if (password.length < 12) {
    throw new Error('Password must be at least 12 characters');
  }
  
  return bcrypt.hash(password, SALT_ROUNDS);
}

async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

// Password strength validation
function isStrongPassword(password: string): boolean {
  const minLength = 12;
  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecial = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);

  return (
    password.length >= minLength &&
    hasUppercase &&
    hasLowercase &&
    hasNumber &&
    hasSpecial
  );
}
```

### 2. Multi-Factor Authentication

```typescript
// ✅ Good: TOTP-based MFA
import speakeasy from 'speakeasy';
import QRCode from 'qrcode';

// Generate MFA secret
async function generateMFASecret(userId: string, email: string) {
  const secret = speakeasy.generateSecret({
    name: `Guardian (${email})`,
    issuer: 'ODAVL Guardian',
  });

  // Generate QR code
  const qrCode = await QRCode.toDataURL(secret.otpauth_url!);

  // Store secret in database (encrypted)
  await db.user.update({
    where: { id: userId },
    data: { mfaSecret: encrypt(secret.base32) },
  });

  return { secret: secret.base32, qrCode };
}

// Verify MFA token
function verifyMFAToken(secret: string, token: string): boolean {
  return speakeasy.totp.verify({
    secret,
    encoding: 'base32',
    token,
    window: 1, // Allow 30s window
  });
}
```

### 3. Role-Based Access Control (RBAC)

```typescript
// ✅ Good: Granular permissions
enum Role {
  USER = 'user',
  ADMIN = 'admin',
  VIEWER = 'viewer',
}

enum Permission {
  // Test runs
  TEST_RUN_CREATE = 'test-run:create',
  TEST_RUN_READ = 'test-run:read',
  TEST_RUN_UPDATE = 'test-run:update',
  TEST_RUN_DELETE = 'test-run:delete',
  
  // Projects
  PROJECT_CREATE = 'project:create',
  PROJECT_READ = 'project:read',
  PROJECT_UPDATE = 'project:update',
  PROJECT_DELETE = 'project:delete',
  
  // Users
  USER_MANAGE = 'user:manage',
}

const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  [Role.USER]: [
    Permission.TEST_RUN_CREATE,
    Permission.TEST_RUN_READ,
    Permission.PROJECT_READ,
  ],
  [Role.ADMIN]: [
    ...Object.values(Permission), // All permissions
  ],
  [Role.VIEWER]: [
    Permission.TEST_RUN_READ,
    Permission.PROJECT_READ,
  ],
};

// Authorization middleware
function requirePermission(permission: Permission) {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const userPermissions = ROLE_PERMISSIONS[user.role as Role];
    if (!userPermissions.includes(permission)) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    next();
  };
}

// Usage
app.post('/api/test-runs', 
  authenticateToken,
  requirePermission(Permission.TEST_RUN_CREATE),
  createTestRun
);
```

---

## Secret Management

### 1. Environment Variables

```bash
# ✅ Good: .env.example (template)
# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=guardian
DB_USER=guardian_app
DB_PASSWORD=<CHANGE_ME>

# JWT
JWT_SECRET=<GENERATE_WITH_openssl_rand_-base64_32>
JWT_REFRESH_SECRET=<GENERATE_WITH_openssl_rand_-base64_32>

# Encryption
ENCRYPTION_KEY=<GENERATE_WITH_openssl_rand_-hex_32>

# API Keys (use vault in production)
OPENAI_API_KEY=<SECRET>
SENDGRID_API_KEY=<SECRET>

# Never commit .env with real values!
```

### 2. Azure Key Vault Integration

```typescript
// ✅ Good: Secrets from Key Vault
import { SecretClient } from '@azure/keyvault-secrets';
import { DefaultAzureCredential } from '@azure/identity';

const vaultUrl = process.env.AZURE_KEY_VAULT_URL!;
const credential = new DefaultAzureCredential();
const client = new SecretClient(vaultUrl, credential);

async function getSecret(secretName: string): Promise<string> {
  const secret = await client.getSecret(secretName);
  return secret.value!;
}

// Load secrets on startup
async function loadSecrets() {
  process.env.DB_PASSWORD = await getSecret('db-password');
  process.env.JWT_SECRET = await getSecret('jwt-secret');
  process.env.OPENAI_API_KEY = await getSecret('openai-api-key');
}
```

### 3. Secret Rotation

```bash
# Rotate secrets every 90 days
# 1. Generate new secret
openssl rand -base64 32

# 2. Update Key Vault
az keyvault secret set \
  --vault-name guardian-vault \
  --name jwt-secret \
  --value "<new-secret>"

# 3. Rolling restart (zero downtime)
kubectl rollout restart deployment/guardian-app

# 4. Revoke old secret after 24 hours
```

---

## Monitoring & Logging

### 1. Security Logging

```typescript
// ✅ Good: Comprehensive security logging
import winston from 'winston';

const securityLogger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'security.log' }),
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
  ],
});

// Log security events
function logSecurityEvent(event: {
  type: 'auth' | 'access' | 'data' | 'config';
  action: string;
  userId?: string;
  ip: string;
  success: boolean;
  details?: any;
}) {
  securityLogger.info('Security Event', event);
}

// Usage
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  
  const user = await authenticateUser(email, password);
  
  logSecurityEvent({
    type: 'auth',
    action: 'login',
    userId: user?.id,
    ip: req.ip,
    success: !!user,
    details: { email },
  });
  
  if (!user) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  
  // Issue tokens
});
```

### 2. Intrusion Detection

```typescript
// ✅ Good: Detect suspicious activity
async function detectSuspiciousActivity(req: Request) {
  const events: string[] = [];

  // 1. Multiple failed logins
  const failedLogins = await getRecentFailedLogins(req.ip);
  if (failedLogins > 5) {
    events.push('multiple_failed_logins');
  }

  // 2. Access from unusual location
  const usualCountries = await getUserUsualCountries(req.user.id);
  const currentCountry = getCountryFromIP(req.ip);
  if (!usualCountries.includes(currentCountry)) {
    events.push('unusual_location');
  }

  // 3. Unusual access patterns
  const recentRequests = await getRecentRequests(req.user.id);
  if (recentRequests > 1000) {
    events.push('excessive_requests');
  }

  // Alert if suspicious
  if (events.length > 0) {
    await alertSecurityTeam({
      userId: req.user.id,
      ip: req.ip,
      events,
      timestamp: new Date(),
    });
  }
}
```

---

## Security Checklist

### Pre-Production

- [ ] All dependencies updated to latest versions
- [ ] Vulnerability scan completed (0 critical, 0 high)
- [ ] Penetration testing completed
- [ ] Secrets scanning completed (0 secrets in code)
- [ ] Security headers configured
- [ ] Rate limiting enabled
- [ ] CSRF protection enabled
- [ ] Input validation on all endpoints
- [ ] SQL injection prevention verified
- [ ] XSS prevention verified
- [ ] Authentication & authorization tested
- [ ] MFA implemented for admin accounts
- [ ] TLS 1.2+ only (no weak ciphers)
- [ ] Database encrypted at rest
- [ ] Backups encrypted
- [ ] Secrets in Key Vault (not env files)
- [ ] Logging & monitoring configured
- [ ] Incident response plan documented
- [ ] Security training completed

### Post-Production

- [ ] Weekly vulnerability scans
- [ ] Monthly penetration tests
- [ ] Quarterly security audits
- [ ] 90-day secret rotation
- [ ] Security logs reviewed daily
- [ ] Intrusion detection monitored
- [ ] Patch management process
- [ ] Incident response drills

---

## Compliance

### GDPR Compliance

- [ ] Privacy policy published
- [ ] Data processing agreements signed
- [ ] User consent mechanisms implemented
- [ ] Right to access (data export)
- [ ] Right to deletion (account deletion)
- [ ] Data retention policies enforced
- [ ] Breach notification process (72 hours)
- [ ] Data Protection Officer appointed
- [ ] DPIA completed for high-risk processing

### SOC 2 Compliance

- [ ] Access control policies documented
- [ ] Change management process
- [ ] Incident response plan
- [ ] Risk assessment completed
- [ ] Vendor management process
- [ ] Security awareness training
- [ ] System monitoring & logging
- [ ] Business continuity plan
- [ ] Annual audit scheduled

---

## Additional Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [OWASP Cheat Sheet Series](https://cheatsheetseries.owasp.org/)
- [CIS Benchmarks](https://www.cisecurity.org/cis-benchmarks)
- [NIST Cybersecurity Framework](https://www.nist.gov/cyberframework)
- [Azure Security Best Practices](https://learn.microsoft.com/en-us/azure/security/)

---

**Last Reviewed:** Week 15 (Security Audit)  
**Next Review:** Production Launch (Week 16)  
**Owner:** Security Team  
**Approver:** CTO
