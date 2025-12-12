/**
 * CLI Sync Commands - Push, Pull, Status, List, Delete, Queue
 */

import { Command } from 'commander';
import ora from 'ora';
import chalk from 'chalk';
// Cloud features temporarily disabled
// import { CloudClient } from '@odavl-studio/cloud-client';
import { cloudUploadService } from '@odavl-studio/core/services/cli-cloud-upload';
import { readFileSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';
import prompts from 'prompts';

const program = new Command();

/**
 * Get cloud client - DISABLED
 */
function getCloudClient(): any {
  console.error(chalk.red('Cloud sync features are temporarily disabled in this version.'));
  console.log(chalk.yellow('Local analysis still works with: odavl insight analyze'));
  process.exit(1);
}

/**
 * Format bytes
 */
function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

/**
 * Format duration
 */
function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(2)}s`;
}

/**
 * odavl sync push
 * Upload .odavl directory to cloud
 */
program
  .command('push')
  .description('Upload workspace to cloud')
  .option('-n, --name <name>', 'Workspace name', 'default')
  .option('-p, --path <path>', 'Workspace path', process.cwd())
  .action(async (options) => {
    const spinner = ora('Uploading workspace...').start();

    try {
      const client = getCloudClient();
      const { name, path } = options;

      const result = await client.uploadWorkspace(name, path);

      spinner.succeed(
        chalk.green(
          `✓ Workspace uploaded: ${result.workspace.fileCount} files (${formatBytes(result.workspace.totalSize)})`
        )
      );

      console.log(chalk.gray(`  Name: ${result.workspace.name}`));
      console.log(chalk.gray(`  Version: ${result.workspace.version}`));
      console.log(chalk.gray(`  Checksum: ${result.workspace.checksum}`));
    } catch (error: any) {
      spinner.fail(chalk.red('Failed to upload workspace'));
      console.error(chalk.red(error.message));
      process.exit(1);
    }
  });

/**
 * odavl sync pull
 * Download .odavl directory from cloud
 */
program
  .command('pull')
  .description('Download workspace from cloud')
  .option('-n, --name <name>', 'Workspace name', 'default')
  .option('-p, --path <path>', 'Destination path', process.cwd())
  .action(async (options) => {
    const spinner = ora('Downloading workspace...').start();

    try {
      const client = getCloudClient();
      const { name, path } = options;

      const result = await client.downloadWorkspace(name, path);

      spinner.succeed(
        chalk.green(
          `✓ Workspace downloaded: ${result.workspace.fileCount} files (${formatBytes(result.workspace.totalSize)})`
        )
      );

      console.log(chalk.gray(`  Name: ${result.workspace.name}`));
      console.log(chalk.gray(`  Version: ${result.workspace.version}`));
      console.log(chalk.gray(`  Checksum: ${result.workspace.checksum}`));
    } catch (error: any) {
      spinner.fail(chalk.red('Failed to download workspace'));
      console.error(chalk.red(error.message));
      process.exit(1);
    }
  });

/**
 * odavl sync status
 * Show sync status
 */
program
  .command('status')
  .description('Show sync status')
  .option('-n, --name <name>', 'Workspace name', 'default')
  .option('-p, --path <path>', 'Workspace path', process.cwd())
  .action(async (options) => {
    const spinner = ora('Checking sync status...').start();

    try {
      const client = getCloudClient();
      const { name, path } = options;

      // Get local metadata
      const localMetadata = await client.getLocalMetadata(path);

      // Get remote metadata
      const remoteMetadata = await client.getRemoteMetadata(name);

      spinner.stop();

      if (!remoteMetadata) {
        console.log(chalk.yellow('⚠ Workspace not found in cloud'));
        console.log(chalk.gray('  Run "odavl sync push" to upload'));
        return;
      }

      // Compare versions
      if (localMetadata.checksum === remoteMetadata.checksum) {
        console.log(chalk.green('✓ In sync'));
      } else {
        console.log(chalk.yellow('⚠ Out of sync'));
      }

      console.log(chalk.cyan('\nLocal:'));
      console.log(chalk.gray(`  Files: ${localMetadata.files.length}`));
      console.log(chalk.gray(`  Size: ${formatBytes(localMetadata.totalSize)}`));
      console.log(chalk.gray(`  Version: ${localMetadata.version}`));

      console.log(chalk.cyan('\nRemote:'));
      console.log(chalk.gray(`  Files: ${remoteMetadata.files.length}`));
      console.log(chalk.gray(`  Size: ${formatBytes(remoteMetadata.totalSize)}`));
      console.log(chalk.gray(`  Version: ${remoteMetadata.version}`));
      console.log(
        chalk.gray(
          `  Last sync: ${new Date(remoteMetadata.lastSyncAt).toLocaleString()}`
        )
      );
    } catch (error: any) {
      spinner.fail(chalk.red('Failed to check sync status'));
      console.error(chalk.red(error.message));
      process.exit(1);
    }
  });

/**
 * odavl sync list
 * List all workspaces
 */
program
  .command('list')
  .description('List all workspaces')
  .action(async () => {
    const spinner = ora('Loading workspaces...').start();

    try {
      const client = getCloudClient();
      const result = await client.listWorkspaces();

      spinner.stop();

      if (result.workspaces.length === 0) {
        console.log(chalk.yellow('No workspaces found'));
        return;
      }

      console.log(chalk.cyan(`\n${result.totalCount} workspaces:\n`));

      result.workspaces.forEach((w: any) => {
        console.log(chalk.white(`  ${w.name}`));
        console.log(chalk.gray(`    Files: ${w.fileCount}`));
        console.log(chalk.gray(`    Size: ${formatBytes(w.totalSize)}`));
        console.log(chalk.gray(`    Version: ${w.version}`));
        console.log(
          chalk.gray(`    Last sync: ${new Date(w.lastSyncAt).toLocaleString()}`)
        );
        console.log();
      });
    } catch (error: any) {
      spinner.fail(chalk.red('Failed to list workspaces'));
      console.error(chalk.red(error.message));
      process.exit(1);
    }
  });

/**
 * odavl sync delete
 * Delete workspace from cloud
 */
program
  .command('delete')
  .description('Delete workspace from cloud')
  .option('-n, --name <name>', 'Workspace name', 'default')
  .action(async (options) => {
    const { name } = options;

    // Confirm deletion
    const response = await prompts({
      type: 'confirm',
      name: 'confirmed',
      message: `Delete workspace '${name}' from cloud?`,
      initial: false,
    });

    if (!response.confirmed) {
      console.log(chalk.yellow('Cancelled'));
      return;
    }

    const spinner = ora('Deleting workspace...').start();

    try {
      const client = getCloudClient();
      await client.deleteWorkspace(name);

      spinner.succeed(chalk.green(`✓ Workspace '${name}' deleted`));
    } catch (error: any) {
      spinner.fail(chalk.red('Failed to delete workspace'));
      console.error(chalk.red(error.message));
      process.exit(1);
    }
  });

/**
 * odavl sync
 * Bidirectional sync
 */
program
  .command('sync')
  .description('Sync workspace (push + pull)')
  .option('-n, --name <name>', 'Workspace name', 'default')
  .option('-p, --path <path>', 'Workspace path', process.cwd())
  .option('-d, --direction <direction>', 'Sync direction (push/pull/both)', 'both')
  .option(
    '-r, --resolve <strategy>',
    'Conflict resolution (local/remote/skip/prompt)',
    'prompt'
  )
  .action(async (options) => {
    const spinner = ora('Syncing workspace...').start();

    try {
      const client = getCloudClient();
      const { name, path, direction, resolve } = options;

      const result = await client.syncWorkspace(name, path, {
        direction,
        conflictResolution: resolve,
        incremental: true,
      });

      spinner.succeed(chalk.green('✓ Sync completed'));

      console.log(chalk.cyan('\nResults:'));
      console.log(chalk.gray(`  ↑ Uploaded: ${result.result.uploaded} files`));
      console.log(chalk.gray(`  ↓ Downloaded: ${result.result.downloaded} files`));
      console.log(chalk.gray(`  ✕ Deleted: ${result.result.deleted} files`));

      if (result.result.conflicts > 0) {
        console.log(
          chalk.yellow(`  ⚠ Conflicts: ${result.result.conflicts} files`)
        );
      }

      console.log(
        chalk.gray(
          `  Duration: ${formatDuration(result.result.duration)}`
        )
      );
      console.log(
        chalk.gray(
          `  Transferred: ${formatBytes(result.result.bytesTransferred)}`
        )
      );
    } catch (error: any) {
      spinner.fail(chalk.red('Failed to sync workspace'));
      console.error(chalk.red(error.message));
      process.exit(1);
    }
  });

/**
 * Queue Command - View and manage offline upload queue
 */
program
  .command('queue')
  .description('View offline upload queue status')
  .option('-c, --clear', 'Clear the queue')
  .action(async (options) => {
    try {
      if (options.clear) {
        const spinner = ora('Clearing queue...').start();
        await cloudUploadService.clearQueue();
        spinner.succeed(chalk.green('Queue cleared successfully'));
        return;
      }

      const status = await cloudUploadService.getQueueStatus();

      console.log(chalk.bold('\n📊 Upload Queue Status:\n'));

      if (status.total === 0) {
        console.log(chalk.green('✅ Queue is empty\n'));
        return;
      }

      console.log(chalk.yellow(`Total items: ${status.total}\n`));

      console.log(chalk.bold('By product:'));
      for (const [product, count] of Object.entries(status.byProduct)) {
        console.log(chalk.gray(`  ${product}: ${count}`));
      }
      console.log('');

      if (status.oldest) {
        console.log(chalk.gray(`Oldest item: ${new Date(status.oldest).toLocaleString()}`));
      }

      console.log(chalk.blue('\n💡 Run "odavl sync process-queue" to process the queue\n'));
    } catch (error: any) {
      console.error(chalk.red(`\n❌ Error: ${error.message}\n`));
      process.exit(1);
    }
  });

/**
 * Process Queue Command - Retry failed uploads
 */
program
  .command('process-queue')
  .description('Process offline upload queue and retry failed uploads')
  .action(async () => {
    try {
      const spinner = ora('Syncing offline queue with ODAVL Cloud...').start();

      // Get queue status
      const status = await cloudUploadService.getQueueStatus();

      if (status.total === 0) {
        spinner.info(chalk.green('Queue is empty. Nothing to sync.'));
        return;
      }

      spinner.text = `Processing ${status.total} queued uploads...`;

      // Process queue
      const result = await cloudUploadService.processQueue();

      spinner.stop();

      console.log(chalk.bold('\n📊 Sync Results:'));
      console.log(chalk.gray(`   Processed: ${result.processed}`));
      console.log(chalk.green(`   ✅ Succeeded: ${result.succeeded}`));
      console.log(chalk.red(`   ❌ Failed: ${result.failed}`));
      console.log('');

      if (result.succeeded === result.processed) {
        console.log(chalk.green('✅ All uploads completed successfully!\n'));
      } else if (result.succeeded > 0) {
        console.log(chalk.yellow('⚠️  Some uploads failed. Run again to retry.\n'));
      } else {
        console.log(chalk.red('❌ All uploads failed. Check your connection and API key.\n'));
      }
    } catch (error: any) {
      console.error(chalk.red(`\n❌ Sync failed: ${error.message}\n`));
      process.exit(1);
    }
  });

program.parse(process.argv);
