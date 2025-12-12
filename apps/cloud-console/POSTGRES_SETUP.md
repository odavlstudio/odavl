# 🚀 PostgreSQL Setup Guide for ODAVL Cloud Console

**Status**: Docker Desktop not detected  
**Date**: December 8, 2025

---

## Option 1: Start Docker Desktop (Recommended)

### Steps:
1. **Start Docker Desktop**:
   - Open Docker Desktop application
   - Wait for "Docker Desktop is running" status

2. **Run setup script**:
   ```powershell
   cd apps/cloud-console
   .\setup-postgres.ps1 -UseDocker
   ```

### What the script does:
- ✅ Creates PostgreSQL 15 container (`odavl-postgres`)
- ✅ Exposes port 5432
- ✅ Sets credentials: `postgres:postgres`
- ✅ Updates `.env.local` with `DATABASE_URL`
- ✅ Runs `pnpm prisma db push` (apply schema)
- ✅ Runs `pnpm prisma generate` (generate client)
- ✅ Runs `pnpm db:seed` (seed demo data)

---

## Option 2: Use Local PostgreSQL Installation

### Prerequisites:
- PostgreSQL 15+ installed locally
- Service running on port 5432

### Steps:
1. **Verify PostgreSQL is running**:
   ```powershell
   Test-NetConnection -ComputerName localhost -Port 5432
   ```

2. **Create database**:
   ```sql
   createdb odavl_cloud
   ```

3. **Run setup script**:
   ```powershell
   cd apps/cloud-console
   .\setup-postgres.ps1 -UseLocal
   ```

---

## Option 3: Manual Setup (No Script)

### Steps:

1. **Start Docker container**:
   ```powershell
   docker run -d `
     --name odavl-postgres `
     -e POSTGRES_PASSWORD=postgres `
     -e POSTGRES_DB=odavl_cloud `
     -p 5432:5432 `
     postgres:15-alpine
   ```

2. **Wait for startup**:
   ```powershell
   Start-Sleep -Seconds 15
   ```

3. **Verify container is running**:
   ```powershell
   docker ps | Select-String odavl-postgres
   ```

4. **Update `.env.local`** (in `apps/cloud-console/`):
   ```env
   DATABASE_URL="postgresql://postgres:postgres@localhost:5432/odavl_cloud?schema=public"
   ```

5. **Push schema**:
   ```powershell
   cd apps/cloud-console
   pnpm prisma db push
   ```

6. **Generate Prisma client**:
   ```powershell
   pnpm prisma generate
   ```

7. **Seed database** (optional):
   ```powershell
   pnpm db:seed
   ```

8. **Verify connection**:
   ```powershell
   pnpm prisma studio
   ```
   Open http://localhost:5555 to view data

---

## Verification Checklist

After setup, verify:

- [ ] **Docker container running**:
  ```powershell
  docker ps | Select-String odavl-postgres
  # Expected: "Up X seconds" or "Up X minutes"
  ```

- [ ] **Database connection works**:
  ```powershell
  cd apps/cloud-console
  pnpm prisma studio
  # Should open browser at http://localhost:5555
  ```

- [ ] **TypeScript errors gone**:
  ```powershell
  cd apps/cloud-console
  pnpm typecheck
  # Expected: "Found 0 errors"
  ```

- [ ] **Tables exist**:
  ```powershell
  docker exec -it odavl-postgres psql -U postgres -d odavl_cloud -c "\dt"
  # Expected: List of 13 tables
  ```

- [ ] **Seed data loaded**:
  ```powershell
  docker exec -it odavl-postgres psql -U postgres -d odavl_cloud -c "SELECT COUNT(*) FROM users;"
  # Expected: 2 users (demo@odavl.studio, admin@odavl.studio)
  ```

---

## Seed Data Summary

The `pnpm db:seed` command creates:

### **Users (2)**:
- `demo@odavl.studio` (Demo User)
- `admin@odavl.studio` (Admin User)

### **Organizations (2)**:
- **Demo Organization** (`demo-org`, PRO tier)
  - Owner: Demo User
- **Enterprise Corp** (`enterprise-corp`, ENTERPRISE tier)
  - Admin: Admin User

### **Projects (5)**:
- TypeScript E-Commerce App (demo-org)
- Python ML Pipeline (demo-org)
- React Dashboard (demo-org)
- Next.js Blog (enterprise-corp)
- Node.js API Gateway (enterprise-corp)

### **Analyses (15)** - Insight scan results with issues
### **Autopilot Runs (8)** - Fix history with diffs
### **Guardian Tests (10)** - Accessibility/performance audits
### **Subscriptions (2)** - Stripe subscription records

**Total**: ~40 records across 13 tables

---

## Troubleshooting

### Issue: "Docker is not running"
**Solution**: Start Docker Desktop, wait for status bar to show "Docker Desktop is running"

### Issue: "Port 5432 is already in use"
**Solutions**:
1. Check if another PostgreSQL is running:
   ```powershell
   Get-Process -Name postgres -ErrorAction SilentlyContinue
   ```
2. Stop existing PostgreSQL:
   ```powershell
   Stop-Service postgresql-x64-15  # Adjust service name
   ```
3. Or use a different port:
   ```powershell
   .\setup-postgres.ps1 -Port 5433
   ```

### Issue: "Permission denied" (Windows)
**Solution**: Run PowerShell as Administrator

### Issue: "Prisma Client validation failed"
**Solution**: Delete and regenerate:
```powershell
Remove-Item -Recurse node_modules/.prisma
pnpm prisma generate
```

### Issue: "Connection timeout"
**Solution**: Wait longer (container may need 30s on first run):
```powershell
Start-Sleep -Seconds 30
pnpm prisma db push
```

---

## Useful Commands

### **Container Management**:
```powershell
# View logs
docker logs odavl-postgres

# Stop container
docker stop odavl-postgres

# Start container
docker start odavl-postgres

# Remove container (⚠️ deletes all data)
docker rm -f odavl-postgres

# Connect to PostgreSQL CLI
docker exec -it odavl-postgres psql -U postgres -d odavl_cloud
```

### **Database Operations**:
```powershell
# Open Prisma Studio (GUI)
pnpm prisma studio

# Reset database (⚠️ deletes all data)
pnpm prisma migrate reset

# View schema diff
pnpm prisma migrate diff --from-schema-datamodel prisma/schema.prisma --to-schema-datasource "postgresql://postgres:postgres@localhost:5432/odavl_cloud"

# Export data
docker exec -it odavl-postgres pg_dump -U postgres odavl_cloud > backup.sql

# Import data
docker exec -i odavl-postgres psql -U postgres odavl_cloud < backup.sql
```

---

## Next Steps After Setup

Once PostgreSQL is running:

1. **Restart TypeScript server** (if VS Code is open):
   - `Ctrl+Shift+P` → "TypeScript: Restart TS Server"

2. **Verify TypeScript errors gone**:
   ```powershell
   cd apps/cloud-console
   pnpm typecheck
   # Expected: "Found 0 errors"
   ```

3. **Start development server**:
   ```powershell
   pnpm dev
   ```

4. **Test login**:
   - Visit http://localhost:3003
   - Sign in with: `demo@odavl.studio` (no password needed for seed users)
   - Or register a new account

5. **Test API endpoints**:
   ```powershell
   # Health check
   curl http://localhost:3003/api/health

   # Get organizations (requires auth)
   curl http://localhost:3003/api/organizations -H "Cookie: next-auth.session-token=..."
   ```

---

## Production Deployment Notes

For production:

1. **Use managed PostgreSQL**:
   - Supabase (free tier: 500MB)
   - Neon (free tier: 10GB)
   - Railway (free trial)
   - AWS RDS, Azure Database, Google Cloud SQL

2. **Update environment variables**:
   ```env
   DATABASE_URL="postgresql://user:pass@prod-host:5432/dbname?sslmode=require"
   ```

3. **Run migrations** (not db:push):
   ```powershell
   pnpm prisma migrate deploy
   ```

4. **Enable connection pooling**:
   ```env
   DATABASE_URL="postgresql://...?pgbouncer=true&connection_limit=10"
   ```

5. **Set up backups**:
   - Daily automated backups
   - Point-in-time recovery (PITR)
   - 30-day retention minimum

---

## Support

If you encounter issues:

1. Check Docker Desktop status
2. Review container logs: `docker logs odavl-postgres`
3. Verify `.env.local` has correct `DATABASE_URL`
4. Try manual steps (Option 3)
5. Open GitHub issue with error logs

---

**Created**: December 8, 2025  
**Version**: 1.0.0  
**Part of**: Phase 13 - Production Hardening (Batch 1)
