/**
 * ODAVL Brain - Autopilot Adapter
 * Runs ODAVL Autopilot programmatically and returns fix results
 */

import { Logger } from '../utils/logger.js';
import type { AutopilotResult, AutopilotFix, InsightIssue } from '../types.js';
import { execSync } from 'child_process';
import * as fs from 'fs/promises';
import * as path from 'path';
import crypto from 'crypto';

const logger = new Logger('AutopilotAdapter');

/**
 * Run ODAVL Autopilot to fix issues
 */
export async function runAutopilot(
  projectRoot: string,
  issues: InsightIssue[]
): Promise<AutopilotResult> {
  const startTime = Date.now();
  logger.section('ODAVL AUTOPILOT - Fix Cycle Starting');
  logger.info(`Project: ${projectRoot}`);
  logger.info(`Issues to fix: ${issues.length}`);

  const fixes: AutopilotFix[] = [];
  const changedFiles: Set<string> = new Set();
  const errors: string[] = [];

  try {
    // Change to project directory
    const originalCwd = process.cwd();
    process.chdir(projectRoot);

    // Run O-D-A-V-L cycle
    logger.info('Running OBSERVE phase...');
    const observeResult = safeExec('pnpm autopilot observe --json');
    
    if (observeResult.error) {
      errors.push(`OBSERVE failed: ${observeResult.error}`);
    }

    logger.info('Running DECIDE phase...');
    const decideResult = safeExec('pnpm autopilot decide');
    
    if (decideResult.error) {
      errors.push(`DECIDE failed: ${decideResult.error}`);
    }

    logger.info('Running ACT phase...');
    const actResult = safeExec('pnpm autopilot act');
    
    if (actResult.error) {
      errors.push(`ACT failed: ${actResult.error}`);
    } else {
      // Parse ACT results from ledger
      const ledgerPath = path.join(projectRoot, '.odavl/ledger');
      const ledgerFiles = await fs.readdir(ledgerPath);
      const latestLedger = ledgerFiles
        .filter(f => f.startsWith('run-'))
        .sort()
        .reverse()[0];

      if (latestLedger) {
        const ledgerData = JSON.parse(
          await fs.readFile(path.join(ledgerPath, latestLedger), 'utf-8')
        );

        if (ledgerData.edits) {
          for (const edit of ledgerData.edits) {
            fixes.push({
              file: edit.path,
              linesChanged: edit.diffLoc || 0,
              type: edit.type || 'auto-fix',
              description: edit.description || 'Automated fix',
            });
            changedFiles.add(edit.path);
          }
        }
      }
    }

    logger.info('Running VERIFY phase...');
    const verifyResult = safeExec('pnpm autopilot verify');
    
    if (verifyResult.error) {
      errors.push(`VERIFY failed: ${verifyResult.error}`);
    }

    logger.info('Running LEARN phase...');
    const learnResult = safeExec('pnpm autopilot learn');
    
    if (learnResult.error) {
      errors.push(`LEARN failed: ${learnResult.error}`);
    }

    // Restore original directory
    process.chdir(originalCwd);
  } catch (error) {
    logger.error('Autopilot execution failed', error as Error);
    errors.push((error as Error).message);
  }

  // Generate attestation hash
  const attestationHash = generateAttestationHash(fixes);

  // Generate diff summary
  const diffSummary = generateDiffSummary(fixes);

  const duration = Date.now() - startTime;

  const result: AutopilotResult = {
    timestamp: new Date().toISOString(),
    projectRoot,
    totalFixes: fixes.length,
    fixes,
    changedFiles: Array.from(changedFiles),
    diffSummary,
    attestationHash,
    duration,
    errors,
  };

  logger.section('ODAVL AUTOPILOT - Fix Cycle Complete');
  logger.success(`Total fixes: ${fixes.length}`);
  logger.info(`Changed files: ${changedFiles.size}`);
  logger.info(`Duration: ${duration}ms`);
  
  if (errors.length > 0) {
    logger.warn(`Errors encountered: ${errors.length}`);
  }

  return result;
}

/**
 * Safe command execution (never throws)
 */
function safeExec(command: string): { output: string; error?: string } {
  try {
    const output = execSync(command, {
      encoding: 'utf-8',
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    return { output };
  } catch (error: any) {
    return {
      output: error.stdout || '',
      error: error.stderr || error.message,
    };
  }
}

/**
 * Generate attestation hash for fixes
 */
function generateAttestationHash(fixes: AutopilotFix[]): string {
  const data = JSON.stringify(fixes);
  return crypto.createHash('sha256').update(data).digest('hex');
}

/**
 * Generate diff summary
 */
function generateDiffSummary(fixes: AutopilotFix[]): string {
  const totalLines = fixes.reduce((sum, fix) => sum + fix.linesChanged, 0);
  return `${fixes.length} fixes applied, ${totalLines} lines changed`;
}
