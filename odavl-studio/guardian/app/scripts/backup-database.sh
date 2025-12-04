#!/bin/bash

###############################################################################
# Guardian Database Backup Script
# 
# Week 11: Production Deployment - Automated database backup
# 
# This script creates automated backups of Guardian's PostgreSQL database.
# Features:
# - Full database dumps
# - Compression (gzip)
# - Retention policy (keep last 30 days)
# - S3 upload (optional)
# - Backup verification
###############################################################################

set -e  # Exit on error
set -u  # Exit on undefined variable

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
BACKUP_DIR="${BACKUP_DIR:-./backups}"
RETENTION_DAYS="${RETENTION_DAYS:-30}"
DB_CONTAINER="${DB_CONTAINER:-guardian-postgres-1}"
DB_NAME="${DB_NAME:-guardian}"
DB_USER="${DB_USER:-guardian}"
S3_BUCKET="${S3_BUCKET:-}"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="guardian_${TIMESTAMP}.sql"

# Logging functions
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Create backup directory
mkdir -p "$BACKUP_DIR"

# Create database backup
create_backup() {
    log_info "Creating database backup: $BACKUP_FILE"
    
    docker exec -t "$DB_CONTAINER" pg_dump -U "$DB_USER" "$DB_NAME" > "$BACKUP_DIR/$BACKUP_FILE"
    
    if [ $? -eq 0 ]; then
        log_info "✓ Database backup created"
    else
        log_error "✗ Database backup failed"
        exit 1
    fi
}

# Compress backup
compress_backup() {
    log_info "Compressing backup..."
    
    gzip "$BACKUP_DIR/$BACKUP_FILE"
    
    if [ $? -eq 0 ]; then
        log_info "✓ Backup compressed: ${BACKUP_FILE}.gz"
    else
        log_error "✗ Compression failed"
        exit 1
    fi
}

# Verify backup
verify_backup() {
    log_info "Verifying backup..."
    
    if [ -f "$BACKUP_DIR/${BACKUP_FILE}.gz" ]; then
        local size=$(stat -f%z "$BACKUP_DIR/${BACKUP_FILE}.gz" 2>/dev/null || stat -c%s "$BACKUP_DIR/${BACKUP_FILE}.gz" 2>/dev/null)
        
        if [ "$size" -gt 1000 ]; then
            log_info "✓ Backup verified (size: ${size} bytes)"
        else
            log_warn "⚠ Backup file seems too small (size: ${size} bytes)"
        fi
    else
        log_error "✗ Backup file not found"
        exit 1
    fi
}

# Upload to S3 (optional)
upload_to_s3() {
    if [ -z "$S3_BUCKET" ]; then
        log_info "S3 upload disabled (S3_BUCKET not set)"
        return
    fi
    
    log_info "Uploading backup to S3..."
    
    if command -v aws &> /dev/null; then
        aws s3 cp "$BACKUP_DIR/${BACKUP_FILE}.gz" "s3://$S3_BUCKET/guardian-backups/${BACKUP_FILE}.gz"
        
        if [ $? -eq 0 ]; then
            log_info "✓ Backup uploaded to S3"
        else
            log_warn "⚠ S3 upload failed"
        fi
    else
        log_warn "⚠ AWS CLI not installed - skipping S3 upload"
    fi
}

# Clean old backups
clean_old_backups() {
    log_info "Cleaning backups older than $RETENTION_DAYS days..."
    
    find "$BACKUP_DIR" -name "guardian_*.sql.gz" -mtime +$RETENTION_DAYS -delete
    
    local remaining=$(find "$BACKUP_DIR" -name "guardian_*.sql.gz" | wc -l)
    log_info "✓ Retention applied - $remaining backups remaining"
}

# Main function
main() {
    log_info "Starting Guardian database backup..."
    
    create_backup
    compress_backup
    verify_backup
    upload_to_s3
    clean_old_backups
    
    log_info "🎉 Backup completed successfully!"
    log_info "Backup location: $BACKUP_DIR/${BACKUP_FILE}.gz"
}

# Run main function
main
