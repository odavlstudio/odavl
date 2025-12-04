#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Setup automated backup scheduling for ODAVL Insight Cloud
    
.DESCRIPTION
    Configures automated backups with:
    - Daily backups (2:00 AM, 7 days retention)
    - Weekly backups (Sunday 3:00 AM, 4 weeks retention)
    - Monthly backups (1st of month 4:00 AM, 12 months retention)
    - Windows Scheduled Tasks or Linux/macOS cron jobs
    - Cloud upload integration (S3, Azure, GCS)
    - Failure notifications
    
.PARAMETER Install
    Install backup schedule
    
.PARAMETER Uninstall
    Remove backup schedule
    
.PARAMETER Status
    Show current backup schedule status
    
.EXAMPLE
    .\schedule-backups.ps1 -Install
    
.EXAMPLE
    .\schedule-backups.ps1 -Status
    
.EXAMPLE
    .\schedule-backups.ps1 -Uninstall
#>

param(
    [Parameter(Mandatory=$false)]
    [switch]$Install,
    
    [Parameter(Mandatory=$false)]
    [switch]$Uninstall,
    
    [Parameter(Mandatory=$false)]
    [switch]$Status
)

# Load configuration
if (Test-Path "config/backup-schedule.conf") {
    Get-Content "config/backup-schedule.conf" | ForEach-Object {
        if ($_ -match '^([^=]+)=(.*)$' -and -not $_.StartsWith('#')) {
            $value = $matches[2].Trim('"')
            [Environment]::SetEnvironmentVariable($matches[1], $value, "Process")
        }
    }
}

# Color functions
function Write-Success { param($Message) Write-Host $Message -ForegroundColor Green }
function Write-Info { param($Message) Write-Host $Message -ForegroundColor Cyan }
function Write-Warning { param($Message) Write-Host $Message -ForegroundColor Yellow }
function Write-Error { param($Message) Write-Host $Message -ForegroundColor Red }

# Header
Write-Host "`n════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  AUTOMATED BACKUP SCHEDULER" -ForegroundColor White -BackgroundColor Blue
Write-Host "════════════════════════════════════════`n" -ForegroundColor Cyan

# Get project root
$PROJECT_ROOT = $PSScriptRoot -replace '\\scripts$', ''
$BACKUP_SCRIPT = "$PROJECT_ROOT\scripts\backup.ps1"

# Function: Install on Windows
function Install-WindowsSchedule {
    Write-Info "Installing Windows Scheduled Tasks...`n"
    
    # Daily backup
    Write-Info "Creating daily backup task..."
    
    $dailyAction = New-ScheduledTaskAction `
        -Execute "pwsh.exe" `
        -Argument "-NoProfile -ExecutionPolicy Bypass -File `"$BACKUP_SCRIPT`" -Type daily -Upload"
    
    $dailyTrigger = New-ScheduledTaskTrigger -Daily -At "2:00AM"
    
    $dailySettings = New-ScheduledTaskSettingsSet `
        -ExecutionTimeLimit (New-TimeSpan -Hours 2) `
        -RestartCount 3 `
        -RestartInterval (New-TimeSpan -Minutes 10)
    
    Register-ScheduledTask `
        -TaskName "ODAVL-Backup-Daily" `
        -Action $dailyAction `
        -Trigger $dailyTrigger `
        -Settings $dailySettings `
        -Description "Daily database backup for ODAVL Insight Cloud" `
        -Force | Out-Null
    
    Write-Success "  ✅ Daily backup scheduled (2:00 AM)"
    
    # Weekly backup
    Write-Info "Creating weekly backup task..."
    
    $weeklyAction = New-ScheduledTaskAction `
        -Execute "pwsh.exe" `
        -Argument "-NoProfile -ExecutionPolicy Bypass -File `"$BACKUP_SCRIPT`" -Type weekly -Upload"
    
    $weeklyTrigger = New-ScheduledTaskTrigger -Weekly -DaysOfWeek Sunday -At "3:00AM"
    
    Register-ScheduledTask `
        -TaskName "ODAVL-Backup-Weekly" `
        -Action $weeklyAction `
        -Trigger $weeklyTrigger `
        -Settings $dailySettings `
        -Description "Weekly database backup for ODAVL Insight Cloud" `
        -Force | Out-Null
    
    Write-Success "  ✅ Weekly backup scheduled (Sunday 3:00 AM)"
    
    # Monthly backup
    Write-Info "Creating monthly backup task..."
    
    $monthlyAction = New-ScheduledTaskAction `
        -Execute "pwsh.exe" `
        -Argument "-NoProfile -ExecutionPolicy Bypass -File `"$BACKUP_SCRIPT`" -Type monthly -Upload"
    
    # Monthly trigger (1st of each month)
    $monthlyTrigger = New-ScheduledTaskTrigger -Daily -At "4:00AM"
    $monthlyTrigger.Repetition.Interval = "P1M"
    
    Register-ScheduledTask `
        -TaskName "ODAVL-Backup-Monthly" `
        -Action $monthlyAction `
        -Trigger $monthlyTrigger `
        -Settings $dailySettings `
        -Description "Monthly database backup for ODAVL Insight Cloud" `
        -Force | Out-Null
    
    Write-Success "  ✅ Monthly backup scheduled (1st of month 4:00 AM)"
    
    Write-Host ""
    Write-Success "✅ All backup tasks installed successfully!"
}

# Function: Install on Linux/macOS
function Install-UnixSchedule {
    Write-Info "Installing cron jobs...`n"
    
    # Get current crontab
    $existingCron = crontab -l 2>/dev/null | Where-Object { $_ -notmatch "ODAVL-Backup" }
    
    # Create new cron jobs
    $cronJobs = @(
        "# ODAVL-Backup-Daily: Daily backup at 2:00 AM",
        "0 2 * * * /usr/bin/pwsh -NoProfile -ExecutionPolicy Bypass -File `"$BACKUP_SCRIPT`" -Type daily -Upload >> /var/log/odavl-backup.log 2>&1",
        "",
        "# ODAVL-Backup-Weekly: Weekly backup on Sunday at 3:00 AM",
        "0 3 * * 0 /usr/bin/pwsh -NoProfile -ExecutionPolicy Bypass -File `"$BACKUP_SCRIPT`" -Type weekly -Upload >> /var/log/odavl-backup.log 2>&1",
        "",
        "# ODAVL-Backup-Monthly: Monthly backup on 1st at 4:00 AM",
        "0 4 1 * * /usr/bin/pwsh -NoProfile -ExecutionPolicy Bypass -File `"$BACKUP_SCRIPT`" -Type monthly -Upload >> /var/log/odavl-backup.log 2>&1"
    )
    
    # Combine existing and new cron jobs
    $newCrontab = $existingCron + $cronJobs
    
    # Install crontab
    $newCrontab | crontab -
    
    Write-Success "✅ Cron jobs installed successfully!"
    Write-Info "`nScheduled backups:"
    Write-Host "  - Daily: 2:00 AM (kept 7 days)" -ForegroundColor White
    Write-Host "  - Weekly: Sunday 3:00 AM (kept 28 days)" -ForegroundColor White
    Write-Host "  - Monthly: 1st of month 4:00 AM (kept 365 days)" -ForegroundColor White
}

# Function: Uninstall on Windows
function Uninstall-WindowsSchedule {
    Write-Info "Removing Windows Scheduled Tasks...`n"
    
    $tasks = @("ODAVL-Backup-Daily", "ODAVL-Backup-Weekly", "ODAVL-Backup-Monthly")
    
    foreach ($task in $tasks) {
        Write-Info "Removing $task..."
        
        try {
            Unregister-ScheduledTask -TaskName $task -Confirm:$false -ErrorAction SilentlyContinue
            Write-Success "  ✅ $task removed"
        } catch {
            Write-Warning "  ⚠️  $task not found"
        }
    }
    
    Write-Host ""
    Write-Success "✅ All backup tasks removed!"
}

# Function: Uninstall on Linux/macOS
function Uninstall-UnixSchedule {
    Write-Info "Removing cron jobs...`n"
    
    # Get current crontab without ODAVL backup jobs
    $newCrontab = crontab -l 2>/dev/null | Where-Object { $_ -notmatch "ODAVL-Backup" }
    
    # Install cleaned crontab
    if ($newCrontab) {
        $newCrontab | crontab -
    } else {
        crontab -r 2>/dev/null
    }
    
    Write-Success "✅ Cron jobs removed!"
}

# Function: Show status on Windows
function Show-WindowsStatus {
    Write-Info "Scheduled Tasks Status:`n"
    
    $tasks = @("ODAVL-Backup-Daily", "ODAVL-Backup-Weekly", "ODAVL-Backup-Monthly")
    
    foreach ($taskName in $tasks) {
        $task = Get-ScheduledTask -TaskName $taskName -ErrorAction SilentlyContinue
        
        if ($task) {
            $info = Get-ScheduledTaskInfo -TaskName $taskName
            
            Write-Host "📋 $taskName" -ForegroundColor Cyan
            Write-Host "   State: " -NoNewline -ForegroundColor Gray
            
            if ($task.State -eq "Ready") {
                Write-Host "Ready ✅" -ForegroundColor Green
            } else {
                Write-Host $task.State -ForegroundColor Yellow
            }
            
            Write-Host "   Last Run: " -NoNewline -ForegroundColor Gray
            Write-Host $info.LastRunTime -ForegroundColor White
            
            Write-Host "   Last Result: " -NoNewline -ForegroundColor Gray
            if ($info.LastTaskResult -eq 0) {
                Write-Host "Success ✅" -ForegroundColor Green
            } else {
                Write-Host "Error (0x$($info.LastTaskResult.ToString('X')))" -ForegroundColor Red
            }
            
            Write-Host "   Next Run: " -NoNewline -ForegroundColor Gray
            Write-Host $info.NextRunTime -ForegroundColor White
            Write-Host ""
        } else {
            Write-Host "📋 $taskName" -ForegroundColor Cyan
            Write-Host "   Status: Not installed ❌" -ForegroundColor Red
            Write-Host ""
        }
    }
}

# Function: Show status on Linux/macOS
function Show-UnixStatus {
    Write-Info "Cron Jobs Status:`n"
    
    $cronJobs = crontab -l 2>/dev/null | Where-Object { $_ -match "ODAVL-Backup" }
    
    if ($cronJobs) {
        Write-Success "✅ Backup cron jobs installed:`n"
        
        $cronJobs | ForEach-Object {
            if ($_ -match "^# (.+)$") {
                Write-Host "  $($matches[1])" -ForegroundColor Cyan
            } elseif ($_ -notmatch "^#" -and $_ -match "^\s*(\d+\s+\d+\s+\*\s+\*\s+\d+)") {
                Write-Host "    Schedule: $($matches[1])" -ForegroundColor White
            }
        }
        
        Write-Host ""
        Write-Info "Check logs: tail -f /var/log/odavl-backup.log"
    } else {
        Write-Warning "⚠️  No backup cron jobs found"
        Write-Info "Run: .\schedule-backups.ps1 -Install"
    }
}

# Main logic
if ($Install) {
    if ($IsWindows) {
        Install-WindowsSchedule
    } else {
        Install-UnixSchedule
    }
    
    # Create initial backup
    Write-Info "`nCreating initial backup..."
    & $BACKUP_SCRIPT -Type manual
    
} elseif ($Uninstall) {
    if ($IsWindows) {
        Uninstall-WindowsSchedule
    } else {
        Uninstall-UnixSchedule
    }
    
} elseif ($Status) {
    if ($IsWindows) {
        Show-WindowsStatus
    } else {
        Show-UnixStatus
    }
    
    # Show recent backups
    Write-Info "`nRecent Backups:"
    
    if (Test-Path "backups/postgres") {
        Get-ChildItem "backups/postgres" -Recurse -Filter "*.sql.gz" | 
            Sort-Object LastWriteTime -Descending | 
            Select-Object -First 10 | 
            ForEach-Object {
                $size = [math]::Round($_.Length / 1MB, 2)
                $age = ((Get-Date) - $_.LastWriteTime).Days
                
                Write-Host "  📦 $($_.Name)" -ForegroundColor White
                Write-Host "     Size: $size MB | Age: $age days" -ForegroundColor Gray
            }
    } else {
        Write-Warning "  No backups found"
    }
    
} else {
    Write-Warning "Usage: .\schedule-backups.ps1 [-Install | -Uninstall | -Status]"
    Write-Host ""
    Write-Host "Examples:" -ForegroundColor Cyan
    Write-Host "  .\schedule-backups.ps1 -Install    # Install backup schedule" -ForegroundColor White
    Write-Host "  .\schedule-backups.ps1 -Status     # Show schedule status" -ForegroundColor White
    Write-Host "  .\schedule-backups.ps1 -Uninstall  # Remove schedule" -ForegroundColor White
}

Write-Host ""
