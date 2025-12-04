/**
 * Language Detector for VS Code Extension
 * 
 * **Purpose:**
 * Automatically detect programming language from file extensions and project structure
 * to run appropriate detectors in real-time.
 * 
 * **Supported Languages:**
 * - TypeScript (.ts, .tsx, .mts, .cts)
 * - JavaScript (.js, .jsx, .mjs, .cjs)
 * - Python (.py, .pyi, .pyw)
 * - Java (.java)
 * 
 * **Detection Strategy:**
 * 1. File extension (primary)
 * 2. Project structure (package.json, requirements.txt, pom.xml)
 * 3. Shebang line (#!/usr/bin/env python, etc.)
 * 
 * @module LanguageDetector
 */

import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';

/**
 * Supported programming languages
 */
export type ProgrammingLanguage = 'typescript' | 'javascript' | 'python' | 'java' | 'unknown';

/**
 * Language detection result
 */
export interface LanguageDetection {
  language: ProgrammingLanguage;
  confidence: number; // 0-100
  projectType?: string; // 'node', 'django', 'spring-boot', etc.
  frameworks?: string[]; // Detected frameworks
}

/**
 * Language Detector Class
 * 
 * **Performance:**
 * - File extension detection: <1ms
 * - Project detection: <10ms (cached)
 * - Shebang detection: <5ms
 */
export class LanguageDetector {
  private projectLanguageCache = new Map<string, ProgrammingLanguage[]>();
  
  /**
   * Detect language from file URI
   * 
   * **Examples:**
   * - `file.ts` → typescript (100% confidence)
   * - `file.py` → python (100% confidence)
   * - `file.java` → java (100% confidence)
   * 
   * @param uri File URI
   * @returns Language detection result
   */
  detectFromFile(uri: vscode.Uri): LanguageDetection {
    const filePath = uri.fsPath;
    const ext = path.extname(filePath).toLowerCase();
    
    // Extension-based detection (highest confidence)
    const extensionMap: Record<string, ProgrammingLanguage> = {
      // TypeScript
      '.ts': 'typescript',
      '.tsx': 'typescript',
      '.mts': 'typescript',
      '.cts': 'typescript',
      
      // JavaScript
      '.js': 'javascript',
      '.jsx': 'javascript',
      '.mjs': 'javascript',
      '.cjs': 'javascript',
      
      // Python
      '.py': 'python',
      '.pyi': 'python',
      '.pyw': 'python',
      
      // Java
      '.java': 'java',
    };
    
    const language = extensionMap[ext] || 'unknown';
    
    if (language !== 'unknown') {
      return {
        language,
        confidence: 100,
      };
    }
    
    // Fallback: Check shebang for scripts without extension
    if (ext === '' || ext === '.sh') {
      const shebangLanguage = this.detectFromShebang(filePath);
      if (shebangLanguage !== 'unknown') {
        return {
          language: shebangLanguage,
          confidence: 90,
        };
      }
    }
    
    return {
      language: 'unknown',
      confidence: 0,
    };
  }
  
  /**
   * Detect all languages in workspace
   * 
   * **Performance:**
   * - First run: 50-100ms (scans project structure)
   * - Subsequent runs: <1ms (cached)
   * 
   * @param workspaceRoot Workspace root path
   * @returns Array of detected languages
   */
  async detectWorkspaceLanguages(workspaceRoot: string): Promise<ProgrammingLanguage[]> {
    // Check cache
    if (this.projectLanguageCache.has(workspaceRoot)) {
      return this.projectLanguageCache.get(workspaceRoot)!;
    }
    
    const languages = new Set<ProgrammingLanguage>();
    
    // Check for project markers
    const markers = [
      { file: 'package.json', language: 'typescript' as ProgrammingLanguage },
      { file: 'tsconfig.json', language: 'typescript' as ProgrammingLanguage },
      { file: 'requirements.txt', language: 'python' as ProgrammingLanguage },
      { file: 'pyproject.toml', language: 'python' as ProgrammingLanguage },
      { file: 'setup.py', language: 'python' as ProgrammingLanguage },
      { file: 'pom.xml', language: 'java' as ProgrammingLanguage },
      { file: 'build.gradle', language: 'java' as ProgrammingLanguage },
      { file: 'build.gradle.kts', language: 'java' as ProgrammingLanguage },
    ];
    
    for (const marker of markers) {
      const markerPath = path.join(workspaceRoot, marker.file);
      if (fs.existsSync(markerPath)) {
        languages.add(marker.language);
      }
    }
    
    // If no markers found, scan for file extensions (quick sample)
    if (languages.size === 0) {
      const sampleFiles = await this.sampleWorkspaceFiles(workspaceRoot, 50);
      for (const file of sampleFiles) {
        const detection = this.detectFromFile(vscode.Uri.file(file));
        if (detection.language !== 'unknown') {
          languages.add(detection.language);
        }
      }
    }
    
    const result = Array.from(languages);
    this.projectLanguageCache.set(workspaceRoot, result);
    
    return result;
  }
  
  /**
   * Detect language from shebang line
   * 
   * **Examples:**
   * - `#!/usr/bin/env python` → python
   * - `#!/usr/bin/env node` → javascript
   * 
   * @param filePath File path
   * @returns Detected language
   */
  private detectFromShebang(filePath: string): ProgrammingLanguage {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const firstLine = content.split('\n')[0];
      
      if (firstLine.startsWith('#!')) {
        if (firstLine.includes('python')) {
          return 'python';
        }
        if (firstLine.includes('node')) {
          return 'javascript';
        }
      }
    } catch (error) {
      // Ignore read errors
    }
    
    return 'unknown';
  }
  
  /**
   * Sample workspace files (for language detection)
   * 
   * **Performance:**
   * - Limits to first 50 files
   * - Skips node_modules, venv, dist, etc.
   * 
   * @param workspaceRoot Workspace root
   * @param limit Maximum files to sample
   * @returns Array of file paths
   */
  private async sampleWorkspaceFiles(workspaceRoot: string, limit: number): Promise<string[]> {
    const files: string[] = [];
    
    const skipDirs = new Set([
      'node_modules', '.git', 'dist', 'build', 'out',
      'venv', '.venv', 'env', '.env',
      '__pycache__', '.pytest_cache', 'coverage',
      'target', '.gradle', '.idea', '.vscode',
    ]);
    
    const scan = (dir: string, depth: number) => {
      if (depth > 3) return; // Max depth 3
      if (files.length >= limit) return; // Limit reached
      
      try {
        const entries = fs.readdirSync(dir, { withFileTypes: true });
        
        for (const entry of entries) {
          if (files.length >= limit) break;
          
          const fullPath = path.join(dir, entry.name);
          
          if (entry.isDirectory()) {
            if (!skipDirs.has(entry.name)) {
              scan(fullPath, depth + 1);
            }
          } else if (entry.isFile()) {
            const ext = path.extname(entry.name);
            if (['.ts', '.tsx', '.js', '.jsx', '.py', '.java'].includes(ext)) {
              files.push(fullPath);
            }
          }
        }
      } catch (error) {
        // Ignore permission errors
      }
    };
    
    scan(workspaceRoot, 0);
    return files;
  }
  
  /**
   * Get language icon for UI
   * 
   * @param language Programming language
   * @returns Icon name or emoji
   */
  getLanguageIcon(language: ProgrammingLanguage): string {
    const icons: Record<ProgrammingLanguage, string> = {
      typescript: '$(symbol-class)', // TypeScript icon
      javascript: '$(symbol-namespace)', // JavaScript icon
      python: '$(symbol-variable)', // Python icon
      java: '$(symbol-interface)', // Java icon
      unknown: '$(symbol-misc)',
    };
    
    return icons[language] || icons.unknown;
  }
  
  /**
   * Get language display name
   * 
   * @param language Programming language
   * @returns Display name
   */
  getLanguageDisplayName(language: ProgrammingLanguage): string {
    const names: Record<ProgrammingLanguage, string> = {
      typescript: 'TypeScript',
      javascript: 'JavaScript',
      python: 'Python',
      java: 'Java',
      unknown: 'Unknown',
    };
    
    return names[language] || 'Unknown';
  }
  
  /**
   * Clear language cache (for testing or workspace changes)
   */
  clearCache() {
    this.projectLanguageCache.clear();
  }
}

/**
 * Singleton instance
 */
let languageDetectorInstance: LanguageDetector | null = null;

/**
 * Get language detector instance (singleton)
 * 
 * @returns Language detector
 */
export function getLanguageDetector(): LanguageDetector {
  if (!languageDetectorInstance) {
    languageDetectorInstance = new LanguageDetector();
  }
  return languageDetectorInstance;
}
