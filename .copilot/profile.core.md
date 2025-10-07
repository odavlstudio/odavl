# ODAVL Core Profile
**Context**: ODAVL Core Development (CLI + VS Code Extension + Governance + CI/CD)

## Scope & Boundaries
- **Work Areas**: `/`, `/packages/`, `/infra/`, `/.github/`
- **Forbidden**: Never touch `/odavl-website/` (separate profile)
- **Protected**: Never modify `/security/`, `**/*.spec.*`, `/public-api/`

## Branch Strategy
- **Prefix**: `odavl/core-<task>-<YYYYMMDD>`
- **Examples**: `odavl/core-cli-fixes-20251007`, `odavl/core-vscode-ext-20251007`

## Constraints
- **Maximum**: ≤40 lines changed, ≤10 files modified per PR
- **Process**: Observe → Decide → Act → Verify → Learn
- **Approval**: Human LGTM required before merge

## Technical Context
- **Languages**: TypeScript, Node.js, Shell scripts
- **Architecture**: Monorepo with pnpm workspaces
- **CLI**: Single file at `apps/cli/src/index.ts` (ODAVL cycle implementation)
- **Extensions**: VS Code extension development
- **Build Tools**: ESLint flat config, TypeScript strict mode

## Communication Tone
- **Style**: Engineering-focused, technical precision
- **Audience**: Developers, DevOps engineers, technical leads
- **Format**: Code-first explanations, architectural reasoning
- **Examples**: "Refactored CLI decision logic", "Added type safety guards"

## Key Files to Monitor
- `apps/cli/src/index.ts` - Main ODAVL cycle
- `package.json` - Dependencies and scripts
- `tsconfig.json` - TypeScript configuration
- `.github/workflows/` - CI/CD pipelines
- `eslint.config.mjs` - Linting rules