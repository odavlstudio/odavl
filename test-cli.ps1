# Test ODAVL Insight CLI
# Select workspace 2 (apps/studio-hub)

Write-Host "Testing ODAVL Insight CLI..." -ForegroundColor Cyan
Write-Host ""

# Send "2" to select apps/studio-hub
"2" | pnpm odavl:insight
