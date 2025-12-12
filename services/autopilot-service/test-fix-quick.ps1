#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Test Autopilot Service Quick Fix Mode
.DESCRIPTION
    Benchmark script to test observeQuick() performance
    Target: 3-8 seconds execution time
#>

param(
    [string]$WorkspaceRoot = "C:\Users\sabou\dev\odavl",
    [string]$ServiceUrl = "http://localhost:3004",
    [switch]$IncludeDecide,
    [switch]$IncludeAct
)

Write-Host "`n⚡ ODAVL Autopilot - Quick Fix Mode Test" -ForegroundColor Cyan
Write-Host "=" * 70 -ForegroundColor Gray

# =============================================================================
# 1. Check Server Health
# =============================================================================
Write-Host "`n1️⃣  Checking Autopilot Service..." -ForegroundColor Yellow

try {
    $healthResponse = Invoke-WebRequest -Uri "$ServiceUrl/api/health" -UseBasicParsing -TimeoutSec 5
    if ($healthResponse.StatusCode -eq 200) {
        Write-Host "   ✅ Service is running" -ForegroundColor Green
        $health = $healthResponse.Content | ConvertFrom-Json
        Write-Host "   Status: $($health.status)" -ForegroundColor Cyan
        Write-Host "   Port: $($health.port)" -ForegroundColor Cyan
    }
} catch {
    Write-Host "   ❌ Service not reachable: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "   💡 Start server: cd services/autopilot-service; npx tsx src/server.ts" -ForegroundColor Yellow
    exit 1
}

# =============================================================================
# 2. Test Quick Fix Endpoint (GET)
# =============================================================================
Write-Host "`n2️⃣  Testing Quick Fix Endpoint Info..." -ForegroundColor Yellow

try {
    $infoResponse = Invoke-WebRequest -Uri "$ServiceUrl/api/fix/quick" -UseBasicParsing -TimeoutSec 5
    if ($infoResponse.StatusCode -eq 200) {
        Write-Host "   ✅ Endpoint registered" -ForegroundColor Green
        $info = $infoResponse.Content | ConvertFrom-Json
        Write-Host "   Target Duration: $($info.features.targetDuration)" -ForegroundColor Cyan
        Write-Host "   Detectors: $($info.features.detectors -join ', ')" -ForegroundColor Cyan
    }
} catch {
    Write-Host "   ❌ Endpoint not available: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# =============================================================================
# 3. Test Quick Mode (POST) - Observe Only
# =============================================================================
Write-Host "`n3️⃣  Testing Quick Mode (Observe Only)..." -ForegroundColor Yellow
Write-Host "   Workspace: $WorkspaceRoot" -ForegroundColor Gray
Write-Host "   Starting benchmark..." -ForegroundColor Gray

$body = @{
    workspaceRoot = $WorkspaceRoot
    includeDecide = $false
    includeAct = $false
} | ConvertTo-Json

try {
    $startTime = Get-Date
    
    $response = Invoke-WebRequest `
        -Uri "$ServiceUrl/api/fix/quick" `
        -Method POST `
        -ContentType "application/json" `
        -Body $body `
        -UseBasicParsing `
        -TimeoutSec 30
    
    $endTime = Get-Date
    $clientDuration = ($endTime - $startTime).TotalSeconds
    
    if ($response.StatusCode -eq 200) {
        Write-Host "`n   ✅ Quick analysis successful!" -ForegroundColor Green
        
        $result = $response.Content | ConvertFrom-Json
        
        Write-Host "`n   📊 Performance Metrics:" -ForegroundColor Cyan
        Write-Host "   ├─ Server Duration: $($result.duration.total)" -ForegroundColor White
        Write-Host "   ├─ Observe Time: $($result.duration.observe)" -ForegroundColor White
        Write-Host "   ├─ Client Total: $([math]::Round($clientDuration, 2))s" -ForegroundColor White
        Write-Host "   └─ Total ms: $($result.duration.totalMs)ms" -ForegroundColor White
        
        Write-Host "`n   🔍 Issues Found:" -ForegroundColor Cyan
        Write-Host "   ├─ Total Issues: $($result.summary.totalIssues)" -ForegroundColor White
        Write-Host "   ├─ TypeScript: $($result.summary.breakdown.typescript)" -ForegroundColor White
        Write-Host "   ├─ Imports: $($result.summary.breakdown.imports)" -ForegroundColor White
        Write-Host "   ├─ Circular: $($result.summary.breakdown.circular)" -ForegroundColor White
        Write-Host "   └─ Packages: $($result.summary.breakdown.packages)" -ForegroundColor White
        
        # Benchmark assessment
        $serverSeconds = [double]::Parse($result.duration.total.TrimEnd('s'))
        Write-Host "`n   🎯 Benchmark Assessment:" -ForegroundColor Cyan
        if ($serverSeconds -le 3) {
            Write-Host "   ⚡ EXCELLENT: ≤3s (Target exceeded!)" -ForegroundColor Green
        } elseif ($serverSeconds -le 8) {
            Write-Host "   ✅ GOOD: $([math]::Round($serverSeconds, 2))s (Within target 3-8s)" -ForegroundColor Green
        } elseif ($serverSeconds -le 15) {
            Write-Host "   ⚠️  ACCEPTABLE: $([math]::Round($serverSeconds, 2))s (Above target but usable)" -ForegroundColor Yellow
        } else {
            Write-Host "   ❌ SLOW: $([math]::Round($serverSeconds, 2))s (Needs optimization)" -ForegroundColor Red
        }
        
        # Save detailed results
        $resultFile = "test-fix-quick-results.json"
        $result | ConvertTo-Json -Depth 10 | Out-File $resultFile -Encoding UTF8
        Write-Host "`n   💾 Detailed results saved: $resultFile" -ForegroundColor Gray
        
    }
} catch {
    Write-Host "   ❌ Request failed: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.Exception.Response) {
        Write-Host "   Status Code: $($_.Exception.Response.StatusCode.value__)" -ForegroundColor Red
    }
    exit 1
}

# =============================================================================
# 4. Test with Decide Phase (Optional)
# =============================================================================
if ($IncludeDecide) {
    Write-Host "`n4️⃣  Testing Quick Mode + Decide..." -ForegroundColor Yellow
    
    $bodyWithDecide = @{
        workspaceRoot = $WorkspaceRoot
        includeDecide = $true
        includeAct = $false
    } | ConvertTo-Json
    
    try {
        $startTime = Get-Date
        
        $response = Invoke-WebRequest `
            -Uri "$ServiceUrl/api/fix/quick" `
            -Method POST `
            -ContentType "application/json" `
            -Body $bodyWithDecide `
            -UseBasicParsing `
            -TimeoutSec 60
        
        $endTime = Get-Date
        $clientDuration = ($endTime - $startTime).TotalSeconds
        
        if ($response.StatusCode -eq 200) {
            Write-Host "   ✅ Quick + Decide successful!" -ForegroundColor Green
            $result = $response.Content | ConvertFrom-Json
            Write-Host "   Total Duration: $($result.duration.total)" -ForegroundColor Cyan
            Write-Host "   Client Duration: $([math]::Round($clientDuration, 2))s" -ForegroundColor Cyan
        }
    } catch {
        Write-Host "   ❌ Request failed: $($_.Exception.Message)" -ForegroundColor Red
    }
}

# =============================================================================
# 5. Test with Act Phase (Optional)
# =============================================================================
if ($IncludeAct) {
    Write-Host "`n5️⃣  Testing Quick Mode + Decide + Act..." -ForegroundColor Yellow
    Write-Host "   ⚠️  This will make changes to the workspace!" -ForegroundColor Yellow
    Write-Host "   Press Ctrl+C to cancel, or Enter to continue..." -ForegroundColor Yellow
    $null = Read-Host
    
    $bodyWithAct = @{
        workspaceRoot = $WorkspaceRoot
        includeDecide = $true
        includeAct = $true
    } | ConvertTo-Json
    
    try {
        $startTime = Get-Date
        
        $response = Invoke-WebRequest `
            -Uri "$ServiceUrl/api/fix/quick" `
            -Method POST `
            -ContentType "application/json" `
            -Body $bodyWithAct `
            -UseBasicParsing `
            -TimeoutSec 120
        
        $endTime = Get-Date
        $clientDuration = ($endTime - $startTime).TotalSeconds
        
        if ($response.StatusCode -eq 200) {
            Write-Host "   ✅ Full cycle successful!" -ForegroundColor Green
            $result = $response.Content | ConvertFrom-Json
            Write-Host "   Total Duration: $($result.duration.total)" -ForegroundColor Cyan
            Write-Host "   Client Duration: $([math]::Round($clientDuration, 2))s" -ForegroundColor Cyan
        }
    } catch {
        Write-Host "   ❌ Request failed: $($_.Exception.Message)" -ForegroundColor Red
    }
}

# =============================================================================
# Summary
# =============================================================================
Write-Host "`n" -NoNewline
Write-Host "=" * 70 -ForegroundColor Gray
Write-Host "🏁 Quick Mode Test Complete" -ForegroundColor Cyan
Write-Host ""
Write-Host "📝 Usage Examples:" -ForegroundColor Yellow
Write-Host "   Basic test:         .\test-fix-quick.ps1" -ForegroundColor Gray
Write-Host "   With decide:        .\test-fix-quick.ps1 -IncludeDecide" -ForegroundColor Gray
Write-Host "   Full cycle:         .\test-fix-quick.ps1 -IncludeDecide -IncludeAct" -ForegroundColor Gray
Write-Host "   Custom workspace:   .\test-fix-quick.ps1 -WorkspaceRoot C:\path\to\project" -ForegroundColor Gray
Write-Host ""
