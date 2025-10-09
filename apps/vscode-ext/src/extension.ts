import * as vscode from 'vscode';
import { spawn } from 'child_process';

function startODAVLProcess(panel: vscode.WebviewPanel, workspaceRoot: string | undefined) {
  if (!workspaceRoot) {
    panel.webview.postMessage({
      type: 'doctor',
      status: 'error',
      data: { phase: 'Error', msg: 'No workspace folder found' }
    });
    return;
  }

  // Optimized spawn options for reduced latency
  const cli = spawn('tsx', ['apps/cli/src/index.ts', 'run', '--json'], { 
    cwd: workspaceRoot, 
    shell: true,
    stdio: ['ignore', 'pipe', 'pipe'],
    // Reduce buffer sizes for faster streaming
    windowsHide: true
  });
  
  // Set encoding and reduce buffer delay
  if (cli.stdout) {
    cli.stdout.setEncoding('utf8');
  }
  
  cli.stdout.on('data', (data) => {
    const output = data.toString().trim();
    const lines = output.split('\n');
    
    for (const line of lines) {
      if (line.trim()) {
        try {
          // Try to parse as JSON message
          const message = JSON.parse(line);
          if (message.type === 'doctor') {
            panel.webview.postMessage(message);
          }
        } catch {
          // Fallback for non-JSON output
          panel.webview.postMessage({
            type: 'doctor',
            status: 'info',
            data: { phase: 'CLI Output', msg: line }
          });
        }
      }
    }
  });

  cli.stderr.on('data', (data) => {
    const output = data.toString();
    panel.webview.postMessage({
      type: 'doctor',
      status: 'error',
      data: { phase: 'CLI Error', msg: output.trim() }
    });
  });
  
  cli.on('close', (code) => {
    panel.webview.postMessage({
      type: 'doctor',
      status: code === 0 ? 'success' : 'error',
      data: { phase: 'Process', msg: `ODAVL cycle completed with exit code ${code}` }
    });
  });
}

export function activate(context: vscode.ExtensionContext) {
  const disposable = vscode.commands.registerCommand('odavl.doctor', () => {
    const panel = vscode.window.createWebviewPanel(
      'odavlDoctor',
      'ODAVL Doctor',
      vscode.ViewColumn.One,
      {
        enableScripts: true,
        retainContextWhenHidden: true
      }
    );

    const htmlContent = getWebviewContent();
    panel.webview.html = htmlContent;
    
    const workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;

    // Handle messages from the webview
    panel.webview.onDidReceiveMessage(
      (message: { command: string; }) => {
        if (message.command === 'explain') {
          vscode.window.showInformationMessage('ODAVL Explanation: The system uses Observe-Decide-Act-Verify-Learn cycle to autonomously improve code quality.');
        } else if (message.command === 'run') {
          startODAVLProcess(panel, workspaceRoot);
        }
      },
      undefined,
      context.subscriptions
    );
  });

  context.subscriptions.push(disposable);
}

function getWebviewContent(): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>ODAVL Doctor</title>
    <style>
        body { 
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
            margin: 0; 
            padding: 16px; 
            background-color: var(--vscode-editor-background);
            color: var(--vscode-editor-foreground);
        }
        .header { margin-bottom: 20px; }
        .log-entry { 
            margin: 8px 0; 
            padding: 12px; 
            border-radius: 8px; 
            animation: fadeIn 0.3s ease-in;
            font-family: 'Consolas', 'Courier New', monospace;
        }
        .log-success { 
            background-color: var(--vscode-terminal-ansiGreen);
            color: var(--vscode-terminal-background);
            border-left: 4px solid var(--vscode-terminal-ansiGreen);
        }
        .log-error { 
            background-color: var(--vscode-terminal-ansiRed);
            color: var(--vscode-terminal-background);
            border-left: 4px solid var(--vscode-terminal-ansiRed);
        }
        .log-info { 
            background-color: var(--vscode-terminal-ansiBlue);
            color: var(--vscode-terminal-background);
            border-left: 4px solid var(--vscode-terminal-ansiBlue);
        }
        .log-phase { 
            font-weight: bold; 
            margin-bottom: 4px;
            font-size: 12px;
            text-transform: uppercase;
        }
        .log-msg { font-size: 14px; }
        .explain-btn { 
            margin-top: 16px; 
            padding: 8px 16px; 
            background: var(--vscode-button-background); 
            color: var(--vscode-button-foreground); 
            border: none; 
            border-radius: 4px; 
            cursor: pointer; 
        }
        .explain-btn:hover { background: var(--vscode-button-hoverBackground); }
        #logs { max-height: 500px; overflow-y: auto; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
    </style>
</head>
<body>
    <div class="header">
        <h2>ODAVL Doctor - Live Cycle Monitor</h2>
        <button class="explain-btn" onclick="explainODAVL()">Explain ODAVL</button>
        <button class="explain-btn" onclick="runODAVL()">Run ODAVL Cycle</button>
    </div>
    <div id="logs"></div>
    
    <script>
        const vscode = acquireVsCodeApi();
        const logsContainer = document.getElementById('logs');
        
        window.addEventListener('message', event => {
            const message = event.data;
            if (message.type === 'doctor') {
                addLogEntry(message.data.phase, message.data.msg, message.status);
            }
        });
        
        function addLogEntry(phase, msg, status) {
            const logEntry = document.createElement('div');
            logEntry.className = 'log-entry log-' + status;
            logEntry.innerHTML = '<div class="log-phase">' + phase + '</div><div class="log-msg">' + msg + '</div>';
            logsContainer.appendChild(logEntry);
            logsContainer.scrollTop = logsContainer.scrollHeight;
        }
        
        function explainODAVL() {
            vscode.postMessage({ command: 'explain' });
        }
        
        function runODAVL() {
            vscode.postMessage({ command: 'run' });
        }
        
        // Initial welcome message
        addLogEntry('Welcome', 'ODAVL Doctor initialized. Click "Run ODAVL Cycle" to start monitoring.', 'info');
    </script>
</body>
</html>`;
}

export function deactivate() {
  // Extension cleanup logic would go here
}