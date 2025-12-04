# Playbook: Improve Consistency

## Goal

Unify naming conventions, icons, and command structure across VS Code views.

## Patch Plan

1. Compare icons defined in `package.json` and `src/utils/iconLoader.ts`.
2. Ensure unique ThemeIcons per view (dashboard, recipes, gates, verify, learn).
3. Update inconsistencies; verify dashboard renders correctly.

## Verify

- No duplicate icons or labels.
- `pnpm build` passes.
