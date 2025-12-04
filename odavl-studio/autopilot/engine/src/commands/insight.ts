/**
 * ODAVL Insight CLI Command
 * Interactive command to detect all errors in the project
 */

import * as path from 'node:path';
import * as fsp from 'node:fs/promises';
import * as readline from 'node:readline';
// @ts-expect-error - Insight Core built with esbuild (runtime types unavailable)
import {
    TSDetector,
    ESLintDetector,
    ImportDetector,
    PackageDetector,
    RuntimeDetector,
    BuildDetector,
    SecurityDetector,
    CircularDependencyDetector,
    ComponentIsolationDetector,
    PerformanceDetector,
    NetworkDetector,
    ComplexityDetector
} from '@odavl-studio/insight-core/detector';

interface InsightOptions {
    targetDir?: string;
    watch?: boolean;
    detectors?: string[];
    minConfidence?: number; // Filter issues by minimum confidence (0-100)
}

/**
 * Run Insight - Detect all errors
 */
export async function runInsight(options: InsightOptions = {}): Promise<void> {
    const workspaceRoot = process.cwd();

    console.log('🔍 Welcome to ODAVL Insight - Unified Detection System\n');

    // If user didn't specify targetDir, ask them
    let targetDir = options.targetDir;
    if (!targetDir) {
        targetDir = await askForDirectory();
    }

    // Special case: problemspanel doesn't need directory validation
    if (targetDir === 'problemspanel') {
        await runDetectors('problemspanel', []);
        return;
    }

    const fullPath = path.resolve(workspaceRoot, targetDir);

    try {
        await fsp.access(fullPath);
    } catch {
        console.error(`❌ Directory not found: ${fullPath}`);
        process.exit(1);
    }

    console.log(`📁 Target directory: ${targetDir}\n`);

    // Show confidence filter if specified
    if (options.minConfidence !== undefined) {
        console.log(`🎯 Filtering issues with confidence ≥ ${options.minConfidence}%\n`);
    }

    // Determine which detectors to run
    const detectorNames = options.detectors || [
        'typescript',
        'eslint',
        'import',
        'package',
        'runtime',
        'build',
        'security',
        'circular',
        'isolation',
        'performance',
        'network',
        'complexity'
    ];

    if (options.watch) {
        console.log('👀 Continuous watch mode enabled...\n');
        await watchMode(fullPath, detectorNames, options.minConfidence);
    } else {
        await runDetectors(fullPath, detectorNames, options.minConfidence);
    }
}

/**
 * Ask user for target directory
 */
async function askForDirectory(): Promise<string> {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    return new Promise((resolve) => {
        // Show common options
        console.log('📂 Available directories:');
        console.log('  1. apps/cli');
        console.log('  2. apps/vscode-ext');
        console.log('  3. apps/insight-cloud');
        console.log('  4. apps/odavl-website-v2');
        console.log('  5. packages/insight-core');
        console.log('  6. . (root - entire project)');
        console.log('  7. problemspanel (read from VS Code Problems Panel export)\n');

        rl.question('🔎 Which directory would you like to focus on? (number or path): ', (answer) => {
            rl.close();

            const shortcuts: Record<string, string> = {
                '1': 'apps/cli',
                '2': 'apps/vscode-ext',
                '3': 'apps/insight-cloud',
                '4': 'apps/odavl-website-v2',
                '5': 'packages/insight-core',
                '6': '.',
                '7': 'problemspanel'
            };

            const chosen = shortcuts[answer.trim()] || answer.trim() || '.';
            resolve(chosen);
        });
    });
}

/**
 * Read diagnostics from Problems Panel export file
 */
async function readFromProblemsPanel(): Promise<void> {
    const workspaceRoot = process.cwd();
    const exportPath = path.resolve(workspaceRoot, '.odavl', 'problems-panel-export.json');

    // Check if export file exists
    try {
        await fsp.access(exportPath);
    } catch {
        console.log('❌ No Problems Panel export found!');
        console.log('');
        console.log('📝 To use this feature:');
        console.log('   1. Open your project in VS Code');
        console.log('   2. Save any TypeScript/JavaScript file (Ctrl+S)');
        console.log('   3. ODAVL extension will auto-export diagnostics');
        console.log(`   4. File will be created at: ${exportPath}`);
        console.log('');
        process.exit(1);
    }

    console.log('📖 Reading from VS Code Problems Panel export...\n');

    try {
        // Read and parse the JSON file
        const fileContent = await fsp.readFile(exportPath, 'utf-8');
        const exportData = JSON.parse(fileContent);

        console.log(`📅 Export timestamp: ${new Date(exportData.timestamp).toLocaleString()}`);
        console.log(`📂 Workspace: ${exportData.workspaceRoot}`);
        console.log(`📊 Total files with issues: ${exportData.totalFiles}`);
        console.log(`⚠️  Total issues: ${exportData.totalIssues}\n`);

        if (exportData.totalIssues === 0) {
            console.log('🎉 Excellent! No issues found in Problems Panel\n');
            return;
        }

        // Group by detector source
        const bySource: Record<string, Array<{
            file: string;
            line: number;
            message: string;
            severity: string;
            code?: string;
        }>> = {};

        for (const [filePath, issues] of Object.entries(exportData.diagnostics)) {
            for (const issue of issues as any[]) {
                const source = issue.source || 'unknown';
                if (!bySource[source]) {
                    bySource[source] = [];
                }
                bySource[source].push({
                    file: filePath,
                    line: issue.line,
                    message: issue.message,
                    severity: issue.severity,
                    code: issue.code
                });
            }
        }

        // Display results grouped by detector
        console.log('═'.repeat(60));
        console.log('🔍 Issues by Detector:\n');

        const detectorEmojis: Record<string, string> = {
            'security': '🔒',
            'network': '🌐',
            'runtime': '💥',
            'performance': '⚡',
            'complexity': '🧠',
            'isolation': '🧩'
        };

        for (const [source, issues] of Object.entries(bySource)) {
            const emoji = detectorEmojis[source] || '📋';
            console.log(`${emoji} ${source.toUpperCase()} (${issues.length} issue${issues.length > 1 ? 's' : ''})`);
            console.log('─'.repeat(60));

            // Show first 10 issues
            const displayIssues = issues.slice(0, 10);
            for (const issue of displayIssues) {
                const severityEmoji =
                    issue.severity === 'critical' ? '🚨' :
                        issue.severity === 'high' ? '⚠️' :
                            issue.severity === 'medium' ? '⚡' : '💡';

                console.log(`   ${severityEmoji} ${issue.file}:${issue.line}`);
                console.log(`      ${issue.message}`);
                if (issue.code) {
                    console.log(`      Code: ${issue.code}`);
                }
                console.log('');
            }

            if (issues.length > 10) {
                console.log(`   ... and ${issues.length - 10} more issue(s)\n`);
            }
        }

        // Summary table
        console.log('═'.repeat(60));
        console.log('📊 Summary by Detector:\n');

        for (const [source, issues] of Object.entries(bySource)) {
            const bySeverity = {
                critical: issues.filter(i => i.severity === 'critical').length,
                high: issues.filter(i => i.severity === 'high').length,
                medium: issues.filter(i => i.severity === 'medium').length,
                low: issues.filter(i => i.severity === 'low').length
            };

            console.log(`   ${source}: ${issues.length} total`);
            if (bySeverity.critical > 0) console.log(`      🚨 Critical: ${bySeverity.critical}`);
            if (bySeverity.high > 0) console.log(`      ⚠️  High: ${bySeverity.high}`);
            if (bySeverity.medium > 0) console.log(`      ⚡ Medium: ${bySeverity.medium}`);
            if (bySeverity.low > 0) console.log(`      💡 Low: ${bySeverity.low}`);
            console.log('');
        }

        console.log('═'.repeat(60));
        console.log('\n💡 Tip: Fix issues in VS Code, save files, then run this command again!\n');

    } catch (err) {
        console.error('❌ Error reading Problems Panel export:', err);
        process.exit(1);
    }
}

// Detector configuration interface
interface DetectorConfig {
    name: string;
    emoji: string;
    label: string;
    index: number;
    total: number;
    DetectorClass: any;
    showStats?: boolean;
    formatResult?: (detector: any, errors: any[]) => void;
}

/**
 * Execute a single detector
 */
async function executeDetector(config: DetectorConfig, targetDir: string, workspaceRoot: string, minConfidence?: number): Promise<{ count: number; errors: any[] }> {
    console.log(`${config.emoji} [${config.index}/${config.total}] ${config.label}...`);

    const detector = new config.DetectorClass(config.name === 'circular' || config.name === 'isolation' || config.name === 'performance' || config.name === 'network' ? workspaceRoot : targetDir);
    let errors = await detector.detect(targetDir);

    // Apply confidence filtering if specified
    if (minConfidence !== undefined && errors.length > 0) {
        const originalCount = errors.length;
        errors = errors.filter((err: any) => {
            // If error has confidence property, check it
            if (err.confidence !== undefined) {
                return err.confidence >= minConfidence;
            }
            // If no confidence, keep the error (legacy detectors)
            return true;
        });
        const filtered = originalCount - errors.length;
        if (filtered > 0) {
            console.log(`   ℹ️  Filtered out ${filtered} low-confidence issue(s) (confidence < ${minConfidence}%)`);
        }
    }

    if (errors.length > 0) {
        console.log(`   ❌ Found ${errors.length} ${config.name} ${errors.length === 1 ? 'error' : 'errors'}\n`);

        // Custom formatting if provided
        if (config.formatResult) {
            config.formatResult(detector, errors);
        } else {
            // Default: show all errors
            for (const err of errors) {
                console.log(detector.formatError(err));
            }
        }

        // Show statistics if requested
        if (config.showStats && detector.getStatistics) {
            const stats = detector.getStatistics(errors);
            console.log(`\n📊 ${config.label} Statistics:`);
            console.log(JSON.stringify(stats, null, 2));
            console.log('');
        }
    } else {
        console.log(`   ✅ No ${config.name} errors\n`);
    }

    return { count: errors.length, errors };
}

/**
 * Run all detectors once
 */
async function runDetectors(targetDir: string, detectorNames: string[], minConfidence?: number): Promise<void> {
    // Special case: read from Problems Panel export
    if (targetDir === 'problemspanel') {
        await readFromProblemsPanel();
        return;
    }

    console.log('⚡ Starting detection...\n');

    const workspaceRoot = process.cwd();
    const results: Record<string, number> = {};
    const allErrors: any[] = [];

    // Define all detectors with their configurations
    const detectorConfigs: DetectorConfig[] = [
        { name: 'typescript', emoji: '🔷', label: 'Checking TypeScript', index: 1, total: 12, DetectorClass: TSDetector },
        { name: 'eslint', emoji: '📏', label: 'Checking ESLint', index: 2, total: 12, DetectorClass: ESLintDetector },
        { name: 'import', emoji: '🔗', label: 'Checking Imports/Exports', index: 3, total: 12, DetectorClass: ImportDetector },
        { name: 'package', emoji: '📦', label: 'Checking Package.json', index: 4, total: 12, DetectorClass: PackageDetector },
        { name: 'runtime', emoji: '💥', label: 'Checking Runtime Errors', index: 5, total: 12, DetectorClass: RuntimeDetector },
        { name: 'build', emoji: '🏗️', label: 'Checking Build Process', index: 6, total: 12, DetectorClass: BuildDetector },
        {
            name: 'security',
            emoji: '🔒',
            label: 'Checking Security Vulnerabilities',
            index: 7,
            total: 12,
            DetectorClass: SecurityDetector,
            formatResult: (detector, errors) => {
                const stats = detector.getStatistics(errors);
                console.log(`      Critical: ${stats.bySeverity.critical || 0}, High: ${stats.bySeverity.high || 0}, Medium: ${stats.bySeverity.medium || 0}, Low: ${stats.bySeverity.low || 0}\n`);
                for (const err of errors) {
                    const severityEmoji = err.severity === 'critical' ? '🚨' : err.severity === 'high' ? '⚠️' : '⚡';
                    console.log(`   ${severityEmoji} ${err.file}:${err.line || '?'}`);
                    console.log(`      ${err.type}: ${err.message}`);
                    if (err.suggestedFix) {
                        console.log(`      💡 Fix: ${err.suggestedFix}`);
                    }
                    console.log('');
                }
            }
        },
        {
            name: 'circular',
            emoji: '🔄',
            label: 'Checking Circular Dependencies',
            index: 8,
            total: 12,
            DetectorClass: CircularDependencyDetector,
            formatResult: (detector, errors) => {
                for (const cycle of errors) {
                    console.log(detector.formatError(cycle));
                }
                const stats = detector.getStatistics(errors);
                console.log('\n📊 Circular Dependency Statistics:');
                console.log(`   Total cycles: ${stats.totalCycles}`);
                console.log(`   By severity: High=${stats.bySeverity.high}, Medium=${stats.bySeverity.medium}, Low=${stats.bySeverity.low}`);
                console.log(`   Affected files: ${stats.affectedFiles.size}\n`);
            }
        },
        {
            name: 'isolation',
            emoji: '🧩',
            label: 'Checking Component Isolation',
            index: 9,
            total: 12,
            DetectorClass: ComponentIsolationDetector,
            formatResult: (detector, errors) => {
                for (const issue of errors) {
                    console.log(detector.formatError(issue));
                }
                const stats = detector.getStatistics(errors);
                console.log('\n📊 Component Isolation Statistics:');
                console.log(`   Total files analyzed: ${stats.totalFiles}`);
                console.log(`   Total isolation issues: ${stats.totalIssues}`);
                console.log(`   By severity: High=${stats.bySeverity.high}, Medium=${stats.bySeverity.medium}, Low=${stats.bySeverity.low}`);
                console.log(`   By type:`);
                console.log(`      Tight coupling: ${stats.byType['tight-coupling'] || 0}`);
                console.log(`      Low cohesion: ${stats.byType['low-cohesion'] || 0}`);
                console.log(`      High fan-in: ${stats.byType['high-fan-in'] || 0}`);
                console.log(`      High fan-out: ${stats.byType['high-fan-out'] || 0}`);
                console.log(`      Boundary violations: ${stats.byType['boundary-violation'] || 0}`);
                console.log(`      God components: ${stats.byType['god-component'] || 0}`);
                console.log(`   Average coupling: ${stats.averageCoupling.toFixed(2)}`);
                console.log(`   Average cohesion: ${stats.averageCohesion.toFixed(2)}`);
                console.log(`   Well-isolated components: ${stats.wellIsolatedComponents}\n`);
            }
        },
        {
            name: 'performance',
            emoji: '⚡',
            label: 'Checking Performance Issues',
            index: 10,
            total: 12,
            DetectorClass: PerformanceDetector,
            formatResult: (detector, errors) => {
                for (const issue of errors) {
                    console.log(detector.formatError(issue));
                }
                const stats = detector.getStatistics(errors);
                console.log('\n📊 Performance Statistics:');
                console.log(`   Total files analyzed: ${stats.totalFiles}`);
                console.log(`   Total performance issues: ${errors.length}`);
                console.log(`   By severity: Critical=${stats.bySeverity.critical}, High=${stats.bySeverity.high}, Medium=${stats.bySeverity.medium}, Low=${stats.bySeverity.low}`);
                console.log(`   By category:`);
                for (const [type, count] of Object.entries(stats.byType)) {
                    console.log(`      ${type}: ${count}`);
                }
                console.log('');
            }
        },
        {
            name: 'network',
            emoji: '🌐',
            label: 'Checking Network & API Issues',
            index: 11,
            total: 12,
            DetectorClass: NetworkDetector,
            formatResult: (detector, errors) => {
                for (const error of errors) {
                    console.log(detector.formatError(error));
                }
                const stats = detector.getStatistics(errors);
                console.log('\n📊 Network Statistics:');
                console.log(`   Total issues: ${stats.totalIssues}`);
                console.log(`   Affected files: ${stats.affectedFiles}`);
                console.log(`   By severity: Critical=${stats.bySeverity.critical}, High=${stats.bySeverity.high}, Medium=${stats.bySeverity.medium}, Low=${stats.bySeverity.low}`);
                console.log(`   API calls detected: ${stats.apiCallsDetected}`);
                console.log(`   Timeout issues: ${stats.timeoutIssues}`);
                console.log(`   Error handling issues: ${stats.errorHandlingIssues}`);
                console.log(`   Concurrency issues: ${stats.concurrencyIssues}`);
                console.log('');
            }
        },
        { name: 'complexity', emoji: '🧠', label: 'Analyzing Code Complexity', index: 12, total: 12, DetectorClass: ComplexityDetector }
    ];

    // Execute only requested detectors
    for (const config of detectorConfigs) {
        if (detectorNames.includes(config.name)) {
            const result = await executeDetector(config, targetDir, workspaceRoot, minConfidence);
            results[config.name] = result.count;
            allErrors.push(...result.errors);
        }
    }

    // Results summary
    console.log('═'.repeat(60));
    console.log('📊 Results Summary:\n');

    const totalErrors = Object.values(results).reduce((sum, count) => sum + count, 0);

    // Separate real errors from performance suggestions
    const performanceSuggestions = results.performance || 0;
    const realErrors = totalErrors - performanceSuggestions;

    for (const [detector, count] of Object.entries(results)) {
        const emoji = count === 0 ? '✅' : '❌';
        const label = detector === 'performance' ? 'performance suggestions' : 'errors';
        console.log(`   ${emoji} ${detector}: ${count} ${label}`);
    }

    console.log('\n' + '═'.repeat(60));

    if (realErrors === 0 && performanceSuggestions === 0) {
        console.log('🎉 Excellent! No issues found in the project');
    } else {
        if (realErrors > 0) {
            console.log(`❌ Actual Errors: ${realErrors}`);
        }
        if (performanceSuggestions > 0) {
            console.log(`💡 Performance Suggestions: ${performanceSuggestions} (optimization hints, not critical)`);
        }
    }

    // Show confidence statistics if errors have confidence scores
    const errorsWithConfidence = allErrors.filter((err: any) => err.confidence !== undefined);
    if (errorsWithConfidence.length > 0) {
        const avgConfidence = Math.round(
            errorsWithConfidence.reduce((sum: number, err: any) => sum + err.confidence, 0) / errorsWithConfidence.length
        );
        const highConf = errorsWithConfidence.filter((err: any) => err.confidence >= 80).length;
        const medConf = errorsWithConfidence.filter((err: any) => err.confidence >= 50 && err.confidence < 80).length;
        const lowConf = errorsWithConfidence.filter((err: any) => err.confidence < 50).length;

        console.log('\n🎯 Confidence Analysis:');
        console.log(`   Average Confidence: ${avgConfidence}%`);
        console.log(`   🟢 High (≥80%): ${highConf} issue(s)`);
        console.log(`   🟡 Medium (50-79%): ${medConf} issue(s)`);
        console.log(`   🔴 Low (<50%): ${lowConf} issue(s)`);
    }
}

/**
 * Continuous watch mode
 */
async function watchMode(targetDir: string, detectorNames: string[], minConfidence?: number): Promise<void> {
    console.log('⏰ Running check every 10 seconds...\n');
    console.log('💡 Press Ctrl+C to stop watching\n');

    // Run first time
    await runDetectors(targetDir, detectorNames, minConfidence);

    // Then run every 10 seconds
    const intervalId = setInterval(async () => {
        console.log('\n\n🔄 Re-checking...\n');
        await runDetectors(targetDir, detectorNames, minConfidence);
    }, 10000); // 10 seconds

    // Cleanup on exit signals
    const cleanup = () => {
        console.log('\n\n👋 Stopping watch mode...');
        clearInterval(intervalId);
        process.exit(0);
    };

    process.on('SIGINT', cleanup);
    process.on('SIGTERM', cleanup);
}

// ─────────────────────────────────────────────────────────────────────────────
// CLI Entry Point
// ─────────────────────────────────────────────────────────────────────────────
const args = process.argv.slice(2);

// Parse --min-confidence argument
let minConfidence: number | undefined;
const minConfIdx = args.indexOf('--min-confidence');
if (minConfIdx >= 0 && args[minConfIdx + 1]) {
    const parsed = Number.parseInt(args[minConfIdx + 1], 10);
    if (!Number.isNaN(parsed) && parsed >= 0 && parsed <= 100) {
        minConfidence = parsed;
    }
}

const options: InsightOptions = {
    watch: args.includes('--watch') || args.includes('-w'),
    targetDir: args.find((arg) => !arg.startsWith('--') && arg !== args[minConfIdx + 1]),
    minConfidence
};

try {
    await runInsight(options);
} catch (err) {
    console.error('❌ Error running Insight:', err);
    process.exit(1);
}
