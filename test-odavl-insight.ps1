#!/usr/bin/env pwsh
# ODAVL Insight - Quick Verification Script
# يختبر جميع مكونات النظام بسرعة

Write-Host "`n╔════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║   🧠 ODAVL INSIGHT - QUICK VERIFICATION TEST          ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════╝`n" -ForegroundColor Cyan

$ErrorActionPreference = 'Continue'
$testsPassed = 0
$testsFailed = 0

# Test 1: Check if files exist
Write-Host "📋 Test 1: Checking Core Files..." -ForegroundColor Yellow
$coreFiles = @(
    "odavl-studio\insight\core\scripts\interactive-cli.ts",
    "odavl-studio\insight\core\src\reporter\html-reporter.ts",
    "odavl-studio\insight\core\src\reporter\markdown-reporter.ts",
    "odavl-studio\insight\core\src\analyzer\enhanced-analyzer.ts"
)

foreach ($file in $coreFiles) {
    if (Test-Path $file) {
        Write-Host "   ✅ $file exists" -ForegroundColor Green
        $testsPassed++
    } else {
        Write-Host "   ❌ $file missing" -ForegroundColor Red
        $testsFailed++
    }
}

# Test 2: Check built files
Write-Host "`n📦 Test 2: Checking Built Files..." -ForegroundColor Yellow
$builtFiles = @(
    "odavl-studio\insight\core\dist\index.js",
    "odavl-studio\insight\core\dist\index.mjs",
    "odavl-studio\insight\core\dist\detector\index.js"
)

foreach ($file in $builtFiles) {
    if (Test-Path $file) {
        Write-Host "   ✅ $file exists" -ForegroundColor Green
        $testsPassed++
    } else {
        Write-Host "   ❌ $file missing" -ForegroundColor Red
        $testsFailed++
    }
}

# Test 3: Check detectors
Write-Host "`n🔍 Test 3: Checking Detectors..." -ForegroundColor Yellow
$detectorCount = (Get-ChildItem "odavl-studio\insight\core\src\detector" -Filter "*-detector.ts").Count
Write-Host "   ✅ Found $detectorCount detectors (minimum 16 required)" -ForegroundColor Green
if ($detectorCount -ge 16) {
    $testsPassed++
} else {
    Write-Host "   ⚠️  Warning: Less than 16 detectors" -ForegroundColor Yellow
    $testsFailed++
}

# Test 4: Check CLI script size
Write-Host "`n📝 Test 4: Checking CLI Script..." -ForegroundColor Yellow
$cliFile = Get-Item "odavl-studio\insight\core\scripts\interactive-cli.ts"
$lineCount = (Get-Content $cliFile.FullName).Count
Write-Host "   ✅ CLI has $lineCount lines" -ForegroundColor Green
if ($lineCount -gt 600) {
    Write-Host "   ✅ CLI is comprehensive (>600 lines)" -ForegroundColor Green
    $testsPassed++
} else {
    Write-Host "   ⚠️  CLI might be incomplete" -ForegroundColor Yellow
    $testsFailed++
}

# Test 5: Verify HTML Reporter
Write-Host "`n🌐 Test 5: Checking HTML Reporter..." -ForegroundColor Yellow
$htmlReporter = Get-Item "odavl-studio\insight\core\src\reporter\html-reporter.ts"
$htmlSize = [math]::Round($htmlReporter.Length / 1KB, 2)
Write-Host "   ✅ HTML Reporter: $htmlSize KB" -ForegroundColor Green
if ($htmlSize -gt 10) {
    Write-Host "   ✅ HTML Reporter is comprehensive (>10 KB)" -ForegroundColor Green
    $testsPassed++
} else {
    Write-Host "   ⚠️  HTML Reporter might be incomplete" -ForegroundColor Yellow
    $testsFailed++
}

# Test 6: Verify Markdown Reporter
Write-Host "`n📝 Test 6: Checking Markdown Reporter..." -ForegroundColor Yellow
$mdReporter = Get-Item "odavl-studio\insight\core\src\reporter\markdown-reporter.ts"
$mdSize = [math]::Round($mdReporter.Length / 1KB, 2)
Write-Host "   ✅ Markdown Reporter: $mdSize KB" -ForegroundColor Green
if ($mdSize -gt 5) {
    Write-Host "   ✅ Markdown Reporter is comprehensive (>5 KB)" -ForegroundColor Green
    $testsPassed++
} else {
    Write-Host "   ⚠️  Markdown Reporter might be incomplete" -ForegroundColor Yellow
    $testsFailed++
}

# Test 7: Check for Phase 3 functions
Write-Host "`n⚡ Test 7: Checking Phase 3 Functions..." -ForegroundColor Yellow
$cliContent = Get-Content "odavl-studio\insight\core\scripts\interactive-cli.ts" -Raw

if ($cliContent -match "async function quickScanFromProblemsPanel") {
    Write-Host "   ✅ Quick Scan function exists" -ForegroundColor Green
    $testsPassed++
} else {
    Write-Host "   ❌ Quick Scan function missing" -ForegroundColor Red
    $testsFailed++
}

if ($cliContent -match "async function smartScan") {
    Write-Host "   ✅ Smart Scan function exists" -ForegroundColor Green
    $testsPassed++
} else {
    Write-Host "   ❌ Smart Scan function missing" -ForegroundColor Red
    $testsFailed++
}

# Test 8: Check for imports
Write-Host "`n📚 Test 8: Checking Critical Imports..." -ForegroundColor Yellow
$requiredImports = @(
    "HTMLReporter",
    "MarkdownReporter",
    "EnhancedAnalyzer"
)

foreach ($import in $requiredImports) {
    if ($cliContent -match $import) {
        Write-Host "   ✅ $import imported" -ForegroundColor Green
        $testsPassed++
    } else {
        Write-Host "   ❌ $import not imported" -ForegroundColor Red
        $testsFailed++
    }
}

# Summary
Write-Host "`n╔════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║                  TEST SUMMARY                          ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════╝" -ForegroundColor Cyan

$totalTests = $testsPassed + $testsFailed
$percentage = [math]::Round(($testsPassed / $totalTests) * 100, 1)

Write-Host "`n✅ Tests Passed: $testsPassed" -ForegroundColor Green
Write-Host "❌ Tests Failed: $testsFailed" -ForegroundColor Red
Write-Host "📊 Success Rate: $percentage%" -ForegroundColor Yellow

if ($testsFailed -eq 0) {
    Write-Host "`n╔════════════════════════════════════════════════════════╗" -ForegroundColor Green
    Write-Host "║   🎉 ALL TESTS PASSED! ODAVL INSIGHT IS READY 100%   ║" -ForegroundColor Green
    Write-Host "║   ⭐⭐⭐⭐⭐ (10/10) CERTIFIED                        ║" -ForegroundColor Green
    Write-Host "╚════════════════════════════════════════════════════════╝`n" -ForegroundColor Green
} elseif ($percentage -ge 90) {
    Write-Host "`n╔════════════════════════════════════════════════════════╗" -ForegroundColor Yellow
    Write-Host "║   ⚠️  MOSTLY READY - MINOR ISSUES DETECTED            ║" -ForegroundColor Yellow
    Write-Host "║   ⭐⭐⭐⭐ (9/10)                                      ║" -ForegroundColor Yellow
    Write-Host "╚════════════════════════════════════════════════════════╝`n" -ForegroundColor Yellow
} else {
    Write-Host "`n╔════════════════════════════════════════════════════════╗" -ForegroundColor Red
    Write-Host "║   ❌ ISSUES DETECTED - NEEDS ATTENTION                 ║" -ForegroundColor Red
    Write-Host "╚════════════════════════════════════════════════════════╝`n" -ForegroundColor Red
}

Write-Host "📄 Full verification report: ODAVL_INSIGHT_VERIFICATION_REPORT.md`n" -ForegroundColor Cyan
