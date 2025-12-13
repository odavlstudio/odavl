# ODAVL Studio CLI

Unified command-line interface for ODAVL Studio - autonomous code quality with three distinct products (Insight, Autopilot, Guardian).

## 📦 Global Installation

Install globally to use `odavl` from anywhere:

```bash
# Using npm
npm install -g @odavl/cli

# Using pnpm
pnpm add -g @odavl/cli

# Using yarn
yarn global add @odavl/cli

# Verify installation
odavl --version
```

### Local Development (from source)

If you're developing ODAVL locally:

```bash
# From monorepo root
cd apps/studio-cli
pnpm install
pnpm build

# Link globally for testing
npm link

# Or run directly without building
pnpm dev --help
```

## 🚀 Quick Start

```bash
# Show all available commands with examples
odavl --help

# Run code analysis (detects 11+ issue types)
odavl insight analyze

# Auto-fix detected issues safely
odavl autopilot run

# Pre-deployment website testing
odavl guardian test https://example.com

# Sign in to ODAVL Cloud for history/collaboration
odavl auth login
```

## 💡 Real-World Usage Examples

```bash
# Analyze specific directory with progress
odavl insight analyze --dir ./src

# Fast parallel analysis (4-16x speedup)
odavl insight analyze --file-parallel

# CI/CD mode: fail build if issues found
odavl insight analyze --strict --silent

# Generate reports for code review
odavl insight analyze --json --html --sarif

# Self-healing with preview (no changes)
odavl autopilot run --dry-run

# Fix up to 5 issues maximum
odavl autopilot run --max-fixes 5
```

## Architecture

ODAVL Studio CLI provides unified access to three products:

- **ODAVL Insight** - ML-powered error detection (12 specialized detectors)
- **ODAVL Autopilot** - Self-healing code infrastructure (O-D-A-V-L cycle)
- **ODAVL Guardian** - Pre-deploy testing & monitoring

## Commands

### Insight - Error Detection (Wave 4 - Production Ready)

```bash
# Full analysis with all detectors
odavl insight analyze

# Analyze specific directory
odavl insight analyze --dir ./src

# Use specific detectors only
odavl insight analyze --detectors typescript,eslint,security

# Set minimum severity level
odavl insight analyze --severity high

# Generate reports in multiple formats
odavl insight analyze --json --html --md

# CI/CD mode (exit 1 if issues found)
odavl insight analyze --strict --silent

# Full comprehensive scan
odavl insight full-scan --json

# Quick essential scan
odavl insight quick

# List all available detectors
odavl insight detectors

# Show latest analysis stats
odavl insight stats
```

**CLI Options:**
- `--detectors <list>` - Comma-separated detector names
- `--severity <min>` - Minimum severity (info|low|medium|high|critical)
- `--json` - Generate JSON report
- `--html` - Generate HTML report with styling
- `--md` - Generate Markdown report
- `--output <path>` - Custom output file path
- `--files <glob>` - File patterns to analyze
- `--dir <folder>` - Directory to analyze (default: cwd)
- `--strict` - Exit 1 if issues found (CI/CD mode)
- `--debug` - Show debug information
- `--silent` - Minimal output

**Issue Schema (Wave 4):**
```typescript
interface InsightIssue {
  file: string;
  line: number;
  column: number;
  message: string;
  severity: 'info' | 'low' | 'medium' | 'high' | 'critical';
  detector: string;
  ruleId?: string;
  suggestedFix?: string;
}
```

**Available Detectors (Auto-discovered):**
- `typescript` - TypeScript compilation errors
- `eslint` - ESLint violations
- `security` - Security vulnerabilities
- `performance` - Performance bottlenecks
- `complexity` - Code complexity metrics
- `import` - Import/dependency issues
- `python-type` - Python type hints (mypy)
- `python-security` - Python security (bandit)
- `python-complexity` - Python complexity
- `java` - Java compilation & patterns
- `go` - Go vet & staticcheck
- `rust` - Rust clippy
- `advanced-runtime` - Runtime error detection
- `architecture` - Architecture patterns
- `build` - Build system issues
- `cicd` - CI/CD configuration
- `circular` - Circular dependencies
- `database` - Database usage
- `infrastructure` - Infrastructure as Code
- `isolation` - Test isolation
- `ml-model` - ML model validation
- `network` - Network/API issues
- `nextjs` - Next.js specific
- `package` - Package.json problems
- `runtime` - Runtime detection

### Autopilot - Self-Healing

```bash
# Run full O-D-A-V-L cycle
odavl autopilot run

# Run specific phase
odavl autopilot observe
odavl autopilot decide
odavl autopilot act
odavl autopilot verify
odavl autopilot learn

# Undo last changes
odavl autopilot undo

# Show run history
odavl autopilot history
```

**Safety Features:**
- Risk budget guard (max 10 files/cycle)
- Undo snapshots (`.odavl/undo/`)
- Attestation chain (cryptographic proof)
- Protected paths enforcement

### Guardian - Pre-Deploy Testing

```bash
# Test a URL before deployment
odavl guardian test https://example.com

# Run quality gates
odavl guardian gates

# Generate compliance report
odavl guardian report
```

## Configuration

Create `.odavlrc.json` in your project root:

```json
{
  "insight": {
    "detectors": ["typescript", "eslint", "import"],
    "outputFormat": "json"
  },
  "autopilot": {
    "maxFiles": 10,
    "maxLinesPerFile": 40,
    "protectedPaths": ["security/**", "auth/**"]
  },
  "guardian": {
    "qualityGates": {
      "minCoverage": 80,
      "maxComplexity": 10
    }
  }
}
```

### Governance Rules

Create `.odavl/gates.yml` for custom constraints:

```yaml
risk_budget: 100
forbidden_paths:
  - security/**
  - public-api/**
  - "**/*.spec.*"
actions:
  max_auto_changes: 10
  max_files_per_cycle: 10
enforcement:
  - block_if_risk_exceeded
  - rollback_on_failure
  - require_attestation
```

## Examples

### Example 1: Full Workspace Analysis

```bash
cd my-project
odavl insight analyze

# Output:
# ✅ TypeScript: 0 errors
# ❌ ESLint: 12 warnings
# ⚠️ Import: 3 issues
# Results saved to .odavl/problems-panel-export.json
```

### Example 2: Auto-Fix TypeScript Errors

```bash
# Observe errors
odavl autopilot observe

# Decide on fixes
odavl autopilot decide

# Apply fixes (with undo snapshot)
odavl autopilot act

# Verify improvements
odavl autopilot verify

# Or run all phases at once
odavl autopilot run --max-files 5
```

### Example 3: Pre-Deploy Quality Check

```bash
# Test staging URL
odavl guardian test https://staging.example.com

# Output:
# ✅ Accessibility: WCAG AA compliant
# ✅ Performance: 95/100
# ✅ Security: No vulnerabilities
# ✅ Quality gates: All passed
```

## Output Files

All operations write to `.odavl/` directory:

```
.odavl/
├── history.json              # Run history with trust scoring
├── problems-panel-export.json # Insight diagnostics
├── ledger/run-*.json         # Autopilot run logs
├── undo/<timestamp>.json     # File snapshots
├── attestation/              # Cryptographic proofs
├── recipes/                  # Improvement recipes
└── gates.yml                 # Governance rules
```

## Integration with VS Code

Install ODAVL Studio extensions for enhanced IDE experience:

- **Insight Extension** - Real-time error detection in Problems Panel
- **Autopilot Extension** - Monitor self-healing cycles
- **Guardian Extension** - Quality metrics dashboard

Extensions auto-sync with CLI outputs (`.odavl/` watchers).

## Requirements

- **Node.js** >= 18.18 (LTS)
- **Package Manager**: npm, pnpm, or yarn
- **OS**: Windows, macOS, Linux
- **Git**: Required for attestation chain

## Troubleshooting

### CLI not found after install

```bash
# Verify installation
npm list -g @odavl-studio/cli

# Reinstall globally
npm install -g @odavl-studio/cli --force
```

### Permission errors on Windows

Run PowerShell as Administrator:

```powershell
Set-ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### Autopilot refuses to modify files

Check `.odavl/gates.yml` constraints. Protected paths:

- `security/**`
- `auth/**`
- `**/*.spec.*`
- `**/*.test.*`

## Advanced Usage

### Custom Detectors (Insight)

```typescript
// insight-config.ts
export default {
  customDetectors: [
    {
      id: 'custom-api-check',
      pattern: /fetch\(['"]http:/,
      message: 'Use HTTPS for API calls'
    }
  ]
};
```

### Recipe Development (Autopilot)

```json
// .odavl/recipes/fix-imports.json
{
  "id": "fix-missing-imports",
  "trust": 0.85,
  "pattern": "Cannot find name",
  "action": "add-import",
  "params": {
    "detectFrom": "node_modules"
  }
}
```

## License

MIT License - see [LICENSE](../../LICENSE) for details.

## Support

- **Documentation**: [github.com/Monawlo812/odavl](https://github.com/Monawlo812/odavl)
- **Issues**: [github.com/Monawlo812/odavl/issues](https://github.com/Monawlo812/odavl/issues)
- **Discussions**: [github.com/Monawlo812/odavl/discussions](https://github.com/Monawlo812/odavl/discussions)

## Related Packages

- [`@odavl-studio/sdk`](../packages/sdk) - Programmatic SDK for custom integrations
- [`@odavl-studio/insight-core`](../odavl-studio/insight/core) - Core error analysis engine
- [`@odavl-studio/autopilot-engine`](../odavl-studio/autopilot/engine) - Self-healing engine
- [`@odavl-studio/auth`](../packages/auth) - Authentication & license validation

---

**Built by ODAVL Studio Team** | [GitHub](https://github.com/Monawlo812/odavl) | [License](../../LICENSE)
