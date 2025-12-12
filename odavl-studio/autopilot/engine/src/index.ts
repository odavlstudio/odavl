#!/usr/bin/env node

// Phase P1: Manifest configuration (read-only wiring)
export * from './config/manifest-config.js';

import { decide } from "./phases/decide";
import { act } from "./phases/act";
import { verify } from "./phases/verify";
import { observe } from "./phases/observe";
import { learn, initializeTrustScores } from "./phases/learn";
import { saveMetrics, formatMetrics } from "./utils/metrics";
import * as fs from "node:fs/promises";
import * as path from "node:path";
import { AnalysisProtocol } from '@odavl/oplayer/protocols';
import { InsightCoreAnalysisAdapter } from '@odavl/oplayer';

type CommandHandler = () => void | Promise<void>;

// ============================================================================
// Bootstrap: Register OPLayer Adapters
// ============================================================================

/**
 * Initialize AnalysisProtocol with InsightCore adapter
 * MUST be called before any OBSERVE/DECIDE/ACT operations
 */
function bootstrap() {
    try {
        // Register Insight adapter if not already registered
        if (!AnalysisProtocol.isAdapterRegistered()) {
            const adapter = new InsightCoreAnalysisAdapter();
            AnalysisProtocol.registerAdapter(adapter);
            console.log('[Bootstrap] ✅ AnalysisProtocol adapter registered');
        } else {
            console.log('[Bootstrap] ℹ️ AnalysisProtocol adapter already registered');
        }
    } catch (error) {
        console.error('[Bootstrap] ❌ Failed to register AnalysisProtocol adapter:', error);
        console.error('Make sure @odavl/oplayer is installed: pnpm install @odavl/oplayer');
        process.exit(1);
    }
}

const commands: Record<string, CommandHandler> = {
    observe: async () => {
        try {
            console.log('🚀 Starting ODAVL OBSERVE...\n');
            const metrics = await observe(process.cwd());

            // Save metrics to file
            saveMetrics(metrics);

            // Display formatted output
            console.log('\n' + formatMetrics(metrics));

            // Also output JSON for piping/integration
            if (process.argv.includes('--json')) {
                console.log('\n' + JSON.stringify(metrics, null, 2));
            }
        } catch (error) {
            console.error('❌ OBSERVE command failed:', error);
            process.exit(1);
        }
    },
    decide: async () => {
        try {
            const metrics = await observe();
            const decision = await decide(metrics);
            console.log(decision);
        } catch (error) {
            console.error('❌ DECIDE command failed:', error);
            process.exit(1);
        }
    },
    act: async () => {
        try {
            // Run OBSERVE → DECIDE → ACT flow
            const metrics = await observe();
            const decision = await decide(metrics);
            console.log(`\n📋 Decision: ${decision}`);

            const result = await act(decision);
            console.log(`\n✅ ACT completed: ${result.actionsExecuted} actions executed`);

            if (result.errors && result.errors.length > 0) {
                console.error(`⚠️ Errors encountered:`);
                for (const error of result.errors) {
                    console.error(`  - ${error}`);
                }
            }
        } catch (error) {
            console.error('❌ ACT command failed:', error);
            process.exit(1);
        }
    },
    verify: async () => {
        try {
            const metrics = await observe();
            const result = await verify(metrics);
            console.log(JSON.stringify(result, null, 2));
        } catch (error) {
            console.error('❌ VERIFY command failed:', error);
            process.exit(1);
        }
    },
    loop: async () => {
        try {
            console.log('🔄 Starting ODAVL Full Loop (O→D→A→V→L)...\n');

            // Phase 1: OBSERVE
            console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
            console.log('📊 Phase 1: OBSERVE');
            console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
            const beforeMetrics = await observe();
            console.log(`✅ Detected ${beforeMetrics.totalIssues} total issues`);

            // Phase 2: DECIDE
            console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
            console.log('🧠 Phase 2: DECIDE');
            console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
            const decision = await decide(beforeMetrics);
            console.log(`✅ Selected Recipe: ${decision}`);

            if (decision === 'noop') {
                console.log('\n✨ No action needed - code quality is optimal!');
                return;
            }

            // Phase 3: ACT
            console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
            console.log('⚡ Phase 3: ACT');
            console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
            const actResult = await act(decision);
            console.log(`✅ Executed ${actResult.actionsExecuted} actions`);

            if (actResult.errors && actResult.errors.length > 0) {
                console.warn(`⚠️  ${actResult.errors.length} errors encountered`);
            }

            // Phase 4: VERIFY
            console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
            console.log('🔍 Phase 4: VERIFY');
            console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
            const verifyResult = await verify(beforeMetrics, decision);

            console.log(`\n📈 Results:`);
            console.log(`  ESLint:     ${beforeMetrics.eslint} → ${verifyResult.after.eslint} (${verifyResult.deltas.eslint >= 0 ? '+' : ''}${verifyResult.deltas.eslint})`);
            console.log(`  TypeScript: ${beforeMetrics.typescript} → ${verifyResult.after.typescript} (${verifyResult.deltas.types >= 0 ? '+' : ''}${verifyResult.deltas.types})`);
            console.log(`  Total:      ${beforeMetrics.totalIssues} → ${verifyResult.after.totalIssues} (${verifyResult.after.totalIssues - beforeMetrics.totalIssues >= 0 ? '+' : ''}${verifyResult.after.totalIssues - beforeMetrics.totalIssues})`);

            const gatesPassed = verifyResult.gatesPassed;
            if (gatesPassed) {
                console.log('\n✅ Quality Gates: PASSED');
                if (verifyResult.attestation) {
                    console.log(`🔒 Attestation: ${verifyResult.attestation.hash.slice(0, 16)}...`);
                }
            } else {
                console.log('\n❌ Quality Gates: FAILED');
                console.log('⚠️  Consider rolling back with: pnpm odavl:undo');
            }

            // Phase 5: LEARN
            console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
            console.log('🧠 Phase 5: LEARN');
            console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
            const improvement = {
                eslint: verifyResult.deltas.eslint,
                typescript: verifyResult.deltas.types,
                total: verifyResult.after.totalIssues - beforeMetrics.totalIssues,
            };
            const learnResult = await learn(
                decision,
                gatesPassed,
                improvement,
                verifyResult.attestation?.hash
            );
            console.log(`✅ ${learnResult.message}`);

            if (learnResult.blacklisted) {
                console.log(`⛔ Recipe ${decision} has been blacklisted (3+ consecutive failures)`);
            }

            console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
            console.log('🎉 ODAVL Loop Complete!');
            console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

        } catch (error) {
            console.error('❌ LOOP command failed:', error);
            process.exit(1);
        }
    },
    run: () => {
        console.log("[ODAVL] runCycle not implemented in this entry point.");
    },
    undo: async () => {
        try {
            console.log('⏪ ODAVL UNDO - Rollback System\n');

            // List available snapshots
            const ROOT = process.cwd();
            const undoDir = path.join(ROOT, ".odavl", "undo");
            
            try {
                await fs.access(undoDir);
            } catch {
                console.log('❌ No undo snapshots found. Run autopilot first to create snapshots.');
                return;
            }

            const files = await fs.readdir(undoDir);
            const snapshots = files
                .filter(f => f.endsWith('.json') && f !== 'latest.json')
                .sort()
                .reverse(); // Most recent first

            if (snapshots.length === 0) {
                console.log('❌ No undo snapshots available.');
                return;
            }

            // Check for --list flag
            if (process.argv.includes('--list')) {
                console.log('📋 Available Undo Snapshots:\n');
                for (let i = 0; i < Math.min(snapshots.length, 10); i++) {
                    const timestamp = snapshots[i].replace('.json', '');
                    console.log(`  ${i + 1}. ${timestamp}`);
                }
                console.log(`\nUse: odavl autopilot undo <timestamp>`);
                return;
            }

            // Check for specific timestamp
            const timestampArg = process.argv[process.argv.length - 1];
            let targetSnapshot = '';
            
            if (timestampArg && timestampArg.endsWith('.json')) {
                targetSnapshot = timestampArg;
            } else if (timestampArg && timestampArg !== 'undo') {
                targetSnapshot = timestampArg + '.json';
            } else {
                // Default: Use latest snapshot
                targetSnapshot = snapshots[0];
            }

            const snapshotPath = path.join(undoDir, targetSnapshot);
            
            try {
                await fs.access(snapshotPath);
            } catch {
                console.log(`❌ Snapshot not found: ${targetSnapshot}`);
                console.log(`\nAvailable snapshots:`);
                for (let i = 0; i < Math.min(snapshots.length, 5); i++) {
                    console.log(`  - ${snapshots[i].replace('.json', '')}`);
                }
                return;
            }

            // Load snapshot
            const snapshotContent = await fs.readFile(snapshotPath, 'utf-8');
            const snapshot = JSON.parse(snapshotContent);

            console.log(`📦 Snapshot: ${targetSnapshot.replace('.json', '')}`);
            console.log(`📅 Created: ${snapshot.timestamp}`);
            console.log(`📁 Files to restore: ${snapshot.modifiedFiles.length}\n`);

            // Restore files
            let restored = 0;
            let skipped = 0;
            const errors: string[] = [];

            for (const filePath of snapshot.modifiedFiles) {
                const originalContent = snapshot.data[filePath];
                
                if (originalContent === null) {
                    // File didn't exist before, delete it
                    try {
                        await fs.unlink(filePath);
                        console.log(`🗑️  Deleted: ${filePath}`);
                        restored++;
                    } catch (error) {
                        console.log(`⚠️  Could not delete: ${filePath}`);
                        skipped++;
                    }
                } else {
                    // Restore original content
                    try {
                        await fs.writeFile(filePath, originalContent, 'utf-8');
                        console.log(`✅ Restored: ${filePath}`);
                        restored++;
                    } catch (error) {
                        console.log(`❌ Failed to restore: ${filePath}`);
                        errors.push(`${filePath}: ${error}`);
                        skipped++;
                    }
                }
            }

            console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
            console.log(`✅ Rollback Complete`);
            console.log(`   Restored: ${restored} files`);
            if (skipped > 0) console.log(`   Skipped: ${skipped} files`);
            if (errors.length > 0) {
                console.log(`   Errors: ${errors.length}`);
                errors.forEach(err => console.log(`     - ${err}`));
            }
            console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);

        } catch (error) {
            console.error('❌ UNDO command failed:', error);
            process.exit(1);
        }
    },
    dashboard: () => {
        console.log("[ODAVL] launchDashboard not implemented in this entry point.");
    },
    insight: () => {
        import("./insight").then(m => m.main()).catch(e => {
            console.error("[ODAVL Insight] فشل تشغيل insight:", e);
            process.exit(1);
        });
    },
    "init-ci": async () => {
        try {
            const { initCI, parseArgs } = await import("./commands/init-ci");
            const args = process.argv.slice(3);
            const options = parseArgs(args);
            await initCI(options);
        } catch (error) {
            console.error('❌ init-ci command failed:', error instanceof Error ? error.message : String(error));
            process.exit(1);
        }
    },
    retrain: async () => {
        try {
            const { retrainInsightModel } = await import("@odavl-studio/insight-core");
            const model = await retrainInsightModel();
            const updated = new Date().toISOString().slice(0, 10);
            console.log("\n🧠 ODAVL Insight Model Retraining");
            console.log(`Updated: ${updated}`);
            console.log("\u2500".repeat(29));
            for (const m of model) {
                console.log(`${m.category} → Common Fix: ${m.commonFix}`);
            }
            console.log("\u2500".repeat(29));
            console.log("✅ Model retraining complete.\n");
        } catch (e) {
            console.error("[ODAVL Insight] فشل إعادة تدريب النموذج:", e);
            process.exit(1);
        }
    },
    "init-trust": () => {
        try {
            console.log('🔧 Initializing trust scores...\n');
            initializeTrustScores();
            console.log('\n✅ Trust scores initialized for all recipes');
        } catch (error) {
            console.error('❌ init-trust command failed:', error);
            process.exit(1);
        }
    },
};

function showHelp() {
    console.log("\nODAVL CLI — Autonomous Code Quality Orchestrator\n");
    console.log("Usage: pnpm odavl:run | pnpm odavl:<command> [options]\n");
    console.log("Commands:");
    console.log("  observe     Collect and print current code quality metrics (ESLint, TypeScript)");
    console.log("  decide      Analyze metrics and determine next improvement action");
    console.log("  act         Execute the selected improvement action (autofix, recipe, etc.)");
    console.log("  verify      Run quality gates and verify improvements");
    console.log("  run         Execute full ODAVL O→D→A→V→L cycle (recommended)");
    console.log("  undo        Roll back the last automated change (uses .odavl/undo)");
    console.log("  dashboard   Launch the learning/analytics dashboard");
    console.log("  insight     Show latest ODAVL Insight diagnostics");
    console.log("  init-ci     Initialize CI/CD integration (GitHub Actions or GitLab CI)\n");
    console.log("Options:");
    console.log("  --json      Output results in JSON format (for VS Code integration)");
    console.log("  --help      Show this help message\n");
    console.log("Config & Environment:");
    console.log("  .odavl/gates.yml     Quality gates (type errors, warnings, etc.)");
    console.log("  .odavl/policy.yml    Risk policy (max files/lines per change, protected paths)");
    console.log("  .odavl/history.json  Run history and trust scores\n");
    console.log("Examples:");
    console.log("  pnpm odavl:run");
    console.log("  pnpm odavl:observe");
    console.log("  pnpm odavl:verify");
    console.log("  pnpm odavl:dashboard");
    console.log("  pnpm odavl:insight");
    console.log("  pnpm odavl:init-ci --platform=github");
    console.log("  pnpm odavl:init-ci --platform=gitlab\n");
    console.log("For more details, see README.md or https://odavl.com/docs\n");
}

function main() {
    // Bootstrap: Register protocol adapters BEFORE executing commands
    bootstrap();
    
    const cmd = process.argv[2] ?? "help";

    try {
        const handler = commands[cmd];
        if (handler) {
            const result = handler();
            if (result instanceof Promise) {
                result.catch(e => {
                    console.error(`[ODAVL ERROR] Command failed: ${e}`);
                    process.exit(1);
                });
            }
        } else {
            showHelp();
        }
    } catch (error) {
        console.error(`[ODAVL ERROR] Command failed: ${error}`);
        process.exit(1);
    }
}

export { main };

// Re-export phase functions for backwards compatibility with tests
export { observe } from "./phases/observe";
export { observeQuick } from "./phases/observe-quick";
export { decide } from "./phases/decide";
export { act } from "./phases/act";
export { verify } from "./phases/verify";
export { learn } from "./phases/learn";

if (process.argv[1]?.endsWith('index.ts') || process.argv[1]?.endsWith('index.js')) {
    main();
}
