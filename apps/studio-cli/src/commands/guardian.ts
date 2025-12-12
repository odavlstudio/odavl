/**
 * ODAVL Guardian v3.0 CLI Commands
 * Launch Validator - Static analysis for production readiness
 */

import chalk from 'chalk';
import ora from 'ora';
import * as path from 'path';
import * as fs from 'fs';
import { LaunchValidator } from '@odavl-studio/guardian-core';
import type { ProductType } from '@odavl-studio/guardian-core';
import { displayError, displaySuccess, ErrorMessages, Spinner } from '@odavl/core';
import { ODAVLCloudClient } from '@odavl-studio/cloud-client';
import { CredentialStore } from '@odavl-studio/cloud-client';

// Type definitions for Guardian issues and results
interface GuardianIssue {
  message: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  file?: string;
  autoFixable?: boolean;
}

interface InspectionReport {
  productName: string;
  readinessScore: number;
  status: 'ready' | 'unstable' | 'blocked';
  issues: GuardianIssue[];
}

interface FixResult {
  success: boolean;
  fixType: string;
  details?: string;
  error?: string;
}

interface ValidationResultType {
  productType: ProductType;
  report: InspectionReport;
  fixesApplied?: FixResult[];
  verificationReport?: InspectionReport;
}

/**
 * Validate product path exists
 */
function validateProductPath(productPath: string): string {
  const absolutePath = path.resolve(process.cwd(), productPath);
  
  if (!fs.existsSync(absolutePath)) {
    console.error(chalk.red(`\n❌ Error: Path does not exist`));
    console.error(chalk.gray(`   ${absolutePath}\n`));
    process.exit(1);
  }

  const packageJsonPath = path.join(absolutePath, 'package.json');
  if (!fs.existsSync(packageJsonPath)) {
    console.error(chalk.red(`\n❌ Error: Not a valid product (missing package.json)`));
    console.error(chalk.gray(`   ${absolutePath}\n`));
    process.exit(1);
  }

  return absolutePath;
}

/**
 * Handle CLI errors gracefully
 */
function handleError(error: any, operation: string): never {
  const errorCode = 'GUARDIAN_001';
  let suggestion = error.message;
  
  if (error.code === 'EACCES') {
    suggestion = 'Permission denied. Try running with elevated privileges.';
  } else if (error.code === 'ENOENT') {
    suggestion = 'File or directory not found.';
  } else if (error.message.includes('package.json')) {
    suggestion = 'Invalid package.json format.';
  }
  
  displayError({
    code: errorCode,
    message: `${operation} failed`,
    severity: 'high',
    suggestion,
    quickFix: 'odavl guardian --help',
    learnMore: 'docs/guardian/troubleshooting.md'
  });
  
  process.exit(1);
}

/**
 * Check product readiness
 * Usage: odavl guardian check <path>
 */
export async function checkProduct(productPath: string, productType: ProductType = 'auto') {
  const spinner = new Spinner('Analyzing product...');
  spinner.start();

  try {
    const absolutePath = validateProductPath(productPath);
    const validator = new LaunchValidator();
    
    const result = await validator.validateProduct(productType, absolutePath);

    spinner.succeed('Analysis complete');

    // Display header
    console.log(chalk.bold('\n🛡️  ODAVL Guardian v3.0 - Launch Validator\n'));
    console.log(chalk.gray(`Product: ${result.report.productName}`));
    console.log(chalk.gray(`Type: ${result.productType}`));
    console.log(chalk.gray(`Path: ${absolutePath}\n`));

    // Display readiness score
    const score = result.report.readinessScore;
    let scoreColor = chalk.green;
    let statusEmoji = '✅';
    
    if (score < 70) {
      scoreColor = chalk.red;
      statusEmoji = '❌';
    } else if (score < 90) {
      scoreColor = chalk.yellow;
      statusEmoji = '⚠️';
    }

    console.log(scoreColor.bold(`${statusEmoji} Readiness: ${score}% (${result.report.status})`));

    // OMEGA-P5 Phase 4 Commit 5: Display OMS file risk summary
    try {
      const { loadOMSContext, resolveFileType, computeFileRiskScore } = await import('@odavl-studio/oms');
      await loadOMSContext();
      const fileRisks = result.report.issues.map((i: GuardianIssue) => {
        const fileType = resolveFileType(i.file || '');
        return fileType ? computeFileRiskScore({ type: fileType }) : 0;
      });
      if (fileRisks.length > 0) {
        const avgRisk = fileRisks.reduce((s: number, r: number) => s + r, 0) / fileRisks.length;
        const criticalFiles = fileRisks.filter((r: number) => r >= 0.7).length;
        console.log(chalk.white(`\n📊 File Risk (OMS): Avg ${(avgRisk * 100).toFixed(1)}%, ${criticalFiles} critical`));
      }
    } catch { /* OMS unavailable */ }

    // Display issues
    if (result.report.issues.length > 0) {
      console.log(chalk.bold(`\n📋 Issues found: ${result.report.issues.length}\n`));

      // Group by severity
      const critical = result.report.issues.filter((i: GuardianIssue) => i.severity === 'critical');
      const high = result.report.issues.filter((i: GuardianIssue) => i.severity === 'high');
      const medium = result.report.issues.filter((i: GuardianIssue) => i.severity === 'medium');
      const low = result.report.issues.filter((i: GuardianIssue) => i.severity === 'low');

      if (critical.length > 0) {
        console.log(chalk.red.bold(`🔴 Critical (${critical.length}):` ));
        critical.forEach((issue: GuardianIssue) => {
          console.log(chalk.red(`  • ${issue.message}`));
          if (issue.autoFixable) console.log(chalk.gray('    (auto-fixable)'));
        });
        console.log();
      }

      if (high.length > 0) {
        console.log(chalk.yellow.bold(`🟡 High (${high.length}):` ));
        high.forEach((issue: GuardianIssue) => {
          console.log(chalk.yellow(`  • ${issue.message}`));
          if (issue.autoFixable) console.log(chalk.gray('    (auto-fixable)'));
        });
        console.log();
      }

      if (medium.length > 0) {
        console.log(chalk.blue.bold(`🔵 Medium (${medium.length}):` ));
        medium.forEach((issue: GuardianIssue) => {
          console.log(chalk.blue(`  • ${issue.message}`));
          if (issue.autoFixable) console.log(chalk.gray('    (auto-fixable)'));
        });
        console.log();
      }

      if (low.length > 0) {
        console.log(chalk.gray.bold(`⚪ Low (${low.length}):` ));
        low.forEach((issue: GuardianIssue) => {
          console.log(chalk.gray(`  • ${issue.message}`));
        });
        console.log();
      }

      // Show auto-fix suggestion
      const autoFixableCount = result.report.issues.filter((i: GuardianIssue) => i.autoFixable).length;
      if (autoFixableCount > 0) {
        console.log(chalk.green(`💡 ${autoFixableCount} issues can be auto-fixed`));
        console.log(chalk.gray(`Run: ${chalk.cyan(`odavl guardian fix ${productPath}`)}\n`));
      }
    } else {
      console.log(chalk.green.bold('\n✨ No issues found - ready for launch!\n'));
    }

    // Cloud Sync (Phase 1.4)
    await syncTestResultsToCloud(result, absolutePath, productType);

    return result;
  } catch (error: any) {
    spinner.stop();
    handleError(error, 'Analysis');
  }
}

/**
 * Fix product issues automatically
 * Usage: odavl guardian fix <path>
 */
export async function fixProduct(productPath: string, productType: ProductType = 'auto') {
  console.log(chalk.bold('\n🛡️  ODAVL Guardian v3.0 - Auto-Fixer\n'));

  const spinner = ora('Scanning for issues...').start();

  try {
    const absolutePath = validateProductPath(productPath);
    const validator = new LaunchValidator();
    
    const result = await validator.validateAndFix(productType, absolutePath);

    spinner.stop();

    console.log(chalk.gray(`Product: ${result.report.productName}`));
    console.log(chalk.gray(`Type: ${result.productType}\n`));

    // Display initial score
    console.log(chalk.yellow(`Initial readiness: ${result.report.readinessScore}%`));
    console.log(chalk.gray(`Issues found: ${result.report.issues.length}\n`));

    // Display fixes applied
    if (result.fixesApplied && result.fixesApplied.length > 0) {
      console.log(chalk.bold('🔧 Fixes applied:\n'));
      result.fixesApplied.forEach((fix: FixResult) => {
        if (fix.success) {
          console.log(chalk.green(`  ✅ ${fix.fixType}`));
          if (fix.details) console.log(chalk.gray(`     ${fix.details}`));
        } else {
          console.log(chalk.red(`  ❌ ${fix.fixType}`));
          if (fix.error) console.log(chalk.gray(`     ${fix.error}`));
        }
      });
      console.log();
    }

    // Display verification results
    if (result.verificationReport) {
      const improved = result.verificationReport.readinessScore > result.report.readinessScore;
      const finalScore = result.verificationReport.readinessScore;
      
      if (improved) {
        console.log(chalk.green.bold(`✅ Final readiness: ${finalScore}%`));
        console.log(chalk.green(`Improved by: +${finalScore - result.report.readinessScore}%\n`));
      } else {
        console.log(chalk.yellow(`Final readiness: ${finalScore}%`));
        console.log(chalk.gray('Some issues require manual fixes\n'));
      }

      // Show remaining issues
      const remainingIssues = result.verificationReport.issues;
      if (remainingIssues.length > 0) {
        console.log(chalk.yellow(`⚠️  ${remainingIssues.length} issues remaining:`));
        remainingIssues.forEach((issue: GuardianIssue) => {
          console.log(chalk.gray(`  • ${issue.message}`));
        });
        console.log();
      } else {
        console.log(chalk.green.bold('🎉 All issues resolved - ready for launch!\n'));
      }
    }

    return result;
  } catch (error: any) {
    spinner.stop();
    handleError(error, 'Fix operation');
  }
}

/**
 * Check all products in workspace
 * Usage: odavl guardian check-all
 */
export async function checkAllProducts() {
  console.log(chalk.bold('\n🛡️  ODAVL Guardian v3.0 - Workspace Scan\n'));

  const spinner = ora('Scanning workspace...').start();

  try {
    const validator = new LaunchValidator();
    const workspacePath = process.cwd();
    
    const reports = await validator.validateAllProducts(workspacePath);

    spinner.stop();

    if (reports.length === 0) {
      console.log(chalk.yellow('No products found in workspace\n'));
      return;
    }

    console.log(chalk.gray(`Found ${reports.length} products\n`));

    // Display each product
    reports.forEach((result: ValidationResultType, index: number) => {
      const score = result.report.readinessScore;
      let scoreColor = chalk.green;
      let statusEmoji = '✅';
      
      if (score < 70) {
        scoreColor = chalk.red;
        statusEmoji = '❌';
      } else if (score < 90) {
        scoreColor = chalk.yellow;
        statusEmoji = '⚠️';
      }

      console.log(`${chalk.bold(`[${index + 1}/${reports.length}]`)} ${result.report.productName}`);
      console.log(`     ${scoreColor(`${statusEmoji} ${score}% (${result.report.status})`)}`);
      
      if (result.report.issues.length > 0) {
        const critical = result.report.issues.filter((i: GuardianIssue) => i.severity === 'critical').length;
        const high = result.report.issues.filter((i: GuardianIssue) => i.severity === 'high').length;
        
        if (critical > 0) console.log(chalk.red(`     🔴 ${critical} critical issues`));
        if (high > 0) console.log(chalk.yellow(`     🟡 ${high} high issues`));
      }
      
      console.log();
    });

    // Summary
    const ready = reports.filter((r: ValidationResultType) => r.report.status === 'ready').length;
    const unstable = reports.filter((r: ValidationResultType) => r.report.status === 'unstable').length;
    const blocked = reports.filter((r: ValidationResultType) => r.report.status === 'blocked').length;
    const avgScore = Math.round(
      reports.reduce((sum: number, r: ValidationResultType) => sum + r.report.readinessScore, 0) / reports.length
    );

    console.log(chalk.bold('━━━━━━━━━━━━━━━━━━━━━━━'));
    console.log(chalk.bold('📊 SUMMARY'));
    console.log(chalk.green(`Ready: ${ready}/${reports.length} products`));
    if (unstable > 0) console.log(chalk.yellow(`Unstable: ${unstable}`));
    if (blocked > 0) console.log(chalk.red(`Blocked: ${blocked}`));
    console.log(chalk.gray(`Average: ${avgScore}%\n`));

    const totalAutoFixable = reports.reduce(
      (sum: number, r: ValidationResultType) => sum + r.report.issues.filter((i: GuardianIssue) => i.autoFixable).length,
      0
    );

    if (totalAutoFixable > 0) {
      console.log(chalk.green(`🔧 ${totalAutoFixable} auto-fixable issues across all products\n`));
    }

    return reports;
  } catch (error: any) {
    spinner.stop();
    handleError(error, 'Workspace scan');
  }
}

// Legacy v2 commands (kept for backward compatibility)
export async function runPreDeployTests(url: string, tests: string) {
  console.log(chalk.yellow('\n⚠️  Note: This is a legacy v2 command'));
  console.log(chalk.gray('For v3 launch validation, use: odavl guardian check <path>\n'));
  
  try {
    new URL(url);
    console.log(chalk.gray(`Target: ${url}`));
    console.log(chalk.gray(`Tests: ${tests}\n`));
    console.log(chalk.green('✅ URL-based testing will be restored in future release\n'));
  } catch {
    throw new Error(`Invalid URL format: ${url}`);
  }
}

export async function runSingleTest(_url: string, testType: string) {
  console.log(chalk.gray(`Running ${testType} test (legacy command)...`));
  console.log(chalk.gray('Use: odavl guardian check <path> instead\n'));
}

/**
 * Sync Guardian test results to cloud (Phase 1.4)
 */
async function syncTestResultsToCloud(result: any, productPath: string, productType: ProductType) {
  const spinner = ora('☁️  Syncing test results to cloud...').start();

  try {
    // Check if user is authenticated
    const credStore = new CredentialStore();
    const creds = await credStore.get();
    
    if (!creds || !creds.apiKey) {
      spinner.info(chalk.gray('☁️  Skipped cloud sync (not logged in)'));
      spinner.info(chalk.gray('   Run "odavl login" to enable cloud sync'));
      return;
    }

    // Initialize cloud client
    const client = new ODAVLCloudClient({
      apiKey: creds.apiKey,
      baseUrl: process.env.ODAVL_API_URL || 'https://api.odavl.io',
      offlineQueue: true,
    });

    const productName = productPath.split(/[/\\]/).pop() || 'Unknown';

    // Upload test results to cloud
    await client.uploadGuardianTest({
      productPath,
      productName,
      productType,
      timestamp: new Date().toISOString(),
      readinessScore: result.report.readinessScore,
      status: result.report.status,
      issues: result.report.issues,
      autoFixable: result.report.issues.filter((i: any) => i.autoFixable).length,
    });

    spinner.succeed(chalk.green('☁️  Test results synced to cloud'));
    spinner.info(chalk.gray('   View dashboard: https://studio.odavl.com/dashboard/guardian'));
  } catch (error: any) {
    if (error.name === 'RateLimitError') {
      spinner.warn(chalk.yellow(`☁️  Rate limit exceeded. Try again in ${error.retryAfter}s`));
    } else if (error.name === 'AuthenticationError') {
      spinner.warn(chalk.yellow('☁️  Authentication failed. Run: odavl login'));
    } else if (error.name === 'NetworkError') {
      spinner.info(chalk.gray('☁️  Offline - test queued for sync'));
    } else {
      spinner.warn(chalk.yellow('☁️  Cloud sync failed (queued for retry)'));
      spinner.info(chalk.gray(`   ${error.message}`));
    }
  }
}
