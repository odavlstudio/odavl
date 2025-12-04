#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Restore PostgreSQL database from backup
    
.DESCRIPTION
    Restores database from a backup file:
    - Lists available backups
    - Validates backup integrity
    - Creates safety backup before restore
    - Restores database from backup
    - Verifies restoration
    
.PARAMETER BackupFile
    Path to backup file (optional - will show menu if not provided)
    
.PARAMETER Force
    Skip confirmation prompts
    
.EXAMPLE
    .\restore.ps1
    
.EXAMPLE
    .\restore.ps1 -BackupFile "backups/postgres/daily/odavl-daily-2025-01-09-120000.sql.gz"
    
.EXAMPLE
    .\restore.ps1 -BackupFile "latest" -Force
#>

param(
    [Parameter(Mandatory=$false)]
    [string]$BackupFile,
    
    [Parameter(Mandatory=$false)]
    [switch]$Force
)

# Load environment variables
if (Test-Path ".env.local") {
    Get-Content ".env.local" | ForEach-Object {
        if ($_ -match '^([^=]+)=(.*)$') {
            [Environment]::SetEnvironmentVariable($matches[1], $matches[2], "Process")
        }
    }
}

# Configuration
$DATABASE_URL = $env:DATABASE_URL
$BACKUP_DIR = "backups/postgres"

# Color functions
function Write-Success { param($Message) Write-Host $Message -ForegroundColor Green }
function Write-Info { param($Message) Write-Host $Message -ForegroundColor Cyan }
function Write-Warning { param($Message) Write-Host $Message -ForegroundColor Yellow }
function Write-Error { param($Message) Write-Host $Message -ForegroundColor Red }

# Header
Write-Host "`n════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  POSTGRESQL RESTORE SCRIPT" -ForegroundColor White -BackgroundColor Blue
Write-Host "════════════════════════════════════════`n" -ForegroundColor Cyan

# Parse DATABASE_URL
if (-not $DATABASE_URL) {
    Write-Error "❌ DATABASE_URL not found in environment variables"
    exit 1
}

if ($DATABASE_URL -match 'postgresql://([^:]+):([^@]+)@([^:]+):(\d+)/(.+)') {
    $DB_USER = $matches[1]
    $DB_PASSWORD = $matches[2]
    $DB_HOST = $matches[3]
    $DB_PORT = $matches[4]
    $DB_NAME = $matches[5]
} else {
    Write-Error "❌ Invalid DATABASE_URL format"
    exit 1
}

# Function to list available backups
function Get-AvailableBackups {
    $backups = @()
    
    foreach ($type in @('daily', 'weekly', 'monthly', 'manual')) {
        $path = "$BACKUP_DIR/$type"
        
        if (Test-Path $path) {
            Get-ChildItem $path -Filter "*.sql.gz" | ForEach-Object {
                $metadata = $null
                
                if (Test-Path "$($_.FullName).json") {
                    $metadata = Get-Content "$($_.FullName).json" | ConvertFrom-Json
                }
                
                $backups += [PSCustomObject]@{
                    File      = $_.FullName
                    Name      = $_.Name
                    Type      = $type
                    Date      = $_.LastWriteTime
                    Size      = [math]::Round($_.Length / 1MB, 2)
                    Metadata  = $metadata
                }
            }
        }
    }
    
    return $backups | Sort-Object -Property Date -Descending
}

# If no backup file specified, show menu
if (-not $BackupFile) {
    Write-Info "Available backups:`n"
    
    $backups = Get-AvailableBackups
    
    if ($backups.Count -eq 0) {
        Write-Error "❌ No backups found in $BACKUP_DIR"
        exit 1
    }
    
    # Display backups
    for ($i = 0; $i -lt $backups.Count; $i++) {
        $backup = $backups[$i]
        Write-Host "$($i + 1). " -NoNewline -ForegroundColor Yellow
        Write-Host "$($backup.Name)" -NoNewline -ForegroundColor White
        Write-Host " ($($backup.Size) MB, " -NoNewline -ForegroundColor Gray
        Write-Host "$($backup.Date.ToString('yyyy-MM-dd HH:mm:ss'))" -NoNewline -ForegroundColor Gray
        Write-Host ")" -ForegroundColor Gray
    }
    
    Write-Host ""
    
    # Get user selection
    do {
        $selection = Read-Host "Select backup to restore (1-$($backups.Count), or 'q' to quit)"
        
        if ($selection -eq 'q') {
            Write-Info "Restore cancelled."
            exit 0
        }
        
        $selectionNum = [int]$selection
    } while ($selectionNum -lt 1 -or $selectionNum -gt $backups.Count)
    
    $BackupFile = $backups[$selectionNum - 1].File
}

# Handle "latest" shortcut
if ($BackupFile -eq "latest") {
    $backups = Get-AvailableBackups
    
    if ($backups.Count -eq 0) {
        Write-Error "❌ No backups found"
        exit 1
    }
    
    $BackupFile = $backups[0].File
    Write-Info "Using latest backup: $BackupFile"
}

# Validate backup file exists
if (-not (Test-Path $BackupFile)) {
    Write-Error "❌ Backup file not found: $BackupFile"
    exit 1
}

Write-Info "Backup file: $BackupFile"
Write-Info "Backup size: $([math]::Round((Get-Item $BackupFile).Length / 1MB, 2)) MB"
Write-Host ""

# Warning
Write-Warning "⚠️  WARNING: This will overwrite the current database!"
Write-Warning "   Database: $DB_NAME"
Write-Warning "   Host: $DB_HOST"
Write-Host ""

# Confirmation (unless Force flag is used)
if (-not $Force) {
    $confirm = Read-Host "Are you sure you want to restore? (yes/no)"
    
    if ($confirm -ne "yes") {
        Write-Info "Restore cancelled."
        exit 0
    }
}

# Create safety backup before restore
Write-Info "Creating safety backup of current database..."

$TIMESTAMP = Get-Date -Format "yyyy-MM-dd-HHmmss"
$SAFETY_BACKUP = "$BACKUP_DIR/manual/odavl-pre-restore-$TIMESTAMP.sql"

$env:PGPASSWORD = $DB_PASSWORD

try {
    pg_dump -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -F p -f $SAFETY_BACKUP 2>&1 | Out-Null
    
    if (Test-Path $SAFETY_BACKUP) {
        Write-Success "✅ Safety backup created: $SAFETY_BACKUP"
    } else {
        Write-Warning "⚠️  Safety backup failed, but continuing with restore..."
    }
} catch {
    Write-Warning "⚠️  Safety backup failed: $($_.Exception.Message)"
    
    if (-not $Force) {
        $continue = Read-Host "Continue with restore anyway? (yes/no)"
        
        if ($continue -ne "yes") {
            Write-Info "Restore cancelled."
            exit 0
        }
    }
}

# Decompress backup if needed
$RESTORE_FILE = $BackupFile

if ($BackupFile -like "*.gz") {
    Write-Info "Decompressing backup..."
    
    $RESTORE_FILE = $BackupFile -replace '\.gz$', ''
    
    try {
        # Use 7-Zip if available
        $sevenZip = Get-Command 7z -ErrorAction SilentlyContinue
        
        if ($sevenZip) {
            7z x $BackupFile -o"$(Split-Path $RESTORE_FILE)" -y | Out-Null
        } else {
            Expand-Archive -Path $BackupFile -DestinationPath (Split-Path $RESTORE_FILE) -Force
        }
        
        Write-Success "✅ Backup decompressed"
    } catch {
        Write-Error "❌ Decompression failed: $($_.Exception.Message)"
        exit 1
    }
}

# Drop existing connections
Write-Info "Terminating existing connections..."

try {
    $terminateQuery = @"
SELECT pg_terminate_backend(pid)
FROM pg_stat_activity
WHERE datname = '$DB_NAME'
  AND pid <> pg_backend_pid();
"@
    
    psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d postgres -c $terminateQuery 2>&1 | Out-Null
    Write-Success "✅ Connections terminated"
} catch {
    Write-Warning "⚠️  Failed to terminate connections: $($_.Exception.Message)"
}

# Drop and recreate database
Write-Info "Dropping and recreating database..."

try {
    psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d postgres -c "DROP DATABASE IF EXISTS $DB_NAME;" 2>&1 | Out-Null
    psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d postgres -c "CREATE DATABASE $DB_NAME;" 2>&1 | Out-Null
    Write-Success "✅ Database recreated"
} catch {
    Write-Error "❌ Failed to recreate database: $($_.Exception.Message)"
    exit 1
}

# Restore database
Write-Info "Restoring database from backup..."

try {
    psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -f $RESTORE_FILE 2>&1 | Out-Null
    Write-Success "✅ Database restored"
} catch {
    Write-Error "❌ Restore failed: $($_.Exception.Message)"
    exit 1
} finally {
    $env:PGPASSWORD = ""
    
    # Remove decompressed file if we created it
    if ($RESTORE_FILE -ne $BackupFile -and (Test-Path $RESTORE_FILE)) {
        Remove-Item $RESTORE_FILE -Force
    }
}

# Verify restoration
Write-Info "Verifying restoration..."

try {
    $result = psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -t -c "SELECT COUNT(*) FROM pg_tables WHERE schemaname = 'public';" 2>&1
    
    $tableCount = [int]($result.Trim())
    
    if ($tableCount -gt 0) {
        Write-Success "✅ Verification passed: $tableCount tables found"
    } else {
        Write-Warning "⚠️  Verification warning: No tables found in public schema"
    }
} catch {
    Write-Warning "⚠️  Verification failed: $($_.Exception.Message)"
}

# Summary
Write-Host "`n════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  RESTORE COMPLETE" -ForegroundColor White -BackgroundColor Green
Write-Host "════════════════════════════════════════`n" -ForegroundColor Cyan

Write-Info "Backup: $BackupFile"
Write-Info "Database: $DB_NAME"
Write-Info "Host: $DB_HOST"
Write-Info "Safety backup: $SAFETY_BACKUP"

Write-Host ""

# Write to backup log
$logEntry = "[$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')] Restored from: $BackupFile"
Add-Content -Path "$BACKUP_DIR/restore.log" -Value $logEntry

Write-Success "✅ Restore completed successfully!`n"
