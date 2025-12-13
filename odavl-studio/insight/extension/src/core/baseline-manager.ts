/**
 * Phase 4.1.3 - Baseline Manager
 * 
 * Manages baseline snapshots for delta-first UX.
 * Tracks which issues are NEW vs LEGACY to avoid punishing users
 * for pre-existing technical debt.
 * 
 * **Storage**: `.odavl/insight-baseline.json` (local, never uploaded)
 * **Philosophy**: Never punish users for inherited problems
 */

import * as vscode from 'vscode';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as crypto from 'crypto';
import { DetectorIssue } from '../types/DetectorIssue';

/**
 * Minimal issue identity for baseline tracking
 * Only stores hashable metadata, NO source code
 */
interface BaselineIssue {
  /** File path (workspace-relative) */
  file: string;
  /** Detector ID */
  detector: string;
  /** Line number */
  line: number;
  /** Message signature (normalized) */
  signature: string;
}

/**
 * Baseline snapshot structure
 */
interface BaselineSnapshot {
  /** Snapshot timestamp */
  timestamp: string;
  /** Issue hashes (Set for fast lookup) */
  issues: string[];
}

/**
 * Baseline Manager
 * 
 * Handles baseline storage, loading, and issue classification.
 * 
 * **Key Methods**:
 * - `isNewIssue()`: Check if issue is NEW (not in baseline)
 * - `updateBaseline()`: Save current issues as new baseline
 * - `clearBaseline()`: Reset baseline (treat all as LEGACY)
 */
export class BaselineManager {
  private baselineIssues = new Set<string>();
  private workspaceRoot: string;
  private baselineFilePath: string;
  private isLoaded = false;

  constructor(workspaceRoot: string) {
    this.workspaceRoot = workspaceRoot;
    this.baselineFilePath = path.join(workspaceRoot, '.odavl', 'insight-baseline.json');
  }

  /**
   * Load baseline from disk
   * 
   * **Behavior**:
   * - If file doesn't exist: Empty baseline (all issues are LEGACY on first run)
   * - If file corrupted: Ignore it, empty baseline (graceful degradation)
   * - Never crashes
   */
  async loadBaseline(): Promise<void> {
    try {
      // Ensure .odavl directory exists
      const odavlDir = path.join(this.workspaceRoot, '.odavl');
      await fs.mkdir(odavlDir, { recursive: true });

      // Try to read baseline file
      const content = await fs.readFile(this.baselineFilePath, 'utf-8');
      const snapshot: BaselineSnapshot = JSON.parse(content);

      // Load issue hashes into Set for fast lookup
      this.baselineIssues = new Set(snapshot.issues);
      this.isLoaded = true;

      console.log(`[BaselineManager] Loaded ${this.baselineIssues.size} baseline issues`);
    } catch (error) {
      // File doesn't exist or is corrupted - treat as empty baseline
      // This is intentional: first run establishes baseline
      this.baselineIssues = new Set();
      this.isLoaded = true;

      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
        console.warn('[BaselineManager] Failed to load baseline, treating all as LEGACY:', error);
      }
    }
  }

  /**
   * Check if issue is NEW (not in baseline)
   * 
   * **Matching Criteria**:
   * - Same file path (workspace-relative)
   * - Same detector ID
   * - Same line (or ±2 lines for fuzzy matching)
   * - Same message signature
   * 
   * **Default**: If no baseline loaded, all issues are LEGACY
   * 
   * @param issue Issue to check
   * @returns true if NEW, false if LEGACY
   */
  isNewIssue(issue: DetectorIssue): boolean {
    if (!this.isLoaded) {
      // Baseline not loaded yet - treat all as LEGACY (conservative)
      return false;
    }

    if (this.baselineIssues.size === 0) {
      // Empty baseline (first run) - all issues are LEGACY
      return false;
    }

    // Generate issue hash
    const hash = this.generateIssueHash(issue);

    // Check exact match
    if (this.baselineIssues.has(hash)) {
      return false; // LEGACY
    }

    // Fuzzy match: check ±2 lines (handles code insertions/deletions)
    for (let lineOffset = -2; lineOffset <= 2; lineOffset++) {
      if (lineOffset === 0) continue; // Already checked exact match
      
      const fuzzyHash = this.generateIssueHash({
        ...issue,
        line: issue.line + lineOffset,
      });

      if (this.baselineIssues.has(fuzzyHash)) {
        return false; // LEGACY (fuzzy match)
      }
    }

    return true; // NEW
  }

  /**
   * Update baseline with current issues
   * 
   * **When to Call**: After successful workspace analysis (no detector crashes)
   * 
   * **Behavior**:
   * - Replaces previous baseline completely
   * - Stores minimal issue identity (no source code)
   * - Never uploads to cloud
   * 
   * @param issues Current issues from analysis
   */
  async updateBaseline(issues: DetectorIssue[]): Promise<void> {
    try {
      // Generate hashes for all current issues
      const issueHashes = issues.map(issue => this.generateIssueHash(issue));

      // Create snapshot
      const snapshot: BaselineSnapshot = {
        timestamp: new Date().toISOString(),
        issues: issueHashes,
      };

      // Ensure .odavl directory exists
      const odavlDir = path.join(this.workspaceRoot, '.odavl');
      await fs.mkdir(odavlDir, { recursive: true });

      // Write baseline
      await fs.writeFile(
        this.baselineFilePath,
        JSON.stringify(snapshot, null, 2),
        'utf-8'
      );

      // Update in-memory cache
      this.baselineIssues = new Set(issueHashes);

      console.log(`[BaselineManager] Updated baseline with ${issueHashes.length} issues`);
    } catch (error) {
      // Non-fatal: baseline update failure doesn't crash extension
      console.error('[BaselineManager] Failed to update baseline:', error);
    }
  }

  /**
   * Clear baseline (reset to empty)
   * 
   * **Use Case**: User wants to re-establish baseline from scratch
   */
  async clearBaseline(): Promise<void> {
    try {
      this.baselineIssues.clear();
      
      // Delete baseline file
      await fs.unlink(this.baselineFilePath);
      
      console.log('[BaselineManager] Baseline cleared');
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
        console.error('[BaselineManager] Failed to clear baseline:', error);
      }
    }
  }

  /**
   * Generate issue hash for matching
   * 
   * **Hash Components**:
   * - File path (workspace-relative, normalized)
   * - Detector ID
   * - Line number
   * - Message signature (normalized)
   * 
   * **Normalization**:
   * - Lowercase file paths (case-insensitive matching)
   * - Remove dynamic values from messages (timestamps, numbers)
   * - Consistent path separators
   * 
   * @param issue Issue to hash
   * @returns SHA-256 hash (hex string)
   */
  private generateIssueHash(issue: DetectorIssue): string {
    // Normalize file path (workspace-relative, forward slashes)
    const normalizedFile = this.normalizeFilePath(issue.file);

    // Normalize message (remove dynamic values)
    const normalizedMessage = this.normalizeMessage(issue.message);

    // Create deterministic string
    const identity = `${normalizedFile}:${issue.detector}:${issue.line}:${normalizedMessage}`;

    // Hash for compact storage
    return crypto.createHash('sha256').update(identity).digest('hex');
  }

  /**
   * Normalize file path for consistent matching
   * 
   * @param filePath Absolute or relative file path
   * @returns Workspace-relative path with forward slashes
   */
  private normalizeFilePath(filePath: string): string {
    // Make workspace-relative
    let relativePath = filePath;
    if (path.isAbsolute(filePath)) {
      relativePath = path.relative(this.workspaceRoot, filePath);
    }

    // Normalize separators (use forward slashes)
    relativePath = relativePath.replace(/\\/g, '/');

    // Lowercase for case-insensitive matching (Windows/Mac)
    return relativePath.toLowerCase();
  }

  /**
   * Normalize message for stable matching
   * 
   * Removes dynamic values that change between runs:
   * - Timestamps
   * - File paths with line numbers
   * - Specific numeric values
   * 
   * @param message Original message
   * @returns Normalized message signature
   */
  private normalizeMessage(message: string): string {
    let normalized = message;

    // Remove timestamps (ISO 8601, Unix, etc.)
    normalized = normalized.replace(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/g, 'TIMESTAMP');
    normalized = normalized.replace(/\d{10,13}/g, 'TIMESTAMP'); // Unix timestamps

    // Remove file paths with line numbers (e.g., "file.ts:42")
    normalized = normalized.replace(/[\w.-]+\.ts:\d+/g, 'FILE:LINE');
    normalized = normalized.replace(/[\w.-]+\.js:\d+/g, 'FILE:LINE');

    // Normalize whitespace
    normalized = normalized.trim().replace(/\s+/g, ' ');

    return normalized;
  }

  /**
   * Get baseline statistics (for debugging/testing)
   * 
   * @returns Baseline stats
   */
  getStats(): { issueCount: number; isLoaded: boolean; filePath: string } {
    return {
      issueCount: this.baselineIssues.size,
      isLoaded: this.isLoaded,
      filePath: this.baselineFilePath,
    };
  }
}
