# ODAVL Studio - Security Guide

## 1. Security Architecture Overview

ODAVL Studio implements defense-in-depth security with multiple layers:

```
┌─────────────────────────────────────────┐
│  Layer 1: Input Validation              │
│  - Path traversal prevention            │
│  - Command injection prevention         │
│  - SQL injection prevention             │
└─────────────────────────────────────────┘
           ↓
┌─────────────────────────────────────────┐
│  Layer 2: Authentication & Authorization│
│  - JWT tokens (httpOnly cookies)        │
│  - RBAC (Role-Based Access Control)     │
│  - API key validation                   │
└─────────────────────────────────────────┘
           ↓
┌─────────────────────────────────────────┐
│  Layer 3: Data Protection               │
│  - Encryption at rest (AES-256)         │
│  - Encryption in transit (TLS 1.3)      │
│  - Secret management (env vars)         │
└─────────────────────────────────────────┘
           ↓
┌─────────────────────────────────────────┐
│  Layer 4: Runtime Security              │
│  - Risk Budget Guards                   │
│  - Protected paths enforcement          │
│  - Undo system (rollback capability)   │
└─────────────────────────────────────────┘
           ↓
┌─────────────────────────────────────────┐
│  Layer 5: Audit & Monitoring            │
│  - Cryptographic attestations           │
│  - Audit logs (immutable)               │
│  - Security event monitoring            │
└─────────────────────────────────────────┘
```

---

## 2. Authentication & Authorization

### 2.1 JWT Token Management

**Token Generation**

```typescript
// packages/auth/src/jwt.ts
import jwt from 'jsonwebtoken';

interface TokenPayload {
  userId: string;
  email: string;
  tier: 'FREE' | 'PRO' | 'ENTERPRISE';
}

export function generateToken(payload: TokenPayload): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error('JWT_SECRET not configured');
  
  return jwt.sign(payload, secret, {
    expiresIn: '7d',
    issuer: 'odavl.com',
    audience: 'odavl-api'
  });
}

export function verifyToken(token: string): TokenPayload {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error('JWT_SECRET not configured');
  
  try {
    return jwt.verify(token, secret, {
      issuer: 'odavl.com',
      audience: 'odavl-api'
    }) as TokenPayload;
  } catch (error) {
    throw new UnauthorizedError('Invalid or expired token');
  }
}
```

**Secure Cookie Configuration**

```typescript
// Next.js API route
import { serialize } from 'cookie';

export function setAuthCookie(token: string) {
  return serialize('auth_token', token, {
    httpOnly: true,      // Prevent XSS attacks
    secure: process.env.NODE_ENV === 'production', // HTTPS only in prod
    sameSite: 'strict',  // Prevent CSRF
    maxAge: 7 * 24 * 60 * 60, // 7 days
    path: '/'
  });
}
```

---

### 2.2 Role-Based Access Control (RBAC)

**Role Definitions**

```typescript
// packages/auth/src/rbac.ts
export enum Role {
  OWNER = 'owner',
  ADMIN = 'admin',
  DEVELOPER = 'developer',
  VIEWER = 'viewer'
}

export enum Permission {
  MANAGE_TEAM = 'manage_team',
  MANAGE_BILLING = 'manage_billing',
  MANAGE_SETTINGS = 'manage_settings',
  RUN_AUTOPILOT = 'run_autopilot',
  VIEW_ANALYTICS = 'view_analytics',
  EDIT_RECIPES = 'edit_recipes'
}

const rolePermissions: Record<Role, Permission[]> = {
  [Role.OWNER]: [
    Permission.MANAGE_TEAM,
    Permission.MANAGE_BILLING,
    Permission.MANAGE_SETTINGS,
    Permission.RUN_AUTOPILOT,
    Permission.VIEW_ANALYTICS,
    Permission.EDIT_RECIPES
  ],
  [Role.ADMIN]: [
    Permission.MANAGE_TEAM,
    Permission.MANAGE_SETTINGS,
    Permission.RUN_AUTOPILOT,
    Permission.VIEW_ANALYTICS,
    Permission.EDIT_RECIPES
  ],
  [Role.DEVELOPER]: [
    Permission.RUN_AUTOPILOT,
    Permission.VIEW_ANALYTICS
  ],
  [Role.VIEWER]: [
    Permission.VIEW_ANALYTICS
  ]
};

export function hasPermission(role: Role, permission: Permission): boolean {
  return rolePermissions[role].includes(permission);
}
```

**Permission Middleware**

```typescript
// Middleware for API routes
export function requirePermission(permission: Permission) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const user = req.user; // Set by auth middleware
    
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    if (!hasPermission(user.role, permission)) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    
    next();
  };
}

// Usage
app.post('/api/autopilot/run', 
  requirePermission(Permission.RUN_AUTOPILOT),
  async (req, res) => {
    // Only users with RUN_AUTOPILOT permission can access
  }
);
```

---

### 2.3 API Key Security

**API Key Format**

```typescript
// Format: odavl_env_randomstring
// Example: odavl_live_7f8a9b2c3d4e5f6g7h8i9j0k

export function generateApiKey(env: 'test' | 'live'): string {
  const prefix = `odavl_${env}_`;
  const random = crypto.randomBytes(32).toString('hex');
  return prefix + random;
}

export function validateApiKeyFormat(key: string): boolean {
  return /^odavl_(test|live)_[a-f0-9]{64}$/.test(key);
}
```

**API Key Storage**

```typescript
// Store only hashed keys in database
import bcrypt from 'bcrypt';

export async function createApiKey(userId: string): Promise<string> {
  const key = generateApiKey('live');
  const hash = await bcrypt.hash(key, 12);
  
  await prisma.apiKey.create({
    data: {
      userId,
      keyHash: hash,
      lastUsed: new Date(),
      createdAt: new Date()
    }
  });
  
  // Return plain key only once
  return key;
}

export async function verifyApiKey(key: string): Promise<User | null> {
  const apiKeys = await prisma.apiKey.findMany({
    where: { revoked: false },
    include: { user: true }
  });
  
  for (const apiKey of apiKeys) {
    const valid = await bcrypt.compare(key, apiKey.keyHash);
    if (valid) {
      // Update last used timestamp
      await prisma.apiKey.update({
        where: { id: apiKey.id },
        data: { lastUsed: new Date() }
      });
      
      return apiKey.user;
    }
  }
  
  return null;
}
```

---

## 3. Input Validation & Sanitization

### 3.1 Path Traversal Prevention

```typescript
// packages/core/src/security/path-validator.ts
import path from 'path';

export function validatePath(filePath: string, baseDir: string): void {
  const normalized = path.normalize(filePath);
  const resolved = path.resolve(baseDir, normalized);
  
  // Ensure path is within baseDir
  if (!resolved.startsWith(path.resolve(baseDir))) {
    throw new SecurityError(
      'Path traversal detected',
      'PATH_TRAVERSAL',
      { path: filePath }
    );
  }
  
  // Prevent access to protected paths
  const protectedPaths = [
    '.git',
    'node_modules/.bin',
    '.env',
    '.odavl/attestation'
  ];
  
  const relativePath = path.relative(baseDir, resolved);
  for (const protected of protectedPaths) {
    if (relativePath.startsWith(protected)) {
      throw new SecurityError(
        `Access to ${protected} is forbidden`,
        'PROTECTED_PATH'
      );
    }
  }
}

// Usage
try {
  validatePath(userInputPath, workspaceRoot);
  const content = await fs.readFile(userInputPath, 'utf-8');
} catch (error) {
  if (error instanceof SecurityError) {
    console.error('Security violation:', error.message);
  }
}
```

---

### 3.2 Command Injection Prevention

```typescript
// ❌ DANGEROUS: Never pass user input directly to shell
function analyzeFile(filename: string) {
  execSync(`eslint ${filename}`); // VULNERABLE!
}

// ✅ SAFE: Use parameterized commands
import { execFile } from 'child_process';
import { promisify } from 'util';

const execFileAsync = promisify(execFile);

async function analyzeFile(filename: string) {
  // Validate filename first
  if (!/^[\w\-./]+$/.test(filename)) {
    throw new SecurityError('Invalid filename');
  }
  
  // Use execFile instead of exec (no shell expansion)
  const { stdout } = await execFileAsync('eslint', [
    '--format', 'json',
    '--',
    filename
  ]);
  
  return JSON.parse(stdout);
}
```

---

### 3.3 SQL Injection Prevention

```typescript
// ✅ SAFE: Use Prisma (ORM with parameterized queries)
async function findUserByEmail(email: string) {
  return prisma.user.findUnique({
    where: { email } // Automatically parameterized
  });
}

// ✅ SAFE: Use parameterized queries with raw SQL
async function searchUsers(query: string) {
  return prisma.$queryRaw`
    SELECT * FROM users 
    WHERE name ILIKE ${`%${query}%`}
  `;
}

// ❌ DANGEROUS: String concatenation
async function searchUsers(query: string) {
  return prisma.$queryRawUnsafe(
    `SELECT * FROM users WHERE name ILIKE '%${query}%'`
  ); // VULNERABLE!
}
```

---

## 4. Secret Management

### 4.1 Environment Variables

**Configuration**

```bash
# .env (never commit to git)
JWT_SECRET=your-256-bit-secret-here
DATABASE_URL=postgresql://user:pass@localhost:5432/odavl
STRIPE_SECRET_KEY=sk_live_...
GITHUB_CLIENT_SECRET=...

# .env.example (commit this)
JWT_SECRET=your-jwt-secret-here
DATABASE_URL=postgresql://localhost:5432/odavl
STRIPE_SECRET_KEY=sk_test_...
GITHUB_CLIENT_SECRET=your-github-secret
```

**Loading & Validation**

```typescript
// config/env.ts
import { z } from 'zod';

const envSchema = z.object({
  JWT_SECRET: z.string().min(32),
  DATABASE_URL: z.string().url(),
  STRIPE_SECRET_KEY: z.string().startsWith('sk_'),
  GITHUB_CLIENT_SECRET: z.string().min(20)
});

export function loadEnv() {
  const result = envSchema.safeParse(process.env);
  
  if (!result.success) {
    console.error('Invalid environment variables:');
    console.error(result.error.format());
    process.exit(1);
  }
  
  return result.data;
}

// Usage
const env = loadEnv();
const token = jwt.sign(payload, env.JWT_SECRET);
```

---

### 4.2 Secret Rotation

```typescript
// Support multiple valid secrets during rotation
interface SecretConfig {
  current: string;
  previous?: string;
}

export function verifyTokenWithRotation(
  token: string, 
  secrets: SecretConfig
): TokenPayload {
  // Try current secret first
  try {
    return jwt.verify(token, secrets.current) as TokenPayload;
  } catch (error) {
    // If current fails and previous exists, try previous
    if (secrets.previous) {
      try {
        return jwt.verify(token, secrets.previous) as TokenPayload;
      } catch {
        throw new UnauthorizedError('Invalid token');
      }
    }
    throw new UnauthorizedError('Invalid token');
  }
}

// Rotation process:
// 1. Generate new secret
// 2. Set as CURRENT, move old to PREVIOUS
// 3. Deploy with both secrets active
// 4. Wait for all tokens to expire/refresh
// 5. Remove PREVIOUS secret
```

---

## 5. Data Protection

### 5.1 Encryption at Rest

```typescript
// packages/core/src/crypto/encryption.ts
import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const KEY_LENGTH = 32;
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;

export function encrypt(plaintext: string, key: Buffer): string {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  
  let encrypted = cipher.update(plaintext, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  const authTag = cipher.getAuthTag();
  
  // Format: iv:authTag:ciphertext
  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
}

export function decrypt(ciphertext: string, key: Buffer): string {
  const [ivHex, authTagHex, encrypted] = ciphertext.split(':');
  
  const iv = Buffer.from(ivHex, 'hex');
  const authTag = Buffer.from(authTagHex, 'hex');
  
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);
  
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  
  return decrypted;
}

// Usage: Encrypt sensitive data before storing
const encryptionKey = crypto.scryptSync(
  process.env.ENCRYPTION_KEY!, 
  'salt', 
  32
);

const apiKey = 'user-api-key';
const encrypted = encrypt(apiKey, encryptionKey);

await prisma.user.update({
  where: { id: userId },
  data: { apiKeyEncrypted: encrypted }
});
```

---

### 5.2 Encryption in Transit (TLS)

**Next.js Production Config**

```javascript
// next.config.js
module.exports = {
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY'
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block'
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin'
          }
        ]
      }
    ];
  }
};
```

---

### 5.3 Sensitive Data Handling

```typescript
// ❌ BAD: Log sensitive data
console.log('User login:', { email, password }); // NEVER!

// ✅ GOOD: Mask sensitive data
console.log('User login:', { 
  email, 
  password: '***' 
});

// ✅ GOOD: Redact from error messages
class SafeError extends Error {
  constructor(message: string, public context?: any) {
    super(message);
    
    // Remove sensitive fields
    if (context) {
      delete context.password;
      delete context.apiKey;
      delete context.token;
    }
  }
}

// ✅ GOOD: Clear sensitive data after use
function processPayment(cardNumber: string) {
  try {
    // Process payment
    return stripe.charge({ card: cardNumber });
  } finally {
    // Clear from memory
    cardNumber = '';
  }
}
```

---

## 6. Autopilot Security

### 6.1 Risk Budget Guard

```typescript
// odavl-studio/autopilot/engine/src/policies/risk-budget-guard.ts
import micromatch from 'micromatch';

export class RiskBudgetGuard {
  constructor(private config: RiskConfig) {}
  
  validate(changes: FileChange[]): ValidationResult {
    const errors: string[] = [];
    
    // Check file count
    if (changes.length > this.config.maxFilesPerCycle) {
      errors.push(
        `Exceeds max files: ${changes.length}/${this.config.maxFilesPerCycle}`
      );
    }
    
    // Check LOC per file
    for (const change of changes) {
      if (change.linesChanged > this.config.maxLOCPerFile) {
        errors.push(
          `${change.path}: ${change.linesChanged} lines exceeds limit of ${this.config.maxLOCPerFile}`
        );
      }
    }
    
    // Check protected paths
    const protectedGlobs = this.config.protectedPaths;
    const violations = changes.filter(change =>
      protectedGlobs.some(glob => micromatch.isMatch(change.path, glob))
    );
    
    if (violations.length > 0) {
      errors.push(
        `Protected paths: ${violations.map(v => v.path).join(', ')}`
      );
    }
    
    return {
      valid: errors.length === 0,
      errors
    };
  }
}

// Usage in act phase
const guard = new RiskBudgetGuard({
  maxFilesPerCycle: 10,
  maxLOCPerFile: 40,
  protectedPaths: [
    'security/**',
    'auth/**',
    '**/*.spec.*',
    'public-api/**'
  ]
});

const validation = guard.validate(plannedChanges);
if (!validation.valid) {
  throw new SecurityError(
    'Risk budget exceeded',
    'RISK_BUDGET_VIOLATION',
    { errors: validation.errors }
  );
}
```

---

### 6.2 Undo System Security

```typescript
// Cryptographic verification of snapshots
interface Snapshot {
  timestamp: string;
  files: Record<string, string>;
  checksum: string; // SHA-256 of entire snapshot
}

export function createSnapshot(files: Record<string, string>): Snapshot {
  const snapshot: Snapshot = {
    timestamp: new Date().toISOString(),
    files,
    checksum: ''
  };
  
  // Calculate checksum
  const content = JSON.stringify({ 
    timestamp: snapshot.timestamp, 
    files: snapshot.files 
  });
  snapshot.checksum = crypto
    .createHash('sha256')
    .update(content)
    .digest('hex');
  
  return snapshot;
}

export function verifySnapshot(snapshot: Snapshot): boolean {
  const { checksum, ...data } = snapshot;
  const expectedChecksum = crypto
    .createHash('sha256')
    .update(JSON.stringify(data))
    .digest('hex');
  
  return checksum === expectedChecksum;
}

// Before rollback, verify integrity
export async function rollback(snapshotPath: string): Promise<void> {
  const snapshot: Snapshot = JSON.parse(
    await fs.readFile(snapshotPath, 'utf-8')
  );
  
  if (!verifySnapshot(snapshot)) {
    throw new SecurityError('Snapshot integrity check failed');
  }
  
  // Proceed with rollback
  for (const [path, content] of Object.entries(snapshot.files)) {
    await fs.writeFile(path, content);
  }
}
```

---

### 6.3 Attestation Chain Security

```typescript
// Immutable audit trail with cryptographic proofs
interface Attestation {
  runId: string;
  timestamp: string;
  recipe: string;
  deltas: Metrics;
  gatesPassed: boolean;
  previousHash?: string; // Chain to previous attestation
  signature: string;      // SHA-256 of this attestation
}

export function createAttestation(
  data: Omit<Attestation, 'signature'>,
  previousAttestation?: Attestation
): Attestation {
  const attestation: Attestation = {
    ...data,
    previousHash: previousAttestation?.signature,
    signature: ''
  };
  
  // Calculate signature
  const { signature, ...content } = attestation;
  attestation.signature = crypto
    .createHash('sha256')
    .update(JSON.stringify(content))
    .digest('hex');
  
  return attestation;
}

// Verify attestation chain
export function verifyAttestationChain(
  attestations: Attestation[]
): boolean {
  for (let i = 0; i < attestations.length; i++) {
    const attestation = attestations[i];
    
    // Verify signature
    const { signature, ...content } = attestation;
    const expectedSignature = crypto
      .createHash('sha256')
      .update(JSON.stringify(content))
      .digest('hex');
    
    if (signature !== expectedSignature) {
      console.error(`Attestation ${i} signature invalid`);
      return false;
    }
    
    // Verify chain
    if (i > 0) {
      const previous = attestations[i - 1];
      if (attestation.previousHash !== previous.signature) {
        console.error(`Attestation ${i} chain broken`);
        return false;
      }
    }
  }
  
  return true;
}
```

---

## 7. Dependency Security

### 7.1 Automated Scanning

```bash
# pnpm audit (built-in)
pnpm audit
pnpm audit --fix

# Snyk (comprehensive)
npm install -g snyk
snyk auth
snyk test
snyk monitor # Continuous monitoring

# GitHub Dependabot (automated PRs)
# .github/dependabot.yml
version: 2
updates:
  - package-ecosystem: "npm"
    directory: "/"
    schedule:
      interval: "weekly"
    open-pull-requests-limit: 10
```

---

### 7.2 Supply Chain Security

```json
// package.json - Lock dependencies to exact versions
{
  "dependencies": {
    "typescript": "5.3.3",      // Not: ^5.3.3
    "@odavl/types": "1.0.0"     // Not: ~1.0.0
  }
}
```

**Verify Package Integrity**

```bash
# Check package checksums
pnpm install --frozen-lockfile

# Verify signatures (when available)
npm audit signatures
```

---

## 8. Security Headers

### 8.1 Next.js Security Headers

```typescript
// next.config.js
const securityHeaders = [
  {
    key: 'X-DNS-Prefetch-Control',
    value: 'on'
  },
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload'
  },
  {
    key: 'X-Frame-Options',
    value: 'SAMEORIGIN'
  },
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff'
  },
  {
    key: 'X-XSS-Protection',
    value: '1; mode=block'
  },
  {
    key: 'Referrer-Policy',
    value: 'origin-when-cross-origin'
  },
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=()'
  }
];

module.exports = {
  async headers() {
    return [
      {
        source: '/:path*',
        headers: securityHeaders
      }
    ];
  }
};
```

---

## 9. Incident Response

### 9.1 Security Event Detection

```typescript
// Monitor for suspicious activity
interface SecurityEvent {
  type: 'AUTH_FAILURE' | 'RATE_LIMIT' | 'INVALID_TOKEN' | 'PATH_TRAVERSAL';
  userId?: string;
  ip: string;
  timestamp: Date;
  details: any;
}

export async function logSecurityEvent(event: SecurityEvent): Promise<void> {
  await prisma.securityEvent.create({ data: event });
  
  // Alert if threshold exceeded
  const recentEvents = await prisma.securityEvent.count({
    where: {
      type: event.type,
      ip: event.ip,
      timestamp: { gte: new Date(Date.now() - 60000) } // Last minute
    }
  });
  
  if (recentEvents > 10) {
    await alertSecurityTeam({
      severity: 'high',
      message: `${event.type} threshold exceeded`,
      ip: event.ip,
      count: recentEvents
    });
  }
}
```

---

### 9.2 Breach Response Checklist

**If security incident detected:**

1. **Immediate Actions** (0-1 hour)
   - [ ] Revoke compromised credentials
   - [ ] Disable affected accounts
   - [ ] Enable additional logging
   - [ ] Notify security team

2. **Investigation** (1-24 hours)
   - [ ] Review audit logs
   - [ ] Identify attack vector
   - [ ] Assess data exposure
   - [ ] Document timeline

3. **Containment** (1-48 hours)
   - [ ] Patch vulnerability
   - [ ] Deploy security fixes
   - [ ] Reset affected secrets
   - [ ] Monitor for reoccurrence

4. **Communication** (24-72 hours)
   - [ ] Notify affected users
   - [ ] Public disclosure (if required)
   - [ ] Regulatory reporting
   - [ ] Post-mortem document

---

## 10. Compliance & Standards

### 10.1 GDPR Compliance

```typescript
// Right to data export
export async function exportUserData(userId: string): Promise<UserData> {
  return {
    profile: await prisma.user.findUnique({ where: { id: userId } }),
    projects: await prisma.project.findMany({ where: { userId } }),
    analyses: await prisma.analysis.findMany({ where: { userId } }),
    auditLogs: await prisma.auditLog.findMany({ where: { userId } })
  };
}

// Right to deletion
export async function deleteUserData(userId: string): Promise<void> {
  await prisma.$transaction([
    prisma.analysis.deleteMany({ where: { userId } }),
    prisma.project.deleteMany({ where: { userId } }),
    prisma.subscription.delete({ where: { userId } }),
    prisma.user.delete({ where: { id: userId } })
  ]);
}
```

---

### 10.2 SOC 2 Preparation

**Required Controls:**

- Access control (RBAC implemented ✅)
- Encryption (at rest & in transit ✅)
- Logging (audit trail ✅)
- Monitoring (Sentry + DataDog ✅)
- Incident response (documented ✅)
- Business continuity (backups ✅)

---

## Security Checklist

**Before Every Release:**
- [ ] Dependency audit clean (pnpm audit)
- [ ] Security headers configured
- [ ] Secrets not in code
- [ ] Input validation implemented
- [ ] Authentication tested
- [ ] Authorization tested
- [ ] Encryption verified
- [ ] Audit logs working
- [ ] Incident response plan ready

**Monthly:**
- [ ] Review security events
- [ ] Rotate secrets
- [ ] Update dependencies
- [ ] Penetration test (if budget allows)
- [ ] Security training for team

---

**Version**: ODAVL Studio v2.0  
**Last Updated**: November 23, 2025  
**Word Count**: ~3,800 words

For security concerns, email: security@odavl.com
