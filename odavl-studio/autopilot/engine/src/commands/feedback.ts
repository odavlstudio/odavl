/**
 * User Feedback API for Pattern Learning (Phase 3.1.3)
 * Allows users to mark issues as true/false positives
 * 
 * @module commands/feedback
 * @version 3.0.0
 */

import * as readline from 'node:readline';
import * as path from 'node:path';
import * as fsp from 'node:fs/promises';
// @ts-expect-error - Insight Core built with esbuild (runtime types unavailable)
import { getPatternMemory } from '@odavl-studio/insight-core/learning';
// @ts-expect-error - Insight Core built with esbuild (runtime types unavailable)
import type { PatternSignature } from '@odavl-studio/insight-core/learning';

interface FeedbackOptions {
    file?: string;
    line?: number;
    detector?: string;
    patternType?: string;
    isValid?: boolean;
    reason?: string;
    interactive?: boolean;
}

interface IssueRecord {
    file: string;
    line: number;
    detector: string;
    patternType: string;
    message: string;
    confidence: number;
    timestamp: string;
}

/**
 * Run feedback command (new Phase 3 version with PatternMemory)
 */
export async function runFeedback(options: FeedbackOptions = {}): Promise<void> {
    const workspaceRoot = process.cwd();
    const memory = getPatternMemory({
        databasePath: path.resolve(workspaceRoot, '.odavl/learning/patterns.json'),
    });

    console.log('📝 ODAVL Pattern Learning - User Feedback\n');

    // Interactive mode: show recent issues and let user mark them
    if (options.interactive || !options.file) {
        await runInteractiveFeedback(memory, workspaceRoot);
        return;
    }

    // Direct mode: mark specific issue
    if (!options.file || !options.line || !options.detector || !options.patternType) {
        console.error('❌ Missing required parameters: --file, --line, --detector, --pattern-type');
        console.log('💡 Use --interactive flag for interactive mode');
        process.exit(1);
    }

    const signature: PatternSignature = {
        detector: options.detector,
        patternType: options.patternType,
        signatureHash: '',
        filePath: path.resolve(workspaceRoot, options.file),
        line: options.line,
    };

    const isValid = options.isValid ?? await askIsValid();
    const reason = options.reason ?? await askReason(isValid);
    const confidence = 75; // Default confidence

    memory.learnFromCorrection(signature, isValid, confidence, reason);

    console.log(`✅ Feedback recorded for ${options.detector}/${options.patternType} in ${options.file}:${options.line}`);
    console.log(`   Marked as: ${isValid ? '✓ True Positive' : '✗ False Positive'}`);
    if (reason) {
        console.log(`   Reason: ${reason}`);
    }

    memory.flush();
}

/**
 * Interactive feedback mode
 */
async function runInteractiveFeedback(memory: any, workspaceRoot: string): Promise<void> {
    console.log('🔍 Looking for recent detections...\n');

    const lastRunPath = path.resolve(workspaceRoot, '.odavl/insight/logs/latest.json');
    let issues: IssueRecord[] = [];

    try {
        const content = await fsp.readFile(lastRunPath, 'utf-8');
        const runData = JSON.parse(content);

        if (runData.issues && Array.isArray(runData.issues)) {
            issues = runData.issues.map((issue: any) => ({
                file: issue.filePath || issue.file || 'unknown',
                line: issue.line || 0,
                detector: issue.detector || issue.source || 'unknown',
                patternType: issue.patternType || issue.code || 'unknown',
                message: issue.message || '',
                confidence: issue.confidence || 75,
                timestamp: issue.timestamp || new Date().toISOString(),
            }));
        }
    } catch (err: unknown) {
        console.log('ℹ️  No recent detection log found');
        console.log(`💡 Run \`pnpm odavl:insight\` first to detect issues\n`);
        console.log(`   Error: ${err instanceof Error ? err.message : 'Unknown error'}`);

        await showLearnedPatterns(memory);
        return;
    }

    if (issues.length === 0) {
        console.log('🎉 No issues found in last run!');
        console.log('💡 Run `pnpm odavl:insight` to detect issues first\n');
        return;
    }

    console.log(`Found ${issues.length} issue(s) from last run\n`);
    console.log('═'.repeat(60));

    const byDetector = groupBy(issues, 'detector');

    for (const [detector, detectorIssues] of Object.entries(byDetector)) {
        console.log(`\n📦 ${detector.toUpperCase()} (${detectorIssues.length} issues)`);
        console.log('─'.repeat(60));

        for (let i = 0; i < detectorIssues.length; i++) {
            const issue = detectorIssues[i];
            console.log(`\n${i + 1}. ${path.relative(workspaceRoot, issue.file)}:${issue.line}`);
            console.log(`   ${issue.message}`);
            console.log(`   Confidence: ${issue.confidence}% | Pattern: ${issue.patternType}`);

            const shouldProvide = await askYesNo(`   Provide feedback for this issue? (y/n)`);

            if (shouldProvide) {
                const isValid = await askIsValid();
                const reason = await askReason(isValid);

                const signature: PatternSignature = {
                    detector: issue.detector,
                    patternType: issue.patternType,
                    signatureHash: '',
                    filePath: path.resolve(workspaceRoot, issue.file),
                    line: issue.line,
                };

                memory.learnFromCorrection(signature, isValid, issue.confidence, reason);

                console.log(`   ✅ Feedback recorded: ${isValid ? '✓ True Positive' : '✗ False Positive'}\n`);
            }
        }
    }

    memory.flush();

    console.log('\n═'.repeat(60));
    console.log('📊 Updated Pattern Statistics:\n');

    const stats = memory.getGlobalStats();
    console.log(`   Total Patterns: ${stats.totalPatterns}`);
    console.log(`   Active Patterns: ${stats.activePatterns}`);
    console.log(`   Total Corrections: ${stats.totalCorrections}`);
    console.log(`   Overall Success Rate: ${(stats.overallSuccessRate * 100).toFixed(1)}%`);
    console.log(`   Overall False Positive Rate: ${(stats.overallFalsePositiveRate * 100).toFixed(1)}%`);
    console.log('');
}

/**
 * Show learned patterns from database
 */
async function showLearnedPatterns(memory: any): Promise<void> {
    const patterns = memory.queryPatterns({
        activeOnly: true,
        sortBy: 'detectionCount',
        sortOrder: 'desc',
        limit: 20,
    });

    if (patterns.length === 0) {
        console.log('📚 Pattern database is empty');
        console.log('💡 Patterns will be learned as you use ODAVL Insight\n');
        return;
    }

    console.log(`📚 Top ${patterns.length} Learned Patterns:\n`);
    console.log('═'.repeat(60));

    for (const pattern of patterns) {
        const perf = pattern.performance;
        let successEmoji = '🔴';
        if (perf.successRate >= 0.9) {
            successEmoji = '🟢';
        } else if (perf.successRate >= 0.7) {
            successEmoji = '🟡';
        }

        console.log(`\n${successEmoji} ${pattern.signature.detector}/${pattern.signature.patternType}`);
        console.log(`   File: ${path.relative(process.cwd(), pattern.signature.filePath)}:${pattern.signature.line}`);
        console.log(`   Detections: ${perf.detectionCount} | Success Rate: ${(perf.successRate * 100).toFixed(1)}%`);
        console.log(`   Avg Confidence: ${perf.avgConfidence.toFixed(1)}% | Corrections: ${pattern.corrections.length}`);

        if (pattern.skipInFuture) {
            console.log(`   ⚠️  Skipped in future (high false positive rate)`);
        }
    }

    console.log('\n═'.repeat(60));
    console.log('\n💡 Use feedback mode after running insight to provide corrections\n');
}

async function askIsValid(): Promise<boolean> {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
    });

    return new Promise((resolve) => {
        rl.question('   Is this a TRUE issue? (y/n): ', (answer) => {
            rl.close();
            resolve(answer.trim().toLowerCase() === 'y');
        });
    });
}

async function askReason(isValid: boolean): Promise<string> {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
    });

    return new Promise((resolve) => {
        const prompt = isValid
            ? '   Why is this a true issue? (optional, press Enter to skip): '
            : '   Why is this a false positive? (optional, press Enter to skip): ';

        rl.question(prompt, (answer) => {
            rl.close();
            resolve(answer.trim());
        });
    });
}

async function askYesNo(question: string): Promise<boolean> {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
    });

    return new Promise((resolve) => {
        rl.question(question + ' ', (answer) => {
            rl.close();
            resolve(answer.trim().toLowerCase() === 'y' || answer.trim().toLowerCase() === 'yes');
        });
    });
}

function groupBy<T>(array: T[], key: keyof T): Record<string, T[]> {
    return array.reduce((result, item) => {
        const group = String(item[key]);
        if (!result[group]) {
            result[group] = [];
        }
        result[group].push(item);
        return result;
    }, {} as Record<string, T[]>);
}

// Legacy cloud feedback (keep for backward compatibility)
export async function feedbackCommand(opts: { hint: string; signature: string; outcome: "success" | "fail" }) {
    const baseUrl = process.env.INSIGHT_CLOUD_URL || "http://localhost:3000";

    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);

        const res = await fetch(`${baseUrl}/api/feedback`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ hintId: opts.hint, signature: opts.signature, outcome: opts.outcome }),
            signal: controller.signal
        });
        clearTimeout(timeoutId);
        const data = await res.json();

        if (!data.ok) {
            console.error(`Error: ${data.error}`);
            process.exit(1);
        }

        console.log(`\n✓ Feedback recorded for hint ${opts.hint}`);
        console.log(`  Outcome: ${opts.outcome}`);
        console.log(`  New confidence: ${(data.confidence * 100).toFixed(0)}%\n`);
    } catch (err) {
        console.error(`Network error: ${err}`);
        process.exit(1);
    }
}
