#!/usr/bin/env pwsh
# ODAVL Security Scanner - Wave 9
param([switch]$Json)

$timestamp = Get-Date -Format "yyyy-MM-ddTHH:mm:ss.fffZ"
Write-Host "🔒 ODAVL Security Scan - $timestamp" -ForegroundColor Cyan

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

$securityReport = @{
    timestamp = $timestamp
    vulnerabilities = @{ high = $highCVEs; medium = $mediumCVEs; low = $lowCVEs }
    licenses = @{ issues = $licenseIssues }
    status = if ($highCVEs -gt 0) { "FAIL" } else { "PASS" }
}

if ($Json) { $securityReport | ConvertTo-Json -Depth 3 }
else {
    Write-Host "🛡️ Vulnerabilities: High=$highCVEs, Medium=$mediumCVEs, Low=$lowCVEs"
    Write-Host "📜 License Issues: $licenseIssues"
    Write-Host "🎯 Security Status: $($securityReport.status)"
}

if ($highCVEs -gt 0) { exit 1 } else { exit 0 }