/**
 * ODAVL Insight CLI Commands
 */

import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import chalk from 'chalk';
import ora from 'ora';
import { displayError, displaySuccess, ErrorMessages, Progress, Spinner } from '@odavl/core';
// Cloud features temporarily disabled
// import { ODAVLCloudClient } from '@odavl-studio/cloud-client';
// import { CredentialStore } from '@odavl-studio/cloud-client';

// Import TypeScript/JS detectors
import { 
    TSDetector,
    ESLintDetector,
    PerformanceDetector,
    SecurityDetector,
    ComplexityDetector
} from '../../../../odavl-studio/insight/core/src/detector/index.js';

// Import Python detectors statically (avoid dynamic require issues)
import { 
    PythonTypeDetector,
    PythonSecurityDetector,
    PythonComplexityDetector,
    PythonImportsDetector,
    PythonBestPracticesDetector
} from '../../../../odavl-studio/insight/core/src/detector/python/index.js';

// Import specialized detectors statically
import { DatabaseDetector } from '../../../../odavl-studio/insight/core/src/detector/database-detector.js';
import { NextJSDetector } from '../../../../odavl-studio/insight/core/src/detector/nextjs-detector.js';
import { InfrastructureDetector } from '../../../../odavl-studio/insight/core/src/detector/infrastructure-detector.js';
import { CICDDetector } from '../../../../odavl-studio/insight/core/src/detector/cicd-detector.js';
import { MLModelDetector } from '../../../../odavl-studio/insight/core/src/detector/ml-model-detector.js';
import { AdvancedRuntimeDetector } from '../../../../odavl-studio/insight/core/src/detector/advanced-runtime-detector.js';

// Type for language option
type Language = 'typescript' | 'python' | 'all';

export async function analyzeWorkspace(options?: { detectors?: string; language?: Language }) {
    const { detectors, language = 'typescript' } = options || {};
    const spinner = new Spinner(`Running ${language} analysis...`);
    spinner.start();

    try {
        const workspacePath = process.cwd();
        const detectorList = detectors ? detectors.split(',') : ['all'];

        spinner.update(`Running ${language} analysis with detectors: ${detectorList.join(', ')}`);

        // Check if .odavl directory exists
        const odavlDir = path.join(workspacePath, '.odavl');
        if (!fs.existsSync(odavlDir)) {
            fs.mkdirSync(odavlDir, { recursive: true });
        }

        const results: any = {
            issues: [],
            summary: { total: 0, critical: 0, high: 0, medium: 0, low: 0 },
        };

        // Run language-specific analysis
        if (language === 'python' || language === 'all') {
            await analyzePythonWorkspace(workspacePath, detectorList, results, spinner);
        }

        if (language === 'typescript' || language === 'all') {
            await analyzeTypeScriptWorkspace(workspacePath, detectorList, results, spinner);
        }

        // Summary
        spinner.succeed('Analysis complete!');
        
        // OMEGA-P5 Phase 4 Commit 5: OMS file risk summary
        let omsFileRiskSummary = '';
        try {
            const { loadOMSContext, resolveFileType } = await import('@odavl-studio/oms');
            const { computeFileRiskScore } = await import('@odavl-studio/oms/risk');
            await loadOMSContext();
            const risks = results.issues.map((issue: any) => {
                const fileType = resolveFileType(issue.file);
                return fileType ? computeFileRiskScore({ type: fileType }) : 0;
            });
            if (risks.length > 0) {
                const avgRisk = risks.reduce((s: number, r: number) => s + r, 0) / risks.length;
                const criticalFiles = risks.filter((r: number) => r >= 0.7).length;
                const highFiles = risks.filter((r: number) => r >= 0.5 && r < 0.7).length;
                omsFileRiskSummary = `\n\n📊 File Risk Analysis (OMS):\n  Avg Risk: ${(avgRisk * 100).toFixed(1)}%\n  Critical: ${criticalFiles} files\n  High: ${highFiles} files`;
            }
        } catch { /* OMS unavailable */ }
        
        displaySuccess('Analysis Summary', `
  Critical: ${results.summary.critical}
  High: ${results.summary.high}
  Medium: ${results.summary.medium}
  Low: ${results.summary.low}
  Total: ${results.summary.total}${omsFileRiskSummary}
`);

        // Cloud Sync (Phase 1.4)
        await syncResultsToCloud(results, workspacePath, spinner);

        return results;
    } catch (error: any) {
        spinner.fail('Analysis failed');
        displayError({
            code: 'INSIGHT_001',
            message: 'Detector failed',
            severity: 'high',
            suggestion: error.message,
            learnMore: 'docs/insight/troubleshooting.md'
        });
        process.exit(1);
    }
}

// Helper function to update results summary based on severity
function updateSummary(results: any, issues: any[]) {
    results.summary.critical += issues.filter(i => i.severity === 'error').length;
    results.summary.high += issues.filter(i => i.severity === 'warning').length;
    results.summary.medium += issues.filter(i => i.severity === 'info').length;
    results.summary.low += issues.filter(i => i.severity === 'hint').length;
    results.summary.total += issues.length;
}

// Helper function to run a Python detector
async function runPythonDetector(
    DetectorClass: any,
    workspacePath: string,
    detectorName: string,
    emoji: string,
    results: any,
    spinner: any
) {
    spinner.text = `${emoji} Running ${detectorName}...`;
    const detector = new DetectorClass(workspacePath);
    const issues = await detector.detect();
    results.issues.push(...issues);
    updateSummary(results, issues);
    
    if (issues.length > 0) {
        spinner.warn(chalk.yellow(`${emoji} ${detectorName}: ${issues.length} issues found`));
    } else {
        spinner.succeed(chalk.green(`${emoji} ${detectorName}: No issues`));
    }
}

async function analyzePythonWorkspace(workspacePath: string, detectorList: string[], results: any, spinner: any) {
    try {
        const runAllDetectors = detectorList.includes('all');
        
        const detectors = [
            { class: PythonTypeDetector, name: 'Python Type', emoji: '🐍', trigger: ['type'] },
            { class: PythonSecurityDetector, name: 'Python Security', emoji: '🐍', trigger: ['security'] },
            { class: PythonComplexityDetector, name: 'Python Complexity', emoji: '🐍', trigger: ['complexity'] },
            { class: PythonImportsDetector, name: 'Python Imports', emoji: '🐍', trigger: ['imports'] },
            { class: PythonBestPracticesDetector, name: 'Python Best Practices', emoji: '🐍', trigger: ['best-practices', 'style'] }
        ];

        for (const detector of detectors) {
            const shouldRun = runAllDetectors || detector.trigger.some(t => detectorList.includes(t));
            if (shouldRun) {
                await runPythonDetector(
                    detector.class,
                    workspacePath,
                    detector.name,
                    detector.emoji,
                    results,
                    spinner
                );
            }
        }
    } catch (error: any) {
        spinner.warn(chalk.red(`🐍 Python analysis failed: ${error.message}`));
    }
}

async function analyzeTypeScriptWorkspace(workspacePath: string, detectorList: string[], results: any, spinner: any) {
    const runAllDetectors = detectorList.includes('all');

    // TypeScript Detector
    if (runAllDetectors || detectorList.includes('typescript')) {
        try {
            spinner.text = '📘 Running TypeScript Detector...';
            const detector = new TSDetector(workspacePath);
            const errors = await detector.detect();
            
            results.issues.push(...errors);
            results.summary.high += errors.filter((e: any) => e.severity === 'error').length;
            results.summary.medium += errors.filter((e: any) => e.severity === 'warning').length;
            results.summary.total += errors.length;
            
            if (errors.length > 0) {
                spinner.warn(chalk.yellow(`📘 TypeScript: ${errors.length} errors found`));
            } else {
                spinner.succeed(chalk.green('📘 TypeScript: No errors'));
            }
        } catch (error: any) {
            spinner.warn(chalk.red(`📘 TypeScript check failed: ${error.message}`));
        }
    }

    // ESLint Detector
    if (runAllDetectors || detectorList.includes('eslint') || detectorList.includes('style')) {
        try {
            spinner.text = '🔍 Running ESLint Detector...';
            const detector = new ESLintDetector(workspacePath);
            const errors = await detector.detect();
            
            results.issues.push(...errors);
            results.summary.medium += errors.filter((e: any) => e.severity === 2).length;
            results.summary.low += errors.filter((e: any) => e.severity === 1).length;
            results.summary.total += errors.length;
            
            if (errors.length > 0) {
                spinner.warn(chalk.yellow(`🔍 ESLint: ${errors.length} issues found`));
            } else {
                spinner.succeed(chalk.green('🔍 ESLint: No errors'));
            }
        } catch (error: any) {
            spinner.warn(chalk.red(`🔍 ESLint check failed: ${error.message}`));
        }
    }

    // Performance Detector
    if (runAllDetectors || detectorList.includes('performance')) {
        try {
            spinner.text = '⚡ Running Performance Detector...';
            const detector = new PerformanceDetector(workspacePath);
            const errors = await detector.detect();
            
            results.issues.push(...errors);
            results.summary.high += errors.filter((e: any) => e.severity === 'critical' || e.severity === 'high').length;
            results.summary.medium += errors.filter((e: any) => e.severity === 'medium').length;
            results.summary.low += errors.filter((e: any) => e.severity === 'low').length;
            results.summary.total += errors.length;
            
            if (errors.length > 0) {
                spinner.warn(chalk.yellow(`⚡ Performance: ${errors.length} issues found`));
            } else {
                spinner.succeed(chalk.green('⚡ Performance: No issues'));
            }
        } catch (error: any) {
            spinner.warn(chalk.red(`⚡ Performance check failed: ${error.message}`));
        }
    }

    // Security Detector
    if (runAllDetectors || detectorList.includes('security')) {
        try {
            spinner.text = '🛡️ Running Security Detector...';
            const detector = new SecurityDetector(workspacePath);
            const errors = await detector.detect();
            
            results.issues.push(...errors);
            results.summary.critical += errors.filter((e: any) => e.severity === 'critical').length;
            results.summary.high += errors.filter((e: any) => e.severity === 'high').length;
            results.summary.medium += errors.filter((e: any) => e.severity === 'medium').length;
            results.summary.low += errors.filter((e: any) => e.severity === 'low').length;
            results.summary.total += errors.length;
            
            if (errors.length > 0) {
                spinner.warn(chalk.yellow(`🛡️ Security: ${errors.length} issues found`));
            } else {
                spinner.succeed(chalk.green('🛡️ Security: No issues'));
            }
        } catch (error: any) {
            spinner.warn(chalk.red(`🛡️ Security check failed: ${error.message}`));
            // Log full error for debugging EISDIR issue
            if (error.message.includes('EISDIR') && error.stack) {
                console.error(chalk.gray('\nFull error stack:'));
                console.error(chalk.gray(error.stack));
            }
        }
    }

    // Complexity Detector
    if (runAllDetectors || detectorList.includes('complexity')) {
        try {
            spinner.text = '🧮 Running Complexity Detector...';
            const detector = new ComplexityDetector(workspacePath);
            const errors = await detector.detect();
            
            results.issues.push(...errors);
            results.summary.medium += errors.filter((e: any) => e.severity === 'high' || e.severity === 'medium').length;
            results.summary.low += errors.filter((e: any) => e.severity === 'low').length;
            results.summary.total += errors.length;
            
            if (errors.length > 0) {
                spinner.warn(chalk.yellow(`🧮 Complexity: ${errors.length} issues found`));
            } else {
                spinner.succeed(chalk.green('🧮 Complexity: No issues'));
            }
        } catch (error: any) {
            spinner.warn(chalk.red(`🧮 Complexity check failed: ${error.message}`));
        }
    }
}

export async function getFixSuggestions() {
    const spinner = ora('Generating AI-powered fix suggestions...').start();

    try {
        // This will integrate with @odavl-studio/insight-core ML model
        spinner.info(chalk.blue('Fix suggestions feature coming soon'));
        spinner.succeed('Run analysis first with: odavl insight analyze');
    } catch (error: any) {
        spinner.fail(chalk.red('Failed to generate suggestions'));
        console.error(error.message);
        process.exit(1);
    }
}

/**
 * Sync analysis results to cloud (Phase 1.4)
 * TEMPORARILY DISABLED for Phase 5 zero-error operation
 */
async function syncResultsToCloud(results: any, workspacePath: string, spinner: any) {
    // Cloud features temporarily disabled - no cloud sync during Phase 5
    spinner.info(chalk.gray('☁️  Cloud sync disabled (Phase 5 zero-error mode)'));
    return;
}

/**
 * Analyze database usage and detect issues
 */
export async function analyzeDatabaseUsage(workspacePath: string, options?: {
    schema?: string;
    threshold?: number;
    json?: boolean;
}) {
    const { schema = 'prisma/schema.prisma', threshold = 100, json = false } = options || {};
    const spinner = ora('🗄️  Analyzing database usage...').start();

    try {
        const detector = new DatabaseDetector({
            workspacePath,
            prismaSchemaPath: schema,
            slowQueryThreshold: threshold,
            criticalQueryThreshold: threshold * 5, // 500ms default for critical
        });

        const result = await detector.analyze(workspacePath);

        spinner.succeed('🗄️  Database analysis complete!');

        if (json) {
            // JSON output
            console.log(JSON.stringify(result, null, 2));
        } else {
            // Pretty table output
            console.log('');
            console.log(chalk.bold('📊 Database Analysis Results'));
            console.log(chalk.gray('─'.repeat(50)));
            console.log('');
            
            // Score with color
            const scoreColor = result.metrics.databaseScore >= 90 ? 'green' : 
                              result.metrics.databaseScore >= 70 ? 'yellow' : 'red';
            console.log(chalk.bold('Score: ') + chalk[scoreColor](`${result.metrics.databaseScore}/100`));
            console.log(chalk.bold('Database: ') + result.metrics.databaseType);
            console.log(chalk.bold('Issues Found: ') + result.issues.length);
            console.log('');

            // Issue breakdown by type
            const byType: Record<string, number> = {};
            const bySeverity: Record<string, number> = { critical: 0, high: 0, medium: 0, low: 0 };
            
            result.issues.forEach((issue: any) => {
                byType[issue.type] = (byType[issue.type] || 0) + 1;
                bySeverity[issue.severity] = (bySeverity[issue.severity] || 0) + 1;
            });

            console.log(chalk.bold('By Type:'));
            Object.entries(byType).forEach(([type, count]) => {
                console.log(`  ${type}: ${count}`);
            });
            console.log('');

            console.log(chalk.bold('By Severity:'));
            console.log(chalk.red(`  Critical: ${bySeverity.critical}`));
            console.log(chalk.yellow(`  High: ${bySeverity.high}`));
            console.log(chalk.blue(`  Medium: ${bySeverity.medium}`));
            console.log(chalk.gray(`  Low: ${bySeverity.low}`));
            console.log('');

            // Top issues
            if (result.issues.length > 0) {
                console.log(chalk.bold('Top Issues:'));
                result.issues.slice(0, 5).forEach((issue: any, i: number) => {
                    const severityColor = issue.severity === 'critical' ? 'red' :
                                        issue.severity === 'high' ? 'yellow' : 'blue';
                    console.log(`  ${i + 1}. [${chalk[severityColor](issue.severity)}] ${issue.message}`);
                    console.log(chalk.gray(`     ${issue.file}:${issue.line}`));
                    if (issue.suggestion) {
                        console.log(chalk.gray(`     💡 ${issue.suggestion}`));
                    }
                    console.log('');
                });
            }

            console.log(chalk.gray('─'.repeat(50)));
            console.log(chalk.gray(`Analysis completed in ${result.metrics.analysisTime}ms`));
        }

        return result;
    } catch (error: any) {
        spinner.fail('Database analysis failed');
        displayError({
            code: 'DATABASE_001',
            message: 'Database detector failed',
            severity: 'high',
            suggestion: error.message,
            learnMore: 'docs/insight/database-detector.md'
        });
        process.exit(1);
    }
}

/**
 * Analyze Next.js usage and detect React/Next.js-specific issues
 */
export async function analyzeNextJSUsage(workspacePath: string, options?: {
    appDir?: string;
    pagesDir?: string;
    json?: boolean;
    checkHydration?: boolean;
    checkServerActions?: boolean;
    checkSuspense?: boolean;
    checkBoundaries?: boolean;
}) {
    const {
        appDir = 'app',
        pagesDir = 'pages',
        json = false,
        checkHydration = true,
        checkServerActions = true,
        checkSuspense = true,
        checkBoundaries = true,
    } = options || {};

    const spinner = new Spinner('⚛️  Analyzing Next.js application...');
    spinner.start();

    try {
        const detector = new NextJSDetector({
            workspaceRoot: workspacePath,
            appDir,
            pagesDir,
            excludePatterns: ['**/node_modules/**', '**/.next/**', '**/dist/**'],
            checkHydration,
            checkServerActions,
            checkSuspense,
            checkBoundaries,
        });

        const result = await detector.analyze(workspacePath);

        spinner.succeed('⚛️  Next.js analysis complete!');

        if (json) {
            // JSON output
            console.log(JSON.stringify(result, null, 2));
        } else {
            // Pretty table output
            console.log('');
            console.log(chalk.bold('⚛️  Next.js Analysis Results'));
            console.log(chalk.gray('─'.repeat(60)));
            console.log('');

            // Version and router info
            console.log(chalk.bold('Next.js Version: ') + chalk.cyan(result.metrics.nextVersion || 'unknown'));
            console.log(chalk.bold('Router: ') + (result.metrics.hasAppRouter ? chalk.green('App Router') : chalk.blue('Pages Router')));
            console.log('');

            // Score with color
            const scoreColor = result.metrics.nextjsScore >= 90 ? 'green' :
                              result.metrics.nextjsScore >= 70 ? 'yellow' : 'red';
            console.log(chalk.bold('Quality Score: ') + chalk[scoreColor](`${result.metrics.nextjsScore}/100`));
            console.log(chalk.bold('Issues Found: ') + result.issues.length);
            console.log('');

            // Issue breakdown by category
            const byCategory: Record<string, number> = {};
            const bySeverity: Record<string, number> = { critical: 0, high: 0, medium: 0, low: 0 };

            result.issues.forEach((issue: any) => {
                byCategory[issue.category] = (byCategory[issue.category] || 0) + 1;
                bySeverity[issue.severity] = (bySeverity[issue.severity] || 0) + 1;
            });

            console.log(chalk.bold('By Category:'));
            Object.entries(byCategory).forEach(([category, count]) => {
                const emoji = category === 'hydration' ? '💧' :
                            category === 'server-actions' ? '🔧' :
                            category === 'suspense' ? '⏳' : '🔀';
                console.log(`  ${emoji} ${category}: ${count}`);
            });
            console.log('');

            console.log(chalk.bold('By Severity:'));
            console.log(chalk.red(`  Critical: ${bySeverity.critical}`));
            console.log(chalk.yellow(`  High: ${bySeverity.high}`));
            console.log(chalk.blue(`  Medium: ${bySeverity.medium}`));
            console.log(chalk.gray(`  Low: ${bySeverity.low}`));
            console.log('');

            // Top issues
            if (result.issues.length > 0) {
                console.log(chalk.bold('Top Issues:'));
                result.issues.slice(0, 5).forEach((issue: any, i: number) => {
                    const severityColor = issue.severity === 'critical' ? 'red' :
                                        issue.severity === 'high' ? 'yellow' : 'blue';
                    const emoji = issue.category === 'hydration' ? '💧' :
                                issue.category === 'server-actions' ? '🔧' :
                                issue.category === 'suspense' ? '⏳' : '🔀';
                    console.log(`  ${i + 1}. ${emoji} [${chalk[severityColor](issue.severity)}] ${issue.message}`);
                    console.log(chalk.gray(`     ${issue.file}:${issue.line}`));
                    if (issue.suggestion) {
                        console.log(chalk.gray(`     💡 ${issue.suggestion}`));
                    }
                    console.log('');
                });

                // Show remaining count if more than 5
                if (result.issues.length > 5) {
                    console.log(chalk.gray(`  ... and ${result.issues.length - 5} more issues`));
                    console.log('');
                }
            } else {
                console.log(chalk.green('✨ No issues found! Your Next.js code looks great!'));
                console.log('');
            }

            console.log(chalk.gray('─'.repeat(60)));
            console.log(chalk.gray(`Analysis completed in ${result.metrics.analysisTime}ms`));
            console.log('');
            console.log(chalk.gray('💡 Tip: Use --json flag for machine-readable output'));
            console.log(chalk.gray('📖 Learn more: docs/insight/nextjs-detector.md'));
        }

        return result;
    } catch (error: any) {
        spinner.fail('⚛️  Next.js analysis failed');
        displayError({
            code: 'NEXTJS_001',
            message: 'Next.js detector failed',
            severity: 'high',
            suggestion: error.message,
            learnMore: 'docs/insight/nextjs-detector.md'
        });
        process.exit(1);
    }
}

/**
 * Analyze infrastructure (Docker, Kubernetes, CI/CD, IaC, Deployment)
 */
export async function analyzeInfrastructure(workspacePath: string, options?: {
    categories?: string;
    json?: boolean;
    excludePatterns?: string[];
}) {
    const {
        categories = 'all',
        json = false,
        excludePatterns = ['**/node_modules/**', '**/dist/**', '**/.git/**'],
    } = options || {};

    const spinner = ora('🏗️  Analyzing infrastructure...').start();

    try {
        const categoryList = categories.split(',').map(c => c.trim());
        const detector = new InfrastructureDetector({
            workspaceRoot: workspacePath,
            excludePatterns,
            categories: categoryList.includes('all') ? undefined : categoryList,
        });

        const result = await detector.analyze(workspacePath);

        spinner.succeed('🏗️  Infrastructure analysis complete!');

        if (json) {
            // JSON output
            console.log(JSON.stringify(result, null, 2));
        } else {
            // Pretty table output
            console.log('');
            console.log(chalk.bold('🏗️  Infrastructure Analysis Results'));
            console.log(chalk.gray('─'.repeat(60)));
            console.log('');

            // Detected tools
            const tools = result.metrics.detectedTools || [];
            if (tools.length > 0) {
                console.log(chalk.bold('Detected Tools: ') + chalk.cyan(tools.join(', ')));
            }
            console.log('');

            // Score with color
            const scoreColor = result.metrics.infrastructureScore >= 90 ? 'green' :
                              result.metrics.infrastructureScore >= 70 ? 'yellow' : 'red';
            console.log(chalk.bold('Infrastructure Score: ') + chalk[scoreColor](`${result.metrics.infrastructureScore}/100`));
            console.log(chalk.bold('Total Issues: ') + result.issues.length);
            console.log('');

            // Issue breakdown by type and category
            const byType: Record<string, number> = {};
            const byCategory: Record<string, number> = {};
            const bySeverity: Record<string, number> = { critical: 0, high: 0, medium: 0, low: 0 };

            result.issues.forEach((issue: any) => {
                byType[issue.type] = (byType[issue.type] || 0) + 1;
                byCategory[issue.category] = (byCategory[issue.category] || 0) + 1;
                bySeverity[issue.severity] = (bySeverity[issue.severity] || 0) + 1;
            });

            console.log(chalk.bold('By Type:'));
            Object.entries(byType).forEach(([type, count]) => {
                const emoji = type === 'docker' ? '🐳' :
                            type === 'kubernetes' ? '☸️' :
                            type === 'cicd' ? '🔄' :
                            type === 'iac' ? '🏗️' : '🚀';
                console.log(`  ${emoji} ${type}: ${count}`);
            });
            console.log('');

            console.log(chalk.bold('By Severity:'));
            console.log(chalk.red(`  Critical: ${bySeverity.critical}`));
            console.log(chalk.yellow(`  High: ${bySeverity.high}`));
            console.log(chalk.blue(`  Medium: ${bySeverity.medium}`));
            console.log(chalk.gray(`  Low: ${bySeverity.low}`));
            console.log('');

            // Metrics by category
            console.log(chalk.bold('Category Metrics:'));
            if (result.metrics.dockerIssues !== undefined) {
                console.log(`  🐳 Docker Issues: ${result.metrics.dockerIssues}`);
            }
            if (result.metrics.k8sIssues !== undefined) {
                console.log(`  ☸️  Kubernetes Issues: ${result.metrics.k8sIssues}`);
            }
            if (result.metrics.cicdIssues !== undefined) {
                console.log(`  🔄 CI/CD Issues: ${result.metrics.cicdIssues}`);
            }
            if (result.metrics.iacIssues !== undefined) {
                console.log(`  🏗️  IaC Issues: ${result.metrics.iacIssues}`);
            }
            if (result.metrics.deploymentIssues !== undefined) {
                console.log(`  🚀 Deployment Issues: ${result.metrics.deploymentIssues}`);
            }
            console.log('');

            // Top issues
            if (result.issues.length > 0) {
                console.log(chalk.bold('Top Issues:'));
                result.issues.slice(0, 5).forEach((issue: any, i: number) => {
                    const severityColor = issue.severity === 'critical' ? 'red' :
                                        issue.severity === 'high' ? 'yellow' : 'blue';
                    const emoji = issue.type === 'docker' ? '🐳' :
                                issue.type === 'kubernetes' ? '☸️' :
                                issue.type === 'cicd' ? '🔄' :
                                issue.type === 'iac' ? '🏗️' : '🚀';
                    console.log(`  ${i + 1}. ${emoji} [${chalk[severityColor](issue.severity)}] ${issue.message}`);
                    console.log(chalk.gray(`     ${issue.file}:${issue.line || 1}`));
                    if (issue.suggestion) {
                        console.log(chalk.gray(`     💡 ${issue.suggestion}`));
                    }
                    console.log('');
                });

                // Show remaining count if more than 5
                if (result.issues.length > 5) {
                    console.log(chalk.gray(`  ... and ${result.issues.length - 5} more issues`));
                    console.log('');
                }
            } else {
                console.log(chalk.green('✨ No issues found! Your infrastructure looks great!'));
                console.log('');
            }

            console.log(chalk.gray('─'.repeat(60)));
            console.log(chalk.gray(`Analysis completed in ${result.metrics.analysisTime}ms`));
            console.log('');
            console.log(chalk.gray('💡 Tip: Use --json flag for machine-readable output'));
            console.log(chalk.gray('💡 Filter categories: --categories docker,kubernetes'));
            console.log(chalk.gray('📖 Learn more: docs/insight/infrastructure-detector.md'));
        }

        return result;
    } catch (error: any) {
        spinner.fail('🏗️  Infrastructure analysis failed');
        displayError({
            code: 'INFRASTRUCTURE_001',
            message: 'Infrastructure detector failed',
            severity: 'high',
            suggestion: error.message,
            learnMore: 'docs/insight/infrastructure-detector.md'
        });
        process.exit(1);
    }
}

/**
 * Analyze architecture (dependency graph, layer violations, coupling)
 */
export async function analyzeArchitecture(workspacePath: string, options?: {
    json?: boolean;
    maxCoupling?: number;
    exclude?: string;
    generateDiagram?: boolean;
}): Promise<any> {
    const { 
        json = false, 
        maxCoupling = 10,
        exclude,
        generateDiagram = false
    } = options || {};

    const spinner = ora('🏗️  Analyzing project architecture...').start();

    try {
        // Import ArchitectureDetector directly (avoid loading all detectors)
        const { ArchitectureDetector } = await import('../../../../odavl-studio/insight/core/src/detector/architecture-detector.js');

        const excludePatterns = exclude
            ? exclude.split(',').map(p => p.trim())
            : ['node_modules/**', 'dist/**', '.next/**', 'build/**'];

        const detector = new ArchitectureDetector({
            maxCoupling,
            excludePatterns,
            enablePerfMonitoring: true,
        });

        const result = await detector.analyze(workspacePath);
        spinner.succeed('🏗️  Architecture analysis complete');

        if (json) {
            console.log(JSON.stringify(result, null, 2));
        } else {
            console.log('');
            console.log(chalk.bold.cyan('📊 Architecture Analysis Results'));
            console.log(chalk.gray('='.repeat(60)));
            console.log('');

            // Display metrics
            console.log(chalk.bold('📈 Metrics'));
            console.log(chalk.gray('─'.repeat(60)));
            console.log(`  Total Modules:          ${chalk.yellow(result.metrics.totalModules)}`);
            console.log(`  Total Dependencies:     ${chalk.yellow(result.graph?.edges?.length || 0)}`);
            console.log(`  Circular Dependencies:  ${result.metrics.circularDeps > 0 ? chalk.red(result.metrics.circularDeps) : chalk.green(result.metrics.circularDeps)}`);
            console.log(`  Average Coupling:       ${result.metrics.avgCoupling > maxCoupling ? chalk.red(result.metrics.avgCoupling.toFixed(2)) : chalk.green(result.metrics.avgCoupling.toFixed(2))}`);
            console.log(`  Layer Health:           ${chalk.cyan(result.metrics.layerHealth.toFixed(1))}%`);
            console.log(`  Architecture Score:     ${getSeverityColor(result.metrics.architectureScore >= 90 ? 'low' : result.metrics.architectureScore >= 70 ? 'medium' : 'high', `${result.metrics.architectureScore.toFixed(1)}/100`)}`);
            console.log('');

            // Display issues by severity
            const criticalIssues = result.issues.filter(i => i.severity === 'critical');
            const highIssues = result.issues.filter(i => i.severity === 'high');
            const mediumIssues = result.issues.filter(i => i.severity === 'medium');
            const lowIssues = result.issues.filter(i => i.severity === 'low');

            console.log(chalk.bold('🔍 Issues Found'));
            console.log(chalk.gray('─'.repeat(60)));
            console.log(`  ${chalk.red('●')} Critical: ${chalk.red(criticalIssues.length)}`);
            console.log(`  ${chalk.yellow('●')} High:     ${chalk.yellow(highIssues.length)}`);
            console.log(`  ${chalk.blue('●')} Medium:   ${chalk.blue(mediumIssues.length)}`);
            console.log(`  ${chalk.gray('●')} Low:      ${chalk.gray(lowIssues.length)}`);
            console.log('');

            // Show top 10 issues
            if (result.issues.length > 0) {
                console.log(chalk.bold('🔥 Top Issues (first 10)'));
                console.log(chalk.gray('─'.repeat(60)));

                result.issues.slice(0, 10).forEach((issue: any, index: number) => {
                    const severityIcon = getSeverityIcon(issue.severity);
                    const severityColor = getSeverityColor(issue.severity, issue.severity.toUpperCase());
                    const typeEmoji = getTypeEmoji(issue.type);

                    console.log(`${index + 1}. ${severityIcon} ${severityColor} ${typeEmoji} ${chalk.bold(issue.type)}`);
                    console.log(`   ${chalk.gray(issue.file)}`);
                    console.log(`   ${issue.message}`);
                    if (issue.suggestion) {
                        console.log(`   ${chalk.cyan('→')} ${issue.suggestion}`);
                    }
                    console.log('');
                });

                if (result.issues.length > 10) {
                    console.log(chalk.gray(`  ... and ${result.issues.length - 10} more issues`));
                    console.log('');
                }
            } else {
                console.log(chalk.green('✨ No issues found! Your architecture looks excellent!'));
                console.log('');
            }

            // Generate diagram if requested
            if (generateDiagram) {
                const diagramPath = path.join(workspacePath, '.odavl', 'architecture.mmd');
                spinner.start('📊 Generating architecture diagram...');
                await detector.generateVisualization(diagramPath);
                spinner.succeed(`📊 Diagram saved to: ${diagramPath}`);
                console.log(chalk.gray('💡 View at: https://mermaid.live'));
                console.log('');
            }

            console.log(chalk.gray('─'.repeat(60)));
            if (result.metrics.analysisTime) {
                console.log(chalk.gray(`Analysis completed in ${result.metrics.analysisTime}ms`));
            }
            console.log('');
            console.log(chalk.gray('💡 Tip: Use --json flag for machine-readable output'));
            console.log(chalk.gray('💡 Generate diagram: --generate-diagram'));
            console.log(chalk.gray('📖 Learn more: docs/insight/architecture-detector.md'));
        }

        return result;
    } catch (error: any) {
        spinner.fail('🏗️  Architecture analysis failed');
        displayError({
            code: 'ARCHITECTURE_001',
            message: 'Architecture detector failed',
            severity: 'high',
            suggestion: error.message,
            learnMore: 'docs/insight/architecture-detector.md'
        });
        process.exit(1);
    }
}

// Helper: Get severity icon
function getSeverityIcon(severity: string): string {
    switch (severity) {
        case 'critical': return '🔴';
        case 'high': return '🟡';
        case 'medium': return '🔵';
        case 'low': return '⚪';
        default: return '◯';
    }
}

// Helper: Get severity color
function getSeverityColor(severity: string, text: string): string {
    switch (severity) {
        case 'critical': return chalk.red(text);
        case 'high': return chalk.yellow(text);
        case 'medium': return chalk.blue(text);
        case 'low': return chalk.gray(text);
        default: return text;
    }
}

// Helper: Get type emoji
function getTypeEmoji(type: string): string {
    switch (type) {
        case 'circular-dependency': return '🔄';
        case 'layer-violation': return '🏛️';
        case 'high-coupling': return '🔗';
        case 'god-module': return '👹';
        case 'unstable-module': return '⚠️';
        case 'orphaned-module': return '🏝️';
        case 'hub-module': return '🌟';
        case 'boundary-violation': return '🚧';
        case 'architecture-drift': return '📉';
        default: return '📋';
    }
}

/**
 * Analyze CI/CD configurations (GitHub Actions, Vercel)
 */
export async function analyzeCICDConfiguration(
    workspacePath?: string,
    options: { 
        json?: boolean;
        checkGithubActions?: boolean;
        checkVercel?: boolean;
    } = {}
) {
    const workspace = workspacePath || process.cwd();
    const spinner = ora('🚀 Analyzing CI/CD configuration...').start();

    try {
        const detector = new CICDDetector({
            checkGitHubActions: options.checkGithubActions ?? true,
            checkVercel: options.checkVercel ?? true,
        });

        const result = await detector.analyze(workspace);
        
        if (options.json) {
            spinner.stop();
            console.log(JSON.stringify(result, null, 2));
            return result;
        }

        spinner.succeed('🚀 CI/CD analysis complete!');

        // Display results
        console.log('\n' + chalk.bold('📊 CI/CD Analysis Results'));
        console.log('═'.repeat(80));
        console.log(`Score: ${result.metrics.cicdScore}/100`);
        console.log(`Workflows: ${result.metrics.totalWorkflows}`);
        console.log(`Jobs: ${result.metrics.totalJobs}`);
        console.log(`Steps: ${result.metrics.totalSteps}`);
        console.log(`Issues Found: ${result.issues.length}`);
        console.log('');
        console.log('By Severity:');
        console.log(`  Critical: ${result.issues.filter(i => i.severity === 'critical').length}`);
        console.log(`  High: ${result.issues.filter(i => i.severity === 'high').length}`);
        console.log(`  Medium: ${result.issues.filter(i => i.severity === 'medium').length}`);
        console.log(`  Low: ${result.issues.filter(i => i.severity === 'low').length}`);

        // Display top issues
        if (result.issues.length > 0) {
            console.log('\nTop Issues:');
            const topIssues = result.issues
                .sort((a, b) => {
                    const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
                    const aSeverity = severityOrder[a.severity as keyof typeof severityOrder] ?? 4;
                    const bSeverity = severityOrder[b.severity as keyof typeof severityOrder] ?? 4;
                    return aSeverity - bSeverity;
                })
                .slice(0, 5);

            topIssues.forEach((issue, index) => {
                const icon = getSeverityIcon(issue.severity);
                const message = getSeverityColor(issue.severity, issue.message);
                const file = issue.workflowFile || issue.configFile || issue.file;
                console.log(`  ${index + 1}. [${issue.severity}] ${message}`);
                console.log(`     ${file}${issue.line ? `:${issue.line}` : ''}`);
                if (issue.suggestion) {
                    console.log(`     💡 ${issue.suggestion}`);
                }
            });
        }

        console.log('═'.repeat(80));
        console.log(`Analysis completed in ${result.metrics.averageBuildTime.toFixed(2)}ms`);

        return result;
    } catch (error: any) {
        spinner.fail('🚀 CI/CD analysis failed');
        displayError({
            code: 'CICD_001',
            message: 'CI/CD detector failed',
            severity: 'high',
            suggestion: error.message,
            learnMore: 'docs/insight/cicd-detector.md'
        });
        process.exit(1);
    }
}

/**
 * Analyze ML Models (TensorFlow.js, ONNX)
 */
export async function analyzeMLModels(
    workspacePath: string = process.cwd(),
    options: { json?: boolean; tensorflow?: boolean; onnx?: boolean } = {}
): Promise<any> {
    const spinner = ora('🧠 Analyzing ML models...').start();

    try {
        const detector = new MLModelDetector({
            checkTensorFlow: options.tensorflow !== false,
            checkONNX: options.onnx !== false,
        });

        const result = await detector.analyze(workspacePath);

        spinner.succeed('🧠 ML model analysis complete!');

        if (options.json) {
            console.log(JSON.stringify(result, null, 2));
        } else {
            // Display results in human-readable format
            console.log('═'.repeat(80));
            console.log(chalk.bold.blue('ML Model Analysis Results'));
            console.log('═'.repeat(80));

            // Metrics
            console.log('\n📊 Metrics:');
            console.log(`  Total Models: ${result.metrics.totalModels}`);
            console.log(`  TensorFlow Models: ${result.metrics.tensorflowModels}`);
            console.log(`  ONNX Models: ${result.metrics.onnxModels}`);
            console.log(`  Shape Errors: ${result.metrics.shapeErrors}`);
            console.log(`  Overfitting Detected: ${result.metrics.overfittingDetected}`);
            console.log(`  Confidence Issues: ${result.metrics.confidenceIssues}`);
            console.log(`  ML Score: ${result.metrics.mlScore}/100`);

            // Issues
            console.log(`\n🔍 Issues Found: ${result.issues.length}`);
            if (result.issues.length > 0) {
                const bySeverity = result.issues.reduce((acc, issue) => {
                    acc[issue.severity] = (acc[issue.severity] || 0) + 1;
                    return acc;
                }, {} as Record<string, number>);

                console.log('\nBy Severity:');
                if (bySeverity.critical) console.log(chalk.red(`  Critical: ${bySeverity.critical}`));
                if (bySeverity.high) console.log(chalk.yellow(`  High: ${bySeverity.high}`));
                if (bySeverity.medium) console.log(chalk.blue(`  Medium: ${bySeverity.medium}`));
                if (bySeverity.low) console.log(chalk.gray(`  Low: ${bySeverity.low}`));

                console.log('\nTop Issues:');
                const topIssues = result.issues
                    .sort((a, b) => {
                        const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
                        const aSeverity = severityOrder[a.severity as keyof typeof severityOrder] ?? 4;
                        const bSeverity = severityOrder[b.severity as keyof typeof severityOrder] ?? 4;
                        return aSeverity - bSeverity;
                    })
                    .slice(0, 5);

                topIssues.forEach((issue, index) => {
                    const message = getSeverityColor(issue.severity, issue.message);
                    console.log(`  ${index + 1}. [${issue.severity}] ${message}`);
                    console.log(`     ${issue.modelPath}`);
                    if (issue.suggestion) {
                        console.log(`     💡 ${issue.suggestion}`);
                    }
                });
            }

            console.log('═'.repeat(80));
        }

        return result;
    } catch (error: any) {
        spinner.fail('🧠 ML model analysis failed');
        displayError({
            code: 'ML_001',
            message: 'ML model detector failed',
            severity: 'high',
            suggestion: error.message,
            learnMore: 'docs/insight/ml-model-detector.md'
        });
        process.exit(1);
    }
}

/**
 * Analyze Advanced Runtime Patterns (Stack Overflow, Division by Zero, Memory Leaks, Resource Leaks)
 */
export async function analyzeAdvancedRuntime(
    workspacePath: string = process.cwd(),
    options: { json?: boolean; stackOverflow?: boolean; divisionByZero?: boolean; memoryLeaks?: boolean; resourceLeaks?: boolean } = {}
): Promise<any> {
    const spinner = ora('⚡ Analyzing advanced runtime patterns...').start();

    try {
        const detector = new AdvancedRuntimeDetector({
            checkStackOverflow: options.stackOverflow !== false,
            checkDivisionByZero: options.divisionByZero !== false,
            checkMemoryLeaks: options.memoryLeaks !== false,
            checkResourceLeaks: options.resourceLeaks !== false,
        });

        const result = await detector.analyze(workspacePath);

        spinner.succeed('⚡ Advanced runtime analysis complete!');

        if (options.json) {
            console.log(JSON.stringify(result, null, 2));
        } else {
            // Display results in human-readable format
            console.log('═'.repeat(80));
            console.log(chalk.bold.yellow('Advanced Runtime Analysis Results'));
            console.log('═'.repeat(80));

            // Metrics
            console.log('\n📊 Metrics:');
            console.log(`  Total Files Analyzed: ${result.metrics.totalFiles}`);
            console.log(`  Stack Overflow Risks: ${result.metrics.stackOverflowRisks}`);
            console.log(`  Division by Zero Risks: ${result.metrics.divisionByZeroRisks}`);
            console.log(`  Memory Exhaustion Risks: ${result.metrics.memoryExhaustionRisks}`);
            console.log(`  Resource Leaks: ${result.metrics.resourceLeaks}`);
            console.log(`  Recursive Functions: ${result.metrics.recursiveFunctions}`);
            console.log(`  Runtime Score: ${result.metrics.runtimeScore}/100`);

            // Issues
            console.log(`\n🔍 Issues Found: ${result.issues.length}`);
            if (result.issues.length > 0) {
                const bySeverity = result.issues.reduce((acc, issue) => {
                    acc[issue.severity] = (acc[issue.severity] || 0) + 1;
                    return acc;
                }, {} as Record<string, number>);

                console.log('\nBy Severity:');
                if (bySeverity.critical) console.log(chalk.red(`  Critical: ${bySeverity.critical}`));
                if (bySeverity.high) console.log(chalk.yellow(`  High: ${bySeverity.high}`));
                if (bySeverity.medium) console.log(chalk.blue(`  Medium: ${bySeverity.medium}`));
                if (bySeverity.low) console.log(chalk.gray(`  Low: ${bySeverity.low}`));

                console.log('\nTop Issues:');
                const topIssues = result.issues
                    .sort((a, b) => {
                        const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
                        const aSeverity = severityOrder[a.severity as keyof typeof severityOrder] ?? 4;
                        const bSeverity = severityOrder[b.severity as keyof typeof severityOrder] ?? 4;
                        return aSeverity - bSeverity;
                    })
                    .slice(0, 10);

                topIssues.forEach((issue, index) => {
                    const message = getSeverityColor(issue.severity, issue.message);
                    console.log(`  ${index + 1}. [${issue.severity}] ${message}`);
                    console.log(`     ${issue.file}`);
                    if (issue.suggestion) {
                        console.log(`     💡 ${issue.suggestion}`);
                    }
                });
            }

            console.log('═'.repeat(80));
        }

        return result;
    } catch (error: any) {
        spinner.fail('⚡ Advanced runtime analysis failed');
        displayError({
            code: 'RUNTIME_001',
            message: 'Advanced runtime detector failed',
            severity: 'high',
            suggestion: error.message,
            learnMore: 'docs/insight/advanced-runtime-detector.md'
        });
        process.exit(1);
    }
}

// ==================== Cache Management Commands (Phase 1 Week 20) ====================

/**
 * Clear cache
 */
export async function clearCache(options?: { pattern?: string; verbose?: boolean }) {
    const spinner = new Spinner('Clearing cache...');
    spinner.start();

    try {
        const { createRedisCacheLayer } = await import('@odavl-studio/core/cache/redis-layer.js');
        const cache = await createRedisCacheLayer();

        let cleared = 0;

        if (options?.pattern) {
            // Clear by pattern
            cleared = await cache.invalidateByPattern(options.pattern);
            spinner.succeed(`Cleared ${cleared} cache entries matching pattern: ${options.pattern}`);
        } else {
            // Clear all
            await cache.clear();
            const stats = cache.getStatistics();
            cleared = stats.totalKeys;
            spinner.succeed(`Cleared all cache entries (${cleared} total)`);
        }

        await cache.shutdown();

        displaySuccess('Cache Cleared', `
  Entries Removed: ${cleared}
  Pattern: ${options?.pattern || 'all'}
`);

        return { cleared };
    } catch (error: any) {
        spinner.fail('Cache clear failed');
        displayError({
            code: 'CACHE_001',
            message: 'Failed to clear cache',
            severity: 'high',
            suggestion: error.message,
            learnMore: 'docs/insight/cache-management.md'
        });
        process.exit(1);
    }
}

/**
 * Warm cache with pre-computed results
 */
export async function warmCache(options?: {
    files?: string[];
    detectors?: string[];
    priority?: 'high' | 'normal' | 'low';
    maxConcurrent?: number;
    verbose?: boolean;
}) {
    const spinner = new Spinner('Warming cache...');
    spinner.start();

    try {
        const { createRedisCacheLayer } = await import('@odavl-studio/core/cache/redis-layer.js');
        const { createFileFilter } = await import('@odavl-studio/core/utils/file-filter.js');
        const cache = await createRedisCacheLayer();

        // Get files to warm
        let files = options?.files || [];
        if (files.length === 0) {
            // Find all TypeScript/JavaScript files
            const filter = await createFileFilter();
            const allFiles = await getAllFilesInDirectory(process.cwd());
            files = allFiles.filter(f => 
                f.endsWith('.ts') || 
                f.endsWith('.js') || 
                f.endsWith('.tsx') || 
                f.endsWith('.jsx')
            );
        }

        const detectors = options?.detectors || ['typescript', 'eslint', 'security'];

        spinner.update(`Warming cache for ${files.length} files...`);

        const warmed = await cache.warm({
            files,
            detectors,
            priority: options?.priority || 'normal',
            maxConcurrent: options?.maxConcurrent || 4,
        });

        spinner.succeed(`Warmed ${warmed} cache entries`);

        await cache.shutdown();

        displaySuccess('Cache Warmed', `
  Files Analyzed: ${files.length}
  Detectors: ${detectors.join(', ')}
  Cache Entries: ${warmed}
  Priority: ${options?.priority || 'normal'}
`);

        return { warmed, files: files.length };
    } catch (error: any) {
        spinner.fail('Cache warming failed');
        displayError({
            code: 'CACHE_002',
            message: 'Failed to warm cache',
            severity: 'high',
            suggestion: error.message,
            learnMore: 'docs/insight/cache-management.md'
        });
        process.exit(1);
    }
}

/**
 * Show cache statistics
 */
export async function showCacheStats(options?: { json?: boolean; verbose?: boolean }) {
    const spinner = new Spinner('Fetching cache statistics...');
    spinner.start();

    try {
        const { createRedisCacheLayer, calculateHitRatePercentage, formatCacheSize } = 
            await import('@odavl-studio/core/cache/redis-layer.js');
        const cache = await createRedisCacheLayer();

        const stats = cache.getStatistics();

        spinner.succeed('Cache statistics fetched');

        if (options?.json) {
            console.log(JSON.stringify(stats, null, 2));
        } else {
            console.log('═'.repeat(80));
            console.log(chalk.bold.cyan('Cache Statistics'));
            console.log('═'.repeat(80));

            console.log('\n📊 Overview:');
            console.log(`  Total Keys: ${stats.totalKeys.toLocaleString()}`);
            console.log(`  Total Size: ${formatCacheSize(stats.totalSize)}`);
            console.log(`  Hit Rate: ${calculateHitRatePercentage(stats)}% (${stats.hits}/${stats.hits + stats.misses})`);
            console.log(`  L1 Hit Rate: ${Math.round(stats.l1HitRate * 100)}%`);
            console.log(`  L2 Hit Rate: ${Math.round(stats.l2HitRate * 100)}%`);

            console.log('\n⚡ Performance:');
            console.log(`  Avg Latency: ${stats.avgLatency.toFixed(2)}ms`);
            console.log(`  Compression Ratio: ${stats.compressionRatio.toFixed(2)}x`);

            console.log('\n🗑️  Maintenance:');
            console.log(`  Evictions: ${stats.evictions.toLocaleString()}`);

            const hitRateColor = stats.hitRate > 0.8 ? chalk.green : 
                                stats.hitRate > 0.5 ? chalk.yellow : chalk.red;
            
            console.log('\n✨ Health:');
            console.log(`  Cache Health: ${hitRateColor(
                stats.hitRate > 0.8 ? 'Excellent' :
                stats.hitRate > 0.5 ? 'Good' : 'Poor'
            )}`);

            console.log('═'.repeat(80));
        }

        await cache.shutdown();

        return stats;
    } catch (error: any) {
        spinner.fail('Failed to fetch cache statistics');
        displayError({
            code: 'CACHE_003',
            message: 'Failed to get cache statistics',
            severity: 'medium',
            suggestion: error.message,
            learnMore: 'docs/insight/cache-management.md'
        });
        process.exit(1);
    }
}

/**
 * Invalidate cache by git hash
 */
export async function invalidateCacheByGit(gitHash?: string, options?: { verbose?: boolean }) {
    const spinner = new Spinner('Invalidating cache by git hash...');
    spinner.start();

    try {
        const { createRedisCacheLayer } = await import('@odavl-studio/core/cache/redis-layer.js');
        const cache = await createRedisCacheLayer();

        // Get current git hash if not provided
        const hash = gitHash || execSync('git rev-parse HEAD').toString().trim();

        const invalidated = await cache.invalidateByGitHash(hash);

        spinner.succeed(`Invalidated ${invalidated} cache entries for git hash: ${hash.substring(0, 8)}`);

        await cache.shutdown();

        displaySuccess('Cache Invalidated', `
  Git Hash: ${hash.substring(0, 8)}...
  Entries Removed: ${invalidated}
`);

        return { invalidated, gitHash: hash };
    } catch (error: any) {
        spinner.fail('Cache invalidation failed');
        displayError({
            code: 'CACHE_004',
            message: 'Failed to invalidate cache',
            severity: 'medium',
            suggestion: error.message,
            learnMore: 'docs/insight/cache-management.md'
        });
        process.exit(1);
    }
}

// Helper function to get all files in directory
async function getAllFilesInDirectory(dir: string): Promise<string[]> {
    const files: string[] = [];
    
    async function traverse(currentPath: string) {
        const entries = await fs.promises.readdir(currentPath, { withFileTypes: true });
        
        for (const entry of entries) {
            const fullPath = path.join(currentPath, entry.name);
            
            if (entry.isDirectory()) {
                // Skip common ignore directories
                if (!['node_modules', '.git', 'dist', 'build', 'out', '.next'].includes(entry.name)) {
                    await traverse(fullPath);
                }
            } else if (entry.isFile()) {
                files.push(fullPath);
            }
        }
    }
    
    await traverse(dir);
    return files;
}




