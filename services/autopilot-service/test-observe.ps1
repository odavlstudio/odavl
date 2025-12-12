# Test OBSERVE endpoint with real InsightCore detectors
$body = '{"workspaceRoot":"C:/Users/sabou/dev/odavl"}'

Write-Host "`n════════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "🔍 OBSERVE TEST - Real InsightCore Detectors" -ForegroundColor Cyan
Write-Host "════════════════════════════════════════════════════════════════`n" -ForegroundColor Cyan

try {
    $response = Invoke-RestMethod -Method POST -Uri "http://localhost:3007/api/observe" -ContentType "application/json" -Body $body
    
    Write-Host "✅ OBSERVE completed successfully!`n" -ForegroundColor Green
    
    # Extract key metrics
    $totalIssues = $response.issues.Count
    $metadata = $response.metadata
    $detectorResults = $metadata.detectorResults
    
    Write-Host "📊 OBSERVE METRICS:" -ForegroundColor Yellow
    Write-Host "  Total Issues: $totalIssues" -ForegroundColor White
    Write-Host "  Scanned Files: $($metadata.scannedFiles)" -ForegroundColor White
    Write-Host "  Timestamp: $($metadata.timestamp)" -ForegroundColor White
    Write-Host ""
    
    Write-Host "🔎 DETECTOR BREAKDOWN:" -ForegroundColor Yellow
    foreach ($detector in $detectorResults.PSObject.Properties) {
        $name = $detector.Name
        $count = $detector.Value
        Write-Host "  - $name : $count issues" -ForegroundColor White
    }
    
    Write-Host "`n📝 FULL JSON RESPONSE:`n" -ForegroundColor Magenta
    $response | ConvertTo-Json -Depth 10
    
} catch {
    Write-Host "❌ OBSERVE failed!" -ForegroundColor Red
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "Stack: $($_.ScriptStackTrace)" -ForegroundColor Red
    exit 1
}
