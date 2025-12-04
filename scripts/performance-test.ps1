#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Performance testing script for ODAVL Insight Cloud
    
.DESCRIPTION
    Runs comprehensive performance tests including:
    - Load testing with k6
    - Lighthouse performance audit
    - Bundle size analysis
    - Memory profiling
    - API response time testing
    
.PARAMETER TestType
    Type of performance test to run:
    - all: Run all tests (default)
    - load: Load testing with k6
    - lighthouse: Lighthouse audit
    - bundle: Bundle size analysis
    - memory: Memory profiling
    - api: API response time testing
    
.PARAMETER BaseUrl
    Base URL for testing (default: http://localhost:3001)
    
.EXAMPLE
    .\performance-test.ps1
    
.EXAMPLE
    .\performance-test.ps1 -TestType load -BaseUrl https://odavl-insight.vercel.app
#>

param(
    [Parameter(Mandatory=$false)]
    [ValidateSet('all', 'load', 'lighthouse', 'bundle', 'memory', 'api')]
    [string]$TestType = 'all',
    
    [Parameter(Mandatory=$false)]
    [string]$BaseUrl = 'http://localhost:3001'
)

# Color functions
function Write-Success { param($Message) Write-Host $Message -ForegroundColor Green }
function Write-Info { param($Message) Write-Host $Message -ForegroundColor Cyan }
function Write-Warning { param($Message) Write-Host $Message -ForegroundColor Yellow }
function Write-Error { param($Message) Write-Host $Message -ForegroundColor Red }

# Header
Write-Host "`n════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  ODAVL INSIGHT - PERFORMANCE TESTING" -ForegroundColor White -BackgroundColor Blue
Write-Host "════════════════════════════════════════`n" -ForegroundColor Cyan

Write-Info "Test Type: $TestType"
Write-Info "Base URL: $BaseUrl"
Write-Host ""

# Results directory
$ResultsDir = "reports/performance-$(Get-Date -Format 'yyyy-MM-dd-HHmm')"
New-Item -ItemType Directory -Force -Path $ResultsDir | Out-Null
Write-Info "Results will be saved to: $ResultsDir`n"

# Function: Load Testing with k6
function Test-Load {
    Write-Info "═══════════════════════════════════════"
    Write-Info "  1. LOAD TESTING WITH K6"
    Write-Info "═══════════════════════════════════════`n"
    
    # Check if k6 is installed
    $k6Installed = Get-Command k6 -ErrorAction SilentlyContinue
    if (-not $k6Installed) {
        Write-Warning "k6 is not installed. Installing..."
        if ($IsWindows) {
            choco install k6 -y
        } elseif ($IsMacOS) {
            brew install k6
        } else {
            Write-Error "Please install k6 manually: https://k6.io/docs/getting-started/installation/"
            return
        }
    }
    
    Write-Info "Running k6 load test (this may take several minutes)...`n"
    
    $env:BASE_URL = $BaseUrl
    k6 run tests/load-test.js --out json="$ResultsDir/k6-results.json" | Tee-Object -FilePath "$ResultsDir/k6-output.txt"
    
    if ($LASTEXITCODE -eq 0) {
        Write-Success "`n✅ Load testing completed successfully!"
        Write-Info "Results saved to: $ResultsDir/k6-results.json`n"
    } else {
        Write-Error "`n❌ Load testing failed with exit code $LASTEXITCODE`n"
    }
}

# Function: Lighthouse Performance Audit
function Test-Lighthouse {
    Write-Info "═══════════════════════════════════════"
    Write-Info "  2. LIGHTHOUSE PERFORMANCE AUDIT"
    Write-Info "═══════════════════════════════════════`n"
    
    # Check if lighthouse is installed
    $lighthouseInstalled = Get-Command lighthouse -ErrorAction SilentlyContinue
    if (-not $lighthouseInstalled) {
        Write-Warning "Lighthouse is not installed. Installing..."
        npm install -g lighthouse
    }
    
    Write-Info "Running Lighthouse audit...`n"
    
    $pages = @(
        @{ name = "Homepage"; url = "$BaseUrl" },
        @{ name = "Dashboard"; url = "$BaseUrl/dashboard" },
        @{ name = "Analysis"; url = "$BaseUrl/dashboard/analysis" }
    )
    
    foreach ($page in $pages) {
        Write-Info "Auditing: $($page.name) ($($page.url))"
        
        lighthouse $page.url `
            --output=html `
            --output=json `
            --output-path="$ResultsDir/lighthouse-$($page.name.ToLower())" `
            --chrome-flags="--headless" `
            --quiet
        
        if ($LASTEXITCODE -eq 0) {
            Write-Success "  ✅ $($page.name) audit complete"
        } else {
            Write-Error "  ❌ $($page.name) audit failed"
        }
    }
    
    Write-Success "`n✅ Lighthouse audits completed!`n"
}

# Function: Bundle Size Analysis
function Test-Bundle {
    Write-Info "═══════════════════════════════════════"
    Write-Info "  3. BUNDLE SIZE ANALYSIS"
    Write-Info "═══════════════════════════════════════`n"
    
    Write-Info "Building Next.js with bundle analyzer...`n"
    
    Push-Location "odavl-studio/insight/cloud"
    
    $env:ANALYZE = 'true'
    pnpm build | Tee-Object -FilePath "$ResultsDir/build-output.txt"
    
    if ($LASTEXITCODE -eq 0) {
        Write-Success "`n✅ Build completed successfully!"
        
        # Copy bundle analysis report
        if (Test-Path ".next/bundle-analysis.html") {
            Copy-Item ".next/bundle-analysis.html" "$ResultsDir/bundle-analysis.html"
            Write-Info "Bundle analysis saved to: $ResultsDir/bundle-analysis.html"
        }
        
        # Get .next folder size
        $nextSize = (Get-ChildItem .next -Recurse | Measure-Object -Property Length -Sum).Sum / 1MB
        Write-Info "`nTotal .next folder size: $([math]::Round($nextSize, 2)) MB"
        
        # Get specific bundle sizes
        Write-Info "`nBundle Sizes:"
        Get-ChildItem .next/static/chunks/*.js | ForEach-Object {
            $sizeKB = $_.Length / 1KB
            Write-Host "  $($_.Name): $([math]::Round($sizeKB, 2)) KB" -ForegroundColor Gray
        }
    } else {
        Write-Error "`n❌ Build failed with exit code $LASTEXITCODE"
    }
    
    Pop-Location
    Write-Host ""
}

# Function: Memory Profiling
function Test-Memory {
    Write-Info "═══════════════════════════════════════"
    Write-Info "  4. MEMORY PROFILING"
    Write-Info "═══════════════════════════════════════`n"
    
    Write-Info "Running memory profiling (30 seconds)...`n"
    
    # Start Node.js with memory profiling
    Push-Location "odavl-studio/insight/cloud"
    
    $job = Start-Job -ScriptBlock {
        param($BaseUrl)
        
        # Monitor memory every 5 seconds for 30 seconds
        $results = @()
        for ($i = 0; $i -lt 6; $i++) {
            Start-Sleep -Seconds 5
            
            # Get process memory
            $process = Get-Process -Name node -ErrorAction SilentlyContinue | 
                       Where-Object { $_.Path -like "*odavl*" } | 
                       Select-Object -First 1
            
            if ($process) {
                $results += @{
                    timestamp = Get-Date -Format "HH:mm:ss"
                    memoryMB = [math]::Round($process.WorkingSet64 / 1MB, 2)
                    cpuPercent = [math]::Round($process.CPU, 2)
                }
            }
        }
        
        return $results
    } -ArgumentList $BaseUrl
    
    Wait-Job $job | Out-Null
    $memoryResults = Receive-Job $job
    Remove-Job $job
    
    if ($memoryResults) {
        Write-Info "Memory Usage Over Time:"
        $memoryResults | ForEach-Object {
            Write-Host "  [$($_.timestamp)] Memory: $($_.memoryMB) MB | CPU: $($_.cpuPercent)%" -ForegroundColor Gray
        }
        
        # Save results
        $memoryResults | ConvertTo-Json | Out-File "$ResultsDir/memory-profile.json"
        Write-Success "`n✅ Memory profiling completed!`n"
    } else {
        Write-Warning "`n⚠️  Could not find running Node.js process`n"
    }
    
    Pop-Location
}

# Function: API Response Time Testing
function Test-Api {
    Write-Info "═══════════════════════════════════════"
    Write-Info "  5. API RESPONSE TIME TESTING"
    Write-Info "═══════════════════════════════════════`n"
    
    $endpoints = @(
        @{ name = "Health Check"; path = "/api/health"; method = "GET" },
        @{ name = "Metrics"; path = "/api/analysis/metrics"; method = "GET" },
        @{ name = "Charts"; path = "/api/charts/trends"; method = "GET" },
        @{ name = "Widgets"; path = "/api/widgets/recent"; method = "GET" }
    )
    
    $results = @()
    
    foreach ($endpoint in $endpoints) {
        Write-Info "Testing: $($endpoint.name) ($($endpoint.method) $($endpoint.path))"
        
        $timings = @()
        for ($i = 0; $i -lt 10; $i++) {
            $start = Get-Date
            
            try {
                $response = Invoke-WebRequest -Uri "$BaseUrl$($endpoint.path)" -Method $endpoint.method -ErrorAction Stop
                $duration = (Get-Date) - $start
                
                $timings += $duration.TotalMilliseconds
                Write-Host "  Request $($i+1): $([math]::Round($duration.TotalMilliseconds, 2))ms" -ForegroundColor Gray
            } catch {
                Write-Warning "  Request $($i+1): FAILED - $($_.Exception.Message)"
            }
            
            Start-Sleep -Milliseconds 100
        }
        
        if ($timings.Count -gt 0) {
            $avg = ($timings | Measure-Object -Average).Average
            $min = ($timings | Measure-Object -Minimum).Minimum
            $max = ($timings | Measure-Object -Maximum).Maximum
            
            $results += @{
                endpoint = $endpoint.name
                path = $endpoint.path
                avgMs = [math]::Round($avg, 2)
                minMs = [math]::Round($min, 2)
                maxMs = [math]::Round($max, 2)
            }
            
            Write-Success "  ✅ Average: $([math]::Round($avg, 2))ms | Min: $([math]::Round($min, 2))ms | Max: $([math]::Round($max, 2))ms`n"
        }
    }
    
    # Save results
    $results | ConvertTo-Json | Out-File "$ResultsDir/api-response-times.json"
    Write-Success "✅ API response time testing completed!`n"
}

# Run tests based on TestType
switch ($TestType) {
    'all' {
        Test-Load
        Test-Lighthouse
        Test-Bundle
        Test-Memory
        Test-Api
    }
    'load' { Test-Load }
    'lighthouse' { Test-Lighthouse }
    'bundle' { Test-Bundle }
    'memory' { Test-Memory }
    'api' { Test-Api }
}

# Summary
Write-Host "`n════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  PERFORMANCE TESTING COMPLETE" -ForegroundColor White -BackgroundColor Green
Write-Host "════════════════════════════════════════`n" -ForegroundColor Cyan

Write-Info "Results saved to: $ResultsDir"
Write-Info "Open the HTML reports in your browser to see detailed results.`n"

# Open results folder
if ($IsWindows) {
    Start-Process "explorer.exe" $ResultsDir
} elseif ($IsMacOS) {
    open $ResultsDir
}
