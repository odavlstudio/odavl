import * as fs from 'fs/promises';
import * as path from 'path';

/**
 * Base Inspector Interface
 * Provides the foundation for all product inspectors
 */

export interface InspectionIssue {
  /** Unique identifier for the issue */
  id: string;
  
  /** Severity level of the issue */
  severity: 'critical' | 'high' | 'medium' | 'low';
  
  /** Category of the issue */
  category: 'build' | 'config' | 'activation' | 'ui' | 'metadata';
  
  /** Human-readable message describing the issue */
  message: string;
  
  /** File path where the issue was found (optional) */
  file?: string;
  
  /** Line number where the issue occurs (optional) */
  line?: number;
  
  /** Whether this issue can be automatically fixed */
  autoFixable: boolean;
  
  /** Suggested fix description (for auto-fixable issues) */
  fix?: string;
  
  /** Impact description explaining why this matters */
  impact: string;
}

export interface InspectionReport {
  /** Unique identifier for the product */
  productId: string;
  
  /** Display name of the product */
  productName: string;
  
  /** Type of product being inspected */
  productType: 'vscode-extension' | 'nextjs-app' | 'nodejs-server' | 'cli-app' | 'npm-package' | 'cloud-function' | 'ide-extension';
  
  /** ISO timestamp of when inspection occurred */
  timestamp: string;
  
  /** Readiness score from 0-100 */
  readinessScore: number;
  
  /** Overall status of the product */
  status: 'ready' | 'blocked' | 'unstable' | 'unknown';
  
  /** List of all issues found */
  issues: InspectionIssue[];
  
  /** Additional metadata specific to the product type */
  metadata: Record<string, unknown>;
}

/**
 * Base abstract class that all inspectors must extend
 */
export abstract class BaseInspector {
  /**
   * Main inspection method - must be implemented by subclasses
   * @param productPath Absolute path to the product directory
   * @returns Complete inspection report
   */
  abstract inspect(productPath: string): Promise<InspectionReport>;
  
  /**
   * Calculate readiness score based on issues found
   * @param issues List of issues found during inspection
   * @returns Score from 0-100
   */
  protected calculateReadiness(issues: InspectionIssue[]): number {
    let score = 100;
    
    for (const issue of issues) {
      if (issue.severity === 'critical') score -= 25;
      else if (issue.severity === 'high') score -= 10;
      else if (issue.severity === 'medium') score -= 5;
      else if (issue.severity === 'low') score -= 2;
    }
    
    return Math.max(0, score);
  }
  
  /**
   * Determine overall status based on readiness score
   * @param score Readiness score from 0-100
   * @returns Status classification
   */
  protected determineStatus(score: number): InspectionReport['status'] {
    if (score >= 90) return 'ready';
    if (score >= 60) return 'unstable';
    return 'blocked';
  }
  
  /**
   * Helper to check if a file exists
   * @param filePath Path to check
   * @returns true if file exists
   */
  protected async fileExists(filePath: string): Promise<boolean> {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }
  
  /**
   * Helper to read JSON file safely
   * @param filePath Path to JSON file
   * @returns Parsed JSON or null if error
   */
  protected async readJsonFile(filePath: string): Promise<unknown> {
    try {
      const content = await fs.readFile(filePath, 'utf8');
      return JSON.parse(content);
    } catch (error) {
      throw new Error(`Failed to read JSON file ${filePath}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}
