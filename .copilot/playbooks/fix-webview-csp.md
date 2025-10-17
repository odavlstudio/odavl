# Playbook: Fix Webview CSP

## Goal

Bundle all webview assets locally, add strict Content Security Policy (CSP), and remove any external CDN or inline scripts.

## Safety

- ≤40 lines per patch, ≤10 files
- No protected paths
- Dry-run first

## Patch Plan

1. Move or copy external JS (e.g. Chart.js) into `media/js/chart.min.js`.
2. Reference it via `asWebviewUri` inside webview.
3. Add `<meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src ${webview.cspSource} https:; script-src ${webview.cspSource}; style-src ${webview.cspSource} 'unsafe-inline';"/>`.
4. Remove inline `<script>` blocks or network fetches.
5. Validate using `pnpm build` and `vsce package --yarn`.
6. Document verification in `verify.log` and `attestation.json`.

## Verify

Ensure:

- No `http(s)` links in webview HTML.
- Zero warnings during build/package.
- Attestation chain complete.
