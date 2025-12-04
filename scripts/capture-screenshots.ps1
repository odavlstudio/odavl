# ODAVL Studio - Screenshot Capture Automation
# Uses Chrome DevTools Protocol for automated browser screenshots

param(
    [string]$OutputDir = "sales\screenshots",
    [int]$Width = 1920,
    [int]$Height = 1080,
    [string]$BaseUrl = "http://localhost:3001"
)

Write-Host "📸 ODAVL Studio - Screenshot Capture Automation" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

# Install Selenium WebDriver if not present
$seleniumInstalled = Get-Module -ListAvailable -Name Selenium -ErrorAction SilentlyContinue
if (-not $seleniumInstalled) {
    Write-Host "📦 Installing Selenium module..." -ForegroundColor Yellow
    Install-Module -Name Selenium -Scope CurrentUser -Force -AllowClobber
}

# Import Selenium
Import-Module Selenium

# Screenshot definitions
$screenshots = @(
    @{
        Name        = "01-hero-dashboard"
        Url         = "$BaseUrl/global-insight"
        Description = "Global Insight Dashboard - Hero view showing all metrics"
        Wait        = 3
    },
    @{
        Name        = "02-detector-grid"
        Url         = "$BaseUrl/global-insight"
        Description = "12 Detector Cards - TypeScript, ESLint, Security, etc."
        Wait        = 2
        Scroll      = 400
    },
    @{
        Name        = "03-error-details"
        Url         = "$BaseUrl/errors"
        Description = "Error Details Page - Fix recommendations with confidence scores"
        Wait        = 2
    },
    @{
        Name        = "04-guardian-results"
        Url         = "$BaseUrl/guardian"
        Description = "Guardian Test Results - Color-coded scores table"
        Wait        = 2
    },
    @{
        Name        = "05-guardian-summary"
        Url         = "$BaseUrl/guardian"
        Description = "Guardian Summary Cards - 4 key metrics"
        Wait        = 2
        Scroll      = 300
    },
    @{
        Name        = "06-beta-signup"
        Url         = "$BaseUrl/beta"
        Description = "Beta Signup Landing Page - 3 product features"
        Wait        = 2
    },
    @{
        Name        = "07-dark-mode-toggle"
        Url         = "$BaseUrl/global-insight"
        Description = "Dark Mode - Side-by-side comparison"
        Wait        = 2
        DarkMode    = $true
    },
    @{
        Name          = "08-export-options"
        Url           = "$BaseUrl/global-insight"
        Description   = "Export Dropdown - PDF/CSV download options"
        Wait          = 2
        ClickSelector = "[data-export-button]"
    },
    @{
        Name          = "09-project-filter"
        Url           = "$BaseUrl/global-insight"
        Description   = "Project Filter - Multi-select filtering"
        Wait          = 2
        ClickSelector = "[data-filter-button]"
    },
    @{
        Name        = "10-autopilot-cycle"
        Url         = "$BaseUrl/autopilot"
        Description = "Autopilot O-D-A-V-L Cycle Diagram"
        Wait        = 3
    }
)

# Start Chrome with remote debugging
$chromeArgs = @(
    "--remote-debugging-port=9222",
    "--start-maximized",
    "--window-size=$Width,$Height",
    "--disable-blink-features=AutomationControlled",
    "--disable-infobars"
)

try {
    Write-Host "🌐 Starting Chrome WebDriver..." -ForegroundColor Yellow
    $driver = Start-SeChrome -Arguments $chromeArgs
    
    # Set window size
    $driver.Manage().Window.Size = New-Object System.Drawing.Size($Width, $Height)
    
    foreach ($shot in $screenshots) {
        Write-Host ""
        Write-Host "📷 Capturing: $($shot.Name)" -ForegroundColor Green
        Write-Host "   URL: $($shot.Url)" -ForegroundColor Gray
        Write-Host "   Description: $($shot.Description)" -ForegroundColor Gray
        
        # Navigate
        $driver.Navigate().GoToUrl($shot.Url)
        Start-Sleep -Seconds $shot.Wait
        
        # Scroll if needed
        if ($shot.Scroll) {
            $driver.ExecuteScript("window.scrollTo(0, $($shot.Scroll))")
            Start-Sleep -Milliseconds 500
        }
        
        # Toggle dark mode if needed
        if ($shot.DarkMode) {
            $darkModeButton = $driver.FindElementByCssSelector("[data-theme-toggle]")
            if ($darkModeButton) {
                $darkModeButton.Click()
                Start-Sleep -Milliseconds 500
            }
        }
        
        # Click element if needed
        if ($shot.ClickSelector) {
            try {
                $element = $driver.FindElementByCssSelector($shot.ClickSelector)
                $element.Click()
                Start-Sleep -Milliseconds 500
            }
            catch {
                Write-Host "   ⚠️  Element not found: $($shot.ClickSelector)" -ForegroundColor Yellow
            }
        }
        
        # Take screenshot
        $outputPath = Join-Path $OutputDir "$($shot.Name).png"
        $screenshot = $driver.GetScreenshot()
        $screenshot.SaveAsFile($outputPath, [OpenQA.Selenium.ScreenshotImageFormat]::Png)
        
        # Get file size
        $fileSize = (Get-Item $outputPath).Length / 1KB
        Write-Host "   ✅ Saved: $outputPath ($([math]::Round($fileSize, 2)) KB)" -ForegroundColor Green
        
        # Optimize if over 500KB
        if ($fileSize -gt 500) {
            Write-Host "   📦 Compressing (over 500KB)..." -ForegroundColor Yellow
            # Note: Requires TinyPNG CLI or similar tool
            # For now, just warn
            Write-Host "   ⚠️  File size: $([math]::Round($fileSize, 2)) KB (recommend compressing with TinyPNG)" -ForegroundColor Yellow
        }
    }
    
    Write-Host ""
    Write-Host "═══════════════════════════════════════════════" -ForegroundColor Cyan
    Write-Host "✅ Screenshot Capture Complete!" -ForegroundColor Green
    Write-Host "═══════════════════════════════════════════════" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "📊 Summary:" -ForegroundColor Cyan
    Write-Host "   Screenshots: $($screenshots.Count)" -ForegroundColor White
    Write-Host "   Output: $OutputDir" -ForegroundColor White
    Write-Host ""
    Write-Host "🚀 Next Steps:" -ForegroundColor Cyan
    Write-Host "   1. Review screenshots in $OutputDir" -ForegroundColor White
    Write-Host "   2. Compress images > 500KB with TinyPNG" -ForegroundColor White
    Write-Host "   3. Upload to Product Hunt" -ForegroundColor White
    Write-Host ""
    
}
catch {
    Write-Host ""
    Write-Host "❌ Error: $_" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
}
finally {
    # Close browser
    if ($driver) {
        Write-Host "🛑 Closing browser..." -ForegroundColor Yellow
        $driver.Quit()
    }
}

Write-Host ""
Write-Host "📸 Screenshot capture session ended" -ForegroundColor Gray
