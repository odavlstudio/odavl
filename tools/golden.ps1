#!/usr/bin/env pwsh
# ODAVL Golden Repo Stabilization Script
param([switch]$Verbose, [switch]$Json)
$ErrorActionPreference = "Stop"

# Import common utilities
. "$PSScriptRoot/common.ps1"

$goldenDir = "reports/golden"
if (!(Test-Path $goldenDir)) { New-Item -Path $goldenDir -ItemType Directory -Force | Out-Null }

if (!$Json) { Write-Host "🔍 ODAVL Golden Repo Check - $(Get-Date -Format 'yyyy-MM-ddTHH:mm:ss.fffZ')" -ForegroundColor Cyan }

$metrics = @{
    lint = @{ errors = 0 }
    typecheck = @{ errors = 0 }
    build = @{ errors = 0; success = $true }
    packages = @{ cli = @{ built = $false }; vscode = @{ built = $false } }
}

try {
    if (!$Json) { Write-Host "📋 Running ESLint..." -ForegroundColor Yellow }
    & pnpm lint 2>&1 | Out-Null
    if ($LASTEXITCODE -ne 0) { 
        $metrics.lint.errors = 1
        if (!$Json) { Write-Host "❌ Lint failed" -ForegroundColor Red }
    } else { 
        if (!$Json) { Write-Host "✅ Lint passed" -ForegroundColor Green }
    }
    
    if (!$Json) { Write-Host "🔧 Running TypeScript check..." -ForegroundColor Yellow }
    & pnpm typecheck 2>&1 | Out-Null
    if ($LASTEXITCODE -ne 0) { 
        $metrics.typecheck.errors = 1
        if (!$Json) { Write-Host "❌ TypeScript failed" -ForegroundColor Red }
    } else { 
        if (!$Json) { Write-Host "✅ TypeScript passed" -ForegroundColor Green }
    }
    
    if (!$Json) { Write-Host "🏗️ Building CLI..." -ForegroundColor Yellow }
    Push-Location "apps/cli"
    & npm run build 2>&1 | Out-Null
    if ($LASTEXITCODE -ne 0) { 
        $metrics.build.errors++
        if (!$Json) { Write-Host "❌ CLI build failed" -ForegroundColor Red }
    } else { 
        $metrics.packages.cli.built = $true
        if (!$Json) { Write-Host "✅ CLI built" -ForegroundColor Green }
    }
    Pop-Location
    
    if (!$Json) { Write-Host "🎨 Building VS Code extension..." -ForegroundColor Yellow }
    Push-Location "apps/vscode-ext"
    & npm run build 2>&1 | Out-Null
    if ($LASTEXITCODE -ne 0) { 
        $metrics.build.errors++
        if (!$Json) { Write-Host "❌ VS Code build failed" -ForegroundColor Red }
    } else { 
        $metrics.packages.vscode.built = $true
        if (!$Json) { Write-Host "✅ VS Code built" -ForegroundColor Green }
    }
    Pop-Location
    
    $totalErrors = $metrics.lint.errors + $metrics.typecheck.errors + $metrics.build.errors
    $metrics.build.success = ($totalErrors -eq 0)
    $status = if ($totalErrors -eq 0) { "PASS" } else { "FAIL" }
    
    $response = New-ODAVLResponse -Tool "golden" -Status $status -Data $metrics
    
    $snapshotPath = "$goldenDir/golden-snapshot.json"
    $response | ConvertTo-Json -Depth 4 | Out-File -FilePath $snapshotPath -Encoding UTF8
    
    if (!$Json) {
        if ($totalErrors -eq 0) { 
            Write-Host "🎯 GOLDEN REPO STATUS: STABLE ✅" -ForegroundColor Green 
        } else { 
            Write-Host "⚠️ GOLDEN REPO STATUS: UNSTABLE ❌" -ForegroundColor Red 
        }
        Write-Host "📊 Golden snapshot saved: $snapshotPath" -ForegroundColor Cyan
    }
    
    Exit-WithCode -Code $totalErrors -Response $response -Json:$Json
} catch {
    $response = New-ODAVLResponse -Tool "golden" -Status "ERROR" -Errors @($_.Exception.Message)
    if (!$Json) { Write-Host "💥 Golden check failed: $_" -ForegroundColor Red }
    Exit-WithCode -Code 999 -Response $response -Json:$Json
}