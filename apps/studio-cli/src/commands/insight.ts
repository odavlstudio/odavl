/**
 * ODAVL Insight CLI Commands
 */

import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import chalk from 'chalk';
import ora from 'ora';
import { displayError, displaySuccess, ErrorMessages, Progress, Spinner } from '@odavl-studio/core';
import { ODAVLCloudClient } from '@odavl-studio/cloud-client';
import { CredentialStore } from '@odavl-studio/cloud-client';

// Import TypeScript/JS detectors
import { 
    TSDetector,
    ESLintDetector,
    PerformanceDetector,
    SecurityDetector,
    ComplexityDetector
} from '@odavl-studio/insight-core/detector';

// Import Python detectors statically (avoid dynamic require issues)
import { 
    PythonTypeDetector,
    PythonSecurityDetector,
    PythonComplexityDetector,
    PythonImportsDetector,
    PythonBestPracticesDetector
} from '../../../../odavl-studio/insight/core/src/detector/python/index.js';

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
        
        displaySuccess('Analysis Summary', `
  Critical: ${results.summary.critical}
  High: ${results.summary.high}
  Medium: ${results.summary.medium}
  Low: ${results.summary.low}
  Total: ${results.summary.total}
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
            results.summary.high += errors.filter(e => e.severity === 'error').length;
            results.summary.medium += errors.filter(e => e.severity === 'warning').length;
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
            results.summary.medium += errors.filter(e => e.severity === 2).length;
            results.summary.low += errors.filter(e => e.severity === 1).length;
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
            results.summary.high += errors.filter(e => e.severity === 'critical' || e.severity === 'high').length;
            results.summary.medium += errors.filter(e => e.severity === 'medium').length;
            results.summary.low += errors.filter(e => e.severity === 'low').length;
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
            results.summary.critical += errors.filter(e => e.severity === 'critical').length;
            results.summary.high += errors.filter(e => e.severity === 'high').length;
            results.summary.medium += errors.filter(e => e.severity === 'medium').length;
            results.summary.low += errors.filter(e => e.severity === 'low').length;
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
            results.summary.medium += errors.filter(e => e.severity === 'high' || e.severity === 'medium').length;
            results.summary.low += errors.filter(e => e.severity === 'low').length;
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
 */
async function syncResultsToCloud(results: any, workspacePath: string, spinner: any) {
    try {
        // Check if user is authenticated
        const credStore = new CredentialStore();
        const creds = await credStore.get();
        
        if (!creds || !creds.apiKey) {
            // Not logged in - skip cloud sync (offline mode)
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

        // Upload results to cloud
        spinner.start('☁️  Syncing results to cloud...');
        
        const workspaceName = workspacePath.split(/[/\\]/).pop() || 'Unknown';
        
        await client.uploadInsightRun({
            workspacePath,
            workspaceName,
            timestamp: new Date().toISOString(),
            issues: results.issues || [],
            summary: results.summary || { total: 0, critical: 0, high: 0, medium: 0, low: 0 },
            detectors: ['typescript', 'eslint', 'performance', 'security', 'complexity'],
        });

        spinner.succeed(chalk.green('☁️  Results synced to cloud'));
        spinner.info(chalk.gray('   View dashboard: https://studio.odavl.com/dashboard/insight'));
    } catch (error: any) {
        // Handle specific errors
        if (error.name === 'RateLimitError') {
            spinner.warn(chalk.yellow(`☁️  Rate limit exceeded. Try again in ${error.retryAfter}s`));
        } else if (error.name === 'AuthenticationError') {
            spinner.warn(chalk.yellow('☁️  Authentication failed. Run: odavl login'));
        } else if (error.name === 'NetworkError') {
            spinner.info(chalk.gray('☁️  Offline - results queued for sync'));
        } else {
            spinner.warn(chalk.yellow('☁️  Cloud sync failed (queued for retry)'));
            spinner.info(chalk.gray(`   ${error.message}`));
        }
        
        // Offline queue will retry automatically on next connection
    }
}
