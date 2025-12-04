/**
 * Universal Project Detector
 * Makes Guardian work on ANY project, not just ODAVL
 * 
 * Supports:
 * - JavaScript/TypeScript: React, Vue, Angular, Next.js, Svelte, Node.js
 * - Python: Django, Flask, FastAPI, generic Python
 * - Go: Standard Go projects
 * - Rust: Cargo projects
 * - Java: Maven, Gradle, Spring Boot
 * - PHP: Laravel, Symfony
 * - Ruby: Rails
 * - C#/.NET: ASP.NET, .NET Core
 */

import { existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

// ============================================================================
// Types
// ============================================================================

export type ProjectLanguage = 
  | 'javascript' | 'typescript' | 'python' | 'go' | 'rust' 
  | 'java' | 'php' | 'ruby' | 'csharp' | 'unknown';

export type ProjectFramework = 
  // JavaScript/TypeScript
  | 'react' | 'vue' | 'angular' | 'nextjs' | 'nuxt' | 'svelte' 
  | 'express' | 'nestjs' | 'vite' | 'webpack'
  // Python
  | 'django' | 'flask' | 'fastapi' | 'pytest'
  // Go
  | 'gin' | 'echo' | 'fiber'
  // Rust
  | 'actix' | 'rocket' | 'axum'
  // Java
  | 'spring' | 'maven' | 'gradle'
  // PHP
  | 'laravel' | 'symfony'
  // Ruby
  | 'rails' | 'sinatra'
  // .NET
  | 'aspnet' | 'blazor'
  | 'generic' | 'unknown';

export type ProjectType = 
  | 'monorepo' | 'spa' | 'ssr' | 'api' | 'cli' | 'library' 
  | 'mobile' | 'desktop' | 'extension' | 'fullstack' | 'unknown';

export interface UniversalProjectInfo {
  // Basic identification
  name: string;
  path: string;
  language: ProjectLanguage;
  framework: ProjectFramework;
  type: ProjectType;
  confidence: number; // 0-100
  
  // Structure
  hasTests: boolean;
  hasCI: boolean;
  hasDocker: boolean;
  hasDocumentation: boolean;
  
  // Package management
  packageManager: 'npm' | 'yarn' | 'pnpm' | 'pip' | 'cargo' | 'go' | 'maven' | 'gradle' | 'composer' | 'bundler' | 'nuget' | 'unknown';
  dependencies: string[];
  devDependencies: string[];
  
  // Build & Test
  buildCommand?: string;
  testCommand?: string;
  lintCommand?: string;
  startCommand?: string;
  
  // Entry points
  entryPoints: string[];
  
  // Guardian adaptation
  recommendedTests: string[];
  recommendedAnalysis: string[];
  
  // Confidence factors
  detectionReasons: string[];
}

// ============================================================================
// Detection Patterns
// ============================================================================

interface DetectionPattern {
  files: string[];
  packages?: string[];
  keywords?: string[];
  confidence: number;
}

const LANGUAGE_PATTERNS: Record<ProjectLanguage, DetectionPattern> = {
  typescript: {
    files: ['tsconfig.json', 'tsconfig.build.json'],
    packages: ['typescript', '@types/node'],
    confidence: 95,
  },
  javascript: {
    files: ['package.json', '.eslintrc', '.eslintrc.js'],
    packages: ['eslint', 'prettier'],
    confidence: 90,
  },
  python: {
    files: ['requirements.txt', 'setup.py', 'pyproject.toml', 'Pipfile'],
    packages: ['pytest', 'flask', 'django'],
    confidence: 95,
  },
  go: {
    files: ['go.mod', 'go.sum'],
    confidence: 100,
  },
  rust: {
    files: ['Cargo.toml', 'Cargo.lock'],
    confidence: 100,
  },
  java: {
    files: ['pom.xml', 'build.gradle', 'build.gradle.kts'],
    confidence: 100,
  },
  php: {
    files: ['composer.json', 'composer.lock'],
    confidence: 95,
  },
  ruby: {
    files: ['Gemfile', 'Gemfile.lock'],
    confidence: 95,
  },
  csharp: {
    files: ['.csproj', '.sln', 'Directory.Build.props'],
    confidence: 100,
  },
  unknown: {
    files: [],
    confidence: 0,
  },
};

const FRAMEWORK_PATTERNS: Record<ProjectFramework, DetectionPattern> = {
  // JavaScript/TypeScript
  react: {
    files: [],
    packages: ['react', 'react-dom'],
    confidence: 95,
  },
  vue: {
    files: ['vue.config.js'],
    packages: ['vue', '@vue/cli'],
    confidence: 95,
  },
  angular: {
    files: ['angular.json'],
    packages: ['@angular/core', '@angular/cli'],
    confidence: 100,
  },
  nextjs: {
    files: ['next.config.js', 'next.config.mjs'],
    packages: ['next'],
    confidence: 100,
  },
  nuxt: {
    files: ['nuxt.config.js', 'nuxt.config.ts'],
    packages: ['nuxt'],
    confidence: 100,
  },
  svelte: {
    files: ['svelte.config.js'],
    packages: ['svelte'],
    confidence: 100,
  },
  express: {
    files: [],
    packages: ['express'],
    confidence: 85,
  },
  nestjs: {
    files: ['nest-cli.json'],
    packages: ['@nestjs/core'],
    confidence: 100,
  },
  vite: {
    files: ['vite.config.ts', 'vite.config.js'],
    packages: ['vite'],
    confidence: 100,
  },
  webpack: {
    files: ['webpack.config.js'],
    packages: ['webpack'],
    confidence: 90,
  },
  
  // Python
  django: {
    files: ['manage.py'],
    packages: ['django'],
    confidence: 100,
  },
  flask: {
    files: [],
    packages: ['flask'],
    confidence: 90,
  },
  fastapi: {
    files: [],
    packages: ['fastapi'],
    confidence: 95,
  },
  pytest: {
    files: ['pytest.ini'],
    packages: ['pytest'],
    confidence: 85,
  },
  
  // Go
  gin: {
    files: [],
    packages: ['github.com/gin-gonic/gin'],
    confidence: 90,
  },
  echo: {
    files: [],
    packages: ['github.com/labstack/echo'],
    confidence: 90,
  },
  fiber: {
    files: [],
    packages: ['github.com/gofiber/fiber'],
    confidence: 90,
  },
  
  // Rust
  actix: {
    files: [],
    packages: ['actix-web'],
    confidence: 90,
  },
  rocket: {
    files: [],
    packages: ['rocket'],
    confidence: 90,
  },
  axum: {
    files: [],
    packages: ['axum'],
    confidence: 90,
  },
  
  // Java
  spring: {
    files: ['application.properties', 'application.yml'],
    packages: ['org.springframework.boot'],
    confidence: 95,
  },
  maven: {
    files: ['pom.xml'],
    confidence: 100,
  },
  gradle: {
    files: ['build.gradle', 'build.gradle.kts'],
    confidence: 100,
  },
  
  // PHP
  laravel: {
    files: ['artisan'],
    packages: ['laravel/framework'],
    confidence: 100,
  },
  symfony: {
    files: ['symfony.lock'],
    packages: ['symfony/framework-bundle'],
    confidence: 100,
  },
  
  // Ruby
  rails: {
    files: ['Rakefile', 'config/application.rb'],
    packages: ['rails'],
    confidence: 100,
  },
  sinatra: {
    files: [],
    packages: ['sinatra'],
    confidence: 90,
  },
  
  // .NET
  aspnet: {
    files: ['Program.cs', 'Startup.cs'],
    confidence: 85,
  },
  blazor: {
    files: ['App.razor'],
    confidence: 95,
  },
  
  generic: {
    files: [],
    confidence: 50,
  },
  unknown: {
    files: [],
    confidence: 0,
  },
};

// ============================================================================
// Universal Project Detector Class
// ============================================================================

export class UniversalProjectDetector {
  private projectPath: string;

  constructor(projectPath: string) {
    this.projectPath = projectPath;
  }

  /**
   * Main detection entry point
   */
  async detectProject(): Promise<UniversalProjectInfo> {
    const detectionReasons: string[] = [];
    
    // Detect language
    const language = await this.detectLanguage();
    detectionReasons.push(`Language detected: ${language}`);
    
    // Detect framework
    const framework = await this.detectFramework(language);
    detectionReasons.push(`Framework detected: ${framework}`);
    
    // Detect type
    const type = await this.detectProjectType(language, framework);
    detectionReasons.push(`Project type detected: ${type}`);
    
    // Detect package manager
    const packageManager = await this.detectPackageManager(language);
    detectionReasons.push(`Package manager: ${packageManager}`);
    
    // Read dependencies
    const { dependencies, devDependencies } = await this.readDependencies(language, packageManager);
    
    // Detect structure
    const hasTests = await this.hasTests();
    const hasCI = await this.hasCI();
    const hasDocker = await this.hasDocker();
    const hasDocumentation = await this.hasDocumentation();
    
    // Get commands
    const commands = await this.detectCommands(language, packageManager);
    
    // Get entry points
    const entryPoints = await this.detectEntryPoints(language, framework);
    
    // Calculate confidence
    const confidence = this.calculateConfidence(language, framework, type);
    
    // Get project name
    const name = await this.getProjectName(language, packageManager);
    
    // Recommend tests and analysis
    const recommendedTests = this.getRecommendedTests(language, framework, type);
    const recommendedAnalysis = this.getRecommendedAnalysis(language, framework);
    
    return {
      name,
      path: this.projectPath,
      language,
      framework,
      type,
      confidence,
      hasTests,
      hasCI,
      hasDocker,
      hasDocumentation,
      packageManager,
      dependencies,
      devDependencies,
      buildCommand: commands.build,
      testCommand: commands.test,
      lintCommand: commands.lint,
      startCommand: commands.start,
      entryPoints,
      recommendedTests,
      recommendedAnalysis,
      detectionReasons,
    };
  }

  /**
   * Detect programming language
   */
  private async detectLanguage(): Promise<ProjectLanguage> {
    for (const [lang, pattern] of Object.entries(LANGUAGE_PATTERNS)) {
      if (lang === 'unknown') continue;
      
      // Check for marker files
      for (const file of pattern.files) {
        if (existsSync(join(this.projectPath, file))) {
          return lang as ProjectLanguage;
        }
      }
    }
    
    // Fallback: check for common source files
    const commonFiles = [
      { ext: '.ts', lang: 'typescript' as ProjectLanguage },
      { ext: '.js', lang: 'javascript' as ProjectLanguage },
      { ext: '.py', lang: 'python' as ProjectLanguage },
      { ext: '.go', lang: 'go' as ProjectLanguage },
      { ext: '.rs', lang: 'rust' as ProjectLanguage },
      { ext: '.java', lang: 'java' as ProjectLanguage },
      { ext: '.php', lang: 'php' as ProjectLanguage },
      { ext: '.rb', lang: 'ruby' as ProjectLanguage },
      { ext: '.cs', lang: 'csharp' as ProjectLanguage },
    ];
    
    for (const { ext, lang } of commonFiles) {
      const srcPath = join(this.projectPath, 'src');
      if (existsSync(srcPath)) {
        // Check if any files with this extension exist
        // (simplified check - in production, use glob)
        return lang;
      }
    }
    
    return 'unknown';
  }

  /**
   * Detect framework
   */
  private async detectFramework(language: ProjectLanguage): Promise<ProjectFramework> {
    // Read package.json if available
    let packageJson: any = null;
    const packageJsonPath = join(this.projectPath, 'package.json');
    if (existsSync(packageJsonPath)) {
      try {
        const content = await readFile(packageJsonPath, 'utf8');
        packageJson = JSON.parse(content);
      } catch {
        // Ignore parse errors
      }
    }
    
    // Check framework patterns
    for (const [fw, pattern] of Object.entries(FRAMEWORK_PATTERNS)) {
      if (fw === 'unknown' || fw === 'generic') continue;
      
      // Check marker files
      for (const file of pattern.files) {
        if (existsSync(join(this.projectPath, file))) {
          return fw as ProjectFramework;
        }
      }
      
      // Check packages in package.json
      if (packageJson && pattern.packages) {
        const allDeps = {
          ...packageJson.dependencies,
          ...packageJson.devDependencies,
        };
        
        for (const pkg of pattern.packages) {
          if (allDeps[pkg]) {
            return fw as ProjectFramework;
          }
        }
      }
    }
    
    return language === 'unknown' ? 'unknown' : 'generic';
  }

  /**
   * Detect project type
   */
  private async detectProjectType(language: ProjectLanguage, framework: ProjectFramework): Promise<ProjectType> {
    // Check for monorepo indicators
    const monorepoFiles = ['pnpm-workspace.yaml', 'lerna.json', 'nx.json', 'turbo.json'];
    for (const file of monorepoFiles) {
      if (existsSync(join(this.projectPath, file))) {
        return 'monorepo';
      }
    }
    
    // Framework-based detection
    if (['nextjs', 'nuxt'].includes(framework)) return 'ssr';
    if (['react', 'vue', 'angular', 'svelte'].includes(framework)) return 'spa';
    if (['express', 'nestjs', 'fastapi', 'flask', 'django', 'spring'].includes(framework)) return 'api';
    if (existsSync(join(this.projectPath, 'bin'))) return 'cli';
    
    // Check for VS Code extension
    if (existsSync(join(this.projectPath, 'extension.ts')) || 
        existsSync(join(this.projectPath, 'src', 'extension.ts'))) {
      return 'extension';
    }
    
    // Check package.json type
    const packageJsonPath = join(this.projectPath, 'package.json');
    if (existsSync(packageJsonPath)) {
      try {
        const content = await readFile(packageJsonPath, 'utf8');
        const packageJson = JSON.parse(content);
        
        if (packageJson.private === false || packageJson.publishConfig) return 'library';
        if (packageJson.main && !packageJson.dependencies?.react) return 'library';
      } catch {
        // Ignore
      }
    }
    
    return 'unknown';
  }

  /**
   * Detect package manager
   */
  private async detectPackageManager(language: ProjectLanguage): Promise<UniversalProjectInfo['packageManager']> {
    // Lock files indicate package manager
    if (existsSync(join(this.projectPath, 'pnpm-lock.yaml'))) return 'pnpm';
    if (existsSync(join(this.projectPath, 'yarn.lock'))) return 'yarn';
    if (existsSync(join(this.projectPath, 'package-lock.json'))) return 'npm';
    if (existsSync(join(this.projectPath, 'Pipfile.lock'))) return 'pip';
    if (existsSync(join(this.projectPath, 'Cargo.lock'))) return 'cargo';
    if (existsSync(join(this.projectPath, 'go.sum'))) return 'go';
    if (existsSync(join(this.projectPath, 'pom.xml'))) return 'maven';
    if (existsSync(join(this.projectPath, 'build.gradle'))) return 'gradle';
    if (existsSync(join(this.projectPath, 'composer.lock'))) return 'composer';
    if (existsSync(join(this.projectPath, 'Gemfile.lock'))) return 'bundler';
    
    // Fallback based on language
    const langDefaults: Record<ProjectLanguage, UniversalProjectInfo['packageManager']> = {
      javascript: 'npm',
      typescript: 'npm',
      python: 'pip',
      go: 'go',
      rust: 'cargo',
      java: 'maven',
      php: 'composer',
      ruby: 'bundler',
      csharp: 'nuget',
      unknown: 'unknown',
    };
    
    return langDefaults[language];
  }

  /**
   * Read dependencies from package files
   */
  private async readDependencies(language: ProjectLanguage, packageManager: UniversalProjectInfo['packageManager']): Promise<{ dependencies: string[]; devDependencies: string[] }> {
    let dependencies: string[] = [];
    let devDependencies: string[] = [];
    
    // Node.js projects
    if (['npm', 'yarn', 'pnpm'].includes(packageManager)) {
      const packageJsonPath = join(this.projectPath, 'package.json');
      if (existsSync(packageJsonPath)) {
        try {
          const content = await readFile(packageJsonPath, 'utf8');
          const packageJson = JSON.parse(content);
          dependencies = Object.keys(packageJson.dependencies || {});
          devDependencies = Object.keys(packageJson.devDependencies || {});
        } catch {
          // Ignore
        }
      }
    }
    
    // Python projects
    if (packageManager === 'pip') {
      const reqPath = join(this.projectPath, 'requirements.txt');
      if (existsSync(reqPath)) {
        try {
          const content = await readFile(reqPath, 'utf8');
          dependencies = content.split('\n')
            .filter(line => line.trim() && !line.startsWith('#'))
            .map(line => line.split('==')[0].trim());
        } catch {
          // Ignore
        }
      }
    }
    
    return { dependencies, devDependencies };
  }

  /**
   * Detect common commands
   */
  private async detectCommands(language: ProjectLanguage, packageManager: UniversalProjectInfo['packageManager']): Promise<{
    build?: string;
    test?: string;
    lint?: string;
    start?: string;
  }> {
    const commands: any = {};
    
    // Read from package.json scripts
    if (['npm', 'yarn', 'pnpm'].includes(packageManager)) {
      const packageJsonPath = join(this.projectPath, 'package.json');
      if (existsSync(packageJsonPath)) {
        try {
          const content = await readFile(packageJsonPath, 'utf8');
          const packageJson = JSON.parse(content);
          const scripts = packageJson.scripts || {};
          
          if (scripts.build) commands.build = `${packageManager} build`;
          if (scripts.test) commands.test = `${packageManager} test`;
          if (scripts.lint) commands.lint = `${packageManager} lint`;
          if (scripts.start || scripts.dev) commands.start = `${packageManager} ${scripts.dev ? 'dev' : 'start'}`;
        } catch {
          // Ignore
        }
      }
    }
    
    // Python defaults
    if (language === 'python') {
      commands.test = 'pytest';
      commands.lint = 'flake8';
      commands.start = 'python main.py';
    }
    
    // Go defaults
    if (language === 'go') {
      commands.build = 'go build';
      commands.test = 'go test ./...';
      commands.start = 'go run .';
    }
    
    // Rust defaults
    if (language === 'rust') {
      commands.build = 'cargo build';
      commands.test = 'cargo test';
      commands.start = 'cargo run';
    }
    
    return commands;
  }

  /**
   * Detect entry points
   */
  private async detectEntryPoints(language: ProjectLanguage, framework: ProjectFramework): Promise<string[]> {
    const entryPoints: string[] = [];
    
    // Common patterns
    const patterns = [
      'src/index.ts', 'src/index.js', 'src/main.ts', 'src/main.js',
      'index.ts', 'index.js', 'main.ts', 'main.js',
      'src/app.ts', 'src/app.js', 'app.ts', 'app.js',
      'src/server.ts', 'src/server.js', 'server.ts', 'server.js',
      'main.py', 'app.py', 'wsgi.py', '__main__.py',
      'main.go', 'cmd/main.go',
      'src/main.rs', 'main.rs',
      'Program.cs', 'Startup.cs',
    ];
    
    for (const pattern of patterns) {
      if (existsSync(join(this.projectPath, pattern))) {
        entryPoints.push(pattern);
      }
    }
    
    return entryPoints;
  }

  /**
   * Check if project has tests
   */
  private async hasTests(): Promise<boolean> {
    const testDirs = ['test', 'tests', '__tests__', 'spec'];
    const testFiles = ['*.test.ts', '*.test.js', '*.spec.ts', '*.spec.js', 'test_*.py', '*_test.go'];
    
    for (const dir of testDirs) {
      if (existsSync(join(this.projectPath, dir))) return true;
    }
    
    // Check for test files in src
    const srcPath = join(this.projectPath, 'src');
    if (existsSync(srcPath)) {
      // Simplified check - in production, use glob
      return true;
    }
    
    return false;
  }

  /**
   * Check if project has CI
   */
  private async hasCI(): Promise<boolean> {
    const ciFiles = [
      '.github/workflows',
      '.gitlab-ci.yml',
      '.circleci/config.yml',
      'azure-pipelines.yml',
      'Jenkinsfile',
    ];
    
    for (const file of ciFiles) {
      if (existsSync(join(this.projectPath, file))) return true;
    }
    
    return false;
  }

  /**
   * Check if project has Docker
   */
  private async hasDocker(): Promise<boolean> {
    return existsSync(join(this.projectPath, 'Dockerfile')) ||
           existsSync(join(this.projectPath, 'docker-compose.yml'));
  }

  /**
   * Check if project has documentation
   */
  private async hasDocumentation(): Promise<boolean> {
    const docFiles = ['README.md', 'docs', 'documentation'];
    
    for (const file of docFiles) {
      if (existsSync(join(this.projectPath, file))) return true;
    }
    
    return false;
  }

  /**
   * Get project name
   */
  private async getProjectName(language: ProjectLanguage, packageManager: UniversalProjectInfo['packageManager']): Promise<string> {
    // Try package.json
    if (['npm', 'yarn', 'pnpm'].includes(packageManager)) {
      const packageJsonPath = join(this.projectPath, 'package.json');
      if (existsSync(packageJsonPath)) {
        try {
          const content = await readFile(packageJsonPath, 'utf8');
          const packageJson = JSON.parse(content);
          if (packageJson.name) return packageJson.name;
        } catch {
          // Ignore
        }
      }
    }
    
    // Fallback to directory name
    return this.projectPath.split(/[\\/]/).pop() || 'unknown';
  }

  /**
   * Calculate confidence score
   */
  private calculateConfidence(language: ProjectLanguage, framework: ProjectFramework, type: ProjectType): number {
    let confidence = 0;
    
    // Language confidence
    if (language !== 'unknown') confidence += 40;
    
    // Framework confidence
    if (framework !== 'unknown' && framework !== 'generic') confidence += 30;
    
    // Type confidence
    if (type !== 'unknown') confidence += 30;
    
    return Math.min(100, confidence);
  }

  /**
   * Get recommended tests for this project
   */
  private getRecommendedTests(language: ProjectLanguage, framework: ProjectFramework, type: ProjectType): string[] {
    const tests: string[] = [];
    
    // Universal tests
    tests.push('static-analysis', 'type-checking');
    
    // Language-specific
    if (['javascript', 'typescript'].includes(language)) {
      tests.push('eslint', 'unit-tests');
    }
    
    if (language === 'python') {
      tests.push('flake8', 'mypy', 'pytest');
    }
    
    // Framework-specific
    if (['react', 'vue', 'angular'].includes(framework)) {
      tests.push('component-tests', 'visual-regression');
    }
    
    if (['nextjs', 'nuxt'].includes(framework)) {
      tests.push('runtime-tests', 'lighthouse', 'core-web-vitals');
    }
    
    if (type === 'api') {
      tests.push('api-tests', 'load-tests', 'security-scan');
    }
    
    if (type === 'extension') {
      tests.push('extension-host-tests');
    }
    
    return tests;
  }

  /**
   * Get recommended analysis for this project
   */
  private getRecommendedAnalysis(language: ProjectLanguage, framework: ProjectFramework): string[] {
    const analysis: string[] = [];
    
    // Universal
    analysis.push('dependency-audit', 'license-check');
    
    // Language-specific
    if (['javascript', 'typescript'].includes(language)) {
      analysis.push('bundle-size', 'dead-code');
    }
    
    if (language === 'python') {
      analysis.push('security-vulnerabilities', 'code-complexity');
    }
    
    // Framework-specific
    if (['react', 'vue'].includes(framework)) {
      analysis.push('performance-profiling');
    }
    
    return analysis;
  }
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Quick check if project is supported
 */
export async function isProjectSupported(projectPath: string): Promise<boolean> {
  const detector = new UniversalProjectDetector(projectPath);
  const info = await detector.detectProject();
  return info.language !== 'unknown' && info.confidence >= 50;
}

/**
 * Get quick project summary
 */
export async function getProjectSummary(projectPath: string): Promise<string> {
  const detector = new UniversalProjectDetector(projectPath);
  const info = await detector.detectProject();
  
  return `${info.name} (${info.language}/${info.framework}) - ${info.type} project`;
}

/**
 * Display project info in readable format
 */
export function displayProjectInfo(info: UniversalProjectInfo): string {
  const lines: string[] = [];
  
  lines.push('════════════════════════════════════════════════════════════');
  lines.push('🌍 Universal Project Detection');
  lines.push('════════════════════════════════════════════════════════════');
  lines.push('');
  
  lines.push(`📦 Project: ${info.name}`);
  lines.push(`   Language: ${info.language}`);
  lines.push(`   Framework: ${info.framework}`);
  lines.push(`   Type: ${info.type}`);
  lines.push(`   Confidence: ${info.confidence}%`);
  lines.push('');
  
  lines.push('🏗️  Structure:');
  lines.push(`   Tests: ${info.hasTests ? '✅' : '❌'}`);
  lines.push(`   CI/CD: ${info.hasCI ? '✅' : '❌'}`);
  lines.push(`   Docker: ${info.hasDocker ? '✅' : '❌'}`);
  lines.push(`   Documentation: ${info.hasDocumentation ? '✅' : '❌'}`);
  lines.push('');
  
  lines.push('📦 Package Management:');
  lines.push(`   Manager: ${info.packageManager}`);
  lines.push(`   Dependencies: ${info.dependencies.length}`);
  lines.push(`   Dev Dependencies: ${info.devDependencies.length}`);
  lines.push('');
  
  if (info.buildCommand || info.testCommand || info.lintCommand || info.startCommand) {
    lines.push('⚡ Commands:');
    if (info.buildCommand) lines.push(`   Build: ${info.buildCommand}`);
    if (info.testCommand) lines.push(`   Test: ${info.testCommand}`);
    if (info.lintCommand) lines.push(`   Lint: ${info.lintCommand}`);
    if (info.startCommand) lines.push(`   Start: ${info.startCommand}`);
    lines.push('');
  }
  
  if (info.entryPoints.length > 0) {
    lines.push('🎯 Entry Points:');
    info.entryPoints.forEach(ep => lines.push(`   - ${ep}`));
    lines.push('');
  }
  
  lines.push('💡 Recommended Guardian Tests:');
  info.recommendedTests.forEach(test => lines.push(`   - ${test}`));
  lines.push('');
  
  lines.push('🔍 Recommended Analysis:');
  info.recommendedAnalysis.forEach(analysis => lines.push(`   - ${analysis}`));
  lines.push('');
  
  lines.push('════════════════════════════════════════════════════════════');
  
  return lines.join('\n');
}
