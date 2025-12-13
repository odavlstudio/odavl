/**
 * ODAVL Insight - Baseline Commands
 * 
 * CLI commands for baseline management.
 */

import { Command } from 'commander';
import { Logger } from '../utils/logger.js';
import { formatTimestamp } from '../utils/format.js';
import {
  createBaseline,
  loadBaseline,
  listBaselines,
  deleteBaseline,
} from '../baseline/storage.js';
import { countBySeverity } from '../baseline/matcher.js';
import { RealAnalysisEngine } from '../analysis-engine.js';

const logger = new Logger('baseline');

/**
 * Creates baseline command
 */
export function createBaselineCommand(): Command {
  const cmd = new Command('baseline');
  cmd.description('Manage analysis baselines');

  // baseline create
  cmd
    .command('create')
    .description('Create a new baseline from current analysis')
    .option('--name <name>', 'Baseline name', 'main')
    .option('--detectors <list>', 'Comma-separated detectors to run')
    .option('--project-name <name>', 'Project name')
    .action(async (options) => {
      try {
        const workspaceRoot = process.cwd();
        const name = options.name as string;
        
        logger.info(`Creating baseline '${name}'...`);

        // Run analysis
        const engine = new RealAnalysisEngine();
        const detectorList = options.detectors
          ? (options.detectors as string).split(',').map((d) => d.trim())
          : undefined;

        const result = await engine.analyze(workspaceRoot, {
          detectors: detectorList,
        });

        // Create baseline
        const baseline = await createBaseline(workspaceRoot, name, result.issues, {
          detectors: result.detectors || [],
          projectName: options.projectName as string | undefined,
        });

        logger.success(`✅ Baseline '${name}' created successfully`);
        logger.info(`   Path: .odavl/baselines/${name}.json`);
        logger.info(`   Issues: ${baseline.metadata.totalIssues}`);
        logger.info(`   Files: ${baseline.metadata.totalFiles}`);
        if (baseline.metadata.gitCommit) {
          logger.info(`   Commit: ${baseline.metadata.gitCommit.slice(0, 8)}`);
        }

        const counts = countBySeverity(baseline.issues);
        logger.info(
          `   Severity: ${counts.critical} critical, ${counts.high} high, ${counts.medium} medium, ${counts.low} low`
        );

        process.exit(0);
      } catch (error) {
        logger.error('Failed to create baseline:', error);
        process.exit(2);
      }
    });

  // baseline list
  cmd
    .command('list')
    .description('List all available baselines')
    .action(async () => {
      try {
        const workspaceRoot = process.cwd();
        const baselines = await listBaselines(workspaceRoot);

        if (baselines.length === 0) {
          logger.info('No baselines found.');
          logger.info('Create one with: odavl-insight baseline create');
          process.exit(0);
          return;
        }

        console.log('\n📦 Available Baselines:\n');

        for (const { name, baseline } of baselines) {
          const isDefault = name === 'main';
          const defaultLabel = isDefault ? ' (default)' : '';

          console.log(`${name}.json${defaultLabel}`);
          console.log(`  Created: ${formatTimestamp(baseline.metadata.createdAt)}`);
          if (baseline.metadata.gitCommit) {
            console.log(`  Commit: ${baseline.metadata.gitCommit.slice(0, 8)}`);
          }
          if (baseline.metadata.autoCreated) {
            console.log('  Auto-created: yes');
          }

          const counts = countBySeverity(baseline.issues);
          console.log(
            `  Issues: ${baseline.metadata.totalIssues} (${counts.critical} critical, ${counts.high} high, ${counts.medium} medium, ${counts.low} low)`
          );
          console.log();
        }

        process.exit(0);
      } catch (error) {
        logger.error('Failed to list baselines:', error);
        process.exit(2);
      }
    });

  // baseline delete
  cmd
    .command('delete <name>')
    .description('Delete a baseline')
    .action(async (name: string) => {
      try {
        const workspaceRoot = process.cwd();

        await deleteBaseline(workspaceRoot, name);

        logger.success(`✅ Baseline '${name}' deleted successfully`);
        process.exit(0);
      } catch (error) {
        logger.error('Failed to delete baseline:', error);
        process.exit(2);
      }
    });

  return cmd;
}
