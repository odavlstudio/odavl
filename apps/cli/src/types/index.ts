/**
 * @fileoverview Centralized type definitions for ODAVL CLI
 * 
 * This module contains all TypeScript interfaces and types used across the ODAVL CLI
 * components. Centralizing types here ensures consistency and reduces duplication
 * across the modular architecture.
 * 
 * @author ODAVL Team
 * @version 1.0.0
 */

/**
 * Metrics collected during the observe phase
 * 
 * @interface Metrics
 * @description Represents quality metrics gathered from the codebase including
 * ESLint warnings and TypeScript errors with delta calculations
 */
export interface Metrics {
  /** Timestamp when metrics were collected */
  timestamp: number;
  /** Number of ESLint warnings found */
  eslintWarnings: number;
  /** Number of TypeScript errors found */
  typeErrors: number;
  /** Change in ESLint warnings from previous run */
  deltaEslintWarnings?: number;
  /** Change in TypeScript errors from previous run */
  deltaTypeErrors?: number;
}

/**
 * Comprehensive report of a complete ODAVL run
 * 
 * @interface RunReport
 * @description Contains all data from a complete ODAVL cycle including
 * metrics, decisions, actions taken, and verification results
 */
export interface RunReport {
  /** Unique identifier for this run */
  runId: string;
  /** Timestamp when the run started */
  timestamp: number;
  /** Phase where the run is currently at */
  phase: 'observe' | 'decide' | 'act' | 'verify' | 'learn' | 'complete';
  /** Metrics collected during observe phase */
  metrics: Metrics;
  /** Decision made during decide phase */
  decision: string;
  /** Actions taken during act phase */
  actions: string[];
  /** Verification results from verify phase */
  verification: {
    passed: boolean;
    errors: string[];
  };
  /** Learning updates from learn phase */
  learning: {
    trustUpdated: boolean;
    recipesAffected: string[];
  };
}

/**
 * Configuration for improvement recipes
 * 
 * @interface Recipe
 * @description Defines an improvement recipe with its command, trust score,
 * and metadata for the ODAVL decision-making system
 */
export interface Recipe {
  /** Unique identifier for the recipe */
  id: string;
  /** Human-readable name for the recipe */
  name: string;
  /** Command to execute for this recipe */
  command: string;
  /** Trust score (0-1) based on historical success */
  trustScore: number;
  /** Number of times this recipe has been used */
  usageCount: number;
  /** Number of times this recipe succeeded */
  successCount: number;
  /** Conditions under which this recipe should be applied */
  conditions: {
    eslintWarnings?: { min?: number; max?: number };
    typeErrors?: { min?: number; max?: number };
  };
}

/**
 * Trust record for learning system
 * 
 * @interface TrustRecord
 * @description Tracks the success/failure history of recipes for
 * machine learning-driven decision making
 */
export interface TrustRecord {
  /** Recipe identifier */
  recipeId: string;
  /** Timestamp of the run */
  timestamp: number;
  /** Whether the recipe succeeded */
  success: boolean;
  /** Metrics before applying the recipe */
  metricsBefore: Metrics;
  /** Metrics after applying the recipe */
  metricsAfter: Metrics;
  /** Any error messages if the recipe failed */
  errorMessage?: string;
}

/**
 * Quality gates configuration
 * 
 * @interface GatesConfig
 * @description Defines the quality thresholds and limits that must be
 * maintained for safe autonomous operation
 */
export interface GatesConfig {
  /** Maximum allowed change in TypeScript errors (usually 0) */
  deltaTypeErrorsMax: number;
  /** Maximum allowed change in ESLint warnings */
  deltaEslintWarningsMax: number;
  /** Maximum number of files that can be modified */
  maxFilesTouched: number;
  /** Maximum lines of code that can be changed */
  maxLinesChanged: number;
  /** Paths that are protected from modification */
  protectedPaths: string[];
}

/**
 * Policy configuration for autonomous operation
 * 
 * @interface PolicyConfig
 * @description Defines the operational constraints and limits for
 * safe autonomous code modification
 */
export interface PolicyConfig {
  /** Maximum number of files that can be touched in one run */
  maxFilesTouched: number;
  /** Maximum lines of code that can be changed in one run */
  maxLinesChanged: number;
  /** Paths that cannot be modified autonomously */
  forbiddenPaths: string[];
  /** File patterns that require human approval */
  requireApproval: string[];
}

/**
 * Command execution result
 * 
 * @interface CommandResult
 * @description Result of executing a shell command including output,
 * errors, and exit status
 */
export interface CommandResult {
  /** Standard output from the command */
  stdout: string;
  /** Standard error from the command */
  stderr: string;
  /** Exit code (0 for success) */
  exitCode: number;
  /** Whether the command was successful */
  success: boolean;
}

/**
 * Dashboard data structure
 * 
 * @interface DashboardData
 * @description Data structure used for CLI dashboard display including
 * current metrics, trends, and system status
 */
export interface DashboardData {
  /** Current metrics */
  currentMetrics: Metrics;
  /** Recent run history */
  recentRuns: RunReport[];
  /** Active recipes with trust scores */
  recipes: Recipe[];
  /** System status */
  status: {
    lastRunTime: number;
    totalRuns: number;
    successRate: number;
  };
}