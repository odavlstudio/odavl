#!/usr/bin/env pwsh
# ODAVL Insight Cloud - Pre-Deployment Validation
# Run this before deploying to Vercel

param(
    [switch]$Verbose
)

$ErrorActionPreference = "Stop"

Write-Host "`n🚀 ODAVL Insight Cloud - Pre-Deployment Validation`n" -ForegroundColor Cyan

$checks = @()
$warnings = @()
$validationErrors = @()

# Check 1: Cloud app directory exists
Write-Host "1. Checking cloud app directory..." -NoNewline
$cloudDir = "odavl-studio\insight\cloud"
if (Test-Path $cloudDir) {
    Write-Host " ✓" -ForegroundColor Green
    $checks += "Cloud directory exists"
}
else {
    Write-Host " ✗" -ForegroundColor Red
    $validationErrors += "Cloud directory not found: $cloudDir"
}

# Check 2: package.json exists
Write-Host "2. Checking package.json..." -NoNewline
$pkgJson = Join-Path $cloudDir "package.json"
if (Test-Path $pkgJson) {
    Write-Host " ✓" -ForegroundColor Green
    $checks += "package.json exists"
    
    # Verify dependencies
    $pkg = Get-Content $pkgJson | ConvertFrom-Json
    $required = @("next", "next-auth", "@prisma/client", "react")
    $missing = @()
    foreach ($dep in $required) {
        if (-not $pkg.dependencies.$dep) {
            $missing += $dep
        }
    }
    if ($missing.Count -gt 0) {
        $warnings += "Missing dependencies: $($missing -join ', ')"
    }
}
else {
    Write-Host " ✗" -ForegroundColor Red
    $validationErrors += "package.json not found"
}

# Check 3: Prisma schema exists
Write-Host "3. Checking Prisma schema..." -NoNewline
$prismaSchema = Join-Path $cloudDir "prisma\schema.prisma"
if (Test-Path $prismaSchema) {
    Write-Host " ✓" -ForegroundColor Green
    $checks += "Prisma schema exists"
    
    # Verify models
    $schema = Get-Content $prismaSchema -Raw
    $requiredModels = @("User", "Project", "InsightSnapshot", "Account", "Session")
    $missingModels = @()
    foreach ($model in $requiredModels) {
        if ($schema -notmatch "model $model") {
            $missingModels += $model
        }
    }
    if ($missingModels.Count -gt 0) {
        $validationErrors += "Missing models in schema: $($missingModels -join ', ')"
    }
}
else {
    Write-Host " ✗" -ForegroundColor Red
    $validationErrors += "Prisma schema not found"
}

# Check 4: API routes exist
Write-Host "4. Checking API routes..." -NoNewline
$appDir = Join-Path $cloudDir "app"
$apiDir = Join-Path $appDir "api"

# Check auth route (use -LiteralPath to handle brackets)
$authDir = Join-Path $apiDir "auth"
$nextauthDir = Join-Path $authDir "[...nextauth]"
$authRoute = Join-Path $nextauthDir "route.ts"

# Check snapshot route
$insightDir = Join-Path $apiDir "insight"
$snapshotDir = Join-Path $insightDir "snapshot"
$snapshotRoute = Join-Path $snapshotDir "route.ts"

$missingRoutes = @()
if (-not (Test-Path -LiteralPath $authRoute)) {
    $missingRoutes += "auth/[...nextauth]/route.ts"
}
if (-not (Test-Path -LiteralPath $snapshotRoute)) {
    $missingRoutes += "insight/snapshot/route.ts"
}

if ($missingRoutes.Count -eq 0) {
    Write-Host " ✓" -ForegroundColor Green
    $checks += "All required API routes exist"
}
else {
    Write-Host " ✗" -ForegroundColor Red
    $validationErrors += "Missing routes: $($missingRoutes -join ', ')"
}

# Check 5: vercel.json exists
Write-Host "5. Checking Vercel config..." -NoNewline
$vercelJson = Join-Path $cloudDir "vercel.json"
if (Test-Path $vercelJson) {
    Write-Host " ✓" -ForegroundColor Green
    $checks += "vercel.json exists"
    
    # Verify env variables defined
    $vercelConfig = Get-Content $vercelJson | ConvertFrom-Json
    $requiredEnvVars = @("NEXTAUTH_URL", "NEXTAUTH_SECRET", "GITHUB_ID", "GITHUB_SECRET", "GOOGLE_ID", "GOOGLE_SECRET")
    $missingEnvVars = @()
    foreach ($var in $requiredEnvVars) {
        if (-not $vercelConfig.env.$var) {
            $missingEnvVars += $var
        }
    }
    if ($missingEnvVars.Count -gt 0) {
        $warnings += "Missing env variables in vercel.json: $($missingEnvVars -join ', ')"
    }
}
else {
    Write-Host " ✗" -ForegroundColor Red
    $validationErrors += "vercel.json not found"
}

# Check 6: CLI auth commands exist
Write-Host "6. Checking CLI auth commands..." -NoNewline
$cliAuthFile = "apps\studio-cli\src\commands\insight-auth.ts"
if (Test-Path $cliAuthFile) {
    Write-Host " ✓" -ForegroundColor Green
    $checks += "CLI auth commands exist"
}
else {
    Write-Host " ✗" -ForegroundColor Red
    $validationErrors += "CLI auth file not found: $cliAuthFile"
}

# Check 7: Consent manager exists
Write-Host "7. Checking consent manager..." -NoNewline
$consentFile = "apps\studio-cli\src\utils\consent-manager.ts"
if (Test-Path $consentFile) {
    Write-Host " ✓" -ForegroundColor Green
    $checks += "Consent manager exists"
}
else {
    Write-Host " ✗" -ForegroundColor Red
    $validationErrors += "Consent manager not found: $consentFile"
}

# Check 8: Snapshot uploader exists
Write-Host "8. Checking snapshot uploader..." -NoNewline
$uploaderFile = "apps\studio-cli\src\utils\snapshot-uploader.ts"
if (Test-Path $uploaderFile) {
    Write-Host " ✓" -ForegroundColor Green
    $checks += "Snapshot uploader exists"
    
    # Check for placeholder URLs
    $uploaderContent = Get-Content $uploaderFile -Raw
    if ($uploaderContent -match "your-app\.vercel\.app") {
        $warnings += "Snapshot uploader still has placeholder URL (update after deployment)"
    }
}
else {
    Write-Host " ✗" -ForegroundColor Red
    $validationErrors += "Snapshot uploader not found: $uploaderFile"
}

# Check 9: Documentation exists
Write-Host "9. Checking documentation..." -NoNewline
$docs = @(
    "GETTING_STARTED_CLOUD.md",
    "ZCC_SPECIFICATION.md",
    "TASK_8_BETA_ONBOARDING_SUMMARY.md",
    "TASK_9_DEPLOYMENT_GUIDE.md"
)
$missingDocs = @()
foreach ($doc in $docs) {
    if (-not (Test-Path $doc)) {
        $missingDocs += $doc
    }
}
if ($missingDocs.Count -eq 0) {
    Write-Host " ✓" -ForegroundColor Green
    $checks += "All documentation exists"
}
else {
    Write-Host " ⚠" -ForegroundColor Yellow
    $warnings += "Missing docs: $($missingDocs -join ', ')"
}

# Check 10: CLI builds successfully
Write-Host "10. Testing CLI build..." -NoNewline
Push-Location "apps\studio-cli"
try {
    $buildOutput = pnpm build 2>&1 | Out-String
    if ($LASTEXITCODE -eq 0) {
        Write-Host " ✓" -ForegroundColor Green
        $checks += "CLI builds successfully"
    }
    else {
        Write-Host " ✗" -ForegroundColor Red
        $validationErrors += "CLI build failed"
        if ($Verbose) {
            Write-Host $buildOutput
        }
    }
}
finally {
    Pop-Location
}

# Summary
Write-Host "`n📊 Summary`n" -ForegroundColor Cyan

Write-Host "Passed: $($checks.Count)" -ForegroundColor Green
if ($checks.Count -gt 0) {
    foreach ($check in $checks) {
        Write-Host "  ✓ $check" -ForegroundColor Green
    }
}

if ($warnings.Count -gt 0) {
    Write-Host "`nWarnings: $($warnings.Count)" -ForegroundColor Yellow
    foreach ($warning in $warnings) {
        Write-Host "  ⚠ $warning" -ForegroundColor Yellow
    }
}

if ($validationErrors.Count -gt 0) {
    Write-Host "`nErrors: $($validationErrors.Count)" -ForegroundColor Red
    foreach ($err in $validationErrors) {
        Write-Host "  ✗ $err" -ForegroundColor Red
    }
    Write-Host "`n❌ Pre-deployment validation FAILED`n" -ForegroundColor Red
    exit 1
}
else {
    Write-Host "`n✅ Pre-deployment validation PASSED`n" -ForegroundColor Green
    Write-Host "Next steps:" -ForegroundColor Cyan
    Write-Host "  1. Deploy to Vercel: cd odavl-studio\insight\cloud && vercel" -ForegroundColor White
    Write-Host "  2. Create OAuth apps (see TASK_9_DEPLOYMENT_GUIDE.md)" -ForegroundColor White
    Write-Host "  3. Configure environment variables" -ForegroundColor White
    Write-Host "  4. Update CLI with live URL" -ForegroundColor White
    Write-Host "  5. Test end-to-end flow`n" -ForegroundColor White
    exit 0
}
