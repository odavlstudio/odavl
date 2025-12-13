# ODAVL Insight Extension - Publishing Script
# Run this from: odavl-studio/insight/extension/

# ========================================
# STEP 1: VERIFY ENVIRONMENT
# ========================================
Write-Host "🔍 Step 1: Verifying environment..." -ForegroundColor Cyan

# Check vsce is installed
$vsceVersion = pnpm vsce --version 2>&1 | Select-Object -First 1
if ($vsceVersion) {
    Write-Host "✅ vsce version: $vsceVersion" -ForegroundColor Green
}
else {
    Write-Host "❌ vsce not found. Install with: pnpm add -D @vscode/vsce" -ForegroundColor Red
    exit 1
}

# Check publisher login
$publishers = pnpm vsce ls-publishers 2>&1 | Select-String "odavl"
if ($publishers) {
    Write-Host "✅ Publisher 'odavl' is logged in" -ForegroundColor Green
}
else {
    Write-Host "⚠️  Not logged in. Run: pnpm vsce login odavl" -ForegroundColor Yellow
    exit 1
}

# Check critical files
Write-Host "`n🔍 Checking critical files..." -ForegroundColor Cyan
$requiredFiles = @('package.json', 'README.md', 'CHANGELOG.md', 'icon.png', 'LICENSE')
$allFilesPresent = $true
foreach ($file in $requiredFiles) {
    if (Test-Path $file) {
        Write-Host "✅ $file" -ForegroundColor Green
    }
    else {
        Write-Host "❌ $file MISSING" -ForegroundColor Red
        $allFilesPresent = $false
    }
}

if (-not $allFilesPresent) {
    Write-Host "`n❌ Missing required files. Fix before publishing." -ForegroundColor Red
    exit 1
}

# ========================================
# STEP 2: BUILD EXTENSION
# ========================================
Write-Host "`n🔨 Step 2: Building extension..." -ForegroundColor Cyan
pnpm compile
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Build failed" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Build successful" -ForegroundColor Green

# Check bundle size
$bundleSize = (Get-Item "dist/extension-v2.js").Length / 1KB
Write-Host "📦 Bundle size: $([math]::Round($bundleSize, 2)) KB" -ForegroundColor Cyan

# ========================================
# STEP 3: PACKAGE EXTENSION
# ========================================
Write-Host "`n📦 Step 3: Packaging extension..." -ForegroundColor Cyan
pnpm vsce package --no-dependencies
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Packaging failed" -ForegroundColor Red
    exit 1
}

# Get VSIX info
$vsixFile = Get-Item "odavl-insight-vscode-*.vsix" | Sort-Object LastWriteTime -Descending | Select-Object -First 1
$vsixSize = [math]::Round($vsixFile.Length / 1MB, 2)
Write-Host "✅ VSIX created: $($vsixFile.Name) ($vsixSize MB)" -ForegroundColor Green

# ========================================
# STEP 4: LOCAL INSTALLATION TEST
# ========================================
Write-Host "`n🧪 Step 4: Testing local installation..." -ForegroundColor Cyan
$testInstall = code --install-extension $vsixFile.FullName --force 2>&1
if ($testInstall -match "successfully installed") {
    Write-Host "✅ Extension installs successfully" -ForegroundColor Green
}
else {
    Write-Host "⚠️  Local install test issue (non-blocking)" -ForegroundColor Yellow
}

# ========================================
# STEP 5: PRE-PUBLISH CONFIRMATION
# ========================================
Write-Host "`n📋 Pre-Publish Summary" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor DarkGray

# Read package.json for details
$packageJson = Get-Content "package.json" | ConvertFrom-Json
Write-Host "Extension Name:    $($packageJson.name)" -ForegroundColor White
Write-Host "Display Name:      $($packageJson.displayName)" -ForegroundColor White
Write-Host "Version:           $($packageJson.version)" -ForegroundColor White
Write-Host "Publisher:         $($packageJson.publisher)" -ForegroundColor White
Write-Host "VSIX File:         $($vsixFile.Name)" -ForegroundColor White
Write-Host "VSIX Size:         $vsixSize MB" -ForegroundColor White
Write-Host "Marketplace URL:   https://marketplace.visualstudio.com/items?itemName=$($packageJson.publisher).$($packageJson.name)" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor DarkGray

# ========================================
# STEP 6: PUBLISH TO MARKETPLACE
# ========================================
Write-Host "`n🚀 Step 6: Publishing to VS Code Marketplace..." -ForegroundColor Cyan
Write-Host "This will publish version $($packageJson.version) to the public marketplace." -ForegroundColor Yellow
$confirmation = Read-Host "Continue? (yes/no)"

if ($confirmation -ne "yes") {
    Write-Host "❌ Publishing cancelled by user" -ForegroundColor Red
    exit 0
}

Write-Host "`nPublishing..." -ForegroundColor Cyan
pnpm vsce publish --packagePath $vsixFile.FullName

if ($LASTEXITCODE -eq 0) {
    Write-Host "`n✅ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Green
    Write-Host "✅ EXTENSION PUBLISHED SUCCESSFULLY!" -ForegroundColor Green
    Write-Host "✅ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Green
    
    Write-Host "`n📊 Post-Publishing Checks:" -ForegroundColor Cyan
    Write-Host "1. Visit: https://marketplace.visualstudio.com/items?itemName=$($packageJson.publisher).$($packageJson.name)" -ForegroundColor White
    Write-Host "2. Wait 5-10 minutes for marketplace indexing" -ForegroundColor White
    Write-Host "3. Install via VS Code: Extensions → Search 'ODAVL Insight'" -ForegroundColor White
    Write-Host "4. Verify commands work: Ctrl+Shift+P → 'ODAVL'" -ForegroundColor White
    
    Write-Host "`n📈 Monitoring:" -ForegroundColor Cyan
    Write-Host "• Publisher dashboard: https://marketplace.visualstudio.com/manage/publishers/odavl" -ForegroundColor White
    Write-Host "• Install analytics available after 24 hours" -ForegroundColor White
    
}
else {
    Write-Host "`n❌ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Red
    Write-Host "❌ PUBLISHING FAILED" -ForegroundColor Red
    Write-Host "❌ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Red
    
    Write-Host "`n🔍 Troubleshooting:" -ForegroundColor Yellow
    Write-Host "1. Verify PAT token is valid: https://dev.azure.com/odavlstudio/_usersSettings/tokens" -ForegroundColor White
    Write-Host "2. Check publisher access: pnpm vsce ls-publishers" -ForegroundColor White
    Write-Host "3. Re-login: pnpm vsce login odavl" -ForegroundColor White
    Write-Host "4. Manual upload: https://marketplace.visualstudio.com/manage/publishers/odavl" -ForegroundColor White
    
    exit 1
}

# ========================================
# STEP 7: VERIFY PUBLICATION
# ========================================
Write-Host "`n🔍 Step 7: Verifying publication..." -ForegroundColor Cyan
Start-Sleep -Seconds 5

$extensionInfo = pnpm vsce show "$($packageJson.publisher).$($packageJson.name)" 2>&1
if ($extensionInfo -match $packageJson.version) {
    Write-Host "✅ Extension version $($packageJson.version) is live on marketplace" -ForegroundColor Green
}
else {
    Write-Host "⚠️  Verification pending (marketplace may take 5-30 minutes to index)" -ForegroundColor Yellow
}

Write-Host "`n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Green
Write-Host "🎉 PUBLISHING COMPLETE!" -ForegroundColor Green
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Green
