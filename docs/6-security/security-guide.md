# ODAVL Studio - Security Procedures

## 🔒 Security Overview

ODAVL Studio implements multi-layer security measures to protect credentials, prevent data leaks, and ensure safe autonomous code operations.

## Critical Security Measures

### 1. Git History Protection

**Status**: ✅ Implemented (Nov 22, 2024)

**Protections**:
- All `.env` files removed from Git history (185 commits cleaned)
- Full backup created at `../odavl-backup-20251122-100117.git`
- `.gitignore` updated with comprehensive env patterns

**Tools**:
- `git-filter-repo` (installed at `tools/git-secrets/`)
- Pre-commit hooks (`.pre-commit-config.yaml`)

### 2. Pre-Commit Hooks

**Status**: ✅ Active

Pre-commit hooks automatically run before every commit to prevent:
- Commits of files larger than 500KB
- Private key exposure (RSA, SSH, PEM)
- Merge conflict markers
- Invalid JSON/YAML syntax

**Manual Testing**:
```bash
# Test hooks before commit
pre-commit run --all-files

# Update hooks
pre-commit autoupdate
```

### 3. Environment Variables

**Status**: ✅ Template created

**Rules**:
1. **NEVER** commit real `.env` files
2. Always use `.env.example` with placeholder values
3. All sensitive variables must use placeholders like `your-secret-here`

**Required Environment Variables**:
```env
AUTH_SECRET=              # Min 64 chars, alphanumeric
DATABASE_URL=             # PostgreSQL connection string
GITHUB_CLIENT_ID=         # GitHub OAuth App ID
GITHUB_CLIENT_SECRET=     # GitHub OAuth Secret
GA_TRACKING_ID=           # Google Analytics (optional)
MIXPANEL_TOKEN=           # Mixpanel Analytics (optional)
PLAUSIBLE_DOMAIN=         # Plausible Analytics (optional)
```

### 4. Credential Rotation Procedure

**When to Rotate**:
- ✅ Immediately: After `.env` leak detected (Nov 22, 2024)
- Every 90 days (quarterly)
- After team member departure
- After security incident

**Rotation Checklist**:

#### A. AUTH_SECRET (NextAuth.js)
```bash
# Generate new 64-char secret
$newSecret = -join ((48..57) + (65..90) + (97..122) | Get-Random -Count 64 | ForEach-Object {[char]$_})

# Update all .env files:
# - odavl-studio/insight/cloud/.env
# - odavl-studio/guardian/app/.env
# - Root .env
```

#### B. DATABASE_URL (PostgreSQL)
```sql
-- Connect as superuser
psql -U postgres

-- Rotate password
ALTER USER odavl_user WITH PASSWORD 'new_secure_password_here';

-- Update .env files with new connection string
DATABASE_URL=postgresql://odavl_user:new_secure_password_here@localhost:5432/odavl
```

#### C. GITHUB_CLIENT_SECRET (OAuth)
1. Go to https://github.com/settings/developers
2. Select "ODAVL Studio" OAuth App
3. Click "Generate a new client secret"
4. Copy new secret to all `.env` files

#### D. Analytics Tokens
- **Google Analytics**: https://analytics.google.com/analytics/web/ → Admin → Tracking Info
- **Mixpanel**: https://mixpanel.com/settings/project → Project Settings → Project Token
- **Plausible**: https://plausible.io/settings → Domain → Embed code

### 5. Protected Paths (Risk Budget Guard)

**Status**: ✅ Enforced in Autopilot Engine

The following paths are **NEVER** auto-modified by ODAVL Autopilot:

```yaml
protected_paths:
  - security/**              # Security configurations
  - auth/**                  # Authentication logic
  - **/*.spec.*              # Test files
  - **/*.test.*              # Test files
  - public-api/**            # Public API contracts
  - .env*                    # Environment files (except .env.example)
  - package.json             # Dependency manifest
  - pnpm-lock.yaml           # Lock file
```

**Override**: Manual review required for changes to protected paths

### 6. Backup & Recovery

**Full Backup Location**: `../odavl-backup-20251122-100117.git`

**Restore Procedure** (if git-filter-repo causes issues):
```bash
# 1. Remove corrupted repo
cd ..
Remove-Item -Path "odavl" -Recurse -Force

# 2. Restore from backup
git clone odavl-backup-20251122-100117.git odavl

# 3. Verify restoration
cd odavl
git log --oneline -10
git status
```

**Undo Snapshots**: `.odavl/undo/` directory contains timestamped file snapshots before Autopilot edits

### 7. Security Scanning Tools

#### Git-Secrets (Local)
```bash
# Location: tools/git-secrets/

# Scan specific file
.\tools\git-secrets\git-secrets --scan path/to/file

# Scan entire repo
.\tools\git-secrets\git-secrets --scan-history

# Add custom pattern
.\tools\git-secrets\git-secrets --add 'YOUR_PATTERN_HERE'
```

#### Pre-Commit (Automated)
```bash
# Install hooks (one-time)
pre-commit install

# Run manually
pre-commit run --all-files

# Update to latest hook versions
pre-commit autoupdate
```

### 8. Incident Response

**If Credentials Leaked**:

1. **Immediate Actions** (within 1 hour):
   - [ ] Rotate all affected credentials (see Section 4)
   - [ ] Review access logs (GitHub, database, analytics)
   - [ ] Remove from Git history (use git-filter-repo)
   - [ ] Force push cleaned history: `git push --force --all`

2. **Investigation** (within 24 hours):
   - [ ] Identify how leak occurred (commit review)
   - [ ] Check for unauthorized access (logs, IP addresses)
   - [ ] Document incident in `.odavl/audit/incident-YYYYMMDD.md`

3. **Prevention** (within 1 week):
   - [ ] Update `.gitignore` patterns
   - [ ] Add new detection patterns to git-secrets
   - [ ] Team training on security procedures
   - [ ] Review and update this document

### 9. Compliance & Audit

**Audit Trail**: `.odavl/audit/` directory
- `incident-*.md` - Security incident reports
- `rotation-*.md` - Credential rotation logs
- `access-*.log` - Access attempt logs

**Quarterly Security Review Checklist**:
- [ ] Rotate all credentials (Section 4)
- [ ] Review `.gitignore` coverage
- [ ] Update pre-commit hooks: `pre-commit autoupdate`
- [ ] Scan Git history: `.\tools\git-secrets\git-secrets --scan-history`
- [ ] Review access logs (GitHub, database, analytics)
- [ ] Update team on security procedures

### 10. Contact & Reporting

**Security Issues**: If you discover a security vulnerability:

1. **DO NOT** create a public GitHub issue
2. **DO** email: security@odavl.studio (if available)
3. **DO** include:
   - Description of vulnerability
   - Steps to reproduce
   - Potential impact
   - Suggested fix (if any)

**Response Time**: 
- Critical issues: 24 hours
- High severity: 72 hours
- Medium/Low: 1 week

---

## Quick Reference

### Essential Commands

```bash
# Before commit (automated via pre-commit hooks)
pre-commit run --all-files

# Generate new AUTH_SECRET
-join ((48..57) + (65..90) + (97..122) | Get-Random -Count 64 | ForEach-Object {[char]$_})

# Check for secrets in specific file
.\tools\git-secrets\git-secrets --scan path/to/file

# Restore from backup (emergency only)
git clone ../odavl-backup-20251122-100117.git odavl-restored
```

### Files to Monitor

- `.env*` (except `.env.example`)
- `config/*.secret.*`
- `auth/**`
- `security/**`
- `.odavl/undo/` (undo snapshots)
- `.odavl/audit/` (audit trail)

---

**Last Updated**: November 22, 2024  
**Next Review**: February 22, 2025 (90 days)  
**Version**: 1.0.0
