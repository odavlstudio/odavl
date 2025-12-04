#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Publish ODAVL packages to local Verdaccio registry
.DESCRIPTION
    Builds and publishes CLI and SDK packages to http://localhost:4873
.EXAMPLE
    .\publish-local.ps1
.NOTES
    Requires: Verdaccio running on localhost:4873
#>

param(
    [switch]$SkipBuild,
    [switch]$Verbose
)

$ErrorActionPreference = "Stop"
Set-StrictMode -Version Latest

# Colors for output
function Write-Success { Write-Host "✅ $args" -ForegroundColor Green }
function Write-Info { Write-Host "ℹ️  $args" -ForegroundColor Cyan }
function Write-Warning { Write-Host "⚠️  $args" -ForegroundColor Yellow }
function Write-Error { Write-Host "❌ $args" -ForegroundColor Red }

# Configuration
$registry = "http://localhost:4873"
$packages = @(
    @{ Name = "CLI"; Path = "apps/studio-cli"; Package = "@odavl-studio/cli" }
    @{ Name = "SDK"; Path = "packages/sdk"; Package = "@odavl-studio/sdk" }
)

Write-Info "ODAVL Local Publishing Script"
Write-Info "Registry: $registry"
Write-Info ""

# Check Verdaccio is running
try {
    $response = Invoke-WebRequest -Uri $registry -UseBasicParsing -TimeoutSec 3 -ErrorAction Stop
    Write-Success "Verdaccio is running"
} catch {
    Write-Error "Verdaccio is not running on $registry"
    Write-Info "Start it with: verdaccio"
    exit 1
}

# Check authentication
try {
    $whoami = npm whoami --registry $registry 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Success "Authenticated as: $whoami"
    } else {
        Write-Warning "Not authenticated. Run: npm adduser --registry $registry"
        exit 1
    }
} catch {
    Write-Warning "Authentication check failed"
}

Write-Info ""

# Publish each package
foreach ($pkg in $packages) {
    Write-Info "Processing: $($pkg.Name) ($($pkg.Package))"
    Write-Info "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    
    $pkgPath = Join-Path $PSScriptRoot ".." $pkg.Path
    
    if (-not (Test-Path $pkgPath)) {
        Write-Error "Package path not found: $pkgPath"
        continue
    }
    
    Push-Location $pkgPath
    
    try {
        # Build package
        if (-not $SkipBuild) {
            Write-Info "Building $($pkg.Name)..."
            pnpm build
            if ($LASTEXITCODE -ne 0) {
                Write-Error "Build failed for $($pkg.Name)"
                Pop-Location
                continue
            }
            Write-Success "Build complete"
        } else {
            Write-Info "Skipping build (--SkipBuild)"
        }
        
        # Get current version
        $packageJson = Get-Content "package.json" -Raw | ConvertFrom-Json
        $version = $packageJson.version
        Write-Info "Version: $version"
        
        # Publish to local registry
        Write-Info "Publishing to $registry..."
        $publishOutput = npm publish --registry $registry 2>&1
        
        if ($LASTEXITCODE -eq 0) {
            Write-Success "Published $($pkg.Package)@$version"
            
            # Verify publication
            Start-Sleep -Seconds 1
            $viewOutput = npm view $pkg.Package --registry $registry 2>&1
            if ($viewOutput -match $version) {
                Write-Success "Verified in registry"
            }
        } else {
            Write-Error "Publish failed for $($pkg.Name)"
            if ($Verbose) {
                Write-Host $publishOutput
            }
        }
        
    } catch {
        Write-Error "Error processing $($pkg.Name): $_"
    } finally {
        Pop-Location
    }
    
    Write-Info ""
}

Write-Success "Publishing complete!"
Write-Info ""
Write-Info "View packages at: $registry"
Write-Info "List packages: npm search --registry $registry"
