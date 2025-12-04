# ODAVL Insight - Screenshot & Publishing Automation Script
# This script opens all necessary files and URLs for taking screenshots and publishing

Write-Host "🚀 ODAVL Insight - Screenshot & Publishing Helper" -ForegroundColor Cyan
Write-Host "=================================================" -ForegroundColor Cyan
Write-Host ""

# Check if we're in the right directory
$currentDir = Get-Location
$expectedPath = "odavl"
if ($currentDir.Path -notlike "*$expectedPath*") {
    Write-Host "⚠️  Warning: Not in ODAVL directory" -ForegroundColor Yellow
    Write-Host "Current: $currentDir" -ForegroundColor Yellow
    Write-Host "Please navigate to the ODAVL project root" -ForegroundColor Yellow
    exit 1
}

Write-Host "✅ Current directory: $currentDir" -ForegroundColor Green
Write-Host ""

# Step 1: Open VS Code in screenshot-examples folder
Write-Host "📂 Step 1: Opening VS Code for screenshots..." -ForegroundColor Yellow
$screenshotDir = Join-Path $currentDir "screenshot-examples"
if (Test-Path $screenshotDir) {
    Write-Host "   Opening: $screenshotDir" -ForegroundColor Gray
    Start-Process "code" -ArgumentList $screenshotDir
    Write-Host "   ✅ VS Code opened in screenshot-examples/" -ForegroundColor Green
}
else {
    Write-Host "   ❌ screenshot-examples/ directory not found!" -ForegroundColor Red
    exit 1
}

Start-Sleep -Seconds 2

# Step 2: Open README file for copy-paste
Write-Host ""
Write-Host "📄 Step 2: Opening README for Marketplace..." -ForegroundColor Yellow
$readmePath = Join-Path $currentDir "ODAVL_INSIGHT_MARKETPLACE_README.md"
if (Test-Path $readmePath) {
    Write-Host "   Opening: $readmePath" -ForegroundColor Gray
    Start-Process "code" -ArgumentList $readmePath
    Write-Host "   ✅ README opened in VS Code" -ForegroundColor Green
}
else {
    Write-Host "   ❌ ODAVL_INSIGHT_MARKETPLACE_README.md not found!" -ForegroundColor Red
    exit 1
}

Start-Sleep -Seconds 2

# Step 3: Open Publishing Guide
Write-Host ""
Write-Host "📖 Step 3: Opening Publishing Guide..." -ForegroundColor Yellow
$guidePath = Join-Path $currentDir "MARKETPLACE_PUBLISHING_GUIDE.md"
if (Test-Path $guidePath) {
    Write-Host "   Opening: $guidePath" -ForegroundColor Gray
    Start-Process "code" -ArgumentList $guidePath
    Write-Host "   ✅ Publishing guide opened" -ForegroundColor Green
}
else {
    Write-Host "   ⚠️  MARKETPLACE_PUBLISHING_GUIDE.md not found" -ForegroundColor Yellow
}

Start-Sleep -Seconds 2

# Step 4: Open Screenshots Guide
Write-Host ""
Write-Host "📸 Step 4: Opening Screenshots Guide..." -ForegroundColor Yellow
$screenshotsGuidePath = Join-Path $currentDir "SCREENSHOTS_GUIDE.md"
if (Test-Path $screenshotsGuidePath) {
    Write-Host "   Opening: $screenshotsGuidePath" -ForegroundColor Gray
    Start-Process "code" -ArgumentList $screenshotsGuidePath
    Write-Host "   ✅ Screenshots guide opened" -ForegroundColor Green
}
else {
    Write-Host "   ⚠️  SCREENSHOTS_GUIDE.md not found" -ForegroundColor Yellow
}

Start-Sleep -Seconds 2

# Step 5: Open Marketplace Publisher Portal
Write-Host ""
Write-Host "🌐 Step 5: Opening VS Code Marketplace Publisher Portal..." -ForegroundColor Yellow
$marketplaceUrl = "https://marketplace.visualstudio.com/manage/publishers/odavl"
Write-Host "   Opening: $marketplaceUrl" -ForegroundColor Gray
Start-Process $marketplaceUrl
Write-Host "   ✅ Marketplace portal opened in browser" -ForegroundColor Green

Start-Sleep -Seconds 2

# Step 6: Check if media directory exists
Write-Host ""
Write-Host "📁 Step 6: Checking media directory..." -ForegroundColor Yellow
$mediaDir = Join-Path $currentDir "odavl-studio\insight\extension\media"
if (Test-Path $mediaDir) {
    Write-Host "   ✅ Media directory exists: $mediaDir" -ForegroundColor Green
    $screenshotCount = (Get-ChildItem -Path $mediaDir -Filter "*.png" -ErrorAction SilentlyContinue).Count
    Write-Host "   📊 Current screenshots: $screenshotCount/5" -ForegroundColor Cyan
    if ($screenshotCount -lt 5) {
        Write-Host "   ⚠️  Need $($5 - $screenshotCount) more screenshots" -ForegroundColor Yellow
    }
    else {
        Write-Host "   ✅ All 5 screenshots ready!" -ForegroundColor Green
    }
}
else {
    Write-Host "   ⚠️  Media directory not found, creating..." -ForegroundColor Yellow
    New-Item -ItemType Directory -Path $mediaDir -Force | Out-Null
    Write-Host "   ✅ Created: $mediaDir" -ForegroundColor Green
}

# Step 7: Open media directory in Explorer
Write-Host ""
Write-Host "📂 Step 7: Opening media directory in Explorer..." -ForegroundColor Yellow
if (Test-Path $mediaDir) {
    explorer.exe $mediaDir
    Write-Host "   ✅ Media folder opened" -ForegroundColor Green
}

# Summary
Write-Host ""
Write-Host "=================================================" -ForegroundColor Cyan
Write-Host "✅ Setup Complete!" -ForegroundColor Green
Write-Host "=================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "📋 Next Steps:" -ForegroundColor Yellow
Write-Host ""
Write-Host "1️⃣  Take 5 Screenshots (15-20 minutes):" -ForegroundColor White
Write-Host "   - Open files in screenshot-examples/" -ForegroundColor Gray
Write-Host "   - Follow SCREENSHOTS_GUIDE.md" -ForegroundColor Gray
Write-Host "   - Save to media/ directory" -ForegroundColor Gray
Write-Host ""
Write-Host "2️⃣  Update Marketplace (5 minutes):" -ForegroundColor White
Write-Host "   - Browser should be open at Marketplace portal" -ForegroundColor Gray
Write-Host "   - Edit odavl-insight-vscode" -ForegroundColor Gray
Write-Host "   - Replace Overview with ODAVL_INSIGHT_MARKETPLACE_README.md" -ForegroundColor Gray
Write-Host "   - Upload 5 screenshots to Gallery" -ForegroundColor Gray
Write-Host ""
Write-Host "3️⃣  Verify & Publish:" -ForegroundColor White
Write-Host "   - Check extension page" -ForegroundColor Gray
Write-Host "   - Test installation" -ForegroundColor Gray
Write-Host "   - Promote on social media!" -ForegroundColor Gray
Write-Host ""
Write-Host "🎉 You're 30 minutes away from launch!" -ForegroundColor Cyan
Write-Host ""

# Wait for user confirmation
Write-Host "Press any key to continue..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
