#!/usr/bin/env pwsh
# ODAVL KPI - Event Recording Script (PowerShell)
# Records KPI events to local NDJSON file with privacy-first defaults

param(
    [Parameter(HelpMessage="Event type (extension_installed, first_doctor_run, etc.)")]
    [string]$Type = "",
    [Parameter(HelpMessage="Repository path or identifier")]
    [string]$Repo = "",
    [Parameter(HelpMessage="Human-readable context or description")]
    [string]$Notes = "",
    [Parameter(HelpMessage="Event-specific data as JSON string")]
    [string]$Metrics = "",
    [Parameter(HelpMessage="Display usage information")]
    [switch]$Help
)

# Configuration
$EventsFile = "reports/kpi/events.ndjson"
$ScriptVersion = "1.0"

# Function to display usage
function Show-Usage {
    Write-Host "ODAVL KPI Event Recording - Privacy-First Local Tracking" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Usage: .\record-event.ps1 -Type EVENT_TYPE -Repo REPO_PATH [-Notes NOTES] [-Metrics JSON]" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Required Parameters:" -ForegroundColor Green
    Write-Host "  -Type TYPE      Event type (extension_installed, first_doctor_run, etc.)"
    Write-Host "  -Repo REPO      Repository path or identifier"
    Write-Host ""
    Write-Host "Optional Parameters:" -ForegroundColor Green
    Write-Host "  -Notes TEXT     Human-readable context or description"
    Write-Host "  -Metrics JSON   Event-specific data as JSON object"
    Write-Host ""
    Write-Host "Examples:" -ForegroundColor Yellow
    Write-Host "  .\record-event.ps1 -Type extension_installed -Repo /dev/myproject -Notes `"First install`""
    Write-Host "  .\record-event.ps1 -Type quality_snapshot -Repo /dev/myproject -Metrics '{`"eslint_total`":15,`"ts_errors_total`":3}'"
    Write-Host "  .\record-event.ps1 -Type nps_response -Repo /dev/client -Notes `"Survey`" -Metrics '{`"score`":9,`"feedback`":`"Great tool!`"}'"
    Write-Host ""
    Write-Host "Privacy: All data stored locally in $EventsFile" -ForegroundColor Magenta
    Write-Host "Opt-in: Set `$env:KPI_OPT_IN=`"true`" to enable optional external sharing" -ForegroundColor Magenta
}

# Show usage if requested or no parameters
if ($Help -or ($Type -eq "" -and $Repo -eq "")) {
    Show-Usage
    exit 0
}

# Validate required parameters
if ($Type -eq "") {
    Write-Host "❌ Error: -Type parameter is required" -ForegroundColor Red
    Show-Usage
    exit 1
}

if ($Repo -eq "") {
    Write-Host "❌ Error: -Repo parameter is required" -ForegroundColor Red
    Show-Usage
    exit 1
}

# Validate event type
$ValidTypes = @(
    "extension_installed",
    "first_doctor_run", 
    "first_pr_merged",
    "quality_snapshot",
    "pilot_started",
    "pilot_converted_pro",
    "pilot_converted_enterprise",
    "nps_response"
)

if ($Type -notin $ValidTypes) {
    Write-Host "❌ Error: Invalid event type '$Type'" -ForegroundColor Red
    Write-Host "Valid types: $($ValidTypes -join ', ')" -ForegroundColor Yellow
    exit 1
}

# Validate metrics JSON if provided
if ($Metrics -ne "") {
    try {
        $null = $Metrics | ConvertFrom-Json
    } catch {
        Write-Host "❌ Error: Invalid JSON in -Metrics parameter" -ForegroundColor Red
        Write-Host "Provided: $Metrics" -ForegroundColor Yellow
        exit 1
    }
}

# Ensure events directory exists
$EventsDir = Split-Path $EventsFile -Parent
if (-not (Test-Path $EventsDir)) {
    New-Item -ItemType Directory -Path $EventsDir -Force | Out-Null
}

# Generate timestamp
$Timestamp = (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ss.fffZ")

# Build event object
$Event = @{
    timestamp = $Timestamp
    actor = "manual"
    type = $Type
    repo = $Repo
}

if ($Notes -ne "") {
    $Event.notes = $Notes
}

if ($Metrics -ne "") {
    $Event.metrics = $Metrics | ConvertFrom-Json
}

# Convert to JSON and append to file
$EventJson = $Event | ConvertTo-Json -Compress -Depth 10
Add-Content -Path $EventsFile -Value $EventJson -Encoding UTF8

# Display confirmation
Write-Host "✅ Event recorded successfully" -ForegroundColor Green
Write-Host "📝 Type: $Type" -ForegroundColor Cyan
Write-Host "📁 Repo: $Repo" -ForegroundColor Cyan
if ($Notes -ne "") {
    Write-Host "💬 Notes: $Notes" -ForegroundColor Cyan
}
if ($Metrics -ne "") {
    Write-Host "📊 Metrics: $Metrics" -ForegroundColor Cyan
}
Write-Host "🕐 Timestamp: $Timestamp" -ForegroundColor Cyan
Write-Host "📄 Stored in: $EventsFile" -ForegroundColor Cyan

# Privacy reminder
if ($env:KPI_OPT_IN -ne "true") {
    Write-Host ""
    Write-Host "🔒 Privacy: Data stored locally only" -ForegroundColor Magenta
    Write-Host "   Set `$env:KPI_OPT_IN=`"true`" to enable optional external sharing" -ForegroundColor Magenta
}