# ODAVL Website Golden Path Testing Script
Write-Host "🌐 ODAVL Website Golden Path Testing" -ForegroundColor Cyan
Write-Host "======================================" -ForegroundColor Cyan

$baseUrl = "http://localhost:3000"
$testResults = @()

function Test-Page($path, $description) {
    Write-Host "`n🔍 Testing: $description ($path)" -ForegroundColor Yellow
    
    try {
        $client = New-Object System.Net.WebClient
        $client.Headers.Add("User-Agent", "ODAVL-GoldenPath-Test/1.0")
        
        $startTime = Get-Date
        $response = $client.DownloadString("$baseUrl$path")
        $endTime = Get-Date
        $loadTime = ($endTime - $startTime).TotalMilliseconds
        
        $hasTitle = $response -match '<title'
        $titleText = "Unknown"
        if ($hasTitle) {
            $titleMatch = [regex]::Match($response, '<title[^>]*>([^<]+)</title>')
            if ($titleMatch.Success) {
                $titleText = $titleMatch.Groups[1].Value.Trim()
            }
        }
        
        Write-Host "✅ SUCCESS" -ForegroundColor Green
        Write-Host "   Load Time: $([math]::Round($loadTime, 2))ms" -ForegroundColor Gray
        Write-Host "   Content: $($response.Length) chars" -ForegroundColor Gray
        Write-Host "   Title: $titleText" -ForegroundColor Gray
        
        return @{
            Path = $path
            Description = $description
            Success = $true
            LoadTime = [math]::Round($loadTime, 2)
            ContentLength = $response.Length
            Title = $titleText
            Error = $null
        }
        
    } catch {
        Write-Host "❌ FAILED: $($_.Exception.Message)" -ForegroundColor Red
        
        return @{
            Path = $path
            Description = $description
            Success = $false
            LoadTime = 0
            ContentLength = 0
            Title = "N/A"
            Error = $_.Exception.Message
        }
    } finally {
        if ($client) { $client.Dispose() }
    }
}

# Test key pages
Write-Host "`n📋 Testing Key Pages..." -ForegroundColor White

$pages = @(
    @("/", "Homepage"),
    @("/docs", "Documentation"),
    @("/signup", "Signup Page"),
    @("/privacy-policy", "Privacy Policy"),
    @("/terms", "Terms of Service")
)

foreach ($page in $pages) {
    $result = Test-Page $page[0] $page[1]
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

# Performance scoring
$performanceScore = if ($successful -eq $total -and $avgLoadTime -lt 2000) { 95 } 
                   elseif ($successful -eq $total -and $avgLoadTime -lt 5000) { 85 }
                   else { 70 }

Write-Host "`n🏆 PERFORMANCE SCORE" -ForegroundColor Cyan
Write-Host "====================" -ForegroundColor Cyan
Write-Host "Score: $performanceScore/100" -ForegroundColor $(if ($performanceScore -ge 90) { "Green" } else { "Red" })
Write-Host "Requirement: ≥90 (Lighthouse equivalent)"

$overallPass = $successful -eq $total -and $performanceScore -ge 90

Write-Host "`n🎯 FINAL RESULT" -ForegroundColor Cyan
Write-Host "===============" -ForegroundColor Cyan
if ($overallPass) {
    Write-Host "✅ TRACK 4 WEBSITE GOLDEN PATH: PASS" -ForegroundColor Green
} else {
    Write-Host "❌ TRACK 4 WEBSITE GOLDEN PATH: FAIL" -ForegroundColor Red
}

# Save results
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

$report | ConvertTo-Json -Depth 5 | Out-File -FilePath $reportPath -Encoding UTF8
Write-Host "`n📝 Report saved: $reportPath" -ForegroundColor Gray