# Test Guardian API
$baseUrl = "http://localhost:3004"
$apiKey = "demo-key-123"
$headers = @{
    "X-API-Key" = $apiKey
    "Content-Type" = "application/json"
}

Write-Host "🧪 Testing Guardian API..." -ForegroundColor Cyan
Write-Host ""

# 1. Health Check
Write-Host "1️⃣  Health Check..." -ForegroundColor Yellow
try {
    $health = Invoke-RestMethod -Uri "$baseUrl/health" -Method GET
    Write-Host "✅ Server is healthy!" -ForegroundColor Green
    Write-Host "   Status: $($health.status)" -ForegroundColor Gray
    Write-Host ""
} catch {
    Write-Host "❌ Health check failed: $_" -ForegroundColor Red
    exit 1
}

# 2. Create Test
Write-Host "2️⃣  Creating scheduled test..." -ForegroundColor Yellow
$testData = @{
    name = "Test ODAVL Website"
    url = "https://odavl.studio"
    schedule = "*/5 * * * *"
    enabled = $true
    detectors = @("white-screen", "404", "console-error")
} | ConvertTo-Json

try {
    $test = Invoke-RestMethod -Uri "$baseUrl/api/tests" -Method POST -Headers $headers -Body $testData
    $testId = $test.data.id
    Write-Host "✅ Test created successfully!" -ForegroundColor Green
    Write-Host "   Test ID: $testId" -ForegroundColor Gray
    Write-Host "   Name: $($test.data.name)" -ForegroundColor Gray
    Write-Host "   URL: $($test.data.url)" -ForegroundColor Gray
    Write-Host ""
} catch {
    Write-Host "❌ Failed to create test: $_" -ForegroundColor Red
    exit 1
}

# 3. Execute Test
Write-Host "3️⃣  Executing test..." -ForegroundColor Yellow
try {
    $execution = Invoke-RestMethod -Uri "$baseUrl/api/tests/$testId/execute" -Method POST -Headers $headers
    Write-Host "✅ Test executed!" -ForegroundColor Green
    Write-Host "   Execution ID: $($execution.data.executionId)" -ForegroundColor Gray
    Write-Host "   Status: $($execution.data.status)" -ForegroundColor Gray
    Write-Host ""
} catch {
    Write-Host "❌ Failed to execute test: $_" -ForegroundColor Red
}

# 4. List Tests
Write-Host "4️⃣  Listing all tests..." -ForegroundColor Yellow
try {
    $tests = Invoke-RestMethod -Uri "$baseUrl/api/tests" -Method GET -Headers $headers
    Write-Host "✅ Found $($tests.data.Count) test(s)" -ForegroundColor Green
    foreach ($t in $tests.data) {
        Write-Host "   - $($t.name) ($($t.id))" -ForegroundColor Gray
    }
    Write-Host ""
} catch {
    Write-Host "❌ Failed to list tests: $_" -ForegroundColor Red
}

# 5. Get Test Stats
Write-Host "5️⃣  Getting test statistics..." -ForegroundColor Yellow
try {
    $stats = Invoke-RestMethod -Uri "$baseUrl/api/tests/$testId/stats" -Method GET -Headers $headers
    Write-Host "✅ Statistics retrieved!" -ForegroundColor Green
    Write-Host "   Total Executions: $($stats.data.totalExecutions)" -ForegroundColor Gray
    Write-Host "   Success Rate: $($stats.data.successRate)%" -ForegroundColor Gray
    Write-Host ""
} catch {
    Write-Host "❌ Failed to get stats: $_" -ForegroundColor Red
}

Write-Host "🎉 Guardian API Test Complete!" -ForegroundColor Green
