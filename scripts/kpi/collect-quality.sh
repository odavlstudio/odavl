#!/bin/bash
# ODAVL KPI - Quality Metrics Collection (Bash)
# Collects ESLint and TypeScript metrics and records quality_snapshot event

set -euo pipefail

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
RECORD_EVENT_SCRIPT="$SCRIPT_DIR/record-event.sh"

# Default parameters
REPO_PATH="${1:-$(pwd)}"
AUTO_RECORD="${2:-true}"

echo "📊 ODAVL Quality Metrics Collection"
echo "📁 Repository: $REPO_PATH"

# Change to repository directory
cd "$REPO_PATH"

# Initialize metrics
ESLINT_TOTAL=0
TS_ERRORS_TOTAL=0
FILES_WITH_ISSUES=0
TOTAL_FILES=0

# ESLint Analysis
echo "📋 Collecting ESLint metrics..."
if command -v pnpm &> /dev/null; then
    if pnpm -s exec eslint . -f json > /tmp/eslint-output.json 2>/dev/null; then
        # Parse ESLint JSON output
        ESLINT_WARNINGS=$(jq '[.[] | .messages[] | select(.severity == 1)] | length' /tmp/eslint-output.json 2>/dev/null || echo "0")
        ESLINT_ERRORS=$(jq '[.[] | .messages[] | select(.severity == 2)] | length' /tmp/eslint-output.json 2>/dev/null || echo "0")
        FILES_WITH_ISSUES=$(jq '[.[] | select(.messages | length > 0)] | length' /tmp/eslint-output.json 2>/dev/null || echo "0")
        TOTAL_FILES=$(jq 'length' /tmp/eslint-output.json 2>/dev/null || echo "0")
        
        # Combine warnings and errors for total
        ESLINT_TOTAL=$((ESLINT_WARNINGS + ESLINT_ERRORS))
        
        echo "  ✅ ESLint: $ESLINT_WARNINGS warnings, $ESLINT_ERRORS errors in $FILES_WITH_ISSUES/$TOTAL_FILES files"
        
        # Clean up temp file
        rm -f /tmp/eslint-output.json
    else
        echo "  ⚠️ ESLint: Could not run analysis"
    fi
else
    echo "  ❌ pnpm not found, skipping ESLint analysis"
fi

# TypeScript Analysis
echo "🔧 Collecting TypeScript diagnostics..."
if command -v pnpm &> /dev/null; then
    TSC_OUTPUT=$(pnpm -s exec tsc -p tsconfig.json --noEmit 2>&1 || true)
    TS_ERRORS_TOTAL=$(echo "$TSC_OUTPUT" | grep -c "error TS" || echo "0")
    echo "  ✅ TypeScript: $TS_ERRORS_TOTAL compilation errors"
else
    echo "  ❌ pnpm not found, skipping TypeScript analysis"
fi

# Build metrics JSON
METRICS_JSON=$(jq -n \
    --arg eslint_total "$ESLINT_TOTAL" \
    --arg ts_errors_total "$TS_ERRORS_TOTAL" \
    --arg files_with_issues "$FILES_WITH_ISSUES" \
    --arg total_files "$TOTAL_FILES" \
    '{
        eslint_total: ($eslint_total | tonumber),
        ts_errors_total: ($ts_errors_total | tonumber),
        files_with_issues: ($files_with_issues | tonumber),
        total_files: ($total_files | tonumber)
    }')

echo ""
echo "📈 Quality Metrics Summary:"
echo "  ESLint Issues: $ESLINT_TOTAL"
echo "  TypeScript Errors: $TS_ERRORS_TOTAL"
echo "  Files with Issues: $FILES_WITH_ISSUES"
echo "  Total Files Analyzed: $TOTAL_FILES"

# Record event if auto-record is enabled
if [[ "$AUTO_RECORD" == "true" ]]; then
    echo ""
    echo "📝 Recording quality_snapshot event..."
    
    if [[ -x "$RECORD_EVENT_SCRIPT" ]]; then
        "$RECORD_EVENT_SCRIPT" \
            type=quality_snapshot \
            repo="$REPO_PATH" \
            notes="Automated quality metrics collection" \
            metrics="$METRICS_JSON"
    else
        echo "  ⚠️ Event recording script not found or not executable: $RECORD_EVENT_SCRIPT"
    fi
fi

# Output JSON for automation
if [[ "${3:-}" == "--json" ]]; then
    jq -n \
        --arg timestamp "$(date -u +"%Y-%m-%dT%H:%M:%S.%3NZ")" \
        --arg repo "$REPO_PATH" \
        --argjson metrics "$METRICS_JSON" \
        '{
            timestamp: $timestamp,
            repo: $repo,
            metrics: $metrics
        }'
fi

echo ""
echo "✅ Quality metrics collection complete"