# Copilot Runtime Runner

## Flow

1. Run all detectors sequentially.
2. For each finding, match to a playbook.
3. Propose micro-fix (≤40 lines, ≤10 files).
4. Generate `patch.diff`, `verify.log`, and `attestation.json`.
5. Always perform Dry-Run first, then Apply if approved.

## Evidence

- All actions logged.
- Scorecard and attestation generated per scan.
