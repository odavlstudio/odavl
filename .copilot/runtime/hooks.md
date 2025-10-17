# Verify Hooks

- Root build: `pnpm -r run build || true`
- Lint: `pnpm -r run lint || true`
- Typecheck: `pnpm -r run typecheck || true`
- VSCE package: `(cd apps/vscode-ext && vsce package --yarn || true)`
- Website build: `(cd apps/web && pnpm build || true)`
- E2E (optional): `(cd apps/web && pnpm test:e2e || true)`

- Precision Quality Scan: `@copilot precision:run`

- Continuous Loop: `@copilot precision:run --loop`
