#!/usr/bin/env pwsh
# Test Autopilot Service Endpoints

Write-Host "`n🧪 ODAVL Autopilot Service - Endpoint Tests" -ForegroundColor Cyan
Write-Host "=" * 60 -ForegroundColor Gray

$baseUrl = "http://localhost:3004"

# Test 1: Health Check
Write-Host "`n1️⃣  Testing Health Endpoint..." -ForegroundColor Yellow
try {
  $response = Invoke-WebRequest -Uri "$baseUrl/api/health" -UseBasicParsing -TimeoutSec 5
  Write-Host "   ✅ Status: $($response.StatusCode)" -ForegroundColor Green
  $health = $response.Content | ConvertFrom-Json
  Write-Host "   Service: $($health.service)" -ForegroundColor Cyan
  Write-Host "   Status: $($health.status)" -ForegroundColor Cyan
  Write-Host "   Phases: $($health.engine.phases -join ', ')" -ForegroundColor Cyan
} catch {
  Write-Host "   ❌ Failed: $($_.Exception.Message)" -ForegroundColor Red
  exit 1
}

# Test 2: Adapter Registration
Write-Host "`n2️⃣  Testing Adapter Registration..." -ForegroundColor Yellow
try {
  $response = Invoke-WebRequest -Uri "$baseUrl/api/test-adapter" -UseBasicParsing -TimeoutSec 5
  Write-Host "   ✅ Status: $($response.StatusCode)" -ForegroundColor Green
  $adapter = $response.Content | ConvertFrom-Json
  Write-Host "   Registered: $($adapter.adapterRegistered)" -ForegroundColor Cyan
  Write-Host "   Message: $($adapter.message)" -ForegroundColor Cyan
  
  if (-not $adapter.adapterRegistered) {
    Write-Host "   ⚠️  Adapter not registered - fix endpoint will fail!" -ForegroundColor Red
    exit 1
  }
} catch {
  Write-Host "   ❌ Failed: $($_.Exception.Message)" -ForegroundColor Red
  Write-Host "   ℹ️  Endpoint may not exist - checking server logs..." -ForegroundColor Yellow
}

# Test 3: Simple Observe (with shorter timeout)
Write-Host "`n3️⃣  Testing Observe Phase (quick test)..." -ForegroundColor Yellow
try {
  # Create a temporary test directory with minimal files
  $testDir = Join-Path $env:TEMP "odavl-test-$(Get-Date -Format 'yyyyMMddHHmmss')"
  New-Item -ItemType Directory -Path $testDir -Force | Out-Null
  "console.log('test');" | Out-File -FilePath "$testDir\test.js" -Encoding UTF8
  
  $body = @{
    workspaceRoot = $testDir
    mode = "observe"
    maxFiles = 1
  } | ConvertTo-Json
  
  Write-Host "   Test workspace: $testDir" -ForegroundColor Gray
  
  $response = Invoke-WebRequest -Uri "$baseUrl/api/fix" `
    -Method POST `
    -ContentType "application/json" `
    -Body $body `
    -UseBasicParsing `
    -TimeoutSec 30
  
  Write-Host "   ✅ Status: $($response.StatusCode)" -ForegroundColor Green
  $result = $response.Content | ConvertFrom-Json
  Write-Host "   Success: $($result.success)" -ForegroundColor Cyan
  Write-Host "   Mode: $($result.mode)" -ForegroundColor Cyan
  
  # Cleanup
  Remove-Item -Path $testDir -Recurse -Force -ErrorAction SilentlyContinue
  
} catch {
  Write-Host "   ❌ Failed: $($_.Exception.Message)" -ForegroundColor Red
  Write-Host "   ℹ️  This may indicate the observe phase is hanging or adapter issue" -ForegroundColor Yellow
  
  # Cleanup
  if (Test-Path $testDir) {
    Remove-Item -Path $testDir -Recurse -Force -ErrorAction SilentlyContinue
  }
}

Write-Host "`n" -NoNewline
Write-Host "=" * 60 -ForegroundColor Gray
Write-Host "🏁 Tests Complete" -ForegroundColor Cyan
Write-Host ""
