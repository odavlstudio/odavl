# 🔐 GitHub Secrets Setup Guide - ODAVL Studio v2.0

**الحالة:** ⚠️ **19 Secrets مفقودة - حرجة للـ Deployment**  
**الأولوية:** 🔴 CRITICAL  
**الوقت المقدر:** 2-3 ساعات

---

## 📋 جدول المحتويات

1. [نظرة عامة](#نظرة-عامة)
2. [الـ Secrets المطلوبة](#الـ-secrets-المطلوبة)
3. [خطوات الإضافة](#خطوات-الإضافة)
4. [التحقق من الإعداد](#التحقق-من-الإعداد)
5. [استكشاف الأخطاء](#استكشاف-الأخطاء)

---

## 🎯 نظرة عامة

هذا الدليل يوضح كيفية إضافة جميع GitHub Secrets المطلوبة لتشغيل CI/CD pipelines في ODAVL Studio.

### لماذا نحتاج Secrets؟

- ✅ **Deployment**: للنشر إلى Vercel, Cloudflare, AWS
- ✅ **Database**: للاتصال بقواعد البيانات (Staging/Production)
- ✅ **Security**: لتشغيل Snyk security scans
- ✅ **Monitoring**: للإشعارات عبر Slack
- ✅ **CDN**: لإدارة Cloudflare CDN

---

## 🔑 الـ Secrets المطلوبة

### 1️⃣ Database Secrets (حرجة)

| Secret Name | الاستخدام | مثال | الحصول عليه |
|-------------|-----------|------|------------|
| `STAGING_DATABASE_URL` | Staging DB connection | `postgresql://user:pass@host:5432/db` | Vercel Postgres, Supabase, Railway |
| `PRODUCTION_DATABASE_URL` | Production DB connection | `postgresql://user:pass@host:5432/db` | Vercel Postgres, Supabase, Railway |

**كيفية الحصول:**
```bash
# من Vercel:
# 1. اذهب إلى project → Settings → Environment Variables
# 2. انسخ DATABASE_URL من Staging environment
# 3. انسخ DATABASE_URL من Production environment

# من Supabase:
# 1. اذهب إلى Project Settings → Database
# 2. انسخ Connection String (URI format)
```

---

### 2️⃣ Authentication Secrets (حرجة)

| Secret Name | الاستخدام | مثال | التوليد |
|-------------|-----------|------|---------|
| `STAGING_NEXTAUTH_SECRET` | NextAuth encryption (staging) | `random-32-char-string` | `openssl rand -base64 32` |
| `PRODUCTION_NEXTAUTH_SECRET` | NextAuth encryption (production) | `random-32-char-string` | `openssl rand -base64 32` |
| `STAGING_URL` | Staging app URL | `https://staging.odavl.studio` | Vercel deployment URL |

**كيفية التوليد:**
```bash
# في PowerShell:
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Maximum 256 }))

# في bash/Git Bash:
openssl rand -base64 32

# في Node.js:
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

---

### 3️⃣ Vercel Secrets (حرجة للنشر)

| Secret Name | الاستخدام | الحصول عليه |
|-------------|-----------|------------|
| `VERCEL_TOKEN` | Vercel API access | [Vercel Account Settings](https://vercel.com/account/tokens) |
| `VERCEL_ORG_ID` | Organization ID | `.vercel/project.json` بعد `vercel link` |
| `VERCEL_PROJECT_ID` | Project ID | `.vercel/project.json` بعد `vercel link` |

**خطوات الحصول:**

1. **VERCEL_TOKEN:**
   ```bash
   # 1. اذهب إلى: https://vercel.com/account/tokens
   # 2. انقر "Create Token"
   # 3. اسمها: "ODAVL GitHub Actions"
   # 4. Scope: Full Account
   # 5. انسخ Token (يظهر مرة واحدة فقط!)
   ```

2. **VERCEL_ORG_ID & VERCEL_PROJECT_ID:**
   ```bash
   # في terminal:
   cd odavl-studio/insight/cloud
   pnpm vercel link
   
   # سيُنشئ .vercel/project.json:
   cat .vercel/project.json
   # {
   #   "orgId": "team_xxxxxxxxxxxxx",    ← هذا VERCEL_ORG_ID
   #   "projectId": "prj_xxxxxxxxxxxxx"  ← هذا VERCEL_PROJECT_ID
   # }
   ```

---

### 4️⃣ Security Secrets (Snyk)

| Secret Name | الاستخدام | الحصول عليه |
|-------------|-----------|------------|
| `SNYK_TOKEN` | Security scanning | [Snyk Account Settings](https://app.snyk.io/account) |
| `SNYK_ORG_ID` | Snyk organization | Snyk dashboard URL |

**خطوات الحصول:**

1. **SNYK_TOKEN:**
   ```bash
   # 1. اذهب إلى: https://app.snyk.io/account
   # 2. انسخ "Auth Token" من الأسفل
   # 3. أو: انقر "Click to show" ثم Copy
   ```

2. **SNYK_ORG_ID:**
   ```bash
   # من URL في Snyk dashboard:
   # https://app.snyk.io/org/your-org-name/
   #                           ^^^^^^^^^^^^^ ← هذا SNYK_ORG_ID
   ```

---

### 5️⃣ Slack Notifications

| Secret Name | الاستخدام | الحصول عليه |
|-------------|-----------|------------|
| `SLACK_WEBHOOK` | Deployment notifications | [Slack Incoming Webhooks](https://api.slack.com/messaging/webhooks) |

**خطوات الحصول:**
```bash
# 1. اذهب إلى: https://api.slack.com/apps
# 2. انقر "Create New App" → "From scratch"
# 3. App Name: "ODAVL Deployments"
# 4. اختر workspace
# 5. اذهب إلى: Features → Incoming Webhooks
# 6. Toggle "Activate Incoming Webhooks" → ON
# 7. انقر "Add New Webhook to Workspace"
# 8. اختر channel (مثال: #deployments)
# 9. انسخ Webhook URL: https://hooks.slack.com/services/...
```

---

### 6️⃣ Cloudflare Secrets (CDN)

| Secret Name | الاستخدام | الحصول عليه |
|-------------|-----------|------------|
| `CLOUDFLARE_ACCOUNT_ID` | Cloudflare account | [Cloudflare Dashboard](https://dash.cloudflare.com/) |
| `CLOUDFLARE_API_TOKEN` | API access | Cloudflare → My Profile → API Tokens |
| `CLOUDFLARE_ZONE_ID` | Domain zone | Cloudflare → Domain → Overview |

**خطوات الحصول:**

1. **CLOUDFLARE_ACCOUNT_ID:**
   ```bash
   # 1. اذهب إلى: https://dash.cloudflare.com/
   # 2. اختر domain
   # 3. انظر إلى URL: /abc123def456/
   #                     ^^^^^^^^^^^^ ← هذا Account ID
   ```

2. **CLOUDFLARE_API_TOKEN:**
   ```bash
   # 1. اذهب إلى: https://dash.cloudflare.com/profile/api-tokens
   # 2. انقر "Create Token"
   # 3. استخدم "Edit Cloudflare Workers" template
   # 4. Permissions:
   #    - Account → Cloudflare Workers Scripts → Edit
   #    - Zone → Cache Purge → Purge
   # 5. انقر "Continue to summary" ثم "Create Token"
   # 6. انسخ Token (يظهر مرة واحدة!)
   ```

3. **CLOUDFLARE_ZONE_ID:**
   ```bash
   # 1. اذهب إلى Cloudflare dashboard
   # 2. اختر domain (مثال: odavl.studio)
   # 3. Overview → API section
   # 4. انسخ "Zone ID"
   ```

---

### 7️⃣ AWS Secrets (Backups)

| Secret Name | الاستخدام | الحصول عليه |
|-------------|-----------|------------|
| `AWS_ACCESS_KEY_ID` | S3 backup access | AWS IAM Console |
| `AWS_SECRET_ACCESS_KEY` | S3 credentials | AWS IAM Console |
| `CLOUDFRONT_DISTRIBUTION_ID` | CDN distribution | CloudFront Console |

**خطوات الحصول:**

1. **AWS_ACCESS_KEY_ID & AWS_SECRET_ACCESS_KEY:**
   ```bash
   # 1. اذهب إلى: https://console.aws.amazon.com/iam/
   # 2. Users → Add users
   # 3. User name: "odavl-github-actions"
   # 4. Access type: ☑ Programmatic access
   # 5. Permissions: Attach existing policies
   #    - AmazonS3FullAccess (لـ backups)
   #    - CloudFrontFullAccess (لـ CDN)
   # 6. Create user
   # 7. انسخ:
   #    - Access key ID ← AWS_ACCESS_KEY_ID
   #    - Secret access key ← AWS_SECRET_ACCESS_KEY (يظهر مرة واحدة!)
   ```

2. **CLOUDFRONT_DISTRIBUTION_ID:**
   ```bash
   # 1. اذهب إلى: https://console.aws.amazon.com/cloudfront/
   # 2. اختر distribution
   # 3. انسخ "ID" من القائمة (مثال: E1234ABCD5678)
   ```

---

### 8️⃣ Azure Secrets (Optional - للـ backups)

| Secret Name | الاستخدام | الحصول عليه |
|-------------|-----------|------------|
| `AZURE_STORAGE_CONNECTION_STRING` | Azure Blob Storage | Azure Portal |

**خطوات الحصول:**
```bash
# 1. اذهب إلى: https://portal.azure.com/
# 2. Storage accounts → اختر/أنشئ storage account
# 3. Access keys
# 4. انسخ "Connection string" من key1 أو key2
```

---

### 9️⃣ GitLeaks (License - Optional)

| Secret Name | الاستخدام | الحصول عليه |
|-------------|-----------|------------|
| `GITLEAKS_LICENSE` | GitLeaks Pro features | [GitLeaks Pro](https://gitleaks.io/) |

**ملاحظة:** اختياري - يعمل بدونه في free mode.

---

## 🚀 خطوات الإضافة

### الطريقة 1: عبر GitHub UI (موصى بها)

1. **اذهب إلى GitHub Repository:**
   ```
   https://github.com/[USERNAME]/odavl/settings/secrets/actions
   ```

2. **لكل Secret:**
   - انقر **"New repository secret"**
   - **Name**: أدخل اسم Secret (مثال: `STAGING_DATABASE_URL`)
   - **Secret**: الصق القيمة
   - انقر **"Add secret"**

3. **كرر للـ 19 Secret:**
   ```
   ✅ STAGING_DATABASE_URL
   ✅ STAGING_NEXTAUTH_SECRET
   ✅ STAGING_URL
   ✅ PRODUCTION_DATABASE_URL
   ✅ PRODUCTION_NEXTAUTH_SECRET
   ✅ VERCEL_TOKEN
   ✅ VERCEL_ORG_ID
   ✅ VERCEL_PROJECT_ID
   ✅ SNYK_TOKEN
   ✅ SNYK_ORG_ID
   ✅ SLACK_WEBHOOK
   ✅ CLOUDFLARE_ACCOUNT_ID
   ✅ CLOUDFLARE_API_TOKEN
   ✅ CLOUDFLARE_ZONE_ID
   ✅ AWS_ACCESS_KEY_ID
   ✅ AWS_SECRET_ACCESS_KEY
   ✅ CLOUDFRONT_DISTRIBUTION_ID
   ✅ AZURE_STORAGE_CONNECTION_STRING
   ✅ GITLEAKS_LICENSE
   ```

---

### الطريقة 2: عبر GitHub CLI

```bash
# تثبيت GitHub CLI (إذا لم يكن مثبتاً)
# Windows: winget install --id GitHub.cli
# Mac: brew install gh
# Linux: sudo apt install gh

# تسجيل الدخول
gh auth login

# إضافة Secrets
gh secret set STAGING_DATABASE_URL
# (سيطلب منك إدخال القيمة)

# أو من ملف:
echo "postgresql://..." | gh secret set STAGING_DATABASE_URL

# إضافة جميع Secrets دفعة واحدة:
gh secret set STAGING_DATABASE_URL < staging_db_url.txt
gh secret set STAGING_NEXTAUTH_SECRET < staging_secret.txt
# ... إلخ
```

---

### الطريقة 3: Script الأتمتة (PowerShell)

```powershell
# add-github-secrets.ps1
$secrets = @{
    "STAGING_DATABASE_URL" = "postgresql://..."
    "STAGING_NEXTAUTH_SECRET" = "..."
    # ... إلخ
}

foreach ($secret in $secrets.GetEnumerator()) {
    Write-Host "Adding secret: $($secret.Key)"
    echo $secret.Value | gh secret set $secret.Key
}

Write-Host "`n✅ All secrets added successfully!"
```

---

## ✅ التحقق من الإعداد

### 1. التحقق اليدوي

```bash
# عرض قائمة Secrets (لن تظهر القيم - فقط الأسماء)
gh secret list

# يجب أن ترى:
# STAGING_DATABASE_URL         Updated 2025-11-26
# STAGING_NEXTAUTH_SECRET      Updated 2025-11-26
# STAGING_URL                  Updated 2025-11-26
# ... إلخ (19 secret)
```

### 2. اختبار عبر Workflow

انشئ test workflow:

```yaml
# .github/workflows/test-secrets.yml
name: Test Secrets

on:
  workflow_dispatch:  # يدوي فقط

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - name: Check Secrets
        run: |
          echo "Testing secrets availability..."
          
          # Database
          [ -n "${{ secrets.STAGING_DATABASE_URL }}" ] && echo "✅ STAGING_DATABASE_URL" || echo "❌ STAGING_DATABASE_URL missing"
          [ -n "${{ secrets.PRODUCTION_DATABASE_URL }}" ] && echo "✅ PRODUCTION_DATABASE_URL" || echo "❌ PRODUCTION_DATABASE_URL missing"
          
          # Auth
          [ -n "${{ secrets.STAGING_NEXTAUTH_SECRET }}" ] && echo "✅ STAGING_NEXTAUTH_SECRET" || echo "❌ STAGING_NEXTAUTH_SECRET missing"
          [ -n "${{ secrets.PRODUCTION_NEXTAUTH_SECRET }}" ] && echo "✅ PRODUCTION_NEXTAUTH_SECRET" || echo "❌ PRODUCTION_NEXTAUTH_SECRET missing"
          
          # Vercel
          [ -n "${{ secrets.VERCEL_TOKEN }}" ] && echo "✅ VERCEL_TOKEN" || echo "❌ VERCEL_TOKEN missing"
          [ -n "${{ secrets.VERCEL_ORG_ID }}" ] && echo "✅ VERCEL_ORG_ID" || echo "❌ VERCEL_ORG_ID missing"
          [ -n "${{ secrets.VERCEL_PROJECT_ID }}" ] && echo "✅ VERCEL_PROJECT_ID" || echo "❌ VERCEL_PROJECT_ID missing"
          
          # Security
          [ -n "${{ secrets.SNYK_TOKEN }}" ] && echo "✅ SNYK_TOKEN" || echo "❌ SNYK_TOKEN missing"
          [ -n "${{ secrets.SNYK_ORG_ID }}" ] && echo "✅ SNYK_ORG_ID" || echo "❌ SNYK_ORG_ID missing"
          
          # Notifications
          [ -n "${{ secrets.SLACK_WEBHOOK }}" ] && echo "✅ SLACK_WEBHOOK" || echo "❌ SLACK_WEBHOOK missing"
          
          # Cloudflare
          [ -n "${{ secrets.CLOUDFLARE_ACCOUNT_ID }}" ] && echo "✅ CLOUDFLARE_ACCOUNT_ID" || echo "❌ CLOUDFLARE_ACCOUNT_ID missing"
          [ -n "${{ secrets.CLOUDFLARE_API_TOKEN }}" ] && echo "✅ CLOUDFLARE_API_TOKEN" || echo "❌ CLOUDFLARE_API_TOKEN missing"
          [ -n "${{ secrets.CLOUDFLARE_ZONE_ID }}" ] && echo "✅ CLOUDFLARE_ZONE_ID" || echo "❌ CLOUDFLARE_ZONE_ID missing"
          
          # AWS
          [ -n "${{ secrets.AWS_ACCESS_KEY_ID }}" ] && echo "✅ AWS_ACCESS_KEY_ID" || echo "❌ AWS_ACCESS_KEY_ID missing"
          [ -n "${{ secrets.AWS_SECRET_ACCESS_KEY }}" ] && echo "✅ AWS_SECRET_ACCESS_KEY" || echo "❌ AWS_SECRET_ACCESS_KEY missing"
          [ -n "${{ secrets.CLOUDFRONT_DISTRIBUTION_ID }}" ] && echo "✅ CLOUDFRONT_DISTRIBUTION_ID" || echo "❌ CLOUDFRONT_DISTRIBUTION_ID missing"
          
          echo "`nTest complete!"
```

**تشغيل الاختبار:**
```bash
# عبر GitHub UI:
# Actions → Test Secrets → Run workflow

# عبر CLI:
gh workflow run test-secrets.yml
```

---

## 🐛 استكشاف الأخطاء

### خطأ: "Secret not found"

**السبب:** Secret غير مضاف أو اسمه خاطئ

**الحل:**
```bash
# تأكد من الأسماء (حساسة لحالة الأحرف)
gh secret list | grep STAGING_DATABASE_URL

# أعد إضافته:
gh secret set STAGING_DATABASE_URL
```

---

### خطأ: "Unauthorized"

**السبب:** Token أو Credentials خاطئة

**الحل:**
```bash
# 1. تحقق من صلاحية Token:
# Vercel: https://vercel.com/account/tokens (تحقق من expiry)
# AWS: راجع IAM user permissions

# 2. أعد توليد Token جديد
# 3. حدّث Secret في GitHub
```

---

### خطأ: "Database connection failed"

**السبب:** DATABASE_URL غير صحيح

**الحل:**
```bash
# اختبر الاتصال محلياً:
psql "postgresql://user:pass@host:5432/db"

# تحقق من:
# - Username/Password صحيح
# - Host reachable
# - Database exists
# - SSL mode (يحتاج ?sslmode=require في بعض الأحيان)

# Format صحيح:
# postgresql://USER:PASSWORD@HOST:PORT/DATABASE?sslmode=require
```

---

### خطأ: "Vercel deployment failed"

**السبب:** Vercel credentials خاطئة

**الحل:**
```bash
# 1. تحقق من VERCEL_PROJECT_ID:
cd odavl-studio/insight/cloud
cat .vercel/project.json

# 2. تحقق من VERCEL_ORG_ID (نفس الملف)

# 3. تحقق من VERCEL_TOKEN صلاحيته:
vercel whoami --token YOUR_TOKEN

# 4. تأكد أن Token له scope: Full Account
```

---

## 📝 Checklist النهائي

قبل الانتقال للمرحلة التالية، تأكد:

- [ ] **19/19 Secrets مضافة** ✅
- [ ] **Test workflow يعمل** ✅
- [ ] **Deploy staging يعمل** ✅
- [ ] **Slack notifications تصل** ✅
- [ ] **Snyk scan يعمل** ✅
- [ ] **Secrets مُوثقة** (في 1Password/LastPass) ✅

---

## 🔐 أفضل الممارسات الأمنية

### 1. Rotation Policy

```bash
# قم بتغيير Secrets كل:
# - Tokens: 90 يوم
# - Passwords: 180 يوم
# - API Keys: 365 يوم

# ضع تذكير:
# Calendar: "Rotate GitHub Secrets" - Every 3 months
```

### 2. Least Privilege

```bash
# منح أقل صلاحيات ممكنة:
# ✅ Vercel: Deploy only (لا Read source code)
# ✅ AWS: S3 Bucket specific (لا Full account)
# ✅ Cloudflare: Workers edit only (لا DNS edit)
```

### 3. Backup Secrets

```bash
# احفظ نسخة آمنة:
# - 1Password Team Vault: "ODAVL GitHub Secrets"
# - LastPass: "Shared-GitHub-ODAVL"
# - أو encrypted file في safe location

# ⚠️ لا تحفظ في:
# - Git repository
# - Unencrypted notes
# - Plain text files
# - Slack messages
```

### 4. Monitoring

```bash
# راقب استخدام Secrets:
# - GitHub Audit Log
# - Vercel Activity Log
# - AWS CloudTrail
# - Cloudflare Audit Log

# Alert على:
# - Failed authentication attempts
# - Unusual API usage
# - Secrets accessed from new IPs
```

---

## 📞 الحصول على المساعدة

إذا واجهت مشاكل:

1. **Documentation:**
   - [GitHub Secrets](https://docs.github.com/en/actions/security-guides/encrypted-secrets)
   - [Vercel Environment Variables](https://vercel.com/docs/concepts/projects/environment-variables)
   - [Snyk Documentation](https://docs.snyk.io/)

2. **الدعم:**
   - GitHub Support: https://support.github.com/
   - Vercel Support: https://vercel.com/support
   - Snyk Support: https://support.snyk.io/

3. **Community:**
   - ODAVL Discord: [رابط]
   - ODAVL Slack: [رابط]

---

**آخر تحديث:** 2025-11-26  
**الإصدار:** 1.0  
**المؤلف:** GitHub Copilot (Claude Sonnet 4.5)
