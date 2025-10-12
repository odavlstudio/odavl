#!/usr/bin/env pwsh
# ODAVL Policy Guard - Validates governance compliance
param([switch]$Verbose, [switch]$Json)
$ErrorActionPreference = "Stop"

# Import common utilities
. "$PSScriptRoot/common.ps1"

if (!$Json) { Write-Host "🛡️ ODAVL Policy Guard - $(Get-Date -Format 'yyyy-MM-ddTHH:mm:ss.fffZ')" -ForegroundColor Cyan }
$violations = @()
try {
    if (!(Test-Path ".odavl.policy.yml")) { $violations += "Missing .odavl.policy.yml" }
    if (!(Test-Path ".odavl/gates.yml")) { $violations += "Missing .odavl/gates.yml" }
    $changedFiles = @(git diff --name-only HEAD~1 2>$null)
    if ($changedFiles.Count -gt 5) { $violations += "Too many files changed: $($changedFiles.Count) > 5" }
    foreach ($file in $changedFiles) {
        if ($file -match "(security|\.spec\.|public-api)") { $violations += "Protected path modified: $file" }
        $lines = @(git diff HEAD~1 -- $file | Select-String "^[\+\-]" | Where-Object { $_ -notmatch "^[\+\-][\+\-][\+\-]" })
        $isInfrastructure = $file -match '(\.github|tools|\.yml|\.yaml|WAVE.*\.md|CHANGELOG\.md)$'
        if ($isInfrastructure) {
            $limit = 70
        } else {
            $limit = 40
        }
        if ($lines.Count -gt $limit) { $violations += "File $($file): $($lines.Count) lines > $limit limit" }
    }
    $status = if ($violations.Count -eq 0) { "PASS" } else { "FAIL" }
    $data = @{ violations = $violations; filesChecked = $changedFiles.Count }
    $response = New-ODAVLResponse -Tool "policy-guard" -Status $status -Data $data
    
    # Ensure reports directory exists
    if (!(Test-Path "reports/waves")) { New-Item -Path "reports/waves" -ItemType Directory -Force | Out-Null }
    $response | ConvertTo-Json -Depth 4 | Out-File "reports/waves/policy-check.json" -Encoding UTF8
    
    if (!$Json) {
        if ($violations.Count -eq 0) {
            Write-Host "✅ Policy compliance: PASS" -ForegroundColor Green
        } else {
            Write-Host "❌ Policy violations found:" -ForegroundColor Red
            $violations | ForEach-Object { Write-Host "  - $_" -ForegroundColor Red }
        }
    }
    
    $exitCode = if ($violations.Count -eq 0) { 0 } else { 1 }
    Exit-WithCode -Code $exitCode -Response $response -Json:$Json
} catch {
    $response = New-ODAVLResponse -Tool "policy-guard" -Status "ERROR" -Errors @($_.Exception.Message)
    if (!$Json) { Write-Host "💥 Policy guard failed: $_" -ForegroundColor Red }
    Exit-WithCode -Code 999 -Response $response -Json:$Json
}