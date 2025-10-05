#!/usr/bin/env pwsh
# ODAVL Policy Guard - Validates governance compliance
param([switch]$Verbose)
$ErrorActionPreference = "Stop"
Write-Host "🛡️ ODAVL Policy Guard - $(Get-Date -Format 'yyyy-MM-ddTHH:mm:ss.fffZ')" -ForegroundColor Cyan
$violations = @()
try {
    if (!(Test-Path ".odavl.policy.yml")) { $violations += "Missing .odavl.policy.yml" }
    if (!(Test-Path ".odavl/gates.yml")) { $violations += "Missing .odavl/gates.yml" }
    $changedFiles = @(git diff --name-only HEAD~1 2>$null)
    if ($changedFiles.Count -gt 5) { $violations += "Too many files changed: $($changedFiles.Count) > 5" }
    foreach ($file in $changedFiles) {
        if ($file -match "(security|\.spec\.|public-api)") { $violations += "Protected path modified: $file" }
        $lines = @(git diff HEAD~1 -- $file | Select-String "^[\+\-]" | Where-Object { $_ -notmatch "^[\+\-][\+\-][\+\-]" })
        $isInfrastructure = $file -match "(\.github|tools|\.yml|\.yaml|WAVE.*\.md)$"
        $limit = if ($isInfrastructure) { 60 } else { 40 }
        if ($lines.Count -gt $limit) { $violations += "File ${file}: $($lines.Count) lines > $limit limit" }
    }
    if ($violations.Count -eq 0) {
        Write-Host "✅ Policy compliance: PASS" -ForegroundColor Green
        @{ status = "PASS"; violations = @(); timestamp = Get-Date -Format "yyyy-MM-ddTHH:mm:ss.fffZ" } | ConvertTo-Json | Out-File "reports/waves/policy-check.json" -Encoding UTF8
        return 0
    } else {
        Write-Host "❌ Policy violations found:" -ForegroundColor Red
        $violations | ForEach-Object { Write-Host "  - $_" -ForegroundColor Red }
        @{ status = "FAIL"; violations = $violations; timestamp = Get-Date -Format "yyyy-MM-ddTHH:mm:ss.fffZ" } | ConvertTo-Json | Out-File "reports/waves/policy-check.json" -Encoding UTF8
        return 1
    }
} catch {
    Write-Host "💥 Policy guard failed: $_" -ForegroundColor Red
    return 999
}