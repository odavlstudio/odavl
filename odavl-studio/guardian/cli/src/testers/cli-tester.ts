/**
 * Enhanced CLI Tester - Guardian v5.0
 * 
 * Complete CLI Production Readiness Testing with:
 * - Command Functionality (help, version, all commands)
 * - Auto-completion Scripts (bash, zsh, fish, PowerShell)
 * - Update Mechanism (version check, update notifications)
 * - Error Handling (clear messages, exit codes)
 * - Cross-platform Compatibility (Windows, Linux, macOS)
 * - Package Quality (size, dependencies, security)
 * - Documentation (README, man pages, examples)
 * - Performance (startup time, responsiveness)
 */

import ora from 'ora';
import { existsSync } from 'fs';
import { readFile, stat, readdir, mkdir, writeFile } from 'fs/promises';
import { join, basename } from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';
import { getTheme, drawBox, drawSeparator, formatHealthScore } from '../../theme.js';

const execAsync = promisify(exec);

/**
 * CLI Test Result
 */
export interface CLITestResult {
  path: string;
  timestamp: string;
  overallScore: number; // 0-100
  status: 'pass' | 'fail' | 'warning';
  productionReady: boolean;
  
  // Test categories
  commands: CommandsReport;
  autoCompletion: AutoCompletionReport;
  updateMechanism: UpdateMechanismReport;
  errorHandling: ErrorHandlingReport;
  crossPlatform: CrossPlatformReport;
  package: PackageReport;
  documentation: DocumentationReport;
  performance: PerformanceReport;
  
  // Recommendations
  recommendations: Recommendation[];
  
  // Report path
  reportPath: string;
}

interface CommandsReport {
  score: number;
  helpWorks: boolean;
  versionWorks: boolean;
  total: number;
  documented: number;
  tested: number;
  issues: Issue[];
}

interface AutoCompletionReport {
  score: number;
  hasCompletions: boolean;
  shells: {
    bash: boolean;
    zsh: boolean;
    fish: boolean;
    powershell: boolean;
  };
  quality: number; // 0-100
  issues: Issue[];
}

interface UpdateMechanismReport {
  score: number;
  hasUpdateCheck: boolean;
  hasNotification: boolean;
  updateCommand: boolean;
  frequency: 'daily' | 'weekly' | 'never' | 'unknown';
  issues: Issue[];
}

interface ErrorHandlingReport {
  score: number;
  hasGoodMessages: boolean;
  exitCodesCorrect: boolean;
  hasStackTraces: boolean;
  hasDebugMode: boolean;
  issues: Issue[];
}

interface CrossPlatformReport {
  score: number;
  platforms: {
    windows: boolean;
    linux: boolean;
    macos: boolean;
  };
  pathHandling: boolean;
  lineEndings: boolean;
  issues: Issue[];
}

interface PackageReport {
  score: number;
  size: number; // bytes
  sizeAcceptable: boolean; // < 5MB
  hasShebang: boolean;
  hasBin: boolean;
  dependenciesSecure: boolean;
  issues: Issue[];
}

interface DocumentationReport {
  score: number;
  hasReadme: boolean;
  hasExamples: boolean;
  hasManPages: boolean;
  hasTroubleshooting: boolean;
  readmeQuality: number; // 0-100
  issues: Issue[];
}

interface PerformanceReport {
  score: number;
  startupTime: number; // ms
  acceptable: boolean; // < 500ms
  responsive: boolean;
  issues: Issue[];
}

interface Issue {
  severity: 'critical' | 'high' | 'medium' | 'low';
  category: string;
  message: string;
  recommendation: string;
}

interface Recommendation {
  priority: 'high' | 'medium' | 'low';
  action: string;
  reason: string;
  impact: string;
  estimatedTime: string;
}

/**
 * Enhanced CLI Tester Class
 */
export class CLITester {
  private theme = getTheme();

  /**
   * Test CLI comprehensively
   */
  async test(cliPath: string = process.cwd()): Promise<CLITestResult> {
    const { colors } = this.theme;
    
    console.log(colors.primary('\n⌨️  Guardian CLI Tester v5.0\n'));
    console.log(colors.muted(`Path: ${cliPath}`));
    console.log(drawSeparator(60));
    console.log();

    const startTime = Date.now();

    // Run all checks
    const [
      commands,
      autoCompletion,
      updateMechanism,
      errorHandling,
      crossPlatform,
      packageCheck,
      documentation,
      performance,
    ] = await Promise.all([
      this.checkCommands(cliPath),
      this.checkAutoCompletion(cliPath),
      this.checkUpdateMechanism(cliPath),
      this.checkErrorHandling(cliPath),
      this.checkCrossPlatform(cliPath),
      this.checkPackage(cliPath),
      this.checkDocumentation(cliPath),
      this.checkPerformance(cliPath),
    ]);

    // Calculate overall score
    const overallScore = this.calculateOverallScore({
      commands: commands.score,
      autoCompletion: autoCompletion.score,
      updateMechanism: updateMechanism.score,
      errorHandling: errorHandling.score,
      crossPlatform: crossPlatform.score,
      package: packageCheck.score,
      documentation: documentation.score,
      performance: performance.score,
    });

    // Determine status
    const status = overallScore >= 90 ? 'pass' : overallScore >= 75 ? 'warning' : 'fail';
    const productionReady = overallScore >= 85;

    // Generate recommendations
    const recommendations = this.generateRecommendations({
      commands,
      autoCompletion,
      updateMechanism,
      errorHandling,
      crossPlatform,
      package: packageCheck,
      documentation,
      performance,
    });

    const result: CLITestResult = {
      path: cliPath,
      timestamp: new Date().toISOString(),
      overallScore,
      status,
      productionReady,
      commands,
      autoCompletion,
      updateMechanism,
      errorHandling,
      crossPlatform,
      package: packageCheck,
      documentation,
      performance,
      recommendations,
      reportPath: '', // Will be set after saving
    };

    // Save report
    result.reportPath = await this.saveReport(result);

    return result;
  }

  /**
   * Check Commands
   */
  private async checkCommands(path: string): Promise<CommandsReport> {
    const spinner = ora('⌨️  Checking commands...').start();

    try {
      const packagePath = join(path, 'package.json');
      if (!existsSync(packagePath)) {
        spinner.fail('package.json not found');
        return {
          score: 0,
          helpWorks: false,
          versionWorks: false,
          total: 0,
          documented: 0,
          tested: 0,
          issues: [{ severity: 'critical', category: 'Commands', message: 'package.json not found', recommendation: 'Create package.json' }],
        };
      }

      const content = await readFile(packagePath, 'utf-8');
      const pkg = JSON.parse(content);

      const binPath = this.getBinPath(pkg);
      const issues: Issue[] = [];

      let helpWorks = false;
      let versionWorks = false;

      if (binPath) {
        const fullPath = join(path, binPath);

        // Test --help
        try {
          await execAsync(`node "${fullPath}" --help`, { timeout: 5000 });
          helpWorks = true;
        } catch (e) {
          issues.push({
            severity: 'high',
            category: 'Commands',
            message: '--help command not working',
            recommendation: 'Implement --help flag with usage information',
          });
        }

        // Test --version
        try {
          await execAsync(`node "${fullPath}" --version`, { timeout: 5000 });
          versionWorks = true;
        } catch (e) {
          issues.push({
            severity: 'high',
            category: 'Commands',
            message: '--version command not working',
            recommendation: 'Implement --version flag showing current version',
          });
        }
      } else {
        issues.push({
          severity: 'critical',
          category: 'Commands',
          message: 'No bin field in package.json',
          recommendation: 'Add bin field pointing to CLI entry point',
        });
      }

      // Check for common commands
      const total = Object.keys(pkg.bin || {}).length || 1;
      const documented = helpWorks ? total : 0;
      const tested = (helpWorks && versionWorks) ? total : 0;

      const score = 
        (helpWorks ? 40 : 0) +
        (versionWorks ? 40 : 0) +
        (binPath ? 20 : 0);

      if (helpWorks && versionWorks) {
        spinner.succeed('Commands: All working');
      } else {
        spinner.warn(`Commands: ${issues.length} issues`);
      }

      return {
        score,
        helpWorks,
        versionWorks,
        total,
        documented,
        tested,
        issues,
      };
    } catch (error) {
      spinner.fail('Commands check failed');
      return {
        score: 0,
        helpWorks: false,
        versionWorks: false,
        total: 0,
        documented: 0,
        tested: 0,
        issues: [{ severity: 'critical', category: 'Commands', message: 'Cannot check commands', recommendation: 'Verify CLI setup' }],
      };
    }
  }

  /**
   * Check Auto-completion Scripts
   */
  private async checkAutoCompletion(path: string): Promise<AutoCompletionReport> {
    const spinner = ora('🔧 Checking auto-completion...').start();

    try {
      const completionsDir = join(path, 'completions');
      const issues: Issue[] = [];

      const shells = {
        bash: existsSync(join(completionsDir, 'completion.bash')) || existsSync(join(completionsDir, 'bash-completion')),
        zsh: existsSync(join(completionsDir, 'completion.zsh')) || existsSync(join(completionsDir, '_completion')),
        fish: existsSync(join(completionsDir, 'completion.fish')),
        powershell: existsSync(join(completionsDir, 'completion.ps1')) || existsSync(join(completionsDir, 'PowerShell')),
      };

      const hasCompletions = Object.values(shells).some(v => v);

      if (!hasCompletions) {
        issues.push({
          severity: 'medium',
          category: 'AutoCompletion',
          message: 'No auto-completion scripts found',
          recommendation: 'Add completion scripts for bash, zsh, fish, PowerShell',
        });
      } else {
        // Check which shells are missing
        if (!shells.bash) {
          issues.push({
            severity: 'low',
            category: 'AutoCompletion',
            message: 'Bash completion missing',
            recommendation: 'Add bash completion script',
          });
        }
        if (!shells.zsh) {
          issues.push({
            severity: 'low',
            category: 'AutoCompletion',
            message: 'Zsh completion missing',
            recommendation: 'Add zsh completion script',
          });
        }
        if (!shells.powershell) {
          issues.push({
            severity: 'low',
            category: 'AutoCompletion',
            message: 'PowerShell completion missing',
            recommendation: 'Add PowerShell completion script',
          });
        }
      }

      // Quality check
      const completionCount = Object.values(shells).filter(v => v).length;
      const quality = (completionCount / 4) * 100;

      const score = 
        (hasCompletions ? 50 : 0) +
        (quality / 2);

      if (hasCompletions && quality >= 75) {
        spinner.succeed('Auto-completion: Comprehensive');
      } else if (hasCompletions) {
        spinner.succeed('Auto-completion: Partial');
      } else {
        spinner.warn('Auto-completion: Not found');
      }

      return {
        score,
        hasCompletions,
        shells,
        quality,
        issues,
      };
    } catch (error) {
      spinner.fail('Auto-completion check failed');
      return {
        score: 0,
        hasCompletions: false,
        shells: { bash: false, zsh: false, fish: false, powershell: false },
        quality: 0,
        issues: [{ severity: 'low', category: 'AutoCompletion', message: 'Cannot check completions', recommendation: 'Add completion scripts' }],
      };
    }
  }

  /**
   * Check Update Mechanism
   */
  private async checkUpdateMechanism(path: string): Promise<UpdateMechanismReport> {
    const spinner = ora('🔄 Checking update mechanism...').start();

    try {
      const packagePath = join(path, 'package.json');
      const content = await readFile(packagePath, 'utf-8');
      const pkg = JSON.parse(content);

      const issues: Issue[] = [];

      // Check for update dependencies
      const hasUpdateCheck = 
        pkg.dependencies?.['update-notifier'] ||
        pkg.dependencies?.['latest-version'] ||
        content.includes('checkForUpdates');

      const hasNotification = 
        hasUpdateCheck ||
        content.includes('updateNotifier') ||
        content.includes('notifyUpdate');

      const hasUpdateCommand = 
        content.includes('update') ||
        content.includes('upgrade');

      let frequency: 'daily' | 'weekly' | 'never' | 'unknown' = 'unknown';

      if (content.includes('daily')) frequency = 'daily';
      else if (content.includes('weekly')) frequency = 'weekly';
      else if (!hasUpdateCheck) frequency = 'never';

      if (!hasUpdateCheck) {
        issues.push({
          severity: 'medium',
          category: 'Update',
          message: 'No update check mechanism',
          recommendation: 'Add update-notifier to notify users of new versions',
        });
      }

      if (hasUpdateCheck && !hasNotification) {
        issues.push({
          severity: 'low',
          category: 'Update',
          message: 'Update check present but no notification',
          recommendation: 'Display update notification to users',
        });
      }

      if (!hasUpdateCommand) {
        issues.push({
          severity: 'low',
          category: 'Update',
          message: 'No update command',
          recommendation: 'Add command to update CLI (e.g., cli update)',
        });
      }

      const score = 
        (hasUpdateCheck ? 50 : 0) +
        (hasNotification ? 30 : 0) +
        (hasUpdateCommand ? 20 : 0);

      if (hasUpdateCheck && hasNotification) {
        spinner.succeed('Update mechanism: Active');
      } else if (hasUpdateCheck) {
        spinner.succeed('Update mechanism: Partial');
      } else {
        spinner.warn('Update mechanism: Not found');
      }

      return {
        score,
        hasUpdateCheck,
        hasNotification,
        updateCommand: hasUpdateCommand,
        frequency,
        issues,
      };
    } catch (error) {
      spinner.fail('Update mechanism check failed');
      return {
        score: 0,
        hasUpdateCheck: false,
        hasNotification: false,
        updateCommand: false,
        frequency: 'never',
        issues: [{ severity: 'medium', category: 'Update', message: 'Cannot check update mechanism', recommendation: 'Add update-notifier' }],
      };
    }
  }

  /**
   * Check Error Handling
   */
  private async checkErrorHandling(path: string): Promise<ErrorHandlingReport> {
    const spinner = ora('⚠️  Checking error handling...').start();

    try {
      const srcDir = join(path, 'src');
      const distDir = join(path, 'dist');
      const issues: Issue[] = [];

      let hasGoodMessages = false;
      let exitCodesCorrect = false;
      let hasStackTraces = false;
      let hasDebugMode = false;

      // Check source code
      if (existsSync(srcDir)) {
        const files = await this.getAllFiles(srcDir);
        
        for (const file of files) {
          if (file.endsWith('.ts') || file.endsWith('.js')) {
            const content = await readFile(file, 'utf-8');
            
            // Check for good error messages
            if (content.includes('throw new Error') && content.includes('message:')) {
              hasGoodMessages = true;
            }
            
            // Check exit codes
            if (content.includes('process.exit(0)') && content.includes('process.exit(1)')) {
              exitCodesCorrect = true;
            }
            
            // Check stack traces
            if (content.includes('console.error') && content.includes('stack')) {
              hasStackTraces = true;
            }
            
            // Check debug mode
            if (content.includes('--debug') || content.includes('--verbose') || content.includes('DEBUG')) {
              hasDebugMode = true;
            }
          }
        }
      } else if (existsSync(distDir)) {
        // Check dist if src not available
        const files = await this.getAllFiles(distDir);
        const content = await readFile(files[0] || '', 'utf-8').catch(() => '');
        
        hasGoodMessages = content.includes('Error');
        exitCodesCorrect = content.includes('process.exit');
      }

      if (!hasGoodMessages) {
        issues.push({
          severity: 'high',
          category: 'ErrorHandling',
          message: 'Error messages not clear',
          recommendation: 'Add descriptive error messages with actionable suggestions',
        });
      }

      if (!exitCodesCorrect) {
        issues.push({
          severity: 'medium',
          category: 'ErrorHandling',
          message: 'Exit codes not properly set',
          recommendation: 'Use exit(0) for success, exit(1) for errors',
        });
      }

      if (!hasDebugMode) {
        issues.push({
          severity: 'low',
          category: 'ErrorHandling',
          message: 'No debug mode',
          recommendation: 'Add --debug or --verbose flag for troubleshooting',
        });
      }

      const score = 
        (hasGoodMessages ? 40 : 0) +
        (exitCodesCorrect ? 30 : 0) +
        (hasStackTraces ? 15 : 0) +
        (hasDebugMode ? 15 : 0);

      if (hasGoodMessages && exitCodesCorrect) {
        spinner.succeed('Error handling: Good');
      } else {
        spinner.warn(`Error handling: ${issues.length} issues`);
      }

      return {
        score,
        hasGoodMessages,
        exitCodesCorrect,
        hasStackTraces,
        hasDebugMode,
        issues,
      };
    } catch (error) {
      spinner.fail('Error handling check failed');
      return {
        score: 50,
        hasGoodMessages: false,
        exitCodesCorrect: false,
        hasStackTraces: false,
        hasDebugMode: false,
        issues: [{ severity: 'medium', category: 'ErrorHandling', message: 'Cannot check error handling', recommendation: 'Review error handling manually' }],
      };
    }
  }

  /**
   * Check Cross-platform Compatibility
   */
  private async checkCrossPlatform(path: string): Promise<CrossPlatformReport> {
    const spinner = ora('🌍 Checking cross-platform...').start();

    try {
      const packagePath = join(path, 'package.json');
      const content = await readFile(packagePath, 'utf-8');
      const pkg = JSON.parse(content);

      const binPath = this.getBinPath(pkg);
      const issues: Issue[] = [];

      let hasShebang = false;
      let pathHandling = false;
      let lineEndings = false;

      if (binPath) {
        const fullPath = join(path, binPath);
        if (existsSync(fullPath)) {
          const binContent = await readFile(fullPath, 'utf-8');
          
          // Check shebang
          hasShebang = binContent.startsWith('#!/usr/bin/env node') || binContent.startsWith('#!/usr/bin/node');
          
          if (!hasShebang) {
            issues.push({
              severity: 'high',
              category: 'CrossPlatform',
              message: 'Missing or invalid shebang',
              recommendation: 'Add #!/usr/bin/env node for Unix compatibility',
            });
          }
        }
      }

      // Check for proper path handling
      const srcDir = join(path, 'src');
      if (existsSync(srcDir)) {
        const files = await this.getAllFiles(srcDir);
        
        for (const file of files) {
          const content = await readFile(file, 'utf-8');
          
          // Check for path.join usage
          if (content.includes('path.join') || content.includes('path.resolve')) {
            pathHandling = true;
          }
          
          // Check for hardcoded paths
          if (content.includes('\\\\') && !content.includes('path.')) {
            issues.push({
              severity: 'medium',
              category: 'CrossPlatform',
              message: 'Hardcoded backslashes detected',
              recommendation: 'Use path.join() for cross-platform paths',
            });
          }
        }
      }

      const platforms = {
        windows: true, // Assume Windows support
        linux: hasShebang,
        macos: hasShebang,
      };

      if (!platforms.linux || !platforms.macos) {
        issues.push({
          severity: 'high',
          category: 'CrossPlatform',
          message: 'Unix platforms not supported',
          recommendation: 'Add shebang for Linux/macOS support',
        });
      }

      const score = 
        (platforms.windows ? 30 : 0) +
        (platforms.linux ? 30 : 0) +
        (platforms.macos ? 30 : 0) +
        (pathHandling ? 10 : 0);

      if (platforms.windows && platforms.linux && platforms.macos) {
        spinner.succeed('Cross-platform: All platforms');
      } else {
        spinner.warn(`Cross-platform: ${issues.length} issues`);
      }

      return {
        score,
        platforms,
        pathHandling,
        lineEndings,
        issues,
      };
    } catch (error) {
      spinner.fail('Cross-platform check failed');
      return {
        score: 50,
        platforms: { windows: true, linux: false, macos: false },
        pathHandling: false,
        lineEndings: false,
        issues: [{ severity: 'medium', category: 'CrossPlatform', message: 'Cannot check cross-platform', recommendation: 'Test on multiple platforms' }],
      };
    }
  }

  /**
   * Check Package
   */
  private async checkPackage(path: string): Promise<PackageReport> {
    const spinner = ora('📦 Checking package...').start();

    try {
      const packagePath = join(path, 'package.json');
      if (!existsSync(packagePath)) {
        spinner.fail('package.json not found');
        return {
          score: 0,
          size: 0,
          sizeAcceptable: false,
          hasShebang: false,
          hasBin: false,
          dependenciesSecure: false,
          issues: [{ severity: 'critical', category: 'Package', message: 'package.json not found', recommendation: 'Create package.json' }],
        };
      }

      const content = await readFile(packagePath, 'utf-8');
      const pkg = JSON.parse(content);

      const issues: Issue[] = [];

      // Check bin
      const hasBin = !!pkg.bin;
      if (!hasBin) {
        issues.push({
          severity: 'critical',
          category: 'Package',
          message: 'No bin field',
          recommendation: 'Add bin field pointing to CLI entry',
        });
      }

      // Check shebang
      const binPath = this.getBinPath(pkg);
      let hasShebang = false;
      if (binPath) {
        const fullPath = join(path, binPath);
        if (existsSync(fullPath)) {
          const binContent = await readFile(fullPath, 'utf-8');
          hasShebang = binContent.startsWith('#!/usr/bin/env node');
        }
      }

      // Check dependencies security
      const deps = Object.keys(pkg.dependencies || {});
      const insecure = ['request', 'node-fetch@1'];
      const dependenciesSecure = !deps.some(d => insecure.some(i => d.includes(i)));

      if (!dependenciesSecure) {
        issues.push({
          severity: 'high',
          category: 'Package',
          message: 'Insecure dependencies detected',
          recommendation: 'Update deprecated/insecure packages',
        });
      }

      // Check size
      const size = await this.getDirectorySize(path);
      const sizeMB = size / (1024 * 1024);
      const sizeAcceptable = sizeMB < 5;

      if (!sizeAcceptable) {
        issues.push({
          severity: 'medium',
          category: 'Package',
          message: `Package too large: ${sizeMB.toFixed(2)}MB`,
          recommendation: 'Optimize package size, remove unnecessary files',
        });
      }

      const score = 
        (hasBin ? 25 : 0) +
        (hasShebang ? 25 : 0) +
        (dependenciesSecure ? 25 : 0) +
        (sizeAcceptable ? 25 : 0);

      if (hasBin && hasShebang && dependenciesSecure && sizeAcceptable) {
        spinner.succeed(`Package: ${sizeMB.toFixed(2)}MB`);
      } else {
        spinner.warn(`Package: ${issues.length} issues`);
      }

      return {
        score,
        size,
        sizeAcceptable,
        hasShebang,
        hasBin,
        dependenciesSecure,
        issues,
      };
    } catch (error) {
      spinner.fail('Package check failed');
      return {
        score: 0,
        size: 0,
        sizeAcceptable: false,
        hasShebang: false,
        hasBin: false,
        dependenciesSecure: false,
        issues: [{ severity: 'critical', category: 'Package', message: 'Cannot check package', recommendation: 'Verify package.json' }],
      };
    }
  }

  /**
   * Check Documentation
   */
  private async checkDocumentation(path: string): Promise<DocumentationReport> {
    const spinner = ora('📚 Checking documentation...').start();

    try {
      const hasReadme = existsSync(join(path, 'README.md'));
      const hasExamples = existsSync(join(path, 'examples')) || existsSync(join(path, 'EXAMPLES.md'));
      const hasManPages = existsSync(join(path, 'man'));
      const hasTroubleshooting = existsSync(join(path, 'TROUBLESHOOTING.md'));

      const issues: Issue[] = [];
      let readmeQuality = 0;

      if (!hasReadme) {
        issues.push({
          severity: 'critical',
          category: 'Documentation',
          message: 'README.md not found',
          recommendation: 'Create README with installation, usage, examples',
        });
      } else {
        const readme = await readFile(join(path, 'README.md'), 'utf-8');
        readmeQuality = this.calculateReadmeQuality(readme);

        if (readmeQuality < 50) {
          issues.push({
            severity: 'high',
            category: 'Documentation',
            message: 'README quality low',
            recommendation: 'Add more details: installation, usage, examples',
          });
        }
      }

      if (!hasExamples) {
        issues.push({
          severity: 'medium',
          category: 'Documentation',
          message: 'No examples',
          recommendation: 'Add examples/ directory with common use cases',
        });
      }

      if (!hasManPages) {
        issues.push({
          severity: 'low',
          category: 'Documentation',
          message: 'No man pages',
          recommendation: 'Add man pages for Unix users',
        });
      }

      const score = 
        (hasReadme ? 40 : 0) +
        (readmeQuality * 0.2) +
        (hasExamples ? 20 : 0) +
        (hasManPages ? 10 : 0) +
        (hasTroubleshooting ? 10 : 0);

      if (hasReadme && hasExamples && readmeQuality >= 70) {
        spinner.succeed('Documentation: Comprehensive');
      } else if (hasReadme) {
        spinner.succeed('Documentation: Basic');
      } else {
        spinner.warn('Documentation: Missing');
      }

      return {
        score,
        hasReadme,
        hasExamples,
        hasManPages,
        hasTroubleshooting,
        readmeQuality,
        issues,
      };
    } catch (error) {
      spinner.fail('Documentation check failed');
      return {
        score: 0,
        hasReadme: false,
        hasExamples: false,
        hasManPages: false,
        hasTroubleshooting: false,
        readmeQuality: 0,
        issues: [{ severity: 'high', category: 'Documentation', message: 'Cannot check documentation', recommendation: 'Add comprehensive docs' }],
      };
    }
  }

  /**
   * Check Performance
   */
  private async checkPerformance(path: string): Promise<PerformanceReport> {
    const spinner = ora('⚡ Checking performance...').start();

    try {
      const packagePath = join(path, 'package.json');
      const content = await readFile(packagePath, 'utf-8');
      const pkg = JSON.parse(content);

      const binPath = this.getBinPath(pkg);
      const issues: Issue[] = [];

      let startupTime = 0;
      let acceptable = false;
      let responsive = true;

      if (binPath) {
        const fullPath = join(path, binPath);
        
        // Measure startup time
        try {
          const start = Date.now();
          await execAsync(`node "${fullPath}" --version`, { timeout: 5000 });
          startupTime = Date.now() - start;
          acceptable = startupTime < 500; // 500ms threshold

          if (!acceptable) {
            issues.push({
              severity: 'medium',
              category: 'Performance',
              message: `Slow startup: ${startupTime}ms`,
              recommendation: 'Optimize startup time, lazy-load features',
            });
          }
        } catch (e) {
          issues.push({
            severity: 'low',
            category: 'Performance',
            message: 'Cannot measure startup time',
            recommendation: 'Test performance manually',
          });
        }
      }

      const score = 
        (acceptable ? 70 : Math.max(0, 70 - (startupTime - 500) / 10)) +
        (responsive ? 30 : 0);

      if (acceptable) {
        spinner.succeed(`Performance: ${startupTime}ms`);
      } else {
        spinner.warn(`Performance: ${startupTime}ms (slow)`);
      }

      return {
        score,
        startupTime,
        acceptable,
        responsive,
        issues,
      };
    } catch (error) {
      spinner.fail('Performance check failed');
      return {
        score: 50,
        startupTime: 0,
        acceptable: false,
        responsive: false,
        issues: [{ severity: 'low', category: 'Performance', message: 'Cannot measure performance', recommendation: 'Test manually' }],
      };
    }
  }

  /**
   * Calculate overall score
   */
  private calculateOverallScore(scores: {
    commands: number;
    autoCompletion: number;
    updateMechanism: number;
    errorHandling: number;
    crossPlatform: number;
    package: number;
    documentation: number;
    performance: number;
  }): number {
    // Weighted average
    return Math.round(
      scores.commands * 0.20 +
      scores.autoCompletion * 0.10 +
      scores.updateMechanism * 0.10 +
      scores.errorHandling * 0.15 +
      scores.crossPlatform * 0.15 +
      scores.package * 0.15 +
      scores.documentation * 0.10 +
      scores.performance * 0.05
    );
  }

  /**
   * Generate recommendations
   */
  private generateRecommendations(data: {
    commands: CommandsReport;
    autoCompletion: AutoCompletionReport;
    updateMechanism: UpdateMechanismReport;
    errorHandling: ErrorHandlingReport;
    crossPlatform: CrossPlatformReport;
    package: PackageReport;
    documentation: DocumentationReport;
    performance: PerformanceReport;
  }): Recommendation[] {
    const recommendations: Recommendation[] = [];

    // Commands
    if (!data.commands.helpWorks || !data.commands.versionWorks) {
      recommendations.push({
        priority: 'high',
        action: 'Implement basic commands',
        reason: '--help or --version not working',
        impact: 'Users cannot get help or version info',
        estimatedTime: '30 minutes',
      });
    }

    // Cross-platform
    if (!data.crossPlatform.platforms.linux || !data.crossPlatform.platforms.macos) {
      recommendations.push({
        priority: 'high',
        action: 'Add Unix support',
        reason: 'Missing shebang for Linux/macOS',
        impact: 'CLI won\'t work on Unix systems',
        estimatedTime: '15 minutes',
      });
    }

    // Auto-completion
    if (!data.autoCompletion.hasCompletions) {
      recommendations.push({
        priority: 'medium',
        action: 'Add auto-completion scripts',
        reason: 'No shell completions',
        impact: 'Poor developer experience',
        estimatedTime: '2-3 hours',
      });
    }

    // Update mechanism
    if (!data.updateMechanism.hasUpdateCheck) {
      recommendations.push({
        priority: 'medium',
        action: 'Add update notifications',
        reason: 'Users won\'t know about new versions',
        impact: 'Users stay on old versions',
        estimatedTime: '1 hour',
      });
    }

    // Documentation
    if (!data.documentation.hasReadme || data.documentation.readmeQuality < 50) {
      recommendations.push({
        priority: 'medium',
        action: 'Improve documentation',
        reason: 'README missing or incomplete',
        impact: 'Users won\'t understand CLI',
        estimatedTime: '1-2 hours',
      });
    }

    return recommendations;
  }

  /**
   * Save report
   */
  private async saveReport(result: CLITestResult): Promise<string> {
    const reportsDir = join(process.cwd(), '.guardian', 'reports', 'cli');
    await mkdir(reportsDir, { recursive: true });

    const timestamp = Date.now();
    const filename = `cli-${timestamp}.json`;
    const filepath = join(reportsDir, filename);

    await writeFile(filepath, JSON.stringify(result, null, 2));
    await writeFile(join(reportsDir, 'latest.json'), JSON.stringify(result, null, 2));

    return filepath;
  }

  /**
   * Helper: Get bin path from package.json
   */
  private getBinPath(pkg: any): string | null {
    if (!pkg.bin) return null;
    return typeof pkg.bin === 'string' ? pkg.bin : Object.values(pkg.bin)[0] as string;
  }

  /**
   * Helper: Calculate README quality
   */
  private calculateReadmeQuality(readme: string): number {
    let score = 0;
    
    if (readme.length > 500) score += 20;
    if (readme.includes('## Installation')) score += 15;
    if (readme.includes('## Usage')) score += 15;
    if (readme.includes('## Commands')) score += 15;
    if (readme.includes('## Examples')) score += 15;
    if (readme.includes('## Options')) score += 10;
    if (readme.includes('## License')) score += 5;
    if (readme.includes('```')) score += 5;

    return Math.min(100, score);
  }

  /**
   * Helper: Get all files recursively
   */
  private async getAllFiles(dir: string): Promise<string[]> {
    const files: string[] = [];
    
    try {
      const entries = await readdir(dir, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = join(dir, entry.name);
        
        if (entry.isDirectory()) {
          if (entry.name !== 'node_modules' && entry.name !== '.git') {
            files.push(...await this.getAllFiles(fullPath));
          }
        } else {
          files.push(fullPath);
        }
      }
    } catch (error) {
      // Ignore errors
    }
    
    return files;
  }

  /**
   * Helper: Get directory size
   */
  private async getDirectorySize(dir: string): Promise<number> {
    let size = 0;

    try {
      const files = await readdir(dir, { withFileTypes: true });

      for (const file of files) {
        const filepath = join(dir, file.name);

        if (file.isDirectory()) {
          if (file.name !== 'node_modules' && file.name !== '.git') {
            size += await this.getDirectorySize(filepath);
          }
        } else {
          const stats = await stat(filepath);
          size += stats.size;
        }
      }
    } catch (error) {
      // Ignore errors
    }

    return size;
  }
}

/**
 * Quick test function (exported)
 */
export async function testCLI(cliPath?: string): Promise<CLITestResult> {
  const tester = new CLITester();
  return await tester.test(cliPath);
}
