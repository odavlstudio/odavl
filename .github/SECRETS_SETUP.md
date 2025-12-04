# 🔐 GitHub Secrets Configuration Guide

This document lists all required secrets for ODAVL Studio v2.0 GitHub Actions workflows.

## 📋 Quick Setup Checklist

```bash
# Repository Settings → Secrets → Actions → New repository secret
# Add each secret below with appropriate values
```

---

## 🚀 Deployment Secrets

### Vercel Integration
Required for: `deploy-production.yml`, `deploy-staging.yml`, `rollback.yml`

| Secret Name | Description | How to Get |
|------------|-------------|------------|
| `VERCEL_TOKEN` | Vercel API token | [Vercel Settings → Tokens](https://vercel.com/account/tokens) → Create new token |
| `VERCEL_ORG_ID` | Organization ID | `vercel whoami` or Vercel dashboard URL |
| `VERCEL_PROJECT_ID` | Project ID | Project Settings → General → Project ID |

**Setup Command:**
```bash
# Install Vercel CLI
pnpm add -g vercel

# Login and get IDs
vercel login
vercel whoami  # Shows ORG_ID
vercel inspect  # Shows PROJECT_ID
```

---

## 🔍 Monitoring & Error Tracking

### Sentry Integration
Required for: `sentry-release.yml`, production error tracking

| Secret Name | Description | How to Get |
|------------|-------------|------------|
| `SENTRY_AUTH_TOKEN` | Sentry API authentication token | [Sentry Settings → Auth Tokens](https://sentry.io/settings/account/api/auth-tokens/) |
| `SENTRY_ORG` | Sentry organization slug | Your org name from Sentry URL: `sentry.io/organizations/YOUR_ORG/` |
| `SENTRY_DSN` | Data Source Name for error reporting | Project Settings → Client Keys (DSN) |

**Sentry Projects to Create:**
1. `odavl-insight-cloud` - Insight Cloud dashboard
2. `odavl-guardian-app` - Guardian testing app
3. `odavl-studio-hub` - Marketing website

**Setup Steps:**
```bash
# 1. Create Sentry account at https://sentry.io
# 2. Create organization: "odavl-studio"
# 3. Create 3 projects (listed above)
# 4. Get auth token: Settings → Account → API → Auth Tokens → Create
# 5. Get DSN: Project Settings → Client Keys (DSN)
```

---

## 🗄️ Database Secrets

### Production Database
Required for: `deploy-production.yml` (backup functionality)

| Secret Name | Description | How to Get |
|------------|-------------|------------|
| `DATABASE_URL` | PostgreSQL connection string | From your PostgreSQL provider (Supabase, Railway, Neon) |

**Format:**
```
postgresql://username:password@host:5432/database?schema=public
```

**Example Providers:**
- [Supabase](https://supabase.com) → Project Settings → Database → Connection string
- [Railway](https://railway.app) → PostgreSQL → Connect → Connection string
- [Neon](https://neon.tech) → Dashboard → Connection string

---

## 🔒 Security Scanning

### Snyk Integration
Required for: `security.yml` (snyk-scan job)

| Secret Name | Description | How to Get |
|------------|-------------|------------|
| `SNYK_TOKEN` | Snyk API token | [Snyk Account Settings](https://app.snyk.io/account) → General → Auth Token |

**Setup Steps:**
```bash
# 1. Create account at https://snyk.io
# 2. Go to Account Settings → General
# 3. Copy "Auth Token" (starts with 'snyk-')
# 4. Add as GitHub secret
```

---

## 📦 Package Management

### NPM Publishing (Optional)
Required for: Public package publishing (if needed in future)

| Secret Name | Description | How to Get |
|------------|-------------|------------|
| `NPM_TOKEN` | NPM authentication token | [NPM Account Settings](https://www.npmjs.com/settings) → Access Tokens → Generate |

**Note:** Currently ODAVL packages are private. Add this only when publishing to NPM registry.

---

## 📧 Notifications (Optional)

### Slack Integration
Optional for: Team notifications on workflow failures

| Secret Name | Description | How to Get |
|------------|-------------|------------|
| `SLACK_WEBHOOK_URL` | Incoming webhook URL | [Slack Apps](https://api.slack.com/apps) → Create App → Incoming Webhooks |

**Setup Steps:**
```bash
# 1. Create Slack app at https://api.slack.com/apps
# 2. Enable "Incoming Webhooks"
# 3. Create webhook for #deployments channel
# 4. Copy webhook URL (starts with 'https://hooks.slack.com/')
```

---

## 🔧 GitHub Actions Built-in Secrets

These are automatically available (no setup needed):

| Secret Name | Description | Usage |
|------------|-------------|-------|
| `GITHUB_TOKEN` | Automatic token for repo access | Already used in all workflows |
| `GITHUB_REPOSITORY` | Current repo (e.g., `user/odavl`) | Auto-populated |
| `GITHUB_ACTOR` | User who triggered workflow | Auto-populated |

---

## ✅ Verification Checklist

After adding secrets, verify each integration:

### 1. Vercel Deployment
```bash
# Trigger deployment workflow
git tag v2.0.0-test
git push origin v2.0.0-test

# Check: https://github.com/YOUR_USERNAME/odavl/actions
# Should see successful deployment to Vercel
```

### 2. Sentry Integration
```bash
# Trigger Sentry release workflow
git tag v2.0.0
git push origin v2.0.0

# Check: https://sentry.io/organizations/YOUR_ORG/releases/
# Should see new release with uploaded source maps
```

### 3. Database Backup
```bash
# Trigger production deployment
# Workflow should create pg_dump backup

# Check: GitHub Actions → Artifacts
# Should see "database-backup-YYYY-MM-DD"
```

### 4. Security Scanning
```bash
# Push any commit to main branch
# quality-gates.yml should run automatically

# Check: Security tab → Snyk results
# Should show dependency vulnerabilities (if any)
```

---

## 🚨 Security Best Practices

### 1. Secret Rotation
- Rotate tokens every 90 days
- Use calendar reminders
- Update secrets in both GitHub and local `.env.local`

### 2. Least Privilege
- Grant minimum required permissions
- Use project-specific tokens (not personal)
- Revoke unused tokens immediately

### 3. Secret Scope
- Use repository secrets for project-specific values
- Use organization secrets for shared values (if applicable)
- Never commit secrets to git

### 4. Access Control
- Limit who can view/edit secrets
- Audit secret access logs monthly
- Use separate tokens for staging/production

---

## 📊 Secret Priority Levels

### Critical (Required for Production) 🔴
Must add immediately:
- ✅ `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`
- ✅ `DATABASE_URL`
- ✅ `SENTRY_AUTH_TOKEN`, `SENTRY_ORG`, `SENTRY_DSN`

### Important (Required for Full Functionality) 🟡
Add within 1 week:
- ⚠️ `SNYK_TOKEN`

### Optional (Nice to Have) 🟢
Add as needed:
- 📢 `SLACK_WEBHOOK_URL`
- 📦 `NPM_TOKEN` (only for public packages)

---

## 🔍 Troubleshooting

### "Secret not found" error in workflows
```bash
# 1. Verify secret name matches exactly (case-sensitive)
# 2. Check secret is added at repository level (not environment)
# 3. Re-run workflow after adding secret
```

### "Invalid token" error
```bash
# 1. Verify token hasn't expired
# 2. Check token has required permissions
# 3. Try creating new token
```

### Vercel deployment fails
```bash
# Common issues:
# 1. VERCEL_ORG_ID incorrect → Run `vercel whoami`
# 2. VERCEL_PROJECT_ID incorrect → Check project settings
# 3. Token lacks deployment permission → Create new token with full access
```

### Sentry release not appearing
```bash
# Common issues:
# 1. SENTRY_AUTH_TOKEN lacks 'project:releases' scope
# 2. SENTRY_ORG slug incorrect (check URL)
# 3. Project doesn't exist → Create in Sentry dashboard
```

---

## 📚 External Resources

- [GitHub Secrets Documentation](https://docs.github.com/en/actions/security-guides/encrypted-secrets)
- [Vercel Deployment Tokens](https://vercel.com/docs/concepts/deployments/deployment-tokens)
- [Sentry Authentication](https://docs.sentry.io/api/auth/)
- [Snyk API Tokens](https://docs.snyk.io/snyk-api-info/authentication-for-api)

---

## 🎯 Quick Start Script

```bash
#!/bin/bash
# save as: scripts/setup-secrets.sh

echo "🔐 ODAVL Studio - GitHub Secrets Setup"
echo "========================================"
echo ""

# Vercel
echo "📦 Vercel Deployment:"
read -p "Enter VERCEL_TOKEN: " VERCEL_TOKEN
read -p "Enter VERCEL_ORG_ID: " VERCEL_ORG_ID
read -p "Enter VERCEL_PROJECT_ID: " VERCEL_PROJECT_ID

gh secret set VERCEL_TOKEN -b "$VERCEL_TOKEN"
gh secret set VERCEL_ORG_ID -b "$VERCEL_ORG_ID"
gh secret set VERCEL_PROJECT_ID -b "$VERCEL_PROJECT_ID"

# Sentry
echo ""
echo "🔍 Sentry Monitoring:"
read -p "Enter SENTRY_AUTH_TOKEN: " SENTRY_AUTH_TOKEN
read -p "Enter SENTRY_ORG: " SENTRY_ORG
read -p "Enter SENTRY_DSN: " SENTRY_DSN

gh secret set SENTRY_AUTH_TOKEN -b "$SENTRY_AUTH_TOKEN"
gh secret set SENTRY_ORG -b "$SENTRY_ORG"
gh secret set SENTRY_DSN -b "$SENTRY_DSN"

# Database
echo ""
echo "🗄️ Database:"
read -p "Enter DATABASE_URL: " DATABASE_URL

gh secret set DATABASE_URL -b "$DATABASE_URL"

# Snyk
echo ""
echo "🔒 Security Scanning:"
read -p "Enter SNYK_TOKEN: " SNYK_TOKEN

gh secret set SNYK_TOKEN -b "$SNYK_TOKEN"

echo ""
echo "✅ All secrets added successfully!"
echo "Verify at: https://github.com/$GITHUB_REPOSITORY/settings/secrets/actions"
```

**Usage:**
```bash
# Install GitHub CLI if needed
brew install gh  # macOS
# or: https://cli.github.com/

# Authenticate
gh auth login

# Run setup script
chmod +x scripts/setup-secrets.sh
./scripts/setup-secrets.sh
```

---

## 📞 Support

If you encounter issues setting up secrets:
1. Check workflow logs: Actions tab → Failed workflow → View logs
2. Verify secret names match exactly (case-sensitive)
3. Ensure tokens have required permissions
4. Review this guide's troubleshooting section

---

**Last Updated:** 2025-01-09  
**ODAVL Studio v2.0** - Production-Ready CI/CD Infrastructure

**Status:** 🟢 All critical secrets documented
