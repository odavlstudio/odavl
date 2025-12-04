/**
 * @file language-detector.ts
 * @description Universal language detection for any project
 * @version 4.3.0
 * 
 * Detects programming languages in a workspace by analyzing file patterns,
 * config files, and project structure. Supports multi-language projects.
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import { glob } from 'glob';

/**
 * Supported programming languages
 */
export type ProgrammingLanguage = 
  | 'typescript'
  | 'javascript'
  | 'python'
  | 'java'
  | 'go'
  | 'rust'
  | 'csharp'
  | 'cpp'
  | 'ruby'
  | 'php'
  | 'swift'
  | 'kotlin'
  | 'unknown';

/**
 * Language detection result
 */
export interface LanguageDetection {
  language: ProgrammingLanguage;
  confidence: number; // 0-100
  indicators: string[]; // What files/patterns led to detection
  fileCount: number;
  configFiles: string[];
  packageManagers: string[];
}

/**
 * Multi-language project detection
 */
export interface ProjectLanguages {
  primary: LanguageDetection;
  secondary: LanguageDetection[];
  totalFiles: number;
  detectedAt: string;
}

/**
 * Language-specific file patterns
 */
const LANGUAGE_PATTERNS: Record<ProgrammingLanguage, {
  extensions: string[];
  configFiles: string[];
  packageManagers: string[];
  directories: string[];
}> = {
  typescript: {
    extensions: ['.ts', '.tsx', '.mts', '.cts'],
    configFiles: ['tsconfig.json', 'tsconfig.build.json', 'tsconfig.base.json'],
    packageManagers: ['package.json', 'pnpm-lock.yaml', 'yarn.lock', 'package-lock.json'],
    directories: ['src', 'lib', 'dist', 'types'],
  },
  javascript: {
    extensions: ['.js', '.jsx', '.mjs', '.cjs'],
    configFiles: ['.eslintrc', '.prettierrc', '.babelrc', 'webpack.config.js'],
    packageManagers: ['package.json', 'pnpm-lock.yaml', 'yarn.lock'],
    directories: ['src', 'lib', 'dist', 'public'],
  },
  python: {
    extensions: ['.py', '.pyx', '.pyi'],
    configFiles: ['pyproject.toml', 'setup.py', 'setup.cfg', 'requirements.txt', 'Pipfile'],
    packageManagers: ['poetry.lock', 'Pipfile.lock', 'requirements.txt'],
    directories: ['src', 'lib', 'tests', '__pycache__', 'venv', '.venv'],
  },
  java: {
    extensions: ['.java', '.jar', '.class'],
    configFiles: ['pom.xml', 'build.gradle', 'build.gradle.kts', 'settings.gradle'],
    packageManagers: ['pom.xml', 'build.gradle', 'gradle.properties'],
    directories: ['src/main/java', 'src/test/java', 'target', 'build'],
  },
  go: {
    extensions: ['.go'],
    configFiles: ['go.mod', 'go.sum', 'go.work'],
    packageManagers: ['go.mod', 'go.sum'],
    directories: ['cmd', 'pkg', 'internal', 'vendor'],
  },
  rust: {
    extensions: ['.rs'],
    configFiles: ['Cargo.toml', 'Cargo.lock', 'rust-toolchain.toml'],
    packageManagers: ['Cargo.toml', 'Cargo.lock'],
    directories: ['src', 'target', 'tests', 'benches'],
  },
  csharp: {
    extensions: ['.cs', '.csx', '.cshtml', '.razor'],
    configFiles: ['.csproj', '.sln', 'nuget.config', 'Directory.Build.props'],
    packageManagers: ['packages.config', 'paket.dependencies'],
    directories: ['bin', 'obj', 'Properties'],
  },
  cpp: {
    extensions: ['.cpp', '.cc', '.cxx', '.c', '.h', '.hpp', '.hxx'],
    configFiles: ['CMakeLists.txt', 'Makefile', 'meson.build', 'conanfile.txt'],
    packageManagers: ['conanfile.txt', 'vcpkg.json'],
    directories: ['src', 'include', 'build', 'cmake'],
  },
  ruby: {
    extensions: ['.rb', '.rake', '.gemspec'],
    configFiles: ['Gemfile', 'Rakefile', '.ruby-version'],
    packageManagers: ['Gemfile.lock', 'Gemfile'],
    directories: ['lib', 'spec', 'test', 'bin'],
  },
  php: {
    extensions: ['.php', '.phtml', '.php5', '.php7'],
    configFiles: ['composer.json', 'composer.lock', 'phpunit.xml'],
    packageManagers: ['composer.json', 'composer.lock'],
    directories: ['src', 'vendor', 'public', 'tests'],
  },
  swift: {
    extensions: ['.swift'],
    configFiles: ['Package.swift', 'Podfile', 'Cartfile'],
    packageManagers: ['Package.resolved', 'Podfile.lock', 'Cartfile.resolved'],
    directories: ['Sources', 'Tests', '.build'],
  },
  kotlin: {
    extensions: ['.kt', '.kts'],
    configFiles: ['build.gradle.kts', 'settings.gradle.kts'],
    packageManagers: ['build.gradle.kts', 'gradle.properties'],
    directories: ['src/main/kotlin', 'src/test/kotlin'],
  },
  unknown: {
    extensions: [],
    configFiles: [],
    packageManagers: [],
    directories: [],
  },
};

/**
 * LanguageDetector - Detects programming languages in a workspace
 */
export class LanguageDetector {
  private workspaceRoot: string;
  private cache = new Map<string, ProjectLanguages>();

  constructor(workspaceRoot: string) {
    this.workspaceRoot = workspaceRoot;
  }

  /**
   * Detect all languages in the workspace
   */
  async detectLanguages(): Promise<ProjectLanguages> {
    // Check cache
    const cached = this.cache.get(this.workspaceRoot);
    if (cached) {
      return cached;
    }

    const detections: LanguageDetection[] = [];

    // Scan for each language
    for (const [lang, patterns] of Object.entries(LANGUAGE_PATTERNS)) {
      if (lang === 'unknown') continue;

      const detection = await this.detectLanguage(lang as ProgrammingLanguage, patterns);
      if (detection.confidence > 10) {
        detections.push(detection);
      }
    }

    // Sort by confidence
    detections.sort((a, b) => b.confidence - a.confidence);

    const result: ProjectLanguages = {
      primary: detections[0] || {
        language: 'unknown',
        confidence: 0,
        indicators: [],
        fileCount: 0,
        configFiles: [],
        packageManagers: [],
      },
      secondary: detections.slice(1, 3), // Top 2 secondary languages
      totalFiles: detections.reduce((sum, d) => sum + d.fileCount, 0),
      detectedAt: new Date().toISOString(),
    };

    // Cache result
    this.cache.set(this.workspaceRoot, result);

    return result;
  }

  /**
   * Detect a specific language
   */
  private async detectLanguage(
    language: ProgrammingLanguage,
    patterns: typeof LANGUAGE_PATTERNS[ProgrammingLanguage]
  ): Promise<LanguageDetection> {
    const indicators: string[] = [];
    let confidence = 0;
    let fileCount = 0;
    const foundConfigFiles: string[] = [];
    const foundPackageManagers: string[] = [];

    try {
      // 1. Check config files (high confidence)
      for (const configFile of patterns.configFiles) {
        const configPath = path.join(this.workspaceRoot, configFile);
        try {
          await fs.access(configPath);
          indicators.push(`Found ${configFile}`);
          foundConfigFiles.push(configFile);
          confidence += 20;
        } catch {
          // File doesn't exist
        }
      }

      // 2. Check package managers (high confidence)
      for (const packageManager of patterns.packageManagers) {
        const pmPath = path.join(this.workspaceRoot, packageManager);
        try {
          await fs.access(pmPath);
          indicators.push(`Found ${packageManager}`);
          foundPackageManagers.push(packageManager);
          confidence += 15;
        } catch {
          // File doesn't exist
        }
      }

      // 3. Count source files (medium confidence)
      const fileExtensions = patterns.extensions.map(ext => `**/*${ext}`);
      const files = await glob(fileExtensions, {
        cwd: this.workspaceRoot,
        ignore: ['**/node_modules/**', '**/dist/**', '**/build/**', '**/.git/**', '**/vendor/**', '**/.next/**', '**/coverage/**'],
        nodir: true,
        absolute: false,
      });

      fileCount = files.length;
      if (fileCount > 0) {
        const fileIndicator = `Found ${fileCount} ${language} files`;
        indicators.push(fileIndicator);
        // More aggressive scoring: 1 point per file up to 50 points
        confidence += Math.min(fileCount, 50);
      }

      // 4. Check language-specific directories (low confidence)
      for (const dir of patterns.directories) {
        const dirPath = path.join(this.workspaceRoot, dir);
        try {
          const stat = await fs.stat(dirPath);
          if (stat.isDirectory()) {
            indicators.push(`Found ${dir} directory`);
            confidence += 5;
          }
        } catch {
          // Directory doesn't exist
        }
      }

      // Cap confidence at 100
      confidence = Math.min(confidence, 100);

    } catch {
      // Detection failed, return zero confidence
      confidence = 0;
    }

    return {
      language,
      confidence: Math.round(confidence),
      indicators,
      fileCount,
      configFiles: foundConfigFiles,
      packageManagers: foundPackageManagers,
    };
  }

  /**
   * Check if workspace is a specific language
   */
  async isLanguage(language: ProgrammingLanguage, minConfidence = 50): Promise<boolean> {
    const languages = await this.detectLanguages();
    
    if (languages.primary.language === language && languages.primary.confidence >= minConfidence) {
      return true;
    }

    return languages.secondary.some(
      lang => lang.language === language && lang.confidence >= minConfidence
    );
  }

  /**
   * Get primary language
   */
  async getPrimaryLanguage(): Promise<ProgrammingLanguage> {
    const languages = await this.detectLanguages();
    return languages.primary.language;
  }

  /**
   * Check if project is multi-language
   */
  async isMultiLanguage(): Promise<boolean> {
    const languages = await this.detectLanguages();
    return languages.secondary.length > 0 && languages.secondary[0].confidence > 30;
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.cache.clear();
  }
}
