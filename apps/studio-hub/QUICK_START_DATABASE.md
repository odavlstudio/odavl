# ⚡ Quick Start: Database Setup

**Current Status**: SQLite → PostgreSQL migration required  
**Location**: `apps/studio-hub/`  
**Time Required**: ~10 minutes

---

## 🚀 One-Command Setup

```powershell
.\setup-database.ps1
```

**What it does**:
1. Detects current database (SQLite)
2. Asks: Docker or Native PostgreSQL?
3. Configures PostgreSQL automatically
4. Updates `.env.local`
5. Runs `pnpm db:generate && pnpm db:push && pnpm db:seed`
6. Offers to open Prisma Studio

---

## 📋 Manual Commands (if script fails)

### Option 1: Docker
```powershell
# Start PostgreSQL
docker run --name odavl-postgres `
  -e POSTGRES_PASSWORD=postgres `
  -e POSTGRES_DB=odavl_hub `
  -p 5432:5432 `
  -d postgres:15-alpine

# Update .env.local
# DATABASE_URL="postgresql://postgres:postgres@localhost:5432/odavl_hub?schema=public"

# Apply migrations
pnpm db:generate
pnpm db:push
pnpm db:seed
```

### Option 2: Native PostgreSQL
```powershell
# Install
winget install PostgreSQL.PostgreSQL

# Create database
psql -U postgres -c "CREATE DATABASE odavl_hub;"

# Update .env.local
# DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@localhost:5432/odavl_hub?schema=public"

# Apply migrations
pnpm db:generate
pnpm db:push
pnpm db:seed
```

---

## ✅ Verification

```powershell
# Open Prisma Studio
pnpm db:studio

# Should show:
# - 1 organization (demo-org)
# - 1 user (demo@odavl.studio)
# - 1 project (Demo Project)
# - Sample Insight/Autopilot/Guardian data
```

---

## 🔧 Troubleshooting

### Docker not found
```powershell
# Download and install:
# https://www.docker.com/products/docker-desktop/
# Then restart computer and run script again
```

### Connection refused
```powershell
# Check if PostgreSQL is running
docker ps  # for Docker
Get-Service postgresql*  # for native
```

### Database already exists
```powershell
# Script will ask if you want to recreate
# Choose 'y' for fresh start or 'n' to keep existing
```

---

## 📊 Current Progress

- ✅ **Phase 1.0**: TypeScript (0 errors)
- 🔄 **Phase 1.1**: Database Setup (IN PROGRESS)
- ⏳ **Phase 1.2**: OAuth Configuration
- ⏳ **Phase 1.3**: Environment Variables
- ⏳ **Phase 1.4**: TODO Implementations

**Next**: After database setup → OAuth (GitHub + Google)

---

## 🎯 Expected Outcome

After running `setup-database.ps1`:
- PostgreSQL 15 running on `localhost:5432`
- Database `odavl_hub` created
- Schema applied via Prisma
- Demo data seeded
- Ready for OAuth setup

**Estimated Time**: 5-10 minutes (depending on Docker/native choice)
