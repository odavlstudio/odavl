#!/usr/bin/env pwsh
# ODAVL KPI - Weekly Aggregation Script (PowerShell)
# Generates weekly KPI reports from events.ndjson with privacy-first defaults

param(
    [Parameter(HelpMessage="Week offset (0=current, 1=last week, etc.)")]
    [int]$WeekOffset = 0,
    [Parameter(HelpMessage="Output format: json, md, or both")]
    [ValidateSet("json", "md", "both")]
    [string]$OutputFormat = "both",
    [Parameter(HelpMessage="Display usage information")]
    [switch]$Help
)

# Configuration
$EventsFile = "reports/kpi/events.ndjson"
$WeeklyDir = "reports/kpi/weekly"
$TemplateFile = "reports/kpi/templates/weekly-template.md"

# Function to display usage
function Show-Usage {
    Write-Host "ODAVL Weekly KPI Aggregation - Privacy-First Reporting" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Usage: .\aggregate-weekly.ps1 [-WeekOffset NUM] [-OutputFormat FORMAT]" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Parameters:" -ForegroundColor Green
    Write-Host "  -WeekOffset NUM     Week offset (0=current, 1=last week, etc.)"
    Write-Host "  -OutputFormat STR   Output format: json, md, or both (default: both)"
    Write-Host ""
    Write-Host "Examples:" -ForegroundColor Yellow
    Write-Host "  .\aggregate-weekly.ps1                    # Current week, both formats"
    Write-Host "  .\aggregate-weekly.ps1 -WeekOffset 1      # Last week"
    Write-Host "  .\aggregate-weekly.ps1 -OutputFormat json # JSON only"
    Write-Host ""
    Write-Host "Privacy: All data processed locally, no external transmission" -ForegroundColor Magenta
}

if ($Help) {
    Show-Usage
    exit 0
}

# Calculate week dates using .NET DateTime
$CurrentDate = [DateTime]::UtcNow.Date
$DaysToSubtract = [int]$CurrentDate.DayOfWeek - 1 + (7 * $WeekOffset)  # Monday = start of week
if ($DaysToSubtract -lt 0) { $DaysToSubtract += 7 }
$WeekStartDate = $CurrentDate.AddDays(-$DaysToSubtract)
$WeekEndDate = $WeekStartDate.AddDays(6)
$WeekNumber = (Get-Culture).Calendar.GetWeekOfYear($WeekStartDate, "FirstFourDayWeek", "Monday")
$Year = $WeekStartDate.Year

Write-Host "📊 ODAVL Weekly KPI Aggregation" -ForegroundColor Cyan
Write-Host "📅 Week $WeekNumber $Year ($($WeekStartDate.ToString('yyyy-MM-dd')) to $($WeekEndDate.ToString('yyyy-MM-dd')))" -ForegroundColor Gray

# Ensure directories exist
if (-not (Test-Path $WeeklyDir)) {
    New-Item -ItemType Directory -Path $WeeklyDir -Force | Out-Null
}

# Check if events file exists
if (-not (Test-Path $EventsFile)) {
    Write-Host "⚠️ No events file found: $EventsFile" -ForegroundColor Yellow
    Write-Host "Run some KPI scripts first to generate events" -ForegroundColor Yellow
    exit 1
}

# Read and filter events for the target week
$WeekEvents = @()
$StartDateStr = $WeekStartDate.ToString("yyyy-MM-dd")
$EndDateStr = $WeekEndDate.ToString("yyyy-MM-dd") + "T23:59:59.999Z"

Get-Content $EventsFile | ForEach-Object {
    if ($_.Trim()) {
        try {
            $Event = $_ | ConvertFrom-Json
            $EventDate = [DateTime]::Parse($Event.timestamp)
            if ($EventDate -ge $WeekStartDate -and $EventDate -le $WeekEndDate.AddHours(23).AddMinutes(59).AddSeconds(59)) {
                $WeekEvents += $Event
            }
        } catch {
            Write-Warning "Failed to parse event: $_"
        }
    }
}

$TotalEvents = $WeekEvents.Count
Write-Host "📝 Found $TotalEvents events for this week" -ForegroundColor Gray

# Initialize metrics
$PlgExtensionInstalls = 0
$PlgFirstDoctorRuns = 0
$PlgFirstPrMerges = 0
$QualitySnapshots = 0
$PilotsStarted = 0
$PilotsConvertedPro = 0
$PilotsConvertedEnterprise = 0
$NpsResponses = 0
$NpsTotalScore = 0

# Count events by type
foreach ($Event in $WeekEvents) {
    switch ($Event.type) {
        "extension_installed" { $PlgExtensionInstalls++ }
        "first_doctor_run" { $PlgFirstDoctorRuns++ }
        "first_pr_merged" { $PlgFirstPrMerges++ }
        "quality_snapshot" { $QualitySnapshots++ }
        "pilot_started" { $PilotsStarted++ }
        "pilot_converted_pro" { $PilotsConvertedPro++ }
        "pilot_converted_enterprise" { $PilotsConvertedEnterprise++ }
        "nps_response" { 
            $NpsResponses++
            if ($Event.metrics -and $Event.metrics.score) {
                $NpsTotalScore += [int]$Event.metrics.score
            }
        }
    }
}

# Calculate derived metrics
$ActivationRate = if ($PlgExtensionInstalls -gt 0) { [math]::Round($PlgFirstDoctorRuns * 100.0 / $PlgExtensionInstalls, 1) } else { 0 }
$ConversionRate = if ($PlgFirstDoctorRuns -gt 0) { [math]::Round($PlgFirstPrMerges * 100.0 / $PlgFirstDoctorRuns, 1) } else { 0 }

# Calculate NPS
$NpsAverage = if ($NpsResponses -gt 0) { [math]::Round($NpsTotalScore / $NpsResponses, 1) } else { 0 }
$NpsPromoters = 0
$NpsPassives = 0
$NpsDetractors = 0
$NpsScore = 0

if ($NpsResponses -gt 0) {
    foreach ($Event in $WeekEvents) {
        if ($Event.type -eq "nps_response" -and $Event.metrics -and $Event.metrics.score) {
            $Score = [int]$Event.metrics.score
            if ($Score -ge 9) { $NpsPromoters++ }
            elseif ($Score -ge 7) { $NpsPassives++ }
            else { $NpsDetractors++ }
        }
    }
    
    $PromotersPct = [math]::Round($NpsPromoters * 100.0 / $NpsResponses, 1)
    $DetractorsPct = [math]::Round($NpsDetractors * 100.0 / $NpsResponses, 1)
    $NpsScore = [math]::Round($PromotersPct - $DetractorsPct, 0)
}

# Build report object
$Report = @{
    week = @{
        number = $WeekNumber
        year = $Year
        start_date = $WeekStartDate.ToString("yyyy-MM-dd")
        end_date = $WeekEndDate.ToString("yyyy-MM-dd")
    }
    generation = @{
        timestamp = [DateTime]::UtcNow.ToString("yyyy-MM-ddTHH:mm:ss.fffZ")
        total_events = $TotalEvents
    }
    plg = @{
        extension_installs = $PlgExtensionInstalls
        first_doctor_runs = $PlgFirstDoctorRuns
        first_pr_merges = $PlgFirstPrMerges
        activation_rate_pct = $ActivationRate
        conversion_rate_pct = $ConversionRate
    }
    quality = @{
        snapshots_count = $QualitySnapshots
    }
    sales = @{
        pilots_started = $PilotsStarted
        pilots_converted_pro = $PilotsConvertedPro
        pilots_converted_enterprise = $PilotsConvertedEnterprise
    }
    nps = @{
        responses = $NpsResponses
        average_score = $NpsAverage
        nps_score = $NpsScore
        promoters = $NpsPromoters
        passives = $NpsPassives
        detractors = $NpsDetractors
    }
}

# Output files
$JsonFile = Join-Path $WeeklyDir "$Year-$($WeekNumber.ToString('00')).json"
$MdFile = Join-Path $WeeklyDir "$Year-$($WeekNumber.ToString('00')).md"

# Save JSON report
if ($OutputFormat -eq "json" -or $OutputFormat -eq "both") {
    $Report | ConvertTo-Json -Depth 4 | Out-File -FilePath $JsonFile -Encoding UTF8
    Write-Host "📄 JSON report saved: $JsonFile" -ForegroundColor Green
}

# Generate Markdown report if template exists
if ($OutputFormat -eq "md" -or $OutputFormat -eq "both") {
    if (Test-Path $TemplateFile) {
        $TemplateContent = Get-Content $TemplateFile -Raw
        
        # Simple template substitution
        $MdContent = $TemplateContent `
            -replace '\{WEEK_NUMBER\}', $WeekNumber `
            -replace '\{YEAR\}', $Year `
            -replace '\{START_DATE\}', $WeekStartDate.ToString("yyyy-MM-dd") `
            -replace '\{END_DATE\}', $WeekEndDate.ToString("yyyy-MM-dd") `
            -replace '\{GENERATION_TIMESTAMP\}', (Get-Date -Format "yyyy-MM-dd HH:mm:ss UTC") `
            -replace '\{OPT_IN_STATUS\}', $(if ($env:KPI_OPT_IN -eq "true") { "enabled" } else { "disabled" }) `
            -replace '\{EXTENSION_INSTALLS\}', $PlgExtensionInstalls `
            -replace '\{FIRST_DOCTOR_RUNS\}', $PlgFirstDoctorRuns `
            -replace '\{FIRST_PR_MERGES\}', $PlgFirstPrMerges `
            -replace '\{ACTIVATION_RATE_PCT\}', $ActivationRate `
            -replace '\{CONVERSION_RATE_PCT\}', $ConversionRate `
            -replace '\{PILOTS_STARTED\}', $PilotsStarted `
            -replace '\{PILOTS_CONVERTED_PRO\}', $PilotsConvertedPro `
            -replace '\{PILOTS_CONVERTED_ENTERPRISE\}', $PilotsConvertedEnterprise `
            -replace '\{NPS_RESPONSES\}', $NpsResponses `
            -replace '\{NPS_AVERAGE\}', $NpsAverage `
            -replace '\{NPS_SCORE\}', $NpsScore `
            -replace '\{NPS_PROMOTERS\}', $NpsPromoters `
            -replace '\{NPS_PASSIVES\}', $NpsPassives `
            -replace '\{NPS_DETRACTORS\}', $NpsDetractors `
            -replace '\{TOTAL_EVENTS_COUNT\}', $TotalEvents
        
        $MdContent | Out-File -FilePath $MdFile -Encoding UTF8
        Write-Host "📄 Markdown report saved: $MdFile" -ForegroundColor Green
    } else {
        Write-Host "⚠️ Template file not found: $TemplateFile" -ForegroundColor Yellow
    }
}

# Display summary
Write-Host ""
Write-Host "📈 Week $WeekNumber $Year Summary:" -ForegroundColor Cyan
Write-Host "  PLG: $PlgExtensionInstalls installs → $PlgFirstDoctorRuns runs → $PlgFirstPrMerges PRs" -ForegroundColor White
Write-Host "  Quality: $QualitySnapshots snapshots" -ForegroundColor White
Write-Host "  Sales: $PilotsStarted pilots, $PilotsConvertedPro Pro, $PilotsConvertedEnterprise Enterprise" -ForegroundColor White
Write-Host "  NPS: $NpsAverage avg ($NpsResponses responses)" -ForegroundColor White

Write-Host ""
Write-Host "✅ Weekly aggregation complete" -ForegroundColor Green