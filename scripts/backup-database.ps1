# =====================================
# ODAVL Studio - Manual Backup Script (PowerShell)
# =====================================
# Create manual database backup
# Usage: .\scripts\backup-database.ps1 -Environment production

param(
    [ValidateSet("production", "staging")]
    [string]$Environment = "production"
)

$ErrorActionPreference = "Stop"

$TIMESTAMP = Get-Date -Format "yyyyMMdd_HHmmss"
$BACKUP_DIR = ".\backups\$Environment"

Write-Host "🔒 Starting database backup for $Environment environment..." -ForegroundColor Cyan

# Create backup directory
if (-not (Test-Path $BACKUP_DIR)) {
    New-Item -ItemType Directory -Path $BACKUP_DIR -Force | Out-Null
}

# Load environment variables
$envFile = "apps\studio-hub\.env.$Environment"
if (-not (Test-Path $envFile)) {
    Write-Host "❌ Environment file not found: $envFile" -ForegroundColor Red
    exit 1
}

# Parse .env file
Get-Content $envFile | ForEach-Object {
    if ($_ -match '^([^=]+)=(.*)$') {
        $key = $matches[1].Trim()
        $value = $matches[2].Trim()
        [Environment]::SetEnvironmentVariable($key, $value, "Process")
    }
}

$DATABASE_URL = $env:DATABASE_URL
if (-not $DATABASE_URL) {
    Write-Host "❌ DATABASE_URL not set in environment file" -ForegroundColor Red
    exit 1
}

# Create backup filename
$BACKUP_FILE = "$BACKUP_DIR\backup_${Environment}_${TIMESTAMP}.sql.gz"

Write-Host "📦 Creating compressed backup..." -ForegroundColor Yellow

# Check if pg_dump exists
if (-not (Get-Command pg_dump -ErrorAction SilentlyContinue)) {
    Write-Host "❌ pg_dump not found. Install PostgreSQL client tools." -ForegroundColor Red
    exit 1
}

# Create backup
pg_dump $DATABASE_URL | gzip > $BACKUP_FILE

# Get file size
$BACKUP_SIZE = (Get-Item $BACKUP_FILE).Length / 1MB
$BACKUP_SIZE_FORMATTED = "{0:N2} MB" -f $BACKUP_SIZE

Write-Host "✅ Backup created successfully!" -ForegroundColor Green
Write-Host "📁 File: $BACKUP_FILE" -ForegroundColor Cyan
Write-Host "📊 Size: $BACKUP_SIZE_FORMATTED" -ForegroundColor Cyan

# Upload to S3 (if AWS CLI is available)
$AWS_S3_BUCKET = $env:AWS_S3_BUCKET
if ((Get-Command aws -ErrorAction SilentlyContinue) -and $AWS_S3_BUCKET) {
    Write-Host "☁️  Uploading to S3..." -ForegroundColor Yellow
    aws s3 cp $BACKUP_FILE "s3://$AWS_S3_BUCKET/backups/database/"
    Write-Host "✅ Uploaded to S3: s3://$AWS_S3_BUCKET/backups/database/$(Split-Path $BACKUP_FILE -Leaf)" -ForegroundColor Green
}

Write-Host ""
Write-Host "🎉 Backup complete!" -ForegroundColor Green
Write-Host ""
Write-Host "To restore this backup:" -ForegroundColor Yellow
Write-Host "  gunzip -c $BACKUP_FILE | psql `$DATABASE_URL"
