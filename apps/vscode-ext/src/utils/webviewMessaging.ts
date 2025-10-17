// Utility for consistent webview message passing and handler registration
import * as vscode from 'vscode';

export type WebviewMessageHandler = (message: unknown) => void | Promise<void>;

export function registerWebviewMessageHandler(
    webview: vscode.Webview,
    handler: WebviewMessageHandler
): vscode.Disposable {
    return webview.onDidReceiveMessage(async (message: unknown) => {
        try {
            await handler(message);
        } catch (err) {
            // Optionally log error
            console.error('Webview message handler error:', err);
        }
    });
}

export function postWebviewMessage(
    webview: vscode.Webview,
    message: unknown
): Thenable<boolean> {
    return webview.postMessage(message);
}
