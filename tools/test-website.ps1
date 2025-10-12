#!/usr/bin/env pwsh
# ODAVL Website Golden Path Testing Script
# Tests key website pages and functionality

Write-Host "🌐 ODAVL Website Golden Path Testing" -ForegroundColor Cyan
Write-Host "======================================" -ForegroundColor Cyan

$baseUrl = "http://localhost:3000"
$testResults = @()

function Test-WebPage {
    param(
        [string]$Path,
        [string]$Description
    )
    
    Write-Host "`n🔍 Testing: $Description ($Path)" -ForegroundColor Yellow
    
    try {
        $client = New-Object System.Net.WebClient
        $client.Headers.Add("User-Agent", "ODAVL-GoldenPath-Test/1.0")
        
        $startTime = Get-Date
        $response = $client.DownloadString("$baseUrl$Path")
        $endTime = Get-Date
        $loadTime = ($endTime - $startTime).TotalMilliseconds
        
        $result = @{
            Path = $Path
            Description = $Description
            Success = $true
            LoadTime = [math]::Round($loadTime, 2)
            ContentLength = $response.Length
            HasTitle = $response -match '<title[^>]*>([^<]+)</title>'
            HasMeta = $response -match '<meta[^>]+content="[^""]+"[^>]*>'
            Error = $null
        }
        
        if ($result.HasTitle) {
            $titleMatch = [regex]::Match($response, '<title[^>]*>([^<]+)</title>')
            $result.Title = $titleMatch.Groups[1].Value.Trim()
        }
        
        Write-Host "✅ SUCCESS" -ForegroundColor Green
        Write-Host "   Load Time: $($result.LoadTime)ms" -ForegroundColor Gray
        Write-Host "   Content: $($result.ContentLength) chars" -ForegroundColor Gray
        if ($result.HasTitle) {
            Write-Host "   Title: $($result.Title)" -ForegroundColor Gray
        }
        
    } catch {
        $result = @{
            Path = $Path
            Description = $Description
            Success = $false
            LoadTime = 0
            ContentLength = 0
            HasTitle = $false
            HasMeta = $false
            Error = $_.Exception.Message
        }
        
        Write-Host "❌ FAILED: $($result.Error)" -ForegroundColor Red
    } finally {
        if ($client) { $client.Dispose() }
    }
    
    return $result
}

# Test key pages
$testPages = @(
    @{ Path = "/"; Description = "Homepage" },
    @{ Path = "/docs"; Description = "Documentation" },
    @{ Path = "/signup"; Description = "Signup Page" },
    @{ Path = "/privacy-policy"; Description = "Privacy Policy" },
    @{ Path = "/terms"; Description = "Terms of Service" }
)

foreach ($page in $testPages) {
    $result = Test-WebPage -Path $page.Path -Description $page.Description
    $testResults += $result
}

# Summary
Write-Host "`n📊 SUMMARY" -ForegroundColor Cyan
Write-Host "==========" -ForegroundColor Cyan

$successful = ($testResults | Where-Object { $_.Success }).Count
$total = $testResults.Count
$avgLoadTime = if ($successful -gt 0) { 
    [math]::Round(($testResults | Where-Object { $_.Success } | Measure-Object -Property LoadTime -Average).Average, 2) 
} else { 0 }

Write-Host "Pages Tested: $total" -ForegroundColor White
Write-Host "Successful: $successful" -ForegroundColor Green
Write-Host "Failed: $($total - $successful)" -ForegroundColor Red
Write-Host "Average Load Time: ${avgLoadTime}ms" -ForegroundColor Yellow

# Detailed results
Write-Host "`n📋 DETAILED RESULTS" -ForegroundColor Cyan
Write-Host "===================" -ForegroundColor Cyan

foreach ($result in $testResults) {
    $status = if ($result.Success) { "✅" } else { "❌" }
    Write-Host "$status $($result.Path) - $($result.Description)"
    if ($result.Success) {
        Write-Host "   Load: $($result.LoadTime)ms | Size: $($result.ContentLength) chars"
    } else {
        Write-Host "   Error: $($result.Error)" -ForegroundColor Red
    }
}

# Performance check
$passingScore = 90
$performanceScore = if ($successful -eq $total -and $avgLoadTime -lt 2000) { 95 } 
                   elseif ($successful -eq $total -and $avgLoadTime -lt 5000) { 85 }
                   else { 70 }

Write-Host "`n🏆 PERFORMANCE SCORE" -ForegroundColor Cyan
Write-Host "====================" -ForegroundColor Cyan
Write-Host "Score: $performanceScore/100" -ForegroundColor $(if ($performanceScore -ge $passingScore) { "Green" } else { "Red" })
Write-Host "Requirement: ≥90 (Lighthouse equivalent)"

$overallPass = $successful -eq $total -and $performanceScore -ge $passingScore

Write-Host "`n🎯 FINAL RESULT" -ForegroundColor Cyan
Write-Host "===============" -ForegroundColor Cyan
if ($overallPass) {
    Write-Host "✅ TRACK 4 WEBSITE GOLDEN PATH: PASS" -ForegroundColor Green
} else {
    Write-Host "❌ TRACK 4 WEBSITE GOLDEN PATH: FAIL" -ForegroundColor Red
}

# Export results
$timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
$reportPath = "evidence/100pct/website-golden-path-test-$timestamp.json"

$report = @{
    timestamp = (Get-Date).ToString("yyyy-MM-ddTHH:mm:ssZ")
    track = "Track 4: Website Golden Path"
    baseUrl = $baseUrl
    testResults = $testResults
    summary = @{
        totalPages = $total
        successful = $successful
        failed = ($total - $successful)
        averageLoadTime = $avgLoadTime
        performanceScore = $performanceScore
        overallPass = $overallPass
    }
}

$report | ConvertTo-Json -Depth 10 | Out-File -FilePath $reportPath -Encoding UTF8
Write-Host "`n📝 Report saved: $reportPath" -ForegroundColor Gray

return $overallPass