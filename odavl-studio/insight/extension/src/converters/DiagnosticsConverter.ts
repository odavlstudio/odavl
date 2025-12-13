/**
 * Diagnostics Converter - converts detector issues to VS Code diagnostics
 */
import * as vscode from 'vscode';
import { DetectorIssue } from '../types/DetectorIssue';
import { ProgrammingLanguage } from '../language-detector';
import { BaselineManager } from '../core/baseline-manager';

export class DiagnosticsConverter {
  // Phase 4.1.2 - VS Code UX P0 fixes (wave 2):
  // Enforce diagnostic limits:
  // - Max 10 diagnostics per file
  // - Sorted by severity (Critical > High > Medium > Low)
  // This is intentional to preserve signal-to-noise and user trust.
  private static readonly MAX_DIAGNOSTICS_PER_FILE = 10;

  // Phase 4.1.3 - Delta-first UX:
  // Issues are classified as NEW or LEGACY
  // to avoid punishing users for pre-existing debt.
  private baselineManager?: BaselineManager;

  constructor(baselineManager?: BaselineManager) {
    this.baselineManager = baselineManager;
  }

  /**
   * Convert detector issues to VS Code diagnostics
   * 
   * **Phase 4.1.2**: Enforces max 10 diagnostics per file.
   * Issues are sorted by severity before limiting.
   * 
   * @param issues Detector issues
   * @param uri File URI
   * @returns VS Code diagnostics (max 10)
   */
  convert(issues: DetectorIssue[], uri: vscode.Uri): vscode.Diagnostic[] {
    // Phase 4.1.2: Sort issues by severity before conversion
    // Order: critical > error > warning > info/low > hint
    const sortedIssues = this.sortIssuesBySeverity(issues);
    
    // Phase 4.1.2: Take only top 10 most severe issues per file
    const limitedIssues = sortedIssues.slice(0, DiagnosticsConverter.MAX_DIAGNOSTICS_PER_FILE);
    
    const diagnostics: vscode.Diagnostic[] = [];
    
    for (const issue of limitedIssues) {
      try {
        // Create range (0-indexed)
        const line = Math.max(0, (issue.line || 1) - 1);
        const col = Math.max(0, (issue.column || 0));
        const endLine = issue.endLine ? Math.max(0, issue.endLine - 1) : line;
        const endCol = issue.endColumn || (col + (issue.length || 100));
        
        const range = new vscode.Range(line, col, endLine, endCol);
        
        // Map severity
        const severity = this.mapSeverity(issue.severity);
        
        // Phase 4.1.3: Check if issue is NEW (not in baseline)
        const isNew = this.baselineManager ? this.baselineManager.isNewIssue(issue) : false;
        
        // Phase 4.1.3: Mark NEW issues with [NEW] prefix
        // LEGACY issues remain visible but unmarked (no visual de-emphasis)
        const message = isNew ? `[NEW] ${issue.message}` : issue.message;
        
        // Create diagnostic
        const diagnostic = new vscode.Diagnostic(range, message, severity);
        
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
    
    // Phase 4.1.2: No notification about suppression (intentional silence)
    // Remaining issues are silently dropped to maintain signal-to-noise
    
    return diagnostics;
  }

  /**
   * Phase 4.1.2: Sort issues by severity
   * 
   * Order: Critical > High (error/warning) > Medium (info/low) > Low (hint)
   * Uses stable sort to preserve original order for same severity.
   * 
   * @param issues Issues to sort
   * @returns Sorted issues (highest severity first)
   */
  private sortIssuesBySeverity(issues: DetectorIssue[]): DetectorIssue[] {
    const severityOrder: Record<DetectorIssue['severity'], number> = {
      'critical': 0,
      'error': 1,
      'warning': 2,
      'info': 3,
      'low': 3,
      'hint': 4,
    };
    
    // Stable sort: preserves original order for same severity
    return [...issues].sort((a, b) => {
      return severityOrder[a.severity] - severityOrder[b.severity];
    });
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
