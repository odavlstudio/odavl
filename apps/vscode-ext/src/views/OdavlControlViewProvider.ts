import * as vscode from 'vscode';
import { getDashboardHtml } from './getDashboardHtml';

export class OdavlControlViewProvider implements vscode.WebviewViewProvider {
    public static readonly viewId = 'odavl.dashboard';
    constructor(private readonly context: vscode.ExtensionContext) { }

    async resolveWebviewView(view: vscode.WebviewView) {
        view.webview.options = { enableScripts: true };
        const html = await getDashboardHtml(this.context);
        view.webview.html = html;
        console.log('✅ ODAVL Control Dashboard visible (view).');
    }
}
