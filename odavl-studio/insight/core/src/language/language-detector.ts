/**
 * Language Detector - Automatic Language Detection System
 * 
 * Detects programming languages in a project by analyzing:
 * - Project configuration files (package.json, requirements.txt, pom.xml, etc.)
 * - File extensions (.ts, .py, .java)
 * - Directory structure
 * 
 * Supports: TypeScript, Python, Java
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import { safeReadFile } from '../utils/safe-file-reader';

export enum Language {
  TypeScript = 'typescript',
  Python = 'python',
  Java = 'java',
  Unknown = 'unknown',
}

export interface LanguageDetectionResult {
  language: Language;
  confidence: number; // 0-100
  indicators: string[]; // Files/patterns that indicate this language
}

export interface ProjectLanguages {
  primary: Language;
  secondary: Language[];
  allDetected: LanguageDetectionResult[];
}

export class LanguageDetector {
  /**
   * Detect all languages in a project
   */
  detectFromProject(projectRoot: string): ProjectLanguages {
    const results: LanguageDetectionResult[] = [];

    // Check for TypeScript
    const tsResult = this.detectTypeScript(projectRoot);
    if (tsResult.confidence > 0) {
      results.push(tsResult);
    }

    // Check for Python
    const pyResult = this.detectPython(projectRoot);
    if (pyResult.confidence > 0) {
      results.push(pyResult);
    }

    // Check for Java
    const javaResult = this.detectJava(projectRoot);
    if (javaResult.confidence > 0) {
      results.push(javaResult);
    }

    // Sort by confidence (highest first)
    results.sort((a, b) => b.confidence - a.confidence);

    // Determine primary and secondary languages
    const primary = results.length > 0 ? results[0].language : Language.Unknown;
    const secondary = results.slice(1).map(r => r.language);

    return {
      primary,
      secondary,
      allDetected: results,
    };
  }

  /**
   * Detect language from a single file
   */
  detectFromFile(filePath: string): Language {
    const ext = path.extname(filePath).toLowerCase();

    // TypeScript extensions
    if (['.ts', '.tsx', '.mts', '.cts'].includes(ext)) {
      return Language.TypeScript;
    }

    // JavaScript (treat as TypeScript for analysis)
    if (['.js', '.jsx', '.mjs', '.cjs'].includes(ext)) {
      return Language.TypeScript;
    }

    // Python extensions
    if (['.py', '.pyw', '.pyi'].includes(ext)) {
      return Language.Python;
    }

    // Java extensions
    if (['.java'].includes(ext)) {
      return Language.Java;
    }

    return Language.Unknown;
  }

  /**
   * Detect TypeScript in project
   */
  private detectTypeScript(projectRoot: string): LanguageDetectionResult {
    const indicators: string[] = [];
    let confidence = 0;

    // Check for package.json (50 points)
    const packageJson = path.join(projectRoot, 'package.json');
    if (fs.existsSync(packageJson)) {
      indicators.push('package.json');
      confidence += 50;

      try {
        const fileContent = safeReadFile(packageJson);
        if (!fileContent) {
          return { language: 'typescript', confidence, indicators };
        }
        const content = JSON.parse(fileContent);
        
        // Check for TypeScript dependencies (30 points)
        const deps = { ...content.dependencies, ...content.devDependencies };
        if (deps.typescript || deps['@types/node']) {
          indicators.push('TypeScript dependencies');
          confidence += 30;
        }
      } catch (error) {
        // Ignore JSON parse errors
      }
    }

    // Check for tsconfig.json (30 points)
    const tsconfig = path.join(projectRoot, 'tsconfig.json');
    if (fs.existsSync(tsconfig)) {
      indicators.push('tsconfig.json');
      confidence += 30;
    }

    // Check for .ts/.tsx files (20 points)
    const hasTypeScriptFiles = this.hasFilesWithExtensions(projectRoot, ['.ts', '.tsx']);
    if (hasTypeScriptFiles) {
      indicators.push('.ts/.tsx files');
      confidence += 20;
    }

    // Cap at 100
    confidence = Math.min(100, confidence);

    return {
      language: Language.TypeScript,
      confidence,
      indicators,
    };
  }

  /**
   * Detect Python in project
   */
  private detectPython(projectRoot: string): LanguageDetectionResult {
    const indicators: string[] = [];
    let confidence = 0;

    // Check for requirements.txt (40 points)
    const requirementsTxt = path.join(projectRoot, 'requirements.txt');
    if (fs.existsSync(requirementsTxt)) {
      indicators.push('requirements.txt');
      confidence += 40;
    }

    // Check for pyproject.toml (40 points)
    const pyprojectToml = path.join(projectRoot, 'pyproject.toml');
    if (fs.existsSync(pyprojectToml)) {
      indicators.push('pyproject.toml');
      confidence += 40;
    }

    // Check for setup.py (30 points)
    const setupPy = path.join(projectRoot, 'setup.py');
    if (fs.existsSync(setupPy)) {
      indicators.push('setup.py');
      confidence += 30;
    }

    // Check for Pipfile (30 points)
    const pipfile = path.join(projectRoot, 'Pipfile');
    if (fs.existsSync(pipfile)) {
      indicators.push('Pipfile');
      confidence += 30;
    }

    // Check for .py files (20 points)
    const hasPythonFiles = this.hasFilesWithExtensions(projectRoot, ['.py']);
    if (hasPythonFiles) {
      indicators.push('.py files');
      confidence += 20;
    }

    // Check for virtual environment (10 points)
    const venvDirs = ['venv', '.venv', 'env', '.env', 'virtualenv'];
    const hasVenv = venvDirs.some(dir => fs.existsSync(path.join(projectRoot, dir)));
    if (hasVenv) {
      indicators.push('Virtual environment');
      confidence += 10;
    }

    // Cap at 100
    confidence = Math.min(100, confidence);

    return {
      language: Language.Python,
      confidence,
      indicators,
    };
  }

  /**
   * Detect Java in project
   */
  private detectJava(projectRoot: string): LanguageDetectionResult {
    const indicators: string[] = [];
    let confidence = 0;

    // Check for pom.xml (Maven) (50 points)
    const pomXml = path.join(projectRoot, 'pom.xml');
    if (fs.existsSync(pomXml)) {
      indicators.push('pom.xml (Maven)');
      confidence += 50;
    }

    // Check for build.gradle (Gradle) (50 points)
    const buildGradle = path.join(projectRoot, 'build.gradle');
    const buildGradleKts = path.join(projectRoot, 'build.gradle.kts');
    if (fs.existsSync(buildGradle) || fs.existsSync(buildGradleKts)) {
      indicators.push('build.gradle (Gradle)');
      confidence += 50;
    }

    // Check for settings.gradle (Gradle multi-module) (20 points)
    const settingsGradle = path.join(projectRoot, 'settings.gradle');
    const settingsGradleKts = path.join(projectRoot, 'settings.gradle.kts');
    if (fs.existsSync(settingsGradle) || fs.existsSync(settingsGradleKts)) {
      indicators.push('settings.gradle (Multi-module)');
      confidence += 20;
    }

    // Check for .java files (30 points)
    const hasJavaFiles = this.hasFilesWithExtensions(projectRoot, ['.java']);
    if (hasJavaFiles) {
      indicators.push('.java files');
      confidence += 30;
    }

    // Check for src/main/java directory (20 points)
    const srcMainJava = path.join(projectRoot, 'src', 'main', 'java');
    if (fs.existsSync(srcMainJava)) {
      indicators.push('src/main/java directory');
      confidence += 20;
    }

    // Cap at 100
    confidence = Math.min(100, confidence);

    return {
      language: Language.Java,
      confidence,
      indicators,
    };
  }

  /**
   * Check if project has files with specific extensions
   */
  private hasFilesWithExtensions(
    dir: string,
    extensions: string[],
    maxDepth: number = 3
  ): boolean {
    if (maxDepth === 0) return false;

    try {
      const entries = fs.readdirSync(dir, { withFileTypes: true });

      for (const entry of entries) {
        // Skip node_modules, .git, venv, etc.
        if (this.shouldSkipDirectory(entry.name)) {
          continue;
        }

        const fullPath = path.join(dir, entry.name);

        if (entry.isFile()) {
          const ext = path.extname(entry.name).toLowerCase();
          if (extensions.includes(ext)) {
            return true;
          }
        } else if (entry.isDirectory()) {
          // Recursively check subdirectories
          if (this.hasFilesWithExtensions(fullPath, extensions, maxDepth - 1)) {
            return true;
          }
        }
      }
    } catch (error) {
      // Ignore permission errors, etc.
    }

    return false;
  }

  /**
   * Directories to skip during file search
   */
  private shouldSkipDirectory(dirName: string): boolean {
    const skipDirs = [
      'node_modules',
      '.git',
      '.next',
      '.nuxt',
      'dist',
      'build',
      'out',
      'target',
      'venv',
      '.venv',
      'env',
      '.env',
      'virtualenv',
      '__pycache__',
      '.pytest_cache',
      'coverage',
      '.coverage',
    ];

    return skipDirs.includes(dirName);
  }

  /**
   * Get language display name
   */
  static getLanguageName(language: Language): string {
    switch (language) {
      case Language.TypeScript:
        return 'TypeScript';
      case Language.Python:
        return 'Python';
      case Language.Java:
        return 'Java';
      default:
        return 'Unknown';
    }
  }

  /**
   * Get language icon/emoji
   */
  static getLanguageIcon(language: Language): string {
    switch (language) {
      case Language.TypeScript:
        return '🔷';
      case Language.Python:
        return '🐍';
      case Language.Java:
        return '☕';
      default:
        return '❓';
    }
  }
}
