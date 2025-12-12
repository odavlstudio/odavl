/**
 * ODAVL Brain Diagnostics Provider
 * Phase Ω-P2: Integration with Guardian gates + VS Code Problems Panel
 */

import * as vscode from 'vscode';
import type { BrainConfidenceResult } from '../services/brain-service';

export interface GuardianGateResult {
  pass: boolean;
  reason: string;
  gate: string;
}

export class BrainDiagnosticsProvider {
  private diagnosticCollection: vscode.DiagnosticCollection;

  constructor() {
    this.diagnosticCollection = vscode.languages.createDiagnosticCollection('odavl-brain');
  }

  async updateDiagnostics(
    document: vscode.TextDocument,
    brainResult: BrainConfidenceResult,
    guardianGates?: GuardianGateResult[]
  ): Promise<void> {
    const diagnostics: vscode.Diagnostic[] = [];

    // Phase Ω-P2: Guardian gate failures
    if (guardianGates && guardianGates.length > 0) {
      const failedGates = guardianGates.filter((g) => !g.pass);
      
      if (failedGates.length > 0) {
        const diagnostic = new vscode.Diagnostic(
          new vscode.Range(0, 0, 0, 0),
          `🚫 Guardian: Deployment blocked by ${failedGates.length} gates - see Live View`,
          vscode.DiagnosticSeverity.Error
        );
        diagnostic.source = 'ODAVL Guardian';
        diagnostic.code = 'guardian-blocked';
        diagnostics.push(diagnostic);

        // Add each failed gate as a warning
        for (const gate of failedGates) {
          const gateDiagnostic = new vscode.Diagnostic(
            new vscode.Range(0, 0, 0, 0),
            `⚠️ Gate '${gate.gate}' failed: ${gate.reason}`,
            vscode.DiagnosticSeverity.Warning
          );
          gateDiagnostic.source = 'ODAVL Guardian';
          gateDiagnostic.code = `gate-${gate.gate}`;
          diagnostics.push(gateDiagnostic);
        }
      }
    }

    // Critical: Low confidence warning
    if (brainResult.confidence < 75) {
      const diagnostic = new vscode.Diagnostic(
        new vscode.Range(0, 0, 0, 0),
        `⚠️ Brain: Deployment confidence low (${brainResult.confidence.toFixed(1)}%)`,
        vscode.DiagnosticSeverity.Warning
      );
      diagnostic.source = 'ODAVL Brain';
      diagnostic.code = 'low-confidence';
      diagnostics.push(diagnostic);
    }

    // Blocked deployment
    if (!brainResult.canDeploy) {
      const diagnostic = new vscode.Diagnostic(
        new vscode.Range(0, 0, 0, 0),
        `❌ Brain: Deployment blocked (confidence below threshold)`,
        vscode.DiagnosticSeverity.Error
      );
      diagnostic.source = 'ODAVL Brain';
      diagnostic.code = 'deployment-blocked';
      diagnostics.push(diagnostic);
    }

    // Add reasoning as informational hints
    for (const reason of brainResult.reasoning) {
      const diagnostic = new vscode.Diagnostic(
        new vscode.Range(0, 0, 0, 0),
        reason,
        vscode.DiagnosticSeverity.Information
      );
      diagnostic.source = 'ODAVL Brain';
      diagnostic.code = 'brain-reasoning';
      diagnostics.push(diagnostic);
    }

    this.diagnosticCollection.set(document.uri, diagnostics);
  }

  clear(document?: vscode.TextDocument): void {
    if (document) {
      this.diagnosticCollection.delete(document.uri);
    } else {
      this.diagnosticCollection.clear();
    }
  }

  dispose(): void {
    this.diagnosticCollection.dispose();
  }
}
