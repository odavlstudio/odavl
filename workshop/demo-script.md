# ODAVL Workshop Demo Script

**Purpose**: Step-by-step demonstration flow for 90-minute ODAVL workshop  
**Context**: Live coding session with real repository improvements  

## Pre-Demo Setup

### Environment Verification
```bash
# Verify Node.js version
node --version  # Should be 18+

# Install ODAVL CLI globally
npm install -g @odavl/cli

# Verify installation
odavl --version
```

### Repository Preparation
```bash
# Clone demo repository (placeholder - Mohammad to provide actual repo)
git clone https://github.com/odavl-studio/demo-workshop-repo.git
cd demo-workshop-repo

# Or use participant's repository
git checkout -b odavl-pilot-demo
```

### VS Code Extension Setup
```bash
# Install ODAVL extension from provided VSIX
code --install-extension odavl-0.1.1.vsix

# Verify installation
code --list-extensions | grep odavl
```

## Demo Flow

### Step 1: Observe Phase (5 minutes)
**Objective**: Show ODAVL's diagnostic capabilities

```bash
# Run observation to collect baseline metrics
odavl observe

# Expected output example:
# [OBSERVE] ESLint warnings: 12, Type errors: 3
```

**Talking Points**:
- ODAVL analyzes code quality using standard tools (ESLint, TypeScript)
- Metrics are captured with timestamps for trend tracking
- No code changes made during observation - pure analysis

**Fallback**: If no issues found, use prepared sample repo with intentional issues

### Step 2: Decide Phase (3 minutes)
**Objective**: Demonstrate intelligent decision-making

```bash
# Show decision logic
odavl decide

# Expected output example:
# [DECIDE] Selected recipe: remove-unused (trust 0.9)
```

**Talking Points**:
- ODAVL maintains trust scores for different improvement recipes
- Decisions based on current metrics and historical success rates
- Conservative approach: only high-confidence improvements are selected

### Step 3: Act Phase (5 minutes)
**Objective**: Show autonomous code improvements

```bash
# Execute improvements
odavl act

# Show what changed
git diff --stat
git diff
```

**Talking Points**:
- Changes are applied automatically but with strict safety limits
- Git integration provides full audit trail
- All changes reversible with built-in undo system

### Step 4: Verify Phase (7 minutes)
**Objective**: Demonstrate safety validation

```bash
# Run verification
odavl verify

# Expected output example:
# [VERIFY] Gates check: PASS ✅
# [DONE] ESLint warnings: 12 → 8 (Δ -4) | Type errors: 3 → 0 (Δ -3)
```

**Talking Points**:
- Quality gates ensure changes meet improvement thresholds
- Shadow verification runs tests in isolated environment
- Cryptographic attestation for successful improvements

### Step 5: Learn Phase (3 minutes)
**Objective**: Show continuous improvement system

```bash
# Check generated reports
ls reports/
cat reports/run-*.json

# Show trust learning
cat .odavl/recipes-trust.json
```

**Talking Points**:
- ODAVL learns from each run to improve future decisions
- Trust scores automatically adjusted based on outcomes
- Enterprise audit trail for compliance and debugging

### Step 6: VS Code Integration (5 minutes)
**Objective**: Show developer experience improvements

```bash
# Open VS Code with ODAVL extension
code .

# Run ODAVL Doctor mode
# Press Ctrl+Shift+P → "ODAVL: Doctor Mode"
```

**Talking Points**:
- Real-time ODAVL cycle monitoring in VS Code
- Visual indicators for each phase of autonomous improvement
- Integration with existing developer workflow

### Step 7: Undo Demonstration (3 minutes)
**Objective**: Show safety and control

```bash
# Undo the last ODAVL changes
odavl undo

# Verify restoration
git status
git log --oneline -3
```

**Talking Points**:
- One-command rollback of any ODAVL changes
- Automatic snapshots before any modifications
- Complete audit trail maintained

## Troubleshooting & Fallbacks

### No Issues Found
- Use pre-prepared repository with intentional ESLint warnings
- Create temporary unused variables for demonstration
- Show how ODAVL handles "clean" codebases

### Installation Issues
- Have offline installer packages ready
- Provide alternative demo using recorded session
- Use participant's machine if presenter setup fails

### Network/Repository Issues
- Have local clone of demo repository ready
- Use USB drive with complete workshop materials
- Provide step-by-step written instructions as backup

## Success Indicators

- [ ] Complete ODAVL cycle executed successfully
- [ ] Before/after metrics clearly demonstrated
- [ ] Safety mechanisms (verify, undo) shown working
- [ ] Participants ask technical implementation questions
- [ ] At least one "aha moment" about autonomous approach