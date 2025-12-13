/**
 * Phase 2.2 Task 7: Sync Offline Queue Command
 * 
 * Retries queued uploads that failed due to network errors.
 * 
 * Usage:
 *   odavl insight sync
 */

import chalk from 'chalk';
import ora from 'ora';
import { getOfflineQueue } from '../utils/offline-queue.js';
import { uploadAnalysis, type UploadResult } from '../utils/analysis-uploader.js';

/**
 * Sync result summary
 */
interface SyncSummary {
  totalQueued: number;
  synced: number;
  failed: number;
  remaining: number;
  stillOffline: boolean;
}

/**
 * Execute sync command
 * 
 * @param workspaceRoot Workspace root directory
 * @param options Command options
 */
export async function syncOfflineQueue(
  workspaceRoot: string,
  options: { debug?: boolean } = {}
): Promise<void> {
  const { debug } = options;

  console.log(chalk.cyan('\n🔄 Syncing Offline Queue...\n'));

  // Get offline queue
  const queue = getOfflineQueue(workspaceRoot);

  // Read all queued entries
  const entries = await queue.readAll();
  const pendingEntries = entries.filter((entry) => entry.status === 'pending');

  if (entries.length === 0) {
    console.log(chalk.gray('Queue is empty. Nothing to sync.\n'));
    return;
  }

  if (pendingEntries.length === 0) {
    console.log(chalk.yellow('⚠️  No pending entries in queue.'));
    console.log(chalk.gray(`${entries.length} permanently failed entries remain.`));
    console.log(chalk.gray('Run with --clear to remove failed entries.\n'));
    return;
  }

  console.log(chalk.white(`Found ${pendingEntries.length} queued upload(s)\n`));

  // Initialize summary
  const summary: SyncSummary = {
    totalQueued: pendingEntries.length,
    synced: 0,
    failed: 0,
    remaining: pendingEntries.length,
    stillOffline: false,
  };

  // Process each entry
  for (const entry of pendingEntries) {
    const spinner = ora({
      text: `Uploading queued analysis (attempt ${entry.attempts + 1}/${3})...`,
      color: 'cyan',
    }).start();

    try {
      // Extract metadata from payload
      const { projectId } = entry.payload;
      const issueCount = entry.payload.issues?.length || 0;

      if (debug) {
        spinner.text = `Uploading ${projectId} (${issueCount} issues)...`;
      }

      // Attempt upload using existing analysis-uploader logic
      // Note: We need to reconstruct the issues from payload
      const result = await retryQueuedUpload(entry, workspaceRoot, debug);

      if (result.type === 'SUCCESS') {
        spinner.succeed(chalk.green(`✓ Synced: ${projectId} (${issueCount} issues)`));
        
        // Remove from queue
        await queue.remove(entry.id);
        summary.synced += 1;
        summary.remaining -= 1;

        if (debug) {
          console.log(chalk.gray(`  Dashboard: ${result.dashboardUrl}`));
          console.log(chalk.gray(`  Upload ID: ${result.uploadId}`));
        }
      } else if (result.type === 'OFFLINE') {
        spinner.warn(chalk.yellow('⚠️  Still offline'));
        console.log(chalk.gray('  Network not available. Sync paused.\n'));
        
        summary.stillOffline = true;
        break; // Stop processing further entries
      } else {
        // ERROR type
        spinner.fail(chalk.red(`✗ Failed: ${projectId}`));
        console.log(chalk.gray(`  Error: ${result.message}`));
        
        // Increment attempts
        await queue.incrementAttempts(entry.id, result.message);
        
        // Check if permanently failed
        const updatedEntry = (await queue.readAll()).find((e) => e.id === entry.id);
        if (updatedEntry && queue.hasExceededMaxAttempts(updatedEntry)) {
          console.log(chalk.red(`  Permanently failed after 3 attempts\n`));
          summary.failed += 1;
          summary.remaining -= 1;
        } else {
          console.log(chalk.gray(`  Will retry later (${entry.attempts + 1}/3 attempts)\n`));
        }
      }
    } catch (error: any) {
      spinner.fail(chalk.red('✗ Sync error'));
      console.log(chalk.gray(`  ${error.message}\n`));
      
      // Increment attempts on unexpected errors
      await queue.incrementAttempts(entry.id, error.message);
      
      const updatedEntry = (await queue.readAll()).find((e) => e.id === entry.id);
      if (updatedEntry && queue.hasExceededMaxAttempts(updatedEntry)) {
        summary.failed += 1;
        summary.remaining -= 1;
      }
    }
  }

  // Print summary
  console.log(chalk.cyan('\n📊 Sync Summary\n'));
  console.log(chalk.white(`Total queued:       ${summary.totalQueued}`));
  console.log(chalk.green(`Successfully synced: ${summary.synced}`));
  console.log(chalk.red(`Failed permanently:  ${summary.failed}`));
  console.log(chalk.yellow(`Remaining in queue:  ${summary.remaining}`));

  if (summary.stillOffline) {
    console.log(chalk.gray('\n💡 Tip: Check your network connection and try again later.'));
  }

  if (summary.synced > 0) {
    console.log(chalk.green('\n✓ Queue sync completed successfully!\n'));
  } else if (summary.stillOffline) {
    console.log(chalk.yellow('\n⚠️  Sync paused due to network issues.\n'));
  } else {
    console.log(chalk.red('\n✗ All uploads failed. Check error messages above.\n'));
  }
}

/**
 * Retry queued upload
 * 
 * Uses the existing analysis-uploader logic but bypasses the auto-queue
 * mechanism to avoid infinite loops.
 * 
 * @param entry Queue entry to retry
 * @param workspaceRoot Workspace root directory
 * @param debug Debug mode
 */
async function retryQueuedUpload(
  entry: any,
  workspaceRoot: string,
  debug?: boolean
): Promise<UploadResult> {
  const { payload } = entry;

  // Reconstruct upload options from payload
  const options = {
    workspaceRoot,
    projectName: payload.projectId,
    branch: payload.metadata?.branch,
    commit: payload.metadata?.commit,
    debug,
    skipQueue: true, // CRITICAL: Skip auto-queue to avoid infinite loop
  };

  // Extract issues from payload
  const issues = payload.issues || [];

  // Call uploadAnalysis with skipQueue flag
  return await uploadAnalysis(issues, options);
}

/**
 * Clear offline queue
 * 
 * Removes all entries (including failed ones)
 */
export async function clearOfflineQueue(workspaceRoot: string): Promise<void> {
  console.log(chalk.cyan('\n🗑️  Clearing Offline Queue...\n'));

  const queue = getOfflineQueue(workspaceRoot);
  const entries = await queue.readAll();

  if (entries.length === 0) {
    console.log(chalk.gray('Queue is already empty.\n'));
    return;
  }

  await queue.clear();

  console.log(chalk.green(`✓ Removed ${entries.length} queued entry/entries\n`));
}
