# =====================================
# ODAVL Studio - Staging Deployment Script (PowerShell)
# =====================================
# Automated deployment to staging environment
# Usage: .\scripts\deploy-staging.ps1

param(
    [switch]$SkipTests = $false,
    [switch]$SkipBackup = $false,
    [string]$StagingUrl = "https://staging.odavl.studio"
)

$ErrorActionPreference = "Stop"

Write-Host "🚀 Starting ODAVL Studio staging deployment..." -ForegroundColor Cyan

# Configuration
$DB_BACKUP_DIR = ".\backups\staging"
$TIMESTAMP = Get-Date -Format "yyyyMMdd_HHmmss"

# Functions
function Write-Success {
    param([string]$Message)
    Write-Host "✓ $Message" -ForegroundColor Green
}

function Write-Info {
    param([string]$Message)
    Write-Host "[INFO] $Message" -ForegroundColor Cyan
}

function Write-Warning {
    param([string]$Message)
    Write-Host "[WARN] $Message" -ForegroundColor Yellow
}

function Write-Error {
    param([string]$Message)
    Write-Host "[ERROR] $Message" -ForegroundColor Red
}

# Step 1: Pre-deployment checks
Write-Info "Step 1/9: Running pre-deployment checks..."

if (-not (Test-Path "apps\studio-hub\.env.staging")) {
    Write-Error ".env.staging not found. Copy from .env.staging.example"
    exit 1
}

if (-not (Get-Command pnpm -ErrorAction SilentlyContinue)) {
    Write-Error "pnpm not installed. Install with: npm install -g pnpm"
    exit 1
}

Write-Success "Pre-deployment checks passed"

# Step 2: Install dependencies
Write-Info "Step 2/9: Installing dependencies..."
pnpm install --frozen-lockfile
if ($LASTEXITCODE -ne 0) {
    Write-Error "Failed to install dependencies"
    exit 1
}
Write-Success "Dependencies installed"

# Step 3: Run linter
Write-Info "Step 3/9: Running linter..."
pnpm lint
if ($LASTEXITCODE -ne 0) {
    Write-Error "Linting failed. Fix errors before deploying."
    exit 1
}
Write-Success "Linting passed"

# Step 4: Run type check
Write-Info "Step 4/9: Running TypeScript type check..."
pnpm typecheck
if ($LASTEXITCODE -ne 0) {
    Write-Error "Type check failed. Fix type errors before deploying."
    exit 1
}
Write-Success "Type check passed"

# Step 5: Run tests (optional)
if (-not $SkipTests) {
    Write-Info "Step 5/9: Running tests..."
    pnpm test:coverage
    if ($LASTEXITCODE -ne 0) {
        Write-Error "Tests failed. Fix failing tests before deploying."
        exit 1
    }
    Write-Success "Tests passed"
} else {
    Write-Warning "Step 5/9: Skipping tests (--SkipTests flag provided)"
}

# Step 6: Backup staging database (optional)
if (-not $SkipBackup) {
    Write-Info "Step 6/9: Backing up staging database..."
    
    if (-not (Test-Path $DB_BACKUP_DIR)) {
        New-Item -ItemType Directory -Path $DB_BACKUP_DIR -Force | Out-Null
    }

    $STAGING_DATABASE_URL = $env:STAGING_DATABASE_URL
    if ($STAGING_DATABASE_URL) {
        try {
            $backupFile = "$DB_BACKUP_DIR\staging_backup_$TIMESTAMP.sql"
            pg_dump $STAGING_DATABASE_URL > $backupFile 2>$null
            Write-Success "Database backup saved: $backupFile"
        } catch {
            Write-Warning "Database backup failed (continuing anyway)"
        }
    } else {
        Write-Warning "STAGING_DATABASE_URL not set, skipping database backup"
    }
} else {
    Write-Warning "Step 6/9: Skipping database backup (--SkipBackup flag provided)"
}

# Step 7: Run database migrations
Write-Info "Step 7/9: Running database migrations..."
Push-Location apps\studio-hub
try {
    pnpm prisma migrate deploy
    if ($LASTEXITCODE -ne 0) {
        Write-Error "Database migration failed"
        
        # Attempt restore from backup
        $latestBackup = Get-ChildItem "$DB_BACKUP_DIR\staging_backup_*.sql" | Sort-Object LastWriteTime -Descending | Select-Object -First 1
        if ($latestBackup) {
            Write-Info "Restoring database from backup: $($latestBackup.Name)"
            psql $env:STAGING_DATABASE_URL < $latestBackup.FullName
            Write-Success "Database restored from backup"
        }
        
        Pop-Location
        exit 1
    }
    Write-Success "Database migrations completed"
} finally {
    Pop-Location
}

# Step 8: Build application
Write-Info "Step 8/9: Building application..."
pnpm build
if ($LASTEXITCODE -ne 0) {
    Write-Error "Build failed. Check build logs for errors."
    exit 1
}
Write-Success "Application built successfully"

# Step 9: Deploy to staging
Write-Info "Step 9/9: Deploying to staging environment..."

if (Get-Command vercel -ErrorAction SilentlyContinue) {
    Push-Location apps\studio-hub
    try {
        vercel --prod --env-file .env.staging
        if ($LASTEXITCODE -ne 0) {
            Write-Error "Vercel deployment failed"
            Pop-Location
            exit 1
        }
        Write-Success "Deployed to Vercel staging"
    } finally {
        Pop-Location
    }
} else {
    Write-Warning "Vercel CLI not installed. Skipping deployment."
    Write-Warning "Install with: npm install -g vercel"
}

# Post-deployment verification
Write-Info "Verifying deployment..."
Start-Sleep -Seconds 10

try {
    $response = Invoke-WebRequest -Uri "$StagingUrl/api/health" -UseBasicParsing
    if ($response.StatusCode -eq 200) {
        Write-Success "Health check passed ($StagingUrl/api/health)"
    } else {
        Write-Error "Health check failed (HTTP $($response.StatusCode))"
        exit 1
    }
} catch {
    Write-Error "Health check failed: $_"
    exit 1
}

# Success message
Write-Host ""
Write-Host "======================================" -ForegroundColor Green
Write-Host "✅ Staging deployment complete!" -ForegroundColor Green
Write-Host "======================================" -ForegroundColor Green
Write-Host ""
Write-Host "🔗 Staging URL: $StagingUrl" -ForegroundColor Cyan
Write-Host "📊 Health check: $StagingUrl/api/health" -ForegroundColor Cyan
Write-Host "📁 Database backup: $DB_BACKUP_DIR\staging_backup_$TIMESTAMP.sql" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Verify deployment: $StagingUrl"
Write-Host "2. Run smoke tests: pnpm test:e2e"
Write-Host "3. Monitor logs: vercel logs"
Write-Host ""
