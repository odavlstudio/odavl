/**
 * Language Status Bar for VS Code
 * 
 * **Purpose:**
 * Display detected programming language in VS Code status bar.
 * Allow users to see which language is currently active and which detectors will run.
 * 
 * **Features:**
 * - Shows language icon + name (🔷 TypeScript, 🐍 Python, ☕ Java)
 * - Click to show language details
 * - Shows enabled detectors for current language
 * - Updates automatically when switching files
 * 
 * **Performance:**
 * - Updates: < 1ms (simple DOM update)
 * - Language detection: < 5ms (cached)
 * 
 * @module LanguageStatusBar
 */

import * as vscode from 'vscode';
import { getLanguageDetector, ProgrammingLanguage } from './language-detector';

/**
 * Language Status Bar Item
 * 
 * **Location:** Right side of VS Code status bar
 * **Priority:** Medium (appears after language mode indicator)
 */
export class LanguageStatusBar {
  private statusBarItem: vscode.StatusBarItem;
  private languageDetector = getLanguageDetector();
  private currentLanguage: ProgrammingLanguage = 'unknown';
  
  constructor() {
    // Create status bar item (right side, medium priority)
    this.statusBarItem = vscode.window.createStatusBarItem(
      vscode.StatusBarAlignment.Right,
      100 // Priority (higher = more to the left)
    );
    
    this.statusBarItem.command = 'odavl-insight.showLanguageInfo';
    this.statusBarItem.tooltip = 'ODAVL: Click to show language details';
    
    // Initial state
    this.updateStatusBar('unknown');
    this.statusBarItem.show();
  }
  
  /**
   * Update status bar based on active editor
   * 
   * **Performance:**
   * - Language detection: < 5ms (cached)
   * - UI update: < 1ms
   * 
   * @param editor Active text editor
   */
  updateFromEditor(editor: vscode.TextEditor | undefined) {
    if (!editor) {
      this.updateStatusBar('unknown');
      return;
    }
    
    // Detect language from file
    const detection = this.languageDetector.detectFromFile(editor.document.uri);
    this.updateStatusBar(detection.language);
  }
  
  /**
   * Update status bar UI
   * 
   * @param language Programming language
   */
  private updateStatusBar(language: ProgrammingLanguage) {
    this.currentLanguage = language;
    
    if (language === 'unknown') {
      this.statusBarItem.text = '$(question) ODAVL: No language detected';
      this.statusBarItem.backgroundColor = undefined;
      this.statusBarItem.tooltip = 'ODAVL: File language not supported';
      return;
    }
    
    // Get language icon and name
    const emoji = this.getLanguageEmoji(language);
    const name = this.languageDetector.getLanguageDisplayName(language);
    
    // Update status bar
    this.statusBarItem.text = `${emoji} ODAVL: ${name}`;
    this.statusBarItem.backgroundColor = undefined;
    this.statusBarItem.tooltip = new vscode.MarkdownString(
      `**ODAVL Insight**\n\n` +
      `Language: **${name}**\n\n` +
      `Click to show available detectors`
    );
  }
  
  /**
   * Get language emoji
   * 
   * @param language Programming language
   * @returns Emoji string
   */
  private getLanguageEmoji(language: ProgrammingLanguage): string {
    const emojis: Record<ProgrammingLanguage, string> = {
      typescript: '🔷', // Blue diamond
      javascript: '🟨', // Yellow square
      python: '🐍', // Snake
      java: '☕', // Coffee
      unknown: '$(question)',
    };
    
    return emojis[language] || emojis.unknown;
  }
  
  /**
   * Show language info quick pick
   * 
   * **Shows:**
   * - Detected language
   * - Available detectors for this language
   * - Language-specific settings
   */
  async showLanguageInfo() {
    if (this.currentLanguage === 'unknown') {
      vscode.window.showInformationMessage('ODAVL: No language detected for current file');
      return;
    }
    
    const languageName = this.languageDetector.getLanguageDisplayName(this.currentLanguage);
    
    // Get available detectors for this language
    const detectors = this.getDetectorsForLanguage(this.currentLanguage);
    
    // Build quick pick items
    const items: vscode.QuickPickItem[] = [
      {
        label: `$(symbol-class) Language: ${languageName}`,
        description: 'Currently detected language',
      },
      {
        label: `$(checklist) Available Detectors: ${detectors.length}`,
        description: detectors.join(', '),
      },
      {
        label: '$(play) Analyze Current File',
        description: 'Run all detectors on this file',
      },
      {
        label: '$(gear) Language Settings',
        description: 'Configure detectors for this language',
      },
    ];
    
    const selected = await vscode.window.showQuickPick(items, {
      placeHolder: `ODAVL: ${languageName} Information`,
    });
    
    if (!selected) {
      return;
    }
    
    // Handle selection
    if (selected.label.includes('Analyze Current File')) {
      vscode.commands.executeCommand('odavl-insight.analyzeActiveFile');
    } else if (selected.label.includes('Language Settings')) {
      vscode.commands.executeCommand('workbench.action.openSettings', 'odavl-insight');
    }
  }
  
  /**
   * Get available detectors for language
   * 
   * @param language Programming language
   * @returns Array of detector names
   */
  private getDetectorsForLanguage(language: ProgrammingLanguage): string[] {
    const detectorsMap: Record<ProgrammingLanguage, string[]> = {
      typescript: [
        'Complexity',
        'Type Safety',
        'Best Practices',
        'Security',
        'Imports',
        'ESLint',
      ],
      javascript: [
        'Complexity',
        'Best Practices',
        'Security',
        'ESLint',
      ],
      python: [
        'Type Hints (MyPy)',
        'Security (Bandit)',
        'Complexity (Radon)',
        'Imports (isort)',
        'Best Practices (Pylint)',
      ],
      java: [
        'Null Safety',
        'Concurrency',
        'Performance',
        'Security',
        'Testing',
        'Architecture',
      ],
      unknown: [],
    };
    
    return detectorsMap[language] || [];
  }
  
  /**
   * Show detected workspace languages
   * 
   * @param workspaceRoot Workspace root path
   */
  async showWorkspaceLanguages(workspaceRoot: string) {
    const languages = await this.languageDetector.detectWorkspaceLanguages(workspaceRoot);
    
    if (languages.length === 0) {
      vscode.window.showInformationMessage('ODAVL: No supported languages detected in workspace');
      return;
    }
    
    const items: vscode.QuickPickItem[] = languages.map(lang => {
      const emoji = this.getLanguageEmoji(lang);
      const name = this.languageDetector.getLanguageDisplayName(lang);
      const detectors = this.getDetectorsForLanguage(lang);
      
      return {
        label: `${emoji} ${name}`,
        description: `${detectors.length} detectors available`,
        detail: detectors.join(', '),
      };
    });
    
    items.unshift({
      label: '$(checklist) Analyze All Languages',
      description: 'Run detectors for all detected languages',
    });
    
    const selected = await vscode.window.showQuickPick(items, {
      placeHolder: `ODAVL: Detected Languages (${languages.length})`,
    });
    
    if (!selected) {
      return;
    }
    
    if (selected.label.includes('Analyze All Languages')) {
      vscode.commands.executeCommand('odavl-insight.analyzeWorkspace');
    }
  }
  
  /**
   * Dispose resources
   */
  dispose() {
    this.statusBarItem.dispose();
  }
}
