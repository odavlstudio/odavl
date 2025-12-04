import * as vscode from 'vscode';

// Language detector imports
import { TypeScriptDetector } from '@odavl-studio/insight-core/detector/typescript';
import { PythonDetector } from '@odavl-studio/insight-core/detector/python';
import { JavaDetector } from '@odavl-studio/insight-core/detector/java';
import { GoDetector } from '@odavl-studio/insight-core/detector/go';
import { RustDetector } from '@odavl-studio/insight-core/detector/rust';
import { CSharpDetector } from '@odavl-studio/insight-core/detector/csharp';
import { PHPDetector } from '@odavl-studio/insight-core/detector/php';

interface LanguageDetector {
  language: string;
  detector: any;
  enabled: boolean;
}

class ODAVLInsightExtension {
  private diagnosticCollection: vscode.DiagnosticCollection;
  private detectors: Map<string, LanguageDetector> = new Map();
  private outputChannel: vscode.OutputChannel;

  constructor(context: vscode.ExtensionContext) {
    this.diagnosticCollection = vscode.languages.createDiagnosticCollection('odavl');
    this.outputChannel = vscode.window.createOutputChannel('ODAVL Insight');
    
    this.initializeDetectors();
    this.registerCommands(context);
    this.registerEventHandlers(context);
    
    this.outputChannel.appendLine('✅ ODAVL Insight v3.1 activated (7 languages supported)');
  }

  private initializeDetectors(): void {
    const config = vscode.workspace.getConfiguration('odavl');
    
    
    // TypeScript/JavaScript
    if (config.get('typescript.enabled', true)) {
      this.detectors.set('typescript', {
        language: 'TypeScript/JavaScript',
        detector: new TypeScriptDetector(),
        enabled: true
      });
      this.outputChannel.appendLine('  ✓ TypeScript/JavaScript detector loaded');
    }

    // Python
    if (config.get('python.enabled', true)) {
      this.detectors.set('python', {
        language: 'Python',
        detector: new PythonDetector(),
        enabled: true
      });
      this.outputChannel.appendLine('  ✓ Python detector loaded');
    }

    // Java
    if (config.get('java.enabled', true)) {
      this.detectors.set('java', {
        language: 'Java',
        detector: new JavaDetector(),
        enabled: true
      });
      this.outputChannel.appendLine('  ✓ Java detector loaded');
    }

    // Go
    if (config.get('go.enabled', true)) {
      this.detectors.set('go', {
        language: 'Go',
        detector: new GoDetector(),
        enabled: true
      });
      this.outputChannel.appendLine('  ✓ Go detector loaded');
    }

    // Rust
    if (config.get('rust.enabled', true)) {
      this.detectors.set('rust', {
        language: 'Rust',
        detector: new RustDetector(),
        enabled: true
      });
      this.outputChannel.appendLine('  ✓ Rust detector loaded');
    }

    // C#
    if (config.get('csharp.enabled', true)) {
      this.detectors.set('csharp', {
        language: 'C#',
        detector: new CSharpDetector(),
        enabled: true
      });
      this.outputChannel.appendLine('  ✓ C# detector loaded');
    }

    // PHP
    if (config.get('php.enabled', true)) {
      this.detectors.set('php', {
        language: 'PHP',
        detector: new PHPDetector(),
        enabled: true
      });
      this.outputChannel.appendLine('  ✓ PHP detector loaded');
    }
  }

  private registerCommands(context: vscode.ExtensionContext): void {
    // Analyze workspace
    context.subscriptions.push(
      vscode.commands.registerCommand('odavl.analyze', async () => {
        await this.analyzeWorkspace();
      })
    );

    // Analyze current file
    context.subscriptions.push(
      vscode.commands.registerCommand('odavl.analyzeFile', async () => {
        const editor = vscode.window.activeTextEditor;
        if (editor) {
          await this.analyzeDocument(editor.document);
        }
      })
    );

    // Fix with Autopilot
    context.subscriptions.push(
      vscode.commands.registerCommand('odavl.fixWithAutopilot', async () => {
        vscode.window.showInformationMessage('Opening in ODAVL Autopilot...');
        // TODO: Implement Autopilot handoff
      })
    );

    // Clear diagnostics
    context.subscriptions.push(
      vscode.commands.registerCommand('odavl.clearDiagnostics', () => {
        this.diagnosticCollection.clear();
        this.outputChannel.appendLine('🧹 Diagnostics cleared');
      })
    );

    // Show output
    context.subscriptions.push(
      vscode.commands.registerCommand('odavl.showOutput', () => {
        this.outputChannel.show();
      })
    );
  }

  private registerEventHandlers(context: vscode.ExtensionContext): void {
    const config = vscode.workspace.getConfiguration('odavl');
    const autoAnalyze = config.get('autoAnalyze', true);

    if (autoAnalyze) {
      // Analyze on save
      context.subscriptions.push(
        vscode.workspace.onDidSaveTextDocument(async (document) => {
          await this.analyzeDocument(document);
        })
      );
    }

    // Analyze on open
    context.subscriptions.push(
      vscode.workspace.onDidOpenTextDocument(async (document) => {
        if (autoAnalyze) {
          await this.analyzeDocument(document);
        }
      })
    );
  }

  private async analyzeDocument(document: vscode.TextDocument): Promise<void> {
    const detector = this.detectors.get(document.languageId);
    if (!detector || !detector.enabled) {
      return;
    }

    const startTime = Date.now();
    this.outputChannel.appendLine(`🔍 Analyzing ${document.fileName} (${detector.language})...`);

    try {
      const content = document.getText();
      const issues = await detector.detector.analyze({
        filePath: document.fileName,
        content
      });

      // Convert to VS Code diagnostics
      const diagnostics: vscode.Diagnostic[] = issues.map((issue: any) => {
        const range = new vscode.Range(
          issue.line - 1,
          issue.column || 0,
          issue.endLine ? issue.endLine - 1 : issue.line - 1,
          issue.endColumn || 999
        );

        const severity = this.getSeverity(issue.severity);
        const diagnostic = new vscode.Diagnostic(range, issue.message, severity);
        diagnostic.source = 'ODAVL Insight';
        diagnostic.code = issue.type;

        return diagnostic;
      });

      this.diagnosticCollection.set(document.uri, diagnostics);

      const duration = Date.now() - startTime;
      this.outputChannel.appendLine(
        `  ✅ Found ${diagnostics.length} issues in ${duration}ms`
      );
    } catch (error) {
      this.outputChannel.appendLine(`  ❌ Error: ${error}`);
    }
  }

  private async analyzeWorkspace(): Promise<void> {
    this.outputChannel.show();
    this.outputChannel.appendLine('🚀 Analyzing workspace...');

    const files = await vscode.workspace.findFiles('**/*', '**/node_modules/**');
    let analyzed = 0;

    for (const file of files) {
      const document = await vscode.workspace.openTextDocument(file);
      if (this.detectors.has(document.languageId)) {
        await this.analyzeDocument(document);
        analyzed++;
      }
    }

    this.outputChannel.appendLine(`✅ Analyzed ${analyzed} files`);
    vscode.window.showInformationMessage(`ODAVL: Analyzed ${analyzed} files`);
  }

  private getSeverity(severity: string): vscode.DiagnosticSeverity {
    switch (severity.toLowerCase()) {
      case 'error':
      case 'critical':
        return vscode.DiagnosticSeverity.Error;
      case 'warning':
      case 'high':
        return vscode.DiagnosticSeverity.Warning;
      case 'info':
      case 'medium':
        return vscode.DiagnosticSeverity.Information;
      default:
        return vscode.DiagnosticSeverity.Hint;
    }
  }

  dispose(): void {
    this.diagnosticCollection.dispose();
    this.outputChannel.dispose();
  }
}

export function activate(context: vscode.ExtensionContext) {
  const extension = new ODAVLInsightExtension(context);
  context.subscriptions.push(extension);
}

export function deactivate() {
  // Cleanup
}
