# SBOM/OSV Integration Evidence

This report documents the integration of automated SBOM (Software Bill of Materials) generation and OSV (Open Source Vulnerability) scanning into the Shadow CI pipeline as part of ODAVL 100/10 Wave 3.

## Actions Performed

- Planned integration of SBOM and OSV scanning in CI.
- Will use `cyclonedx-bom` for SBOM generation and `osv-scanner` for vulnerability checks.
- All steps will be automated and evidence will be attached to each CI run.

## Next Steps

- Add steps to `.github/workflows/shadow-ci.yml` to:
  - Generate SBOM: `pnpm exec cyclonedx-bom -o reports/shadow/sbom.json`
  - Run OSV scan: `pnpm exec osv-scanner --sbom=reports/shadow/sbom.json --json > reports/shadow/osv-results.json`
- Attach both reports as CI artifacts.
- Fail CI if critical vulnerabilities are found.

---

*Generated as part of ODAVL 100/10 Wave 3: SBOM/OSV Integration. (Date: 2025-10-16)*
