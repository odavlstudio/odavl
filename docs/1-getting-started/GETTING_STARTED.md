# 🚀 Getting Started with ODAVL Studio

**Your comprehensive guide to autonomous code quality - from installation to your first improvements.**

---

## 📋 Table of Contents

1. [What is ODAVL Studio?](#what-is-odavl-studio)
2. [Quick Start (5 Minutes)](#quick-start-5-minutes)
3. [Installation](#installation)
4. [Your First Analysis](#your-first-analysis)
5. [Configuration](#configuration)
6. [Your First Autopilot Cycle](#your-first-autopilot-cycle)
7. [Dashboard Setup](#dashboard-setup)
8. [Next Steps](#next-steps)
9. [Troubleshooting](#troubleshooting)

---

## 🎯 What is ODAVL Studio?

**ODAVL Studio** is a unified platform for autonomous code quality with three distinct products:

### 1️⃣ **ODAVL Insight** - ML-Powered Error Detection
- **12 specialized detectors**: TypeScript, ESLint, Import, Package, Runtime, Build, Security, Circular, Network, Performance, Complexity, Isolation
- **Real-time analysis**: Integrates with VS Code Problems Panel
- **AI-powered suggestions**: Automatic fix recommendations
- **ML training**: Learns from your codebase over time

### 2️⃣ **ODAVL Autopilot** - Self-Healing Code Infrastructure
- **O-D-A-V-L Cycle**: Observe → Decide → Act → Verify → Learn
- **Triple-layer safety**: Risk Budget → Undo Snapshots → Attestation Chain
- **Recipe system**: Reusable improvement patterns with trust scores
- **Audit trail**: Complete history of all automated changes

### 3️⃣ **ODAVL Guardian** - Pre-Deploy Testing & Monitoring
- **Quality gates**: Accessibility, Performance, Security, SEO
- **Pre-deploy verification**: Block deployments that fail standards
- **Compliance tracking**: WCAG, GDPR, security best practices
- **Continuous monitoring**: Track quality metrics over time

---

## ⚡ Quick Start (5 Minutes)

Get ODAVL Studio running in 5 minutes:

```bash
# 1. Install CLI globally
npm install -g @odavl-studio/cli

# 2. Navigate to your project
cd /path/to/your/project

# 3. Initialize ODAVL
odavl init

# 4. Run your first analysis
odavl insight analyze

# 5. View results
# Check VS Code Problems Panel or terminal output
```

**That's it!** You've just analyzed your codebase with 12 specialized detectors.

---

## 📦 Installation

### Prerequisites

- **Node.js**: v18.18 or higher
- **pnpm**: v8 or higher (recommended) or npm/yarn
- **Git**: For version control integration
- **VS Code**: For extension features (optional)

### Method 1: CLI Installation (Recommended)

```bash
# Using npm
npm install -g @odavl-studio/cli

# Using pnpm (faster)
pnpm add -g @odavl-studio/cli

# Using yarn
yarn global add @odavl-studio/cli

# Verify installation
odavl --version
```

### Method 2: SDK Installation (For Integration)

```bash
# In your project directory
npm install @odavl-studio/sdk

# Or with pnpm
pnpm add @odavl-studio/sdk

# Or with yarn
yarn add @odavl-studio/sdk
```

### Method 3: VS Code Extensions

Install from VS Code Marketplace:

1. **ODAVL Insight** - Real-time error detection
   - Open VS Code
   - Press `Ctrl+Shift+X` (Extensions)
   - Search: "ODAVL Insight"
   - Click "Install"

2. **ODAVL Autopilot** - Automated improvements monitor
   - Search: "ODAVL Autopilot"
   - Click "Install"

3. **ODAVL Guardian** - Quality gate enforcement
   - Search: "ODAVL Guardian"
   - Click "Install"

### Method 4: Local Development (Contributors)

```bash
# Clone repository
git clone https://github.com/odavl-studio/odavl-studio.git
cd odavl-studio

# Install dependencies
pnpm install

# Build all packages
pnpm build

# Link CLI globally
cd apps/studio-cli
pnpm link --global
```

---

## 🔍 Your First Analysis

### Step 1: Initialize ODAVL in Your Project

```bash
# Navigate to your project
cd /path/to/your/project

# Initialize (creates .odavl/ directory)
odavl init
```

**What happens:**
- Creates `.odavl/` directory
- Generates default `gates.yml` (governance rules)
- Sets up `recipes/` folder
- Initializes `history.json` (run tracking)

### Step 2: Run Analysis

```bash
# Analyze entire workspace
odavl insight analyze

# Analyze with specific detectors
odavl insight analyze --detectors typescript,eslint,security

# Analyze specific directory
odavl insight analyze --path src/

# Output to JSON file
odavl insight analyze --output results.json
```

### Step 3: Understanding Results

**Terminal Output:**

```
🔍 ODAVL Insight Analysis
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📊 Summary
  Total Issues:     142
  Critical:         3   🔴
  High:             12  🟠
  Medium:           67  🟡
  Low:              60  🟢

📁 Issues by Detector
  typescript:       45 issues
  eslint:           38 issues
  security:         3 issues (CRITICAL)
  import:           12 issues
  circular:         8 issues
  performance:      15 issues
  complexity:       21 issues

⚠️  Top 5 Critical Issues
  1. [security] Hardcoded API key detected
     src/config/api.ts:15:23
     💡 Suggestion: Move to environment variable

  2. [security] SQL injection vulnerability
     src/db/queries.ts:42:10
     💡 Suggestion: Use parameterized queries

  3. [security] XSS vulnerability in HTML output
     src/components/UserProfile.tsx:89:15
     💡 Suggestion: Sanitize user input

🕐 Analysis completed in 12.3s
📝 Results exported to .odavl/problems-panel-export.json
```

**VS Code Problems Panel:**

If you have the ODAVL Insight extension installed, all issues appear in the Problems Panel:

- Click any issue to jump to the exact location
- Hover for detailed description
- Right-click for fix suggestions
- Filter by severity or detector

### Step 4: Get Fix Suggestions

```bash
# Get AI-powered fix for specific issue
odavl insight fix --file src/config/api.ts --line 15

# Interactive mode (choose from list)
odavl insight fix --interactive
```

**Example Output:**

```
💡 Fix Suggestion for: Hardcoded API key

Current Code:
  const API_KEY = 'sk-1234567890abcdef';

Recommended Fix:
  const API_KEY = process.env.API_KEY;
  
  // In .env file:
  API_KEY=sk-1234567890abcdef

Explanation:
  Hardcoded secrets pose a security risk. Move sensitive
  data to environment variables that are never committed
  to version control.

Apply fix? (y/n):
```

### Step 5: Export Results

```bash
# Export to JSON
odavl insight analyze --output results.json

# Export to Problems Panel format
odavl insight export --format problems-panel

# Export to CSV for reporting
odavl insight export --format csv --output report.csv
```

---

## ⚙️ Configuration

### Default Configuration Structure

After running `odavl init`, your `.odavl/` directory looks like this:

```
.odavl/
├── gates.yml              # Governance rules
├── recipes-trust.json     # Recipe trust scores
├── history.json           # Run history
├── problems-panel-export.json
├── attestation/           # SHA-256 proofs
├── undo/                  # File snapshots
├── ledger/                # Run ledgers
├── recipes/               # Improvement recipes
├── logs/                  # Execution logs
└── metrics/               # Performance metrics
```

### Configure Governance Rules (gates.yml)

**File:** `.odavl/gates.yml`

```yaml
# Risk budget and constraints
risk_budget: 100

# Paths that autopilot should never modify
forbidden_paths:
  - security/**
  - public-api/**
  - "**/*.spec.*"
  - "**/*.test.*"
  - auth/**
  - billing/**

# Action limits
actions:
  max_auto_changes: 10      # Max files per cycle
  max_files_per_cycle: 10   # Same as above
  max_loc_per_file: 40      # Max lines changed per file

# Enforcement rules
enforcement:
  - block_if_risk_exceeded
  - rollback_on_failure
  - require_attestation

# Quality thresholds
thresholds:
  max_risk_per_action: 25
  min_success_rate: 0.75
  max_consecutive_failures: 3

# Detector configuration
detectors:
  typescript:
    enabled: true
    severity: high
  eslint:
    enabled: true
    severity: medium
  security:
    enabled: true
    severity: critical
  import:
    enabled: true
    severity: medium
  circular:
    enabled: true
    severity: high
  performance:
    enabled: true
    severity: medium
  complexity:
    enabled: true
    severity: low
```

### Configure Detectors

Create **`.odavl/detectors.json`**:

```json
{
  "detectors": {
    "typescript": {
      "enabled": true,
      "strictMode": true,
      "noImplicitAny": true
    },
    "eslint": {
      "enabled": true,
      "config": ".eslintrc.json",
      "rules": {
        "no-console": "warn",
        "no-debugger": "error"
      }
    },
    "security": {
      "enabled": true,
      "checkHardcodedSecrets": true,
      "checkSqlInjection": true,
      "checkXss": true
    },
    "performance": {
      "enabled": true,
      "maxComplexity": 10,
      "maxFileSize": 500
    }
  }
}
```

### Environment Variables

Create **`.env`** in project root:

```bash
# ODAVL Configuration
ODAVL_LOG_LEVEL=info          # debug | info | warn | error
ODAVL_CONFIG_PATH=.odavl/      # Config directory
ODAVL_NO_COLOR=false           # Disable colored output
ODAVL_MAX_WORKERS=4            # Parallel analysis workers

# Insight Configuration
ODAVL_INSIGHT_TIMEOUT=60000    # Analysis timeout (ms)
ODAVL_INSIGHT_CACHE=true       # Enable result caching

# Autopilot Configuration
ODAVL_AUTOPILOT_MAX_FILES=10   # Max files per cycle
ODAVL_AUTOPILOT_MAX_LOC=40     # Max LOC per file
ODAVL_AUTOPILOT_DRY_RUN=false  # Dry run mode

# Guardian Configuration
ODAVL_GUARDIAN_ACCESSIBILITY=90  # Min score
ODAVL_GUARDIAN_PERFORMANCE=85    # Min score
ODAVL_GUARDIAN_SECURITY=95       # Min score
ODAVL_GUARDIAN_SEO=80            # Min score
```

### VS Code Settings

Add to **`.vscode/settings.json`**:

```json
{
  "odavl.enablePerfMetrics": true,
  "odavl.autoOpenLedger": true,
  "odavl.analyzeOnSave": true,
  "odavl.detectors": [
    "typescript",
    "eslint",
    "security",
    "import"
  ],
  "odavl.insight.showInProblems": true,
  "odavl.autopilot.confirmBeforeRun": true,
  "odavl.guardian.blockOnFailure": true
}
```

---

## 🤖 Your First Autopilot Cycle

**Autopilot** automatically improves your codebase using the **O-D-A-V-L** cycle.

### Understanding O-D-A-V-L

1. **Observe** - Analyze current state (metrics collection)
2. **Decide** - Choose improvement recipe (based on trust scores)
3. **Act** - Apply changes (with undo snapshot)
4. **Verify** - Confirm improvements (re-run checks)
5. **Learn** - Update trust scores (success/failure feedback)

### Step 1: Dry Run (Recommended First Time)

```bash
# See what autopilot would do without making changes
odavl autopilot run --dry-run

# Limit files for safety
odavl autopilot run --dry-run --max-files 3
```

**Output:**

```
🤖 ODAVL Autopilot - Dry Run Mode
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Phase 1/5: Observe
  ✓ Collected metrics
  ✓ TypeScript errors: 12
  ✓ ESLint warnings: 24
  ✓ Lint errors: 8

Phase 2/5: Decide
  ✓ Loaded 15 recipes
  ✓ Selected: "fix-missing-semicolons" (trust: 0.95)
  ✓ Target files: 5 (within limit)

Phase 3/5: Act (DRY RUN)
  Would modify:
    - src/utils/helpers.ts (3 LOC)
    - src/components/Button.tsx (2 LOC)
    - src/hooks/useAuth.ts (1 LOC)

Phase 4/5: Verify (DRY RUN)
  Would verify:
    - TypeScript check
    - ESLint check
    - Git diff review

Phase 5/5: Learn (DRY RUN)
  Would update trust scores based on success

⚠️  Dry run complete - no files were modified
```

### Step 2: Run Individual Phases (Learning Mode)

```bash
# Run phases one at a time to understand each step

# 1. Observe phase
odavl autopilot observe
# Output: metrics snapshot saved to .odavl/metrics/

# 2. Decide phase
odavl autopilot decide
# Output: selected recipe and plan

# 3. Act phase (with confirmation)
odavl autopilot act --confirm
# Asks: "Apply 3 changes to 3 files? (y/n)"

# 4. Verify phase
odavl autopilot verify
# Re-runs quality checks

# 5. Learn phase
odavl autopilot learn
# Updates recipe trust scores
```

### Step 3: Full Cycle (Production Mode)

```bash
# Run full O-D-A-V-L cycle
odavl autopilot run

# With custom constraints
odavl autopilot run --max-files 5 --max-loc 20

# Interactive mode (confirm each change)
odavl autopilot run --interactive
```

**Output:**

```
🤖 ODAVL Autopilot
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Run ID: run-1732387654321

Phase 1/5: Observe ✓ (2.1s)
  Metrics collected: ✓
  Baseline established: ✓

Phase 2/5: Decide ✓ (0.8s)
  Recipe: "fix-missing-semicolons"
  Trust score: 0.95
  Target files: 3

Phase 3/5: Act ✓ (1.2s)
  Undo snapshot saved: ✓
  Modified files:
    ✓ src/utils/helpers.ts (+3 LOC)
    ✓ src/components/Button.tsx (+2 LOC)
    ✓ src/hooks/useAuth.ts (+1 LOC)

Phase 4/5: Verify ✓ (3.4s)
  TypeScript: ✓ (0 errors)
  ESLint: ✓ (0 errors)
  Quality gates: ✓ (all passed)
  Attestation hash: 8f7e3b9a...

Phase 5/5: Learn ✓ (0.3s)
  Trust score updated: 0.95 → 0.96
  Success recorded: ✓

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ Cycle complete! 3 files improved.
📊 Run ledger: .odavl/ledger/run-1732387654321.json
🔙 Undo available: odavl autopilot undo
```

### Step 4: Review Changes

```bash
# View ledger
cat .odavl/ledger/run-1732387654321.json

# Check git diff
git diff

# View attestation
cat .odavl/attestation/run-1732387654321.json
```

**Ledger Example:**

```json
{
  "runId": "run-1732387654321",
  "startedAt": "2025-11-23T14:30:54.321Z",
  "finishedAt": "2025-11-23T14:31:02.156Z",
  "phase": "learn",
  "success": true,
  "planPath": ".odavl/recipes/fix-missing-semicolons.json",
  "edits": [
    {
      "path": "src/utils/helpers.ts",
      "diffLoc": 3,
      "linesAdded": 3,
      "linesRemoved": 0
    }
  ],
  "notes": "Fixed missing semicolons in 3 files",
  "metrics": {
    "before": { "errorCount": 12, "warningCount": 24 },
    "after": { "errorCount": 9, "warningCount": 24 }
  }
}
```

### Step 5: Undo if Needed

```bash
# Undo last change
odavl autopilot undo

# Undo specific snapshot
odavl autopilot undo --snapshot run-1732387654321

# View undo history
ls -la .odavl/undo/
```

---

## 📊 Dashboard Setup

### ODAVL Insight Cloud Dashboard

**1. Start the Dashboard:**

```bash
# If installed from source
cd odavl-studio/insight/cloud
pnpm install
pnpm dev

# Dashboard opens at http://localhost:3001
```

**2. Configure Database (First Time):**

```bash
# Set up PostgreSQL
# In .env file:
DATABASE_URL="postgresql://user:password@localhost:5432/odavl_insight"

# Run migrations
npx prisma migrate dev

# Seed sample data (optional)
npx prisma db seed
```

**3. Login:**

- Navigate to `http://localhost:3001`
- Create account or login
- Connect your workspace

**4. Dashboard Features:**

- **Overview**: Total issues, trends, detector breakdown
- **Issues**: Filterable list of all detected issues
- **History**: Analysis run history with metrics
- **Detectors**: Enable/disable detectors, configure settings
- **Reports**: Generate PDF/CSV reports for stakeholders
- **Settings**: Configure thresholds, notifications, integrations

### ODAVL Guardian Dashboard

**1. Start the Dashboard:**

```bash
# If installed from source
cd odavl-studio/guardian/app
pnpm install
pnpm dev

# Dashboard opens at http://localhost:3002
```

**2. Run Your First Test:**

```bash
# Via CLI
odavl guardian test https://your-app.com

# Or via dashboard
# Navigate to "New Test" → Enter URL → Click "Run Tests"
```

**3. Dashboard Features:**

- **Test History**: All pre-deploy test runs
- **Quality Gates**: Configure thresholds
- **Accessibility**: WCAG compliance checks
- **Performance**: Lighthouse metrics
- **Security**: OWASP Top 10 checks
- **Reports**: Deployment approval reports

---

## 🎯 Next Steps

### 1. Set Up CI/CD Integration

Add ODAVL to your CI/CD pipeline:

**GitHub Actions Example:**

```yaml
# .github/workflows/quality.yml
name: ODAVL Quality Check

on: [push, pull_request]

jobs:
  quality:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 18
      
      - name: Install ODAVL CLI
        run: npm install -g @odavl-studio/cli
      
      - name: Run Analysis
        run: odavl insight analyze --output results.json
      
      - name: Check Critical Issues
        run: |
          CRITICAL=$(jq '.summary.criticalIssues' results.json)
          if [ "$CRITICAL" -gt 0 ]; then
            echo "❌ Found $CRITICAL critical issues"
            exit 1
          fi
```

See [CLI_INTEGRATION.md](./CLI_INTEGRATION.md) for complete CI/CD examples.

### 2. Create Custom Recipes

**Example Recipe:** `.odavl/recipes/remove-console-logs.json`

```json
{
  "id": "remove-console-logs",
  "name": "Remove Console Logs",
  "description": "Remove console.log statements from production code",
  "trust": 0.8,
  "action": {
    "type": "eslint-fix",
    "rule": "no-console",
    "files": ["src/**/*.ts", "src/**/*.tsx"],
    "exclude": ["**/*.test.*", "**/*.spec.*"]
  },
  "constraints": {
    "maxFiles": 20,
    "maxLOC": 1
  },
  "verification": {
    "runTests": true,
    "checkTypes": true,
    "checkLint": true
  }
}
```

### 3. Configure Pre-commit Hooks

```bash
# Install Husky
npx husky-init && npm install

# Add ODAVL to pre-commit
echo 'odavl insight analyze --detectors security,typescript' > .husky/pre-commit
chmod +x .husky/pre-commit
```

### 4. Set Up Scheduled Analysis

**Linux/macOS (cron):**

```bash
# Add to crontab
crontab -e

# Run analysis every day at 2 AM
0 2 * * * cd /path/to/project && odavl autopilot run --max-files 5
```

**Windows (Task Scheduler):**

```powershell
# Create scheduled task
$action = New-ScheduledTaskAction -Execute "odavl" -Argument "autopilot run"
$trigger = New-ScheduledTaskTrigger -Daily -At 2am
Register-ScheduledTask -TaskName "ODAVL-Autopilot" -Action $action -Trigger $trigger
```

### 5. Integrate with Team Workflow

- **Daily Standup**: Review autopilot changes from previous day
- **PR Reviews**: Check ODAVL comments on PRs
- **Sprint Planning**: Review technical debt from Insight
- **Deployment**: Guardian checks before production

### 6. Explore Advanced Features

- **ML Training**: `odavl insight train` - Train on your codebase
- **Custom Detectors**: Create domain-specific detectors
- **Recipe Marketplace**: Share recipes with community
- **Team Analytics**: Track team code quality metrics
- **Integration API**: Build custom integrations

---

## 🔧 Troubleshooting

### Common Issues

#### Issue: "Command not found: odavl"

**Solution:**

```bash
# Verify installation
npm list -g @odavl-studio/cli

# Reinstall if needed
npm install -g @odavl-studio/cli

# Check PATH
echo $PATH

# Add npm global bin to PATH (if needed)
export PATH="$PATH:$(npm root -g)/../bin"
```

#### Issue: "Analysis timeout exceeded"

**Solution:**

```bash
# Increase timeout
odavl insight analyze --timeout 120000  # 2 minutes

# Or set environment variable
export ODAVL_INSIGHT_TIMEOUT=120000

# Analyze smaller subset
odavl insight analyze --path src/components/
```

#### Issue: "Permission denied accessing .odavl/"

**Solution:**

```bash
# Fix permissions
chmod -R 755 .odavl/

# Check ownership
ls -la .odavl/

# Fix ownership if needed
chown -R $USER:$USER .odavl/
```

#### Issue: "TypeScript check fails after autopilot"

**Solution:**

```bash
# Undo last change
odavl autopilot undo

# Run with stricter verification
odavl autopilot run --verify strict

# Check protected paths in gates.yml
cat .odavl/gates.yml
```

#### Issue: "VS Code extension not showing issues"

**Solution:**

1. Check extension is activated:
   - Press `Ctrl+Shift+P`
   - Type "ODAVL: Analyze Workspace"
   - Click to run

2. Verify settings:
   ```json
   {
     "odavl.insight.showInProblems": true,
     "odavl.analyzeOnSave": true
   }
   ```

3. Reload window:
   - Press `Ctrl+Shift+P`
   - Type "Developer: Reload Window"

#### Issue: "Guardian tests fail with network error"

**Solution:**

```bash
# Check URL is accessible
curl -I https://your-app.com

# Use localhost for development
odavl guardian test http://localhost:3000

# Configure timeout
export ODAVL_GUARDIAN_TIMEOUT=60000
```

### Getting Help

- **Documentation**: [docs.odavl.studio](https://docs.odavl.studio)
- **GitHub Issues**: [github.com/odavl-studio/odavl-studio/issues](https://github.com/odavl-studio/odavl-studio/issues)
- **Discord**: [discord.gg/odavl](https://discord.gg/odavl)
- **Email**: support@odavl.studio

### Debug Mode

```bash
# Enable debug logging
export ODAVL_LOG_LEVEL=debug

# Run with verbose output
odavl insight analyze --verbose

# Check logs
tail -f .odavl/logs/odavl.log
```

---

## 📚 Additional Resources

### Documentation

- **[CLI Reference](./CLI_REFERENCE.md)** - Complete CLI command reference
- **[CLI Integration](./CLI_INTEGRATION.md)** - CI/CD and automation
- **[SDK Reference](./SDK_REFERENCE.md)** - SDK API documentation
- **[SDK Integration](./SDK_INTEGRATION.md)** - Integration examples
- **[Architecture](./ARCHITECTURE_COMPLETE.md)** - System architecture
- **[Best Practices](./BEST_PRACTICES.md)** - Development guidelines
- **[Contributing](./CONTRIBUTING_COMPLETE.md)** - Contribution guide

### Video Tutorials

- **ODAVL Studio Introduction** (5 min)
- **Insight Quick Start** (10 min)
- **Autopilot Workflow** (15 min)
- **Guardian Testing** (10 min)

### Example Projects

- **Next.js + ODAVL**: [examples/nextjs-integration](../examples/nextjs-integration)
- **Express API**: [examples/express-api](../examples/express-api)
- **Monorepo Setup**: [examples/monorepo](../examples/monorepo)

---

## 🎉 You're Ready!

You now have:

✅ ODAVL CLI installed and configured  
✅ Understanding of all three products  
✅ First analysis completed  
✅ Autopilot cycle executed  
✅ Dashboard running  
✅ CI/CD integration knowledge  

**Start improving your codebase autonomously with ODAVL Studio!**

---

**Questions?** Join our [Discord community](https://discord.gg/odavl) or check the [docs](https://docs.odavl.studio).

**Built with ❤️ by ODAVL Studio Team**
