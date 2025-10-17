# ODAVL Verification Ledger — 2025-10-17

## Phase 6 — Verification & Evidence Summary

### Static Checks

- Lint: 6 problems (2 errors, 4 warnings) — see odavl-website lint output
- Type: Build failed due to missing module for dynamic route
- Build: Failed (see Next.js build output)

### Runtime Validation

- CLI, website, extension: Not fully validated (CLI/extension commands not found)

### Security Audit

- No known vulnerabilities found (pnpm audit)

### Governance Checks

- Policy/undo/attestation: Undo logs present, attestation logs present
- Policy scripts not executed (PowerShell path issue)

### Performance Metrics

- Build time: ~4.2s
- Bundle size: [pending scan]
- Cache: [pending scan]

### Documentation Completeness

- All core docs present and lint-clean
- README and link scan pending

### Evidence & Attestation

- Undo logs: Present in .odavl/undo/
- Attestation logs: [pending evidence dir scan]

### Risk & Confidence

- Final Global Score: 6/10
- Risk Level: 🟡 (medium)
- Confidence Level: Medium

### Metrics Improvements

- Documentation normalized
- Security audit clean
- Lint/type/build errors remain

---
Verification Ledger Path: reports/verification-ledger-20251017.md
Attestation/Undo Verification: Undo logs present, attestation logs pending
Final build/lint/test status: Errors remain (see above)

---
Generated: 2025-10-17
