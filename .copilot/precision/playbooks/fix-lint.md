# Playbook: Fix Lint & Formatting

## Goal

Automatically resolve ESLint and Prettier issues across the project while keeping functional code unchanged.

## Patch Plan

1. Run `pnpm -r lint --fix || true`
2. Auto-format changed files using Prettier.
3. Verify clean lint output and zero diffs in logic.

## Verify

- `pnpm -r lint` returns zero warnings.
- `git diff` shows only style changes.
