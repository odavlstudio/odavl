# PowerShell Script to Generate ODAVL Insight Screenshots and Assets

Write-Host "🎨 Generating ODAVL Insight Visual Assets..." -ForegroundColor Cyan
Write-Host ""

$projectRoot = "C:\Users\sabou\dev\odavl"
$mediaDir = "$projectRoot\odavl-studio\insight\extension\media"
$examplesDir = "$projectRoot\screenshot-examples"

# Check if ImageMagick is installed (for SVG to PNG conversion)
$hasImageMagick = Get-Command "magick" -ErrorAction SilentlyContinue

if ($hasImageMagick) {
    Write-Host "✅ ImageMagick found - converting icon..." -ForegroundColor Green
    
    # Convert SVG icon to PNG (128x128)
    & magick convert -background none "$mediaDir\icon.svg" -resize 128x128 "$mediaDir\icon.png"
    Write-Host "   Created: icon.png (128x128)" -ForegroundColor Gray
    
    # Create larger version for Marketplace (256x256)
    & magick convert -background none "$mediaDir\icon.svg" -resize 256x256 "$mediaDir\icon-large.png"
    Write-Host "   Created: icon-large.png (256x256)" -ForegroundColor Gray
}
else {
    Write-Host "⚠️  ImageMagick not installed - skipping PNG conversion" -ForegroundColor Yellow
    Write-Host "   Download from: https://imagemagick.org/script/download.php" -ForegroundColor Gray
    Write-Host "   Or use online converter: https://cloudconvert.com/svg-to-png" -ForegroundColor Gray
}

Write-Host ""
Write-Host "📸 Screenshot Instructions:" -ForegroundColor Cyan
Write-Host ""

# Screenshot 1: Problems Panel
Write-Host "1️⃣  Problems Panel Screenshot:" -ForegroundColor Yellow
Write-Host "   - Open: $examplesDir\typescript-issues.ts" -ForegroundColor Gray
Write-Host "   - Save file (Ctrl+S) to trigger analysis" -ForegroundColor Gray
Write-Host "   - Open Problems Panel (Ctrl+Shift+M)" -ForegroundColor Gray
Write-Host "   - Take screenshot (Windows + Shift + S)" -ForegroundColor Gray
Write-Host "   - Save as: $mediaDir\01-problems-panel.png" -ForegroundColor Gray
Write-Host ""

# Screenshot 2: Commands
Write-Host "2️⃣  Commands Screenshot:" -ForegroundColor Yellow
Write-Host "   - Press Ctrl+Shift+P" -ForegroundColor Gray
Write-Host "   - Type 'ODAVL'" -ForegroundColor Gray
Write-Host "   - Take screenshot showing 6 commands" -ForegroundColor Gray
Write-Host "   - Save as: $mediaDir\02-commands.png" -ForegroundColor Gray
Write-Host ""

# Screenshot 3: TypeScript Detection
Write-Host "3️⃣  TypeScript Detection Screenshot:" -ForegroundColor Yellow
Write-Host "   - Click on an error in Problems Panel" -ForegroundColor Gray
Write-Host "   - Screenshot showing code + error message" -ForegroundColor Gray
Write-Host "   - Save as: $mediaDir\03-typescript-detection.png" -ForegroundColor Gray
Write-Host ""

# Screenshot 4: Python Security
Write-Host "4️⃣  Python Security Screenshot:" -ForegroundColor Yellow
Write-Host "   - Open: $examplesDir\python-issues.py" -ForegroundColor Gray
Write-Host "   - Save to trigger analysis" -ForegroundColor Gray
Write-Host "   - Screenshot security warning" -ForegroundColor Gray
Write-Host "   - Save as: $mediaDir\04-python-security.png" -ForegroundColor Gray
Write-Host ""

# Screenshot 5: Multi-Language
Write-Host "5️⃣  Multi-Language Support Screenshot:" -ForegroundColor Yellow
Write-Host "   - Run: ODAVL Insight: Show Workspace Languages" -ForegroundColor Gray
Write-Host "   - Screenshot the language report" -ForegroundColor Gray
Write-Host "   - Save as: $mediaDir\05-multi-language.png" -ForegroundColor Gray
Write-Host ""

Write-Host "================================================" -ForegroundColor Cyan
Write-Host "📁 Save all screenshots to:" -ForegroundColor Green
Write-Host "   $mediaDir" -ForegroundColor White
Write-Host ""
Write-Host "🎯 After taking screenshots:" -ForegroundColor Green
Write-Host "   Run: .\build-complete-vsix.ps1" -ForegroundColor White
Write-Host "================================================" -ForegroundColor Cyan

# Open directories for convenience
Write-Host ""
Write-Host "Opening folders..." -ForegroundColor Gray
explorer.exe $mediaDir
Start-Sleep -Seconds 1
code $examplesDir

Write-Host ""
Write-Host "✅ Ready to take screenshots!" -ForegroundColor Green
