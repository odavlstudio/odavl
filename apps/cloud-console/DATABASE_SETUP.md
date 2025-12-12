# Database Setup Guide - ODAVL Cloud Console

## Option 1: Docker PostgreSQL (Recommended)

### 1. Start Docker Desktop
- Open Docker Desktop application
- Wait for Docker to fully start (check system tray icon)

### 2. Run PostgreSQL Container
```powershell
# Create and start PostgreSQL container
docker run -d `
  --name odavl-postgres `
  -e POSTGRES_PASSWORD=postgres `
  -e POSTGRES_DB=odavl_cloud `
  -p 5432:5432 `
  postgres:16-alpine

# Verify container is running
docker ps

# View logs
docker logs odavl-postgres
```

### 3. Test Connection
```powershell
# Using psql (if installed)
psql postgresql://postgres:postgres@localhost:5432/odavl_cloud

# Or using Docker exec
docker exec -it odavl-postgres psql -U postgres -d odavl_cloud
```

---

## Option 2: Local PostgreSQL Installation

### 1. Download PostgreSQL
- Visit: https://www.postgresql.org/download/windows/
- Install PostgreSQL 16 with default settings
- Set password: `postgres`
- Port: `5432`

### 2. Create Database
```sql
CREATE DATABASE odavl_cloud;
```

### 3. Update .env.local
```env
DATABASE_URL="postgresql://postgres:your-password@localhost:5432/odavl_cloud?schema=public"
```

---

## After Database is Ready

### 1. Push Prisma Schema
```powershell
cd apps/cloud-console
pnpm db:push
```

This will:
- Create all 10 tables (Users, Organizations, Projects, etc.)
- Set up indexes and relationships
- Generate Prisma Client

### 2. Seed Demo Data
```powershell
pnpm db:seed
```

This will create:
- ✅ 2 users (demo@odavl.studio, admin@odavl.studio)
- ✅ 2 organizations (Demo Org, Enterprise Corp)
- ✅ 3 projects (Web App, API Backend, Mobile App)
- ✅ 5 error signatures (TypeScript, security, performance issues)
- ✅ 3 fix attestations (Autopilot runs)
- ✅ 1 audit result with 3 issues (Guardian test)
- ✅ 2 subscriptions (PRO, ENTERPRISE tiers)
- ✅ 3 usage events (API calls)
- ✅ 1 API key

### 3. Open Prisma Studio (Database UI)
```powershell
pnpm db:studio
```

Opens browser at http://localhost:5555 with visual database explorer.

---

## Troubleshooting

### "Connection refused" error
```powershell
# Check if PostgreSQL is running
docker ps

# Restart container
docker restart odavl-postgres

# Check logs
docker logs odavl-postgres
```

### "Database does not exist" error
```powershell
# Create database manually
docker exec -it odavl-postgres psql -U postgres -c "CREATE DATABASE odavl_cloud;"
```

### Port 5432 already in use
```powershell
# Find process using port 5432
netstat -ano | findstr :5432

# Stop existing PostgreSQL service
Stop-Service postgresql-x64-16

# Or use different port in .env.local
DATABASE_URL="postgresql://postgres:postgres@localhost:5433/odavl_cloud"
```

---

## Database Schema Overview

### 10 Tables Created:

1. **users** - User accounts (NextAuth integration)
2. **accounts** - OAuth provider accounts (GitHub, Google)
3. **sessions** - Active user sessions
4. **verification_tokens** - Email verification
5. **organizations** - Multi-tenant organizations
6. **organization_members** - User-org relationships with roles
7. **projects** - Code repositories linked to organizations
8. **error_signatures** - Insight error detection results
9. **fix_attestations** - Autopilot fix operation records
10. **audit_results** + **audit_issues** - Guardian website tests
11. **subscriptions** - Billing & usage limits (Stripe integration)
12. **usage_events** - API call tracking for billing
13. **api_keys** - Programmatic API access

### Key Relationships:
- User → Organizations (many-to-many via organization_members)
- Organization → Projects (one-to-many)
- Project → ErrorSignatures/FixAttestations/AuditResults (one-to-many)
- Organization → Subscription (one-to-one)

---

## Next Steps After Setup

1. ✅ **Database Ready**: All tables created and seeded
2. ✅ **Prisma Client Generated**: Available in `@prisma/client`
3. ✅ **Demo Data Available**: Login with demo@odavl.studio
4. 🔄 **API Integration**: Wire Prisma into `/api/analyze`, `/api/fix`, `/api/audit`
5. 🔄 **Authentication**: Connect NextAuth to database (Batch 4)
6. 🔄 **Billing**: Stripe webhooks and usage tracking (Batch 5)
