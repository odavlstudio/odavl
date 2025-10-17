import * as vscode from 'vscode';
import * as React from 'react';
import EvidencePanel from './EvidencePanel';

export class EvidencePanelProvider implements vscode.WebviewViewProvider {
    public static readonly viewId = 'odavl.evidencePanel';
    constructor(private readonly context: vscode.ExtensionContext) { }

    async resolveWebviewView(view: vscode.WebviewView) {
        view.webview.options = { enableScripts: true };
        view.webview.html = `<div id="odavl-evidence-root"></div><script src="${view.webview.asWebviewUri(vscode.Uri.joinPath(this.context.extensionUri, 'dist', 'evidencePanel.js'))}"></script>`;
    }
}
