# Continuous Precision Loop

## Frequency

- Daily Light Scan at 09:00 (lint + typecheck)
- Weekly Full Precision Scan (Friday 10:00)
- On Commit → Run ESLint + Quick Verify

## Steps per loop

1. Observe: Run detectors and precision rules.
2. Detect: Identify quality or performance issues.
3. Act: Apply safe micro-fixes using playbooks.
4. Verify: Execute runtime hooks and update scorecard.
5. Learn: Append summary to learn_cycle.md
6. Attest: Create attestation-cycle-<date>.json
