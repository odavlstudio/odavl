#!/usr/bin/env pwsh
# Autopilot Service Startup Script

Write-Host "`n🚀 Starting Autopilot Service...`n" -ForegroundColor Cyan

Set-Location "C:\Users\sabou\dev\odavl\services\autopilot-service"

npx tsx src/server.ts
