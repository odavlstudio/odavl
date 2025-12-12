# Test Full Mode O→D→A→V→L cycle
$body = '{"workspaceRoot":"C:/Users/sabou/dev/odavl","mode":"full","maxFiles":5}'

Write-Host "`n════════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "🤖 FULL MODE TEST - O→D→A→V→L Cycle" -ForegroundColor Cyan
Write-Host "════════════════════════════════════════════════════════════════`n" -ForegroundColor Cyan

try {
    $response = Invoke-RestMethod -Method POST -Uri "http://localhost:3007/api/fix" -ContentType "application/json" -Body $body
    
    Write-Host "✅ Full Mode cycle completed!`n" -ForegroundColor Green
    
    # Extract phases
    $observe = $response.observe
    $decide = $response.decide
    $act = $response.act
    $verify = $response.verify
    $learn = $response.learn
    
    Write-Host "═══ OBSERVE PHASE ═══" -ForegroundColor Yellow
    Write-Host "  Issues Found: $($observe.issueCount)" -ForegroundColor White
    Write-Host "  Detectors: $($observe.detectors -join ', ')" -ForegroundColor White
    Write-Host "  Duration: $($observe.duration)ms`n" -ForegroundColor White
    
    Write-Host "═══ DECIDE PHASE ═══" -ForegroundColor Yellow
    Write-Host "  Recipe ID: $($decide.recipeId)" -ForegroundColor White
    Write-Host "  Trust Score: $($decide.trustScore)" -ForegroundColor White
    Write-Host "  Confidence: $($decide.confidence)" -ForegroundColor White
    Write-Host "  Reason: $($decide.reason)`n" -ForegroundColor White
    
    Write-Host "═══ ACT PHASE ═══" -ForegroundColor Yellow
    Write-Host "  Files Modified: $($act.filesModified)" -ForegroundColor White
    Write-Host "  LOC Changed: $($act.locChanged)" -ForegroundColor White
    Write-Host "  Snapshot: $($act.snapshotPath)" -ForegroundColor White
    Write-Host "  Risk Budget OK: $($act.riskBudgetOk)`n" -ForegroundColor White
    
    Write-Host "═══ VERIFY PHASE ═══" -ForegroundColor Yellow
    Write-Host "  Status: $($verify.status)" -ForegroundColor $(if ($verify.status -eq 'passed') { 'Green' } else { 'Red' })
    Write-Host "  Gates Passed: $($verify.gatesPassed)" -ForegroundColor White
    Write-Host "  Before Errors: $($verify.beforeErrors)" -ForegroundColor White
    Write-Host "  After Errors: $($verify.afterErrors)" -ForegroundColor White
    Write-Host "  Attestation: $($verify.attestationHash)`n" -ForegroundColor White
    
    Write-Host "═══ LEARN PHASE ═══" -ForegroundColor Yellow
    Write-Host "  New Trust Score: $($learn.newTrustScore)" -ForegroundColor White
    Write-Host "  Blacklisted: $($learn.blacklisted)" -ForegroundColor White
    Write-Host "  History Updated: $($learn.historyUpdated)`n" -ForegroundColor White
    
    Write-Host "`n📝 FULL JSON RESPONSE:`n" -ForegroundColor Magenta
    $response | ConvertTo-Json -Depth 10
    
} catch {
    Write-Host "❌ Full Mode cycle failed!" -ForegroundColor Red
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "Stack: $($_.ScriptStackTrace)" -ForegroundColor Red
    exit 1
}
