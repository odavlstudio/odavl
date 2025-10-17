# ODAVL AI Coding Agent Instructions

## Project Overview
ODAVL (Observe-Decide-Act-Verify-Learn) is an autonomous code quality improvement system. It continuously monitors code quality metrics (ESLint warnings, TypeScript errors) and makes automated fixes within defined safety constraints.

## Architecture
<<<<<<< Updated upstream
- **Monorepo**: Uses pnpm workspaces (`pnpm-workspace.yaml`) with apps under `apps/*`
- **Main CLI**: Single TypeScript file at `apps/cli/src/index.ts` implementing the ODAVL cycle
- **Reports System**: JSON reports stored in `reports/` (gitignored) track metrics over time
- **Learning System**: `.odavl/history.json` maintains run history for pattern recognition
- **Safety Gates**: `.odavl/gates.yml` defines quality thresholds that must not be violated
- **Risk Policy**: `.odavl/policy.yml` limits autonomy scope (max files touched, lines changed)
=======
- **Monorepo**: Uses pnpm workspaces (`pnpm-workspace.yaml`) with 3 main components:
  - `apps/cli/` - Core ODAVL CLI system with modular phase architecture
  - `apps/vscode-ext/` - VS Code Doctor extension with real-time cycle monitoring
  - `odavl-website/` - Next.js marketing/docs site with i18n (9 languages)
- **Main CLI**: Orchestrator at `apps/cli/src/index.ts` with separate phase modules in `apps/cli/src/phases/`
- **Reports System**: JSON reports stored in `reports/` (gitignored) track metrics over time
- **Learning System**: `.odavl/history.json` maintains run history with trust scoring
- **Safety Gates**: `.odavl/gates.yml` defines strict quality thresholds (zero tolerance for type errors)
- **Risk Policy**: `.odavl/policy.yml` limits autonomy scope (max 10 files, 40 lines per change)

## Critical Data Flows
- **Evidence System**: `evidence/` directory contains timestamped action/audit/decision logs with structured JSON evidence
- **Attestation Chain**: Cryptographic proofs in `.odavl/attestation/` for successful improvements
- **Undo System**: Automatic snapshots in `.odavl/undo/` enable instant rollback via `pnpm odavl:run undo`
- **Recipe Trust**: `.odavl/recipes-trust.json` tracks success rates for ML-driven decisions
- **Session Tracking**: Each ODAVL run generates unique sessionId and cycleId for comprehensive audit trails
>>>>>>> Stashed changes

## Key Workflows

### Development Commands
```bash
# Run full ODAVL cycle (most common)
pnpm odavl:run

# Individual cycle steps
pnpm odavl:observe    # Collect metrics
pnpm odavl:decide     # Determine action
pnpm odavl:act        # Execute fixes
pnpm odavl:verify     # Validate results

# Quality checks
pnpm typecheck        # TypeScript validation
pnpm lint            # ESLint with custom config
```

### Metrics Collection
The system tracks with performance timing:
# ODAVL AI Coding Agent Instructions

## Project Overview
ODAVL (Observe-Decide-Act-Verify-Learn) is an autonomous code quality improvement system. It continuously monitors code quality metrics (ESLint warnings, TypeScript errors) and makes automated fixes within defined safety constraints.

## Architecture
- **Monorepo**: Uses pnpm workspaces (`pnpm-workspace.yaml`) with 3 main components:
  - `apps/cli/` - Core ODAVL CLI system with modular phase architecture
  - `apps/vscode-ext/` - VS Code Doctor extension with real-time cycle monitoring
  - `odavl-website/` - Next.js marketing/docs site with i18n (9 languages)
- **Main CLI**: Orchestrator at `apps/cli/src/index.ts` with separate phase modules in `apps/cli/src/phases/`
- **Reports System**: JSON reports stored in `reports/` (gitignored) track metrics over time
- **Learning System**: `.odavl/history.json` maintains run history with trust scoring
- **Safety Gates**: `.odavl/gates.yml` defines strict quality thresholds (zero tolerance for type errors)
- **Risk Policy**: `.odavl/policy.yml` limits autonomy scope (max 10 files, 40 lines per change)

## Critical Data Flows
- **Evidence System**: `evidence/` directory contains timestamped action/audit/decision logs with structured JSON evidence
- **Attestation Chain**: Cryptographic proofs in `.odavl/attestation/` for successful improvements
- **Undo System**: Automatic snapshots in `.odavl/undo/` enable instant rollback via `pnpm odavl:run undo`
- **Recipe Trust**: `.odavl/recipes-trust.json` tracks success rates for ML-driven decisions
- **Session Tracking**: Each ODAVL run generates unique sessionId and cycleId for comprehensive audit trails

## Key Workflows

### Development Commands
```bash
# Run full ODAVL cycle (most common)
pnpm odavl:run

# Individual cycle steps
pnpm odavl:observe    # Collect metrics
pnpm odavl:decide     # Determine action
pnpm odavl:act        # Execute fixes
pnpm odavl:verify     # Validate results

# Quality checks
pnpm typecheck        # TypeScript validation
pnpm lint            # ESLint with custom config
```

### Metrics Collection
The system tracks with performance timing:
- ESLint warnings (parsed from JSON output via `eslint . -f json`)
- TypeScript errors (counted from `tsc --noEmit` stderr)
- Delta calculations (before → after comparisons with positive/negative tracking)
- Phase-level performance metrics (observe, decide, act, verify, learn timings)

## Code Patterns

### Decision Logic
Core strategy: `eslintWarnings > 0 ? "remove-unused" : "noop"` in `phases/decide.ts`
When extending, add new decision types and corresponding actions in `phases/act.ts`.
Trust scores influence decision confidence based on historical success rates.

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
- **Quality Gates**: Multi-dimensional safety checks (ESLint, TypeScript, bundle size, coverage, security)

### VS Code Integration
- Install ODAVL Doctor extension for real-time cycle monitoring
- Command: "ODAVL: Doctor Mode" provides color-coded phase indicators
- Views: Dashboard, Recipes, Activity, Configuration, Doctor
- JSON mode available with `--json` flag for structured output

## Development Notes
- Use `tsx` for TypeScript execution (not tsc compilation)
- All metrics are timestamped for trend analysis
- The system is designed for autonomous operation with human oversight
- Reports directory is gitignored but preserves local run history
