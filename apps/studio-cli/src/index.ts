#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import boxen from 'boxen';
import { createBrainCommand } from './commands/brain.js';
import { createDeployCommand } from './commands/deploy.js';
import { runSelfHeal, explainLastSession } from './commands/autopilot';

const program = new Command();

program
    .name('odavl')
    .description('ODAVL Studio - Complete code quality platform')
    .version('2.0.0');

program
    .command('info')
    .description('Show ODAVL Studio information')
    .action(() => {
        const message = boxen(
            chalk.bold.cyan('ODAVL Studio CLI v2.0.0') + '\n\n' +
            chalk.white('Runtime Truth Status (Local-Only Tools)\n') +
            chalk.gray('──────────────────────────────────────\n\n') +
            chalk.green('Insight:\n') +
            chalk.white('  • 11 stable detectors working\n') +
            chalk.white('  • Local-only (not published to npm yet)\n\n') +
            chalk.green('Autopilot:\n') +
            chalk.white('  • O-D-A-L phases functional\n') +
            chalk.white('  • Adaptive heuristic trust scoring (no real ML model yet)\n') +
            chalk.white('  • VERIFY depends on manually re-running Insight\n\n') +
            chalk.yellow('Guardian:\n') +
            chalk.white('  • Core website testing engine + Playwright implemented\n') +
            chalk.white('  • CLI not fully wired/built yet (not production-ready)\n\n') +
            chalk.red('Brain / OMS:\n') +
            chalk.white('  • Not implemented yet (placeholders/stubs only)\n\n') +
            chalk.cyan('GitHub: ') + chalk.underline('github.com/Monawlo812/odavl'),
            { padding: 1, margin: 1, borderStyle: 'round', borderColor: 'cyan' }
        );
        console.log(message);
    });

// Add Brain command (Phase Ω-P1: ML-powered deployment confidence)
program.addCommand(createBrainCommand());

// Add Deploy command (Phase Ω-P1: Smart deployment with Brain)
program.addCommand(createDeployCommand());

// Wave 6: Autopilot deterministic fixing commands
import { runAutopilot } from './commands/autopilot-wave6.js';

const autopilotCmd = new Command('autopilot')
    .description('Self-healing code automation with deterministic fixes');

autopilotCmd
    .command('run')
    .description('Apply deterministic fixes to workspace (Insight → Autopilot)')
    .option('--dry-run', 'Preview fixes without applying', false)
    .option('--max-fixes <n>', 'Maximum fixes to apply', '20')
    .option('--detectors <list>', 'Comma-separated detector list', '')
    .action(async (options) => {
        await runAutopilot({
            dryRun: options.dryRun,
            maxFixes: parseInt(options.maxFixes, 10),
            detectors: options.detectors ? options.detectors.split(',') : undefined,
        });
    });

autopilotCmd
    .command('dry-run')
    .description('Preview self-healing without making changes')
    .option('--max-recipes <n>', 'Maximum recipes to preview', '5')
    .option('--threshold <n>', 'Brain confidence threshold (%)', '75')
    .action(async (options) => {
        await runSelfHeal({
            dryRun: true,
            maxRecipes: parseInt(options.maxRecipes, 10),
            threshold: parseInt(options.threshold, 10),
        });
    });

autopilotCmd
    .command('explain')
    .description('Explain last self-heal session with full OMS report')
    .action(async () => {
        await explainLastSession();
    });

autopilotCmd
    .command('last-report')
    .description('Show OMS report from last self-heal session')
    .action(async () => {
        await explainLastSession();
    });

program.addCommand(autopilotCmd);

// Phase Ω-P6 Phase 4: Guardian telemetry command
const guardianCmd = new Command('guardian')
    .description('Pre-deployment validation and quality gates');

guardianCmd
    .command('telemetry')
    .description('View Guardian gate execution statistics')
    .option('--limit <n>', 'Number of recent events to analyze', '50')
    .action(async (options) => {
        console.log(chalk.cyan('📊 Guardian Telemetry\n'));

        try {
            // Dynamic import to avoid TypeScript path resolution issues
            const telemetryPath = '../../../odavl-studio/guardian/telemetry/guardian-telemetry.js';
            const { readGuardianTelemetry } = await import(telemetryPath);

            const limit = parseInt(options.limit, 10);
            const events = await readGuardianTelemetry(process.cwd(), limit);

            if (events.length === 0) {
                console.log(chalk.yellow('No telemetry data found.'));
                console.log(chalk.gray('Run Guardian gates to start collecting data.\n'));
                return;
            }

            // Aggregate statistics
            let totalGatesPassed = 0;
            let totalGatesFailed = 0;
            const failedGateCount: Record<string, number> = {};
            let totalFileRisk = 0;
            let totalCriticalFiles = 0;
            let eventsWithRisk = 0;

            for (const event of events) {
                totalGatesPassed += event.gatesPassed;
                totalGatesFailed += event.gatesFailed;

                for (const gateName of event.failedGateNames) {
                    failedGateCount[gateName] = (failedGateCount[gateName] || 0) + 1;
                }

                if (event.fileRiskSummary) {
                    totalFileRisk += event.fileRiskSummary.avgRisk;
                    totalCriticalFiles += event.fileRiskSummary.criticalCount;
                    eventsWithRisk++;
                }
            }

            const totalGates = totalGatesPassed + totalGatesFailed;
            const failureRate = totalGates > 0 ? (totalGatesFailed / totalGates) * 100 : 0;
            const mostFailedGate = Object.entries(failedGateCount).sort((a, b) => b[1] - a[1])[0];

            console.log(chalk.white(`📊 Guardian Telemetry (last ${events.length} runs)\n`));
            console.log(chalk.green(`  Gates Passed:    ${totalGatesPassed}`));
            console.log(chalk.red(`  Gates Failed:    ${totalGatesFailed}`));
            console.log(chalk.yellow(`  Failure Rate:    ${failureRate.toFixed(1)}%`));

            if (mostFailedGate) {
                console.log(chalk.red(`  Most Failed:     ${mostFailedGate[0]} (${mostFailedGate[1]}x)`));
            }

            if (eventsWithRisk > 0) {
                const avgRisk = (totalFileRisk / eventsWithRisk) * 100;
                const avgCritical = totalCriticalFiles / eventsWithRisk;
                console.log(chalk.yellow(`  Avg File Risk:   ${avgRisk.toFixed(1)}%`));
                console.log(chalk.red(`  Critical Files:  ${avgCritical.toFixed(1)} avg`));
            }

            console.log();
        } catch (error) {
            console.log(chalk.red(`❌ Failed to read telemetry: ${error}`));
        }
    });

program.addCommand(guardianCmd);

// Wave 3: Insight command suite (Phase 8: Enhanced with cloud integration)
const insightCmd = new Command('insight')
    .description('ML-powered error detection with Insight Core')
    .addHelpText('after', `
Examples:
  $ odavl insight analyze                      # Local analysis (default)
  $ odavl insight analyze --cloud              # Cloud analysis with history
  $ odavl insight analyze --file-parallel      # Fast parallel analysis (4-16x speedup)
  $ odavl insight analyze --detectors typescript,security
  $ odavl insight status                       # Show last analysis status
  $ odavl insight plan                         # Show current plan and limits
  $ odavl insight plans                        # Compare all available plans
  $ odavl auth login                           # Sign in for cloud access
`);

insightCmd
    .command('analyze')
    .description('Analyze workspace with Insight detectors')
    .option('--cloud', 'Run analysis in ODAVL Cloud with history & dashboard', false)
    .option('--detectors <list>', 'Comma-separated detector names')
    .option('--severity <min>', 'Minimum severity (info|low|medium|high|critical)', 'low')
    .option('--json', 'Output as JSON', false)
    .option('--html', 'Generate HTML report', false)
    .option('--md', 'Generate Markdown report', false)
    .option('--output <path>', 'Output file path')
    .option('--files <glob>', 'File patterns to analyze')
    .option('--dir <folder>', 'Directory to analyze', process.cwd())
    .option('--strict', 'Exit with error if issues found', false)
    .option('--debug', 'Show debug information', false)
    .option('--silent', 'Minimal output', false)
    .option('--progress', 'Show progress updates (Wave 10 Enhanced)', false)
    .option('--mode <type>', 'Execution mode: sequential|parallel|file-parallel (Wave 11)', 'sequential')
    .option('--max-workers <n>', 'Number of parallel workers (Wave 10/11)', parseInt)
    .option('--use-worker-pool', 'Use worker threads (Wave 10 Enhanced)', false)
    .option('--file-parallel', 'Enable file-level parallelism (Wave 11 - 4-16x speedup)', false)
    .action(async (options) => {
        // Phase 8: Use enhanced CLI with cloud support
        const { analyze } = await import('./commands/insight-phase8.js');
        await analyze(options);
    });

insightCmd
    .command('full-scan')
    .description('Comprehensive analysis with all detectors')
    .option('--json', 'Output as JSON', false)
    .option('--html', 'Generate HTML report', false)
    .option('--md', 'Generate Markdown report', false)
    .action(async (options) => {
        const { analyze } = await import('./commands/insight-v2.js');
        await analyze({ ...options, detectors: 'all', severity: 'info' });
    });

insightCmd
    .command('quick')
    .description('Fast analysis with essential detectors only')
    .option('--dir <folder>', 'Directory to analyze', process.cwd())
    .option('--json', 'Output as JSON', false)
    .action(async (options) => {
        const { analyze } = await import('./commands/insight-v2.js');
        await analyze({ ...options, detectors: 'typescript,eslint,security', severity: 'medium', silent: true });
    });

insightCmd
    .command('detectors')
    .description('List available detectors')
    .action(async () => {
        const { listDetectors } = await import('./commands/insight-v2.js');
        await listDetectors();
    });

insightCmd
    .command('stats')
    .description('Show analysis statistics')
    .action(async () => {
        const { showStats } = await import('./commands/insight-v2.js');
        await showStats();
    });

insightCmd
    .command('report')
    .description('Generate report from latest analysis')
    .option('--format <type>', 'Report format (json|html|md)', 'json')
    .action(async (options) => {
        const { generateReport } = await import('./commands/insight-v2.js');
        await generateReport(options.format);
    });

insightCmd
    .command('plan')
    .description('Show current Insight plan and limits')
    .option('--json', 'Output as JSON', false)
    .action(async (options) => {
        const { showPlan } = await import('./commands/insight-plan.js');
        await showPlan(options);
    });

insightCmd
    .command('plans')
    .description('Show all available Insight plans')
    .action(async () => {
        const { showAllPlans } = await import('./commands/insight-plan.js');
        await showAllPlans();
    });

insightCmd
    .command('status')
    .description('Show last analysis status (local + cloud)')
    .option('--json', 'Output as JSON', false)
    .option('--last <n>', 'Show last N analyses', parseInt)
    .action(async (options) => {
        const { status } = await import('./commands/insight-phase8.js');
        await status(options);
    });

program.addCommand(insightCmd);

// Auth command group (unified ODAVL ID)
const authCmd = new Command('auth')
    .description('ODAVL authentication and account management');

authCmd
    .command('login')
    .description('Sign in to your ODAVL account (device code flow)')
    .option('--api-url <url>', 'Override API base URL')
    .action(async (options) => {
        const { loginCommand } = await import('./commands/auth.js');
        await loginCommand.parseAsync(['login', ...Object.entries(options).flatMap(([k, v]) => v ? [`--${k}`, v as string] : [])], { from: 'user' });
    });

authCmd
    .command('status')
    .description('Show current authentication status')
    .action(async () => {
        const { statusCommand } = await import('./commands/auth.js');
        await statusCommand.parseAsync(['status'], { from: 'user' });
    });

authCmd
    .command('logout')
    .description('Sign out of your ODAVL account')
    .action(async () => {
        const { logoutCommand } = await import('./commands/auth.js');
        await logoutCommand.parseAsync(['logout'], { from: 'user' });
    });

authCmd
    .command('whoami')
    .description('Show current authentication status (alias)')
    .action(async () => {
        const { whoamiCommand } = await import('./commands/auth.js');
        await whoamiCommand.parseAsync(['whoami'], { from: 'user' });
    });

program.addCommand(authCmd);

program.parse();
