# ODAVL WAVE X-2 Safe Build Analyzer
# Analyzes build performance without destructive operations

param(
    [string]$BuildPath = ".next",
    [switch]$Detailed = $false
)

Write-Host "🔍 ODAVL Build Performance Analysis" -ForegroundColor Yellow
Write-Host "=====================================`n" -ForegroundColor Yellow

# Check if build exists
if (-not (Test-Path $BuildPath)) {
    Write-Host "❌ Build directory not found: $BuildPath" -ForegroundColor Red
    exit 1
}

# Analyze bundle sizes
$staticPath = Join-Path $BuildPath "static"
if (Test-Path $staticPath) {
    Write-Host "📦 Bundle Analysis:" -ForegroundColor Cyan
    
    # JS bundles
    $jsFiles = Get-ChildItem -Path $staticPath -Recurse -Filter "*.js" -ErrorAction SilentlyContinue
    $totalJSSize = ($jsFiles | Measure-Object -Property Length -Sum).Sum
    Write-Host "   JavaScript: $([math]::Round($totalJSSize / 1KB, 2)) KB" -ForegroundColor Green
    
    # CSS bundles  
    $cssFiles = Get-ChildItem -Path $staticPath -Recurse -Filter "*.css" -ErrorAction SilentlyContinue
    $totalCSSSize = ($cssFiles | Measure-Object -Property Length -Sum).Sum
    Write-Host "   CSS: $([math]::Round($totalCSSSize / 1KB, 2)) KB" -ForegroundColor Green
    
    Write-Host ""
}

# Performance targets check
$targets = @{
    "JS Bundle" = @{ "Current" = $totalJSSize; "Target" = 244000; "Unit" = "bytes" }
    "CSS Bundle" = @{ "Current" = $totalCSSSize; "Target" = 50000; "Unit" = "bytes" }
}

Write-Host "🎯 Performance Targets:" -ForegroundColor Cyan
foreach ($target in $targets.GetEnumerator()) {
    $current = $target.Value.Current
    $limit = $target.Value.Target
    $status = if ($current -le $limit) { "✅" } else { "⚠️" }
    $percentage = [math]::Round(($current / $limit) * 100, 1)
    Write-Host "   $($target.Key): $status $percentage% of target" -ForegroundColor $(if ($current -le $limit) { "Green" } else { "Yellow" })
}

Write-Host "`n🏁 Analysis Complete" -ForegroundColor Green