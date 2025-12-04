# ⚙️ CI/CD Guide

Describes how ODAVL Shadow CI works.

1. Lint → Typecheck → Tests → OSV → Gitleaks
2. Generates shadow/verify-report.md
3. Updates bundle.log + attestation.json
Artifacts are uploaded via GitHub Actions.
