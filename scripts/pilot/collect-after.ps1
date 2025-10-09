#!/usr/bin/env pwsh
# ODAVL Pilot - After Evidence Collection (PowerShell)
param([string]$OutputDir = "reports/phase5/evidence/after")

$timestamp = Get-Date -Format "yyyy-MM-ddTHH:mm:ss.fffZ"
Write-Host "📊 ODAVL After Collection - $timestamp" -ForegroundColor Cyan

# Ensure output directory exists
if (!(Test-Path $OutputDir)) {
    New-Item -ItemType Directory -Path $OutputDir -Force | Out-Null
}

# Collect ESLint metrics (same logic as baseline)
Write-Host "🔍 Collecting ESLint metrics..." -ForegroundColor Yellow
try {
    $eslintResult = & pnpm -s exec eslint . -f json 2>$null | ConvertFrom-Json -ErrorAction SilentlyContinue
    $eslintWarnings = 0
    if ($eslintResult -and $eslintResult.Count -gt 0) {
        foreach ($file in $eslintResult) {
            foreach ($msg in $file.messages) {
                if ($msg.severity -eq 1) { $eslintWarnings++ }
            }
        }
    }
    $eslintData = @{ warnings = $eslintWarnings; timestamp = $timestamp }
    $eslintData | ConvertTo-Json | Out-File "$OutputDir/eslint.json" -Encoding UTF8
    Write-Host "✅ ESLint warnings: $eslintWarnings" -ForegroundColor Green
} catch {
    Write-Host "❌ ESLint collection failed: $_" -ForegroundColor Red
    @{ warnings = -1; error = $_.Exception.Message; timestamp = $timestamp } | ConvertTo-Json | Out-File "$OutputDir/eslint.json" -Encoding UTF8
}

# Collect TypeScript errors (same logic as baseline)
Write-Host "🔍 Collecting TypeScript metrics..." -ForegroundColor Yellow
try {
    $tscOutput = & pnpm -s exec tsc -p tsconfig.json --noEmit 2>&1
    $typeErrors = ([regex]::Matches($tscOutput, "error TS\d+")).Count
    $tscData = @{ errors = $typeErrors; timestamp = $timestamp }
    $tscData | ConvertTo-Json | Out-File "$OutputDir/tsc.json" -Encoding UTF8
    Write-Host "✅ TypeScript errors: $typeErrors" -ForegroundColor Green
} catch {
    Write-Host "❌ TypeScript collection failed: $_" -ForegroundColor Red
    @{ errors = -1; error = $_.Exception.Message; timestamp = $timestamp } | ConvertTo-Json | Out-File "$OutputDir/tsc.json" -Encoding UTF8
}

# Collect security scan (same logic as baseline)
Write-Host "🔍 Collecting security metrics..." -ForegroundColor Yellow
try {
    if (Test-Path "tools/security-scan.ps1") {
        $securityResult = & "tools/security-scan.ps1" -Json | ConvertFrom-Json
        $securityResult | ConvertTo-Json -Depth 3 | Out-File "$OutputDir/security.json" -Encoding UTF8
        Write-Host "✅ Security scan completed" -ForegroundColor Green
    } else {
        Write-Host "⚠️ Security scan not available - creating stub" -ForegroundColor Yellow
        @{ status = "TODO"; message = "Security scan not configured"; timestamp = $timestamp } | ConvertTo-Json | Out-File "$OutputDir/security.json" -Encoding UTF8
    }
} catch {
    Write-Host "❌ Security scan failed: $_" -ForegroundColor Red
    @{ status = "ERROR"; error = $_.Exception.Message; timestamp = $timestamp } | ConvertTo-Json | Out-File "$OutputDir/security.json" -Encoding UTF8
}

# Calculate deltas by comparing with baseline
$baselineDir = "reports/phase5/evidence/baseline"
$deltaReport = @{ timestamp = $timestamp; deltas = @{} }

if (Test-Path "$baselineDir/eslint.json") {
    $baseEslint = (Get-Content "$baselineDir/eslint.json" | ConvertFrom-Json).warnings
    $afterEslint = (Get-Content "$OutputDir/eslint.json" | ConvertFrom-Json).warnings
    $deltaReport.deltas.eslint = @{ before = $baseEslint; after = $afterEslint; delta = ($afterEslint - $baseEslint) }
}

if (Test-Path "$baselineDir/tsc.json") {
    $baseTs = (Get-Content "$baselineDir/tsc.json" | ConvertFrom-Json).errors
    $afterTs = (Get-Content "$OutputDir/tsc.json" | ConvertFrom-Json).errors
    $deltaReport.deltas.typescript = @{ before = $baseTs; after = $afterTs; delta = ($afterTs - $baseTs) }
}

# Generate summary with deltas
$summaryMarkdown = @"
# ODAVL After Evidence Report

**Collection Time**: $timestamp  
**Repository**: $(git remote get-url origin 2>$null)  
**Commit**: $(git rev-parse --short HEAD 2>$null)  

## Improvement Summary

| Metric | Before | After | Delta | Status |
|--------|--------|-------|-------|---------|
| ESLint Warnings | $($deltaReport.deltas.eslint.before) | $($deltaReport.deltas.eslint.after) | $($deltaReport.deltas.eslint.delta) | $(if($deltaReport.deltas.eslint.delta -lt 0){"IMPROVED"}elseif($deltaReport.deltas.eslint.delta -eq 0){"STABLE"}else{"REGRESSED"}) |
| TypeScript Errors | $($deltaReport.deltas.typescript.before) | $($deltaReport.deltas.typescript.after) | $($deltaReport.deltas.typescript.delta) | $(if($deltaReport.deltas.typescript.delta -lt 0){"IMPROVED"}elseif($deltaReport.deltas.typescript.delta -eq 0){"STABLE"}else{"REGRESSED"}) |

## ODAVL Impact

$(if($deltaReport.deltas.eslint.delta -lt 0 -or $deltaReport.deltas.typescript.delta -lt 0){"✅ **POSITIVE IMPACT**: ODAVL successfully improved code quality"}else{"⚠️ **NO CHANGE**: Code was already clean or no applicable improvements found"})

## Evidence Files

- ESLint: \`$OutputDir/eslint.json\`
- TypeScript: \`$OutputDir/tsc.json\`
- Security: \`$OutputDir/security.json\`
- Deltas: \`$OutputDir/deltas.json\`
"@

$summaryMarkdown | Out-File "$OutputDir/summary.md" -Encoding UTF8
$deltaReport | ConvertTo-Json -Depth 3 | Out-File "$OutputDir/deltas.json" -Encoding UTF8

Write-Host "📋 After collection complete - outputs in $OutputDir" -ForegroundColor Cyan
Write-Host "🎯 Use delta report template to generate customer presentation" -ForegroundColor White