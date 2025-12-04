/**
 * Tests for ledger management
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs/promises';
import * as path from 'path';
import {
  createLedger,
  saveLedger,
  loadLedger,
  getLatestLedger,
  addEdit,
  addNote,
  completeLedger,
  failLedger,
  rollbackLedger,
  listLedgers,
  getLedgerStats
} from '../src/utils/ledger';

const TEST_DIR = path.join(process.cwd(), '.test-odavl-ledger');

beforeEach(async () => {
  await fs.mkdir(TEST_DIR, { recursive: true });
});

afterEach(async () => {
  await fs.rm(TEST_DIR, { recursive: true, force: true });
});

describe('createLedger', () => {
  it('should create new ledger with runId', async () => {
    const ledger = await createLedger(undefined, TEST_DIR);

    expect(ledger.runId).toBeDefined();
    expect(ledger.runId).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}$/);
    expect(ledger.startedAt).toBeDefined();
    expect(ledger.status).toBe('in-progress');
    expect(ledger.edits).toEqual([]);
  });

  it('should include recipe name in runId', async () => {
    const ledger = await createLedger('fix-typescript-errors', TEST_DIR);

    expect(ledger.runId).toMatch(/-fix-typescript-errors$/);
  });

  it('should save ledger to disk', async () => {
    const ledger = await createLedger(undefined, TEST_DIR);
    const ledgerPath = path.join(TEST_DIR, '.odavl', 'ledger', `${ledger.runId}.json`);

    const exists = await fs.access(ledgerPath).then(() => true).catch(() => false);
    expect(exists).toBe(true);
  });

  it('should create latest.json', async () => {
    await createLedger(undefined, TEST_DIR);
    const latestPath = path.join(TEST_DIR, '.odavl', 'ledger', 'latest.json');

    const exists = await fs.access(latestPath).then(() => true).catch(() => false);
    expect(exists).toBe(true);
  });
});

describe('loadLedger', () => {
  it('should load existing ledger by runId', async () => {
    const created = await createLedger('test-recipe', TEST_DIR);
    const loaded = await loadLedger(created.runId, TEST_DIR);

    expect(loaded).not.toBeNull();
    expect(loaded?.runId).toBe(created.runId);
    expect(loaded?.status).toBe('in-progress');
  });

  it('should return null for non-existent ledger', async () => {
    const loaded = await loadLedger('non-existent', TEST_DIR);
    expect(loaded).toBeNull();
  });
});

describe('getLatestLedger', () => {
  it('should return most recent ledger', async () => {
    const ledger = await createLedger('test', TEST_DIR);
    const latest = await getLatestLedger(TEST_DIR);

    expect(latest).not.toBeNull();
    expect(latest?.runId).toBe(ledger.runId);
  });

  it('should return null when no ledgers exist', async () => {
    const latest = await getLatestLedger(TEST_DIR);
    expect(latest).toBeNull();
  });
});

describe('addEdit', () => {
  it('should add file edit to ledger', async () => {
    const ledger = await createLedger(undefined, TEST_DIR);

    await addEdit(ledger, {
      path: 'src/index.ts',
      diffLoc: 10,
      operation: 'update'
    }, TEST_DIR);

    expect(ledger.edits).toHaveLength(1);
    expect(ledger.edits[0].path).toBe('src/index.ts');
    expect(ledger.edits[0].diffLoc).toBe(10);
  });

  it('should save ledger after adding edit', async () => {
    const ledger = await createLedger(undefined, TEST_DIR);

    await addEdit(ledger, {
      path: 'src/test.ts',
      diffLoc: 5,
      operation: 'create'
    }, TEST_DIR);

    const loaded = await loadLedger(ledger.runId, TEST_DIR);
    expect(loaded?.edits).toHaveLength(1);
  });
});

describe('addNote', () => {
  it('should add note to ledger', async () => {
    const ledger = await createLedger(undefined, TEST_DIR);

    await addNote(ledger, 'Fixed TypeScript errors', TEST_DIR);

    expect(ledger.notes).toHaveLength(1);
    expect(ledger.notes?.[0]).toBe('Fixed TypeScript errors');
  });

  it('should initialize notes array if not exists', async () => {
    const ledger = await createLedger(undefined, TEST_DIR);
    expect(ledger.notes).toBeUndefined();

    await addNote(ledger, 'Test note', TEST_DIR);
    expect(ledger.notes).toBeDefined();
  });
});

describe('completeLedger', () => {
  it('should mark ledger as completed', async () => {
    const ledger = await createLedger(undefined, TEST_DIR);

    await completeLedger(ledger, { before: 100, after: 50 }, TEST_DIR);

    expect(ledger.status).toBe('completed');
    expect(ledger.completedAt).toBeDefined();
    expect(ledger.metrics).toEqual({
      before: 100,
      after: 50,
      improvement: 50
    });
  });

  it('should complete without metrics', async () => {
    const ledger = await createLedger(undefined, TEST_DIR);

    await completeLedger(ledger, undefined, TEST_DIR);

    expect(ledger.status).toBe('completed');
    expect(ledger.metrics).toBeUndefined();
  });
});

describe('failLedger', () => {
  it('should mark ledger as failed with error', async () => {
    const ledger = await createLedger(undefined, TEST_DIR);

    await failLedger(ledger, 'TypeScript compilation failed', TEST_DIR);

    expect(ledger.status).toBe('failed');
    expect(ledger.completedAt).toBeDefined();
    expect(ledger.errorMessage).toBe('TypeScript compilation failed');
  });
});

describe('rollbackLedger', () => {
  it('should mark ledger as rolled back', async () => {
    const ledger = await createLedger(undefined, TEST_DIR);

    await rollbackLedger(ledger, TEST_DIR);

    expect(ledger.status).toBe('rolled-back');
    expect(ledger.completedAt).toBeDefined();
  });
});

describe('listLedgers', () => {
  it('should return empty array when no ledgers', async () => {
    const ledgers = await listLedgers(TEST_DIR);
    expect(ledgers).toEqual([]);
  });

  it('should list all ledgers', async () => {
    await createLedger('recipe-1', TEST_DIR);
    await createLedger('recipe-2', TEST_DIR);
    await createLedger('recipe-3', TEST_DIR);

    const ledgers = await listLedgers(TEST_DIR);
    expect(ledgers).toHaveLength(3);
  });

  it('should sort ledgers by timestamp (newest first)', async () => {
    const ledger1 = await createLedger('recipe-1', TEST_DIR);
    
    // Wait 100ms to ensure different timestamps
    await new Promise(resolve => setTimeout(resolve, 100));
    
    const ledger2 = await createLedger('recipe-2', TEST_DIR);

    const ledgers = await listLedgers(TEST_DIR);
    expect(ledgers[0].runId).toBe(ledger2.runId);
    expect(ledgers[1].runId).toBe(ledger1.runId);
  });
});

describe('getLedgerStats', () => {
  it('should return zero stats when no ledgers', async () => {
    const stats = await getLedgerStats(TEST_DIR);

    expect(stats.total).toBe(0);
    expect(stats.completed).toBe(0);
    expect(stats.failed).toBe(0);
    expect(stats.rolledBack).toBe(0);
  });

  it('should calculate stats correctly', async () => {
    const ledger1 = await createLedger(undefined, TEST_DIR);
    await addEdit(ledger1, { path: 'test1.ts', diffLoc: 10, operation: 'update' }, TEST_DIR);
    await completeLedger(ledger1, { before: 100, after: 50 }, TEST_DIR);

    const ledger2 = await createLedger(undefined, TEST_DIR);
    await addEdit(ledger2, { path: 'test2.ts', diffLoc: 5, operation: 'update' }, TEST_DIR);
    await failLedger(ledger2, 'Error', TEST_DIR);

    const stats = await getLedgerStats(TEST_DIR);

    expect(stats.total).toBe(2);
    expect(stats.completed).toBe(1);
    expect(stats.failed).toBe(1);
    expect(stats.avgEditsPerRun).toBe(1);
    expect(stats.avgImprovementRate).toBe(50); // 50% improvement
  });
});
