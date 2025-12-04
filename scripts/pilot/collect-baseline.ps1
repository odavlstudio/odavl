#!/usr/bin/env pwsh
# ODAVL Pilot - Baseline Evidence Collection
# Collects ESLint, TypeScript, and Security metrics before ODAVL improvements

param(
    [Parameter(HelpMessage="Output directory for baseline reports")]
    [string]$OutputDir = "reports/phase5/evidence/baseline",
    [Parameter(HelpMessage="Output JSON format for automation")]
    [switch]$Json
)

$timestamp = Get-Date -Format "yyyy-MM-ddTHH:mm:ss.fffZ"
$projectRoot = (Get-Location).Path

Write-Host "🔍 ODAVL Baseline Evidence Collection - $timestamp" -ForegroundColor Cyan
Write-Host "📁 Project: $projectRoot" -ForegroundColor Gray

# Ensure output directory exists
if (-not (Test-Path $OutputDir)) {
    New-Item -ItemType Directory -Path $OutputDir -Force | Out-Null
}

# Initialize results object
$results = @{
    timestamp = $timestamp
    projectRoot = $projectRoot
    eslint = @{}
    typescript = @{}
    security = @{}
    summary = @{}
}

# ESLint Analysis
Write-Host "📋 Collecting ESLint metrics..." -ForegroundColor Yellow
try {
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
        
        $results.eslint = @{
            warnings = $warningCount
            errors = $errorCount
            filesWithIssues = $fileCount
            totalFiles = $eslintData.Count
            rawData = $eslintData
        }
        
        $eslintData | ConvertTo-Json -Depth 10 | Out-File "$OutputDir/eslint.json" -Encoding UTF8
        Write-Host "  ✅ ESLint: $warningCount warnings, $errorCount errors in $fileCount files"
    } else {
        Write-Host "  ⚠️ ESLint: No output received" -ForegroundColor Yellow
        $results.eslint = @{ warnings = 0; errors = 0; filesWithIssues = 0; status = "no-output" }
    }
} catch {
    Write-Host "  ❌ ESLint collection failed: $($_.Exception.Message)" -ForegroundColor Red
    $results.eslint = @{ status = "failed"; error = $_.Exception.Message }
}

# TypeScript Analysis  
Write-Host "🔧 Collecting TypeScript diagnostics..." -ForegroundColor Yellow
try {
    $tscOutput = pnpm -s exec tsc -p tsconfig.json --noEmit 2>&1
    $typeErrors = ($tscOutput | Select-String "error TS\d+").Count
    
    $results.typescript = @{
        errors = $typeErrors
        rawOutput = $tscOutput -join "`n"
    }
    
    $tscOutput | Out-File "$OutputDir/tsc.txt" -Encoding UTF8
    @{ errors = $typeErrors; output = $tscOutput } | ConvertTo-Json -Depth 5 | Out-File "$OutputDir/tsc.json" -Encoding UTF8
    Write-Host "  ✅ TypeScript: $typeErrors compilation errors"
} catch {
    Write-Host "  ❌ TypeScript collection failed: $($_.Exception.Message)" -ForegroundColor Red
    $results.typescript = @{ status = "failed"; error = $_.Exception.Message }
}

# Security Analysis (reuse existing security-scan.ps1)
Write-Host "🔒 Collecting security metrics..." -ForegroundColor Yellow
try {
    if (Test-Path "tools/security-scan.ps1") {
        $securityOutput = & "tools/security-scan.ps1" -Json | ConvertFrom-Json
        $results.security = $securityOutput
        $securityOutput | ConvertTo-Json -Depth 5 | Out-File "$OutputDir/security.json" -Encoding UTF8
        Write-Host "  ✅ Security: $($securityOutput.vulnerabilities.high) high CVEs, $($securityOutput.licenses.issues) license issues"
    } else {
        Write-Host "  ⚠️ Security scanner not found - running basic audit" -ForegroundColor Yellow
        $auditOutput = npm audit --json 2>$null
        if ($auditOutput) {
            $auditData = $auditOutput | ConvertFrom-Json
            $highVulns = if ($auditData.vulnerabilities) { 
                ($auditData.vulnerabilities.PSObject.Properties.Value | Where-Object { $_.severity -eq "high" }).Count 
            } else { 0 }
            $results.security = @{ 
                vulnerabilities = @{ high = $highVulns }
                status = if ($highVulns -gt 0) { "FAIL" } else { "PASS" }
            }
            $auditData | ConvertTo-Json -Depth 10 | Out-File "$OutputDir/security.json" -Encoding UTF8
        } else {
            $results.security = @{ status = "unavailable" }
        }
    }
} catch {
    Write-Host "  ❌ Security collection failed: $($_.Exception.Message)" -ForegroundColor Red
    $results.security = @{ status = "failed"; error = $_.Exception.Message }
}

# Generate Summary
$results.summary = @{
    eslintWarnings = $results.eslint.warnings ?? 0
    eslintErrors = $results.eslint.errors ?? 0  
    typeErrors = $results.typescript.errors ?? 0
    securityStatus = $results.security.status ?? "unknown"
    highCVEs = $results.security.vulnerabilities.high ?? 0
    collectionComplete = $true
}

# Save complete results
$results | ConvertTo-Json -Depth 10 | Out-File "$OutputDir/baseline-complete.json" -Encoding UTF8

# Generate markdown summary
$summaryMd = @"
# ODAVL Baseline Evidence Report

**Generated**: $timestamp  
**Project**: $projectRoot

## Code Quality Metrics

### ESLint Analysis
- **Warnings**: $($results.summary.eslintWarnings)
- **Errors**: $($results.summary.eslintErrors)
- **Files with Issues**: $($results.eslint.filesWithIssues ?? 'N/A')

### TypeScript Analysis  
- **Compilation Errors**: $($results.summary.typeErrors)

### Security Analysis
- **Status**: $($results.summary.securityStatus)
- **High Severity CVEs**: $($results.summary.highCVEs)

## Next Steps
1. Run ODAVL improvement cycle
2. Execute collect-after.ps1 to capture improvements
3. Generate before/after comparison report

---
*Report generated by ODAVL Pilot Evidence Collection*
"@

$summaryMd | Out-File "$OutputDir/summary.md" -Encoding UTF8

if ($Json) {
    $results | ConvertTo-Json -Depth 5
} else {
    Write-Host ""
    Write-Host "📊 Baseline Collection Complete" -ForegroundColor Green
    Write-Host "  📁 Reports saved to: $OutputDir"
    Write-Host "  📋 ESLint: $($results.summary.eslintWarnings) warnings, $($results.summary.eslintErrors) errors"
    Write-Host "  🔧 TypeScript: $($results.summary.typeErrors) errors"
    Write-Host "  🔒 Security: $($results.summary.securityStatus) ($($results.summary.highCVEs) high CVEs)"
}

exit 0
