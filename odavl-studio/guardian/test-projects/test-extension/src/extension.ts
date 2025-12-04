import * as vscode from 'vscode';

export function activate(context: vscode.ExtensionContext) {
  const disposable = vscode.commands.registerCommand(
    'test-extension.hello',
    () => {
      vscode.window.showInformationMessage('Hello from Test Extension!');
    }
  );

  context.subscriptions.push(disposable);
}

export function deactivate() {}
