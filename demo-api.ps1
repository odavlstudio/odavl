#!/usr/bin/env pwsh
# Quick Guardian API Demo

Write-Host "`n🎯 ODAVL Guardian API - Live Demo" -ForegroundColor Cyan
Write-Host "=" * 50 -ForegroundColor Gray

# Check if server is running
try {
    $health = Invoke-RestMethod -Uri "http://localhost:3004/health" -Method GET -ErrorAction Stop
    Write-Host "`n✅ API Server is running" -ForegroundColor Green
    Write-Host "   Status: $($health.status)" -ForegroundColor Gray
} catch {
    Write-Host "`n❌ API Server not running. Please start it first." -ForegroundColor Red
    Write-Host "   Run: cd odavl-studio/guardian/api && pnpm dev" -ForegroundColor Yellow
    exit 1
}

# Create test
Write-Host "`n📝 Creating Test..." -ForegroundColor Yellow
$headers = @{
    "Authorization" = "Bearer demo-key-123"
    "Content-Type" = "application/json"
}
$testData = @{
    name = "GitHub Homepage Test"
    url = "https://github.com"
    schedule = "*/10 * * * *"
    enabled = $true
    detectors = @("white-screen", "404", "console-error")
} | ConvertTo-Json

try {
    $test = Invoke-RestMethod -Uri "http://localhost:3004/api/tests" -Method POST -Headers $headers -Body $testData
    $testId = $test.data.id
    Write-Host "✅ Test created!" -ForegroundColor Green
    Write-Host "   ID: $testId" -ForegroundColor Gray
    Write-Host "   Name: $($test.data.name)" -ForegroundColor Gray
} catch {
    Write-Host "❌ Failed: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.ErrorDetails.Message) {
        Write-Host "   Details: $($_.ErrorDetails.Message)" -ForegroundColor Red
    }
    exit 1
}

# Execute test
Write-Host "`n▶️  Executing Test..." -ForegroundColor Yellow
try {
    $exec = Invoke-RestMethod -Uri "http://localhost:3004/api/tests/$testId/execute" -Method POST -Headers $headers
    Write-Host "✅ Test execution started!" -ForegroundColor Green
    Write-Host "   Execution ID: $($exec.data.executionId)" -ForegroundColor Gray
    Write-Host "   Status: $($exec.data.status)" -ForegroundColor Gray
} catch {
    Write-Host "❌ Failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Wait for result
Write-Host "`n⏳ Waiting for test results..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

# Get results
try {
    $executions = Invoke-RestMethod -Uri "http://localhost:3004/api/tests/$testId/executions?limit=1" -Method GET -Headers $headers
    if ($executions.data.Count -gt 0) {
        $result = $executions.data[0]
        Write-Host "✅ Test completed!" -ForegroundColor Green
        Write-Host "   Status: $($result.status)" -ForegroundColor Gray
        Write-Host "   Issues Found: $($result.issuesCount)" -ForegroundColor $(if ($result.issuesCount -gt 0) { "Red" } else { "Green" })
        Write-Host "   Duration: $($result.duration)ms" -ForegroundColor Gray
    }
} catch {
    Write-Host "❌ Failed to get results" -ForegroundColor Red
}

# Get stats
Write-Host "`n📊 Test Statistics:" -ForegroundColor Yellow
try {
    $stats = Invoke-RestMethod -Uri "http://localhost:3004/api/tests/$testId/stats" -Method GET -Headers $headers
    Write-Host "   Total Executions: $($stats.data.totalExecutions)" -ForegroundColor Gray
    Write-Host "   Success Rate: $($stats.data.successRate)%" -ForegroundColor Gray
    Write-Host "   Avg Duration: $($stats.data.avgDuration)ms" -ForegroundColor Gray
} catch {
    Write-Host "   (No stats yet)" -ForegroundColor Gray
}

Write-Host "`n✨ Demo Complete!" -ForegroundColor Green
Write-Host "=" * 50 -ForegroundColor Gray
