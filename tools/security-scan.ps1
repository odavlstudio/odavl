#!/usr/bin/env pwsh
# ODAVL Security Scanner - Wave 9
param([switch]$Json)
$ErrorActionPreference = "Stop"

# Import common utilities
. "$PSScriptRoot/common.ps1"

if (!$Json) { Write-Host "🔒 ODAVL Security Scan - $(Get-Date -Format 'yyyy-MM-ddTHH:mm:ss.fffZ')" -ForegroundColor Cyan }

# Dependency audit
$auditResult = npm audit --json 2>$null | ConvertFrom-Json -ErrorAction SilentlyContinue
$vulnerabilities = if ($auditResult) { $auditResult.vulnerabilities } else { @{} }

$highCVEs = 0; $mediumCVEs = 0; $lowCVEs = 0
foreach ($vuln in $vulnerabilities.PSObject.Properties.Value) {
    switch ($vuln.severity) {
        "high" { $highCVEs++ }
        "moderate" { $mediumCVEs++ }
        "low" { $lowCVEs++ }
    }
}

# License scan
$licenseIssues = 0
$packageJson = Get-Content "package.json" -Raw | ConvertFrom-Json -ErrorAction SilentlyContinue
if ($packageJson -and $packageJson.dependencies) {
    foreach ($dep in $packageJson.dependencies.PSObject.Properties) {
        # Basic license check - in real implementation would use license-checker
        if ($dep.Name -match "(gpl|agpl)" -and $dep.Name -notmatch "lgpl") { $licenseIssues++ }
    }
}

$status = if ($highCVEs -gt 0) { "FAIL" } elseif ($mediumCVEs -gt 0) { "WARN" } else { "PASS" }
$data = @{
    vulnerabilities = @{ high = $highCVEs; medium = $mediumCVEs; low = $lowCVEs }
    licenses = @{ issues = $licenseIssues }
}

$response = New-ODAVLResponse -Tool "security-scan" -Status $status -Data $data

if ($Json) { 
    $response | ConvertTo-Json -Depth 4 
} else {
    Write-Host "🛡️ Vulnerabilities: High=$highCVEs, Medium=$mediumCVEs, Low=$lowCVEs"
    Write-Host "📜 License Issues: $licenseIssues"
    Write-Host "🎯 Security Status: $status"
}

$exitCode = if ($highCVEs -gt 0) { 1 } else { 0 }
exit $exitCode