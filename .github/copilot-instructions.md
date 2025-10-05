# ODAVL AI Coding Agent Instructions

## Project Overview
ODAVL (Observe-Decide-Act-Verify-Learn) is an autonomous code quality improvement system. It continuously monitors code quality metrics (ESLint warnings, TypeScript errors) and makes automated fixes within defined safety constraints.

## Architecture
- **Monorepo**: Uses pnpm workspaces (`pnpm-workspace.yaml`) with apps under `apps/*`
- **Main CLI**: Single TypeScript file at `apps/cli/src/index.ts` implementing the ODAVL cycle
- **Reports System**: JSON reports stored in `reports/` (gitignored) track metrics over time
- **Learning System**: `.odavl/history.json` maintains run history for pattern recognition
- **Safety Gates**: `.odavl/gates.yml` defines quality thresholds that must not be violated
- **Risk Policy**: `.odavl/policy.yml` limits autonomy scope (max files touched, lines changed)

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

## Development Notes
- Use `tsx` for TypeScript execution (not tsc compilation)
- All metrics are timestamped for trend analysis
- The system is designed for autonomous operation with human oversight
- Reports directory is gitignored but preserves local run history