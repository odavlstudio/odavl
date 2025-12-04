/**
 * Autopilot Cloud Upload Integration
 * Upload ledgers, snapshots, and run data to ODAVL Cloud
 */

import { cloudUploadService } from '../../../packages/core/src/services/cli-cloud-upload';
import { promises as fs } from 'fs';
import { join } from 'path';

export interface AutopilotUploadOptions {
  projectId?: string;
  projectName?: string;
  autoUpload?: boolean;
  silent?: boolean;
}

/**
 * Upload Autopilot run ledger to cloud
 */
export async function uploadAutopilotLedger(
  workspacePath: string,
  runId: string,
  options: AutopilotUploadOptions = {}
): Promise<void> {
  const { projectId, projectName, autoUpload = true, silent = false } = options;
  
  if (!autoUpload) {
    return;
  }
  
  if (!silent) {
    console.log('\n📤 Uploading Autopilot ledger to ODAVL Cloud...');
  }
  
  try {
    const ledgerPath = join(workspacePath, '.odavl', 'ledger', `run-${runId}.json`);
    
    // Check if ledger exists
    try {
      await fs.access(ledgerPath);
    } catch {
      if (!silent) {
        console.log('ℹ️  No ledger found to upload');
      }
      return;
    }
    
    // Read ledger
    const ledgerData = await fs.readFile(ledgerPath, 'utf8');
    const ledger = JSON.parse(ledgerData);
    
    // Prepare metadata
    const metadata = {
      projectId,
      projectName: projectName || 'Unknown Project',
      runId,
      timestamp: ledger.startedAt || new Date().toISOString(),
      workspace: workspacePath,
      editsCount: ledger.edits?.length || 0,
      phase: ledger.phase || 'unknown',
    };
    
    // Upload to cloud
    const result = await cloudUploadService.upload(
      'autopilot',
      'ledger',
      ledgerPath,
      metadata,
      {
        compress: true,
        retry: true,
      }
    );
    
    if (result.success) {
      if (!silent) {
        console.log('✅ Ledger uploaded successfully!');
        console.log(`📊 View ledger: ${result.url}`);
      }
    } else {
      if (!silent) {
        console.log(`⚠️  ${result.error}`);
      }
    }
  } catch (error) {
    if (!silent) {
      console.error('❌ Failed to upload ledger:', error);
    }
  }
}

/**
 * Upload undo snapshot to cloud
 */
export async function uploadUndoSnapshot(
  workspacePath: string,
  snapshotId: string,
  options: AutopilotUploadOptions = {}
): Promise<void> {
  const { projectId, projectName, silent = false } = options;
  
  if (!silent) {
    console.log('\n📤 Uploading undo snapshot...');
  }
  
  try {
    const snapshotPath = join(workspacePath, '.odavl', 'undo', `${snapshotId}.json`);
    
    // Check if snapshot exists
    try {
      await fs.access(snapshotPath);
    } catch {
      if (!silent) {
        console.log('ℹ️  No snapshot found to upload');
      }
      return;
    }
    
    // Read snapshot
    const snapshotData = await fs.readFile(snapshotPath, 'utf8');
    const snapshot = JSON.parse(snapshotData);
    
    // Prepare metadata
    const metadata = {
      projectId,
      projectName: projectName || 'Unknown Project',
      snapshotId,
      timestamp: snapshot.timestamp || new Date().toISOString(),
      workspace: workspacePath,
      filesCount: snapshot.files?.length || 0,
    };
    
    // Upload to cloud
    const result = await cloudUploadService.upload(
      'autopilot',
      'snapshot',
      snapshotPath,
      metadata,
      {
        compress: true,
        retry: true,
      }
    );
    
    if (result.success) {
      if (!silent) {
        console.log('✅ Snapshot uploaded successfully!');
      }
    } else {
      if (!silent) {
        console.log(`⚠️  ${result.error}`);
      }
    }
  } catch (error) {
    if (!silent) {
      console.error('❌ Failed to upload snapshot:', error);
    }
  }
}

/**
 * Upload recipe trust scores
 */
export async function uploadRecipeTrust(
  workspacePath: string,
  options: AutopilotUploadOptions = {}
): Promise<void> {
  const { projectId, silent = false } = options;
  
  if (!silent) {
    console.log('\n📤 Uploading recipe trust scores...');
  }
  
  try {
    const trustPath = join(workspacePath, '.odavl', 'recipes-trust.json');
    
    // Check if file exists
    try {
      await fs.access(trustPath);
    } catch {
      if (!silent) {
        console.log('ℹ️  No trust scores found to upload');
      }
      return;
    }
    
    const metadata = {
      projectId,
      timestamp: new Date().toISOString(),
      workspace: workspacePath,
    };
    
    // Upload to cloud
    const result = await cloudUploadService.upload(
      'autopilot',
      'recipe-trust',
      trustPath,
      metadata,
      {
        compress: true,
        retry: true,
      }
    );
    
    if (result.success) {
      if (!silent) {
        console.log('✅ Recipe trust scores uploaded!');
      }
    } else {
      if (!silent) {
        console.log(`⚠️  ${result.error}`);
      }
    }
  } catch (error) {
    if (!silent) {
      console.error('❌ Failed to upload recipe trust:', error);
    }
  }
}

/**
 * Upload run history
 */
export async function uploadRunHistory(
  workspacePath: string,
  options: AutopilotUploadOptions = {}
): Promise<void> {
  const { projectId, silent = false } = options;
  
  if (!silent) {
    console.log('\n📤 Uploading run history...');
  }
  
  try {
    const historyPath = join(workspacePath, '.odavl', 'history.json');
    
    // Check if file exists
    try {
      await fs.access(historyPath);
    } catch {
      if (!silent) {
        console.log('ℹ️  No run history found to upload');
      }
      return;
    }
    
    const metadata = {
      projectId,
      timestamp: new Date().toISOString(),
      workspace: workspacePath,
    };
    
    // Upload to cloud
    const result = await cloudUploadService.upload(
      'autopilot',
      'run-history',
      historyPath,
      metadata,
      {
        compress: true,
        retry: true,
      }
    );
    
    if (result.success) {
      if (!silent) {
        console.log('✅ Run history uploaded!');
      }
    } else {
      if (!silent) {
        console.log(`⚠️  ${result.error}`);
      }
    }
  } catch (error) {
    if (!silent) {
      console.error('❌ Failed to upload run history:', error);
    }
  }
}

/**
 * Auto-upload hook for Autopilot CLI
 */
export async function autopilotAutoUploadHook(
  workspacePath: string,
  runId: string,
  options: AutopilotUploadOptions = {}
): Promise<void> {
  // Upload ledger
  await uploadAutopilotLedger(workspacePath, runId, options);
  
  // Upload latest snapshot
  const latestSnapshotPath = join(workspacePath, '.odavl', 'undo', 'latest.json');
  try {
    const latestData = await fs.readFile(latestSnapshotPath, 'utf8');
    const latest = JSON.parse(latestData);
    if (latest.snapshotId) {
      await uploadUndoSnapshot(workspacePath, latest.snapshotId, { ...options, silent: true });
    }
  } catch {
    // File doesn't exist, skip
  }
  
  // Upload recipe trust scores
  await uploadRecipeTrust(workspacePath, { ...options, silent: true });
  
  // Upload run history
  await uploadRunHistory(workspacePath, { ...options, silent: true });
}
