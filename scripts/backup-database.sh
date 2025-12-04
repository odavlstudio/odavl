#!/bin/bash

# =====================================
# ODAVL Studio - Manual Backup Script
# =====================================
# Create manual database backup
# Usage: ./scripts/backup-database.sh [production|staging]

set -e

ENVIRONMENT=${1:-production}
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_DIR="./backups/$ENVIRONMENT"

echo "🔒 Starting database backup for $ENVIRONMENT environment..."

# Create backup directory
mkdir -p "$BACKUP_DIR"

# Load environment variables
if [ -f ".env.$ENVIRONMENT" ]; then
    source ".env.$ENVIRONMENT"
elif [ -f "apps/studio-hub/.env.$ENVIRONMENT" ]; then
    source "apps/studio-hub/.env.$ENVIRONMENT"
else
    echo "❌ Environment file not found: .env.$ENVIRONMENT"
    exit 1
fi

# Verify DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
    echo "❌ DATABASE_URL not set in environment file"
    exit 1
fi

# Create backup filename
BACKUP_FILE="$BACKUP_DIR/backup_${ENVIRONMENT}_${TIMESTAMP}.sql.gz"

echo "📦 Creating compressed backup..."
pg_dump "$DATABASE_URL" | gzip > "$BACKUP_FILE"

# Get file size
BACKUP_SIZE=$(du -h "$BACKUP_FILE" | cut -f1)

echo "✅ Backup created successfully!"
echo "📁 File: $BACKUP_FILE"
echo "📊 Size: $BACKUP_SIZE"

# Upload to S3 (if AWS CLI is available)
if command -v aws &> /dev/null && [ -n "$AWS_S3_BUCKET" ]; then
    echo "☁️  Uploading to S3..."
    aws s3 cp "$BACKUP_FILE" "s3://$AWS_S3_BUCKET/backups/database/"
    echo "✅ Uploaded to S3: s3://$AWS_S3_BUCKET/backups/database/$(basename $BACKUP_FILE)"
fi

echo ""
echo "🎉 Backup complete!"
echo ""
echo "To restore this backup:"
echo "  gunzip -c $BACKUP_FILE | psql \$DATABASE_URL"
