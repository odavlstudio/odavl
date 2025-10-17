# ODAVL Root Fix Mode: Diagnostics Report

Date: 2025-10-12

## Summary

- VS Code extension manifest valid, logo present.
- Existing VSIX located (if present) and contents listed below.
- ODAVL CLI smoke test passed: lint/typecheck gates green; attestation written.
- No ODAVL extension currently detected as installed in this environment (fresh install planned).

## Extension Manifest Check

- File: apps/vscode-ext/package.json
- name: odavl
- displayName: ODAVL Control
- version: 1.0.0 (will bump to 1.0.1)
- activationEvents: onStartupFinished
- activity bar container id: "odavl" with icon media/logo.png
- views: Dashboard, Recipes, Activity, Configuration, Control, Intelligence

## Asset Check

- media/logo.png: present

## VSIX Contents (if available)

Path: apps/vscode-ext/odavl-1.0.0.vsix

Note: If the VSIX was not found, this section will be empty and a new VSIX will be produced in the next step.

## CLI Smoke Test

Command: pnpm odavl:run

Result: PASS — ESLint warnings: 0, Type errors: 0, Gates: PASS. Attestation saved under .odavl/attestation.

## Next Steps

1) Bump extension version to 1.0.1
2) Rebuild and package VSIX
3) Install VSIX and verify it is listed
4) Re-run lint/typecheck to confirm gates remain green
