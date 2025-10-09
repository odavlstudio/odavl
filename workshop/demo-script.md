# ODAVL Workshop Demo Script

## Preparation Checklist
- [ ] Sample repository with ESLint warnings prepared
- [ ] ODAVL Studio extension loaded in VS Code
- [ ] Terminal ready with `pnpm` commands
- [ ] Screen sharing and recording active
- [ ] Backup scenarios prepared for failure cases

## Phase 1: Installation & Setup (10-25 minutes)

### Environment Validation
```bash
# Verify Node.js version
node --version  # Should be v18+
pnpm --version  # Should be latest

# Clone sample repository (or use existing)
git clone https://github.com/your-org/sample-ts-project
cd sample-ts-project
```

**Expected Output**: Version numbers displayed, repository cloned successfully

**Fallback**: If Node.js missing, guide through installation or use pre-prepared environment

### ODAVL Installation
```bash
# Install dependencies
pnpm install

# Verify ODAVL CLI is available
pnpm odavl:observe
```

**Expected Output**: 
```json
{
  "eslintWarnings": 5,
  "typeErrors": 0,
  "timestamp": "2025-10-09T..."
}
```

**Fallback**: If installation fails, use pre-built environment or troubleshoot npm registry issues

### VS Code Extension Setup
1. Open VS Code in project directory: `code .`
2. Install ODAVL extension: `./apps/vscode-ext/odavl.vsix`
3. Activate Doctor mode: Ctrl+Shift+P → "ODAVL: Doctor Mode"

**Expected Output**: Doctor mode indicator in status bar, real-time cycle monitoring available

## Phase 2: First ODAVL Cycle Demo (25-45 minutes)

### Observe Phase
```bash
# Collect baseline metrics
pnpm odavl:observe
```

**Narrative**: "ODAVL starts by observing the current state. It's collecting ESLint warnings and TypeScript errors to establish a baseline before making any changes."

**Expected Output**: JSON metrics showing current issues

### Decide Phase  
```bash
# Let ODAVL choose the optimal recipe
pnpm odavl:decide
```

**Narrative**: "The decide phase uses machine learning to select the safest, most effective recipe based on past success rates. Notice how it considers trust scores from previous runs."

**Expected Output**: Recipe selection (e.g., "remove-unused" or "esm-hygiene")

### Act Phase
```bash
# Execute the chosen recipe
pnpm odavl:act
```

**Narrative**: "Now ODAVL is making the actual changes. It's running ESLint --fix and other safe transformations. Notice how it creates an undo snapshot first."

**Expected Output**: Files modified, undo snapshot created

### Verify Phase
```bash  
# Run verification with shadow testing
pnpm odavl:verify
```

**Narrative**: "This is where the safety magic happens. Shadow verification runs all tests in isolation to ensure nothing broke. Quality gates check that we improved without causing regressions."

**Expected Output**: 
```json
{
  "deltas": { "eslint": -3, "types": 0 },
  "gatesPassed": true,
  "shadowVerify": "PASS"
}
```

### Complete Cycle
```bash
# Run full autonomous cycle
pnpm odavl:run
```

**Expected Output**: Complete before/after summary with metrics improvement

## Phase 3: Safety Mechanisms Demo (45-65 minutes)

### Shadow Verification Deep Dive
```bash
# Show shadow testing logs
cat .odavl/shadow/verify.log
```

**Narrative**: "Shadow verification is like having a second opinion. It runs your entire test suite in isolation to catch any breaking changes before they're committed."

### Undo System Demonstration
```bash
# Intentionally break something (demo only)
echo "intentional syntax error;" >> src/index.ts

# Run ODAVL - should detect failure
pnmp odavl:run

# Demonstrate automatic undo
pnpm odavl:run undo
```

**Expected Output**: Automatic rollback to safe state, project restored

### Evidence Collection
```bash
# Generate before/after report
./scripts/pilot/collect-baseline.ps1
# (make changes)
./scripts/pilot/collect-after.ps1
```

**Expected Output**: Comprehensive report with metrics, CVE status, and improvement evidence

## Phase 4: Live Repository Demo (65-80 minutes)

### Repository Assessment
**Script**: 
1. "Now let's run this on your actual repository"
2. "First, let's assess the current state and identify safe improvements"
3. "We'll create a governed PR with ≤10 files and ≤40 lines changed"

```bash
# Switch to participant repository
cd /path/to/participant/repo

# Safety check - ensure branch protection
git status
git checkout -b odavl-pilot-demo

# Collect baseline
pnpm odavl:observe
```

### Supervised Execution
```bash
# Run supervised cycle with explanation
pnpm odavl:run --verbose
```

**Expected Output**: Safe improvements applied, PR ready for review

### PR Review Process
**Script**:
1. "Let's review what ODAVL changed"
2. "Notice how it stays within governance constraints" 
3. "The evidence shows clear improvement without risks"

```bash
# Show diff
git diff main...odavl-pilot-demo

# Push for PR
git push -u origin odavl-pilot-demo
```

## Troubleshooting & Fallbacks

### Common Issues
**No ESLint warnings found**: 
- Use pre-prepared sample repository with known issues
- Manually introduce safe warnings (unused imports)

**TypeScript compilation fails**:
- Ensure tsconfig.json is properly configured  
- Use simpler TypeScript setup for demo

**Permission/Access issues**:
- Have backup repositories ready
- Use local file system demos if network fails

**Extension not loading**:
- Reload VS Code window
- Check extension installation logs
- Fall back to CLI-only demo

### Recovery Scripts
```bash
# Reset to clean state
git reset --hard HEAD
git clean -fd

# Clear ODAVL state
rm -rf .odavl reports/

# Restart demo from beginning
pnpm odavl:observe
```

## Success Indicators
- [ ] Participant can run ODAVL commands independently
- [ ] At least one successful autonomous fix demonstrated
- [ ] Safety mechanisms (undo, gates) validated
- [ ] Evidence report generated with real metrics
- [ ] PR created and reviewed successfully
- [ ] Participant expresses confidence in proceeding

## Post-Workshop Actions
- [ ] Share generated evidence reports
- [ ] Provide two-week pilot timeline  
- [ ] Exchange support contact information
- [ ] Schedule follow-up check-in meeting
- [ ] Document any custom requirements or concerns
