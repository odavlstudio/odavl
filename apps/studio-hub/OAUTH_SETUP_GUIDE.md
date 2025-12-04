# 🔐 OAuth Setup Guide - ODAVL Studio Hub

**Status**: ⏳ Pending Manual Setup  
**Required**: GitHub OAuth + Google OAuth  
**Time**: ~10 minutes

---

## ✅ Phase 1.1 Complete!

- ✅ PostgreSQL running on `localhost:5432`
- ✅ Database `odavl_hub` created
- ✅ Schema applied (20+ tables)
- ✅ Demo data seeded successfully

**Verify**: Run `pnpm db:studio` to see your data!

---

## 🎯 Phase 1.2: OAuth Configuration

### Step 1: GitHub OAuth App

#### 1.1 Create OAuth App

1. Visit: https://github.com/settings/developers
2. Click **"New OAuth App"**
3. Fill in:
   - **Application name**: `ODAVL Studio Hub (Dev)`
   - **Homepage URL**: `http://localhost:3000`
   - **Authorization callback URL**: `http://localhost:3000/api/auth/callback/github`
4. Click **"Register application"**

#### 1.2 Get Credentials

1. Copy **Client ID**
2. Click **"Generate a new client secret"**
3. Copy **Client Secret** (shown once!)

#### 1.3 Update .env.local

```env
# GitHub OAuth
GITHUB_ID="your_github_client_id_here"
GITHUB_SECRET="your_github_client_secret_here"
```

---

### Step 2: Google OAuth Client

#### 2.1 Create Project (if needed)

1. Visit: https://console.cloud.google.com/
2. Create new project: **"ODAVL Studio Hub"**
3. Enable **Google+ API** (OAuth requires it)

#### 2.2 Configure OAuth Consent Screen

1. Go to: **APIs & Services** → **OAuth consent screen**
2. Choose: **External** (for testing)
3. Fill in:
   - **App name**: `ODAVL Studio Hub`
   - **User support email**: Your email
   - **Developer contact**: Your email
4. Save and Continue

#### 2.3 Create OAuth Client

1. Go to: **APIs & Services** → **Credentials**
2. Click: **+ CREATE CREDENTIALS** → **OAuth client ID**
3. Choose: **Web application**
4. Fill in:
   - **Name**: `ODAVL Studio Hub (Dev)`
   - **Authorized redirect URIs**: 
     - `http://localhost:3000/api/auth/callback/google`
5. Click **CREATE**

#### 2.4 Get Credentials

1. Copy **Client ID** (ends with `.apps.googleusercontent.com`)
2. Copy **Client Secret**

#### 2.5 Update .env.local

```env
# Google OAuth
GOOGLE_ID="your_google_client_id.apps.googleusercontent.com"
GOOGLE_SECRET="your_google_client_secret_here"
```

---

### Step 3: Generate NextAuth Secret

```powershell
# Generate secure random secret
$bytes = New-Object byte[] 32
[Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($bytes)
$secret = [Convert]::ToBase64String($bytes)
Write-Host "NEXTAUTH_SECRET=`"$secret`""
```

Copy output and add to `.env.local`:

```env
# NextAuth Secret
NEXTAUTH_SECRET="generated_secret_from_above"
```

---

### Step 4: Verify Configuration

```powershell
# Check all OAuth variables are set
cd apps/studio-hub
Get-Content .env.local | Select-String "GITHUB_ID|GITHUB_SECRET|GOOGLE_ID|GOOGLE_SECRET|NEXTAUTH_SECRET"
```

Should show 5 variables configured.

---

### Step 5: Test Authentication

```powershell
# Start dev server
pnpm dev
```

1. Visit: http://localhost:3000
2. Click **"Sign In"**
3. Try **GitHub** login
4. Try **Google** login
5. Check if redirected to dashboard

---

## 🎉 Success Checklist

- [ ] GitHub OAuth App created
- [ ] GitHub credentials in `.env.local`
- [ ] Google OAuth Client created
- [ ] Google credentials in `.env.local`
- [ ] `NEXTAUTH_SECRET` generated and added
- [ ] Sign In with GitHub works
- [ ] Sign In with Google works
- [ ] User created in database

---

## 🚨 Troubleshooting

### Error: "Redirect URI mismatch"

**GitHub**: Check callback URL is exactly:  
`http://localhost:3000/api/auth/callback/github`

**Google**: Check authorized redirect URI is exactly:  
`http://localhost:3000/api/auth/callback/google`

### Error: "Invalid client"

- Double-check Client ID and Secret are correct
- No extra spaces or quotes
- Client Secret wasn't regenerated

### Error: "Access blocked"

**Google only**: Add your email as test user:
1. OAuth consent screen
2. Add test users
3. Add your email

---

## 📊 Progress Update

**Before Phase 1.2**: ~55/100

**After Phase 1.2**: ~70/100 (Expected)

- ✅ Database: 100/100
- 🔄 OAuth: 0→100/100 (after setup)
- ⏳ Env Vars: Next phase
- ⏳ TODOs: Next phase

**Next**: Phase 1.3 - Complete Environment Variables

---

## 🎯 Quick Reference

```powershell
# After manual OAuth setup above, run:

# 1. Verify .env.local
Get-Content .env.local | Select-String "OAUTH|GITHUB|GOOGLE|NEXTAUTH_SECRET"

# 2. Start dev server
pnpm dev

# 3. Test login at http://localhost:3000
```

**Estimated time**: 10-15 minutes for both OAuth providers

---

**Important**: Keep Client Secrets secure! Never commit `.env.local` to Git.
