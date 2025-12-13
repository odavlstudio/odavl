/**
 * ODAVL Insight - Issue Matching and Comparison
 * 
 * Matches current issues against baseline with fuzzy logic.
 */

import type { InsightIssue } from '../types.js';
import type { Baseline, BaselineIssue } from './baseline.js';
import { generateFingerprint, normalizeFilePath } from './fingerprint.js';

const FUZZY_LINE_TOLERANCE = 3; // ±3 lines

/**
 * Comparison result
 */
export interface ComparisonResult {
  baseline: {
    name: string;
    timestamp: string;
    commit?: string;
    totalIssues: number;
  };
  current: {
    timestamp: string;
    totalIssues: number;
  };
  newIssues: InsightIssue[];
  resolvedIssues: BaselineIssue[];
  unchangedIssues: InsightIssue[];
  summary: {
    new: number;
    resolved: number;
    unchanged: number;
    total: number;
  };
}

/**
 * Index for fast lookup: Map<"file:ruleId", BaselineIssue[]>
 */
type BaselineIndex = Map<string, BaselineIssue[]>;

/**
 * Creates index for fast baseline lookups
 */
function createBaselineIndex(baseline: Baseline): BaselineIndex {
  const index = new Map<string, BaselineIssue[]>();

  for (const issue of baseline.issues) {
    const key = `${normalizeFilePath(issue.file)}:${issue.ruleId || ''}`;
    if (!index.has(key)) {
      index.set(key, []);
    }
    index.get(key)!.push(issue);
  }

  return index;
}

/**
 * Checks if two issues are a fuzzy match (same file, rule, within line tolerance)
 */
function isFuzzyMatch(current: InsightIssue, baseline: BaselineIssue): boolean {
  const currentFile = normalizeFilePath(current.file);
  const baselineFile = normalizeFilePath(baseline.file);

  return (
    currentFile === baselineFile &&
    current.ruleId === baseline.ruleId &&
    current.detector === baseline.detector &&
    Math.abs(current.line - baseline.line) <= FUZZY_LINE_TOLERANCE
  );
}

/**
 * Finds matching baseline issue for a current issue
 */
function findMatch(
  current: InsightIssue,
  index: BaselineIndex
): BaselineIssue | null {
  // 1. Exact fingerprint match (best case)
  const fingerprint = generateFingerprint(current);
  
  // Search all baseline issues for exact fingerprint match
  for (const issues of index.values()) {
    const exactMatch = issues.find((b) => b.fingerprint === fingerprint);
    if (exactMatch) {
      return exactMatch;
    }
  }

  // 2. Fuzzy match (±3 lines, same file, same rule)
  const key = `${normalizeFilePath(current.file)}:${current.ruleId || ''}`;
  const candidates = index.get(key) || [];

  const fuzzyMatch = candidates.find((b) => isFuzzyMatch(current, b));
  if (fuzzyMatch) {
    return fuzzyMatch;
  }

  // 3. No match - new issue
  return null;
}

/**
 * Compares current issues against baseline
 */
export function compareWithBaseline(
  currentIssues: InsightIssue[],
  baseline: Baseline,
  baselineName: string
): ComparisonResult {
  const index = createBaselineIndex(baseline);
  const matchedBaseline = new Set<BaselineIssue>();

  const newIssues: InsightIssue[] = [];
  const unchangedIssues: InsightIssue[] = [];

  // Categorize current issues
  for (const current of currentIssues) {
    const match = findMatch(current, index);

    if (match) {
      matchedBaseline.add(match);
      unchangedIssues.push(current);
    } else {
      newIssues.push(current);
    }
  }

  // Find resolved issues (in baseline but not matched)
  const resolvedIssues: BaselineIssue[] = baseline.issues.filter(
    (b) => !matchedBaseline.has(b)
  );

  return {
    baseline: {
      name: baselineName,
      timestamp: baseline.metadata.createdAt,
      commit: baseline.metadata.gitCommit,
      totalIssues: baseline.issues.length,
    },
    current: {
      timestamp: new Date().toISOString(),
      totalIssues: currentIssues.length,
    },
    newIssues,
    resolvedIssues,
    unchangedIssues,
    summary: {
      new: newIssues.length,
      resolved: resolvedIssues.length,
      unchanged: unchangedIssues.length,
      total: currentIssues.length,
    },
  };
}

/**
 * Counts issues by severity
 */
export function countBySeverity(issues: InsightIssue[]): Record<string, number> {
  const counts: Record<string, number> = {
    critical: 0,
    high: 0,
    medium: 0,
    low: 0,
    info: 0,
  };

  for (const issue of issues) {
    counts[issue.severity] = (counts[issue.severity] || 0) + 1;
  }

  return counts;
}
