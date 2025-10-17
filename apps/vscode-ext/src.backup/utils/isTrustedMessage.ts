// Helper to verify VS Code webview message origin
export function isTrustedMessage(e: MessageEvent) {
    // Accept both VS Code webview and local dev
    return (
        e.origin.startsWith('vscode-webview://') ||
        e.origin === window.origin
    );
}
