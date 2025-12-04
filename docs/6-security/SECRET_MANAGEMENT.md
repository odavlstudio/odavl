# Secret Management Guide

**Version:** 1.0.0  
**Last Updated:** 2025-01-09  
**Status:** ✅ Production-Ready

---

## Overview

This guide documents ODAVL's secret management practices, ensuring zero credential leaks, secure rotation, and compliance with security best practices.

---

## 1. Environment Variable Protection

### ✅ Current Status

| Security Control | Status | Evidence |
|-----------------|--------|----------|
| `.env` in `.gitignore` | ✅ Protected | Line 13 of `.gitignore` |
| `.env` not tracked in git | ✅ Verified | `git ls-files` shows no `.env` |
| Git history clean | ✅ No leaks | Scanned with `git log -p --all -- .env` |
| `.env.example` templates | ✅ Present | Root, Guardian, Insight Cloud |

### Protected Files

```bash
# Never committed (protected by .gitignore)
.env
.env.local
apps/guardian/.env
apps/insight-cloud/.env
apps/odavl-website-v2/.env
```

### Template Files (Committed)

```bash
# Safe to commit (placeholder values only)
.env.example
apps/guardian/.env.example
apps/guardian/.env.redis.example
apps/insight-cloud/.env.example
config/.env.example
```

---

## 2. Secret Categories

### 🔴 Critical Secrets (Never Commit)

1. **Database Credentials**

   ```bash
   DATABASE_URL=postgresql://USER:PASSWORD@HOST:PORT/DB
   ```

2. **API Keys & Tokens**

   ```bash
   NEXTAUTH_SECRET=<64-char-random-string>
   SENTRY_AUTH_TOKEN=<sentry-token>
   SLACK_WEBHOOK_URL=<slack-url>
   ```

3. **External Service Keys**

   ```bash
   SMTP_USER=<email>
   SMTP_PASS=<password>
   ALERT_WEBHOOK_SECRET=<webhook-secret>
   ```

4. **Redis Credentials**

   ```bash
   REDIS_URL=redis://:PASSWORD@HOST:PORT
   REDIS_PASSWORD=<redis-password>
   ```

### 🟠 Configuration (Safe to Expose in .env.example)

```bash
NODE_ENV=development
LOG_LEVEL=info
ENABLE_TRACING=false
SLOW_QUERY_THRESHOLD=100
```

---

## 3. Setup Workflow

### For New Developers

1. **Clone Repository**

   ```bash
   git clone https://github.com/your-org/odavl.git
   cd odavl
   ```

2. **Copy Template Files**

   ```bash
   # Root environment
   cp config/.env.example .env
   
   # Guardian app
   cp apps/guardian/.env.example apps/guardian/.env
   
   # Insight Cloud
   cp apps/insight-cloud/.env.example apps/insight-cloud/.env
   ```

3. **Fill in Real Values**

   ```bash
   # Edit .env files (never commit these!)
   # Replace all placeholder values:
   # - DATABASE_URL: Get from local PostgreSQL setup
   # - NEXTAUTH_SECRET: Generate with `openssl rand -base64 32`
   # - REDIS_URL: Get from local Redis setup
   ```

4. **Verify Protection**

   ```bash
   # Ensure .env is ignored
   git status | grep -v ".env"
   
   # If .env appears, run:
   git reset HEAD .env
   git checkout -- .env
   ```

---

## 4. Secret Rotation Process

### When to Rotate

- ✅ **Immediately:** If credentials leaked to git/logs/Slack
- ✅ **Quarterly:** API keys, webhook secrets (every 90 days)
- ✅ **Annually:** Database passwords (every 365 days)
- ✅ **On Departure:** When team member leaves

### Rotation Checklist

**1. Database Password Rotation**

```sql
-- PostgreSQL
ALTER USER odavl_user WITH PASSWORD 'NEW_PASSWORD';
```

```bash
# Update .env files
DATABASE_URL=postgresql://odavl_user:NEW_PASSWORD@...
```

**2. API Key Rotation**

```bash
# Sentry
# 1. Generate new token at: https://sentry.io/settings/account/api/auth-tokens/
# 2. Update .env: SENTRY_AUTH_TOKEN=<new-token>
# 3. Revoke old token

# Slack Webhook
# 1. Generate new webhook at: https://api.slack.com/apps
# 2. Update .env: SLACK_WEBHOOK_URL=<new-url>
# 3. Delete old webhook
```

**3. NEXTAUTH_SECRET Rotation**

```bash
# Generate new secret
openssl rand -base64 32

# Update .env
NEXTAUTH_SECRET=<new-secret>

# Restart app (forces all users to re-login)
pnpm --filter @odavl/guardian dev
```

**4. Redis Password Rotation**

```bash
# Redis CLI
CONFIG SET requirepass "NEW_PASSWORD"
CONFIG REWRITE

# Update .env
REDIS_PASSWORD=NEW_PASSWORD
REDIS_URL=redis://:NEW_PASSWORD@localhost:6379
```

---

## 5. Leak Detection & Response

### Automated Scanning

```bash
# Gitleaks scan (runs in CI)
pnpm run security:scan

# Manual scan
gitleaks detect --source . --verbose --report-path gitleaks-report.json
```

### If Leak Detected

**🔴 IMMEDIATE ACTIONS (Within 1 Hour):**

1. **Revoke Compromised Credentials**

   ```bash
   # Example: Sentry token leaked
   # 1. Go to Sentry → Settings → Auth Tokens
   # 2. Click "Revoke" on leaked token
   # 3. Generate new token
   ```

2. **Rotate All Related Secrets**

   ```bash
   # If DATABASE_URL leaked, rotate:
   # - Database password
   # - Prisma connection string
   # - Any app using that database
   ```

3. **Remove from Git History**

   ```bash
   # Use BFG Repo-Cleaner
   java -jar bfg.jar --delete-files .env
   git reflog expire --expire=now --all
   git gc --prune=now --aggressive
   
   # Force push (coordinate with team)
   git push origin --force --all
   ```

**📝 FOLLOW-UP (Within 24 Hours):**

1. **Incident Report**
   - Document what leaked, when, how
   - Record all rotation actions taken
   - Store in `.odavl/security/incidents/`

2. **Notify Affected Services**
   - Sentry, Slack, external APIs
   - Check for unauthorized access

3. **Review Detection Process**
   - Why did leak happen?
   - How to prevent in future?
   - Update `.gitignore` if needed

---

## 6. CI/CD Secret Management

### GitHub Actions Secrets

```yaml
# .github/workflows/deploy.yml
env:
  DATABASE_URL: ${{ secrets.DATABASE_URL }}
  NEXTAUTH_SECRET: ${{ secrets.NEXTAUTH_SECRET }}
  SENTRY_AUTH_TOKEN: ${{ secrets.SENTRY_AUTH_TOKEN }}
```

**How to Add Secrets:**

1. Go to: `https://github.com/your-org/odavl/settings/secrets/actions`
2. Click "New repository secret"
3. Name: `DATABASE_URL`, Value: `postgresql://...`
4. Click "Add secret"

### Vercel Environment Variables

```bash
# Add via Vercel CLI
vercel env add DATABASE_URL production

# Or via Vercel Dashboard:
# 1. Go to: https://vercel.com/your-org/odavl/settings/environment-variables
# 2. Click "Add New"
# 3. Name: DATABASE_URL, Value: postgresql://...
# 4. Environment: Production
```

---

## 7. Secret Generation Best Practices

### Strong Random Secrets

```bash
# Generate 32-byte base64 secret (recommended for NEXTAUTH_SECRET)
openssl rand -base64 32

# Generate 64-byte hex secret (for webhook secrets)
openssl rand -hex 64

# Generate UUID (for API keys)
uuidgen

# Generate PostgreSQL password (alphanumeric + special chars)
openssl rand -base64 32 | tr -d "=+/" | cut -c1-32
```

### Password Requirements

| Secret Type | Min Length | Character Requirements |
|------------|-----------|----------------------|
| Database password | 32 chars | Alphanumeric + special |
| NEXTAUTH_SECRET | 32 chars | Base64 encoded |
| Webhook secret | 64 chars | Hex encoded |
| API key | 32 chars | UUID or base64 |

---

## 8. Audit Trail

### Secret Access Logs

```bash
# Track who accessed secrets (for compliance)
# Logs stored in: .odavl/security/secret-access.log

# Format:
# 2025-01-09T14:30:00Z | USER | READ | DATABASE_URL | apps/guardian/.env
```

### Rotation History

```bash
# Track all rotations (for compliance)
# Logs stored in: .odavl/security/rotation-history.log

# Format:
# 2025-01-09T14:30:00Z | DATABASE_URL | ROTATED | apps/guardian/.env | Quarterly rotation
```

---

## 9. Compliance Checklist

### ✅ GDPR Requirements (Article 32 - Security)

- [x] Secrets encrypted at rest (encrypted .env files in production)
- [x] Access control (CI secrets restricted to maintainers)
- [x] Regular rotation (quarterly for API keys, annually for DB)
- [x] Incident response plan (documented above)

### ✅ SOC 2 Requirements (CC6.1 - Logical Access)

- [x] Unique secrets per environment (dev/staging/prod)
- [x] Audit trail of secret changes (rotation-history.log)
- [x] Automated leak detection (Gitleaks in CI)
- [x] Revocation process (documented above)

---

## 10. Testing Secret Management

### Verify .env Protection

```bash
# Test 1: .env not in git
git ls-files | grep ".env$"
# Expected: No output

# Test 2: .env ignored
echo "TEST_SECRET=leak" >> .env
git status | grep ".env"
# Expected: No output (ignored)

# Test 3: Clean history
git log -p --all -- .env | grep -i "password\|secret\|key"
# Expected: No output
```

### Verify .env.example Safety

```bash
# Test 4: No real secrets in examples
grep -r "sk-\|ghp_\|xoxb-" **/.env.example
# Expected: No output (no real tokens)

# Test 5: All examples have placeholders
grep -r "changeme\|your-\|example\|localhost" **/.env.example
# Expected: Multiple matches (safe placeholders)
```

---

## 11. Reference Commands

```bash
# List all .env files (including hidden)
Get-ChildItem -Path . -Filter ".env*" -File -Force -Recurse | Select-Object FullName

# Check git tracking status
git ls-files | Select-String -Pattern "\.env"

# Scan git history for secrets
git log -p --all -- .env | Select-String -Pattern "SECRET|PASSWORD|KEY"

# Verify .gitignore
cat .gitignore | Select-String -Pattern "^\.env"

# Generate new NEXTAUTH_SECRET
openssl rand -base64 32

# Test Gitleaks
pnpm run security:scan
```

---

## 12. Emergency Contacts

**If you discover a secret leak:**

1. **Immediate:** Rotate credentials (see Section 4)
2. **Notify:** Security team via Slack `#security-incidents`
3. **Document:** Create incident report in `.odavl/security/incidents/`
4. **Escalate:** Email <security@odavl.com> if external breach suspected

---

## Status Report

**✅ All Security Controls Verified:**

| Control | Status | Last Verified |
|---------|--------|--------------|
| .env in .gitignore | ✅ Protected | 2025-01-09 |
| .env not in git | ✅ Verified | 2025-01-09 |
| Git history clean | ✅ No leaks | 2025-01-09 |
| .env.example present | ✅ Complete | 2025-01-09 |
| Gitleaks scan | ✅ No issues | 2025-01-09 |
| Rotation schedule | ✅ Documented | 2025-01-09 |

**Next Actions:**

- Set quarterly calendar reminder for API key rotation (April 9, 2025)
- Schedule annual DB password rotation (January 9, 2026)
- Review incident response plan with team (Q1 2025)

---

**Document Owner:** ODAVL Security Team  
**Review Cycle:** Quarterly  
**Next Review:** April 9, 2025
