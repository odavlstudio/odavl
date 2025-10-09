#!/usr/bin/env pwsh
# ODAVL KPI - Quality Metrics Collection (PowerShell)
# Collects ESLint and TypeScript metrics and records quality_snapshot event

param(
    [Parameter(HelpMessage="Repository path to analyze")]
    [string]$RepoPath = (Get-Location).Path,
    [Parameter(HelpMessage="Automatically record quality_snapshot event")]
    [bool]$AutoRecord = $true,
    [Parameter(HelpMessage="Output JSON format for automation")]
    [switch]$Json,
    [Parameter(HelpMessage="Display usage information")]
    [switch]$Help
)

# Configuration
$ScriptDir = Split-Path $MyInvocation.MyCommand.Path -Parent
$RecordEventScript = Join-Path $ScriptDir "record-event.ps1"

# Function to display usage
function Show-Usage {
    Write-Host "ODAVL Quality Metrics Collection - KPI Tracking" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Usage: .\collect-quality.ps1 [-RepoPath PATH] [-AutoRecord true/false] [-Json]" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Parameters:" -ForegroundColor Green
    Write-Host "  -RepoPath PATH      Repository path to analyze (default: current directory)"
    Write-Host "  -AutoRecord BOOL    Automatically record quality_snapshot event (default: true)"
    Write-Host "  -Json               Output JSON format for automation"
    Write-Host ""
    Write-Host "Examples:" -ForegroundColor Yellow
    Write-Host "  .\collect-quality.ps1"
    Write-Host "  .\collect-quality.ps1 -RepoPath C:\dev\myproject"
    Write-Host "  .\collect-quality.ps1 -AutoRecord `$false -Json"
    Write-Host ""
    Write-Host "Privacy: All data stored locally, opt-in for external sharing" -ForegroundColor Magenta
}

if ($Help) {
    Show-Usage
    exit 0
}

Write-Host "📊 ODAVL Quality Metrics Collection" -ForegroundColor Cyan
Write-Host "📁 Repository: $RepoPath" -ForegroundColor Gray

# Change to repository directory
Set-Location $RepoPath

# Initialize metrics
$eslintTotal = 0
$tsErrorsTotal = 0
$filesWithIssues = 0
$totalFiles = 0

# ESLint Analysis
Write-Host "📋 Collecting ESLint metrics..." -ForegroundColor Yellow
try {
    if (Get-Command pnpm -ErrorAction SilentlyContinue) {
        $eslintJson = pnpm -s exec eslint . -f json 2>$null
        if ($eslintJson) {
            $eslintData = $eslintJson | ConvertFrom-Json
            $warningCount = 0
            $errorCount = 0
            $fileCount = 0
            
            foreach ($file in $eslintData) {
                if ($file.messages -and $file.messages.Count -gt 0) {
                    $fileCount++
                    foreach ($msg in $file.messages) {
                        if ($msg.severity -eq 1) { $warningCount++ }
                        if ($msg.severity -eq 2) { $errorCount++ }
                    }
                }
            }
            
            $eslintTotal = $warningCount + $errorCount
            $filesWithIssues = $fileCount
            $totalFiles = $eslintData.Count
            
            Write-Host "  ✅ ESLint: $warningCount warnings, $errorCount errors in $fileCount/$totalFiles files" -ForegroundColor Green
        } else {
            Write-Host "  ⚠️ ESLint: Could not run analysis" -ForegroundColor Yellow
        }
    } else {
        Write-Host "  ❌ pnpm not found, skipping ESLint analysis" -ForegroundColor Red
    }
} catch {
    Write-Host "  ❌ ESLint analysis failed: $($_.Exception.Message)" -ForegroundColor Red
}

# TypeScript Analysis
Write-Host "🔧 Collecting TypeScript diagnostics..." -ForegroundColor Yellow
try {
    if (Get-Command pnpm -ErrorAction SilentlyContinue) {
        $tscOutput = pnpm -s exec tsc -p tsconfig.json --noEmit 2>&1
        $tsErrorsTotal = ([regex]::Matches($tscOutput, "error TS\d+")).Count
        Write-Host "  ✅ TypeScript: $tsErrorsTotal compilation errors" -ForegroundColor Green
    } else {
        Write-Host "  ❌ pnpm not found, skipping TypeScript analysis" -ForegroundColor Red
    }
} catch {
    Write-Host "  ❌ TypeScript analysis failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Build metrics object
$metrics = @{
    eslint_total = $eslintTotal
    ts_errors_total = $tsErrorsTotal
    files_with_issues = $filesWithIssues
    total_files = $totalFiles
}

Write-Host ""
Write-Host "📈 Quality Metrics Summary:" -ForegroundColor Cyan
Write-Host "  ESLint Issues: $eslintTotal" -ForegroundColor White
Write-Host "  TypeScript Errors: $tsErrorsTotal" -ForegroundColor White
Write-Host "  Files with Issues: $filesWithIssues" -ForegroundColor White
Write-Host "  Total Files Analyzed: $totalFiles" -ForegroundColor White

# Record event if auto-record is enabled
if ($AutoRecord) {
    Write-Host ""
    Write-Host "📝 Recording quality_snapshot event..." -ForegroundColor Yellow
    
    if (Test-Path $RecordEventScript) {
        $metricsJson = $metrics | ConvertTo-Json -Compress
        & $RecordEventScript -Type "quality_snapshot" -Repo $RepoPath -Notes "Automated quality metrics collection" -Metrics $metricsJson
    } else {
        Write-Host "  ⚠️ Event recording script not found: $RecordEventScript" -ForegroundColor Yellow
    }
}

# Output JSON for automation
if ($Json) {
    $output = @{
        timestamp = (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ss.fffZ")
        repo = $RepoPath
        metrics = $metrics
    }
    $output | ConvertTo-Json -Depth 3
}

Write-Host ""
Write-Host "✅ Quality metrics collection complete" -ForegroundColor Green