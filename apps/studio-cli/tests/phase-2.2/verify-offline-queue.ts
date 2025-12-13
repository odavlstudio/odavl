/**
 * Phase 2.2 Task 8: Offline Queue Verification Tests
 * 
 * Tests JSONL storage, crash safety, corruption tolerance, and retry limits
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
  readJsonFile,
} from './test-utils.js';
import { getOfflineQueue, type OfflineQueueEntry } from '../../src/utils/offline-queue.js';

export async function verifyOfflineQueue() {
  const tests = [
    {
      name: 'Enqueue creates .odavl directory if missing',
      fn: async () => {
        const workspace = await createTempWorkspace();
        
        // Remove .odavl directory
        await fs.rm(path.join(workspace, '.odavl'), { recursive: true, force: true });
        
        const queue = getOfflineQueue(workspace);
        
        const payload = {
          projectId: 'test-project',
          timestamp: new Date().toISOString(),
          issues: [],
          metadata: {},
        };
        
        await queue.enqueue(payload, 'Test error');
        
        const odavlExists = await fileExists(path.join(workspace, '.odavl'));
        assert(odavlExists, '.odavl directory should be created');
        
        const queueFileExists = await fileExists(path.join(workspace, '.odavl', 'offline-queue.jsonl'));
        assert(queueFileExists, 'Queue file should be created');
        
        await cleanupTempWorkspace(workspace);
      },
    },
    
    {
      name: 'Enqueue appends to JSONL file correctly',
      fn: async () => {
        const workspace = await createTempWorkspace();
        const queue = getOfflineQueue(workspace);
        
        const payload1 = {
          projectId: 'project-1',
          timestamp: new Date().toISOString(),
          issues: [],
          metadata: {},
        };
        
        const payload2 = {
          projectId: 'project-2',
          timestamp: new Date().toISOString(),
          issues: [],
          metadata: {},
        };
        
        await queue.enqueue(payload1, 'Error 1');
        await queue.enqueue(payload2, 'Error 2');
        
        const entries = await queue.readAll();
        
        assertEquals(entries.length, 2, 'Should have 2 entries');
        assertEquals(entries[0].payload.projectId, 'project-1', 'First entry should match');
        assertEquals(entries[1].payload.projectId, 'project-2', 'Second entry should match');
        
        await cleanupTempWorkspace(workspace);
      },
    },
    
    {
      name: 'ReadAll returns empty array for missing file',
      fn: async () => {
        const workspace = await createTempWorkspace();
        const queue = getOfflineQueue(workspace);
        
        const entries = await queue.readAll();
        
        assertEquals(entries.length, 0, 'Should return empty array for missing queue file');
        
        await cleanupTempWorkspace(workspace);
      },
    },
    
    {
      name: 'ReadAll skips malformed JSON lines',
      fn: async () => {
        const workspace = await createTempWorkspace();
        const queue = getOfflineQueue(workspace);
        
        // Create queue file with valid and invalid entries
        const queuePath = path.join(workspace, '.odavl', 'offline-queue.jsonl');
        
        const validEntry = {
          id: 'queue-1',
          timestamp: new Date().toISOString(),
          payload: { projectId: 'test', timestamp: new Date().toISOString(), issues: [], metadata: {} },
          attempts: 0,
          status: 'pending',
        };
        
        const content = [
          JSON.stringify(validEntry),
          'CORRUPTED LINE {invalid json',
          JSON.stringify({ ...validEntry, id: 'queue-2' }),
          '{ incomplete json',
        ].join('\n');
        
        await fs.writeFile(queuePath, content, 'utf-8');
        
        const entries = await queue.readAll();
        
        assertEquals(entries.length, 2, 'Should skip corrupted lines and return 2 valid entries');
        assertEquals(entries[0].id, 'queue-1', 'First valid entry should be present');
        assertEquals(entries[1].id, 'queue-2', 'Second valid entry should be present');
        
        await cleanupTempWorkspace(workspace);
      },
    },
    
    {
      name: 'Remove deletes entry from queue',
      fn: async () => {
        const workspace = await createTempWorkspace();
        const queue = getOfflineQueue(workspace);
        
        const payload1 = {
          projectId: 'project-1',
          timestamp: new Date().toISOString(),
          issues: [],
          metadata: {},
        };
        
        const payload2 = {
          projectId: 'project-2',
          timestamp: new Date().toISOString(),
          issues: [],
          metadata: {},
        };
        
        const id1 = await queue.enqueue(payload1, 'Error 1');
        const id2 = await queue.enqueue(payload2, 'Error 2');
        
        await queue.remove(id1);
        
        const entries = await queue.readAll();
        
        assertEquals(entries.length, 1, 'Should have 1 entry after removal');
        assertEquals(entries[0].id, id2, 'Remaining entry should be the second one');
        
        await cleanupTempWorkspace(workspace);
      },
    },
    
    {
      name: 'Remove deletes file when queue becomes empty',
      fn: async () => {
        const workspace = await createTempWorkspace();
        const queue = getOfflineQueue(workspace);
        
        const payload = {
          projectId: 'test-project',
          timestamp: new Date().toISOString(),
          issues: [],
          metadata: {},
        };
        
        const id = await queue.enqueue(payload, 'Test error');
        
        const queuePath = path.join(workspace, '.odavl', 'offline-queue.jsonl');
        let exists = await fileExists(queuePath);
        assert(exists, 'Queue file should exist after enqueue');
        
        await queue.remove(id);
        
        exists = await fileExists(queuePath);
        assert(!exists, 'Queue file should be deleted when empty');
        
        await cleanupTempWorkspace(workspace);
      },
    },
    
    {
      name: 'Update modifies existing entry',
      fn: async () => {
        const workspace = await createTempWorkspace();
        const queue = getOfflineQueue(workspace);
        
        const payload = {
          projectId: 'test-project',
          timestamp: new Date().toISOString(),
          issues: [],
          metadata: {},
        };
        
        const id = await queue.enqueue(payload, 'Original error');
        
        const entries = await queue.readAll();
        const entry = entries.find(e => e.id === id)!;
        
        entry.attempts = 2;
        entry.lastError = 'Updated error';
        
        await queue.update(entry);
        
        const updatedEntries = await queue.readAll();
        const updatedEntry = updatedEntries.find(e => e.id === id)!;
        
        assertEquals(updatedEntry.attempts, 2, 'Attempts should be updated');
        assertEquals(updatedEntry.lastError, 'Updated error', 'Error message should be updated');
        
        await cleanupTempWorkspace(workspace);
      },
    },
    
    {
      name: 'IncrementAttempts marks as failed after 3 attempts',
      fn: async () => {
        const workspace = await createTempWorkspace();
        const queue = getOfflineQueue(workspace);
        
        const payload = {
          projectId: 'test-project',
          timestamp: new Date().toISOString(),
          issues: [],
          metadata: {},
        };
        
        const id = await queue.enqueue(payload, 'Error 1');
        
        await queue.incrementAttempts(id, 'Error 2');
        await queue.incrementAttempts(id, 'Error 3');
        await queue.incrementAttempts(id, 'Error 4');
        
        const entries = await queue.readAll();
        const entry = entries.find(e => e.id === id)!;
        
        assertEquals(entry.attempts, 3, 'Should have 3 attempts');
        assertEquals(entry.status, 'failed', 'Should be marked as failed after 3 attempts');
        assertEquals(entry.lastError, 'Error 4', 'Should have latest error message');
        
        await cleanupTempWorkspace(workspace);
      },
    },
    
    {
      name: 'Clear removes all entries',
      fn: async () => {
        const workspace = await createTempWorkspace();
        const queue = getOfflineQueue(workspace);
        
        const payload1 = {
          projectId: 'project-1',
          timestamp: new Date().toISOString(),
          issues: [],
          metadata: {},
        };
        
        const payload2 = {
          projectId: 'project-2',
          timestamp: new Date().toISOString(),
          issues: [],
          metadata: {},
        };
        
        await queue.enqueue(payload1, 'Error 1');
        await queue.enqueue(payload2, 'Error 2');
        
        await queue.clear();
        
        const entries = await queue.readAll();
        assertEquals(entries.length, 0, 'Queue should be empty after clear');
        
        const queuePath = path.join(workspace, '.odavl', 'offline-queue.jsonl');
        const exists = await fileExists(queuePath);
        assert(!exists, 'Queue file should not exist after clear');
        
        await cleanupTempWorkspace(workspace);
      },
    },
    
    {
      name: 'Count returns correct pending count',
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
        const id3 = await queue.enqueue(payload, 'Error 3');
        
        let count = await queue.count();
        assertEquals(count, 3, 'Should have 3 pending entries');
        
        // Mark one as failed
        await queue.incrementAttempts(id1, 'Error');
        await queue.incrementAttempts(id1, 'Error');
        await queue.incrementAttempts(id1, 'Error');
        
        count = await queue.count();
        assertEquals(count, 2, 'Should have 2 pending entries (1 failed)');
        
        await cleanupTempWorkspace(workspace);
      },
    },
    
    {
      name: 'HasExceededMaxAttempts returns correct value',
      fn: async () => {
        const workspace = await createTempWorkspace();
        const queue = getOfflineQueue(workspace);
        
        const payload = {
          projectId: 'test-project',
          timestamp: new Date().toISOString(),
          issues: [],
          metadata: {},
        };
        
        const id = await queue.enqueue(payload, 'Error');
        
        let entries = await queue.readAll();
        let entry = entries.find(e => e.id === id)!;
        
        assert(!queue.hasExceededMaxAttempts(entry), 'Should not exceed max attempts at 0');
        
        await queue.incrementAttempts(id, 'Error');
        entries = await queue.readAll();
        entry = entries.find(e => e.id === id)!;
        assert(!queue.hasExceededMaxAttempts(entry), 'Should not exceed max attempts at 1');
        
        await queue.incrementAttempts(id, 'Error');
        await queue.incrementAttempts(id, 'Error');
        entries = await queue.readAll();
        entry = entries.find(e => e.id === id)!;
        assert(queue.hasExceededMaxAttempts(entry), 'Should exceed max attempts at 3');
        
        await cleanupTempWorkspace(workspace);
      },
    },
    
    {
      name: 'Queue survives process restart (persistence)',
      fn: async () => {
        const workspace = await createTempWorkspace();
        
        // First "process" - create queue and add entries
        {
          const queue = getOfflineQueue(workspace);
          
          const payload = {
            projectId: 'persistent-project',
            timestamp: new Date().toISOString(),
            issues: [],
            metadata: {},
          };
          
          await queue.enqueue(payload, 'Error before restart');
        }
        
        // Simulate "process restart" - create new queue instance
        {
          const newQueue = getOfflineQueue(workspace);
          
          const entries = await newQueue.readAll();
          
          assertEquals(entries.length, 1, 'Queue should persist across process restart');
          assertEquals(entries[0].payload.projectId, 'persistent-project', 'Entry data should be intact');
          assertEquals(entries[0].lastError, 'Error before restart', 'Error message should be intact');
        }
        
        await cleanupTempWorkspace(workspace);
      },
    },
    
    {
      name: 'Concurrent enqueue operations (append-only safety)',
      fn: async () => {
        const workspace = await createTempWorkspace();
        const queue = getOfflineQueue(workspace);
        
        const payload = {
          projectId: 'concurrent-test',
          timestamp: new Date().toISOString(),
          issues: [],
          metadata: {},
        };
        
        // Enqueue multiple entries concurrently
        await Promise.all([
          queue.enqueue(payload, 'Error 1'),
          queue.enqueue(payload, 'Error 2'),
          queue.enqueue(payload, 'Error 3'),
        ]);
        
        const entries = await queue.readAll();
        
        assertEquals(entries.length, 3, 'Should have 3 entries from concurrent operations');
        
        await cleanupTempWorkspace(workspace);
      },
    },
  ];

  return await runSuite('Offline Queue Verification', tests);
}

// Run if executed directly
if (import.meta.url === `file:///${process.argv[1].replace(/\\/g, '/')}`) {
  verifyOfflineQueue().then(() => process.exit(0)).catch(() => process.exit(1));
}
