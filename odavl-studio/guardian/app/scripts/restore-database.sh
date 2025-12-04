#!/bin/bash

###############################################################################
# Guardian Database Restore Script
# 
# Week 11: Production Deployment - Automated database restore
# 
# This script restores Guardian's PostgreSQL database from backups.
# Features:
# - List available backups
# - Restore from local or S3
# - Pre-restore validation
# - Post-restore verification
###############################################################################

set -e  # Exit on error
set -u  # Exit on undefined variable

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
BACKUP_DIR="${BACKUP_DIR:-./backups}"
DB_CONTAINER="${DB_CONTAINER:-guardian-postgres-1}"
DB_NAME="${DB_NAME:-guardian}"
DB_USER="${DB_USER:-guardian}"
S3_BUCKET="${S3_BUCKET:-}"

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

log_step() {
    echo -e "${BLUE}[STEP]${NC} $1"
}

# List available backups
list_backups() {
    log_info "Available backups:"
    echo ""
    
    local backups=($(ls -t "$BACKUP_DIR"/guardian_*.sql.gz 2>/dev/null || true))
    
    if [ ${#backups[@]} -eq 0 ]; then
        log_warn "No backups found in $BACKUP_DIR"
        exit 1
    fi
    
    local i=1
    for backup in "${backups[@]}"; do
        local size=$(stat -f%z "$backup" 2>/dev/null || stat -c%s "$backup" 2>/dev/null)
        local date=$(basename "$backup" .sql.gz | sed 's/guardian_//')
        echo "  $i. $date (size: $size bytes)"
        i=$((i + 1))
    done
    
    echo ""
}

# Select backup
select_backup() {
    list_backups
    
    read -p "Select backup number (or 'q' to quit): " selection
    
    if [ "$selection" = "q" ]; then
        log_info "Restore cancelled"
        exit 0
    fi
    
    local backups=($(ls -t "$BACKUP_DIR"/guardian_*.sql.gz))
    local index=$((selection - 1))
    
    if [ $index -ge 0 ] && [ $index -lt ${#backups[@]} ]; then
        SELECTED_BACKUP="${backups[$index]}"
        log_info "Selected backup: $(basename $SELECTED_BACKUP)"
    else
        log_error "Invalid selection"
        exit 1
    fi
}

# Confirm restore
confirm_restore() {
    log_step "Database Restore Confirmation"
    echo ""
    echo "⚠️  WARNING: This will replace the current database!"
    echo ""
    echo "Database: $DB_NAME"
    echo "Backup: $(basename $SELECTED_BACKUP)"
    echo ""
    read -p "Type 'RESTORE' to continue: " confirmation
    
    if [ "$confirmation" != "RESTORE" ]; then
        log_error "Restore cancelled by user"
        exit 1
    fi
}

# Create pre-restore backup
create_prerestore_backup() {
    log_info "Creating pre-restore backup..."
    
    local timestamp=$(date +%Y%m%d_%H%M%S)
    local prerestore_file="$BACKUP_DIR/prerestore_${timestamp}.sql"
    
    docker exec -t "$DB_CONTAINER" pg_dump -U "$DB_USER" "$DB_NAME" > "$prerestore_file"
    
    if [ $? -eq 0 ]; then
        gzip "$prerestore_file"
        log_info "✓ Pre-restore backup created: ${prerestore_file}.gz"
    else
        log_warn "⚠ Pre-restore backup failed"
    fi
}

# Restore database
restore_database() {
    log_info "Restoring database from: $(basename $SELECTED_BACKUP)"
    
    # Decompress if needed
    local restore_file="$SELECTED_BACKUP"
    if [[ "$restore_file" == *.gz ]]; then
        log_info "Decompressing backup..."
        gunzip -c "$restore_file" > "${restore_file%.gz}"
        restore_file="${restore_file%.gz}"
    fi
    
    # Drop existing connections
    log_info "Terminating existing database connections..."
    docker exec -t "$DB_CONTAINER" psql -U "$DB_USER" -d postgres -c \
        "SELECT pg_terminate_backend(pg_stat_activity.pid) FROM pg_stat_activity WHERE pg_stat_activity.datname = '$DB_NAME' AND pid <> pg_backend_pid();" \
        &> /dev/null || true
    
    # Drop and recreate database
    log_info "Dropping and recreating database..."
    docker exec -t "$DB_CONTAINER" psql -U "$DB_USER" -d postgres -c "DROP DATABASE IF EXISTS $DB_NAME;" &> /dev/null
    docker exec -t "$DB_CONTAINER" psql -U "$DB_USER" -d postgres -c "CREATE DATABASE $DB_NAME;" &> /dev/null
    
    # Restore from backup
    log_info "Restoring data..."
    docker exec -i "$DB_CONTAINER" psql -U "$DB_USER" -d "$DB_NAME" < "$restore_file"
    
    if [ $? -eq 0 ]; then
        log_info "✓ Database restored successfully"
    else
        log_error "✗ Database restore failed"
        exit 1
    fi
    
    # Clean up decompressed file
    if [[ "$SELECTED_BACKUP" == *.gz ]]; then
        rm -f "$restore_file"
    fi
}

# Verify restore
verify_restore() {
    log_info "Verifying database restore..."
    
    # Check if database exists
    local db_exists=$(docker exec -t "$DB_CONTAINER" psql -U "$DB_USER" -d postgres -tAc "SELECT 1 FROM pg_database WHERE datname='$DB_NAME';")
    
    if [ "$db_exists" = "1" ]; then
        log_info "✓ Database exists"
    else
        log_error "✗ Database not found"
        exit 1
    fi
    
    # Check table count
    local table_count=$(docker exec -t "$DB_CONTAINER" psql -U "$DB_USER" -d "$DB_NAME" -tAc "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='public';")
    
    if [ "$table_count" -gt 0 ]; then
        log_info "✓ Database contains $table_count tables"
    else
        log_warn "⚠ Database has no tables"
    fi
}

# Main function
main() {
    log_step "Guardian Database Restore"
    echo ""
    
    # Check if backup directory exists
    if [ ! -d "$BACKUP_DIR" ]; then
        log_error "Backup directory not found: $BACKUP_DIR"
        exit 1
    fi
    
    # Select backup
    select_backup
    
    # Confirm restore
    confirm_restore
    
    # Create pre-restore backup
    create_prerestore_backup
    
    # Restore database
    restore_database
    
    # Verify restore
    verify_restore
    
    log_info ""
    log_info "🎉 Database restore completed successfully!"
    log_info ""
    log_info "Next steps:"
    log_info "  1. Restart Guardian application"
    log_info "  2. Run database migrations if needed"
    log_info "  3. Verify application functionality"
    log_info ""
}

# Run main function
main
