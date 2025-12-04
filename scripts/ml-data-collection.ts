#!/usr/bin/env node
/**
 * ML Data Collection Script - GitHub Mining CLI
 * 
 * Usage:
 *   pnpm ml:collect --language typescript --target 300000
 *   pnpm ml:collect --language javascript --target 200000
 *   pnpm ml:collect --language python --target 400000
 *   pnpm ml:collect-all  (runs all languages sequentially)
 * 
 * Environment:
 *   GITHUB_TOKEN - Required for 5000/hour rate limit (vs 60/hour)
 * 
 * Output:
 *   .odavl/datasets/{language}-fixes.json
 */

import { GitHubDataMiner, type DataCollectionProgress } from '../odavl-studio/insight/core/src/learning/data-collection.js';
import * as path from 'path';
import * as fs from 'fs';

interface CLIOptions {
  language: string;
  target: number;
  output?: string;
}

/**
 * Parse CLI arguments
 */
function parseArgs(): CLIOptions | null {
  const args = process.argv.slice(2);

  if (args.length === 0 || args.includes('--help')) {
    printHelp();
    return null;
  }

  if (args.includes('--all')) {
    return null; // Special case for collectAll()
  }

  let language = 'typescript';
  let target = 300000;
  let output: string | undefined;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--language' && i + 1 < args.length) {
      language = args[i + 1];
      i++;
    } else if (args[i] === '--target' && i + 1 < args.length) {
      target = parseInt(args[i + 1], 10);
      i++;
    } else if (args[i] === '--output' && i + 1 < args.length) {
      output = args[i + 1];
      i++;
    }
  }

  return { language, target, output };
}

/**
 * Print help message
 */
function printHelp(): void {
  console.log(`
🤖 ODAVL ML Data Collection - GitHub Mining CLI

Usage:
  pnpm ml:collect --language <lang> --target <count>
  pnpm ml:collect-all

Options:
  --language    Programming language (typescript, javascript, python)
  --target      Number of samples to collect (default: 300000)
  --output      Output file path (default: .odavl/datasets/{lang}-fixes.json)
  --all         Collect all languages sequentially
  --help        Show this help message

Environment Variables:
  GITHUB_TOKEN  Required for 5000/hour rate limit (get at github.com/settings/tokens)
                Without token: only 60 requests/hour

Examples:
  pnpm ml:collect --language typescript --target 300000
  pnpm ml:collect --language python --target 400000
  pnpm ml:collect-all

Output:
  .odavl/datasets/{language}-fixes.json

Estimated Time:
  TypeScript (300k):  20-30 hours
  JavaScript (200k):  15-20 hours
  Python (400k):      25-35 hours
  Total (900k+):      60-85 hours
`);
}

/**
 * Progress callback for live updates
 */
function onProgress(progress: DataCollectionProgress): void {
  const percent = ((progress.samplesCollected / progress.samplesTarget) * 100).toFixed(1);
  const timeRemainingHours = (progress.estimatedTimeRemaining / 3600).toFixed(1);

  process.stdout.write(
    `\r📊 Progress: ${progress.samplesCollected}/${progress.samplesTarget} (${percent}%) | ` +
    `Repos: ${progress.reposProcessed} | ` +
    `ETA: ${timeRemainingHours}h`
  );
}

/**
 * Collect data for a single language
 */
async function collectData(options: CLIOptions): Promise<void> {
  console.log(`\n🚀 Starting data collection for ${options.language}`);
  console.log(`📊 Target: ${options.target.toLocaleString()} samples\n`);

  // Check GitHub token
  const token = process.env.GITHUB_TOKEN;
  if (!token) {
    console.warn('⚠️  WARNING: No GITHUB_TOKEN found in environment');
    console.warn('   Rate limit: 60/hour (vs 5000/hour with token)');
    console.warn('   Get token at: https://github.com/settings/tokens\n');
  }

  // Create miner
  const miner = new GitHubDataMiner(token);

  // Start mining
  const startTime = Date.now();

  try {
    const samples = await miner.mineRepositories(
      options.language,
      options.target,
      onProgress
    );

    const elapsed = (Date.now() - startTime) / 1000;
    const elapsedHours = (elapsed / 3600).toFixed(1);

    console.log(`\n\n✅ Collection complete!`);
    console.log(`📊 Collected: ${samples.length} samples`);
    console.log(`⏱️  Time: ${elapsedHours} hours`);

    // Show statistics
    const stats = miner.getStats();
    console.log(`\n📈 Statistics:`);
    console.log(`  Success rate: ${(stats.successRate * 100).toFixed(1)}%`);
    console.log(`  Successes: ${stats.successCount}`);
    console.log(`  Failures: ${stats.failureCount}`);
    console.log(`\n🔍 Error types:`);
    for (const [type, count] of Object.entries(stats.byErrorType)) {
      console.log(`  ${type}: ${count}`);
    }

    // Export to file
    const outputPath = options.output ?? path.join(
      process.cwd(),
      '.odavl',
      'datasets',
      `${options.language}-fixes.json`
    );

    miner.exportSamples(outputPath);

    console.log(`\n💾 Saved to: ${outputPath}`);
  } catch (error) {
    console.error(`\n❌ Collection failed:`, error);
    process.exit(1);
  }
}

/**
 * Collect all languages sequentially
 */
async function collectAll(): Promise<void> {
  const languages = [
    { language: 'typescript', target: 300000 },
    { language: 'javascript', target: 200000 },
    { language: 'python', target: 400000 },
  ];

  console.log(`\n🚀 Starting full data collection for all languages`);
  console.log(`📊 Total target: 900,000+ samples`);
  console.log(`⏱️  Estimated time: 60-85 hours\n`);

  const startTime = Date.now();

  for (const config of languages) {
    await collectData(config);
    console.log(`\n${'='.repeat(60)}\n`);
  }

  const elapsed = (Date.now() - startTime) / 1000;
  const elapsedHours = (elapsed / 3600).toFixed(1);

  console.log(`\n🎉 All languages collected!`);
  console.log(`⏱️  Total time: ${elapsedHours} hours`);
}

/**
 * Main entry point
 */
async function main(): Promise<void> {
  console.log(`
╔════════════════════════════════════════════════════════════╗
║  ODAVL ML Data Collection - GitHub Fix Mining             ║
╚════════════════════════════════════════════════════════════╝
`);

  const options = parseArgs();

  if (options === null) {
    // Either --help or --all
    if (process.argv.includes('--all')) {
      await collectAll();
    }
    return;
  }

  await collectData(options);
}

// Run
main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
