# ODAVL Locale Smoke Test Script
$locales = @('en', 'de', 'fr', 'es', 'it', 'pt', 'ru', 'ja', 'zh', 'ar')
$baseUrl = 'http://localhost:3000'
$results = @()

Write-Host "🔥 SMOKE TEST: Testing all 10 locales..." -ForegroundColor Yellow

foreach ($locale in $locales) {
    $url = "$baseUrl/$locale"
    try {
        Write-Host "  🌐 Testing $locale -> $url" -ForegroundColor Cyan
        $response = Invoke-WebRequest -Uri $url -Method GET -TimeoutSec 10 -UseBasicParsing
        $status = $response.StatusCode
        $results += [PSCustomObject]@{
            Locale = $locale
            URL = $url
            Status = $status
            Result = if ($status -eq 200) { "✅ PASS" } else { "❌ FAIL" }
        }
        Write-Host "    Status: $status" -ForegroundColor $(if ($status -eq 200) { "Green" } else { "Red" })
    }
    catch {
        $results += [PSCustomObject]@{
            Locale = $locale
            URL = $url
            Status = "ERROR"
            Result = "❌ FAIL"
        }
        Write-Host "    ERROR: $($_.Exception.Message)" -ForegroundColor Red
    }
    Start-Sleep -Milliseconds 500
}

Write-Host "`n📊 SMOKE TEST RESULTS:" -ForegroundColor Yellow
$results | Format-Table -AutoSize
$passed = ($results | Where-Object { $_.Status -eq 200 }).Count
$total = $results.Count
Write-Host "✅ PASSED: $passed/$total locales" -ForegroundColor $(if ($passed -eq $total) { "Green" } else { "Yellow" })
