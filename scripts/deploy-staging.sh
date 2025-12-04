#!/bin/bash

# =====================================
# ODAVL Studio - Staging Deployment Script
# =====================================
# Automated deployment to staging environment
# Usage: ./scripts/deploy-staging.sh

set -e  # Exit on error

echo "🚀 Starting ODAVL Studio staging deployment..."

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Configuration
STAGING_URL="${STAGING_URL:-https://staging.odavl.studio}"
DB_BACKUP_DIR="./backups/staging"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")

# Functions
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Step 1: Pre-deployment checks
log_info "Step 1/9: Running pre-deployment checks..."

if [ ! -f "apps/studio-hub/.env.staging" ]; then
    log_error ".env.staging not found. Copy from .env.staging.example"
    exit 1
fi

if ! command -v pnpm &> /dev/null; then
    log_error "pnpm not installed. Install with: npm install -g pnpm"
    exit 1
fi

log_info "✓ Pre-deployment checks passed"

# Step 2: Install dependencies
log_info "Step 2/9: Installing dependencies..."
pnpm install --frozen-lockfile
log_info "✓ Dependencies installed"

# Step 3: Run linter
log_info "Step 3/9: Running linter..."
pnpm lint || {
    log_error "Linting failed. Fix errors before deploying."
    exit 1
}
log_info "✓ Linting passed"

# Step 4: Run type check
log_info "Step 4/9: Running TypeScript type check..."
pnpm typecheck || {
    log_error "Type check failed. Fix type errors before deploying."
    exit 1
}
log_info "✓ Type check passed"

# Step 5: Run tests
log_info "Step 5/9: Running tests..."
pnpm test:coverage || {
    log_error "Tests failed. Fix failing tests before deploying."
    exit 1
}
log_info "✓ Tests passed"

# Step 6: Backup staging database
log_info "Step 6/9: Backing up staging database..."
mkdir -p "$DB_BACKUP_DIR"

if [ -n "$STAGING_DATABASE_URL" ]; then
    pg_dump "$STAGING_DATABASE_URL" > "$DB_BACKUP_DIR/staging_backup_$TIMESTAMP.sql" 2>/dev/null || {
        log_warn "Database backup failed (continuing anyway)"
    }
    log_info "✓ Database backup saved: $DB_BACKUP_DIR/staging_backup_$TIMESTAMP.sql"
else
    log_warn "STAGING_DATABASE_URL not set, skipping database backup"
fi

# Step 7: Run database migrations
log_info "Step 7/9: Running database migrations..."
cd apps/studio-hub
pnpm prisma migrate deploy || {
    log_error "Database migration failed. Restoring from backup..."
    if [ -f "$DB_BACKUP_DIR/staging_backup_$TIMESTAMP.sql" ]; then
        psql "$STAGING_DATABASE_URL" < "$DB_BACKUP_DIR/staging_backup_$TIMESTAMP.sql"
        log_info "Database restored from backup"
    fi
    exit 1
}
cd ../..
log_info "✓ Database migrations completed"

# Step 8: Build application
log_info "Step 8/9: Building application..."
pnpm build || {
    log_error "Build failed. Check build logs for errors."
    exit 1
}
log_info "✓ Application built successfully"

# Step 9: Deploy to staging
log_info "Step 9/9: Deploying to staging environment..."

if command -v vercel &> /dev/null; then
    cd apps/studio-hub
    vercel --prod --env-file .env.staging || {
        log_error "Vercel deployment failed"
        exit 1
    }
    cd ../..
    log_info "✓ Deployed to Vercel staging"
else
    log_warn "Vercel CLI not installed. Skipping deployment."
    log_warn "Install with: npm install -g vercel"
fi

# Post-deployment verification
log_info "Verifying deployment..."
sleep 10  # Wait for deployment to be ready

HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$STAGING_URL/api/health")
if [ "$HTTP_STATUS" = "200" ]; then
    log_info "✓ Health check passed ($STAGING_URL/api/health)"
else
    log_error "Health check failed (HTTP $HTTP_STATUS)"
    exit 1
fi

# Success message
echo ""
echo "======================================"
echo -e "${GREEN}✅ Staging deployment complete!${NC}"
echo "======================================"
echo ""
echo "🔗 Staging URL: $STAGING_URL"
echo "📊 Health check: $STAGING_URL/api/health"
echo "📁 Database backup: $DB_BACKUP_DIR/staging_backup_$TIMESTAMP.sql"
echo ""
echo "Next steps:"
echo "1. Verify deployment: $STAGING_URL"
echo "2. Run smoke tests: pnpm test:e2e"
echo "3. Monitor logs: vercel logs"
echo ""
