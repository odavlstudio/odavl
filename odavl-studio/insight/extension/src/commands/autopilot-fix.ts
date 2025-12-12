/**
 * ODAVL Autopilot Fix Command - VS Code Extension
 * Wave 6 - Apply deterministic fixes from VS Code
 */

import * as vscode from 'vscode';
import { analyzeWorkspace, type InsightAnalysisResult } from '@odavl/insight-sdk';
import {
  generateFixes,
  applyFixesToWorkspace,
  summarizeFixes,
  type FixPatch,
  type AutopilotSummary,
} from '@odavl/autopilot-core';

export class AutopilotFixProvider {
  constructor(private outputChannel: vscode.OutputChannel) {}

  /**
   * Run Autopilot fix command with user confirmation
   */
  async runAutopilotFix(): Promise<void> {
    const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
    if (!workspaceFolder) {
      vscode.window.showWarningMessage('No workspace folder open');
      return;
    }

    const workspaceRoot = workspaceFolder.uri.fsPath;

    // Step 1: Run Insight analysis
    this.outputChannel.appendLine('🔍 Running Insight analysis...');
    const analysis: InsightAnalysisResult = await vscode.window.withProgress(
      {
        location: vscode.ProgressLocation.Notification,
        title: 'ODAVL Autopilot',
        cancellable: false,
      },
      async (progress) => {
        progress.report({ message: 'Analyzing workspace...' });
        return await analyzeWorkspace(workspaceRoot);
      }
    );

    if (analysis.summary.totalIssues === 0) {
      vscode.window.showInformationMessage('✅ No issues found - workspace is clean!');
      return;
    }

    // Step 2: Generate fix patches
    this.outputChannel.appendLine(
      `🔍 Found ${analysis.summary.totalIssues} issues, generating fixes...`
    );
    const fixes: FixPatch[] = await generateFixes(analysis);

    if (fixes.length === 0) {
      vscode.window.showInformationMessage(
        'ℹ️ No fixable issues found. Autopilot only fixes high/medium/low severity issues.'
      );
      return;
    }

    // Step 3: Show preview and confirm
    const filesModified = new Set(fixes.map((f) => f.file)).size;
    const confirmMessage = `Apply ${fixes.length} fix${fixes.length > 1 ? 'es' : ''} to ${filesModified} file${filesModified > 1 ? 's' : ''}?`;

    const action = await vscode.window.showInformationMessage(
      confirmMessage,
      { modal: true },
      'Preview',
      'Apply',
      'Cancel'
    );

    if (action === 'Cancel' || !action) {
      this.outputChannel.appendLine('❌ Autopilot cancelled by user');
      return;
    }

    if (action === 'Preview') {
      this.showFixPreview(fixes, workspaceRoot);
      return;
    }

    // Step 4: Apply fixes with backup
    try {
      await vscode.window.withProgress(
        {
          location: vscode.ProgressLocation.Notification,
          title: 'ODAVL Autopilot',
          cancellable: false,
        },
        async (progress) => {
          progress.report({ message: 'Applying fixes...' });
          await applyFixesToWorkspace(fixes, workspaceRoot);
        }
      );

      const summary: AutopilotSummary = summarizeFixes(fixes);

      this.outputChannel.appendLine('✅ Autopilot fixes applied successfully!');
      this.outputChannel.appendLine(`  Total Fixes: ${summary.totalFixes}`);
      this.outputChannel.appendLine(`  Files Modified: ${summary.filesModified}`);
      this.outputChannel.appendLine(`  Backup: ${summary.backupPath}`);

      vscode.window.showInformationMessage(
        `✅ Autopilot: ${summary.totalFixes} fix${summary.totalFixes > 1 ? 'es' : ''} applied to ${summary.filesModified} file${summary.filesModified > 1 ? 's' : ''}!`
      );
    } catch (error) {
      this.outputChannel.appendLine(`❌ Autopilot error: ${error instanceof Error ? error.message : String(error)}`);
      vscode.window.showErrorMessage(
        `Autopilot failed: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Show fix preview in new editor
   */
  private showFixPreview(fixes: FixPatch[], workspaceRoot: string): void {
    const lines: string[] = [];
    lines.push('# ODAVL Autopilot - Fix Preview\n');
    lines.push(`Total Fixes: ${fixes.length}`);
    lines.push(`Files Modified: ${new Set(fixes.map((f) => f.file)).size}\n`);

    const fileGroups = new Map<string, FixPatch[]>();
    fixes.forEach((fix) => {
      const relativePath = vscode.workspace.asRelativePath(fix.file, false);
      if (!fileGroups.has(relativePath)) {
        fileGroups.set(relativePath, []);
      }
      fileGroups.get(relativePath)!.push(fix);
    });

    fileGroups.forEach((patches, file) => {
      lines.push(`\n## ${file}`);
      patches.forEach((patch, i) => {
        lines.push(
          `\n${i + 1}. Line ${patch.start}: ${patch.detector}/${patch.ruleId || 'unknown'} (${(patch.confidence * 100).toFixed(0)}%)`
        );
        if (patch.originalText) {
          lines.push(`   - Original: ${patch.originalText.trim()}`);
        }
        lines.push(`   + Replacement: ${patch.replacement || '(remove line)'}`);
      });
    });

    lines.push('\n\n---');
    lines.push('Run "ODAVL Autopilot: Fix Issues" and choose "Apply" to execute fixes.');

    const content = lines.join('\n');
    vscode.workspace.openTextDocument({ content, language: 'markdown' }).then((doc) => {
      vscode.window.showTextDocument(doc);
    });
  }
}
