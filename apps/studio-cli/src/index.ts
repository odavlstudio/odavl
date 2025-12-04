#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import * as insightCommands from './commands/insight.js';
import * as autopilotCommands from './commands/autopilot.js';
import * as authCommands from './commands/auth.js';
// Guardian disabled temporarily - CJS export issues
// import * as guardianCommands from './commands/guardian.js';

const program = new Command();

program
    .name('odavl')
    .description('ODAVL Studio - Complete code quality platform')
    .version('2.0.0');

// Authentication commands
program.addCommand(authCommands.loginCommand);
program.addCommand(authCommands.logoutCommand);
program.addCommand(authCommands.whoamiCommand);
program.addCommand(authCommands.profilesCommand);
program.addCommand(authCommands.switchCommand);
        await authCommands.sync();
    });

// ODAVL Insight commands
const insight = program
    .command('insight')
    .description('Error detection and analysis');

insight
    .command('analyze')
    .description('Analyze workspace for errors')
    .option('-d, --detectors <detectors>', 'Comma-separated list of detectors (default: all)')
    .option('-l, --language <language>', 'Language to analyze: typescript, python, all (default: typescript)', 'typescript')
    .action(async (options: any) => {
        await insightCommands.analyzeWorkspace({
            detectors: options.detectors,
            language: options.language
        });
    });

insight
    .command('fix')
    .description('Get AI-powered fix suggestions')
    .action(async () => {
        await insightCommands.getFixSuggestions();
    });

// ODAVL Autopilot commands
const autopilot = program
    .command('autopilot')
    .description('Self-healing code infrastructure');

autopilot
    .command('run')
    .description('Run full O-D-A-V-L cycle')
    .option('--max-files <number>', 'Maximum files per cycle', '10')
    .option('--max-loc <number>', 'Maximum LOC per file', '40')
    .action(async (options: any) => {
        await autopilotCommands.runFullCycle(options.maxFiles, options.maxLoc);
    });

autopilot
    .command('observe')
    .description('Run Observe phase (metrics collection)')
    .action(async () => {
        await autopilotCommands.runPhase('observe');
    });

autopilot
    .command('decide')
    .description('Run Decide phase (recipe selection)')
    .action(async () => {
        await autopilotCommands.runPhase('decide');
    });

autopilot
    .command('act')
    .description('Run Act phase (apply improvements)')
    .action(async () => {
        await autopilotCommands.runPhase('act');
    });

autopilot
    .command('verify')
    .description('Run Verify phase (quality gates)')
    .action(async () => {
        await autopilotCommands.runPhase('verify');
    });

autopilot
    .command('learn')
    .description('Run Learn phase (update trust scores)')
    .action(async () => {
        await autopilotCommands.runPhase('learn');
    });

autopilot
    .command('undo')
    .description('Undo last change')
    .option('--snapshot <id>', 'Specific snapshot ID to restore')
    .action(async (options: any) => {
        await autopilotCommands.undoLastChange(options.snapshot);
    });

// ODAVL Guardian commands - TEMPORARILY DISABLED
// Reason: @odavl-studio/guardian-core has no CJS exports, blocking CLI execution
// Will be re-enabled after adding CJS support to guardian-core package.json

/*
const guardian = program
    .command('guardian')
    .description('Launch validation and pre-deploy testing')
    .addHelpText('after', `
Examples:
  $ odavl guardian check ./my-extension
  $ odavl guardian fix ./my-app --type nextjs-app
  $ odavl guardian check-all

Product Types:
  - auto              Auto-detect (recommended)
  - vscode-extension  VS Code extensions
  - nextjs-app        Next.js applications
  - nodejs-server     Node.js servers (Phase 2)
  - cli-app           CLI applications (Phase 2)
  - npm-package       npm packages (Phase 2)
`);

guardian
    .command('check <product-path>')
    .description('Check product readiness for launch')
    .option('-t, --type <type>', 'Product type (auto|vscode-extension|nextjs-app)', 'auto')
    .addHelpText('after', `
Examples:
  $ odavl guardian check ./odavl-studio/insight/extension
  $ odavl guardian check ./apps/studio-hub --type nextjs-app
  $ odavl guardian check . --type auto

Output:
  - Readiness score (0-100%)
  - Status (ready/unstable/blocked)
  - Issues grouped by severity
  - Auto-fixable issues count
`)
    .action(async (productPath: string, options: any) => {
        await guardianCommands.checkProduct(productPath, options.type);
    });

guardian
    .command('fix <product-path>')
    .description('Auto-fix product issues')
    .option('-t, --type <type>', 'Product type (auto|vscode-extension|nextjs-app)', 'auto')
    .addHelpText('after', `
Examples:
  $ odavl guardian fix ./my-extension
  $ odavl guardian fix ./my-app --type nextjs-app

Process:
  1. Scan for issues
  2. Apply auto-fixes
  3. Re-validate
  4. Show improvement

Safety:
  - Backup created before changes
  - Only auto-fixable issues modified
  - Manual issues reported
`)
    .action(async (productPath: string, options: any) => {
        await guardianCommands.fixProduct(productPath, options.type);
    });

guardian
    .command('check-all')
    .description('Check all products in workspace')
    .addHelpText('after', `
Examples:
  $ odavl guardian check-all

Output:
  - Lists all products found
  - Readiness score for each
  - Summary statistics
  - Total auto-fixable issues

Workspace Scanning:
  - Searches for package.json files
  - Auto-detects product types
  - Skips node_modules/
`)
    .action(async () => {
        await guardianCommands.checkAllProducts();
    });

// Legacy v2 commands (backward compatibility)
guardian
    .command('test')
    .description('[Legacy v2] Run pre-deploy tests on URL')
    .argument('<url>', 'URL to test')
    .option('--tests <tests>', 'Comma-separated list of tests', 'all')
    .action(async (url: string, options: any) => {
        await guardianCommands.runPreDeployTests(url, options.tests);
    });

guardian
    .command('accessibility')
    .description('[Legacy v2] Run accessibility tests')
    .argument('<url>', 'URL to test')
    .action(async (url: string) => {
        await guardianCommands.runSingleTest(url, 'accessibility');
    });

guardian
    .command('performance')
    .description('[Legacy v2] Run performance tests')
    .argument('<url>', 'URL to test')
    .action(async (url: string) => {
        await guardianCommands.runSingleTest(url, 'performance');
    });

guardian
    .command('security')
    .description('[Legacy v2] Run security tests')
    .argument('<url>', 'URL to test')
    .action(async (url: string) => {
        await guardianCommands.runSingleTest(url, 'security');
    });
*/

// Info command
program
    .command('info')
    .description('Show ODAVL Studio information')
    .action(() => {
        console.log(chalk.bold('\n🚀 ODAVL Studio v2.0.0\n'));
        console.log(chalk.blue('ODAVL Insight:') + '   ML-powered error detection');
        console.log(chalk.magenta('ODAVL Autopilot:') + ' Self-healing code infrastructure');
        console.log(chalk.green('ODAVL Guardian:') + '  Pre-deploy testing & monitoring');
        console.log('\nRun ' + chalk.cyan('odavl <command> --help') + ' for more information\n');
    });

program.parse();
