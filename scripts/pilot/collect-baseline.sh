#!/bin/bash
# ODAVL Pilot - Baseline Evidence Collection (Bash)

OUTPUT_DIR="${1:-reports/phase5/evidence/baseline}"
TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%S.%3NZ")

echo "📊 ODAVL Baseline Collection - $TIMESTAMP"

# Ensure output directory exists
mkdir -p "$OUTPUT_DIR"

# Collect ESLint metrics
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

# Collect TypeScript errors  
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

# Collect security scan (check for existing script)
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

# Read collected metrics for summary
eslint_count=$(jq -r '.warnings // -1' "$OUTPUT_DIR/eslint.json" 2>/dev/null || echo "-1")
typescript_count=$(jq -r '.errors // -1' "$OUTPUT_DIR/tsc.json" 2>/dev/null || echo "-1")
security_status=$(jq -r '.status // "UNKNOWN"' "$OUTPUT_DIR/security.json" 2>/dev/null || echo "UNKNOWN")

# Generate summary report
cat > "$OUTPUT_DIR/summary.md" << EOF
# ODAVL Baseline Evidence Report

**Collection Time**: $TIMESTAMP  
**Repository**: $(git remote get-url origin 2>/dev/null || echo "Unknown")  
**Commit**: $(git rev-parse --short HEAD 2>/dev/null || echo "Unknown")  

## Metrics Summary

| Metric | Count | Status |
|--------|-------|---------|
| ESLint Warnings | $eslint_count | $([ "$eslint_count" = "-1" ] && echo "ERROR" || [ "$eslint_count" = "0" ] && echo "CLEAN" || echo "ISSUES") |
| TypeScript Errors | $typescript_count | $([ "$typescript_count" = "-1" ] && echo "ERROR" || [ "$typescript_count" = "0" ] && echo "CLEAN" || echo "ISSUES") |
| Security Status | $security_status | $([ "$security_status" = "PASS" ] && echo "SECURE" || [ "$security_status" = "TODO" ] && echo "PENDING" || echo "REVIEW") |

## Next Steps

1. Run ODAVL improvement cycle: \`odavl run\`
2. Collect after metrics: \`./scripts/pilot/collect-after.sh\`
3. Generate delta report using before/after templates
EOF

echo "📋 Baseline collection complete - outputs in $OUTPUT_DIR"
echo "🎯 Run 'odavl run' to apply improvements, then collect after metrics"