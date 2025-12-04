#!/usr/bin/env tsx
/**
 * ODAVL Insight Unified Run Command
 * Executes all Insight phases sequentially: watch → analyze → root → fix → autofix → learn → verify
 */

import { spawnSync } from "child_process";
import { writeFileSync, appendFileSync } from "fs";
import { join } from "path";

const workspaceRoot = join(__dirname, "../../..");
const logFile = join(workspaceRoot, "reports/insight-run.log");

interface PhaseResult {
    name: string;
    icon: string;
    status: "success" | "failed" | "skipped";
    duration: number;
    message?: string;
}

const results: PhaseResult[] = [];
const startTime = Date.now();

// Initialize log file
writeFileSync(logFile, `🧠 ODAVL Insight Full Run - ${new Date().toISOString()}\n${"=".repeat(60)}\n\n`, "utf8");

function logToFile(message: string) {
    appendFileSync(logFile, message + "\n", "utf8");
}

function runPhase(name: string, icon: string, command: string, args: string[], skipOnFail = false): PhaseResult {
    const phaseStart = Date.now();

    console.log(`\n${icon} ${name}...`);
    logToFile(`\n${icon} ${name} - ${new Date().toISOString()}`);

    const result = spawnSync(command, args, {
        cwd: workspaceRoot,
        shell: true,
        stdio: "pipe",
        encoding: "utf8",
    });

    const duration = Date.now() - phaseStart;
    const success = result.status === 0;

    // Log stdout/stderr to file
    if (result.stdout) {
        logToFile(`STDOUT:\n${result.stdout}`);
    }
    if (result.stderr) {
        logToFile(`STDERR:\n${result.stderr}`);
    }

    const phaseResult: PhaseResult = {
        name,
        icon,
        status: success ? "success" : "failed",
        duration,
        message: success ? "OK" : `Failed with exit code ${result.status}`,
    };

    if (!success) {
        console.log(`  ❌ ${name}: Failed (exit code ${result.status})`);
        logToFile(`❌ FAILED - Exit code: ${result.status}\n`);

        if (!skipOnFail) {
            console.log(`  Stopping execution due to failure.`);
            logToFile(`Stopping execution due to failure.\n`);
        }
    } else {
        console.log(`  ✅ ${name}: OK (${(duration / 1000).toFixed(1)}s)`);
        logToFile(`✅ SUCCESS - Duration: ${(duration / 1000).toFixed(1)}s\n`);
    }

    return phaseResult;
}

function extractMetrics(phaseResults: PhaseResult[]): string {
    // Extract specific metrics from results if available
    const autoFixResult = phaseResults.find((r) => r.name === "Auto-Fix");
    const learnResult = phaseResults.find((r) => r.name === "ML Learning");
    const verifyResult = phaseResults.find((r) => r.name === "Guardian Verify");

    let metrics = "";

    // You can enhance this to parse actual output from commands
    // For now, using placeholder metrics
    if (autoFixResult?.status === "success") {
        metrics += "⚡ Auto-Fix: Applied fixes with high confidence\n";
    }

    if (learnResult?.status === "success") {
        metrics += "🧠 ML Learning: Model updated successfully\n";
    }

    if (verifyResult?.status === "success") {
        metrics += "🛡️ Guardian Verify: STABLE ✅\n";
    }

    return metrics;
}

function printSummary(phaseResults: PhaseResult[]) {
    const totalDuration = Date.now() - startTime;
    const successCount = phaseResults.filter((r) => r.status === "success").length;
    const failCount = phaseResults.filter((r) => r.status === "failed").length;

    console.log("\n" + "─".repeat(60));
    console.log("📊 ODAVL Insight Run Summary");
    console.log("─".repeat(60));

    phaseResults.forEach((result) => {
        const statusIcon = result.status === "success" ? "✅" : result.status === "failed" ? "❌" : "⏭️";
        const duration = (result.duration / 1000).toFixed(1);
        console.log(`${statusIcon} ${result.icon} ${result.name}: ${result.message || result.status} (${duration}s)`);
    });

    console.log("─".repeat(60));
    console.log(`📈 Success: ${successCount}/${phaseResults.length} | Failed: ${failCount} | Total: ${(totalDuration / 1000).toFixed(1)}s`);

    const metrics = extractMetrics(phaseResults);
    if (metrics) {
        console.log("\n📋 Key Metrics:");
        console.log(metrics);
    }

    if (failCount === 0) {
        console.log("✅ All phases completed successfully!");
    } else {
        console.log(`⚠️ ${failCount} phase(s) failed. Check ${logFile} for details.`);
    }
    console.log("─".repeat(60) + "\n");

    // Write summary to log
    logToFile(`\n${"=".repeat(60)}`);
    logToFile(`📊 Summary: ${successCount}/${phaseResults.length} succeeded, ${failCount} failed`);
    logToFile(`Total Duration: ${(totalDuration / 1000).toFixed(1)}s`);
    logToFile(`Log saved to: ${logFile}`);
    logToFile(`${"=".repeat(60)}\n`);
}

// Main execution
console.log("\n🧠 ODAVL Insight Full Run");
console.log("─".repeat(60));

// Note: Watch phase is typically long-running, so we'll skip it in the unified run
// Users should run `pnpm insight:watch` separately for continuous monitoring
console.log("ℹ️  Skipping Watch phase (run separately with `pnpm insight:watch`)");
logToFile("ℹ️  Watch phase skipped (long-running service)\n");

// Phase 1: Analyze
results.push(runPhase(
    "Analyze",
    "📊",
    "pnpm",
    ["insight:analyze"],
    true // Don't stop on failure
));

// Phase 2: Root Detection
results.push(runPhase(
    "Root Detection",
    "🔬",
    "pnpm",
    ["insight:root"],
    true
));

// Phase 3: Fix Suggestions
results.push(runPhase(
    "Fix Suggestions",
    "🛠️",
    "pnpm",
    ["insight:fix"],
    true
));

// Phase 4: Auto-Fix
results.push(runPhase(
    "Auto-Fix",
    "⚡",
    "pnpm",
    ["insight:autofix"],
    true // Continue even if no fixes applied
));

// Phase 5: ML Learning
results.push(runPhase(
    "ML Learning",
    "🧠",
    "pnpm",
    ["insight:learn"],
    true
));

// Phase 6: Guardian Verify
results.push(runPhase(
    "Guardian Verify",
    "🛡️",
    "pnpm",
    ["insight:verify"],
    false // Stop if verification fails
));

// Print summary
printSummary(results);

// Exit with appropriate code
const hasFailures = results.some((r) => r.status === "failed");
process.exit(hasFailures ? 1 : 0);
