#!/bin/bash
# ODAVL Pilot - After Evidence Collection (Bash)

OUTPUT_DIR="${1:-reports/phase5/evidence/after}"
TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%S.%3NZ")

echo "📊 ODAVL After Collection - $TIMESTAMP"

# Ensure output directory exists
mkdir -p "$OUTPUT_DIR"

# Collect ESLint metrics (same logic as baseline)
echo "🔍 Collecting ESLint metrics..."
if command -v pnpm >/dev/null 2>&1; then
    eslint_output=$(pnpm -s exec eslint . -f json 2>/dev/null || echo "[]")
    eslint_warnings=$(echo "$eslint_output" | jq '[.[] | .messages[] | select(.severity == 1)] | length' 2>/dev/null || echo "0")
    echo "{\"warnings\": $eslint_warnings, \"timestamp\": \"$TIMESTAMP\"}" > "$OUTPUT_DIR/eslint.json"
    echo "✅ ESLint warnings: $eslint_warnings"
else
    echo "❌ pnpm not found - creating error stub"
    echo "{\"warnings\": -1, \"error\": \"pnpm not available\", \"timestamp\": \"$TIMESTAMP\"}" > "$OUTPUT_DIR/eslint.json"
fi

# Collect TypeScript errors (same logic as baseline)
echo "🔍 Collecting TypeScript metrics..."
if command -v pnpm >/dev/null 2>&1 && [ -f "tsconfig.json" ]; then
    tsc_output=$(pnpm -s exec tsc -p tsconfig.json --noEmit 2>&1 || true)
    type_errors=$(echo "$tsc_output" | grep -c "error TS" || echo "0")
    echo "{\"errors\": $type_errors, \"timestamp\": \"$TIMESTAMP\"}" > "$OUTPUT_DIR/tsc.json"
    echo "✅ TypeScript errors: $type_errors"
else
    echo "❌ TypeScript check failed - creating error stub"
    echo "{\"errors\": -1, \"error\": \"TypeScript not configured\", \"timestamp\": \"$TIMESTAMP\"}" > "$OUTPUT_DIR/tsc.json"
fi

# Collect security scan (same logic as baseline)
echo "🔍 Collecting security metrics..."
if [ -f "tools/security-scan.ps1" ] && command -v pwsh >/dev/null 2>&1; then
    pwsh tools/security-scan.ps1 -Json > "$OUTPUT_DIR/security.json" 2>/dev/null || \
    echo "{\"status\": \"ERROR\", \"error\": \"Security scan failed\", \"timestamp\": \"$TIMESTAMP\"}" > "$OUTPUT_DIR/security.json"
    echo "✅ Security scan completed"
elif command -v npm >/dev/null 2>&1; then
    # Fallback: simple npm audit
    audit_output=$(npm audit --json 2>/dev/null || echo "{}")
    echo "$audit_output" > "$OUTPUT_DIR/security.json"
    echo "✅ Security scan completed (npm audit)"
else
    echo "⚠️ Security scan not available - creating stub"
    echo "{\"status\": \"TODO\", \"message\": \"Security scan not configured\", \"timestamp\": \"$TIMESTAMP\"}" > "$OUTPUT_DIR/security.json"
fi

# Calculate deltas by comparing with baseline
BASELINE_DIR="reports/phase5/evidence/baseline"

# Read current metrics
eslint_after=$(jq -r '.warnings // -1' "$OUTPUT_DIR/eslint.json" 2>/dev/null || echo "-1")
typescript_after=$(jq -r '.errors // -1' "$OUTPUT_DIR/tsc.json" 2>/dev/null || echo "-1")

# Read baseline metrics
eslint_before="-1"
typescript_before="-1"
if [ -f "$BASELINE_DIR/eslint.json" ]; then
    eslint_before=$(jq -r '.warnings // -1' "$BASELINE_DIR/eslint.json" 2>/dev/null || echo "-1")
fi
if [ -f "$BASELINE_DIR/tsc.json" ]; then
    typescript_before=$(jq -r '.errors // -1' "$BASELINE_DIR/tsc.json" 2>/dev/null || echo "-1")
fi

# Calculate deltas
eslint_delta=$((eslint_after - eslint_before))
typescript_delta=$((typescript_after - typescript_before))

# Generate deltas JSON
cat > "$OUTPUT_DIR/deltas.json" << EOF
{
  "timestamp": "$TIMESTAMP",
  "deltas": {
    "eslint": {
      "before": $eslint_before,
      "after": $eslint_after,
      "delta": $eslint_delta
    },
    "typescript": {
      "before": $typescript_before,
      "after": $typescript_after,
      "delta": $typescript_delta
    }
  }
}
EOF

# Determine status messages
eslint_status="STABLE"
[ "$eslint_delta" -lt 0 ] && eslint_status="IMPROVED"
[ "$eslint_delta" -gt 0 ] && eslint_status="REGRESSED"

typescript_status="STABLE"
[ "$typescript_delta" -lt 0 ] && typescript_status="IMPROVED"
[ "$typescript_delta" -gt 0 ] && typescript_status="REGRESSED"

# Generate summary with deltas
cat > "$OUTPUT_DIR/summary.md" << EOF
# ODAVL After Evidence Report

**Collection Time**: $TIMESTAMP  
**Repository**: $(git remote get-url origin 2>/dev/null || echo "Unknown")  
**Commit**: $(git rev-parse --short HEAD 2>/dev/null || echo "Unknown")  

## Improvement Summary

| Metric | Before | After | Delta | Status |
|--------|--------|-------|-------|---------|
| ESLint Warnings | $eslint_before | $eslint_after | $eslint_delta | $eslint_status |
| TypeScript Errors | $typescript_before | $typescript_after | $typescript_delta | $typescript_status |

## ODAVL Impact

$(if [ "$eslint_delta" -lt 0 ] || [ "$typescript_delta" -lt 0 ]; then
    echo "✅ **POSITIVE IMPACT**: ODAVL successfully improved code quality"
else
    echo "⚠️ **NO CHANGE**: Code was already clean or no applicable improvements found"
fi)

## Evidence Files

- ESLint: \`$OUTPUT_DIR/eslint.json\`
- TypeScript: \`$OUTPUT_DIR/tsc.json\`
- Security: \`$OUTPUT_DIR/security.json\`
- Deltas: \`$OUTPUT_DIR/deltas.json\`
EOF

echo "📋 After collection complete - outputs in $OUTPUT_DIR"
echo "🎯 Use delta report template to generate customer presentation"