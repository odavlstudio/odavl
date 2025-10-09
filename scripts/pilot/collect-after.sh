#!/bin/bash
# ODAVL Pilot - After Evidence Collection (Bash)
# Collects metrics after ODAVL improvements and generates delta analysis

set -euo pipefail

# Default parameters
OUTPUT_DIR="${1:-reports/phase5/evidence/after}"
BASELINE_DIR="${2:-reports/phase5/evidence/baseline}"
JSON_MODE="${3:-false}"

TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%S.%3NZ")
PROJECT_ROOT=$(pwd)

echo "📈 ODAVL After Evidence Collection - $TIMESTAMP"

# Ensure output directory exists
mkdir -p "$OUTPUT_DIR"

# Load baseline for comparison
BASELINE_FILE="$BASELINE_DIR/baseline-complete.json"
if [[ -f "$BASELINE_FILE" ]]; then
    echo "📋 Loaded baseline from $BASELINE_DIR"
    BASELINE_ESLINT_WARNINGS=$(jq '.summary.eslintWarnings // 0' "$BASELINE_FILE")
    BASELINE_ESLINT_ERRORS=$(jq '.summary.eslintErrors // 0' "$BASELINE_FILE")
    BASELINE_TYPE_ERRORS=$(jq '.summary.typeErrors // 0' "$BASELINE_FILE")
    BASELINE_HIGH_CVES=$(jq '.summary.highCVEs // 0' "$BASELINE_FILE")
    HAS_BASELINE=true
else
    echo "⚠️ No baseline found - only current metrics available"
    HAS_BASELINE=false
fi

# Collect current metrics using baseline script
echo "🔍 Collecting current metrics..."
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
"$SCRIPT_DIR/collect-baseline.sh" "$OUTPUT_DIR" "true" > "$OUTPUT_DIR/current-metrics.json"

# Extract current values
CURRENT_ESLINT_WARNINGS=$(jq '.summary.eslintWarnings // 0' "$OUTPUT_DIR/current-metrics.json")
CURRENT_ESLINT_ERRORS=$(jq '.summary.eslintErrors // 0' "$OUTPUT_DIR/current-metrics.json")
CURRENT_TYPE_ERRORS=$(jq '.summary.typeErrors // 0' "$OUTPUT_DIR/current-metrics.json")
CURRENT_HIGH_CVES=$(jq '.summary.highCVEs // 0' "$OUTPUT_DIR/current-metrics.json")
CURRENT_SECURITY_STATUS=$(jq -r '.summary.securityStatus // "unknown"' "$OUTPUT_DIR/current-metrics.json")

# Calculate deltas if baseline exists
if [[ "$HAS_BASELINE" == "true" ]]; then
    DELTA_ESLINT_WARNINGS=$((CURRENT_ESLINT_WARNINGS - BASELINE_ESLINT_WARNINGS))
    DELTA_ESLINT_ERRORS=$((CURRENT_ESLINT_ERRORS - BASELINE_ESLINT_ERRORS))
    DELTA_TYPE_ERRORS=$((CURRENT_TYPE_ERRORS - BASELINE_TYPE_ERRORS))
    DELTA_HIGH_CVES=$((CURRENT_HIGH_CVES - BASELINE_HIGH_CVES))
    
    # Determine improvements
    ESLINT_WARNINGS_IMPROVED=$(if [[ $DELTA_ESLINT_WARNINGS -lt 0 ]]; then echo "true"; else echo "false"; fi)
    ESLINT_ERRORS_IMPROVED=$(if [[ $DELTA_ESLINT_ERRORS -lt 0 ]]; then echo "true"; else echo "false"; fi)
    TYPE_ERRORS_IMPROVED=$(if [[ $DELTA_TYPE_ERRORS -le 0 ]]; then echo "true"; else echo "false"; fi)
    SECURITY_IMPROVED=$(if [[ $DELTA_HIGH_CVES -le 0 ]]; then echo "true"; else echo "false"; fi)
else
    DELTA_ESLINT_WARNINGS="null"
    DELTA_ESLINT_ERRORS="null"
    DELTA_TYPE_ERRORS="null"
    DELTA_HIGH_CVES="null"
    ESLINT_WARNINGS_IMPROVED="false"
    ESLINT_ERRORS_IMPROVED="false"
    TYPE_ERRORS_IMPROVED="false"
    SECURITY_IMPROVED="false"
fi

# Create comprehensive results JSON
cat > "$OUTPUT_DIR/after-complete.json" << EOF
{
  "timestamp": "$TIMESTAMP",
  "current": {
    "eslintWarnings": $CURRENT_ESLINT_WARNINGS,
    "eslintErrors": $CURRENT_ESLINT_ERRORS,
    "typeErrors": $CURRENT_TYPE_ERRORS,
    "securityStatus": "$CURRENT_SECURITY_STATUS",
    "highCVEs": $CURRENT_HIGH_CVES
  },
  "baseline": $(if [[ "$HAS_BASELINE" == "true" ]]; then jq '.summary' "$BASELINE_FILE"; else echo "null"; fi),
  "deltas": {
    "eslintWarnings": $DELTA_ESLINT_WARNINGS,
    "eslintErrors": $DELTA_ESLINT_ERRORS,
    "typeErrors": $DELTA_TYPE_ERRORS,
    "highCVEs": $DELTA_HIGH_CVES
  },
  "improvements": {
    "eslintWarningsReduced": $ESLINT_WARNINGS_IMPROVED,
    "eslintErrorsReduced": $ESLINT_ERRORS_IMPROVED,
    "typeErrorsReduced": $TYPE_ERRORS_IMPROVED,
    "securityImproved": $SECURITY_IMPROVED
  }
}
EOF

# Generate comparison report
cat > "$OUTPUT_DIR/comparison.md" << EOF
# ODAVL After Evidence Report

**Generated**: $TIMESTAMP  
**Project**: $PROJECT_ROOT

## Current Metrics

### ESLint Analysis
- **Warnings**: $CURRENT_ESLINT_WARNINGS
- **Errors**: $CURRENT_ESLINT_ERRORS

### TypeScript Analysis
- **Compilation Errors**: $CURRENT_TYPE_ERRORS

### Security Analysis  
- **Status**: $CURRENT_SECURITY_STATUS
- **High Severity CVEs**: $CURRENT_HIGH_CVES

EOF

if [[ "$HAS_BASELINE" == "true" ]]; then
    # Add delta analysis
    ESLINT_WARNINGS_STATUS=$(if [[ $DELTA_ESLINT_WARNINGS -lt 0 ]]; then echo "✅ Improved"; elif [[ $DELTA_ESLINT_WARNINGS -eq 0 ]]; then echo "➖ No change"; else echo "❌ Increased"; fi)
    ESLINT_ERRORS_STATUS=$(if [[ $DELTA_ESLINT_ERRORS -lt 0 ]]; then echo "✅ Improved"; elif [[ $DELTA_ESLINT_ERRORS -eq 0 ]]; then echo "➖ No change"; else echo "❌ Increased"; fi)
    TYPE_ERRORS_STATUS=$(if [[ $DELTA_TYPE_ERRORS -lt 0 ]]; then echo "✅ Improved"; elif [[ $DELTA_TYPE_ERRORS -eq 0 ]]; then echo "➖ No change"; else echo "❌ Increased"; fi)
    HIGH_CVES_STATUS=$(if [[ $DELTA_HIGH_CVES -lt 0 ]]; then echo "✅ Improved"; elif [[ $DELTA_HIGH_CVES -eq 0 ]]; then echo "➖ No change"; else echo "❌ Increased"; fi)
    
    OVERALL_STATUS=$(if [[ "$ESLINT_WARNINGS_IMPROVED" == "true" || "$TYPE_ERRORS_IMPROVED" == "true" ]]; then echo "✅ **SUCCESS**: Code quality improvements detected"; else echo "⚠️ **REVIEW**: No significant improvements detected"; fi)
    
    cat >> "$OUTPUT_DIR/comparison.md" << EOF

## Comparison with Baseline

### Changes (Delta)
- **ESLint Warnings**: $DELTA_ESLINT_WARNINGS ($ESLINT_WARNINGS_STATUS)
- **ESLint Errors**: $DELTA_ESLINT_ERRORS ($ESLINT_ERRORS_STATUS)
- **TypeScript Errors**: $DELTA_TYPE_ERRORS ($TYPE_ERRORS_STATUS)
- **High CVEs**: $DELTA_HIGH_CVES ($HIGH_CVES_STATUS)

### Overall Assessment
$OVERALL_STATUS

EOF
else
    cat >> "$OUTPUT_DIR/comparison.md" << EOF

## Baseline Comparison
*No baseline data available for comparison*

EOF
fi

cat >> "$OUTPUT_DIR/comparison.md" << EOF

## Next Steps
1. Review delta analysis for any unexpected changes
2. Validate that improvements align with ODAVL goals  
3. Generate final success story report
4. Proceed with pilot expansion if results are positive

---
*Report generated by ODAVL Pilot Evidence Collection*
EOF

if [[ "$JSON_MODE" == "true" ]]; then
    cat "$OUTPUT_DIR/after-complete.json"
else
    echo ""
    echo "📊 After Collection Complete"
    echo "  📁 Reports saved to: $OUTPUT_DIR"
    if [[ "$HAS_BASELINE" == "true" ]]; then
        echo "  📋 ESLint Warnings: $DELTA_ESLINT_WARNINGS delta"
        echo "  🔧 TypeScript Errors: $DELTA_TYPE_ERRORS delta"  
        echo "  🔒 High CVEs: $DELTA_HIGH_CVES delta"
        if [[ "$ESLINT_WARNINGS_IMPROVED" == "true" || "$TYPE_ERRORS_IMPROVED" == "true" ]]; then
            echo "  ✅ Overall: Improvements detected!"
        fi
    else
        echo "  📋 Current ESLint: $CURRENT_ESLINT_WARNINGS warnings, $CURRENT_ESLINT_ERRORS errors"
        echo "  🔧 Current TypeScript: $CURRENT_TYPE_ERRORS errors"
        echo "  🔒 Current Security: $CURRENT_SECURITY_STATUS ($CURRENT_HIGH_CVES high CVEs)"
    fi
fi

exit 0
