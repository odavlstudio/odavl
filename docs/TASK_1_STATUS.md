# Task 1 Status: Railway PostgreSQL Setup

## Status: ⏸️ MANUAL STEPS REQUIRED

### Completed (Automated) ✅
- ✅ Prisma schema updated from SQLite to PostgreSQL
- ✅ Prisma Client generated for PostgreSQL
- ✅ Production environment template created (`.env.production.example`)
- ✅ Railway setup guide created (`docs/RAILWAY_SETUP_GUIDE.md`)
- ✅ Test script created (`scripts/test-railway.ts`)

### Pending (Manual - 15-30 minutes) ⏳

#### Step 1: Create Railway Account (5 min)
1. Visit: https://railway.app/
2. Click "Start a New Project"
3. Sign in with GitHub
4. Authorize Railway

**Status:** ⏸️ Waiting for user

#### Step 2: Deploy PostgreSQL (2 min)
1. Click "New Project"
2. Select "Provision PostgreSQL"
3. Wait for deployment (~1 minute)

**Status:** ⏸️ Waiting for Step 1

#### Step 3: Get DATABASE_URL (2 min)
1. Click PostgreSQL service in Railway dashboard
2. Go to "Variables" tab
3. Copy the `DATABASE_URL` value
   - Should look like: `postgresql://postgres:PASSWORD@containers-us-west-123.railway.app:7654/railway`

**Status:** ⏸️ Waiting for Step 2

#### Step 4: Configure Local Environment (3 min)
```bash
cd odavl-studio/insight/cloud

# Copy template
cp .env.production.example .env.production

# Edit .env.production:
# 1. Paste DATABASE_URL from Railway
# 2. Generate JWT_SECRET (min 32 chars):
#    - Use: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
#    - Or: openssl rand -hex 32
```

**Status:** ⏸️ Waiting for Step 3

#### Step 5: Create Migration (5 min)
```bash
cd odavl-studio/insight/cloud

# Create initial migration
pnpm prisma migrate dev --name init_postgresql

# Expected output:
# ✓ Created migration: 20251123_init_postgresql
# ✓ Applied migration: 20251123_init_postgresql
# ✓ Generated Prisma Client
```

**Status:** ⏸️ Waiting for Step 4

#### Step 6: Deploy to Railway (5 min)
```powershell
cd odavl-studio/insight/cloud

# Set DATABASE_URL from Railway
$env:DATABASE_URL = "postgresql://postgres:PASSWORD@host:port/railway"

# Deploy migration
pnpm prisma migrate deploy

# Expected output:
# ✓ Applied migration: 20251123_init_postgresql
# ✓ Database schema synchronized
```

**Status:** ⏸️ Waiting for Step 5

#### Step 7: Test Connection (3 min)
```powershell
# Set DATABASE_URL
$env:DATABASE_URL = "postgresql://postgres:PASSWORD@host:port/railway"

# Run test
pnpm tsx scripts/test-railway.ts

# Expected output:
# ✅ TEST 1: Connection successful
# ✅ TEST 2: User count query successful (0 users)
# ✅ TEST 3: User creation successful (ID: cm123abc456)
# ✅ TEST 4: User query successful (Email: railway-test-...)
# ✅ TEST 5: Subscription creation successful (ID: cm123abc789)
# ✅ TEST 6: Cleanup successful
# 🎉 All tests passed! Railway is ready for production.
```

**Status:** ⏸️ Waiting for Step 6

---

## Next Steps After Task 1 Complete

When all 7 steps are done and test passes:
1. ✅ Railway PostgreSQL deployed and working
2. ✅ Database schema created
3. ✅ Connection tested (6/6 tests passing)
4. → **Move to Task 2:** Prepare Vercel Deployment

---

## Troubleshooting

### Issue: Connection timeout
**Solution:** Add `?sslmode=require` to DATABASE_URL:
```
postgresql://user:pass@host:port/db?sslmode=require
```

### Issue: Authentication failed
**Solution:** 
1. Go to Railway dashboard
2. Click PostgreSQL service
3. Go to "Variables" tab
4. Verify PGUSER and PGPASSWORD values
5. Copy DATABASE_URL again (it includes credentials)

### Issue: Database does not exist
**Solution:** Railway creates database automatically. Check:
1. Railway dashboard → PostgreSQL service
2. "Variables" tab → PGDATABASE value
3. Should be "railway" by default

### Issue: Migration failed
**Solution:**
1. Verify DATABASE_URL is correct
2. Check Railway dashboard for database status (should be "Active")
3. Try deploying migration again: `pnpm prisma migrate deploy`

### Issue: Test failed
**Solution:**
1. Check DATABASE_URL has `?sslmode=require` at the end
2. Verify database is running in Railway dashboard
3. Check migration was applied: `pnpm prisma migrate status`

---

## Cost Breakdown

**Railway PostgreSQL:**
- Free trial: $5 credit (no credit card needed)
- Developer Plan: $5/month after trial
- 500MB storage
- Auto-backups
- High availability
- SSL enabled

**Total:** $0 for trial, then $5/month

---

## Time Estimate

- **Automated steps:** 5 minutes (already done)
- **Manual steps:** 15-30 minutes
  - Account creation: 5 min
  - Database deployment: 2 min
  - Configuration: 5 min
  - Migration: 5 min
  - Testing: 5 min
  - Troubleshooting (if needed): 0-10 min

**Total:** 20-35 minutes

---

## Files Created/Modified

### Created ✨
- `docs/RAILWAY_SETUP_GUIDE.md` - Comprehensive setup guide (300+ lines)
- `.env.production.example` - Production environment template
- `scripts/test-railway.ts` - Connection test script (6 tests)
- `docs/TASK_1_STATUS.md` - This status file

### Modified 📝
- `prisma/schema.prisma` - Changed from SQLite to PostgreSQL
  ```diff
  - provider = "sqlite"
  - url      = "file:./dev.db"
  + provider = "postgresql"
  + url      = env("DATABASE_URL")
  ```

### Generated 🔨
- Prisma Client (PostgreSQL-compatible)
- Type definitions (`.prisma/client`)

---

## Ready to Proceed?

Once you complete the 7 manual steps and see:
```
🎉 All tests passed! Railway is ready for production.
```

Then we move to **Task 2: Prepare Vercel Deployment** 🚀

---

**Last Updated:** 2025-01-XX  
**Status:** Waiting for manual Railway setup  
**Estimated Completion:** 15-30 minutes
