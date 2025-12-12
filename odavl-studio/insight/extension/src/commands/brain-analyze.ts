/**
 * ODAVL Brain Analyze Command
 * Phase Ω-P1: Manual deployment confidence check
 */

import * as vscode from 'vscode';
import { BrainService } from '../services/brain-service';
import { BrainLiveViewPanel } from '../panels/brain-live-view';

export async function registerBrainCommands(
  context: vscode.ExtensionContext,
  brainService: BrainService
) {
  // Command: odavl.brain.analyze
  const analyzeCmd = vscode.commands.registerCommand(
    'odavl.brain.analyze',
    async () => {
      try {
        const changedFiles = await getChangedFiles();

        if (changedFiles.length === 0) {
          vscode.window.showInformationMessage('No changed files detected');
          return;
        }

        const result = await brainService.getDeploymentConfidence({
          changedFiles,
        });

        // Show in panel
        BrainLiveViewPanel.createOrShow(context.extensionUri, result);

        // Show notification
        if (result.canDeploy) {
          vscode.window.showInformationMessage(
            `✅ Deployment confidence: ${result.confidence.toFixed(1)}%`
          );
        } else {
          vscode.window.showWarningMessage(
            `❌ Deployment blocked (confidence: ${result.confidence.toFixed(1)}%)`
          );
        }
      } catch (error) {
        vscode.window.showErrorMessage(`Brain analysis failed: ${error}`);
      }
    }
  );

  // Command: odavl.brain.showLiveView
  const showViewCmd = vscode.commands.registerCommand(
    'odavl.brain.showLiveView',
    async () => {
      const result = await brainService.getDeploymentConfidence({
        changedFiles: [],
      });
      BrainLiveViewPanel.createOrShow(context.extensionUri, result);
    }
  );

  context.subscriptions.push(analyzeCmd, showViewCmd);
}

async function getChangedFiles(): Promise<string[]> {
  const gitExtension = vscode.extensions.getExtension('vscode.git')?.exports;
  const git = gitExtension?.getAPI(1);

  if (!git || git.repositories.length === 0) {
    return [];
  }

  const repo = git.repositories[0];
  const changes = await repo.diffWithHEAD();
  
  return changes.map((change: any) => change.uri.fsPath);
}
