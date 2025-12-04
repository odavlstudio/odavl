#!/bin/bash

###############################################################################
# Guardian Deployment Script - Staging Environment
# 
# Week 11: Production Deployment - Automated staging deployment
# 
# This script automates the deployment of Guardian to staging environment.
# It handles:
# - Environment validation
# - Database migrations
# - Docker container updates
# - Health checks
# - Rollback on failure
###############################################################################

set -e  # Exit on error
set -u  # Exit on undefined variable

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
ENVIRONMENT="staging"
COMPOSE_FILE="docker-compose.prod.yml"
ENV_FILE=".env.staging"
BACKUP_DIR="./backups"
MAX_HEALTH_CHECKS=30
HEALTH_CHECK_INTERVAL=2

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

# Check if required files exist
check_prerequisites() {
    log_info "Checking prerequisites..."
    
    if [ ! -f "$COMPOSE_FILE" ]; then
        log_error "Docker Compose file not found: $COMPOSE_FILE"
        exit 1
    fi
    
    if [ ! -f "$ENV_FILE" ]; then
        log_error "Environment file not found: $ENV_FILE"
        exit 1
    fi
    
    if ! command -v docker &> /dev/null; then
        log_error "Docker is not installed"
        exit 1
    fi
    
    if ! command -v docker-compose &> /dev/null; then
        log_error "Docker Compose is not installed"
        exit 1
    fi
    
    log_info "Prerequisites check passed"
}

# Backup current database
backup_database() {
    log_info "Creating database backup..."
    
    mkdir -p "$BACKUP_DIR"
    
    TIMESTAMP=$(date +%Y%m%d_%H%M%S)
    BACKUP_FILE="$BACKUP_DIR/guardian_staging_${TIMESTAMP}.sql"
    
    docker-compose -f "$COMPOSE_FILE" exec -T postgres pg_dump -U guardian guardian > "$BACKUP_FILE"
    
    if [ $? -eq 0 ]; then
        log_info "Database backed up to: $BACKUP_FILE"
    else
        log_error "Database backup failed"
        exit 1
    fi
}

# Run database migrations
run_migrations() {
    log_info "Running database migrations..."
    
    docker-compose -f "$COMPOSE_FILE" exec guardian pnpm prisma migrate deploy
    
    if [ $? -eq 0 ]; then
        log_info "Database migrations completed successfully"
    else
        log_error "Database migrations failed"
        return 1
    fi
}

# Build and deploy new containers
deploy_containers() {
    log_info "Building and deploying containers..."
    
    # Pull latest images
    docker-compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" pull
    
    # Build guardian image
    docker-compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" build guardian
    
    # Deploy with zero-downtime strategy (recreate)
    docker-compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" up -d --force-recreate --no-deps guardian
    
    if [ $? -eq 0 ]; then
        log_info "Containers deployed successfully"
    else
        log_error "Container deployment failed"
        return 1
    fi
}

# Wait for health check
wait_for_health() {
    log_info "Waiting for application to become healthy..."
    
    local count=0
    while [ $count -lt $MAX_HEALTH_CHECKS ]; do
        if curl -f http://localhost:3000/api/health &> /dev/null; then
            log_info "Application is healthy!"
            return 0
        fi
        
        count=$((count + 1))
        log_info "Health check attempt $count/$MAX_HEALTH_CHECKS..."
        sleep $HEALTH_CHECK_INTERVAL
    done
    
    log_error "Application failed to become healthy after $MAX_HEALTH_CHECKS attempts"
    return 1
}

# Rollback deployment
rollback() {
    log_warn "Rolling back deployment..."
    
    # Restore database from latest backup
    LATEST_BACKUP=$(ls -t "$BACKUP_DIR"/guardian_staging_*.sql | head -1)
    
    if [ -f "$LATEST_BACKUP" ]; then
        log_info "Restoring database from: $LATEST_BACKUP"
        docker-compose -f "$COMPOSE_FILE" exec -T postgres psql -U guardian guardian < "$LATEST_BACKUP"
    fi
    
    # Restart containers with previous version
    docker-compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" up -d --force-recreate guardian
    
    log_warn "Rollback completed"
}

# Main deployment flow
main() {
    log_info "Starting Guardian deployment to $ENVIRONMENT..."
    
    # Check prerequisites
    check_prerequisites
    
    # Backup database
    backup_database
    
    # Deploy new version
    if ! deploy_containers; then
        log_error "Deployment failed during container update"
        rollback
        exit 1
    fi
    
    # Wait for health check
    if ! wait_for_health; then
        log_error "Deployment failed during health check"
        rollback
        exit 1
    fi
    
    # Run migrations after successful deployment
    if ! run_migrations; then
        log_error "Deployment failed during migrations"
        rollback
        exit 1
    fi
    
    # Final health check
    if ! wait_for_health; then
        log_error "Deployment failed after migrations"
        rollback
        exit 1
    fi
    
    log_info "🎉 Deployment to $ENVIRONMENT completed successfully!"
    log_info "Application is running at: http://localhost:3000"
}

# Run main function
main
