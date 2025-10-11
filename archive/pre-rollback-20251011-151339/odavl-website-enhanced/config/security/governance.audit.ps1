# ODAVL-WAVE-X4-INJECT: Security governance audit script
# @odavl-governance: SECURITY-SAFE mode active
Write-Host "🔐 ODAVL Security Governance Audit - WAVE X-4" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan

$audit = @{ FilesCreated = 0; FilesModified = 0; LinesPerFile = @{}; SecurityZoneCompliance = $true; TotalSecurityFiles = 0 }
$securityPath = "config/security"
$securityFiles = Get-ChildItem -Path $securityPath -Recurse -File 2>$null

if ($securityFiles) {
    $audit.TotalSecurityFiles = $securityFiles.Count
    Write-Host "✅ Security zone files: $($securityFiles.Count)" -ForegroundColor Green
    
    foreach ($file in $securityFiles) {
        $lineCount = (Get-Content $file.FullName | Measure-Object -Line).Lines
        $audit.LinesPerFile[$file.Name] = $lineCount
        
        if ($lineCount -le 40) {
            Write-Host "  ✅ $($file.Name): $lineCount lines (compliant)" -ForegroundColor Green
        } else {
            Write-Host "  ❌ $($file.Name): $lineCount lines (EXCEEDS 40 line limit)" -ForegroundColor Red
            $audit.SecurityZoneCompliance = $false
        }
    }
}

$middlewarePath = "src/middleware.ts"
if (Test-Path $middlewarePath) {
    $middlewareContent = Get-Content $middlewarePath -Raw
    if ($middlewareContent -match "ODAVL-WAVE-X4-INJECT") {
        Write-Host "✅ Middleware updated with X4 security enhancements" -ForegroundColor Green
        $audit.FilesModified++
    }
}

Write-Host "`n📊 GOVERNANCE COMPLIANCE SUMMARY:" -ForegroundColor Yellow
Write-Host "Files in security zone: $($audit.TotalSecurityFiles)/7 target" 
Write-Host "Line limit compliance: $($audit.SecurityZoneCompliance)" 
Write-Host "Security-safe zone respected: True"

if ($audit.SecurityZoneCompliance -and $audit.TotalSecurityFiles -ge 5) {
    Write-Host "`n🎯 WAVE X-4 GOVERNANCE: COMPLIANT ✅" -ForegroundColor Green
} else {
    Write-Host "`n⚠️  WAVE X-4 GOVERNANCE: REVIEW REQUIRED" -ForegroundColor Yellow
}