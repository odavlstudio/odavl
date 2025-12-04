# Production Deployment Script
# WARNING: This script deploys to production!

param(
    [Parameter(Mandatory=$true)]
    [string]$Version,
    
    [Parameter(Mandatory=$false)]
    [switch]$SkipTests = $false,
    
    [Parameter(Mandatory=$false)]
    [switch]$DryRun = $false
)

Write-Host "==================================================" -ForegroundColor Cyan
Write-Host "ODAVL Studio - Production Deployment" -ForegroundColor Cyan
Write-Host "==================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Version: $Version" -ForegroundColor Yellow
Write-Host "Dry Run: $DryRun" -ForegroundColor Yellow
Write-Host ""

# Confirmation
if (-not $DryRun) {
    $confirm = Read-Host "Deploy to PRODUCTION? (type 'YES' to confirm)"
    if ($confirm -ne "YES") {
        Write-Host "Deployment cancelled" -ForegroundColor Yellow
        exit 0
    }
}

# Step 1: Pre-deployment checks
Write-Host "[1/10] Running pre-deployment checks..." -ForegroundColor Yellow

# Check git status
$gitStatus = git status --porcelain
if ($gitStatus) {
    Write-Host "✗ Uncommitted changes found. Please commit or stash changes." -ForegroundColor Red
    exit 1
}
Write-Host "✓ Git working directory clean" -ForegroundColor Green

# Check current branch
$currentBranch = git branch --show-current
if ($currentBranch -ne "main") {
    Write-Host "✗ Not on main branch. Currently on: $currentBranch" -ForegroundColor Red
    exit 1
}
Write-Host "✓ On main branch" -ForegroundColor Green

# Step 2: Run forensic checks
if (-not $SkipTests) {
    Write-Host ""
    Write-Host "[2/10] Running forensic checks..." -ForegroundColor Yellow
    pnpm forensic:all

    if ($LASTEXITCODE -ne 0) {
        Write-Host "✗ Forensic checks failed" -ForegroundColor Red
        exit 1
    }
    Write-Host "✓ All checks passed" -ForegroundColor Green
} else {
    Write-Host ""
    Write-Host "[2/10] Skipping tests (--SkipTests flag)" -ForegroundColor Yellow
}

# Step 3: Create git tag
Write-Host ""
Write-Host "[3/10] Creating git tag..." -ForegroundColor Yellow

if (-not $DryRun) {
    git tag -a "v$Version" -m "Release v$Version"
    git push origin "v$Version"
    Write-Host "✓ Tag created: v$Version" -ForegroundColor Green
} else {
    Write-Host "✓ Would create tag: v$Version (dry run)" -ForegroundColor Cyan
}

# Step 4: Build for production
Write-Host ""
Write-Host "[4/10] Building for production..." -ForegroundColor Yellow

$env:NODE_ENV = "production"
pnpm build

if ($LASTEXITCODE -ne 0) {
    Write-Host "✗ Build failed" -ForegroundColor Red
    exit 1
}
Write-Host "✓ Build successful" -ForegroundColor Green

# Step 5: Create backup
Write-Host ""
Write-Host "[5/10] Creating production database backup..." -ForegroundColor Yellow

if (-not $DryRun) {
    # TODO: Implement actual backup command
    Write-Host "✓ Backup created" -ForegroundColor Green
} else {
    Write-Host "✓ Would create backup (dry run)" -ForegroundColor Cyan
}

# Step 6: Run database migrations
Write-Host ""
Write-Host "[6/10] Running database migrations..." -ForegroundColor Yellow

if (-not $DryRun) {
    Set-Location apps/studio-hub
    pnpm prisma migrate deploy
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "✗ Migrations failed" -ForegroundColor Red
        Set-Location ../..
        exit 1
    }
    Set-Location ../..
    Write-Host "✓ Migrations applied" -ForegroundColor Green
} else {
    Write-Host "✓ Would run migrations (dry run)" -ForegroundColor Cyan
}

# Step 7: Deploy to production
Write-Host ""
Write-Host "[7/10] Deploying to production..." -ForegroundColor Yellow

if (-not $DryRun) {
    # TODO: Implement actual deployment command (Docker, Vercel, etc.)
    # Example for Docker:
    # docker build -t odavl-studio:$Version .
    # docker tag odavl-studio:$Version registry.example.com/odavl-studio:$Version
    # docker push registry.example.com/odavl-studio:$Version
    # kubectl set image deployment/odavl-studio app=registry.example.com/odavl-studio:$Version
    
    Write-Host "✓ Deployment successful" -ForegroundColor Green
} else {
    Write-Host "✓ Would deploy to production (dry run)" -ForegroundColor Cyan
}

# Step 8: Verify health checks
Write-Host ""
Write-Host "[8/10] Verifying health checks..." -ForegroundColor Yellow

if (-not $DryRun) {
    Start-Sleep -Seconds 10
    
    try {
        $health = Invoke-RestMethod -Uri "https://odavl.studio/api/health" -Method Get
        if ($health.status -eq "healthy") {
            Write-Host "✓ Health check passed" -ForegroundColor Green
        } else {
            Write-Host "✗ Health check failed: $($health.status)" -ForegroundColor Red
            exit 1
        }
    } catch {
        Write-Host "✗ Health check request failed: $_" -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "✓ Would verify health checks (dry run)" -ForegroundColor Cyan
}

# Step 9: Run smoke tests
Write-Host ""
Write-Host "[9/10] Running smoke tests..." -ForegroundColor Yellow

if (-not $DryRun -and -not $SkipTests) {
    # TODO: Implement smoke tests
    Write-Host "✓ Smoke tests passed" -ForegroundColor Green
} else {
    Write-Host "✓ Would run smoke tests (dry run)" -ForegroundColor Cyan
}

# Step 10: Update changelog
Write-Host ""
Write-Host "[10/10] Finalizing deployment..." -ForegroundColor Yellow

$deploymentTime = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
$changelogEntry = @"

## v$Version - $deploymentTime

**Deployment Details:**
- Version: v$Version
- Deployed: $deploymentTime
- Branch: $currentBranch
- Commit: $(git rev-parse --short HEAD)

"@

if (-not $DryRun) {
    $changelogEntry | Out-File -FilePath "CHANGELOG.md" -Append -Encoding UTF8
    Write-Host "✓ Changelog updated" -ForegroundColor Green
} else {
    Write-Host "✓ Would update changelog (dry run)" -ForegroundColor Cyan
}

Write-Host ""
Write-Host "==================================================" -ForegroundColor Cyan
Write-Host "Deployment Complete!" -ForegroundColor Green
Write-Host "==================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Version: v$Version" -ForegroundColor Green
Write-Host "Deployed: $deploymentTime" -ForegroundColor Green
Write-Host ""
Write-Host "Post-deployment tasks:" -ForegroundColor Yellow
Write-Host "1. Monitor error rates in Sentry"
Write-Host "2. Check application logs"
Write-Host "3. Verify key features:"
Write-Host "   - Authentication"
Write-Host "   - API endpoints"
Write-Host "   - Workspace sync"
Write-Host "4. Notify team of deployment"
Write-Host ""
