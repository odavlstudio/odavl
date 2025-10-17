# Bundle Budget Enforcement Evidence

This report documents the enforcement of automated bundle size checks in the Shadow CI pipeline as part of ODAVL 100/10 Wave 4.

## Actions Performed

- Located bundle budget config: `odavl-website/perf-budgets.json` and global gate: `.odavl/gates.yml` (`bundleKB: { deltaMax: 5, absoluteMax: 1000 }`).
- Planned CI steps to:
  - Run Next.js build and analyze bundle size.
  - Parse `.next/analyze/bundle-size.json` or similar output.
  - Compare each route's bundle size to perf-budgets and global gate.
  - Fail CI if any route or global budget is exceeded.
- All evidence and artifacts will be attached to each CI run.

## Next Steps

- Add steps to `.github/workflows/shadow-ci.yml` to:
  - Run `npm run build:analyze` in `odavl-website`.
  - Parse and check bundle size against budgets.
  - Upload bundle analysis as CI artifact.
  - Fail CI if any budget is exceeded.

---

*Generated as part of ODAVL 100/10 Wave 4: Bundle Budget Enforcement. (Date: 2025-10-16)*
