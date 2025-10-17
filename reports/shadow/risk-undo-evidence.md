# Risk Token & Undo System Evidence

This report documents the automation of risk token tracking and undo snapshot creation in the Shadow CI pipeline as part of ODAVL 100/10 Wave 5.

## Actions Performed

- Located `.odavl/undo/` directory with automated undo snapshots (latest.json, timestamped files).
- Confirmed CLI supports `pnpm odavl:run undo` for instant rollback.
- Planned CI steps to:
  - Capture a new undo snapshot before each CI run.
  - Track risk tokens (change scope, files, lines) and attach to evidence.
  - Upload undo snapshot and risk metadata as CI artifacts.
- All evidence and artifacts will be attached to each CI run.

## Next Steps

- Add steps to `.github/workflows/shadow-ci.yml` to:
  - Run `pnpm odavl:run undo` if needed (manual or automated trigger).
  - Upload `.odavl/undo/latest.json` as a CI artifact.
  - Generate and upload risk token metadata (files/lines changed, etc.).

---

*Generated as part of ODAVL 100/10 Wave 5: Risk Token & Undo System. (Date: 2025-10-16)*
