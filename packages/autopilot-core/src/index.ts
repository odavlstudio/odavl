/**
 * ODAVL Autopilot Core - Main Entry Point
 * Wave 6 - Deterministic code fix engine
 */

import { analyzeWorkspace, type InsightAnalysisResult } from '@odavl/insight-sdk';
import { FIX_RULES, findMatchingRule, EXCLUDED_SEVERITIES, MAX_FIXES_PER_RUN } from './fix-engine';
import { PatchManager } from './patch-manager';
import type { FixPatch, AutopilotSummary } from './types';
import * as fs from 'node:fs/promises';

export { FixPatch, AutopilotSummary, FixRule, BackupMetadata } from './types';
export { FIX_RULES, EXCLUDED_SEVERITIES, MAX_FIXES_PER_RUN } from './fix-engine';
export { PatchManager, BACKUP_DIR, AUDIT_LOG } from './patch-manager';

/**
 * Generate fix patches from Insight analysis
 */
export async function generateFixes(
  analysis: InsightAnalysisResult
): Promise<FixPatch[]> {
  const patches: FixPatch[] = [];
  
  // Filter out critical issues and excluded severities
  const fixableIssues = analysis.issues.filter(
    issue => !EXCLUDED_SEVERITIES.includes(issue.severity)
  );

  for (const issue of fixableIssues) {
    const rule = findMatchingRule(issue);
    if (!rule) continue;

    try {
      const fileContent = await fs.readFile(issue.file, 'utf-8');
      const patch = rule.transform(issue, fileContent);
      
      if (patch) {
        patches.push(patch);
      }
    } catch (error) {
      // Skip issues with file read errors
      continue;
    }
  }

  // Enforce max fixes limit
  return patches.slice(0, MAX_FIXES_PER_RUN);
}

/**
 * Apply fixes to workspace with backup and rollback
 */
export async function applyFixesToWorkspace(
  fixes: FixPatch[],
  workspaceRoot: string
): Promise<void> {
  const manager = new PatchManager(workspaceRoot);

  // Validate workspace boundaries
  for (const fix of fixes) {
    if (!manager.validateWorkspaceBoundary(fix.file)) {
      throw new Error(`File outside workspace boundary: ${fix.file}`);
    }
  }

  // Create backup before modifications
  const backupPath = await manager.createBackup(fixes);

  try {
    // Apply patches atomically
    await manager.applyPatches(fixes);
    
    // Log success
    await manager.logAudit(fixes, backupPath, true);
  } catch (error) {
    // Rollback on failure
    await manager.rollback(backupPath);
    await manager.logAudit(fixes, backupPath, false);
    throw error;
  }
}

/**
 * Summarize fix results
 */
export function summarizeFixes(
  fixes: FixPatch[],
  backupPath: string = ''
): AutopilotSummary {
  const severityCounts = {
    critical: 0,
    high: 0,
    medium: 0,
    low: 0
  };

  // Note: Severity not on FixPatch, but we can infer from detector
  // For now, assume medium severity for all fixes
  fixes.forEach(() => {
    severityCounts.medium++;
  });

  return {
    totalFixes: fixes.length,
    critical: severityCounts.critical,
    high: severityCounts.high,
    medium: severityCounts.medium,
    low: severityCounts.low,
    filesModified: new Set(fixes.map(f => f.file)).size,
    backupPath
  };
}
