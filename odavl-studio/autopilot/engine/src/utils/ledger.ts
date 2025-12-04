/**
 * Ledger Management Utilities
 * Handles creation and management of .odavl/ledger/ files
 * Each run creates a ledger with edits, timestamps, and outcomes
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import { generateRunId } from './file-naming.js';

export interface FileEdit {
  path: string;
  diffLoc: number; // Lines of code changed
  operation: 'create' | 'update' | 'delete';
  beforeHash?: string;
  afterHash?: string;
}

export interface LedgerEntry {
  runId: string;
  startedAt: string;
  completedAt?: string;
  recipe?: {
    id: string;
    name: string;
    trust: number;
  };
  metrics?: {
    before: number;
    after: number;
    improvement: number;
  };
  edits: FileEdit[];
  notes?: string[];
  status: 'in-progress' | 'completed' | 'failed' | 'rolled-back';
  errorMessage?: string;
}

/**
 * Get ledger directory path
 */
function getLedgerDir(targetDir: string = process.cwd()): string {
  return path.join(targetDir, '.odavl', 'ledger');
}

/**
 * Ensure ledger directory exists
 */
async function ensureLedgerDir(targetDir?: string): Promise<void> {
  const ledgerDir = getLedgerDir(targetDir);
  await fs.mkdir(ledgerDir, { recursive: true });
}

/**
 * Create a new ledger entry for a run
 * @param recipeName - Optional recipe name to include in filename
 * @returns Ledger entry with runId
 */
export async function createLedger(
  recipeName?: string,
  targetDir?: string
): Promise<LedgerEntry> {
  await ensureLedgerDir(targetDir);

  const runId = generateRunId(recipeName);
  const ledger: LedgerEntry = {
    runId,
    startedAt: new Date().toISOString(),
    edits: [],
    status: 'in-progress'
  };

  await saveLedger(ledger, targetDir);
  return ledger;
}

/**
 * Save ledger to disk
 */
export async function saveLedger(
  ledger: LedgerEntry,
  targetDir?: string
): Promise<string> {
  await ensureLedgerDir(targetDir);

  const ledgerDir = getLedgerDir(targetDir);
  const filename = `${ledger.runId}.json`;
  const filepath = path.join(ledgerDir, filename);

  await fs.writeFile(filepath, JSON.stringify(ledger, null, 2), 'utf8');

  // Update latest.json symlink
  await fs.writeFile(
    path.join(ledgerDir, 'latest.json'),
    JSON.stringify(ledger, null, 2),
    'utf8'
  );

  return filepath;
}

/**
 * Load ledger by runId
 */
export async function loadLedger(
  runId: string,
  targetDir?: string
): Promise<LedgerEntry | null> {
  const ledgerDir = getLedgerDir(targetDir);
  const filepath = path.join(ledgerDir, `${runId}.json`);

  try {
    const content = await fs.readFile(filepath, 'utf8');
    return JSON.parse(content) as LedgerEntry;
  } catch {
    return null;
  }
}

/**
 * Get latest ledger
 */
export async function getLatestLedger(
  targetDir?: string
): Promise<LedgerEntry | null> {
  const ledgerDir = getLedgerDir(targetDir);
  const latestPath = path.join(ledgerDir, 'latest.json');

  try {
    const content = await fs.readFile(latestPath, 'utf8');
    return JSON.parse(content) as LedgerEntry;
  } catch {
    return null;
  }
}

/**
 * Add file edit to ledger
 */
export async function addEdit(
  ledger: LedgerEntry,
  edit: FileEdit,
  targetDir?: string
): Promise<void> {
  ledger.edits.push(edit);
  await saveLedger(ledger, targetDir);
}

/**
 * Add note to ledger
 */
export async function addNote(
  ledger: LedgerEntry,
  note: string,
  targetDir?: string
): Promise<void> {
  if (!ledger.notes) {
    ledger.notes = [];
  }
  ledger.notes.push(note);
  await saveLedger(ledger, targetDir);
}

/**
 * Mark ledger as completed with success metrics
 */
export async function completeLedger(
  ledger: LedgerEntry,
  metrics?: { before: number; after: number },
  targetDir?: string
): Promise<void> {
  ledger.completedAt = new Date().toISOString();
  ledger.status = 'completed';

  if (metrics) {
    ledger.metrics = {
      before: metrics.before,
      after: metrics.after,
      improvement: metrics.before - metrics.after
    };
  }

  await saveLedger(ledger, targetDir);
}

/**
 * Mark ledger as failed with error message
 */
export async function failLedger(
  ledger: LedgerEntry,
  errorMessage: string,
  targetDir?: string
): Promise<void> {
  ledger.completedAt = new Date().toISOString();
  ledger.status = 'failed';
  ledger.errorMessage = errorMessage;

  await saveLedger(ledger, targetDir);
}

/**
 * Mark ledger as rolled back
 */
export async function rollbackLedger(
  ledger: LedgerEntry,
  targetDir?: string
): Promise<void> {
  ledger.completedAt = new Date().toISOString();
  ledger.status = 'rolled-back';

  await saveLedger(ledger, targetDir);
}

/**
 * List all ledgers, sorted by timestamp (newest first)
 */
export async function listLedgers(
  targetDir?: string
): Promise<LedgerEntry[]> {
  const ledgerDir = getLedgerDir(targetDir);

  try {
    const files = await fs.readdir(ledgerDir);
    const jsonFiles = files.filter(f => f.endsWith('.json') && f !== 'latest.json');

    const ledgers = await Promise.all(
      jsonFiles.map(async (file) => {
        const content = await fs.readFile(path.join(ledgerDir, file), 'utf8');
        return JSON.parse(content) as LedgerEntry;
      })
    );

    // Sort by startedAt (newest first)
    return ledgers.sort((a, b) => 
      new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime()
    );
  } catch {
    return [];
  }
}

/**
 * Get ledger statistics
 */
export async function getLedgerStats(
  targetDir?: string
): Promise<{
  total: number;
  completed: number;
  failed: number;
  rolledBack: number;
  avgEditsPerRun: number;
  avgImprovementRate: number;
}> {
  const ledgers = await listLedgers(targetDir);

  const stats = {
    total: ledgers.length,
    completed: ledgers.filter(l => l.status === 'completed').length,
    failed: ledgers.filter(l => l.status === 'failed').length,
    rolledBack: ledgers.filter(l => l.status === 'rolled-back').length,
    avgEditsPerRun: 0,
    avgImprovementRate: 0
  };

  if (stats.total > 0) {
    stats.avgEditsPerRun = ledgers.reduce((sum, l) => sum + l.edits.length, 0) / stats.total;

    const improvementRates = ledgers
      .filter(l => l.metrics && l.metrics.before > 0)
      .map(l => ((l.metrics!.improvement / l.metrics!.before) * 100));

    stats.avgImprovementRate = improvementRates.length > 0
      ? improvementRates.reduce((sum, rate) => sum + rate, 0) / improvementRates.length
      : 0;
  }

  return stats;
}

export default {
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
};
