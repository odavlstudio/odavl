/**
 * ODAVL Insight - Hover Provider
 * Wave 5 - Enhanced tooltips with detector info, ruleId, and suggested fixes
 */

import * as vscode from 'vscode';

export class InsightHoverProvider implements vscode.HoverProvider {
  private diagnosticsMap = new Map<string, vscode.Diagnostic[]>();
  
  updateDiagnostics(uri: vscode.Uri, diagnostics: vscode.Diagnostic[]): void {
    this.diagnosticsMap.set(uri.toString(), diagnostics);
  }
  
  provideHover(
    document: vscode.TextDocument,
    position: vscode.Position,
    token: vscode.CancellationToken
  ): vscode.ProviderResult<vscode.Hover> {
    const diagnostics = this.diagnosticsMap.get(document.uri.toString());
    if (!diagnostics) {
      return undefined;
    }
    
    // Find diagnostics at this position
    const hoveredDiagnostics = diagnostics.filter(d =>
      d.range.contains(position)
    );
    
    if (hoveredDiagnostics.length === 0) {
      return undefined;
    }
    
    // Build hover markdown
    const contents: vscode.MarkdownString[] = [];
    
    for (const diagnostic of hoveredDiagnostics) {
      const md = new vscode.MarkdownString();
      md.isTrusted = true;
      md.supportHtml = true;
      
      // Icon based on severity
      const icon = this.getSeverityIcon(diagnostic.severity);
      
      // Main message with icon
      md.appendMarkdown(`${icon} **${diagnostic.message}**\n\n`);
      
      // Source and code
      if (diagnostic.source) {
        md.appendMarkdown(`🔍 **Source:** ${diagnostic.source}\n\n`);
      }
      
      if (diagnostic.code) {
        md.appendMarkdown(`📋 **Rule:** \`${diagnostic.code}\`\n\n`);
      }
      
      // Suggested fix from related information
      if (diagnostic.relatedInformation && diagnostic.relatedInformation.length > 0) {
        for (const info of diagnostic.relatedInformation) {
          if (info.message.startsWith('Suggested fix:')) {
            const fix = info.message.replace('Suggested fix:', '').trim();
            md.appendMarkdown(`💡 **Suggested Fix:** ${fix}\n\n`);
          }
        }
      }
      
      // Action links
      md.appendMarkdown(`[Analyze Workspace](command:odavl-insight.analyzeWorkspace) • `);
      md.appendMarkdown(`[Clear Diagnostics](command:odavl-insight.clearDiagnostics)`);
      
      contents.push(md);
    }
    
    return new vscode.Hover(contents);
  }
  
  private getSeverityIcon(severity: vscode.DiagnosticSeverity): string {
    switch (severity) {
      case vscode.DiagnosticSeverity.Error:
        return '$(flame)'; // Critical/High
      case vscode.DiagnosticSeverity.Warning:
        return '$(warning)'; // Medium
      case vscode.DiagnosticSeverity.Information:
        return '$(info)'; // Low
      case vscode.DiagnosticSeverity.Hint:
        return '$(light-bulb)'; // Info
      default:
        return '$(circle-outline)';
    }
  }
}
