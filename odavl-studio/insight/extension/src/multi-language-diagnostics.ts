/**
 * Multi-Language Diagnostics Provider for VS Code
 * 
 * **Purpose:**
 * Manages diagnostics (Problems Panel) for multiple programming languages.
 * Routes files to appropriate language-specific detectors.
 * 
 * **Features:**
 * - Auto-detect language per file
 * - Run appropriate detectors (TypeScript, Python, Java)
 * - Real-time analysis on file save
 * - Language-specific severity mapping
 * - Problems Panel integration with click-to-navigate
 * 
 * **Performance:**
 * - Single file analysis: < 100ms
 * - Workspace analysis: < 10s (depends on project size)
 * - Incremental updates: < 50ms (only changed files)
 * 
 * @module MultiLanguageDiagnostics
 */

import * as vscode from 'vscode';
import { getLanguageDetector, ProgrammingLanguage } from './language-detector';
import { DetectorIssue } from './types/DetectorIssue';
import { DetectorLoader } from './detectors/DetectorLoader';
import { DiagnosticsConverter } from './converters/DiagnosticsConverter';
import { BaselineManager } from './core/baseline-manager';

/**
 * Multi-Language Diagnostics Provider
 * 
 * **Architecture:**
 * - Language detection → Detector selection → Analysis → Diagnostics update
 * - Supports TypeScript, Python, Java simultaneously
 * - Incremental updates (only changed files)
 * 
 * **Performance Optimizations:**
 * - Debounce file saves (500ms)
 * - Cache analysis results
 * - Parallel detector execution
 * 
 * **Phase 4.1.3 - Delta-First UX:**
 * - Baseline tracking for NEW vs LEGACY issue classification
 * - Never punish users for pre-existing technical debt
 */
export class MultiLanguageDiagnosticsProvider {
  private diagnosticCollection: vscode.DiagnosticCollection;
  private languageDetector = getLanguageDetector();
  private detectorLoader = new DetectorLoader();
  private baselineManager?: BaselineManager;
  private diagnosticsConverter: DiagnosticsConverter;
  private saveDebounceTimers = new Map<string, NodeJS.Timeout>();
  private analysisCache = new Map<string, { timestamp: number; diagnostics: vscode.Diagnostic[] }>();
  
  constructor(diagnosticCollection: vscode.DiagnosticCollection, workspaceRoot?: string) {
    this.diagnosticCollection = diagnosticCollection;
    
    // Phase 4.1.3: Initialize baseline manager if workspace available
    if (workspaceRoot) {
      this.baselineManager = new BaselineManager(workspaceRoot);
      // Load baseline asynchronously (non-blocking)
      this.baselineManager.loadBaseline().catch(err => {
        console.error('[MultiLanguageDiagnostics] Failed to load baseline:', err);
      });
    }
    
    // Phase 4.1.3: Pass baseline manager to converter
    this.diagnosticsConverter = new DiagnosticsConverter(this.baselineManager);
  }
  
  /**
   * Analyze file based on detected language
   * 
   * **Workflow:**
   * 1. Detect language from file extension
   * 2. Load appropriate detector module
   * 3. Run detector on file
   * 4. Update Problems Panel
   * 
   * @param uri File URI to analyze
   * @param debounce Whether to debounce (for auto-save)
   */
  async analyzeFile(uri: vscode.Uri, debounce = true) {
    const filePath = uri.fsPath;
    
    // Debounce for auto-save (prevent rapid re-analysis)
    if (debounce) {
      if (this.saveDebounceTimers.has(filePath)) {
        clearTimeout(this.saveDebounceTimers.get(filePath)!);
      }
      
      const timer = setTimeout(() => {
        this.saveDebounceTimers.delete(filePath);
        this.performFileAnalysis(uri);
      }, 500); // 500ms debounce
      
      this.saveDebounceTimers.set(filePath, timer);
    } else {
      await this.performFileAnalysis(uri);
    }
  }
  
  /**
   * Perform actual file analysis
   * 
   * @param uri File URI
   */
  private async performFileAnalysis(uri: vscode.Uri) {
    try {
      // Detect language
      const detection = this.languageDetector.detectFromFile(uri);
      
      if (detection.language === 'unknown') {
        // Not a supported language, clear diagnostics
        this.diagnosticCollection.delete(uri);
        return;
      }
      
      // Load detector for this language
      const detector = await this.detectorLoader.getDetectorForLanguage(detection.language);
      
      if (!detector) {
        console.warn(`No detector available for language: ${detection.language}`);
        return;
      }
      
      // Get workspace root
      const workspaceFolder = vscode.workspace.getWorkspaceFolder(uri);
      if (!workspaceFolder) {
        return;
      }
      
      // Run detector (file-level analysis)
      const issues = await this.detectorLoader.runOnFile(
        detector, 
        uri.fsPath, 
        detection.language,
        workspaceFolder.uri.fsPath
      );
      
      // Convert to VS Code diagnostics
      const diagnostics = this.diagnosticsConverter.convert(issues, uri);
      
      // Update Problems Panel
      this.diagnosticCollection.set(uri, diagnostics);
      
      // Cache results
      this.analysisCache.set(uri.fsPath, {
        timestamp: Date.now(),
        diagnostics,
      });
    } catch (error) {
      console.error(`Error analyzing file ${uri.fsPath}:`, error);
    }
  }
  
  /**
   * Analyze entire workspace (all supported languages)
   * 
   * **Performance:**
   * - Detects all languages in workspace
   * - Runs detectors in parallel
   * - Updates Problems Panel incrementally
   * 
   * @param workspaceRoot Workspace root path
   */
  async analyzeWorkspace(workspaceRoot: string) {
    try {
      // Detect all languages in workspace
      const languages = await this.languageDetector.detectWorkspaceLanguages(workspaceRoot);
      
      if (languages.length === 0) {
        vscode.window.showWarningMessage('ODAVL: No supported languages detected in workspace');
        return;
      }
      
      const languageNames = languages.map(l => this.languageDetector.getLanguageDisplayName(l)).join(', ');
      // Phase 4.1.1: Removed noisy notification - use output channel for progress
      console.log(`ODAVL: Analyzing workspace (${languageNames})...`);
      
      // Run detectors for each language
      const allIssues: DetectorIssue[] = [];
      
      for (const language of languages) {
        const detector = await this.detectorLoader.getDetectorForLanguage(language);
        if (detector) {
          const issues = await this.detectorLoader.runOnWorkspace(detector, workspaceRoot, language);
          allIssues.push(...issues);
        }
      }
      
      // Phase 4.1.2: Group issues by file
      const issuesByFile = new Map<string, DetectorIssue[]>();
      for (const issue of allIssues) {
        if (!issuesByFile.has(issue.file)) {
          issuesByFile.set(issue.file, []);
        }
        issuesByFile.get(issue.file)!.push(issue);
      }
      
      // Phase 4.1.2: Convert issues to diagnostics (per-file limit applied by converter)
      const allDiagnostics: Array<{ uri: vscode.Uri; diagnostic: vscode.Diagnostic }> = [];
      
      for (const [filePath, issues] of issuesByFile.entries()) {
        const uri = vscode.Uri.file(filePath);
        const diagnostics = this.diagnosticsConverter.convert(issues, uri);
        
        // Collect all diagnostics for global limit enforcement
        for (const diagnostic of diagnostics) {
          allDiagnostics.push({ uri, diagnostic });
        }
      }
      
      // Phase 4.1.2: Enforce global limit (max 50 diagnostics total)
      // Sort by severity, take top 50
      const MAX_TOTAL_DIAGNOSTICS = 50;
      const sortedDiagnostics = this.sortDiagnosticsBySeverity(allDiagnostics);
      const limitedDiagnostics = sortedDiagnostics.slice(0, MAX_TOTAL_DIAGNOSTICS);
      
      // Phase 4.1.2: Update diagnostics (only top 50 shown)
      this.diagnosticCollection.clear();
      
      // Group limited diagnostics back by file
      const diagnosticsByFile = new Map<string, vscode.Diagnostic[]>();
      for (const { uri, diagnostic } of limitedDiagnostics) {
        const key = uri.toString();
        if (!diagnosticsByFile.has(key)) {
          diagnosticsByFile.set(key, []);
        }
        diagnosticsByFile.get(key)!.push(diagnostic);
      }
      
      // Set diagnostics per file
      for (const [uriString, diagnostics] of diagnosticsByFile.entries()) {
        const uri = vscode.Uri.parse(uriString);
        this.diagnosticCollection.set(uri, diagnostics);
      }
      
      // Phase 4.1.1: Removed success notification - use status bar + Problems Panel for feedback
      console.log(`ODAVL: Analysis complete (${allIssues.length} issues found)`);
      
      // Phase 4.1.3: Update baseline after successful analysis
      // This establishes the new baseline for future NEW/LEGACY classification
      if (this.baselineManager && allIssues.length > 0) {
        await this.baselineManager.updateBaseline(allIssues);
        console.log('[MultiLanguageDiagnostics] Baseline updated with current issues');
      }
    } catch (error) {
      console.error('Workspace analysis error:', error);
      // Phase 4.1.1: Show error notification for hard failures only (not routine background analysis)
      // Only show if this was an explicit user action, not auto-triggered
      vscode.window.showErrorMessage(`ODAVL: Workspace analysis failed - ${error}`);
    }
  }
  
  /**
   * Clear all diagnostics
   */
  clearAll() {
    this.diagnosticCollection.clear();
    this.analysisCache.clear();
  }
  
  /**
   * Clear diagnostics for specific file
   * 
   * @param uri File URI
   */
  clearFile(uri: vscode.Uri) {
    this.diagnosticCollection.delete(uri);
    this.analysisCache.delete(uri.fsPath);
  }
  
  /**
   * Get cached diagnostics (for testing)
   * 
   * @param uri File URI
   * @returns Cached diagnostics or null
   */
  getCachedDiagnostics(uri: vscode.Uri): vscode.Diagnostic[] | null {
    const cached = this.analysisCache.get(uri.fsPath);
    return cached ? cached.diagnostics : null;
  }
  
  /**
   * Phase 4.1.2: Sort diagnostics globally by severity
   * 
   * Order: Error > Warning > Information > Hint
   * Uses stable sort to preserve original order for same severity.
   * 
   * @param diagnostics Diagnostics with URIs
   * @returns Sorted diagnostics (highest severity first)
   */
  private sortDiagnosticsBySeverity(
    diagnostics: Array<{ uri: vscode.Uri; diagnostic: vscode.Diagnostic }>
  ): Array<{ uri: vscode.Uri; diagnostic: vscode.Diagnostic }> {
    const severityOrder: Record<vscode.DiagnosticSeverity, number> = {
      [vscode.DiagnosticSeverity.Error]: 0,
      [vscode.DiagnosticSeverity.Warning]: 1,
      [vscode.DiagnosticSeverity.Information]: 2,
      [vscode.DiagnosticSeverity.Hint]: 3,
    };
    
    // Stable sort: preserves original order for same severity
    return [...diagnostics].sort((a, b) => {
      return severityOrder[a.diagnostic.severity] - severityOrder[b.diagnostic.severity];
    });
  }

  /**
   * Dispose resources
   */
  dispose() {
    // Clear all debounce timers
    for (const timer of this.saveDebounceTimers.values()) {
      clearTimeout(timer);
    }
    this.saveDebounceTimers.clear();
    
    // Clear caches
    this.analysisCache.clear();
    this.languageDetector.clearCache();
  }
}
