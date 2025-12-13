/**
 * ODAVL Insight - Issue Fingerprinting
 * 
 * Multi-tier fingerprinting strategy for stable issue identification.
 */

import { createHash } from 'node:crypto';
import type { InsightIssue } from '../types.js';

/**
 * Normalizes file path (strips workspace root, uses forward slashes)
 */
export function normalizeFilePath(file: string): string {
  // Convert backslashes to forward slashes
  let normalized = file.replace(/\\/g, '/');

  // Remove common workspace prefixes
  normalized = normalized.replace(/^\.\//, '');
  normalized = normalized.replace(/^\//, '');

  return normalized;
}

/**
 * Generates SHA-256 hash
 */
function sha256(input: string): string {
  return createHash('sha256').update(input, 'utf8').digest('hex');
}

/**
 * Tier 1: Content-based fingerprint (most stable)
 * Uses: ruleId + detector + severity + code snippet hash (if available)
 */
export function generateContentFingerprint(issue: InsightIssue, codeSnippet?: string): string {
  const components = [
    issue.ruleId || '',
    issue.detector,
    issue.severity,
    codeSnippet || '',
  ];

  const input = components.join(':');
  return `sha256:${sha256(input)}`;
}

/**
 * Tier 2: Location-based fingerprint (fallback if no snippet)
 * Uses: file + line + detector + ruleId
 */
export function generateLocationFingerprint(issue: InsightIssue): string {
  const normalized = normalizeFilePath(issue.file);
  const input = `${normalized}:${issue.line}:${issue.detector}:${issue.ruleId || ''}`;
  return `loc:${sha256(input).slice(0, 16)}`;
}

/**
 * Tier 3: Message-based fingerprint (last resort)
 * Uses: file + line + message
 * Compatible with existing HistoricalComparisonEngine approach
 */
export function generateMessageFingerprint(issue: InsightIssue): string {
  const normalized = normalizeFilePath(issue.file);
  const input = `${normalized}:${issue.line}:${issue.message}`;
  return `msg:${sha256(input).slice(0, 16)}`;
}

/**
 * Main fingerprint generation (uses best available strategy)
 */
export function generateFingerprint(issue: InsightIssue, codeSnippet?: string): string {
  // Tier 1: Content-based (if we have code snippet and ruleId)
  if (codeSnippet && issue.ruleId) {
    return generateContentFingerprint(issue, codeSnippet);
  }

  // Tier 2: Location-based (if we have ruleId)
  if (issue.ruleId) {
    return generateLocationFingerprint(issue);
  }

  // Tier 3: Message-based (fallback)
  return generateMessageFingerprint(issue);
}

/**
 * Generates all possible fingerprints for matching
 * Returns array in priority order: [content, location, message]
 */
export function generateAllFingerprints(issue: InsightIssue, codeSnippet?: string): string[] {
  const fingerprints: string[] = [];

  // Try content-based
  if (codeSnippet && issue.ruleId) {
    fingerprints.push(generateContentFingerprint(issue, codeSnippet));
  }

  // Try location-based
  if (issue.ruleId) {
    fingerprints.push(generateLocationFingerprint(issue));
  }

  // Always include message-based as fallback
  fingerprints.push(generateMessageFingerprint(issue));

  return fingerprints;
}
