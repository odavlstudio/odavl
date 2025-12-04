# K6 Load Testing Analysis Script
# Analyzes k6 JSON results and identifies performance bottlenecks

param(
    [Parameter(Mandatory = $true)]
    [string]$ResultsFile,
    
    [Parameter(Mandatory = $false)]
    [string]$OutputDir = "reports/analysis",
    
    [Parameter(Mandatory = $false)]
    [double]$P95Threshold = 500,
    
    [Parameter(Mandatory = $false)]
    [double]$P99Threshold = 1000,
    
    [Parameter(Mandatory = $false)]
    [double]$ErrorThreshold = 1.0
)

Write-Host "📊 Analyzing k6 Load Test Results..." -ForegroundColor Cyan
Write-Host ""

# Create output directory if it doesn't exist
if (!(Test-Path $OutputDir)) {
    New-Item -ItemType Directory -Force -Path $OutputDir | Out-Null
}

# Read results file
if (!(Test-Path $ResultsFile)) {
    Write-Host "❌ Results file not found: $ResultsFile" -ForegroundColor Red
    exit 1
}

Write-Host "📄 Reading results from: $ResultsFile" -ForegroundColor Gray
$results = Get-Content $ResultsFile | ConvertFrom-Json

# Extract metrics
$httpReqDuration = $results.metrics.http_req_duration
$httpReqFailed = $results.metrics.http_req_failed
$httpReqs = $results.metrics.http_reqs
$dbQueryDuration = $results.metrics.db_query_duration
$ttfb = $results.metrics.time_to_first_byte
$webVitalsLCP = $results.metrics.web_vitals_lcp

Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor DarkGray
Write-Host "                PERFORMANCE ANALYSIS" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor DarkGray
Write-Host ""

# Response Time Analysis
Write-Host "⏱️  RESPONSE TIME ANALYSIS" -ForegroundColor Yellow
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor DarkGray

$p50 = [math]::Round($httpReqDuration.values.p50, 2)
$p95 = [math]::Round($httpReqDuration.values.p95, 2)
$p99 = [math]::Round($httpReqDuration.values.p99, 2)
$max = [math]::Round($httpReqDuration.values.max, 2)
$avg = [math]::Round($httpReqDuration.values.avg, 2)

Write-Host "  P50 (Median): $($p50)ms" -ForegroundColor White
Write-Host "  P95:          $($p95)ms $(if ($p95 -lt $P95Threshold) { '✅ PASS' } else { '❌ FAIL' })" -ForegroundColor $(if ($p95 -lt $P95Threshold) { 'Green' } else { 'Red' })
Write-Host "  P99:          $($p99)ms $(if ($p99 -lt $P99Threshold) { '✅ PASS' } else { '❌ FAIL' })" -ForegroundColor $(if ($p99 -lt $P99Threshold) { 'Green' } else { 'Red' })
Write-Host "  Max:          $($max)ms" -ForegroundColor White
Write-Host "  Average:      $($avg)ms" -ForegroundColor White
Write-Host ""

# Error Rate Analysis
Write-Host "❌ ERROR RATE ANALYSIS" -ForegroundColor Yellow
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor DarkGray

$errorRate = [math]::Round($httpReqFailed.values.rate * 100, 2)
$totalRequests = $httpReqs.values.count
$failedRequests = [math]::Round($totalRequests * ($httpReqFailed.values.rate))
$successRate = [math]::Round(100 - $errorRate, 2)

Write-Host "  Error Rate:     $($errorRate)% $(if ($errorRate -lt $ErrorThreshold) { '✅ PASS' } else { '❌ FAIL' })" -ForegroundColor $(if ($errorRate -lt $ErrorThreshold) { 'Green' } else { 'Red' })
Write-Host "  Success Rate:   $($successRate)%" -ForegroundColor White
Write-Host "  Total Requests: $($totalRequests)" -ForegroundColor White
Write-Host "  Failed:         $($failedRequests)" -ForegroundColor White
Write-Host ""

# Database Performance Analysis
if ($dbQueryDuration) {
    Write-Host "🗄️  DATABASE PERFORMANCE" -ForegroundColor Yellow
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor DarkGray
    
    $dbP50 = [math]::Round($dbQueryDuration.values.p50, 2)
    $dbP95 = [math]::Round($dbQueryDuration.values.p95, 2)
    $dbP99 = [math]::Round($dbQueryDuration.values.p99, 2)
    $dbMax = [math]::Round($dbQueryDuration.values.max, 2)
    
    Write-Host "  P50: $($dbP50)ms" -ForegroundColor White
    Write-Host "  P95: $($dbP95)ms $(if ($dbP95 -lt 100) { '✅ PASS' } else { '❌ FAIL' })" -ForegroundColor $(if ($dbP95 -lt 100) { 'Green' } else { 'Red' })
    Write-Host "  P99: $($dbP99)ms $(if ($dbP99 -lt 200) { '✅ PASS' } else { '❌ FAIL' })" -ForegroundColor $(if ($dbP99 -lt 200) { 'Green' } else { 'Red' })
    Write-Host "  Max: $($dbMax)ms" -ForegroundColor White
    Write-Host ""
}

# TTFB Analysis
if ($ttfb) {
    Write-Host "🚀 TIME TO FIRST BYTE (TTFB)" -ForegroundColor Yellow
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor DarkGray
    
    $ttfbP50 = [math]::Round($ttfb.values.p50, 2)
    $ttfbP95 = [math]::Round($ttfb.values.p95, 2)
    $ttfbP99 = [math]::Round($ttfb.values.p99, 2)
    
    Write-Host "  P50: $($ttfbP50)ms" -ForegroundColor White
    Write-Host "  P95: $($ttfbP95)ms $(if ($ttfbP95 -lt 200) { '✅ PASS' } else { '❌ FAIL' })" -ForegroundColor $(if ($ttfbP95 -lt 200) { 'Green' } else { 'Red' })
    Write-Host "  P99: $($ttfbP99)ms" -ForegroundColor White
    Write-Host ""
}

# Web Vitals Analysis
if ($webVitalsLCP) {
    Write-Host "🎨 WEB VITALS (LCP)" -ForegroundColor Yellow
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor DarkGray
    
    $lcpP95 = [math]::Round($webVitalsLCP.values.p95, 2)
    
    Write-Host "  LCP P95: $($lcpP95)ms $(if ($lcpP95 -lt 2500) { '✅ PASS' } else { '❌ FAIL' })" -ForegroundColor $(if ($lcpP95 -lt 2500) { 'Green' } else { 'Red' })
    Write-Host ""
}

# Bottleneck Identification
Write-Host "🔍 BOTTLENECK IDENTIFICATION" -ForegroundColor Yellow
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor DarkGray
Write-Host ""

$bottlenecks = @()

if ($p95 -ge $P95Threshold) {
    $bottlenecks += "⚠️  HIGH P95 RESPONSE TIME ($($p95)ms ≥ $($P95Threshold)ms threshold)"
    Write-Host "  • P95 response time exceeds threshold" -ForegroundColor Red
    Write-Host "    Recommendation: Optimize slow endpoints, add caching, consider CDN" -ForegroundColor Gray
    Write-Host ""
}

if ($p99 -ge $P99Threshold) {
    $bottlenecks += "⚠️  HIGH P99 RESPONSE TIME ($($p99)ms ≥ $($P99Threshold)ms threshold)"
    Write-Host "  • P99 response time exceeds threshold" -ForegroundColor Red
    Write-Host "    Recommendation: Identify outliers, implement request timeouts" -ForegroundColor Gray
    Write-Host ""
}

if ($errorRate -ge $ErrorThreshold) {
    $bottlenecks += "⚠️  HIGH ERROR RATE ($($errorRate)% ≥ $($ErrorThreshold)% threshold)"
    Write-Host "  • Error rate exceeds threshold" -ForegroundColor Red
    Write-Host "    Recommendation: Check error logs, fix failing endpoints, improve error handling" -ForegroundColor Gray
    Write-Host ""
}

if ($dbQueryDuration -and $dbP95 -ge 100) {
    $bottlenecks += "⚠️  SLOW DATABASE QUERIES ($($dbP95)ms ≥ 100ms threshold)"
    Write-Host "  • Database queries are slow" -ForegroundColor Red
    Write-Host "    Recommendation: Add indexes, optimize queries, implement connection pooling" -ForegroundColor Gray
    Write-Host ""
}

if ($ttfb -and $ttfbP95 -ge 200) {
    $bottlenecks += "⚠️  SLOW TTFB ($($ttfbP95)ms ≥ 200ms threshold)"
    Write-Host "  • Time to first byte is slow" -ForegroundColor Red
    Write-Host "    Recommendation: Enable edge caching, optimize server processing" -ForegroundColor Gray
    Write-Host ""
}

if ($bottlenecks.Count -eq 0) {
    Write-Host "  ✅ No bottlenecks detected - all metrics within thresholds!" -ForegroundColor Green
    Write-Host ""
}

# Recommendations
Write-Host "💡 OPTIMIZATION RECOMMENDATIONS" -ForegroundColor Yellow
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor DarkGray
Write-Host ""

Write-Host "  1. Database Optimization:" -ForegroundColor White
Write-Host "     • Run EXPLAIN ANALYZE on slow queries" -ForegroundColor Gray
Write-Host "     • Add missing indexes (see suggested indexes below)" -ForegroundColor Gray
Write-Host "     • Enable connection pooling (min: 5, max: 20)" -ForegroundColor Gray
Write-Host ""

Write-Host "  2. API Response Time:" -ForegroundColor White
Write-Host "     • Implement Redis caching for frequently accessed data" -ForegroundColor Gray
Write-Host "     • Add database read replicas for read-heavy endpoints" -ForegroundColor Gray
Write-Host "     • Use pagination to limit data transfer" -ForegroundColor Gray
Write-Host ""

Write-Host "  3. CDN & Caching:" -ForegroundColor White
Write-Host "     • Enable Cloudflare caching for static assets" -ForegroundColor Gray
Write-Host "     • Set appropriate Cache-Control headers" -ForegroundColor Gray
Write-Host "     • Use edge computing for geographically distributed users" -ForegroundColor Gray
Write-Host ""

Write-Host "  4. Monitoring & Alerting:" -ForegroundColor White
Write-Host "     • Set up Grafana dashboards for real-time metrics" -ForegroundColor Gray
Write-Host "     • Configure PagerDuty alerts for P95 > 500ms" -ForegroundColor Gray
Write-Host "     • Enable slow query logging in PostgreSQL" -ForegroundColor Gray
Write-Host ""

# Generate suggested indexes
Write-Host "📋 SUGGESTED DATABASE INDEXES" -ForegroundColor Yellow
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor DarkGray
Write-Host ""

$suggestedIndexes = @"
-- Insight Issues (most queried table)
CREATE INDEX CONCURRENTLY idx_insight_issues_org_created 
  ON insight_issues(org_id, created_at DESC);

CREATE INDEX CONCURRENTLY idx_insight_issues_severity 
  ON insight_issues(severity, created_at DESC) 
  WHERE resolved_at IS NULL;

CREATE INDEX CONCURRENTLY idx_insight_issues_project 
  ON insight_issues(project_id, status);

-- Autopilot Runs
CREATE INDEX CONCURRENTLY idx_autopilot_runs_project_status 
  ON autopilot_runs(project_id, status, created_at DESC);

CREATE INDEX CONCURRENTLY idx_autopilot_runs_org 
  ON autopilot_runs(org_id, created_at DESC);

-- Guardian Tests
CREATE INDEX CONCURRENTLY idx_guardian_tests_url_created 
  ON guardian_tests(url, created_at DESC);

CREATE INDEX CONCURRENTLY idx_guardian_tests_project 
  ON guardian_tests(project_id, status, created_at DESC);

-- User Sessions (authentication lookups)
CREATE INDEX CONCURRENTLY idx_sessions_user_expires 
  ON sessions(user_id, expires_at) 
  WHERE expires_at > NOW();

-- API Keys
CREATE INDEX CONCURRENTLY idx_api_keys_org_active 
  ON api_keys(org_id, is_active) 
  WHERE deleted_at IS NULL;
"@

Write-Host $suggestedIndexes -ForegroundColor Gray
Write-Host ""

# Save analysis report
$reportPath = Join-Path $OutputDir "analysis-$(Get-Date -Format 'yyyyMMdd-HHmmss').txt"

$reportContent = @"
K6 LOAD TEST ANALYSIS REPORT
Generated: $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")
═══════════════════════════════════════════════════════════════

RESPONSE TIME METRICS
─────────────────────────────────────────────────────────────────
P50:     $($p50)ms
P95:     $($p95)ms $(if ($p95 -lt $P95Threshold) { '✅ PASS' } else { '❌ FAIL' })
P99:     $($p99)ms $(if ($p99 -lt $P99Threshold) { '✅ PASS' } else { '❌ FAIL' })
Max:     $($max)ms
Average: $($avg)ms

ERROR RATE
─────────────────────────────────────────────────────────────────
Error Rate:     $($errorRate)% $(if ($errorRate -lt $ErrorThreshold) { '✅ PASS' } else { '❌ FAIL' })
Success Rate:   $($successRate)%
Total Requests: $($totalRequests)
Failed:         $($failedRequests)

$(if ($dbQueryDuration) { @"
DATABASE PERFORMANCE
─────────────────────────────────────────────────────────────────
P50: $($dbP50)ms
P95: $($dbP95)ms $(if ($dbP95 -lt 100) { '✅ PASS' } else { '❌ FAIL' })
P99: $($dbP99)ms $(if ($dbP99 -lt 200) { '✅ PASS' } else { '❌ FAIL' })
Max: $($dbMax)ms
"@ } else { "" })

$(if ($ttfb) { @"
TTFB (TIME TO FIRST BYTE)
─────────────────────────────────────────────────────────────────
P50: $($ttfbP50)ms
P95: $($ttfbP95)ms $(if ($ttfbP95 -lt 200) { '✅ PASS' } else { '❌ FAIL' })
P99: $($ttfbP99)ms
"@ } else { "" })

BOTTLENECKS DETECTED
─────────────────────────────────────────────────────────────────
$(if ($bottlenecks.Count -eq 0) { "✅ No bottlenecks detected - all metrics within thresholds!" } else { $bottlenecks -join "`n" })

SUGGESTED DATABASE INDEXES
─────────────────────────────────────────────────────────────────
$suggestedIndexes

OPTIMIZATION RECOMMENDATIONS
─────────────────────────────────────────────────────────────────
1. Database Optimization:
   - Run EXPLAIN ANALYZE on slow queries
   - Add missing indexes (see above)
   - Enable connection pooling (min: 5, max: 20)

2. API Response Time:
   - Implement Redis caching for frequently accessed data
   - Add database read replicas for read-heavy endpoints
   - Use pagination to limit data transfer

3. CDN & Caching:
   - Enable Cloudflare caching for static assets
   - Set appropriate Cache-Control headers
   - Use edge computing for distributed users

4. Monitoring & Alerting:
   - Set up Grafana dashboards for real-time metrics
   - Configure PagerDuty alerts for P95 > 500ms
   - Enable slow query logging in PostgreSQL

═══════════════════════════════════════════════════════════════
End of Analysis Report
"@

$reportContent | Out-File -FilePath $reportPath -Encoding UTF8

Write-Host "💾 Analysis report saved to: $reportPath" -ForegroundColor Green
Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor DarkGray
Write-Host "✅ Analysis complete!" -ForegroundColor Green
Write-Host ""
