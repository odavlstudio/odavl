import * as vscode from 'vscode';

export function activate(context: vscode.ExtensionContext) {
    console.log('ODAVL Autopilot extension activated');

    // Register commands
    context.subscriptions.push(
        vscode.commands.registerCommand('odavl-autopilot.runCycle', runFullCycle)
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('odavl-autopilot.undo', undoLastChange)
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('odavl-autopilot.viewLedger', viewLedger)
    );

    // Watch for new ledger files
    const watcher = vscode.workspace.createFileSystemWatcher('**/.odavl/ledger/run-*.json');
    watcher.onDidCreate(async (uri) => {
        const config = vscode.workspace.getConfiguration('odavl-autopilot');
        if (config.get('autoOpenLedger')) {
            // Wait 500ms for file write completion
            setTimeout(() => {
                vscode.window.showTextDocument(uri);
            }, 500);
        }
    });

    context.subscriptions.push(watcher);
}

async function runFullCycle() {
    vscode.window.showInformationMessage('ODAVL Autopilot: Starting O-D-A-V-L cycle...');

    // TODO: Integration with @odavl-studio/autopilot-engine
    // This will run the full cycle: Observe → Decide → Act → Verify → Learn

    vscode.window.showInformationMessage('ODAVL Autopilot: Cycle complete');
}

async function undoLastChange() {
    const result = await vscode.window.showWarningMessage(
        'Undo last ODAVL Autopilot change?',
        'Yes',
        'No'
    );

    if (result === 'Yes') {
        // TODO: Integration with autopilot-engine undo functionality
        vscode.window.showInformationMessage('ODAVL Autopilot: Changes reverted');
    }
}

async function viewLedger() {
    const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
    if (!workspaceFolder) {
        vscode.window.showErrorMessage('No workspace folder open');
        return;
    }

    // TODO: Open latest ledger file from .odavl/ledger/
}

export function deactivate() { }
