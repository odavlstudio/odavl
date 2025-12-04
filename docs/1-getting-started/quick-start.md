# ODAVL Studio - Quick Start Guide

**Get started with ODAVL Studio in 5 minutes!**

## What is ODAVL Studio?

ODAVL Studio is a unified platform for autonomous code quality with three products:

- 🔍 **Insight** - AI-powered error detection (12 specialized detectors)
- ⚡ **Autopilot** - Self-healing code infrastructure (O-D-A-V-L cycle)
- 🛡️ **Guardian** - Pre-deploy testing & monitoring

## Installation

### 1. Install VS Code Extensions

Download the latest release and install all three extensions:

```bash
# Download .vsix files from GitHub releases, then:
code --install-extension odavl-insight-vscode-2.0.0.vsix
code --install-extension odavl-autopilot-vscode-2.0.0.vsix
code --install-extension odavl-guardian-vscode-2.0.0.vsix
```

**Or install manually:**
1. Open VS Code
2. Press `Ctrl+Shift+X` (Extensions)
3. Click `...` menu → "Install from VSIX..."
4. Select each .vsix file

### 2. Install CLI (Optional)

```bash
# Global installation
pnpm add -g @odavl-studio/cli

# Or project-specific
pnpm add -D @odavl-studio/cli
```

## Using ODAVL Insight

**Real-time error detection in VS Code**

1. Open any TypeScript/JavaScript project
2. Save a file (`Ctrl+S`)
3. Check **Problems Panel** (`Ctrl+Shift+M`)
4. See ODAVL issues alongside TypeScript/ESLint errors

**Example output:**
```
PROBLEMS (8)
├─ ODAVL/security: Hardcoded API key detected (file.ts:42) ❌
├─ ODAVL/network: Missing timeout in fetch() (api.ts:18) ⚠️
├─ ODAVL/complexity: High cyclomatic complexity (utils.ts:96) ℹ️
└─ ODAVL/performance: Potential memory leak (service.ts:15) 💡
```

**Run full analysis:**
```
Ctrl+Shift+P → "ODAVL Insight: Analyze Workspace"
```

**Configuration:**
```json
// .vscode/settings.json
{
  "odavl-insight.autoAnalyzeOnSave": true,
  "odavl-insight.enabledDetectors": [
    "typescript",
    "eslint",
    "security",
    "performance"
  ]
}
```

## Using ODAVL Autopilot

**Self-healing code automation**

1. Open Command Palette (`Ctrl+Shift+P`)
2. Type "ODAVL Autopilot: Run Full Cycle"
3. Watch the O-D-A-V-L cycle execute:
   - **Observe**: Detect issues (eslint, tsc)
   - **Decide**: Select best recipe (trust scoring)
   - **Act**: Apply improvements (with undo snapshot)
   - **Verify**: Enforce quality gates
   - **Learn**: Update trust scores

**Undo changes:**
```
Ctrl+Shift+P → "ODAVL Autopilot: Undo Last Change"
```

**View execution details:**
```
Ctrl+Shift+P → "ODAVL Autopilot: View Ledger"
```

**Safety features:**
- ✅ Max 10 files per cycle
- ✅ Max 40 LOC per file
- ✅ Protected paths (security/, auth/)
- ✅ Automatic undo snapshots
- ✅ Cryptographic attestation

**Configuration:**
```json
// .vscode/settings.json
{
  "odavl-autopilot.autoOpenLedger": true,
  "odavl-autopilot.maxFiles": 10,
  "odavl-autopilot.maxLOC": 40
}
```

## Using ODAVL Guardian

**Pre-deploy testing & validation**

1. Configure your URLs:
```json
// .vscode/settings.json
{
  "odavl-guardian.stagingUrl": "https://staging.myapp.com",
  "odavl-guardian.productionUrl": "https://myapp.com"
}
```

2. Run tests:
```
Ctrl+Shift+P → "ODAVL Guardian: Run Pre-Deploy Tests"
```

**Test types:**
- ♿ **Accessibility**: WCAG 2.1 AA compliance
- ⚡ **Performance**: Lighthouse scores, Core Web Vitals
- 🔒 **Security**: OWASP checks, vulnerability scanning
- 🔍 **SEO**: Meta tags, sitemap validation

**Example output:**
```
✅ Accessibility: 98/100 (WCAG AA compliant)
⚠️  Performance: 72/100 (Needs optimization)
✅ Security: 95/100 (No critical vulnerabilities)
✅ SEO: 88/100 (Good meta coverage)
```

## Using CLI

**All products available via unified CLI:**

```bash
# Show all commands
odavl --help

# Insight analysis
odavl insight analyze --detectors typescript,eslint,security

# Autopilot cycle
odavl autopilot run --max-files 10

# Guardian tests
odavl guardian test https://your-site.com
```

## Using SDK (Programmatic Access)

```typescript
import { Insight, Autopilot, Guardian } from '@odavl-studio/sdk';

// Error detection
const insight = new Insight({ apiKey: 'your-key' });
const results = await insight.analyze({
  workspace: '/path/to/project',
  detectors: ['typescript', 'security']
});

// Self-healing
const autopilot = new Autopilot({ apiKey: 'your-key' });
const ledger = await autopilot.runCycle({
  workspace: '/path/to/project',
  maxFiles: 10
});

// Quality testing
const guardian = new Guardian({ apiKey: 'your-key' });
const scores = await guardian.runTests({
  url: 'https://your-site.com',
  tests: ['accessibility', 'performance']
});
```

## Governance & Safety

**ODAVL uses triple-layer protection:**

1. **Risk Budget Guard**
   - Max 10 files per automated change
   - Max 40 LOC per file modification
   - Protected paths never auto-edited

2. **Undo Snapshots**
   - Automatic backups before changes
   - Stored in `.odavl/undo/<timestamp>.json`
   - One-click rollback via extension

3. **Attestation Chain**
   - SHA-256 cryptographic proofs
   - Every improvement auditable
   - Stored in `.odavl/attestation/`

## Project Structure

```
.odavl/
├── history.json              # Run history with trust scoring
├── recipes-trust.json        # Recipe success rates (ML feedback)
├── gates.yml                 # Governance rules
├── problems-panel-export.json # VS Code diagnostics export
├── attestation/              # SHA-256 improvement proofs
├── undo/                     # File snapshots (timestamped)
├── ledger/                   # Run ledgers (edit summaries)
├── recipes/                  # Improvement recipes (JSON)
├── logs/                     # Phase execution logs
├── audit/                    # Audit trail
├── guardian/                 # Guardian test results
└── insight/                  # Insight analysis outputs
```

## Common Workflows

### Workflow 1: Daily Development (Insight)

1. Open project in VS Code
2. Code as usual
3. Save files (`Ctrl+S`)
4. Check Problems Panel for ODAVL issues
5. Click any issue to navigate to location
6. Fix manually or wait for Autopilot suggestion

### Workflow 2: Automated Code Quality (Autopilot)

1. Let issues accumulate (develop normally)
2. Run Autopilot cycle: `Ctrl+Shift+P` → "Run Full Cycle"
3. Review ledger (auto-opens after cycle)
4. If happy: commit changes
5. If not: `Undo Last Change` and adjust gates.yml

### Workflow 3: Pre-Deploy Validation (Guardian)

1. Complete feature development
2. Push to staging environment
3. Configure staging URL in settings
4. Run: `Ctrl+Shift+P` → "Run Pre-Deploy Tests"
5. Review scores (must meet quality gates)
6. Fix issues if any tests fail
7. Deploy to production only after passing

### Workflow 4: CLI Automation (CI/CD)

```bash
# In your CI/CD pipeline:

# 1. Analyze code
odavl insight analyze --detectors all --format json > insight-report.json

# 2. Run autopilot (with strict gates)
odavl autopilot run --max-files 5 --dry-run

# 3. Test staging
odavl guardian test $STAGING_URL --min-score 80

# 4. If all pass, deploy
if [ $? -eq 0 ]; then
  deploy-to-production
fi
```

## Configuration Examples

### Minimal Configuration

```json
// .vscode/settings.json
{
  "odavl-insight.autoAnalyzeOnSave": true,
  "odavl-autopilot.autoOpenLedger": true,
  "odavl-guardian.stagingUrl": "https://staging.example.com"
}
```

### Advanced Configuration

```json
// .vscode/settings.json
{
  "odavl-insight.autoAnalyzeOnSave": true,
  "odavl-insight.enabledDetectors": [
    "typescript",
    "eslint",
    "security",
    "performance",
    "complexity"
  ],
  "odavl-autopilot.autoOpenLedger": true,
  "odavl-autopilot.maxFiles": 5,
  "odavl-autopilot.maxLOC": 30,
  "odavl-guardian.stagingUrl": "https://staging.example.com",
  "odavl-guardian.productionUrl": "https://example.com"
}
```

### Project Gates

```yaml
# .odavl/gates.yml
risk_budget: 100
forbidden_paths:
  - security/**
  - public-api/**
  - "**/*.spec.*"
  - auth/**
actions:
  max_auto_changes: 10
  max_files_per_cycle: 10
enforcement:
  - block_if_risk_exceeded
  - rollback_on_failure
  - require_attestation
thresholds:
  max_risk_per_action: 25
  min_success_rate: 0.75
  max_consecutive_failures: 3
```

## Troubleshooting

### Extension not activating

**Problem**: Extension installed but no ODAVL issues in Problems Panel

**Solutions**:
1. Check VS Code version (need 1.80.0+)
2. Check Node.js version (18.18+ or 20.0+)
3. Reload VS Code: `Ctrl+Shift+P` → "Reload Window"
4. Check extension is enabled: Extensions view → ODAVL → Enable

### CLI not found

**Problem**: `odavl: command not found`

**Solutions**:
1. Install globally: `pnpm add -g @odavl-studio/cli`
2. Or use via pnpm: `pnpm odavl --help`
3. Check PATH includes pnpm global bin
4. Restart terminal after installation

### Autopilot not making changes

**Problem**: Cycle completes but no files modified

**Solutions**:
1. Check `.odavl/logs/odavl.log` for errors
2. Verify recipes exist in `.odavl/recipes/`
3. Check trust scores in `.odavl/recipes-trust.json`
4. Lower gates.yml thresholds temporarily
5. Run single phase: `odavl autopilot run --phase decide` to see recipe selection

### Guardian tests failing

**Problem**: All Guardian tests return 0 scores

**Solutions**:
1. Check URL is accessible (public or VPN)
2. Verify Playwright installed: `pnpm add -D playwright`
3. Check network/firewall settings
4. Run with verbose: `odavl guardian test <url> --verbose`

## Next Steps

**After completing Quick Start:**

1. ✅ Read [ODAVL_STUDIO_V2_GUIDE.md](ODAVL_STUDIO_V2_GUIDE.md) for migration details
2. ✅ Explore [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for technical deep-dive
3. ✅ Check [docs/API_REFERENCE.md](docs/API_REFERENCE.md) for SDK documentation
4. ✅ Review [.github/copilot-instructions.md](.github/copilot-instructions.md) for development guidelines

**Join the community:**

- 🐛 Report issues: [GitHub Issues](https://github.com/Monawlo812/odavl/issues)
- 💬 Discussions: [GitHub Discussions](https://github.com/Monawlo812/odavl/discussions)
- 📧 Email: support@odavl.studio (coming soon)

## License

MIT © ODAVL Studio

---

**Need help?** Check [docs/](docs/) for detailed documentation or open an issue on GitHub.
