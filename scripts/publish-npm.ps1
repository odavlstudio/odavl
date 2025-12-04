#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Publish ODAVL packages to public npm registry
.DESCRIPTION
    Builds and publishes CLI and SDK packages to https://registry.npmjs.org
.EXAMPLE
    .\publish-npm.ps1
.EXAMPLE
    .\publish-npm.ps1 -DryRun
.NOTES
    Requires: npm authentication with 2FA enabled
#>

param(
    [switch]$DryRun,
    [switch]$SkipBuild,
    [switch]$SkipTests,
    [switch]$Force
)

$ErrorActionPreference = "Stop"
Set-StrictMode -Version Latest

# Colors
function Write-Success { Write-Host "✅ $args" -ForegroundColor Green }
function Write-Info { Write-Host "ℹ️  $args" -ForegroundColor Cyan }
function Write-Warning { Write-Host "⚠️  $args" -ForegroundColor Yellow }
function Write-Error { Write-Host "❌ $args" -ForegroundColor Red }

$registry = "https://registry.npmjs.org/"
$packages = @(
    @{ Name = "CLI"; Path = "apps/studio-cli"; Package = "@odavl-studio/cli" }
    @{ Name = "SDK"; Path = "packages/sdk"; Package = "@odavl-studio/sdk" }
)

Write-Info "ODAVL NPM Publishing Script"
Write-Info "Registry: $registry"
if ($DryRun) {
    Write-Warning "DRY RUN MODE - No actual publishing"
}
Write-Info ""

# Pre-flight checks
Write-Info "Running pre-flight checks..."

# Check git status
$gitStatus = git status --porcelain 2>&1
if ($gitStatus -and -not $Force) {
    Write-Error "Git working directory is not clean"
    Write-Info "Uncommitted changes detected. Commit or use -Force to override"
    exit 1
}
Write-Success "Git working directory clean"

# Check npm authentication
try {
    $whoami = npm whoami 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Success "Authenticated as: $whoami"
    } else {
        Write-Error "Not authenticated to npm. Run: npm login"
        exit 1
    }
} catch {
    Write-Error "npm authentication failed"
    exit 1
}

# Run tests
if (-not $SkipTests) {
    Write-Info "Running tests..."
    Push-Location (Join-Path $PSScriptRoot "..")
    pnpm test 2>&1 | Out-Null
    if ($LASTEXITCODE -ne 0) {
        Write-Error "Tests failed. Fix errors or use -SkipTests"
        Pop-Location
        exit 1
    }
    Pop-Location
    Write-Success "Tests passed"
}

# Check versions don't already exist
foreach ($pkg in $packages) {
    $pkgPath = Join-Path $PSScriptRoot ".." $pkg.Path
    $packageJson = Get-Content (Join-Path $pkgPath "package.json") -Raw | ConvertFrom-Json
    $version = $packageJson.version
    
    $existing = npm view "$($pkg.Package)@$version" version 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Error "$($pkg.Package)@$version already exists on npm"
        Write-Info "Bump version with: pnpm changeset"
        exit 1
    }
}
Write-Success "No version conflicts"

Write-Info ""

# Publish packages
foreach ($pkg in $packages) {
    Write-Info "Processing: $($pkg.Name) ($($pkg.Package))"
    Write-Info "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    
    $pkgPath = Join-Path $PSScriptRoot ".." $pkg.Path
    Push-Location $pkgPath
    
    try {
        # Build
        if (-not $SkipBuild) {
            Write-Info "Building..."
            pnpm build
            if ($LASTEXITCODE -ne 0) {
                Write-Error "Build failed"
                Pop-Location
                continue
            }
            Write-Success "Build complete"
        }
        
        # Get version
        $packageJson = Get-Content "package.json" -Raw | ConvertFrom-Json
        $version = $packageJson.version
        Write-Info "Version: $version"
        
        # Publish
        if ($DryRun) {
            Write-Warning "DRY RUN: Would publish $($pkg.Package)@$version"
            npm publish --dry-run
        } else {
            Write-Info "Publishing to npm..."
            Write-Warning "This will require 2FA code"
            
            npm publish --access public
            
            if ($LASTEXITCODE -eq 0) {
                Write-Success "Published $($pkg.Package)@$version"
                
                # Wait for npm to propagate
                Write-Info "Waiting for npm propagation (10s)..."
                Start-Sleep -Seconds 10
                
                # Verify
                $viewOutput = npm view $pkg.Package version 2>&1
                if ($viewOutput -eq $version) {
                    Write-Success "Verified on npm"
                } else {
                    Write-Warning "Verification pending (may take a few minutes)"
                }
                
                # Create git tag
                $tag = "$($pkg.Package)@$version"
                git tag -a $tag -m "Release $tag"
                Write-Success "Created git tag: $tag"
                
            } else {
                Write-Error "Publish failed"
            }
        }
        
    } catch {
        Write-Error "Error: $_"
    } finally {
        Pop-Location
    }
    
    Write-Info ""
}

if (-not $DryRun) {
    Write-Success "Publishing complete!"
    Write-Info ""
    Write-Info "Next steps:"
    Write-Info "1. Push tags: git push --tags"
    Write-Info "2. Create GitHub release"
    Write-Info "3. Update CHANGELOG.md"
} else {
    Write-Info "Dry run complete. Use without -DryRun to publish."
}
