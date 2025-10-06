# Safe Retry Script for VSCE Commands
# Usage: .\retry-vsce.ps1 "show odavl" or .\retry-vsce.ps1 "publish"

param([string]$Command = "show odavl")

$MaxAttempts = 5
$Delays = @(5, 10, 20, 30, 45)
$Timestamp = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"
$LogFile = "reports/connectivity/vsce-retry-$Timestamp.log"

Write-Host "🔄 Starting safe retry for: npx vsce $Command" -ForegroundColor Cyan
"=== VSCE Retry Log - $(Get-Date) ===" | Out-File $LogFile

for ($i = 0; $i -lt $MaxAttempts; $i++) {
    $attempt = $i + 1
    Write-Host "⏳ Attempt $attempt/$MaxAttempts..." -ForegroundColor Yellow
    "--- Attempt $attempt at $(Get-Date) ---" | Out-File $LogFile -Append
    
    $output = npx vsce $Command 2>&1
    $exitCode = $LASTEXITCODE
    
    $output | Out-File $LogFile -Append
    "Exit Code: $exitCode" | Out-File $LogFile -Append
    
    if ($exitCode -eq 0) {
        Write-Host "✅ SUCCESS on attempt $attempt!" -ForegroundColor Green
        $output
        "=== SUCCESS on attempt $attempt ===" | Out-File $LogFile -Append
        exit 0
    }
    
    $errorText = $output -join " "
    if ($errorText -match "ECONNRESET|ESOCKETTIMEDOUT|ENOTFOUND") {
        if ($i -lt ($MaxAttempts - 1)) {
            $delay = $Delays[$i]
            Write-Host "⚠️ Network error detected. Retrying in $delay seconds..." -ForegroundColor Yellow
            "Network error - retrying in $delay seconds" | Out-File $LogFile -Append
            Start-Sleep -Seconds $delay
        }
    } else {
        Write-Host "❌ Non-network error - stopping retries" -ForegroundColor Red
        "Non-network error - stopping retries" | Out-File $LogFile -Append
        break
    }
}

Write-Host "❌ All attempts failed" -ForegroundColor Red
"=== ALL ATTEMPTS FAILED ===" | Out-File $LogFile -Append
exit 1