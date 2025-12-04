#!/usr/bin/env pwsh
# Test Guardian Dashboard

Write-Host "`n🧪 Testing Guardian Dashboard..." -ForegroundColor Cyan

# Navigate to CLI directory
Set-Location "odavl-studio/guardian/cli"

# Simulate user input: 1 (extension), 6 (dashboard), 8 (exit)
$input = @"
1
6
8
"@

$input | node dist/guardian.js

Write-Host "`n✅ Dashboard test complete!" -ForegroundColor Green
