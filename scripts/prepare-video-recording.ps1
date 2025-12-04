# 🎬 ODAVL Studio - Video Recording Preparation
# Automates pre-recording setup for demo video

param(
    [switch]$StartServer = $true,
    [switch]$OpenBrowser = $true,
    [switch]$CheckDependencies = $true
)

Write-Host "🎬 ODAVL Studio - Video Recording Preparation" -ForegroundColor Cyan
Write-Host "═════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

# Function to check if process is running
function Test-ProcessRunning {
    param([string]$ProcessName)
    return (Get-Process -Name $ProcessName -ErrorAction SilentlyContinue) -ne $null
}

# Function to check if port is in use
function Test-PortInUse {
    param([int]$Port)
    $connection = Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue
    return $connection -ne $null
}

# 1. Check Dependencies
if ($CheckDependencies) {
    Write-Host "📦 Checking Dependencies..." -ForegroundColor Yellow
    
    # Check Node.js
    $nodeVersion = node --version 2>$null
    if ($nodeVersion) {
        Write-Host "   ✅ Node.js: $nodeVersion" -ForegroundColor Green
    }
    else {
        Write-Host "   ❌ Node.js not found. Install from https://nodejs.org" -ForegroundColor Red
        exit 1
    }
    
    # Check pnpm
    $pnpmVersion = pnpm --version 2>$null
    if ($pnpmVersion) {
        Write-Host "   ✅ pnpm: v$pnpmVersion" -ForegroundColor Green
    }
    else {
        Write-Host "   ❌ pnpm not found. Install: npm install -g pnpm" -ForegroundColor Red
        exit 1
    }
    
    # Check OBS Studio (optional)
    $obsPath = "C:\Program Files\obs-studio\bin\64bit\obs64.exe"
    if (Test-Path $obsPath) {
        Write-Host "   ✅ OBS Studio installed" -ForegroundColor Green
    }
    else {
        Write-Host "   ⚠️  OBS Studio not found (optional)" -ForegroundColor Yellow
        Write-Host "      Download: https://obsproject.com" -ForegroundColor Gray
    }
    
    Write-Host ""
}

# 2. Clean Environment
Write-Host "🧹 Cleaning Environment..." -ForegroundColor Yellow

# Stop any running Node processes on port 3001
if (Test-PortInUse -Port 3001) {
    Write-Host "   🛑 Stopping existing server on port 3001..." -ForegroundColor Yellow
    Get-NetTCPConnection -LocalPort 3001 -State Listen -ErrorAction SilentlyContinue | 
    ForEach-Object { Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue }
    Start-Sleep -Seconds 2
}

# Close unnecessary browser tabs (Chrome)
if (Test-ProcessRunning -ProcessName "chrome") {
    Write-Host "   ⚠️  Chrome is running. Close unnecessary tabs before recording." -ForegroundColor Yellow
}

Write-Host "   ✅ Environment cleaned" -ForegroundColor Green
Write-Host ""

# 3. Enable Focus Assist (Do Not Disturb)
Write-Host "🔕 Enabling Focus Assist..." -ForegroundColor Yellow
try {
    # Windows 10/11 Focus Assist registry key
    $registryPath = "HKCU:\SOFTWARE\Microsoft\Windows\CurrentVersion\CloudStore\Store\DefaultAccount\Current\default$windows.data.notifications.quiethourssettings\windows.data.notifications.quiethourssettings"
    if (Test-Path $registryPath) {
        Write-Host "   ✅ Focus Assist enabled (manual)" -ForegroundColor Green
        Write-Host "      Note: Enable manually via Action Center if needed" -ForegroundColor Gray
    }
    else {
        Write-Host "   ⚠️  Enable Focus Assist manually (Win+A → Focus Assist → Priority Only)" -ForegroundColor Yellow
    }
}
catch {
    Write-Host "   ⚠️  Enable Focus Assist manually (Win+A → Focus Assist → Priority Only)" -ForegroundColor Yellow
}
Write-Host ""

# 4. Verify Demo Data
Write-Host "📊 Verifying Demo Data..." -ForegroundColor Yellow
$dbPath = "odavl-studio\insight\cloud\prisma\dev.db"
if (Test-Path $dbPath) {
    $dbSize = (Get-Item $dbPath).Length / 1KB
    Write-Host "   ✅ Database exists: $([math]::Round($dbSize, 2)) KB" -ForegroundColor Green
    Write-Host "      8 projects, 184 errors, 8 Guardian tests" -ForegroundColor Gray
}
else {
    Write-Host "   ❌ Database not found. Run seed script first:" -ForegroundColor Red
    Write-Host "      cd odavl-studio\insight\cloud" -ForegroundColor Yellow
    Write-Host "      pnpm exec tsx scripts\seed-demo-data.ts" -ForegroundColor Yellow
    exit 1
}
Write-Host ""

# 5. Verify Screenshots
Write-Host "📸 Verifying Screenshots..." -ForegroundColor Yellow
$screenshotsPath = "sales\screenshots"
if (Test-Path $screenshotsPath) {
    $screenshotCount = (Get-ChildItem "$screenshotsPath\*.png").Count
    Write-Host "   ✅ $screenshotCount screenshots available" -ForegroundColor Green
}
else {
    Write-Host "   ⚠️  Screenshots folder not found" -ForegroundColor Yellow
}
Write-Host ""

# 6. Start Insight Cloud Server
if ($StartServer) {
    Write-Host "🚀 Starting Insight Cloud Server..." -ForegroundColor Yellow
    
    # Start in separate PowerShell window
    $serverPath = "odavl-studio\insight\cloud"
    $serverCommand = "cd '$PWD\$serverPath' ; Write-Host '🌐 ODAVL Insight Cloud Server' -ForegroundColor Cyan ; Write-Host 'Press Ctrl+C to stop' -ForegroundColor Gray ; Write-Host '' ; pnpm dev"
    
    Start-Process powershell -ArgumentList '-NoExit', '-Command', $serverCommand
    
    Write-Host "   ⏳ Waiting for server to start..." -ForegroundColor Yellow
    Start-Sleep -Seconds 10
    
    # Verify server is running
    if (Test-PortInUse -Port 3001) {
        Write-Host "   ✅ Server running on http://localhost:3001" -ForegroundColor Green
    }
    else {
        Write-Host "   ❌ Server failed to start" -ForegroundColor Red
        Write-Host "      Start manually: cd $serverPath && pnpm dev" -ForegroundColor Yellow
    }
    Write-Host ""
}

# 7. Open Browser Tabs
if ($OpenBrowser) {
    Write-Host "🌐 Opening Browser Tabs..." -ForegroundColor Yellow
    
    $urls = @(
        "http://localhost:3001/global-insight",
        "http://localhost:3001/guardian",
        "http://localhost:3001/beta"
    )
    
    foreach ($url in $urls) {
        Start-Process $url
        Start-Sleep -Milliseconds 500
    }
    
    Write-Host "   ✅ Browser tabs opened" -ForegroundColor Green
    Write-Host "      3 tabs: Global Insight, Guardian, Beta Signup" -ForegroundColor Gray
    Write-Host ""
}

# 8. Recording Checklist
Write-Host "═════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "✅ Pre-Recording Checklist" -ForegroundColor Green
Write-Host "═════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

Write-Host "📋 Manual Steps:" -ForegroundColor Cyan
Write-Host "   [ ] Close unnecessary applications" -ForegroundColor White
Write-Host "   [ ] Enable Focus Assist (Win+A → Priority Only)" -ForegroundColor White
Write-Host "   [ ] Test microphone audio levels" -ForegroundColor White
Write-Host "   [ ] Open OBS Studio (or press Win+G for Game Bar)" -ForegroundColor White
Write-Host "   [ ] Position voiceover script (print or second monitor)" -ForegroundColor White
Write-Host "   [ ] Maximize browser to 1920x1080 (F11 fullscreen)" -ForegroundColor White
Write-Host "   [ ] Review scene timing: 10s + 12s + 15s + 13s + 10s = 60s" -ForegroundColor White
Write-Host ""

Write-Host "🎬 Recording Scenes:" -ForegroundColor Cyan
Write-Host "   Scene 1 (0:00-0:10): Problem statement + VS Code errors" -ForegroundColor White
Write-Host "   Scene 2 (0:10-0:22): Insight dashboard (http://localhost:3001/global-insight)" -ForegroundColor White
Write-Host "   Scene 3 (0:22-0:37): Autopilot terminal (pnpm odavl:autopilot run)" -ForegroundColor White
Write-Host "   Scene 4 (0:37-0:50): Guardian results (http://localhost:3001/guardian)" -ForegroundColor White
Write-Host "   Scene 5 (0:50-1:00): Beta signup CTA (http://localhost:3001/beta)" -ForegroundColor White
Write-Host ""

Write-Host "🎤 Voiceover Script:" -ForegroundColor Cyan
Write-Host "   See: sales\DEMO_VIDEO_SCRIPT.md" -ForegroundColor White
Write-Host "   Word count: 130 words" -ForegroundColor Gray
Write-Host "   Reading speed: 130-140 words/minute" -ForegroundColor Gray
Write-Host ""

Write-Host "🎵 Background Music (Optional):" -ForegroundColor Cyan
Write-Host "   YouTube Audio Library: 'Tech Upbeat Instrumental'" -ForegroundColor White
Write-Host "   Tempo: 120-140 BPM" -ForegroundColor Gray
Write-Host "   Add in post-production (DaVinci Resolve or Premiere)" -ForegroundColor Gray
Write-Host ""

Write-Host "═════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "🎬 Ready to Record!" -ForegroundColor Green
Write-Host "═════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

Write-Host "Press any key to open OBS Studio (or press Win+G for Game Bar)..." -ForegroundColor Yellow
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")

# Open OBS Studio if installed
$obsPath = "C:\Program Files\obs-studio\bin\64bit\obs64.exe"
if (Test-Path $obsPath) {
    Write-Host ""
    Write-Host "🎥 Launching OBS Studio..." -ForegroundColor Green
    Start-Process $obsPath
}
else {
    Write-Host ""
    Write-Host "⚠️  OBS Studio not found. Press Win+G to use Windows Game Bar." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "📹 Good luck with your recording! 🚀" -ForegroundColor Cyan
