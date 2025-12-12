/**
 * ODAVL Autopilot CLI Commands - Wave 6
 * Deterministic fix application with Insight integration
 */

import chalk from 'chalk';
import ora from 'ora';
import * as path from 'node:path';
import { analyzeWorkspace, type InsightAnalysisResult } from '@odavl/insight-sdk';
import {
  generateFixes,
  applyFixesToWorkspace,
  summarizeFixes,
  type FixPatch,
  type AutopilotSummary,
  MAX_FIXES_PER_RUN,
} from '@odavl/autopilot-core';

/**
 * Wave 6: Autopilot run command - Apply deterministic fixes
 */
export async function runAutopilot(options: {
  dryRun?: boolean;
  maxFixes?: number;
  detectors?: string[];
}): Promise<void> {
  console.log(chalk.bold.cyan('\n🤖 ODAVL Autopilot v1.0.0\n'));

  const workspaceRoot = process.cwd();
  const sessionId = `autopilot-${Date.now()}`;

  console.log(chalk.gray(`Mode: ${options.dryRun ? 'DRY RUN' : 'LIVE EXECUTION'}`));
  console.log(chalk.gray(`Session: ${sessionId}`));
  console.log(chalk.gray(`Max Fixes: ${options.maxFixes || MAX_FIXES_PER_RUN}`));

  const spinner = ora('Analyzing workspace with Insight...').start();

  try {
    // Step 1: Run Insight analysis
    spinner.text = '🔍 Running Insight detectors...';
    const analysis: InsightAnalysisResult = await analyzeWorkspace(workspaceRoot, {
      detectors: options.detectors,
    });
    
    spinner.succeed(
      `🔍 Insight analysis complete (${analysis.summary.totalIssues} issues found)`
    );

    if (analysis.summary.totalIssues === 0) {
      console.log(chalk.green('\n✅ No issues found - workspace is clean!\n'));
      return;
    }

    // Step 2: Generate fix patches
    spinner.start('🔧 Generating fix patches...');
    const fixes: FixPatch[] = await generateFixes(analysis);
    
    if (fixes.length === 0) {
      spinner.info('ℹ️  No fixable issues found');
      console.log(chalk.yellow('\nNote: Autopilot only fixes high/medium/low severity issues.'));
      console.log(chalk.yellow('Critical issues require manual review.\n'));
      return;
    }

    spinner.succeed(`🔧 Generated ${fixes.length} fix patches`);

    // Step 3: Preview or apply fixes
    if (options.dryRun) {
      console.log(chalk.yellow('\n📋 DRY RUN - Preview of fixes:\n'));
      
      const fileGroups = new Map<string, FixPatch[]>();
      fixes.forEach(fix => {
        const relativePath = path.relative(workspaceRoot, fix.file);
        if (!fileGroups.has(relativePath)) {
          fileGroups.set(relativePath, []);
        }
        fileGroups.get(relativePath)!.push(fix);
      });

      fileGroups.forEach((patches, file) => {
        console.log(chalk.cyan(`\n${file}:`));
        patches.forEach((patch, i) => {
          console.log(
            `  ${i + 1}. Line ${patch.start}: ${patch.detector}/${patch.ruleId || 'unknown'} (confidence: ${(patch.confidence * 100).toFixed(0)}%)`
          );
        });
      });

      console.log(chalk.gray('\n\nRun without --dry-run to apply fixes.\n'));
      return;
    }

    // Step 4: Apply fixes with backup
    spinner.start('💾 Creating backup...');
    await applyFixesToWorkspace(fixes, workspaceRoot);
    spinner.succeed('✅ Fixes applied successfully!');

    // Step 5: Summary
    const summary: AutopilotSummary = summarizeFixes(fixes);
    
    console.log(chalk.green('\n✅ Autopilot session complete!\n'));
    console.log(chalk.cyan('Summary:'));
    console.log(`  Total Fixes: ${summary.totalFixes}`);
    console.log(`  Files Modified: ${summary.filesModified}`);
    console.log(`  Backup: ${summary.backupPath}`);
    console.log(chalk.gray(`\nAudit log: .odavl/autopilot-log.json\n`));
    
  } catch (error) {
    spinner.fail('❌ Autopilot failed');
    console.error(chalk.red('\nError:'), error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}
