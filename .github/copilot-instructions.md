# ODAVL AI Coding Agent Instructions

## Project Overview
ODAVL (Observe-Decide-Act-Verify-Learn) is an autonomous code quality improvement system. It continuously monitors code quality metrics (ESLint warnings, TypeScript errors) and makes automated fixes within defined safety constraints.

## Architecture
- **Monorepo**: Uses pnpm workspaces (`pnpm-workspace.yaml`) with 3 main components:
  - `apps/cli/` - Core ODAVL CLI system
  - `apps/vscode-ext/` - VS Code Doctor extension
  - `odavl-website/` - Next.js marketing/docs site with i18n
- **Main CLI**: Single TypeScript file at `apps/cli/src/index.ts` implementing the ODAVL cycle
- **Reports System**: JSON reports stored in `reports/` (gitignored) track metrics over time
- **Learning System**: `.odavl/history.json` maintains run history with trust scoring
- **Safety Gates**: `.odavl/gates.yml` defines strict quality thresholds (zero tolerance for type errors)
- **Risk Policy**: `.odavl/policy.yml` limits autonomy scope (max 10 files, 40 lines per change)

## Key Workflows

### Development Commands
```bash
# Run full ODAVL cycle (most common)
pnpm odavl:run

# Individual cycle steps
pnpm odavl:observe    # Collect metrics
pnpm odavl:decide     # Determine action based on trust scores
pnpm odavl:act        # Execute fixes (eslint --fix + custom recipes)
pnpm odavl:verify     # Shadow verification + quality gates

# Quality & Safety checks
pnpm typecheck        # TypeScript validation
pnpm lint            # ESLint with flat config
.\tools\golden.ps1    # Full repo stability check (PowerShell)
.\tools\policy-guard.ps1  # Governance compliance validation
.\tools\security-scan.ps1 # CVE scanning and license compliance

# VS Code extension development
pnpm ext:compile     # Build VS Code Doctor extension
pnpm ext:watch       # Watch mode for extension development
```

### Metrics Collection
The system tracks:
- ESLint warnings (parsed from JSON output)
- TypeScript errors (counted from `tsc --noEmit` output)
- Delta calculations (before → after comparisons)

## Code Patterns

### Decision Logic
Currently implements single strategy: `eslintWarnings > 0 ? "remove-unused" : "noop"`
When extending, add new decision types and corresponding actions in the `act()` function.

### Error Handling
Uses `sh()` wrapper for command execution that captures both stdout/stderr and never throws:
```typescript
function sh(cmd: string): { out: string; err: string }
```

### File Organization
- Reports: Timestamped JSON files (`observe-${Date.now()}.json`)
- Learning: Append-only history in `.odavl/history.json`
- Safety: YAML configuration files in `.odavl/`

## Configuration Specifics

### ESLint Setup
- Uses flat config (`eslint.config.mjs`)
- TypeScript integration with type-aware rules
- Ignores: `dist/`, `node_modules/`, `reports/`, `*.mjs`
- Custom rule: unused vars as warnings with `_` prefix ignore pattern

### TypeScript
- ES2022 target with bundler module resolution
- Strict mode enabled
- Includes both `apps/` and `packages/` directories

### Safety Constraints
Check `.odavl/gates.yml` and `.odavl/policy.yml` before making changes:
- Zero tolerance for new type errors (`deltaMax: 0`)
- Limited file modification scope (`maxFilesTouched: 10`)
- Protected paths cannot be modified autonomously

## Enterprise Safety Features

### Multi-Layer Verification
- **Shadow Testing**: Changes tested in isolated environment before commit
- **Cryptographic Attestation**: Successful improvements generate signed proofs
- **Undo System**: Automatic snapshots enable instant rollback via `pnpm odavl:run undo`
- **Trust Learning**: Recipe success rates tracked in `.odavl/recipes-trust.json`

### VS Code Integration
- Install ODAVL Doctor extension for real-time cycle monitoring
- Command: "ODAVL: Doctor Mode" provides color-coded phase indicators
- JSON mode available with `--json` flag for structured output

## Development Notes
- Use `tsx` for TypeScript execution (not tsc compilation)
- All metrics are timestamped for trend analysis
- Reports stored in `reports/` with separate directories for runtime, golden snapshots
- The system is designed for autonomous operation with enterprise-grade safety controls
- Website includes comprehensive i18n (9 languages) and performance optimizations