#!/bin/bash
# ODAVL Pilot - Baseline Evidence Collection (Bash)
# Collects ESLint, TypeScript, and Security metrics before ODAVL improvements

set -euo pipefail

# Default parameters
OUTPUT_DIR="${1:-reports/phase5/evidence/baseline}"
JSON_MODE="${2:-false}"

TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%S.%3NZ")
PROJECT_ROOT=$(pwd)

echo "🔍 ODAVL Baseline Evidence Collection - $TIMESTAMP"
echo "📁 Project: $PROJECT_ROOT"

# Ensure output directory exists
mkdir -p "$OUTPUT_DIR"

# Initialize results
cat > "$OUTPUT_DIR/baseline-complete.json" << EOF
{
  "timestamp": "$TIMESTAMP",
  "projectRoot": "$PROJECT_ROOT",
  "eslint": {},
  "typescript": {},
  "security": {},
  "summary": {}
}
EOF

# ESLint Analysis
echo "📋 Collecting ESLint metrics..."
if command -v pnpm &> /dev/null; then
    if pnpm -s exec eslint . -f json > "$OUTPUT_DIR/eslint.json" 2>/dev/null; then
        # Parse ESLint JSON output
        WARNING_COUNT=$(jq '[.[] | .messages[] | select(.severity == 1)] | length' "$OUTPUT_DIR/eslint.json" 2>/dev/null || echo "0")
        ERROR_COUNT=$(jq '[.[] | .messages[] | select(.severity == 2)] | length' "$OUTPUT_DIR/eslint.json" 2>/dev/null || echo "0")
        FILES_WITH_ISSUES=$(jq '[.[] | select(.messages | length > 0)] | length' "$OUTPUT_DIR/eslint.json" 2>/dev/null || echo "0")
        TOTAL_FILES=$(jq 'length' "$OUTPUT_DIR/eslint.json" 2>/dev/null || echo "0")
        
        echo "  ✅ ESLint: $WARNING_COUNT warnings, $ERROR_COUNT errors in $FILES_WITH_ISSUES files"
        
        # Update results JSON
        jq --arg warnings "$WARNING_COUNT" --arg errors "$ERROR_COUNT" \
           --arg files "$FILES_WITH_ISSUES" --arg total "$TOTAL_FILES" \
           '.eslint = {warnings: ($warnings | tonumber), errors: ($errors | tonumber), filesWithIssues: ($files | tonumber), totalFiles: ($total | tonumber)}' \
           "$OUTPUT_DIR/baseline-complete.json" > "$OUTPUT_DIR/baseline-complete.tmp" && mv "$OUTPUT_DIR/baseline-complete.tmp" "$OUTPUT_DIR/baseline-complete.json"
    else
        echo "  ⚠️ ESLint: No output received"
        jq '.eslint = {warnings: 0, errors: 0, filesWithIssues: 0, status: "no-output"}' \
           "$OUTPUT_DIR/baseline-complete.json" > "$OUTPUT_DIR/baseline-complete.tmp" && mv "$OUTPUT_DIR/baseline-complete.tmp" "$OUTPUT_DIR/baseline-complete.json"
    fi
else
    echo "  ❌ pnpm not found"
    jq '.eslint = {status: "failed", error: "pnpm not found"}' \
       "$OUTPUT_DIR/baseline-complete.json" > "$OUTPUT_DIR/baseline-complete.tmp" && mv "$OUTPUT_DIR/baseline-complete.tmp" "$OUTPUT_DIR/baseline-complete.json"
fi

# TypeScript Analysis
echo "🔧 Collecting TypeScript diagnostics..."
if command -v pnpm &> /dev/null; then
    TSC_OUTPUT=$(pnpm -s exec tsc -p tsconfig.json --noEmit 2>&1 || true)
    echo "$TSC_OUTPUT" > "$OUTPUT_DIR/tsc.txt"
    
    TYPE_ERRORS=$(echo "$TSC_OUTPUT" | grep -c "error TS" || echo "0")
    echo "  ✅ TypeScript: $TYPE_ERRORS compilation errors"
    
    # Save TypeScript results
    jq -n --arg errors "$TYPE_ERRORS" --arg output "$TSC_OUTPUT" \
       '{errors: ($errors | tonumber), output: $output}' > "$OUTPUT_DIR/tsc.json"
    
    # Update results JSON
    jq --arg errors "$TYPE_ERRORS" \
       '.typescript = {errors: ($errors | tonumber)}' \
       "$OUTPUT_DIR/baseline-complete.json" > "$OUTPUT_DIR/baseline-complete.tmp" && mv "$OUTPUT_DIR/baseline-complete.tmp" "$OUTPUT_DIR/baseline-complete.json"
else
    echo "  ❌ TypeScript collection failed: pnpm not found"
    jq '.typescript = {status: "failed", error: "pnpm not found"}' \
       "$OUTPUT_DIR/baseline-complete.json" > "$OUTPUT_DIR/baseline-complete.tmp" && mv "$OUTPUT_DIR/baseline-complete.tmp" "$OUTPUT_DIR/baseline-complete.json"
fi

# Security Analysis
echo "🔒 Collecting security metrics..."
if [[ -f "tools/security-scan.ps1" ]] && command -v pwsh &> /dev/null; then
    # Use existing PowerShell security scanner
    if pwsh -File "tools/security-scan.ps1" -Json > "$OUTPUT_DIR/security.json" 2>/dev/null; then
        HIGH_CVES=$(jq '.vulnerabilities.high // 0' "$OUTPUT_DIR/security.json")
        SECURITY_STATUS=$(jq -r '.status // "unknown"' "$OUTPUT_DIR/security.json")
        echo "  ✅ Security: $HIGH_CVES high CVEs, status: $SECURITY_STATUS"
        
        # Update results JSON
        jq --argjson security "$(cat "$OUTPUT_DIR/security.json")" \
           '.security = $security' \
           "$OUTPUT_DIR/baseline-complete.json" > "$OUTPUT_DIR/baseline-complete.tmp" && mv "$OUTPUT_DIR/baseline-complete.tmp" "$OUTPUT_DIR/baseline-complete.json"
    else
        echo "  ⚠️ Security scanner failed - trying npm audit"
        if npm audit --json > "$OUTPUT_DIR/security.json" 2>/dev/null; then
            HIGH_CVES=$(jq '[.vulnerabilities // {} | to_entries[] | .value | select(.severity == "high")] | length' "$OUTPUT_DIR/security.json" 2>/dev/null || echo "0")
            SECURITY_STATUS=$(if [[ "$HIGH_CVES" -gt 0 ]]; then echo "FAIL"; else echo "PASS"; fi)
            echo "  ✅ Security (npm audit): $HIGH_CVES high CVEs"
            
            jq --arg high "$HIGH_CVES" --arg status "$SECURITY_STATUS" \
               '.security = {vulnerabilities: {high: ($high | tonumber)}, status: $status}' \
               "$OUTPUT_DIR/baseline-complete.json" > "$OUTPUT_DIR/baseline-complete.tmp" && mv "$OUTPUT_DIR/baseline-complete.tmp" "$OUTPUT_DIR/baseline-complete.json"
        else
            echo "  ❌ Security scan unavailable"
            jq '.security = {status: "unavailable"}' \
               "$OUTPUT_DIR/baseline-complete.json" > "$OUTPUT_DIR/baseline-complete.tmp" && mv "$OUTPUT_DIR/baseline-complete.tmp" "$OUTPUT_DIR/baseline-complete.json"
        fi
    fi
else
    echo "  ⚠️ Security scanner not found - trying npm audit"
    if command -v npm &> /dev/null && npm audit --json > "$OUTPUT_DIR/security.json" 2>/dev/null; then
        HIGH_CVES=$(jq '[.vulnerabilities // {} | to_entries[] | .value | select(.severity == "high")] | length' "$OUTPUT_DIR/security.json" 2>/dev/null || echo "0")
        echo "  ✅ Security (npm audit): $HIGH_CVES high CVEs"
        
        jq --arg high "$HIGH_CVES" \
           '.security = {vulnerabilities: {high: ($high | tonumber)}, status: (if ($high | tonumber) > 0 then "FAIL" else "PASS" end)}' \
           "$OUTPUT_DIR/baseline-complete.json" > "$OUTPUT_DIR/baseline-complete.tmp" && mv "$OUTPUT_DIR/baseline-complete.tmp" "$OUTPUT_DIR/baseline-complete.json"
    else
        echo "  ❌ Security analysis failed"
        jq '.security = {status: "failed"}' \
           "$OUTPUT_DIR/baseline-complete.json" > "$OUTPUT_DIR/baseline-complete.tmp" && mv "$OUTPUT_DIR/baseline-complete.tmp" "$OUTPUT_DIR/baseline-complete.json"
    fi
fi

# Generate Summary
ESLINT_WARNINGS=$(jq '.eslint.warnings // 0' "$OUTPUT_DIR/baseline-complete.json")
ESLINT_ERRORS=$(jq '.eslint.errors // 0' "$OUTPUT_DIR/baseline-complete.json")
TYPE_ERRORS=$(jq '.typescript.errors // 0' "$OUTPUT_DIR/baseline-complete.json")
SECURITY_STATUS=$(jq -r '.security.status // "unknown"' "$OUTPUT_DIR/baseline-complete.json")
HIGH_CVES=$(jq '.security.vulnerabilities.high // 0' "$OUTPUT_DIR/baseline-complete.json")

jq --arg eslintWarnings "$ESLINT_WARNINGS" --arg eslintErrors "$ESLINT_ERRORS" \
   --arg typeErrors "$TYPE_ERRORS" --arg securityStatus "$SECURITY_STATUS" \
   --arg highCVEs "$HIGH_CVES" \
   '.summary = {
     eslintWarnings: ($eslintWarnings | tonumber),
     eslintErrors: ($eslintErrors | tonumber),
     typeErrors: ($typeErrors | tonumber),
     securityStatus: $securityStatus,
     highCVEs: ($highCVEs | tonumber),
     collectionComplete: true
   }' \
   "$OUTPUT_DIR/baseline-complete.json" > "$OUTPUT_DIR/baseline-complete.tmp" && mv "$OUTPUT_DIR/baseline-complete.tmp" "$OUTPUT_DIR/baseline-complete.json"

# Generate markdown summary
cat > "$OUTPUT_DIR/summary.md" << EOF
# ODAVL Baseline Evidence Report

**Generated**: $TIMESTAMP  
**Project**: $PROJECT_ROOT

## Code Quality Metrics

### ESLint Analysis
- **Warnings**: $ESLINT_WARNINGS
- **Errors**: $ESLINT_ERRORS

### TypeScript Analysis  
- **Compilation Errors**: $TYPE_ERRORS

### Security Analysis
- **Status**: $SECURITY_STATUS
- **High Severity CVEs**: $HIGH_CVES

## Next Steps
1. Run ODAVL improvement cycle
2. Execute collect-after.sh to capture improvements
3. Generate before/after comparison report

---
*Report generated by ODAVL Pilot Evidence Collection*
EOF

if [[ "$JSON_MODE" == "true" ]]; then
    cat "$OUTPUT_DIR/baseline-complete.json"
else
    echo ""
    echo "📊 Baseline Collection Complete"
    echo "  📁 Reports saved to: $OUTPUT_DIR"
    echo "  📋 ESLint: $ESLINT_WARNINGS warnings, $ESLINT_ERRORS errors"
    echo "  🔧 TypeScript: $TYPE_ERRORS errors"
    echo "  🔒 Security: $SECURITY_STATUS ($HIGH_CVES high CVEs)"
fi

exit 0
