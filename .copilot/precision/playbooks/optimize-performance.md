# Playbook: Optimize Performance

## Goal

Identify heavy or redundant bundles and optimize imports or build configs.

## Patch Plan

1. Analyze bundle report via `(cd apps/web && pnpm analyze:bundle)`.
2. Suggest code-splitting or lazy loading if size > 250KB.
3. Confirm post-build size reduction and log in `verify.log`.

## Verify

- Bundle sizes < 250KB.
- `pnpm build` passes cleanly.
