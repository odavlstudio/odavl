/**
 * Diagnostics Converter - converts detector issues to VS Code diagnostics
 */
import * as vscode from 'vscode';
import { DetectorIssue } from '../types/DetectorIssue';
import { ProgrammingLanguage } from '../language-detector';

export class DiagnosticsConverter {
  /**
   * Convert detector issues to VS Code diagnostics
   * 
   * @param issues Detector issues
   * @param uri File URI
   * @returns VS Code diagnostics
   */
  convert(issues: DetectorIssue[], uri: vscode.Uri): vscode.Diagnostic[] {
    const diagnostics: vscode.Diagnostic[] = [];
    
    for (const issue of issues) {
      try {
        // Create range (0-indexed)
        const line = Math.max(0, (issue.line || 1) - 1);
        const col = Math.max(0, (issue.column || 0));
        const endLine = issue.endLine ? Math.max(0, issue.endLine - 1) : line;
        const endCol = issue.endColumn || (col + (issue.length || 100));
        
        const range = new vscode.Range(line, col, endLine, endCol);
        
        // Map severity
        const severity = this.mapSeverity(issue.severity);
        
        // Create diagnostic
        const diagnostic = new vscode.Diagnostic(range, issue.message, severity);
        
        // Set source with language icon
        const languageIcon = this.getLanguageEmoji(issue.language);
        diagnostic.source = `${languageIcon} ODAVL/${issue.detector}`;
        
        if (issue.code) {
          diagnostic.code = issue.code;
        }
        
        // Add tags
        if (issue.autoFixable) {
          diagnostic.tags = [vscode.DiagnosticTag.Unnecessary]; // Indicates auto-fix available
        }
        
        diagnostics.push(diagnostic);
      } catch (error) {
        console.error('Error creating diagnostic:', error);
      }
    }
    
    return diagnostics;
  }

  /**
   * Map detector severity to VS Code severity
   * 
   * @param severity Detector severity
   * @returns VS Code diagnostic severity
   */
  private mapSeverity(severity: DetectorIssue['severity']): vscode.DiagnosticSeverity {
    switch (severity) {
      case 'error':
      case 'critical':
        return vscode.DiagnosticSeverity.Error;
      case 'warning':
        return vscode.DiagnosticSeverity.Warning;
      case 'info':
      case 'low':
        return vscode.DiagnosticSeverity.Information;
      case 'hint':
        return vscode.DiagnosticSeverity.Hint;
      default:
        return vscode.DiagnosticSeverity.Warning;
    }
  }

  /**
   * Get language emoji for diagnostics
   * 
   * @param language Programming language
   * @returns Emoji or icon
   */
  private getLanguageEmoji(language: ProgrammingLanguage): string {
    const emojis: Record<ProgrammingLanguage, string> = {
      typescript: '🔷', // Blue diamond (TypeScript blue)
      javascript: '🟨', // Yellow square (JavaScript yellow)
      python: '🐍', // Snake (Python)
      java: '☕', // Coffee (Java)
      unknown: '❓',
    };
    
    return emojis[language] || emojis.unknown;
  }

  /**
   * OMEGA-P5 Phase 4 Commit 6: Get OMS file risk icon
   * 
   * @param riskScore Risk score (0-1)
   * @returns Risk level emoji
   */
  private getFileRiskIcon(riskScore: number): string {
    if (riskScore >= 0.7) return '🔴'; // Critical risk
    if (riskScore >= 0.5) return '🟡'; // High risk
    return '🟢'; // Low/medium risk
  }
}
