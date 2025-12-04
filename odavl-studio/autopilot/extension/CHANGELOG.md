# Changelog

All notable changes to the ODAVL Autopilot extension will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] - 2025-11-22

### Added
- O-D-A-V-L cycle automation:
  - **Observe** phase - Collect quality metrics (ESLint, TypeScript errors)
  - **Decide** phase - Select highest-trust recipe from library
  - **Act** phase - Apply improvements with undo snapshot
  - **Verify** phase - Re-run checks, enforce quality gates
  - **Learn** phase - Update recipe trust scores based on outcomes

- Recipe-based improvement system:
  - Load recipes from `.odavl/recipes/` directory
  - Trust score tracking (0.1 - 1.0 range)
  - Blacklist recipes with 3+ consecutive failures
  - Recipe library with common improvements

- Safety mechanisms:
  - Risk budget guard (max 10 files, 40 LOC per file)
  - Protected paths (security/**, auth/**, **/*.spec.*)
  - Undo snapshots saved to `.odavl/undo/` before every change
  - Quality gate enforcement from `.odavl/gates.yml`

- Ledger system:
  - Run ledgers saved to `.odavl/ledger/run-*.json`
  - Auto-open ledger after cycle completion
  - Detailed edit summaries with file paths and line counts
  - Attestation SHA-256 hashes for verified improvements

- Commands:
  - "ODAVL Autopilot: Run Full Cycle" - Execute complete O-D-A-V-L cycle
  - "ODAVL Autopilot: Run Single Phase" - Run specific phase only
  - "ODAVL Autopilot: Undo Last Change" - Rollback to previous snapshot
  - "ODAVL Autopilot: View Ledger" - Open latest run ledger

- Configuration:
  - `autoOpenLedger` - Auto-open ledger after run (default: true)
  - `maxFiles` - Maximum files per cycle (default: 10)
  - `maxLOC` - Maximum LOC per file (default: 40)

- Explorer views:
  - Recipes tree view showing trust scores
  - Recent runs with success/failure indicators
  - Click to open ledgers from activity view

### Performance
- Cycle time: 5-15 seconds (typical improvements)
- Phase breakdown: Observe (2s), Decide (1s), Act (3-8s), Verify (2s), Learn (<1s)

[0.1.0]: https://github.com/odavl-studio/odavl/releases/tag/autopilot-v0.1.0
