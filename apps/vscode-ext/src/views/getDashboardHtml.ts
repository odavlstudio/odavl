import * as vscode from 'vscode';
import * as fs from 'node:fs';
import * as path from 'node:path';

export async function getDashboardHtml(context: vscode.ExtensionContext): Promise<string> {
    const candidates = [
        path.join(context.extensionPath, 'dist', 'webview', 'assets', 'index.html'),
        path.join(context.extensionPath, 'dist', 'dashboard.html'),
        path.join(context.extensionPath, 'webview', 'index.html'),
        path.join(context.extensionPath, 'media', 'dashboard.html'),
    ];

    for (const p of candidates) {
        if (fs.existsSync(p)) {
            try {
                let html = fs.readFileSync(p, 'utf8');
                // Asset rewriting logic removed for now (fix for reference errors)
                return html;
            } catch { }
        }
    }
    // Fallback مضمون
    return `<!doctype html>
  <html><head><meta charset="utf-8"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src data: https:; style-src 'unsafe-inline'; script-src 'unsafe-inline';">
  <title>ODAVL Control (Fallback)</title><style>body{font-family:system-ui,Segoe UI,Arial; padding:24px} .ok{color:#0a0} .warn{color:#a60}</style></head>
  <body>
    <h2>ODAVL Control — Fallback View</h2>
    <p class="warn">Could not locate the built dashboard file. Showing safe fallback UI.</p>
    <p>Expected path: <code>dist/webview/assets/index.html</code></p>
    <button onclick="acquireVsCodeApi().postMessage({type:'ping'})">Ping</button>
  </body></html>`;
}
