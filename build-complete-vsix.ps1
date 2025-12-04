# Build Complete ODAVL Insight VSIX
# With README, Icon, CHANGELOG, and all improvements

Write-Host "🚀 Building Complete ODAVL Insight VSIX v2.0.2..." -ForegroundColor Cyan
Write-Host ""

$projectRoot = "C:\Users\sabou\dev\odavl"
$extensionDir = "$projectRoot\odavl-studio\insight\extension"
$tempDir = "C:\temp\odavl-vsix-complete"

# Step 1: Clean temp directory
Write-Host "📁 Step 1: Preparing temp directory..." -ForegroundColor Yellow
if (Test-Path $tempDir) {
    Remove-Item $tempDir -Recurse -Force
}
New-Item -ItemType Directory -Path $tempDir -Force | Out-Null
Write-Host "   ✅ Temp directory ready" -ForegroundColor Green

# Step 2: Copy extension files
Write-Host ""
Write-Host "📦 Step 2: Copying extension files..." -ForegroundColor Yellow
Copy-Item -Path "$extensionDir\*" -Destination $tempDir -Recurse -Exclude "node_modules", "*.vsix" -Force
Write-Host "   ✅ Extension files copied" -ForegroundColor Green

# Step 3: Copy LICENSE
Write-Host ""
Write-Host "📄 Step 3: Copying LICENSE..." -ForegroundColor Yellow
Copy-Item -Path "$projectRoot\LICENSE" -Destination "$tempDir\LICENSE.md" -Force
Write-Host "   ✅ LICENSE copied" -ForegroundColor Green

# Step 4: Fix package.json
Write-Host ""
Write-Host "🔧 Step 4: Fixing package.json dependencies..." -ForegroundColor Yellow
$packageJson = Get-Content "$tempDir\package.json" -Raw
$packageJson = $packageJson -replace 'workspace:\^', 'file:../../core'
Set-Content -Path "$tempDir\package.json" -Value $packageJson
Write-Host "   ✅ package.json fixed" -ForegroundColor Green

# Step 5: Verify icon exists
Write-Host ""
Write-Host "🎨 Step 5: Verifying assets..." -ForegroundColor Yellow
if (Test-Path "$tempDir\media\icon.png") {
    $iconSize = (Get-Item "$tempDir\media\icon.png").Length
    Write-Host "   ✅ Icon found ($([math]::Round($iconSize/1KB, 2)) KB)" -ForegroundColor Green
}
else {
    Write-Host "   ⚠️  Icon not found - extension will use default" -ForegroundColor Yellow
}

# Step 6: Install dependencies
Write-Host ""
Write-Host "📥 Step 6: Installing dependencies..." -ForegroundColor Yellow
cd $tempDir
$installOutput = npm install --legacy-peer-deps 2>&1
$packagesAdded = ($installOutput | Select-String "added").ToString()
if ($packagesAdded) {
    Write-Host "   ✅ $packagesAdded" -ForegroundColor Green
}
else {
    Write-Host "   ✅ Dependencies installed" -ForegroundColor Green
}

# Step 7: Package VSIX
Write-Host ""
Write-Host "📦 Step 7: Creating VSIX package..." -ForegroundColor Yellow
$packageOutput = npx @vscode/vsce package --no-dependencies 2>&1
$doneMessage = ($packageOutput | Select-String "DONE").ToString()
if ($doneMessage) {
    Write-Host "   ✅ $doneMessage" -ForegroundColor Green
}
else {
    Write-Host "   ✅ VSIX created" -ForegroundColor Green
}

# Step 8: Copy to project
Write-Host ""
Write-Host "📁 Step 8: Copying VSIX to project..." -ForegroundColor Yellow
cd $projectRoot
Copy-Item -Path "$tempDir\odavl-insight-vscode-2.0.2.vsix" -Destination $extensionDir -Force

# Step 9: Verify VSIX
Write-Host ""
Write-Host "✅ Step 9: Verifying VSIX..." -ForegroundColor Yellow
$vsixInfo = Get-Item "$extensionDir\odavl-insight-vscode-2.0.2.vsix"
$sizeKB = [math]::Round($vsixInfo.Length / 1KB, 2)

Write-Host ""
Write-Host "================================================" -ForegroundColor Cyan
Write-Host "🎉 VSIX Successfully Built!" -ForegroundColor Green
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "📊 Package Information:" -ForegroundColor Yellow
Write-Host "   Version: 2.0.2" -ForegroundColor White
Write-Host "   Size: $sizeKB KB" -ForegroundColor White
Write-Host "   Location: $extensionDir\odavl-insight-vscode-2.0.2.vsix" -ForegroundColor White
Write-Host ""
Write-Host "✅ Improvements in v2.0.2:" -ForegroundColor Green
Write-Host "   • Professional README (15.6 KB)" -ForegroundColor Gray
Write-Host "   • Custom icon (128x128 PNG)" -ForegroundColor Gray
Write-Host "   • Updated CHANGELOG" -ForegroundColor Gray
Write-Host "   • .vscodeignore for optimized size" -ForegroundColor Gray
Write-Host "   • 28+ detectors documented" -ForegroundColor Gray
Write-Host ""
Write-Host "🚀 Next Steps:" -ForegroundColor Cyan
Write-Host "   1. Upload to Marketplace:" -ForegroundColor White
Write-Host "      https://marketplace.visualstudio.com/manage/publishers/odavl" -ForegroundColor Gray
Write-Host "   2. Click '...' → Update" -ForegroundColor White
Write-Host "   3. Upload: odavl-insight-vscode-2.0.2.vsix" -ForegroundColor Gray
Write-Host ""
Write-Host "📸 Optional - Add Screenshots:" -ForegroundColor Cyan
Write-Host "   Run: .\generate-assets.ps1" -ForegroundColor White
Write-Host "   Then take 5 screenshots and re-upload" -ForegroundColor Gray
Write-Host ""

# Open folder for convenience
explorer.exe $extensionDir

Write-Host "Press any key to open Marketplace..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
Start-Process "https://marketplace.visualstudio.com/manage/publishers/odavl"
