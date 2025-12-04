# Railway PostgreSQL Setup Guide

## Step 1: Create Railway Account

1. Visit: https://railway.app/
2. Click "Start a New Project"
3. Sign in with GitHub
4. Authorize Railway to access your account

## Step 2: Deploy PostgreSQL Database

1. Click "New Project"
2. Select "Provision PostgreSQL"
3. Wait for deployment (~1 minute)
4. Database will be created with:
   - ✅ 500MB storage
   - ✅ Auto-backups
   - ✅ High availability
   - ✅ SSL enabled

## Step 3: Get Database Credentials

1. Click on PostgreSQL service
2. Go to "Variables" tab
3. Find these variables:
   ```
   PGHOST
   PGPORT
   PGUSER
   PGPASSWORD
   PGDATABASE
   DATABASE_URL (complete connection string)
   ```

4. Copy the `DATABASE_URL` - should look like:
   ```
   postgresql://postgres:PASSWORD@containers-us-west-123.railway.app:7654/railway
   ```

## Step 4: Update Local Environment

```bash
# Create .env.production in insight/cloud
cd odavl-studio/insight/cloud

# Add to .env.production:
DATABASE_URL="postgresql://postgres:PASSWORD@host:port/railway"
JWT_SECRET="your-super-secret-production-key-min-32-chars"
NODE_ENV="production"
```

## Step 5: Update Prisma Schema

Already done! ✅ Schema changed from SQLite to PostgreSQL.

## Step 6: Generate Migration

```powershell
# In insight/cloud directory
cd odavl-studio/insight/cloud

# Create initial migration
pnpm prisma migrate dev --name init_postgresql

# This creates: prisma/migrations/XXXXXX_init_postgresql/
```

## Step 7: Deploy Migration to Railway

```powershell
# Set DATABASE_URL from Railway
$env:DATABASE_URL = "postgresql://postgres:PASSWORD@host:port/railway"

# Deploy migration to production
pnpm prisma migrate deploy

# Expected output:
# ✓ Applied migration: 20251123_init_postgresql
```

## Step 8: Verify Connection

```powershell
# Test connection with Prisma Studio
DATABASE_URL="postgresql://..." pnpm prisma studio

# Should open browser with empty database tables:
# - User
# - Session  
# - Subscription
# - UsageRecord
```

## Step 9: Generate Prisma Client

```bash
# Generate client for PostgreSQL
pnpm prisma generate

# This updates @prisma/client types
```

## Step 10: Test with Script

Create `scripts/test-railway.ts`:
```typescript
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🔍 Testing Railway connection...\n');
  
  try {
    await prisma.$connect();
    console.log('✅ Connected to Railway PostgreSQL');
    
    // Test query
    const userCount = await prisma.user.count();
    console.log(`📊 Users in database: ${userCount}`);
    
    // Test create
    const testUser = await prisma.user.create({
      data: {
        email: 'railway-test@odavl.com',
        passwordHash: 'test-hash',
        name: 'Railway Test User',
        role: 'USER',
      },
    });
    console.log(`✅ Created test user: ${testUser.id}`);
    
    // Cleanup
    await prisma.user.delete({ where: { id: testUser.id } });
    console.log('✅ Cleanup successful');
    
  } catch (error) {
    console.error('❌ Railway test failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
```

Run test:
```bash
DATABASE_URL="postgresql://..." pnpm tsx scripts/test-railway.ts
```

Expected output:
```
🔍 Testing Railway connection...
✅ Connected to Railway PostgreSQL
📊 Users in database: 0
✅ Created test user: cm123abc456
✅ Cleanup successful
```

## Troubleshooting

### Error: Connection timeout
**Solution:** Add `?sslmode=require` to DATABASE_URL
```
postgresql://user:pass@host:port/db?sslmode=require
```

### Error: Authentication failed
**Solution:** Verify credentials from Railway dashboard

### Error: Database does not exist
**Solution:** Railway creates database automatically. Check PGDATABASE variable.

### Error: Too many connections
**Solution:** Use connection pooling:
```typescript
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL + '?connection_limit=5',
    },
  },
});
```

## Cost

Railway PostgreSQL:
- **Free Trial:** $5 credit (no credit card needed)
- **Developer Plan:** $5/month after trial
- **Pro Plan:** $20/month (if you need more)

For ODAVL Insight: Developer Plan ($5/month) is sufficient.

## Next Steps

After Railway setup complete:
1. ✅ PostgreSQL deployed
2. ✅ Migrations applied
3. ✅ Connection tested
4. → Task 2: Prepare Vercel deployment
5. → Task 3: Deploy to Vercel
6. → Task 4: Test production auth

---

**Status:** Ready for production! 🚀
