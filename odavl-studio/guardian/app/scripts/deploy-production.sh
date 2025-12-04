#!/bin/bash

###############################################################################
# Guardian Deployment Script - Production Environment
# 
# Week 11: Production Deployment - Automated production deployment
# 
# This script automates the deployment of Guardian to production environment.
# It includes:
# - Manual confirmation steps
# - Blue-green deployment strategy
# - Comprehensive health checks
# - Automatic rollback on failure
# - Slack notifications
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
ENVIRONMENT="production"
COMPOSE_FILE="docker-compose.prod.yml"
ENV_FILE=".env.production"
BACKUP_DIR="./backups"
MAX_HEALTH_CHECKS=60
HEALTH_CHECK_INTERVAL=3
SLACK_WEBHOOK_URL="${SLACK_WEBHOOK_URL:-}"

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

# Send Slack notification
send_slack_notification() {
    local message="$1"
    local status="${2:-info}"
    
    if [ -z "$SLACK_WEBHOOK_URL" ]; then
        return
    fi
    
    local emoji="ℹ️"
    case "$status" in
        success) emoji="✅" ;;
        error) emoji="❌" ;;
        warning) emoji="⚠️" ;;
    esac
    
    curl -X POST "$SLACK_WEBHOOK_URL" \
        -H 'Content-Type: application/json' \
        -d "{\"text\": \"$emoji Guardian Production Deployment: $message\"}" \
        &> /dev/null || true
}

# Confirmation prompt
confirm_deployment() {
    log_step "Production Deployment Confirmation"
    echo ""
    echo "You are about to deploy to PRODUCTION environment."
    echo ""
    echo "Pre-deployment checklist:"
    echo "  [ ] All tests passed in staging"
    echo "  [ ] Load tests completed successfully"
    echo "  [ ] Security scan passed"
    echo "  [ ] Database backup verified"
    echo "  [ ] Rollback plan prepared"
    echo ""
    read -p "Type 'DEPLOY' to continue: " confirmation
    
    if [ "$confirmation" != "DEPLOY" ]; then
        log_error "Deployment cancelled by user"
        exit 1
    fi
}

# Check prerequisites
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
    
    # Check if production is already running
    if docker-compose -f "$COMPOSE_FILE" ps | grep -q "Up"; then
        log_info "Production environment is currently running"
    else
        log_warn "Production environment is not running"
    fi
    
    log_info "Prerequisites check passed"
}

# Backup current database
backup_database() {
    log_info "Creating production database backup..."
    
    mkdir -p "$BACKUP_DIR"
    
    TIMESTAMP=$(date +%Y%m%d_%H%M%S)
    BACKUP_FILE="$BACKUP_DIR/guardian_production_${TIMESTAMP}.sql"
    
    docker-compose -f "$COMPOSE_FILE" exec -T postgres pg_dump -U guardian guardian > "$BACKUP_FILE"
    
    if [ $? -eq 0 ]; then
        log_info "Database backed up to: $BACKUP_FILE"
        
        # Compress backup
        gzip "$BACKUP_FILE"
        log_info "Backup compressed: ${BACKUP_FILE}.gz"
    else
        log_error "Database backup failed"
        send_slack_notification "Database backup failed" "error"
        exit 1
    fi
}

# Create snapshot of current state
create_snapshot() {
    log_info "Creating system snapshot..."
    
    TIMESTAMP=$(date +%Y%m%d_%H%M%S)
    SNAPSHOT_DIR="$BACKUP_DIR/snapshot_${TIMESTAMP}"
    mkdir -p "$SNAPSHOT_DIR"
    
    # Save current container IDs and images
    docker-compose -f "$COMPOSE_FILE" ps -q > "$SNAPSHOT_DIR/container_ids.txt"
    docker-compose -f "$COMPOSE_FILE" images -q > "$SNAPSHOT_DIR/image_ids.txt"
    
    # Save current environment
    cp "$ENV_FILE" "$SNAPSHOT_DIR/env_backup"
    
    log_info "Snapshot created: $SNAPSHOT_DIR"
}

# Run comprehensive health checks
comprehensive_health_check() {
    log_info "Running comprehensive health checks..."
    
    # Check database
    if ! docker-compose -f "$COMPOSE_FILE" exec -T postgres pg_isready -U guardian &> /dev/null; then
        log_error "Database health check failed"
        return 1
    fi
    log_info "✓ Database healthy"
    
    # Check Redis
    if ! docker-compose -f "$COMPOSE_FILE" exec -T redis redis-cli ping &> /dev/null; then
        log_error "Redis health check failed"
        return 1
    fi
    log_info "✓ Redis healthy"
    
    # Check Guardian app
    local count=0
    while [ $count -lt $MAX_HEALTH_CHECKS ]; do
        if curl -f http://localhost:3000/api/health &> /dev/null; then
            log_info "✓ Guardian application healthy"
            return 0
        fi
        
        count=$((count + 1))
        log_info "Health check attempt $count/$MAX_HEALTH_CHECKS..."
        sleep $HEALTH_CHECK_INTERVAL
    done
    
    log_error "Guardian application health check failed"
    return 1
}

# Run smoke tests
run_smoke_tests() {
    log_info "Running smoke tests..."
    
    # Test critical endpoints
    local endpoints=(
        "/api/health"
        "/api/test-runs"
        "/api/metrics"
        "/api/monitors"
    )
    
    for endpoint in "${endpoints[@]}"; do
        if curl -f "http://localhost:3000${endpoint}" &> /dev/null; then
            log_info "✓ ${endpoint} accessible"
        else
            log_error "✗ ${endpoint} failed"
            return 1
        fi
    done
    
    log_info "All smoke tests passed"
}

# Blue-green deployment
blue_green_deploy() {
    log_step "Starting blue-green deployment..."
    
    # Build new version (green)
    log_info "Building new version..."
    docker-compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" build guardian
    
    # Start green environment
    log_info "Starting green environment on port 3004..."
    docker run -d \
        --name guardian-green \
        --env-file "$ENV_FILE" \
        -e PORT=3004 \
        -p 3004:3004 \
        --network guardian-network \
        $(docker-compose -f "$COMPOSE_FILE" config | grep 'image:' | head -1 | awk '{print $2}')
    
    # Wait for green to be healthy
    log_info "Waiting for green environment..."
    sleep 10
    
    if curl -f http://localhost:3004/api/health &> /dev/null; then
        log_info "✓ Green environment healthy"
    else
        log_error "Green environment failed to start"
        docker stop guardian-green
        docker rm guardian-green
        return 1
    fi
    
    # Switch traffic (in production, this would update load balancer)
    log_info "Switching to green environment..."
    
    # Stop blue (current production)
    docker-compose -f "$COMPOSE_FILE" stop guardian
    
    # Rename containers
    docker rename guardian guardian-blue
    docker rename guardian-green guardian
    
    # Start new production
    docker start guardian
    
    # Verify new production
    if comprehensive_health_check; then
        log_info "✓ Traffic switched to new version"
        
        # Clean up blue
        docker stop guardian-blue
        docker rm guardian-blue
        
        return 0
    else
        log_error "New version health check failed"
        
        # Rollback
        docker stop guardian
        docker rename guardian guardian-green
        docker rename guardian-blue guardian
        docker start guardian
        
        docker stop guardian-green
        docker rm guardian-green
        
        return 1
    fi
}

# Rollback deployment
rollback() {
    log_warn "Rolling back production deployment..."
    send_slack_notification "Initiating rollback" "warning"
    
    # Restore database from latest backup
    LATEST_BACKUP=$(ls -t "$BACKUP_DIR"/guardian_production_*.sql.gz | head -1)
    
    if [ -f "$LATEST_BACKUP" ]; then
        log_info "Restoring database from: $LATEST_BACKUP"
        gunzip -c "$LATEST_BACKUP" | docker-compose -f "$COMPOSE_FILE" exec -T postgres psql -U guardian guardian
    fi
    
    # Restart containers with previous version
    docker-compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" up -d --force-recreate guardian
    
    # Verify rollback
    if comprehensive_health_check; then
        log_warn "✓ Rollback completed successfully"
        send_slack_notification "Rollback completed successfully" "warning"
    else
        log_error "✗ Rollback verification failed - manual intervention required"
        send_slack_notification "Rollback failed - manual intervention required" "error"
    fi
}

# Main deployment flow
main() {
    log_step "Guardian Production Deployment"
    echo ""
    
    # Confirmation
    confirm_deployment
    
    # Send start notification
    send_slack_notification "Deployment started" "info"
    
    # Check prerequisites
    check_prerequisites
    
    # Create snapshot
    create_snapshot
    
    # Backup database
    backup_database
    
    # Blue-green deployment
    if ! blue_green_deploy; then
        log_error "Blue-green deployment failed"
        rollback
        send_slack_notification "Deployment failed - rollback completed" "error"
        exit 1
    fi
    
    # Run smoke tests
    if ! run_smoke_tests; then
        log_error "Smoke tests failed"
        rollback
        send_slack_notification "Smoke tests failed - rollback completed" "error"
        exit 1
    fi
    
    # Final comprehensive health check
    if ! comprehensive_health_check; then
        log_error "Final health check failed"
        rollback
        send_slack_notification "Final health check failed - rollback completed" "error"
        exit 1
    fi
    
    log_info ""
    log_info "🎉 Production deployment completed successfully!"
    log_info ""
    log_info "Next steps:"
    log_info "  1. Monitor application metrics for 15 minutes"
    log_info "  2. Check error rates in Grafana"
    log_info "  3. Review logs in Loki"
    log_info "  4. Verify user-facing functionality"
    log_info ""
    
    send_slack_notification "Deployment completed successfully ✅" "success"
}

# Run main function
main
