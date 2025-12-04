# OAuth Setup Automation Guide - ODAVL Studio Hub

**Purpose**: Streamline OAuth app creation for GitHub and Google authentication  
**Target**: Developers setting up new environments (dev/staging/production)  
**Time Required**: 20 minutes (10 min GitHub + 10 min Google)

---

## Prerequisites Checklist

Before starting OAuth setup:

- ✅ Domain ready (e.g., `odavl.studio` for production, `localhost:3000` for dev)
- ✅ `.env.local` file exists in `apps/studio-hub/`
- ✅ `NEXTAUTH_SECRET` generated (run: `openssl rand -base64 32`)
- ✅ Admin access to GitHub organization or personal account
- ✅ Admin access to Google Cloud Console

---

## Part 1: GitHub OAuth App Setup (10 minutes)

### Step 1: Create GitHub OAuth Application

**For Development** (localhost):
1. Navigate to: https://github.com/settings/developers
2. Click **"New OAuth App"**
3. Fill in details:
   ```
   Application name: ODAVL Studio Hub (Development)
   Homepage URL: http://localhost:3000
   Authorization callback URL: http://localhost:3000/api/auth/callback/github
   Application description: ODAVL Studio Hub - Autonomous code quality platform
   ```
4. Click **"Register application"**

**For Production** (custom domain):
1. Navigate to: https://github.com/settings/developers
2. Click **"New OAuth App"**
3. Fill in details:
   ```
   Application name: ODAVL Studio Hub
   Homepage URL: https://odavl.studio
   Authorization callback URL: https://odavl.studio/api/auth/callback/github
   Application description: ODAVL Studio Hub - Autonomous code quality platform
   ```
4. Click **"Register application"**

### Step 2: Copy Credentials

After creating the app:
1. Copy **Client ID** (format: `Iv1.1a2b3c4d5e6f7g8h`)
2. Click **"Generate a new client secret"**
3. Copy **Client Secret** (format: `1a2b3c4d5e6f7g8h9i0j1k2l3m4n5o6p7q8r9s0t`)
4. ⚠️ **IMPORTANT**: Save the secret immediately - you won't see it again!

### Step 3: Update Environment Variables

Add to `.env.local`:
```env
# GitHub OAuth
GITHUB_CLIENT_ID="Iv1.1a2b3c4d5e6f7g8h"
GITHUB_CLIENT_SECRET="1a2b3c4d5e6f7g8h9i0j1k2l3m4n5o6p7q8r9s0t"
```

### Step 4: Test GitHub Authentication

```bash
# Start development server
pnpm dev

# Visit: http://localhost:3000
# Click: "Sign in with GitHub"
# Expected: GitHub authorization page → redirect to dashboard
```

**Troubleshooting**:
- **"Redirect URI mismatch"**: Check callback URL matches exactly
- **"Invalid client"**: Verify GITHUB_CLIENT_ID is correct
- **"Invalid credentials"**: Regenerate client secret and update .env.local

---

## Part 2: Google OAuth Client Setup (10 minutes)

### Step 1: Create Google Cloud Project

1. Navigate to: https://console.cloud.google.com/
2. Click project dropdown → **"New Project"**
3. Fill in details:
   ```
   Project name: ODAVL Studio Hub
   Organization: (your organization)
   Location: (leave default)
   ```
4. Click **"Create"**
5. Wait for project creation (~30 seconds)
6. Select the new project from dropdown

### Step 2: Enable Google+ API

1. Navigate to: https://console.cloud.google.com/apis/library
2. Search: **"Google+ API"**
3. Click **"Google+ API"**
4. Click **"Enable"**
5. Wait for API activation (~10 seconds)

### Step 3: Configure OAuth Consent Screen

1. Navigate to: https://console.cloud.google.com/apis/credentials/consent
2. Select **"External"** (for public app)
3. Click **"Create"**
4. Fill in App Information:
   ```
   App name: ODAVL Studio Hub
   User support email: (your email)
   App logo: (optional)
   Application home page: https://odavl.studio
   Application privacy policy: https://odavl.studio/privacy
   Application terms of service: https://odavl.studio/terms
   ```
5. Authorized domains:
   ```
   odavl.studio (production)
   localhost (development - add separately)
   ```
6. Developer contact email: (your email)
7. Click **"Save and Continue"**
8. Scopes: Add `email`, `profile`, `openid` (default scopes)
9. Click **"Save and Continue"**
10. Test users: Add your email for testing
11. Click **"Save and Continue"**

### Step 4: Create OAuth Client ID

1. Navigate to: https://console.cloud.google.com/apis/credentials
2. Click **"+ Create Credentials"** → **"OAuth client ID"**
3. Select Application type: **"Web application"**
4. Fill in details:

**For Development**:
```
Name: ODAVL Studio Hub (Development)

Authorized JavaScript origins:
- http://localhost:3000

Authorized redirect URIs:
- http://localhost:3000/api/auth/callback/google
```

**For Production**:
```
Name: ODAVL Studio Hub

Authorized JavaScript origins:
- https://odavl.studio

Authorized redirect URIs:
- https://odavl.studio/api/auth/callback/google
```

5. Click **"Create"**

### Step 5: Copy Credentials

1. Copy **Client ID** (format: `123456789012-abc123def456ghi789jkl012mno345.apps.googleusercontent.com`)
2. Copy **Client Secret** (format: `GOCSPX-1a2b3c4d5e6f7g8h9i0j1k2l`)
3. Click **"OK"**

### Step 6: Update Environment Variables

Add to `.env.local`:
```env
# Google OAuth
GOOGLE_CLIENT_ID="123456789012-abc123def456ghi789jkl012mno345.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="GOCSPX-1a2b3c4d5e6f7g8h9i0j1k2l"
```

### Step 7: Test Google Authentication

```bash
# Restart development server
pnpm dev

# Visit: http://localhost:3000
# Click: "Sign in with Google"
# Expected: Google account selection → redirect to dashboard
```

**Troubleshooting**:
- **"redirect_uri_mismatch"**: Check authorized redirect URIs match exactly
- **"Access blocked"**: Add your email to test users in OAuth consent screen
- **"Invalid client"**: Verify GOOGLE_CLIENT_ID is correct
- **"This app isn't verified"**: Normal for development - click "Advanced" → "Go to ODAVL Studio Hub (unsafe)"

---

## Part 3: Final Verification

### Step 1: Verify All Environment Variables

Check `.env.local` has all OAuth variables:
```bash
# Verify file contents
cat apps/studio-hub/.env.local | grep -E "GITHUB|GOOGLE|NEXTAUTH"
```

Expected output:
```env
NEXTAUTH_SECRET="generated_32_character_secret_here"
NEXTAUTH_URL="http://localhost:3000"
GITHUB_CLIENT_ID="Iv1.1a2b3c4d5e6f7g8h"
GITHUB_CLIENT_SECRET="1a2b3c4d5e6f7g8h9i0j1k2l3m4n5o6p7q8r9s0t"
GOOGLE_CLIENT_ID="123456789012-abc123def456ghi789jkl012mno345.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="GOCSPX-1a2b3c4d5e6f7g8h9i0j1k2l"
```

### Step 2: Test Complete Authentication Flow

```bash
# Start fresh server
pnpm dev

# Open browser: http://localhost:3000
```

**Test GitHub**:
1. Click "Sign in with GitHub"
2. Authorize app (first time only)
3. Verify redirect to dashboard
4. Check user profile displays correctly

**Test Google**:
1. Sign out
2. Click "Sign in with Google"
3. Select Google account
4. Verify redirect to dashboard
5. Check user profile displays correctly

### Step 3: Verify Database Records

```bash
# Open Prisma Studio
pnpm db:studio

# Check tables:
# 1. User: Should see your account
# 2. Account: Should see provider records (github/google)
# 3. Session: Should see active session
```

---

## Production Deployment Notes

### Environment-Specific Setup

**For each environment**, create separate OAuth apps with environment-specific URLs:

#### Development (localhost:3000)
- GitHub callback: `http://localhost:3000/api/auth/callback/github`
- Google callback: `http://localhost:3000/api/auth/callback/google`

#### Staging (staging.odavl.studio)
- GitHub callback: `https://staging.odavl.studio/api/auth/callback/github`
- Google callback: `https://staging.odavl.studio/api/auth/callback/google`

#### Production (odavl.studio)
- GitHub callback: `https://odavl.studio/api/auth/callback/github`
- Google callback: `https://odavl.studio/api/auth/callback/google`

### Security Best Practices

1. **Never commit OAuth secrets to Git**:
   ```bash
   # Verify .gitignore has:
   .env*.local
   ```

2. **Use environment-specific secrets**:
   - Development: Separate GitHub/Google apps
   - Production: Different secrets, stricter domains

3. **Rotate secrets periodically**:
   - GitHub: Regenerate client secret every 90 days
   - Google: Rotate via Google Cloud Console

4. **Monitor OAuth usage**:
   - GitHub: Check app insights at https://github.com/settings/developers
   - Google: Check quota at https://console.cloud.google.com/apis/dashboard

---

## Automation Scripts

### Quick Setup Script (PowerShell)

Save as `scripts/setup-oauth.ps1`:

```powershell
# OAuth Setup Automation Script
# Usage: .\scripts\setup-oauth.ps1

Write-Host "🔐 ODAVL Studio OAuth Setup" -ForegroundColor Cyan

# Check prerequisites
if (!(Test-Path ".env.local")) {
    Write-Host "❌ .env.local not found. Create it first!" -ForegroundColor Red
    exit 1
}

# Check NEXTAUTH_SECRET
$nextAuthSecret = Get-Content .env.local | Select-String "NEXTAUTH_SECRET"
if (!$nextAuthSecret) {
    Write-Host "⚠️  NEXTAUTH_SECRET not found. Generating..." -ForegroundColor Yellow
    $secret = openssl rand -base64 32
    Add-Content .env.local "`nNEXTAUTH_SECRET=`"$secret`""
    Write-Host "✅ NEXTAUTH_SECRET generated" -ForegroundColor Green
}

Write-Host "`n📋 Next Steps:" -ForegroundColor Cyan
Write-Host "1. GitHub OAuth: https://github.com/settings/developers" -ForegroundColor White
Write-Host "2. Google OAuth: https://console.cloud.google.com/apis/credentials" -ForegroundColor White
Write-Host "3. Update .env.local with Client IDs and Secrets" -ForegroundColor White
Write-Host "4. Run: pnpm dev" -ForegroundColor White
Write-Host "5. Test: http://localhost:3000" -ForegroundColor White

Write-Host "`n📄 Full guide: OAUTH_AUTOMATION_GUIDE.md" -ForegroundColor Cyan
```

### Verification Script (PowerShell)

Save as `scripts/verify-oauth.ps1`:

```powershell
# OAuth Verification Script
# Usage: .\scripts\verify-oauth.ps1

Write-Host "🔍 Verifying OAuth Configuration..." -ForegroundColor Cyan

$requiredVars = @(
    "NEXTAUTH_SECRET",
    "NEXTAUTH_URL",
    "GITHUB_CLIENT_ID",
    "GITHUB_CLIENT_SECRET",
    "GOOGLE_CLIENT_ID",
    "GOOGLE_CLIENT_SECRET"
)

$envContent = Get-Content .env.local -Raw
$missing = @()

foreach ($var in $requiredVars) {
    if ($envContent -notmatch "$var=") {
        $missing += $var
    }
}

if ($missing.Count -eq 0) {
    Write-Host "✅ All OAuth variables present!" -ForegroundColor Green
    Write-Host "`n🚀 Ready to start: pnpm dev" -ForegroundColor Cyan
} else {
    Write-Host "❌ Missing variables:" -ForegroundColor Red
    $missing | ForEach-Object { Write-Host "  - $_" -ForegroundColor Yellow }
    Write-Host "`n📄 See: OAUTH_AUTOMATION_GUIDE.md" -ForegroundColor Cyan
}
```

---

## Frequently Asked Questions

### Q: Can I use the same OAuth apps for dev and production?

**A**: Not recommended. Use separate apps for each environment:
- **Security**: Production credentials isolated from development
- **Monitoring**: Track usage per environment separately
- **Flexibility**: Different callback URLs per environment

### Q: What if I lose my OAuth secrets?

**GitHub**: Regenerate client secret in app settings  
**Google**: Create new credentials in Google Cloud Console  
**Both**: Update `.env.local` immediately after regeneration

### Q: How do I add more OAuth providers (e.g., Microsoft, Facebook)?

1. Install provider package:
   ```bash
   pnpm add next-auth-provider-[name]
   ```

2. Update `app/api/auth/[...nextauth]/route.ts`:
   ```typescript
   import MicrosoftProvider from "next-auth/providers/microsoft";
   
   providers: [
     GitHubProvider({ /* ... */ }),
     GoogleProvider({ /* ... */ }),
     MicrosoftProvider({
       clientId: process.env.MICROSOFT_CLIENT_ID!,
       clientSecret: process.env.MICROSOFT_CLIENT_SECRET!,
     }),
   ]
   ```

3. Follow provider-specific OAuth app creation

### Q: Why is Google showing "This app isn't verified"?

**Reason**: App in testing mode (normal for development)

**Solutions**:
- **Development**: Click "Advanced" → "Go to app (unsafe)"
- **Production**: Submit app for verification (Google OAuth verification process)

### Q: Can I skip OAuth and use email/password?

**Yes**, but OAuth is recommended for:
- Better security (no password storage)
- Social proof (GitHub/Google verification)
- Easier onboarding (one-click sign in)

To add email/password: See `AUTHENTICATION_GUIDE.md`

---

## Checklist: OAuth Setup Complete ✅

Before moving to production:

- [ ] GitHub OAuth app created
- [ ] Google OAuth client created
- [ ] `.env.local` updated with all credentials
- [ ] `NEXTAUTH_SECRET` generated (32+ chars)
- [ ] GitHub authentication tested successfully
- [ ] Google authentication tested successfully
- [ ] User record created in database
- [ ] Session persists across page reloads
- [ ] Sign out works correctly
- [ ] Separate OAuth apps for staging/production environments
- [ ] OAuth secrets stored in secure secret manager (not in Git)

---

## Next Steps After OAuth Setup

1. **Sentry Monitoring**: Add DSN to `.env.local` (see `MONITORING_VALIDATION_GUIDE.md`)
2. **Production Deployment**: Follow `DEPLOYMENT_CHECKLIST.md`
3. **Security Hardening**: Review `SECURITY_BEST_PRACTICES.md`
4. **Performance Optimization**: See `PERFORMANCE_TUNING_GUIDE.md`

---

**Created**: January 9, 2025  
**Last Updated**: January 9, 2025  
**Estimated Time**: 20 minutes (10 min GitHub + 10 min Google)  
**Production Readiness**: 96/100 → 100/100 after OAuth setup ✅
