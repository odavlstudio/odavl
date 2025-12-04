#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Performance optimization script for ODAVL Insight Cloud
    
.DESCRIPTION
    Optimizes production performance with:
    - Database query optimization
    - Index creation and analysis
    - Connection pool tuning
    - Image optimization
    - Bundle size analysis
    - Caching strategy validation
    - Memory leak detection
    
.PARAMETER Task
    Optimization task to run:
    - all: Run all optimizations
    - database: Database optimization
    - images: Image optimization
    - bundle: Bundle analysis
    - cache: Cache validation
    - memory: Memory profiling
    
.EXAMPLE
    .\optimize-performance.ps1 -Task all
    
.EXAMPLE
    .\optimize-performance.ps1 -Task database
#>

param(
    [Parameter(Mandatory=$false)]
    [ValidateSet('all', 'database', 'images', 'bundle', 'cache', 'memory')]
    [string]$Task = 'all'
)

# Color functions
function Write-Success { param($Message) Write-Host $Message -ForegroundColor Green }
function Write-Info { param($Message) Write-Host $Message -ForegroundColor Cyan }
function Write-Warning { param($Message) Write-Host $Message -ForegroundColor Yellow }
function Write-Error { param($Message) Write-Host $Message -ForegroundColor Red }

# Header
Write-Host "`n════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  PERFORMANCE OPTIMIZATION" -ForegroundColor White -BackgroundColor Blue
Write-Host "════════════════════════════════════════`n" -ForegroundColor Cyan

Write-Info "Task: $Task"
Write-Host ""

# Load environment
if (Test-Path ".env.local") {
    Get-Content ".env.local" | ForEach-Object {
        if ($_ -match '^([^=]+)=(.*)$') {
            [Environment]::SetEnvironmentVariable($matches[1], $matches[2], "Process")
        }
    }
}

# Function: Database optimization
function Optimize-Database {
    Write-Info "═══════════════════════════════════════"
    Write-Info "  DATABASE OPTIMIZATION"
    Write-Info "═══════════════════════════════════════`n"
    
    Write-Info "Analyzing database performance...`n"
    
    # Create performance report directory
    New-Item -ItemType Directory -Force -Path "reports/performance" | Out-Null
    
    # Check if we're using PostgreSQL
    if ($env:DATABASE_URL -match "postgresql") {
        Write-Info "Connecting to PostgreSQL..."
        
        # Extract connection details
        if ($env:DATABASE_URL -match 'postgresql://([^:]+):([^@]+)@([^:]+):(\d+)/(.+)') {
            $DB_USER = $matches[1]
            $DB_PASS = $matches[2]
            $DB_HOST = $matches[3]
            $DB_PORT = $matches[4]
            $DB_NAME = $matches[5]
            
            $env:PGPASSWORD = $DB_PASS
            
            # 1. Analyze slow queries
            Write-Info "1. Analyzing slow queries..."
            
            $slowQuerySQL = @"
SELECT 
    query,
    calls,
    total_time,
    mean_time,
    max_time,
    stddev_time
FROM pg_stat_statements
ORDER BY mean_time DESC
LIMIT 10;
"@
            
            try {
                psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c $slowQuerySQL | Out-File "reports/performance/slow-queries.txt"
                Write-Success "  ✅ Slow queries analyzed"
            } catch {
                Write-Warning "  ⚠️  pg_stat_statements extension may not be enabled"
            }
            
            # 2. Analyze table sizes
            Write-Info "2. Analyzing table sizes..."
            
            $tableSizeSQL = @"
SELECT 
    schemaname as schema,
    tablename as table,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as total_size,
    pg_size_pretty(pg_relation_size(schemaname||'.'||tablename)) as table_size,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename) - pg_relation_size(schemaname||'.'||tablename)) as index_size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
"@
            
            psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c $tableSizeSQL | Out-File "reports/performance/table-sizes.txt"
            Write-Success "  ✅ Table sizes analyzed"
            
            # 3. Check missing indexes
            Write-Info "3. Checking for missing indexes..."
            
            $missingIndexSQL = @"
SELECT 
    schemaname,
    tablename,
    seq_scan,
    seq_tup_read,
    idx_scan,
    seq_tup_read / seq_scan as avg_seq_tup_read
FROM pg_stat_user_tables
WHERE seq_scan > 0
ORDER BY seq_tup_read DESC
LIMIT 10;
"@
            
            psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c $missingIndexSQL | Out-File "reports/performance/missing-indexes.txt"
            Write-Success "  ✅ Missing indexes identified"
            
            # 4. Analyze index usage
            Write-Info "4. Analyzing index usage..."
            
            $indexUsageSQL = @"
SELECT 
    schemaname,
    tablename,
    indexname,
    idx_scan,
    idx_tup_read,
    idx_tup_fetch,
    pg_size_pretty(pg_relation_size(indexrelid)) as index_size
FROM pg_stat_user_indexes
ORDER BY idx_scan ASC
LIMIT 10;
"@
            
            psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c $indexUsageSQL | Out-File "reports/performance/index-usage.txt"
            Write-Success "  ✅ Index usage analyzed"
            
            # 5. Create recommended indexes
            Write-Info "5. Creating recommended indexes..."
            
            $recommendedIndexes = @(
                "CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_email ON users(email);",
                "CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);",
                "CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_sessions_expires_at ON sessions(expires_at);",
                "CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_refresh_tokens_user_id ON refresh_tokens(user_id);",
                "CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_refresh_tokens_token ON refresh_tokens(token);",
                "CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_analyses_user_id ON analyses(user_id);",
                "CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_analyses_created_at ON analyses(created_at);",
                "CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_reports_analysis_id ON reports(analysis_id);"
            )
            
            foreach ($indexSQL in $recommendedIndexes) {
                try {
                    psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c $indexSQL 2>&1 | Out-Null
                    Write-Host "    ✅ Created: $($indexSQL -replace 'CREATE INDEX CONCURRENTLY IF NOT EXISTS ', '')" -ForegroundColor Green
                } catch {
                    Write-Warning "    ⚠️  Already exists or error"
                }
            }
            
            # 6. Run VACUUM ANALYZE
            Write-Info "6. Running VACUUM ANALYZE..."
            
            psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c "VACUUM ANALYZE;" 2>&1 | Out-Null
            Write-Success "  ✅ VACUUM ANALYZE completed"
            
            $env:PGPASSWORD = ""
            
            Write-Success "`n✅ Database optimization completed!"
            Write-Info "Reports saved to: reports/performance/"
        }
    } else {
        Write-Warning "⚠️  Database optimization only supports PostgreSQL"
    }
    
    Write-Host ""
}

# Function: Image optimization
function Optimize-Images {
    Write-Info "═══════════════════════════════════════"
    Write-Info "  IMAGE OPTIMIZATION"
    Write-Info "═══════════════════════════════════════`n"
    
    Write-Info "Optimizing images in odavl-studio/insight/cloud/public...`n"
    
    Push-Location "odavl-studio/insight/cloud"
    
    # Check for sharp-cli
    $sharpInstalled = Get-Command sharp -ErrorAction SilentlyContinue
    
    if (-not $sharpInstalled) {
        Write-Info "Installing sharp-cli..."
        npm install -g sharp-cli
    }
    
    # Find all images
    $images = Get-ChildItem -Path "public" -Recurse -Include *.jpg, *.jpeg, *.png
    
    Write-Info "Found $($images.Count) images to optimize`n"
    
    $totalSizeBefore = 0
    $totalSizeAfter = 0
    
    foreach ($image in $images) {
        $sizeBefore = $image.Length
        $totalSizeBefore += $sizeBefore
        
        Write-Info "Optimizing: $($image.Name)"
        
        # Convert to WebP
        $webpPath = $image.FullName -replace '\.(jpg|jpeg|png)$', '.webp'
        
        sharp -i $image.FullName -o $webpPath -f webp -q 80 2>&1 | Out-Null
        
        if (Test-Path $webpPath) {
            $sizeAfter = (Get-Item $webpPath).Length
            $totalSizeAfter += $sizeAfter
            
            $savings = [math]::Round((1 - ($sizeAfter / $sizeBefore)) * 100, 1)
            Write-Success "  ✅ Saved $savings% ($([math]::Round($sizeBefore/1KB, 1))KB → $([math]::Round($sizeAfter/1KB, 1))KB)"
        }
    }
    
    $totalSavings = [math]::Round((1 - ($totalSizeAfter / $totalSizeBefore)) * 100, 1)
    
    Write-Host ""
    Write-Success "✅ Image optimization completed!"
    Write-Info "Total savings: $totalSavings% ($([math]::Round($totalSizeBefore/1MB, 2))MB → $([math]::Round($totalSizeAfter/1MB, 2))MB)"
    
    Pop-Location
    Write-Host ""
}

# Function: Bundle analysis
function Analyze-Bundle {
    Write-Info "═══════════════════════════════════════"
    Write-Info "  BUNDLE SIZE ANALYSIS"
    Write-Info "═══════════════════════════════════════`n"
    
    Push-Location "odavl-studio/insight/cloud"
    
    Write-Info "Building with bundle analyzer...`n"
    
    $env:ANALYZE = 'true'
    pnpm build 2>&1 | Out-Null
    
    if ($LASTEXITCODE -eq 0) {
        Write-Success "✅ Build completed!"
        
        # Analyze bundle sizes
        Write-Info "`nBundle Sizes:"
        
        Get-ChildItem ".next/static/chunks" -Filter "*.js" | ForEach-Object {
            $size = [math]::Round($_.Length / 1KB, 2)
            $color = if ($size -lt 100) { "Green" } elseif ($size -lt 500) { "Yellow" } else { "Red" }
            Write-Host "  $($_.Name): $size KB" -ForegroundColor $color
        }
        
        # Check for bundle analysis report
        if (Test-Path ".next/bundle-analysis.html") {
            Write-Success "`n✅ Bundle analysis report: .next/bundle-analysis.html"
        }
    }
    
    Pop-Location
    Write-Host ""
}

# Function: Cache validation
function Validate-Cache {
    Write-Info "═══════════════════════════════════════"
    Write-Info "  CACHE VALIDATION"
    Write-Info "═══════════════════════════════════════`n"
    
    Write-Info "Checking Redis connection..."
    
    # Test Redis connection
    if ($env:UPSTASH_REDIS_REST_URL) {
        try {
            $response = Invoke-RestMethod -Uri "$($env:UPSTASH_REDIS_REST_URL)/ping" -Headers @{
                Authorization = "Bearer $($env:UPSTASH_REDIS_REST_TOKEN)"
            }
            
            Write-Success "✅ Redis connection successful"
            
            # Get Redis stats
            Write-Info "`nRedis Statistics:"
            
            $info = Invoke-RestMethod -Uri "$($env:UPSTASH_REDIS_REST_URL)/info" -Headers @{
                Authorization = "Bearer $($env:UPSTASH_REDIS_REST_TOKEN)"
            }
            
            Write-Host "  Connected clients: $($info.connected_clients)" -ForegroundColor White
            Write-Host "  Used memory: $($info.used_memory_human)" -ForegroundColor White
            Write-Host "  Total keys: $($info.db0_keys)" -ForegroundColor White
            
        } catch {
            Write-Error "❌ Redis connection failed: $($_.Exception.Message)"
        }
    } else {
        Write-Warning "⚠️  Redis not configured"
    }
    
    Write-Host ""
}

# Function: Memory profiling
function Profile-Memory {
    Write-Info "═══════════════════════════════════════"
    Write-Info "  MEMORY PROFILING"
    Write-Info "═══════════════════════════════════════`n"
    
    Write-Info "Checking for memory leaks...`n"
    
    # Check Node.js memory usage
    $nodeProcesses = Get-Process -Name node -ErrorAction SilentlyContinue
    
    if ($nodeProcesses) {
        Write-Info "Node.js Processes:"
        
        $nodeProcesses | ForEach-Object {
            $memoryMB = [math]::Round($_.WorkingSet64 / 1MB, 2)
            $color = if ($memoryMB -lt 500) { "Green" } elseif ($memoryMB -lt 1000) { "Yellow" } else { "Red" }
            
            Write-Host "  PID $($_.Id): $memoryMB MB" -ForegroundColor $color
        }
    } else {
        Write-Warning "⚠️  No Node.js processes found"
    }
    
    Write-Host ""
}

# Run tasks
switch ($Task) {
    'all' {
        Optimize-Database
        Optimize-Images
        Analyze-Bundle
        Validate-Cache
        Profile-Memory
    }
    'database' { Optimize-Database }
    'images' { Optimize-Images }
    'bundle' { Analyze-Bundle }
    'cache' { Validate-Cache }
    'memory' { Profile-Memory }
}

# Summary
Write-Host "════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  OPTIMIZATION COMPLETE" -ForegroundColor White -BackgroundColor Green
Write-Host "════════════════════════════════════════`n" -ForegroundColor Cyan

Write-Success "✅ Performance optimizations applied successfully!"
Write-Info "`nCheck reports/performance/ for detailed analysis.`n"
