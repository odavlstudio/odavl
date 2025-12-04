#!/usr/bin/env pwsh
<#
.SYNOPSIS
    PostgreSQL backup script for ODAVL Insight Cloud
    
.DESCRIPTION
    Creates automated backups of PostgreSQL database with:
    - Daily backups (kept for 7 days)
    - Weekly backups (kept for 4 weeks)
    - Monthly backups (kept for 12 months)
    - Compressed archives with timestamps
    - Automatic cleanup of old backups
    - Upload to cloud storage (optional)
    
.PARAMETER Type
    Backup type: daily, weekly, monthly, or manual
    
.PARAMETER Upload
    Upload backup to cloud storage (AWS S3, Azure Blob, etc.)
    
.EXAMPLE
    .\backup.ps1 -Type daily
    
.EXAMPLE
    .\backup.ps1 -Type weekly -Upload
#>

param(
    [Parameter(Mandatory=$false)]
    [ValidateSet('daily', 'weekly', 'monthly', 'manual')]
    [string]$Type = 'manual',
    
    [Parameter(Mandatory=$false)]
    [switch]$Upload
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
$TIMESTAMP = Get-Date -Format "yyyy-MM-dd-HHmmss"
$DATE = Get-Date -Format "yyyy-MM-dd"

# Retention periods (in days)
$RETENTION = @{
    daily   = 7
    weekly  = 28
    monthly = 365
    manual  = 90
}

# Color functions
function Write-Success { param($Message) Write-Host $Message -ForegroundColor Green }
function Write-Info { param($Message) Write-Host $Message -ForegroundColor Cyan }
function Write-Warning { param($Message) Write-Host $Message -ForegroundColor Yellow }
function Write-Error { param($Message) Write-Host $Message -ForegroundColor Red }

# Header
Write-Host "`n════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  POSTGRESQL BACKUP SCRIPT" -ForegroundColor White -BackgroundColor Blue
Write-Host "════════════════════════════════════════`n" -ForegroundColor Cyan

Write-Info "Backup Type: $Type"
Write-Info "Timestamp: $TIMESTAMP"
Write-Info "Backup Directory: $BACKUP_DIR"
Write-Host ""

# Create backup directory if it doesn't exist
New-Item -ItemType Directory -Force -Path "$BACKUP_DIR/$Type" | Out-Null

# Parse DATABASE_URL
if (-not $DATABASE_URL) {
    Write-Error "❌ DATABASE_URL not found in environment variables"
    exit 1
}

# Extract database credentials from DATABASE_URL
# Format: postgresql://user:password@host:port/database
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

# Backup filename
$BACKUP_FILE = "$BACKUP_DIR/$Type/odavl-$Type-$TIMESTAMP.sql"
$BACKUP_FILE_GZ = "$BACKUP_FILE.gz"

Write-Info "Creating backup: $BACKUP_FILE"

# Set pg_dump password environment variable
$env:PGPASSWORD = $DB_PASSWORD

# Run pg_dump
try {
    Write-Info "Running pg_dump..."
    
    $dumpCommand = "pg_dump -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -F p -f `"$BACKUP_FILE`""
    
    Invoke-Expression $dumpCommand 2>&1 | Out-Null
    
    if (-not (Test-Path $BACKUP_FILE)) {
        throw "Backup file was not created"
    }
    
    Write-Success "✅ Database dump completed"
    
    # Get backup size
    $backupSize = (Get-Item $BACKUP_FILE).Length / 1MB
    Write-Info "Backup size: $([math]::Round($backupSize, 2)) MB"
    
} catch {
    Write-Error "❌ Backup failed: $($_.Exception.Message)"
    exit 1
} finally {
    # Clear password from environment
    $env:PGPASSWORD = ""
}

# Compress backup
Write-Info "Compressing backup..."

try {
    # Use 7-Zip if available (better compression), otherwise use built-in compression
    $sevenZip = Get-Command 7z -ErrorAction SilentlyContinue
    
    if ($sevenZip) {
        7z a -tgzip "$BACKUP_FILE_GZ" "$BACKUP_FILE" -mx=9 | Out-Null
    } else {
        Compress-Archive -Path $BACKUP_FILE -DestinationPath "$BACKUP_FILE.zip" -CompressionLevel Optimal
        Rename-Item "$BACKUP_FILE.zip" "$BACKUP_FILE_GZ"
    }
    
    # Remove uncompressed file
    Remove-Item $BACKUP_FILE
    
    $compressedSize = (Get-Item $BACKUP_FILE_GZ).Length / 1MB
    $compressionRatio = (1 - ($compressedSize / $backupSize)) * 100
    
    Write-Success "✅ Backup compressed"
    Write-Info "Compressed size: $([math]::Round($compressedSize, 2)) MB"
    Write-Info "Compression ratio: $([math]::Round($compressionRatio, 2))%"
    
} catch {
    Write-Error "❌ Compression failed: $($_.Exception.Message)"
    # Keep uncompressed backup if compression fails
    Rename-Item $BACKUP_FILE $BACKUP_FILE_GZ
}

# Create backup metadata
$metadata = @{
    type        = $Type
    timestamp   = $TIMESTAMP
    date        = $DATE
    database    = $DB_NAME
    host        = $DB_HOST
    size        = (Get-Item $BACKUP_FILE_GZ).Length
    compressed  = $true
    retention   = $RETENTION[$Type]
} | ConvertTo-Json

$metadata | Out-File "$BACKUP_FILE_GZ.json"

Write-Success "`n✅ Backup completed successfully!"
Write-Info "Backup file: $BACKUP_FILE_GZ"

# Clean up old backups
Write-Info "`nCleaning up old backups..."

$retentionDays = $RETENTION[$Type]
$cutoffDate = (Get-Date).AddDays(-$retentionDays)

Get-ChildItem "$BACKUP_DIR/$Type" -Filter "*.sql.gz" | Where-Object {
    $_.LastWriteTime -lt $cutoffDate
} | ForEach-Object {
    Write-Info "  Removing old backup: $($_.Name)"
    Remove-Item $_.FullName -Force
    
    # Remove metadata file if exists
    if (Test-Path "$($_.FullName).json") {
        Remove-Item "$($_.FullName).json" -Force
    }
}

Write-Success "✅ Cleanup completed"

# Upload to cloud storage (if requested)
if ($Upload) {
    Write-Info "`nUploading backup to cloud storage..."
    
    # AWS S3 upload (example)
    if ($env:AWS_ACCESS_KEY_ID -and $env:AWS_SECRET_ACCESS_KEY) {
        $S3_BUCKET = $env:BACKUP_S3_BUCKET
        
        if ($S3_BUCKET) {
            try {
                aws s3 cp $BACKUP_FILE_GZ "s3://$S3_BUCKET/postgres/$Type/" --no-progress
                Write-Success "✅ Backup uploaded to S3: s3://$S3_BUCKET/postgres/$Type/"
            } catch {
                Write-Warning "⚠️  S3 upload failed: $($_.Exception.Message)"
            }
        }
    }
    
    # Azure Blob Storage upload (example)
    if ($env:AZURE_STORAGE_CONNECTION_STRING) {
        $CONTAINER = $env:BACKUP_CONTAINER_NAME
        
        if ($CONTAINER) {
            try {
                az storage blob upload `
                    --connection-string $env:AZURE_STORAGE_CONNECTION_STRING `
                    --container-name $CONTAINER `
                    --name "postgres/$Type/$(Split-Path $BACKUP_FILE_GZ -Leaf)" `
                    --file $BACKUP_FILE_GZ `
                    --no-progress
                
                Write-Success "✅ Backup uploaded to Azure Blob Storage"
            } catch {
                Write-Warning "⚠️  Azure upload failed: $($_.Exception.Message)"
            }
        }
    }
}

# Summary
Write-Host "`n════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  BACKUP SUMMARY" -ForegroundColor White -BackgroundColor Green
Write-Host "════════════════════════════════════════`n" -ForegroundColor Cyan

Write-Info "Type: $Type"
Write-Info "File: $BACKUP_FILE_GZ"
Write-Info "Size: $([math]::Round((Get-Item $BACKUP_FILE_GZ).Length / 1MB, 2)) MB"
Write-Info "Retention: $retentionDays days"

if ($Upload) {
    Write-Info "Uploaded: Yes"
}

Write-Host ""

# Write to backup log
$logEntry = "[$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')] $Type backup completed: $BACKUP_FILE_GZ"
Add-Content -Path "$BACKUP_DIR/backup.log" -Value $logEntry

Write-Success "✅ All operations completed successfully!`n"
