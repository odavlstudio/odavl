#!/usr/bin/env pwsh
# Quick automated scan for ODAVL Insight
# Usage: .\run-full-insight-scan.ps1

Write-Host "🧠 ODAVL INSIGHT - Automated Scan" -ForegroundColor Cyan
Write-Host "═" * 60 -ForegroundColor Cyan

# Run analysis with pre-configured inputs
$ErrorActionPreference = 'Continue'

# Use direct TypeScript execution
$env:WORKSPACE = "5"  # odavl-studio/insight
$env:SCAN_TYPE = "2"  # Full scan

Write-Host "📁 Workspace: odavl-studio/insight" -ForegroundColor Yellow
Write-Host "🔍 Scan Type: Full (All 16 detectors)" -ForegroundColor Yellow
Write-Host ""

# Execute with timeout
$process = Start-Process -FilePath "pnpm" -ArgumentList "odavl:insight" -NoNewWindow -PassThru -RedirectStandardInput "input.txt" -Wait

Write-Host ""
Write-Host "✅ Scan complete! Check .odavl/insight/reports/ for results" -ForegroundColor Green
