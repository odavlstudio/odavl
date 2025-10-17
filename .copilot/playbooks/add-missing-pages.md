# Playbook: Add Missing Business Pages

## Goal

Ensure legal & onboarding readiness by creating missing core pages: /signup, /privacy-policy, /terms, /docs.

## Safety

- ≤40 lines per page, ≤10 files total
- No protected paths
- Use i18n structure if present

## Patch Plan

1. In `apps/web/src/app/`, create minimal placeholder pages:
   - signup/page.tsx
   - privacy-policy/page.tsx
   - terms/page.tsx
   - docs/page.tsx
2. Each page returns simple functional component with heading + description.
3. Use site layout and translations if available.
4. Verify pages load in dev server (`pnpm dev`).

## Verify

- No 404 for /signup, /privacy-policy, /terms, /docs.
- Build passes with zero warnings.
