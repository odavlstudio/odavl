#!/usr/bin/env pwsh
# ODAVL Ecosystem Links Validation Script

Write-Host "🔗 ODAVL Ecosystem Links Validation" -ForegroundColor Cyan
Write-Host "====================================" -ForegroundColor Cyan

$results = @()

function Test-PackageJson($path, $name) {
    Write-Host "`n📦 Checking: $name" -ForegroundColor Yellow
    
    if (Test-Path $path) {
        $content = Get-Content $path -Raw | ConvertFrom-Json
        
        $result = @{
            Component = $name
            Version = $content.version
            Repository = $content.repository.url
            Homepage = $content.homepage
            BugsUrl = $content.bugs.url
            Status = "✅"
            Issues = @()
        }
        
        # Check version is 1.0.0
        if ($content.version -ne "1.0.0") {
            $result.Issues += "Version mismatch: $($content.version) != 1.0.0"
            $result.Status = "❌"
        }
        
        # Check repository URL
        if ($content.repository.url -notmatch "github.com/odavl/odavl") {
            $result.Issues += "Repository URL incorrect: $($content.repository.url)"
            $result.Status = "❌"
        }
        
        # Check homepage
        if ($content.homepage -and $content.homepage -ne "https://odavl.com") {
            $result.Issues += "Homepage incorrect: $($content.homepage)"
            $result.Status = "❌"
        }
        
        Write-Host "   Version: $($content.version)" -ForegroundColor Gray
        Write-Host "   Repository: $($content.repository.url)" -ForegroundColor Gray
        Write-Host "   Homepage: $($content.homepage)" -ForegroundColor Gray
        
        if ($result.Issues.Count -eq 0) {
            Write-Host "   ✅ All links consistent" -ForegroundColor Green
        } else {
            Write-Host "   ❌ Issues found:" -ForegroundColor Red
            foreach ($issue in $result.Issues) {
                Write-Host "      - $issue" -ForegroundColor Red
            }
        }
        
    } else {
        $result = @{
            Component = $name
            Status = "❌"
            Issues = @("File not found: $path")
        }
        Write-Host "   ❌ File not found: $path" -ForegroundColor Red
    }
    
    return $result
}

# Test all package.json files
$results += Test-PackageJson "package.json" "Root Package"
$results += Test-PackageJson "apps/cli/package.json" "CLI Package"
$results += Test-PackageJson "apps/vscode-ext/package.json" "VS Code Extension"
$results += Test-PackageJson "odavl-website/package.json" "Website Package"

# Summary
Write-Host "`n📊 SUMMARY" -ForegroundColor Cyan
Write-Host "==========" -ForegroundColor Cyan

$passing = ($results | Where-Object { $_.Status -eq "✅" }).Count
$total = $results.Count

Write-Host "Components Checked: $total" -ForegroundColor White
Write-Host "Passing: $passing" -ForegroundColor Green
Write-Host "Failing: $($total - $passing)" -ForegroundColor Red

# Detailed results
Write-Host "`n📋 DETAILED RESULTS" -ForegroundColor Cyan
Write-Host "===================" -ForegroundColor Cyan

foreach ($result in $results) {
    Write-Host "$($result.Status) $($result.Component)"
    if ($result.Issues.Count -gt 0) {
        foreach ($issue in $result.Issues) {
            Write-Host "   $issue" -ForegroundColor Red
        }
    }
}

$overallPass = $passing -eq $total

Write-Host "`n🎯 FINAL RESULT" -ForegroundColor Cyan
Write-Host "===============" -ForegroundColor Cyan
if ($overallPass) {
    Write-Host "✅ TRACK 6 ECOSYSTEM LINKS: PASS" -ForegroundColor Green
} else {
    Write-Host "❌ TRACK 6 ECOSYSTEM LINKS: FAIL" -ForegroundColor Red
}

# Save results
$timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
$reportPath = "evidence/100pct/ecosystem-links-test-$timestamp.json"

$report = @{
    timestamp = (Get-Date).ToString("yyyy-MM-ddTHH:mm:ssZ")
    track = "Track 6: Ecosystem Links Unification"
    results = $results
    summary = @{
        total = $total
        passing = $passing
        failing = ($total - $passing)
        overallPass = $overallPass
    }
}

$report | ConvertTo-Json -Depth 5 | Out-File -FilePath $reportPath -Encoding UTF8
Write-Host "`n📝 Report saved: $reportPath" -ForegroundColor Gray

return $overallPass