/**
 * Phase 2.2 Task 8: Sync Command Verification Tests
 * 
 * Tests sync retry logic, entry removal, and failure handling
 */

import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import { 
  runSuite, 
  assert, 
  assertEquals, 
  createTempWorkspace, 
  cleanupTempWorkspace,
  fileExists,
} from './test-utils.js';
import { getOfflineQueue } from '../../src/utils/offline-queue.js';

// Mock sync result type
interface SyncSummary {
  totalQueued: number;
  synced: number;
  failed: number;
  remaining: number;
  stillOffline: boolean;
}

// Mock retry function
async function mockRetryQueuedUpload(
  entry: any,
  networkState: 'online' | 'offline' | 'error' = 'online'
): Promise<{ type: 'SUCCESS' | 'OFFLINE' | 'ERROR'; reason?: string }> {
  if (networkState === 'offline') {
    return { type: 'OFFLINE', reason: 'Network unavailable' };
  }
  
  if (networkState === 'error') {
    return { type: 'ERROR', reason: 'Server error' };
  }
  
  return { type: 'SUCCESS' };
}

// Mock sync function
async function mockSyncOfflineQueue(
  workspaceRoot: string,
  networkStates: Array<'online' | 'offline' | 'error'>
): Promise<SyncSummary> {
  const queue = getOfflineQueue(workspaceRoot);
  const entries = await queue.readAll();
  const pendingEntries = entries.filter(e => e.status === 'pending');
  
  let synced = 0;
  let failed = 0;
  let stillOffline = false;
  
  for (let i = 0; i < pendingEntries.length; i++) {
    const entry = pendingEntries[i];
    const networkState = networkStates[i] || 'online';
    
    const result = await mockRetryQueuedUpload(entry, networkState);
    
    if (result.type === 'SUCCESS') {
      await queue.remove(entry.id);
      synced++;
    } else if (result.type === 'OFFLINE') {
      stillOffline = true;
      break; // Stop processing
    } else if (result.type === 'ERROR') {
      await queue.incrementAttempts(entry.id, result.reason || 'Error');
      const updatedEntries = await queue.readAll();
      const updatedEntry = updatedEntries.find(e => e.id === entry.id);
      if (updatedEntry && updatedEntry.status === 'failed') {
        failed++;
      }
    }
  }
  
  const remainingEntries = await queue.readAll();
  const remaining = remainingEntries.filter(e => e.status === 'pending').length;
  
  return {
    totalQueued: pendingEntries.length,
    synced,
    failed,
    remaining,
    stillOffline,
  };
}

export async function verifySyncCommand() {
  const tests = [
    {
      name: 'Sync removes successfully uploaded entries',
      fn: async () => {
        const workspace = await createTempWorkspace();
        const queue = getOfflineQueue(workspace);
        
        // Add test entries
        const payload = {
          projectId: 'test-project',
          timestamp: new Date().toISOString(),
          issues: [],
          metadata: {},
        };
        
        await queue.enqueue(payload, 'Error 1');
        await queue.enqueue(payload, 'Error 2');
        
        // Sync (all succeed)
        const summary = await mockSyncOfflineQueue(workspace, ['online', 'online']);
        
        assertEquals(summary.totalQueued, 2, 'Should process 2 entries');
        assertEquals(summary.synced, 2, 'Should sync 2 entries');
        assertEquals(summary.remaining, 0, 'Should have 0 remaining');
        
        await cleanupTempWorkspace(workspace);
      },
    },
    
    {
      name: 'Sync stops on OFFLINE result',
      fn: async () => {
        const workspace = await createTempWorkspace();
        const queue = getOfflineQueue(workspace);
        
        const payload = {
          projectId: 'test-project',
          timestamp: new Date().toISOString(),
          issues: [],
          metadata: {},
        };
        
        await queue.enqueue(payload, 'Error 1');
        await queue.enqueue(payload, 'Error 2');
        await queue.enqueue(payload, 'Error 3');
        
        // Sync (first succeeds, second goes offline)
        const summary = await mockSyncOfflineQueue(workspace, ['online', 'offline', 'online']);
        
        assertEquals(summary.synced, 1, 'Should sync 1 entry before offline');
        assertEquals(summary.stillOffline, true, 'Should detect offline status');
        assertEquals(summary.remaining, 2, 'Should have 2 remaining entries');
        
        await cleanupTempWorkspace(workspace);
      },
    },
    
    {
      name: 'Sync increments attempts on ERROR',
      fn: async () => {
        const workspace = await createTempWorkspace();
        const queue = getOfflineQueue(workspace);
        
        const payload = {
          projectId: 'test-project',
          timestamp: new Date().toISOString(),
          issues: [],
          metadata: {},
        };
        
        const id = await queue.enqueue(payload, 'Initial error');
        
        // First sync attempt (error)
        await mockSyncOfflineQueue(workspace, ['error']);
        
        let entries = await queue.readAll();
        let entry = entries.find(e => e.id === id)!;
        assertEquals(entry.attempts, 1, 'Should have 1 attempt after first sync');
        assertEquals(entry.status, 'pending', 'Should still be pending');
        
        // Second sync attempt (error)
        await mockSyncOfflineQueue(workspace, ['error']);
        
        entries = await queue.readAll();
        entry = entries.find(e => e.id === id)!;
        assertEquals(entry.attempts, 2, 'Should have 2 attempts after second sync');
        assertEquals(entry.status, 'pending', 'Should still be pending');
        
        await cleanupTempWorkspace(workspace);
      },
    },
    
    {
      name: 'Sync marks entry as failed after 3 attempts',
      fn: async () => {
        const workspace = await createTempWorkspace();
        const queue = getOfflineQueue(workspace);
        
        const payload = {
          projectId: 'test-project',
          timestamp: new Date().toISOString(),
          issues: [],
          metadata: {},
        };
        
        const id = await queue.enqueue(payload, 'Initial error');
        
        // Three sync attempts (all error)
        await mockSyncOfflineQueue(workspace, ['error']);
        await mockSyncOfflineQueue(workspace, ['error']);
        await mockSyncOfflineQueue(workspace, ['error']);
        
        const entries = await queue.readAll();
        const entry = entries.find(e => e.id === id)!;
        
        assertEquals(entry.attempts, 3, 'Should have 3 attempts');
        assertEquals(entry.status, 'failed', 'Should be marked as failed');
        
        await cleanupTempWorkspace(workspace);
      },
    },
    
    {
      name: 'Sync with empty queue returns zero counts',
      fn: async () => {
        const workspace = await createTempWorkspace();
        
        const summary = await mockSyncOfflineQueue(workspace, []);
        
        assertEquals(summary.totalQueued, 0, 'Should have 0 total');
        assertEquals(summary.synced, 0, 'Should have 0 synced');
        assertEquals(summary.remaining, 0, 'Should have 0 remaining');
        
        await cleanupTempWorkspace(workspace);
      },
    },
    
    {
      name: 'Sync skips failed entries (only processes pending)',
      fn: async () => {
        const workspace = await createTempWorkspace();
        const queue = getOfflineQueue(workspace);
        
        const payload = {
          projectId: 'test-project',
          timestamp: new Date().toISOString(),
          issues: [],
          metadata: {},
        };
        
        const id1 = await queue.enqueue(payload, 'Error 1');
        const id2 = await queue.enqueue(payload, 'Error 2');
        
        // Mark first entry as failed
        await queue.incrementAttempts(id1, 'Error');
        await queue.incrementAttempts(id1, 'Error');
        await queue.incrementAttempts(id1, 'Error');
        
        // Sync (should only process second entry)
        const summary = await mockSyncOfflineQueue(workspace, ['online']);
        
        assertEquals(summary.totalQueued, 1, 'Should only process pending entry');
        assertEquals(summary.synced, 1, 'Should sync pending entry');
        
        const entries = await queue.readAll();
        assertEquals(entries.length, 1, 'Should have 1 failed entry remaining');
        assertEquals(entries[0].status, 'failed', 'Remaining entry should be failed');
        
        await cleanupTempWorkspace(workspace);
      },
    },
    
    {
      name: 'Sync provides accurate summary counts',
      fn: async () => {
        const workspace = await createTempWorkspace();
        const queue = getOfflineQueue(workspace);
        
        const payload = {
          projectId: 'test-project',
          timestamp: new Date().toISOString(),
          issues: [],
          metadata: {},
        };
        
        // Add 5 entries
        await queue.enqueue(payload, 'Error 1');
        await queue.enqueue(payload, 'Error 2');
        await queue.enqueue(payload, 'Error 3');
        await queue.enqueue(payload, 'Error 4');
        await queue.enqueue(payload, 'Error 5');
        
        // Sync: 2 succeed, 1 errors (will fail after 3 attempts), 2 remain
        const summary = await mockSyncOfflineQueue(workspace, [
          'online',  // Entry 1: success
          'online',  // Entry 2: success
          'error',   // Entry 3: error (attempt 1)
          'error',   // Entry 4: error (attempt 1)
          'error',   // Entry 5: error (attempt 1)
        ]);
        
        assertEquals(summary.totalQueued, 5, 'Should process 5 entries');
        assertEquals(summary.synced, 2, 'Should sync 2 entries');
        assert(summary.remaining > 0, 'Should have remaining entries');
        
        await cleanupTempWorkspace(workspace);
      },
    },
    
    {
      name: 'Multiple sync cycles eventually clear queue',
      fn: async () => {
        const workspace = await createTempWorkspace();
        const queue = getOfflineQueue(workspace);
        
        const payload = {
          projectId: 'test-project',
          timestamp: new Date().toISOString(),
          issues: [],
          metadata: {},
        };
        
        await queue.enqueue(payload, 'Error 1');
        await queue.enqueue(payload, 'Error 2');
        
        // First sync: both offline
        let summary = await mockSyncOfflineQueue(workspace, ['offline']);
        assertEquals(summary.synced, 0, 'First sync: 0 synced');
        
        // Second sync: both succeed
        summary = await mockSyncOfflineQueue(workspace, ['online', 'online']);
        assertEquals(summary.synced, 2, 'Second sync: 2 synced');
        assertEquals(summary.remaining, 0, 'Queue should be empty');
        
        await cleanupTempWorkspace(workspace);
      },
    },
  ];

  return await runSuite('Sync Command Verification', tests);
}

// Run if executed directly
if (import.meta.url === `file:///${process.argv[1].replace(/\\/g, '/')}`) {
  verifySyncCommand().then(() => process.exit(0)).catch(() => process.exit(1));
}
