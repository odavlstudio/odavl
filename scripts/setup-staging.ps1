# Staging Environment Setup Script
# Run this to configure staging environment

Write-Host "==================================================" -ForegroundColor Cyan
Write-Host "ODAVL Studio - Staging Environment Setup" -ForegroundColor Cyan
Write-Host "==================================================" -ForegroundColor Cyan
Write-Host ""

# Check prerequisites
Write-Host "Checking prerequisites..." -ForegroundColor Yellow

# Check pnpm
if (!(Get-Command pnpm -ErrorAction SilentlyContinue)) {
    Write-Host "✗ pnpm not found. Please install pnpm first." -ForegroundColor Red
    exit 1
}
Write-Host "✓ pnpm found" -ForegroundColor Green

# Check Docker
if (!(Get-Command docker -ErrorAction SilentlyContinue)) {
    Write-Host "✗ Docker not found. Please install Docker first." -ForegroundColor Red
    exit 1
}
Write-Host "✓ Docker found" -ForegroundColor Green

# Check Node.js version
$nodeVersion = node --version
Write-Host "✓ Node.js version: $nodeVersion" -ForegroundColor Green

Write-Host ""

# Create staging environment file
Write-Host "Creating staging environment file..." -ForegroundColor Yellow

$envContent = @"
# Staging Environment Configuration
NODE_ENV=staging
PORT=3000

# Database (Staging)
DATABASE_URL=postgresql://postgres:postgres@localhost:5433/odavl_staging
DATABASE_POOL_MIN=2
DATABASE_POOL_MAX=10

# Authentication (Staging)
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")

# GitHub OAuth (Create staging app at https://github.com/settings/developers)
GITHUB_ID=your_staging_github_id
GITHUB_SECRET=your_staging_github_secret

# Google OAuth (Create staging app at https://console.cloud.google.com/)
GOOGLE_ID=your_staging_google_id
GOOGLE_SECRET=your_staging_google_secret

# Storage (Local for staging)
STORAGE_PROVIDER=local
LOCAL_STORAGE_PATH=.odavl-staging-storage

# Email (Mailtrap for staging)
SMTP_HOST=smtp.mailtrap.io
SMTP_PORT=2525
SMTP_USER=your_mailtrap_user
SMTP_PASSWORD=your_mailtrap_password
SMTP_FROM=staging@odavl.studio

# Monitoring (Staging Sentry project)
SENTRY_DSN=your_staging_sentry_dsn
SENTRY_ENVIRONMENT=staging
LOG_LEVEL=debug

# Backup
BACKUP_ENABLED=true
BACKUP_SCHEDULE="0 3 * * *"
BACKUP_RETENTION_DAYS=3
BACKUP_RETENTION_WEEKS=2
BACKUP_RETENTION_MONTHS=1

# API
API_URL=http://localhost:3000/api/v1
API_RATE_LIMIT=500
API_TIMEOUT=30000
"@

$envPath = "apps/studio-hub/.env.staging"
$envContent | Out-File -FilePath $envPath -Encoding UTF8
Write-Host "✓ Created $envPath" -ForegroundColor Green

Write-Host ""

# Start staging database
Write-Host "Starting staging PostgreSQL database..." -ForegroundColor Yellow

docker run -d `
    --name postgres-staging `
    -e POSTGRES_USER=postgres `
    -e POSTGRES_PASSWORD=postgres `
    -e POSTGRES_DB=odavl_staging `
    -p 5433:5432 `
    --restart unless-stopped `
    postgres:15-alpine

if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ Staging database started on port 5433" -ForegroundColor Green
} else {
    Write-Host "Database may already be running. Checking..." -ForegroundColor Yellow
    docker ps --filter "name=postgres-staging" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
}

Write-Host ""
Write-Host "Waiting for database to be ready..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

# Install dependencies
Write-Host "Installing dependencies..." -ForegroundColor Yellow
pnpm install --frozen-lockfile

if ($LASTEXITCODE -ne 0) {
    Write-Host "✗ Failed to install dependencies" -ForegroundColor Red
    exit 1
}
Write-Host "✓ Dependencies installed" -ForegroundColor Green

Write-Host ""

# Apply database migrations
Write-Host "Applying database migrations..." -ForegroundColor Yellow
Set-Location apps/studio-hub
$env:DATABASE_URL = "postgresql://postgres:postgres@localhost:5433/odavl_staging"
pnpm prisma db push

if ($LASTEXITCODE -ne 0) {
    Write-Host "✗ Failed to apply migrations" -ForegroundColor Red
    Set-Location ../..
    exit 1
}
Write-Host "✓ Migrations applied" -ForegroundColor Green

# Seed database
Write-Host "Seeding staging database..." -ForegroundColor Yellow
pnpm db:seed

if ($LASTEXITCODE -ne 0) {
    Write-Host "⚠ Warning: Failed to seed database" -ForegroundColor Yellow
} else {
    Write-Host "✓ Database seeded" -ForegroundColor Green
}

Set-Location ../..

Write-Host ""

# Build packages
Write-Host "Building packages..." -ForegroundColor Yellow
pnpm build

if ($LASTEXITCODE -ne 0) {
    Write-Host "✗ Failed to build packages" -ForegroundColor Red
    exit 1
}
Write-Host "✓ Packages built" -ForegroundColor Green

Write-Host ""
Write-Host "==================================================" -ForegroundColor Cyan
Write-Host "Staging Environment Setup Complete!" -ForegroundColor Green
Write-Host "==================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Configure OAuth apps for staging:"
Write-Host "   - GitHub: https://github.com/settings/developers"
Write-Host "   - Google: https://console.cloud.google.com/"
Write-Host ""
Write-Host "2. Update $envPath with your OAuth credentials"
Write-Host ""
Write-Host "3. Start staging server:"
Write-Host "   cd apps/studio-hub"
Write-Host "   pnpm dev"
Write-Host ""
Write-Host "4. Access staging at: http://localhost:3000"
Write-Host ""
Write-Host "5. Check health: http://localhost:3000/api/health"
Write-Host ""
