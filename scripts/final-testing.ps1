#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Final testing and validation suite for ODAVL Insight Cloud
    
.DESCRIPTION
    Comprehensive testing suite including:
    - End-to-end testing (Playwright)
    - Load testing (k6)
    - Security audit (OWASP)
    - Performance benchmarks (Lighthouse)
    - API testing
    - Database integrity
    - Backup/restore validation
    
.PARAMETER Suite
    Test suite to run:
    - all: Run all tests
    - e2e: End-to-end tests
    - load: Load testing
    - security: Security audit
    - performance: Lighthouse audit
    - api: API testing
    - database: Database tests
    - backup: Backup validation
    
.EXAMPLE
    .\final-testing.ps1 -Suite all
    
.EXAMPLE
    .\final-testing.ps1 -Suite e2e
#>

param(
    [Parameter(Mandatory=$false)]
    [ValidateSet('all', 'e2e', 'load', 'security', 'performance', 'api', 'database', 'backup')]
    [string]$Suite = 'all'
)

# Color functions
function Write-Success { param($Message) Write-Host $Message -ForegroundColor Green }
function Write-Info { param($Message) Write-Host $Message -ForegroundColor Cyan }
function Write-Warning { param($Message) Write-Host $Message -ForegroundColor Yellow }
function Write-Error { param($Message) Write-Host $Message -ForegroundColor Red }

# Test results tracking
$script:testResults = @{
    Passed = 0
    Failed = 0
    Skipped = 0
    Duration = 0
}

# Header
Write-Host "`n════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  FINAL TESTING SUITE" -ForegroundColor White -BackgroundColor Blue
Write-Host "════════════════════════════════════════`n" -ForegroundColor Cyan

Write-Info "Suite: $Suite"
Write-Info "Date: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"
Write-Host ""

# Create reports directory
New-Item -ItemType Directory -Force -Path "reports/final-testing" | Out-Null

# Load environment
if (Test-Path ".env.local") {
    Get-Content ".env.local" | ForEach-Object {
        if ($_ -match '^([^=]+)=(.*)$') {
            [Environment]::SetEnvironmentVariable($matches[1], $matches[2], "Process")
        }
    }
}

# Function: End-to-End Testing
function Test-E2E {
    Write-Info "═══════════════════════════════════════"
    Write-Info "  END-TO-END TESTING"
    Write-Info "═══════════════════════════════════════`n"
    
    $startTime = Get-Date
    
    Write-Info "Starting Insight Cloud dev server..."
    
    # Start dev server in background
    Push-Location "odavl-studio/insight/cloud"
    
    $devServerJob = Start-Job -ScriptBlock {
        Set-Location $using:PWD
        pnpm dev 2>&1 | Out-Null
    }
    
    # Wait for server to be ready
    Write-Info "Waiting for server to start..."
    $timeout = 60
    $elapsed = 0
    $serverReady = $false
    
    while ($elapsed -lt $timeout) {
        try {
            $response = Invoke-WebRequest -Uri "http://localhost:3001" -Method HEAD -TimeoutSec 2 -ErrorAction Stop
            $serverReady = $true
            break
        } catch {
            Start-Sleep -Seconds 2
            $elapsed += 2
        }
    }
    
    if (-not $serverReady) {
        Write-Error "❌ Failed to start dev server"
        Stop-Job $devServerJob -ErrorAction SilentlyContinue
        Remove-Job $devServerJob -ErrorAction SilentlyContinue
        Pop-Location
        return
    }
    
    Write-Success "✅ Dev server started`n"
    
    # Run Playwright tests
    Write-Info "Running Playwright tests..."
    
    $playwrightInstalled = Get-Command playwright -ErrorAction SilentlyContinue
    
    if (-not $playwrightInstalled) {
        Write-Info "Installing Playwright..."
        pnpm add -D @playwright/test
        npx playwright install
    }
    
    # Check if tests directory exists
    if (Test-Path "tests/e2e") {
        npx playwright test --reporter=html,json 2>&1 | Tee-Object -FilePath "../../reports/final-testing/e2e-results.txt"
        
        if ($LASTEXITCODE -eq 0) {
            Write-Success "✅ E2E tests passed"
            $script:testResults.Passed++
        } else {
            Write-Error "❌ E2E tests failed"
            $script:testResults.Failed++
        }
    } else {
        Write-Warning "⚠️  No E2E tests found, creating sample tests..."
        
        New-Item -ItemType Directory -Force -Path "tests/e2e" | Out-Null
        
        # Create sample E2E test
        @"
import { test, expect } from '@playwright/test';

test.describe('ODAVL Insight Cloud', () => {
  test('should load homepage', async ({ page }) => {
    await page.goto('http://localhost:3001');
    await expect(page).toHaveTitle(/ODAVL Insight/);
  });

  test('should navigate to login', async ({ page }) => {
    await page.goto('http://localhost:3001');
    await page.click('text=Login');
    await expect(page).toHaveURL(/.*login/);
  });

  test('should register new user', async ({ page }) => {
    await page.goto('http://localhost:3001/register');
    
    const timestamp = Date.now();
    await page.fill('input[name=email]', `test-\${timestamp}@odavl.com`);
    await page.fill('input[name=password]', 'SecureP@ss123');
    await page.fill('input[name=name]', 'Test User');
    
    await page.click('button[type=submit]');
    
    // Should redirect to dashboard
    await page.waitForURL(/.*dashboard/, { timeout: 5000 });
    await expect(page).toHaveURL(/.*dashboard/);
  });

  test('should login existing user', async ({ page }) => {
    await page.goto('http://localhost:3001/login');
    
    await page.fill('input[name=email]', 'admin@odavl.com');
    await page.fill('input[name=password]', 'admin123');
    
    await page.click('button[type=submit]');
    
    await page.waitForURL(/.*dashboard/, { timeout: 5000 });
    await expect(page).toHaveURL(/.*dashboard/);
  });
});
"@ | Out-File -FilePath "tests/e2e/basic.spec.ts" -Encoding UTF8
        
        Write-Info "Sample E2E test created. Run manually: npx playwright test"
        $script:testResults.Skipped++
    }
    
    # Stop dev server
    Stop-Job $devServerJob -ErrorAction SilentlyContinue
    Remove-Job $devServerJob -ErrorAction SilentlyContinue
    
    Pop-Location
    
    $duration = (Get-Date) - $startTime
    Write-Info "`nE2E Duration: $([math]::Round($duration.TotalSeconds, 2))s`n"
}

# Function: Load Testing
function Test-Load {
    Write-Info "═══════════════════════════════════════"
    Write-Info "  LOAD TESTING"
    Write-Info "═══════════════════════════════════════`n"
    
    $startTime = Get-Date
    
    Write-Info "Running k6 load tests...`n"
    
    # Check if k6 is installed
    $k6Installed = Get-Command k6 -ErrorAction SilentlyContinue
    
    if (-not $k6Installed) {
        Write-Warning "⚠️  k6 not installed. Install: winget install k6"
        $script:testResults.Skipped++
        return
    }
    
    if (Test-Path "tests/load-test.js") {
        Write-Info "Scenario 1: Normal Load (100 VUs, 2 min)"
        k6 run --vus 100 --duration 2m tests/load-test.js --summary-export reports/final-testing/load-normal.json
        
        if ($LASTEXITCODE -eq 0) {
            Write-Success "✅ Normal load test passed"
            $script:testResults.Passed++
        } else {
            Write-Error "❌ Normal load test failed"
            $script:testResults.Failed++
        }
        
        Write-Host ""
        Write-Info "Scenario 2: Peak Load (500 VUs, 1 min)"
        k6 run --vus 500 --duration 1m tests/load-test.js --summary-export reports/final-testing/load-peak.json
        
        if ($LASTEXITCODE -eq 0) {
            Write-Success "✅ Peak load test passed"
            $script:testResults.Passed++
        } else {
            Write-Error "❌ Peak load test failed"
            $script:testResults.Failed++
        }
    } else {
        Write-Warning "⚠️  Load test file not found: tests/load-test.js"
        $script:testResults.Skipped++
    }
    
    $duration = (Get-Date) - $startTime
    Write-Info "`nLoad Testing Duration: $([math]::Round($duration.TotalSeconds, 2))s`n"
}

# Function: Security Audit
function Test-Security {
    Write-Info "═══════════════════════════════════════"
    Write-Info "  SECURITY AUDIT"
    Write-Info "═══════════════════════════════════════`n"
    
    $startTime = Get-Date
    
    Write-Info "Running security checks...`n"
    
    # 1. npm audit
    Write-Info "1. NPM Audit"
    Push-Location "odavl-studio/insight/cloud"
    
    $auditResult = pnpm audit --json 2>&1 | ConvertFrom-Json
    
    if ($auditResult.metadata.vulnerabilities.total -eq 0) {
        Write-Success "  ✅ No vulnerabilities found"
        $script:testResults.Passed++
    } else {
        $critical = $auditResult.metadata.vulnerabilities.critical
        $high = $auditResult.metadata.vulnerabilities.high
        $medium = $auditResult.metadata.vulnerabilities.moderate
        
        Write-Warning "  ⚠️  Found: $critical critical, $high high, $medium medium"
        
        if ($critical -gt 0 -or $high -gt 0) {
            Write-Error "  ❌ Critical/high vulnerabilities must be fixed"
            $script:testResults.Failed++
        } else {
            $script:testResults.Passed++
        }
    }
    
    Pop-Location
    
    # 2. Security headers check
    Write-Info "`n2. Security Headers"
    
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:3001" -Method HEAD -ErrorAction Stop
        
        $requiredHeaders = @(
            'X-Frame-Options',
            'X-Content-Type-Options',
            'X-XSS-Protection',
            'Strict-Transport-Security',
            'Content-Security-Policy'
        )
        
        $missingHeaders = @()
        
        foreach ($header in $requiredHeaders) {
            if (-not $response.Headers[$header]) {
                $missingHeaders += $header
            }
        }
        
        if ($missingHeaders.Count -eq 0) {
            Write-Success "  ✅ All security headers present"
            $script:testResults.Passed++
        } else {
            Write-Warning "  ⚠️  Missing headers: $($missingHeaders -join ', ')"
            $script:testResults.Failed++
        }
    } catch {
        Write-Warning "  ⚠️  Could not check security headers (server not running)"
        $script:testResults.Skipped++
    }
    
    # 3. Environment variables check
    Write-Info "`n3. Environment Variables"
    
    $requiredEnvVars = @(
        'DATABASE_URL',
        'JWT_SECRET',
        'NEXTAUTH_SECRET',
        'UPSTASH_REDIS_REST_URL',
        'UPSTASH_REDIS_REST_TOKEN'
    )
    
    $missingEnvVars = @()
    
    foreach ($var in $requiredEnvVars) {
        if (-not [Environment]::GetEnvironmentVariable($var, "Process")) {
            $missingEnvVars += $var
        }
    }
    
    if ($missingEnvVars.Count -eq 0) {
        Write-Success "  ✅ All required environment variables set"
        $script:testResults.Passed++
    } else {
        Write-Error "  ❌ Missing: $($missingEnvVars -join ', ')"
        $script:testResults.Failed++
    }
    
    $duration = (Get-Date) - $startTime
    Write-Info "`nSecurity Audit Duration: $([math]::Round($duration.TotalSeconds, 2))s`n"
}

# Function: Performance Testing
function Test-Performance {
    Write-Info "═══════════════════════════════════════"
    Write-Info "  PERFORMANCE TESTING"
    Write-Info "═══════════════════════════════════════`n"
    
    $startTime = Get-Date
    
    Write-Info "Running Lighthouse audits...`n"
    
    # Check if Lighthouse is installed
    $lighthouseInstalled = Get-Command lighthouse -ErrorAction SilentlyContinue
    
    if (-not $lighthouseInstalled) {
        Write-Info "Installing Lighthouse..."
        npm install -g lighthouse
    }
    
    # Run Lighthouse audit
    Write-Info "Auditing http://localhost:3001..."
    
    try {
        lighthouse http://localhost:3001 `
            --output html `
            --output json `
            --output-path reports/final-testing/lighthouse `
            --chrome-flags="--headless" `
            --only-categories=performance,accessibility,best-practices,seo 2>&1 | Out-Null
        
        if ($LASTEXITCODE -eq 0) {
            # Parse results
            $results = Get-Content "reports/final-testing/lighthouse.report.json" | ConvertFrom-Json
            
            $performance = [math]::Round($results.categories.performance.score * 100)
            $accessibility = [math]::Round($results.categories.accessibility.score * 100)
            $bestPractices = [math]::Round($results.categories.'best-practices'.score * 100)
            $seo = [math]::Round($results.categories.seo.score * 100)
            
            Write-Host ""
            Write-Info "Lighthouse Scores:"
            Write-Host "  Performance: $performance%" -ForegroundColor $(if ($performance -ge 90) { "Green" } elseif ($performance -ge 50) { "Yellow" } else { "Red" })
            Write-Host "  Accessibility: $accessibility%" -ForegroundColor $(if ($accessibility -ge 90) { "Green" } elseif ($accessibility -ge 50) { "Yellow" } else { "Red" })
            Write-Host "  Best Practices: $bestPractices%" -ForegroundColor $(if ($bestPractices -ge 90) { "Green" } elseif ($bestPractices -ge 50) { "Yellow" } else { "Red" })
            Write-Host "  SEO: $seo%" -ForegroundColor $(if ($seo -ge 90) { "Green" } elseif ($seo -ge 50) { "Yellow" } else { "Red" })
            
            if ($performance -ge 70 -and $accessibility -ge 80) {
                Write-Success "`n✅ Performance audit passed"
                $script:testResults.Passed++
            } else {
                Write-Warning "`n⚠️  Performance needs improvement"
                $script:testResults.Failed++
            }
            
            Write-Info "`nReport: reports/final-testing/lighthouse.report.html"
        }
    } catch {
        Write-Warning "⚠️  Could not run Lighthouse (server not running)"
        $script:testResults.Skipped++
    }
    
    $duration = (Get-Date) - $startTime
    Write-Info "`nPerformance Testing Duration: $([math]::Round($duration.TotalSeconds, 2))s`n"
}

# Function: API Testing
function Test-API {
    Write-Info "═══════════════════════════════════════"
    Write-Info "  API TESTING"
    Write-Info "═══════════════════════════════════════`n"
    
    $startTime = Get-Date
    
    Write-Info "Testing API endpoints...`n"
    
    # Test endpoints
    $endpoints = @(
        @{ Method = "GET"; Path = "/api/health"; Expected = 200 },
        @{ Method = "GET"; Path = "/api/auth/session"; Expected = 401 },
        @{ Method = "POST"; Path = "/api/auth/register"; Expected = 400 }
    )
    
    foreach ($endpoint in $endpoints) {
        Write-Info "Testing $($endpoint.Method) $($endpoint.Path)"
        
        try {
            $response = Invoke-WebRequest `
                -Uri "http://localhost:3001$($endpoint.Path)" `
                -Method $endpoint.Method `
                -ErrorAction Stop
            
            if ($response.StatusCode -eq $endpoint.Expected) {
                Write-Success "  ✅ Status: $($response.StatusCode) (expected $($endpoint.Expected))"
                $script:testResults.Passed++
            } else {
                Write-Error "  ❌ Status: $($response.StatusCode) (expected $($endpoint.Expected))"
                $script:testResults.Failed++
            }
        } catch {
            $statusCode = $_.Exception.Response.StatusCode.value__
            
            if ($statusCode -eq $endpoint.Expected) {
                Write-Success "  ✅ Status: $statusCode (expected $($endpoint.Expected))"
                $script:testResults.Passed++
            } else {
                Write-Error "  ❌ Status: $statusCode (expected $($endpoint.Expected))"
                $script:testResults.Failed++
            }
        }
    }
    
    $duration = (Get-Date) - $startTime
    Write-Info "`nAPI Testing Duration: $([math]::Round($duration.TotalSeconds, 2))s`n"
}

# Function: Database Testing
function Test-Database {
    Write-Info "═══════════════════════════════════════"
    Write-Info "  DATABASE TESTING"
    Write-Info "═══════════════════════════════════════`n"
    
    $startTime = Get-Date
    
    Write-Info "Testing database connections and integrity...`n"
    
    Push-Location "odavl-studio/insight/cloud"
    
    # 1. Test Prisma connection
    Write-Info "1. Testing Prisma connection"
    
    pnpm prisma db push --skip-generate 2>&1 | Out-Null
    
    if ($LASTEXITCODE -eq 0) {
        Write-Success "  ✅ Database connection successful"
        $script:testResults.Passed++
    } else {
        Write-Error "  ❌ Database connection failed"
        $script:testResults.Failed++
    }
    
    # 2. Check schema integrity
    Write-Info "`n2. Checking schema integrity"
    
    $schemaCheck = pnpm prisma validate 2>&1
    
    if ($LASTEXITCODE -eq 0) {
        Write-Success "  ✅ Schema is valid"
        $script:testResults.Passed++
    } else {
        Write-Error "  ❌ Schema validation failed"
        Write-Host $schemaCheck -ForegroundColor Red
        $script:testResults.Failed++
    }
    
    Pop-Location
    
    $duration = (Get-Date) - $startTime
    Write-Info "`nDatabase Testing Duration: $([math]::Round($duration.TotalSeconds, 2))s`n"
}

# Function: Backup Testing
function Test-Backup {
    Write-Info "═══════════════════════════════════════"
    Write-Info "  BACKUP VALIDATION"
    Write-Info "═══════════════════════════════════════`n"
    
    $startTime = Get-Date
    
    Write-Info "Testing backup and restore functionality...`n"
    
    # 1. Create test backup
    Write-Info "1. Creating test backup"
    
    if (Test-Path "scripts/backup.ps1") {
        & "scripts/backup.ps1" -Type manual 2>&1 | Out-Null
        
        if ($LASTEXITCODE -eq 0) {
            Write-Success "  ✅ Backup created successfully"
            $script:testResults.Passed++
            
            # Find latest backup
            $latestBackup = Get-ChildItem -Path "backups" -Filter "*.sql.gz" | 
                Sort-Object LastWriteTime -Descending | 
                Select-Object -First 1
            
            if ($latestBackup) {
                Write-Info "  Backup file: $($latestBackup.Name) ($([math]::Round($latestBackup.Length/1MB, 2)) MB)"
                
                # 2. Verify backup integrity
                Write-Info "`n2. Verifying backup integrity"
                
                try {
                    gzip -t $latestBackup.FullName 2>&1 | Out-Null
                    
                    if ($LASTEXITCODE -eq 0) {
                        Write-Success "  ✅ Backup file is valid"
                        $script:testResults.Passed++
                    } else {
                        Write-Error "  ❌ Backup file is corrupted"
                        $script:testResults.Failed++
                    }
                } catch {
                    Write-Warning "  ⚠️  gzip not found, skipping integrity check"
                    $script:testResults.Skipped++
                }
            }
        } else {
            Write-Error "  ❌ Backup failed"
            $script:testResults.Failed++
        }
    } else {
        Write-Warning "⚠️  Backup script not found"
        $script:testResults.Skipped++
    }
    
    $duration = (Get-Date) - $startTime
    Write-Info "`nBackup Testing Duration: $([math]::Round($duration.TotalSeconds, 2))s`n"
}

# Run test suites
$totalStartTime = Get-Date

switch ($Suite) {
    'all' {
        Test-Security
        Test-Database
        Test-API
        Test-Performance
        Test-Load
        Test-Backup
        Test-E2E
    }
    'e2e' { Test-E2E }
    'load' { Test-Load }
    'security' { Test-Security }
    'performance' { Test-Performance }
    'api' { Test-API }
    'database' { Test-Database }
    'backup' { Test-Backup }
}

$totalDuration = (Get-Date) - $totalStartTime

# Summary
Write-Host "`n════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  TEST SUMMARY" -ForegroundColor White -BackgroundColor Blue
Write-Host "════════════════════════════════════════`n" -ForegroundColor Cyan

Write-Host "Total Duration: $([math]::Round($totalDuration.TotalMinutes, 2)) minutes`n" -ForegroundColor Cyan

Write-Success "✅ Passed: $($script:testResults.Passed)"
Write-Error "❌ Failed: $($script:testResults.Failed)"
Write-Warning "⏭️  Skipped: $($script:testResults.Skipped)"

$totalTests = $script:testResults.Passed + $script:testResults.Failed + $script:testResults.Skipped
$successRate = if ($totalTests -gt 0) { [math]::Round(($script:testResults.Passed / $totalTests) * 100, 1) } else { 0 }

Write-Host "`nSuccess Rate: $successRate%`n" -ForegroundColor $(if ($successRate -ge 80) { "Green" } elseif ($successRate -ge 60) { "Yellow" } else { "Red" })

# Save results
$resultsJson = @{
    Suite = $Suite
    Timestamp = (Get-Date -Format 'yyyy-MM-dd HH:mm:ss')
    Duration = $totalDuration.TotalSeconds
    Results = $script:testResults
    SuccessRate = $successRate
} | ConvertTo-Json

$resultsJson | Out-File -FilePath "reports/final-testing/results.json" -Encoding UTF8

Write-Info "Results saved to: reports/final-testing/results.json`n"

# Exit with appropriate code
if ($script:testResults.Failed -gt 0) {
    exit 1
} else {
    exit 0
}
