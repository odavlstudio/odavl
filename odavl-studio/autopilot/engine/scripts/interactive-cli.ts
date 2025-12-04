#!/usr/bin/env tsx
/**
 * ODAVL Autopilot Interactive CLI
 * Beautiful, user-friendly interface for self-healing code infrastructure
 */

import * as readline from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';
import chalk from 'chalk';
import { execSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import fs from 'node:fs/promises';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '../../../..');

interface MenuItem {
  key: string;
  emoji: string;
  title: string;
  description: string;
  action: () => Promise<void>;
}

function printHeader() {
  console.log('\n');
  console.log(chalk.cyan('════════════════════════════════════════════════════════════'));
  console.log(chalk.cyan('  🤖 ODAVL AUTOPILOT - Self-Healing Code Infrastructure'));
  console.log(chalk.cyan('════════════════════════════════════════════════════════════'));
  console.log('');
}

function printMenu(items: MenuItem[]) {
  console.log(chalk.yellow('📋 Available Actions:'));
  console.log(chalk.gray('────────────────────────────────────────────────────────────'));
  
  for (const item of items) {
    console.log('');
    console.log(`  ${chalk.bold.white(`[${item.key}]`)} ${item.emoji} ${chalk.bold(item.title)}`);
    console.log(`      ${chalk.gray('→')} ${chalk.dim(item.description)}`);
  }
  
  console.log('');
  console.log(chalk.gray('────────────────────────────────────────────────────────────'));
  console.log(`  ${chalk.bold.white('[0]')} 🚪 ${chalk.bold('Exit')}`);
  console.log('');
}

async function runCommand(cmd: string, description: string): Promise<void> {
  console.log(chalk.cyan(`\n▶ ${description}...`));
  console.log(chalk.gray(`Running: ${cmd}`));
  console.log('');
  
  try {
    const output = execSync(cmd, {
      cwd: ROOT_DIR,
      encoding: 'utf-8',
      stdio: ['inherit', 'pipe', 'pipe'],
    });
    console.log(output);
    console.log(chalk.green('✅ Complete!'));
  } catch (error: any) {
    if (error.stdout) console.log(error.stdout);
    if (error.stderr) console.error(chalk.red(error.stderr));
    console.log(chalk.yellow('⚠️ Command completed with warnings'));
  }
  
  await waitForKeypress();
}

async function waitForKeypress() {
  console.log(chalk.dim('\nPress any key to continue...'));
  await new Promise(resolve => {
    process.stdin.once('data', () => resolve(true));
  });
}

async function checkODAVLSetup(): Promise<boolean> {
  const odavlPath = path.join(ROOT_DIR, '.odavl');
  try {
    await fs.access(odavlPath);
    return true;
  } catch {
    return false;
  }
}

async function initODAVL(): Promise<void> {
  console.log(chalk.cyan('\n🔧 Initializing ODAVL workspace...'));
  
  const odavlPath = path.join(ROOT_DIR, '.odavl');
  const dirs = [
    'history',
    'recipes',
    'undo',
    'ledger',
    'attestation',
    'logs',
  ];
  
  try {
    await fs.mkdir(odavlPath, { recursive: true });
    
    for (const dir of dirs) {
      await fs.mkdir(path.join(odavlPath, dir), { recursive: true });
    }
    
    // Create default gates.yml if not exists
    const gatesPath = path.join(odavlPath, 'gates.yml');
    try {
      await fs.access(gatesPath);
    } catch {
      const defaultGates = `risk_budget: 100
forbidden_paths:
  - security/**
  - public-api/**
  - "**/*.spec.*"
  - "**/*.test.*"
  - auth/**
actions:
  max_auto_changes: 10
  max_files_per_cycle: 10
enforcement:
  - block_if_risk_exceeded
  - rollback_on_failure
  - require_attestation
thresholds:
  max_risk_per_action: 25
  min_success_rate: 0.75
  max_consecutive_failures: 3
`;
      await fs.writeFile(gatesPath, defaultGates, 'utf-8');
    }
    
    // Create empty history.json
    const historyPath = path.join(odavlPath, 'history.json');
    try {
      await fs.access(historyPath);
    } catch {
      await fs.writeFile(historyPath, '[]', 'utf-8');
    }
    
    // Create empty recipes-trust.json
    const trustPath = path.join(odavlPath, 'recipes-trust.json');
    try {
      await fs.access(trustPath);
    } catch {
      await fs.writeFile(trustPath, '{}', 'utf-8');
    }
    
    console.log(chalk.green('✅ ODAVL workspace initialized successfully!'));
    console.log(chalk.dim(`   → ${odavlPath}`));
  } catch (error: any) {
    console.error(chalk.red('❌ Failed to initialize ODAVL workspace:'));
    console.error(chalk.red(error.message));
  }
  
  await waitForKeypress();
}

async function showStatus(): Promise<void> {
  console.log(chalk.cyan('\n📊 ODAVL Autopilot Status\n'));
  
  const odavlPath = path.join(ROOT_DIR, '.odavl');
  const isSetup = await checkODAVLSetup();
  
  if (!isSetup) {
    console.log(chalk.yellow('⚠️ ODAVL not initialized'));
    console.log(chalk.dim('   Run "Initialize ODAVL" first'));
    await waitForKeypress();
    return;
  }
  
  try {
    // Check history
    const historyPath = path.join(odavlPath, 'history.json');
    const history = JSON.parse(await fs.readFile(historyPath, 'utf-8'));
    console.log(chalk.white(`📜 Total Runs: ${chalk.bold(history.length)}`));
    
    if (history.length > 0) {
      const lastRun = history[history.length - 1];
      console.log(chalk.white(`   Last Run: ${chalk.dim(new Date(lastRun.startedAt).toLocaleString())}`));
      console.log(chalk.white(`   Status: ${lastRun.success ? chalk.green('✅ Success') : chalk.red('❌ Failed')}`));
    }
    
    // Check recipes trust
    const trustPath = path.join(odavlPath, 'recipes-trust.json');
    const trust = JSON.parse(await fs.readFile(trustPath, 'utf-8'));
    const recipeCount = Object.keys(trust).length;
    console.log(chalk.white(`\n🎯 Recipes: ${chalk.bold(recipeCount)}`));
    
    // Check undo snapshots
    const undoPath = path.join(odavlPath, 'undo');
    const undoFiles = await fs.readdir(undoPath);
    console.log(chalk.white(`\n💾 Undo Snapshots: ${chalk.bold(undoFiles.length)}`));
    
    // Check gates.yml
    const gatesPath = path.join(odavlPath, 'gates.yml');
    const gatesExists = await fs.access(gatesPath).then(() => true).catch(() => false);
    console.log(chalk.white(`\n🛡️ Quality Gates: ${gatesExists ? chalk.green('✅ Configured') : chalk.yellow('⚠️ Missing')}`));
    
  } catch (error: any) {
    console.error(chalk.red('❌ Failed to read status:'));
    console.error(chalk.red(error.message));
  }
  
  await waitForKeypress();
}

async function main() {
  const rl = readline.createInterface({ input, output });
  
  const menuItems: MenuItem[] = [
    {
      key: '1',
      emoji: '🔍',
      title: 'Observe',
      description: 'Collect current code quality metrics (ESLint, TypeScript)',
      action: async () => {
        await runCommand(
          'node odavl-studio/autopilot/engine/dist/index.js observe',
          'Running Observe Phase'
        );
      },
    },
    {
      key: '2',
      emoji: '🧠',
      title: 'Decide',
      description: 'Analyze metrics and determine next improvement action',
      action: async () => {
        await runCommand(
          'node odavl-studio/autopilot/engine/dist/index.js decide',
          'Running Decide Phase'
        );
      },
    },
    {
      key: '3',
      emoji: '⚡',
      title: 'Act',
      description: 'Execute the selected improvement action (autofix, recipe)',
      action: async () => {
        await runCommand(
          'node odavl-studio/autopilot/engine/dist/index.js act',
          'Running Act Phase'
        );
      },
    },
    {
      key: '4',
      emoji: '✅',
      title: 'Verify',
      description: 'Run quality gates and verify improvements',
      action: async () => {
        await runCommand(
          'node odavl-studio/autopilot/engine/dist/index.js verify',
          'Running Verify Phase'
        );
      },
    },
    {
      key: '5',
      emoji: '🚀',
      title: 'Run Full O-D-A-V-L Cycle',
      description: 'Execute complete autonomous healing cycle (recommended)',
      action: async () => {
        await runCommand(
          'node odavl-studio/autopilot/engine/dist/index.js run',
          'Running Full O-D-A-V-L Cycle'
        );
      },
    },
    {
      key: '6',
      emoji: '↩️',
      title: 'Undo Last Change',
      description: 'Roll back the last automated change (uses .odavl/undo)',
      action: async () => {
        await runCommand(
          'node odavl-studio/autopilot/engine/dist/index.js undo',
          'Rolling Back Last Change'
        );
      },
    },
    {
      key: '7',
      emoji: '📊',
      title: 'Dashboard',
      description: 'Launch learning/analytics dashboard',
      action: async () => {
        await runCommand(
          'node odavl-studio/autopilot/engine/dist/index.js dashboard',
          'Launching Dashboard'
        );
      },
    },
    {
      key: '8',
      emoji: '📈',
      title: 'Status',
      description: 'Show ODAVL Autopilot status and statistics',
      action: showStatus,
    },
    {
      key: '9',
      emoji: '🔧',
      title: 'Initialize ODAVL',
      description: 'Set up .odavl directory structure and configuration',
      action: initODAVL,
    },
  ];
  
  let running = true;
  
  while (running) {
    printHeader();
    
    const isSetup = await checkODAVLSetup();
    if (!isSetup) {
      console.log(chalk.yellow('⚠️ ODAVL workspace not initialized'));
      console.log(chalk.dim('   Please run option 9 to initialize\n'));
    } else {
      console.log(chalk.green('✅ ODAVL workspace ready\n'));
    }
    
    printMenu(menuItems);
    
    const answer = await rl.question(chalk.cyan('💡 Enter your choice: '));
    const choice = answer.trim().toLowerCase();
    
    if (choice === '0' || choice === 'q' || choice === 'quit' || choice === 'exit') {
      console.log(chalk.cyan('\n👋 Goodbye!'));
      running = false;
      break;
    }
    
    const selectedItem = menuItems.find(item => item.key === choice);
    
    if (selectedItem) {
      await selectedItem.action();
    } else {
      console.log(chalk.red('\n❌ Invalid choice. Please try again.'));
      await new Promise(resolve => setTimeout(resolve, 1500));
    }
  }
  
  rl.close();
  process.exit(0);
}

// Handle clean exit
process.on('SIGINT', () => {
  console.log(chalk.cyan('\n\n👋 Goodbye!'));
  process.exit(0);
});

main().catch(error => {
  console.error(chalk.red('Fatal error:'), error);
  process.exit(1);
});
