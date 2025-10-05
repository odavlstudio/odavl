#!/usr/bin/env pwsh
# ODAVL Golden Repo Stabilization Script
param([switch]$Verbose)
$ErrorActionPreference = "Stop"
$goldenDir = "reports/golden"
$timestamp = Get-Date -Format "yyyy-MM-ddTHH:mm:ss.fffZ"
if (!(Test-Path $goldenDir)) { New-Item -Path $goldenDir -ItemType Directory -Force | Out-Null }
Write-Host "🔍 ODAVL Golden Repo Check - $timestamp" -ForegroundColor Cyan
$metrics = @{
    timestamp = $timestamp; lint = @{ errors = 0 }; typecheck = @{ errors = 0 }
    build = @{ errors = 0; success = $true }; packages = @{ cli = @{ built = $false }; vscode = @{ built = $false } }
}

try {
    Write-Host "📋 Running ESLint..." -ForegroundColor Yellow
    & pnpm lint 2>&1 | Out-Null; if ($LASTEXITCODE -ne 0) { $metrics.lint.errors = 1; Write-Host "❌ Lint failed" -ForegroundColor Red } else { Write-Host "✅ Lint passed" -ForegroundColor Green }
    Write-Host "🔧 Running TypeScript check..." -ForegroundColor Yellow
    & pnpm typecheck 2>&1 | Out-Null; if ($LASTEXITCODE -ne 0) { $metrics.typecheck.errors = 1; Write-Host "❌ TypeScript failed" -ForegroundColor Red } else { Write-Host "✅ TypeScript passed" -ForegroundColor Green }
    Write-Host "🏗️ Building CLI..." -ForegroundColor Yellow
    Push-Location "apps/cli"; & npm run build 2>&1 | Out-Null
    if ($LASTEXITCODE -ne 0) { $metrics.build.errors++; Write-Host "❌ CLI build failed" -ForegroundColor Red } else { $metrics.packages.cli.built = $true; Write-Host "✅ CLI built" -ForegroundColor Green }
    Pop-Location
    Write-Host "🎨 Building VS Code extension..." -ForegroundColor Yellow
    Push-Location "apps/vscode-ext"; & npm run build 2>&1 | Out-Null
    if ($LASTEXITCODE -ne 0) { $metrics.build.errors++; Write-Host "❌ VS Code build failed" -ForegroundColor Red } else { $metrics.packages.vscode.built = $true; Write-Host "✅ VS Code built" -ForegroundColor Green }
    Pop-Location
    $totalErrors = $metrics.lint.errors + $metrics.typecheck.errors + $metrics.build.errors
    $metrics.build.success = ($totalErrors -eq 0)
    $snapshotPath = "$goldenDir/golden-snapshot.json"
    $metrics | ConvertTo-Json -Depth 4 | Out-File -FilePath $snapshotPath -Encoding UTF8
    if ($totalErrors -eq 0) { Write-Host "🎯 GOLDEN REPO STATUS: STABLE ✅" -ForegroundColor Green } else { Write-Host "⚠️ GOLDEN REPO STATUS: UNSTABLE ❌" -ForegroundColor Red }
    Write-Host "📊 Golden snapshot saved: $snapshotPath" -ForegroundColor Cyan
    return $totalErrors
} catch {
    Write-Host "💥 Golden check failed: $_" -ForegroundColor Red
    $metrics.build.success = $false; return 999
}