#!/usr/bin/env pwsh
# ODAVL Pilot - Baseline Evidence Collection (PowerShell)
param([string]$OutputDir = "reports/phase5/evidence/baseline")

$timestamp = Get-Date -Format "yyyy-MM-ddTHH:mm:ss.fffZ"
Write-Host "📊 ODAVL Baseline Collection - $timestamp" -ForegroundColor Cyan

# Ensure output directory exists
if (!(Test-Path $OutputDir)) {
    New-Item -ItemType Directory -Path $OutputDir -Force | Out-Null
}

# Collect ESLint metrics
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

# Collect TypeScript errors
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

# Collect security scan (reuse existing script)
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

# Generate summary report
$summaryData = @{
    timestamp = $timestamp
    eslint = if (Test-Path "$OutputDir/eslint.json") { (Get-Content "$OutputDir/eslint.json" | ConvertFrom-Json).warnings } else { -1 }
    typescript = if (Test-Path "$OutputDir/tsc.json") { (Get-Content "$OutputDir/tsc.json" | ConvertFrom-Json).errors } else { -1 }
    security = if (Test-Path "$OutputDir/security.json") { (Get-Content "$OutputDir/security.json" | ConvertFrom-Json).status } else { "UNKNOWN" }
}

$summaryMarkdown = @"
# ODAVL Baseline Evidence Report

**Collection Time**: $timestamp  
**Repository**: $(git remote get-url origin 2>$null)  
**Commit**: $(git rev-parse --short HEAD 2>$null)  

## Metrics Summary

| Metric | Count | Status |
|--------|-------|---------|
| ESLint Warnings | $($summaryData.eslint) | $(if($summaryData.eslint -eq -1){"ERROR"}elseif($summaryData.eslint -eq 0){"CLEAN"}else{"ISSUES"}) |
| TypeScript Errors | $($summaryData.typescript) | $(if($summaryData.typescript -eq -1){"ERROR"}elseif($summaryData.typescript -eq 0){"CLEAN"}else{"ISSUES"}) |
| Security Status | $($summaryData.security) | $(if($summaryData.security -eq "PASS"){"SECURE"}elseif($summaryData.security -eq "TODO"){"PENDING"}else{"REVIEW"}) |

## Next Steps

1. Run ODAVL improvement cycle: `odavl run`
2. Collect after metrics: `.\scripts\pilot\collect-after.ps1`
3. Generate delta report using before/after templates
"@

$summaryMarkdown | Out-File "$OutputDir/summary.md" -Encoding UTF8

Write-Host "📋 Baseline collection complete - outputs in $OutputDir" -ForegroundColor Cyan
Write-Host "🎯 Run 'odavl run' to apply improvements, then collect after metrics" -ForegroundColor White