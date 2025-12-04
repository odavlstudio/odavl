#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Unpublish ODAVL packages from local Verdaccio registry
.DESCRIPTION
    Removes CLI and SDK packages from http://localhost:4873
.EXAMPLE
    .\unpublish-local.ps1
.EXAMPLE
    .\unpublish-local.ps1 -Package cli -Version 0.1.0
.NOTES
    Use with caution - cannot be undone
#>

param(
    [ValidateSet("all", "cli", "sdk")]
    [string]$Package = "all",
    
    [string]$Version = "",
    
    [switch]$Force
)

$ErrorActionPreference = "Stop"
Set-StrictMode -Version Latest

# Colors
function Write-Success { Write-Host "✅ $args" -ForegroundColor Green }
function Write-Info { Write-Host "ℹ️  $args" -ForegroundColor Cyan }
function Write-Warning { Write-Host "⚠️  $args" -ForegroundColor Yellow }
function Write-Error { Write-Host "❌ $args" -ForegroundColor Red }

$registry = "http://localhost:4873"

$packages = @{
    "cli" = "@odavl-studio/cli"
    "sdk" = "@odavl-studio/sdk"
}

Write-Info "ODAVL Local Unpublish Script"
Write-Info "Registry: $registry"
Write-Warning "This will PERMANENTLY remove packages from the registry"
Write-Info ""

# Check Verdaccio
try {
    Invoke-WebRequest -Uri $registry -UseBasicParsing -TimeoutSec 3 -ErrorAction Stop | Out-Null
    Write-Success "Verdaccio is running"
} catch {
    Write-Error "Verdaccio is not running"
    exit 1
}

# Confirm action
if (-not $Force) {
    $confirm = Read-Host "Are you sure you want to unpublish? (yes/no)"
    if ($confirm -ne "yes") {
        Write-Info "Cancelled"
        exit 0
    }
}

# Determine which packages to unpublish
$toUnpublish = @()
if ($Package -eq "all") {
    $toUnpublish = @("cli", "sdk")
} else {
    $toUnpublish = @($Package)
}

Write-Info ""

# Unpublish packages
foreach ($pkg in $toUnpublish) {
    $packageName = $packages[$pkg]
    
    Write-Info "Unpublishing: $packageName"
    
    try {
        if ($Version) {
            # Unpublish specific version
            Write-Info "Removing version: $Version"
            npm unpublish "$packageName@$Version" --registry $registry --force 2>&1
        } else {
            # Unpublish all versions
            Write-Warning "Removing ALL versions of $packageName"
            npm unpublish $packageName --registry $registry --force 2>&1
        }
        
        if ($LASTEXITCODE -eq 0) {
            Write-Success "Unpublished $packageName"
        } else {
            Write-Warning "Package may not exist or already removed"
        }
        
    } catch {
        Write-Error "Error unpublishing $packageName: $_"
    }
    
    Write-Info ""
}

Write-Success "Unpublish complete"
Write-Info ""
Write-Info "Verify removal: npm view $($packages.Values) --registry $registry"
