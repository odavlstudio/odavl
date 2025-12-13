#!/bin/sh
# ODAVL Insight: POSIX-Compliant CI Runner Script
#
# Purpose: Platform-agnostic analysis script for any CI runner
# Compatibility: POSIX sh (dash, bash, zsh, ash)
# Dependencies: Node.js 18+, Git, jq (optional for parsing)
#
# Exit codes:
#   0 = Success (no new Critical issues)
#   1 = Detector execution failure
#   2 = New Critical issues detected (PR mode only)
#   3 = Configuration error

set -e  # Exit on error
set -u  # Exit on undefined variable

# ────────────────────────────────────────────────────────────
# Configuration
# ────────────────────────────────────────────────────────────
INSIGHT_VERSION="${INSIGHT_VERSION:-1.2.3}"
MODE="${1:-main}"
BASELINE_REF="${2:-origin/main}"
OUTPUT_DIR="${OUTPUT_DIR:-.odavl}"

# ────────────────────────────────────────────────────────────
# Functions
# ────────────────────────────────────────────────────────────

log() {
    echo "[ODAVL] $*" >&2
}

error() {
    echo "[ODAVL ERROR] $*" >&2
    exit 1
}

detect_platform() {
    if [ -n "${GITHUB_ACTIONS:-}" ]; then
        echo "github"
    elif [ -n "${GITLAB_CI:-}" ]; then
        echo "gitlab"
    elif [ -n "${JENKINS_HOME:-}" ]; then
        echo "jenkins"
    else
        echo "generic"
    fi
}

install_insight() {
    log "Installing ODAVL Insight CLI v${INSIGHT_VERSION}"
    
    if command -v npx >/dev/null 2>&1; then
        # npx available - no installation needed
        log "Using npx for CLI execution"
    elif command -v npm >/dev/null 2>&1; then
        npm install -g "@odavl-studio/cli@${INSIGHT_VERSION}"
    else
        error "Node.js/npm not found - cannot install Insight CLI"
    fi
}

run_pr_analysis() {
    log "Running PR analysis (delta mode)"
    log "Baseline: ${BASELINE_REF}"
    
    # Fetch baseline branch
    if git fetch origin "$(echo "${BASELINE_REF}" | sed 's|origin/||')" 2>/dev/null; then
        log "Baseline branch fetched successfully"
    else
        log "Warning: Could not fetch baseline branch (continuing anyway)"
    fi
    
    # Run delta analysis
    npx "@odavl-studio/cli@${INSIGHT_VERSION}" insight analyze \
        --format sarif \
        --output "${OUTPUT_DIR}/results.sarif" \
        --fail-on-critical \
        --delta-mode \
        --baseline-ref "${BASELINE_REF}"
    
    RESULT=$?
    
    if [ $RESULT -eq 0 ]; then
        log "✓ PR analysis passed (no new Critical issues)"
    elif [ $RESULT -eq 2 ]; then
        log "✗ PR analysis failed (new Critical issues detected)"
        exit 2
    else
        log "✗ PR analysis failed (detector error)"
        exit 1
    fi
}

run_main_analysis() {
    log "Running main branch analysis (full baseline)"
    
    # Run full analysis (never fails on quality)
    npx "@odavl-studio/cli@${INSIGHT_VERSION}" insight analyze \
        --format sarif \
        --format json \
        --output "${OUTPUT_DIR}/results.sarif" \
        --output-json "${OUTPUT_DIR}/baseline.json" || true
    
    # Check if output was generated (operational success)
    if [ -f "${OUTPUT_DIR}/baseline.json" ]; then
        log "✓ Baseline generated successfully"
        exit 0
    else
        log "✗ Operational failure (no output generated)"
        exit 1
    fi
}

run_nightly_analysis() {
    log "Running nightly analysis (trend tracking)"
    
    # Run full analysis
    npx "@odavl-studio/cli@${INSIGHT_VERSION}" insight analyze \
        --format json \
        --output "${OUTPUT_DIR}/nightly-results.json" \
        --include-all-projects || true
    
    # Check operational success
    if [ -f "${OUTPUT_DIR}/nightly-results.json" ]; then
        log "✓ Nightly analysis completed"
        
        # Optional: Parse and display summary
        if command -v jq >/dev/null 2>&1; then
            CRITICAL=$(jq '[.runs[0].results[] | select(.level=="error")] | length' "${OUTPUT_DIR}/nightly-results.json")
            HIGH=$(jq '[.runs[0].results[] | select(.level=="warning")] | length' "${OUTPUT_DIR}/nightly-results.json")
            log "Summary: ${CRITICAL} Critical, ${HIGH} High issues"
        fi
        
        exit 0
    else
        log "✗ Operational failure"
        exit 1
    fi
}

# ────────────────────────────────────────────────────────────
# Main execution
# ────────────────────────────────────────────────────────────

log "ODAVL Insight CI Runner"
log "Mode: ${MODE}"
log "Platform: $(detect_platform)"

# Create output directory
mkdir -p "${OUTPUT_DIR}"

# Ensure Insight CLI is available
install_insight

# Parse mode and execute
case "${MODE}" in
    pr|--mode=pr)
        run_pr_analysis
        ;;
    main|--mode=main)
        run_main_analysis
        ;;
    nightly|--mode=nightly)
        run_nightly_analysis
        ;;
    *)
        error "Invalid mode: ${MODE}. Use: pr, main, or nightly"
        ;;
esac

# ────────────────────────────────────────────────────────────
# Usage Examples:
#
# PR Analysis:
#   ./insight.sh pr origin/main
#   ./insight.sh --mode=pr --baseline-ref origin/develop
#
# Main Branch:
#   ./insight.sh main
#
# Nightly:
#   ./insight.sh nightly
# ────────────────────────────────────────────────────────────
