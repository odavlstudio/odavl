/**
 * @fileoverview Churn Predictor - Predict unstable code based on change patterns
 * @module @odavl-studio/insight-core/ai/churn-predictor
 * 
 * **Purpose**: Identify code stability risks through change pattern analysis
 * 
 * **Features**:
 * - Change pattern analysis (frequency, recency, author diversity)
 * - Churn metrics calculation (file/line/author churn rates)
 * - Stability scoring (predict future bug risk based on churn)
 * - Historical analysis (Git history mining, commit patterns)
 * - Refactoring recommendations (high-churn stabilization)
 * - Trend forecasting (predict future churn, stability trajectory)
 * 
 * **Algorithm**:
 * 1. Mine Git history for change patterns
 * 2. Calculate churn metrics (frequency, recency, diversity)
 * 3. Compute stability score (inverse correlation with churn)
 * 4. Identify hotspots (high churn + low stability)
 * 5. Generate refactoring recommendations
 * 6. Forecast future stability trends
 * 
 * **Architecture**:
 * ```
 * ChurnPredictor
 *   ├── analyzeChurn(filePath) → ChurnAnalysis
 *   ├── predictStability(filePath) → StabilityPrediction
 *   ├── identifyUnstableCode() → UnstableFile[]
 *   ├── recommendRefactorings(filePath) → RefactoringRecommendation[]
 *   ├── forecastTrend(filePath) → ChurnTrend
 *   └── private methods (Git mining, metric calculation)
 * ```
 * 
 * **Integration Points**:
 * - Used by: Insight dashboard, Guardian pre-deploy checks
 * - Integrates with: Git history, Defect Predictor, Hotspot Analyzer
 * - Exports: ChurnMetrics, StabilityScore, RefactoringPlan
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import { execSync } from 'child_process';

// ============================================================================
// Type Definitions
// ============================================================================

/**
 * Churn metric categories
 */
export enum ChurnMetricType {
  FILE_CHURN = 'FILE_CHURN', // File-level change frequency
  LINE_CHURN = 'LINE_CHURN', // Line-level change frequency
  AUTHOR_CHURN = 'AUTHOR_CHURN', // Author diversity
  TEMPORAL_CHURN = 'TEMPORAL_CHURN', // Time-based patterns
  STRUCTURAL_CHURN = 'STRUCTURAL_CHURN', // Architectural change impact
}

/**
 * Stability risk levels
 */
export type StabilityRisk = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

/**
 * Refactoring action categories
 */
export enum RefactoringCategory {
  STABILIZE = 'STABILIZE', // Reduce churn via better design
  SPLIT = 'SPLIT', // Break up high-churn files
  CLARIFY_OWNERSHIP = 'CLARIFY_OWNERSHIP', // Reduce author churn
  DOCUMENT = 'DOCUMENT', // Reduce confusion-driven churn
  TEST = 'TEST', // Reduce bug-fix churn
}

/**
 * Change pattern classification
 */
export enum ChangePattern {
  HOTSPOT = 'HOTSPOT', // Frequent, recent changes
  LEGACY = 'LEGACY', // Old file, infrequent changes
  STABLE = 'STABLE', // Low churn, mature code
  VOLATILE = 'VOLATILE', // High churn, unpredictable
  ABANDONED = 'ABANDONED', // No recent changes
}

/**
 * Churn metrics for a file
 */
export interface ChurnMetrics {
  /** File path */
  filePath: string;

  /** File-level churn */
  fileChurn: {
    /** Total commits affecting this file */
    totalCommits: number;
    /** Commits per month */
    commitsPerMonth: number;
    /** Days since last change */
    daysSinceLastChange: number;
    /** Unique authors */
    uniqueAuthors: number;
  };

  /** Line-level churn */
  lineChurn: {
    /** Total lines added */
    linesAdded: number;
    /** Total lines deleted */
    linesDeleted: number;
    /** Total lines modified */
    linesModified: number;
    /** Lines changed per month */
    linesPerMonth: number;
    /** Churn rate (changed / total LOC) */
    churnRate: number; // 0-∞, >1.0 indicates high churn
  };

  /** Author churn */
  authorChurn: {
    /** Number of unique authors */
    authorCount: number;
    /** Primary author (most commits) */
    primaryAuthor: string;
    /** Primary author commit share (0-1) */
    primaryAuthorShare: number;
    /** Author diversity (Shannon entropy) */
    authorDiversity: number; // 0-1, 1=max diversity
  };

  /** Temporal patterns */
  temporal: {
    /** File age (days since creation) */
    ageInDays: number;
    /** Modification frequency (changes per week) */
    modificationFrequency: number;
    /** Peak activity periods (hour of day) */
    peakActivityHours: number[];
    /** Recent activity trend (increasing/decreasing) */
    activityTrend: 'INCREASING' | 'STABLE' | 'DECREASING';
  };

  /** Structural changes */
  structural: {
    /** Merge conflict count */
    mergeConflicts: number;
    /** Average review turnaround (days) */
    avgReviewTime: number;
    /** Revert count */
    revertCount: number;
    /** Branch count (active branches touching this file) */
    branchCount: number;
  };

  /** Change pattern classification */
  pattern: ChangePattern;
}

/**
 * Stability prediction result
 */
export interface StabilityPrediction {
  /** File path */
  filePath: string;

  /** Stability score (0-1, 1=most stable) */
  stabilityScore: number;

  /** Risk level */
  risk: StabilityRisk;

  /** Confidence in prediction (0-1) */
  confidence: number;

  /** Contributing factors */
  contributingFactors: Array<{
    /** Factor name */
    factor: string;
    /** Factor type */
    type: ChurnMetricType;
    /** Factor value */
    value: number;
    /** Impact on stability (0-1) */
    impact: number;
    /** Description */
    description: string;
  }>;

  /** Predicted future state */
  forecast: {
    /** Expected stability in 30 days */
    in30Days: number;
    /** Expected stability in 90 days */
    in90Days: number;
    /** Trend direction */
    trend: 'IMPROVING' | 'STABLE' | 'DEGRADING';
  };

  /** Historical context */
  history: {
    /** Past stability scores (last 6 months) */
    pastScores: Array<{ date: Date; score: number }>;
    /** Similar files */
    similarFiles: string[];
    /** Average time to stabilize (days) */
    avgTimeToStabilize: number;
  };

  /** Recommendations */
  recommendations: Array<{
    /** Action to take */
    action: string;
    /** Priority (1-10) */
    priority: number;
    /** Expected stability improvement (0-1) */
    expectedImprovement: number;
  }>;
}

/**
 * Unstable file identification
 */
export interface UnstableFile {
  /** File path */
  filePath: string;

  /** Churn metrics */
  metrics: ChurnMetrics;

  /** Stability score */
  stabilityScore: number;

  /** Risk level */
  risk: StabilityRisk;

  /** Instability indicators */
  indicators: Array<{
    /** Indicator type */
    type: ChurnMetricType;
    /** Severity (0-1) */
    severity: number;
    /** Description */
    description: string;
  }>;

  /** Priority ranking (1=highest) */
  priority: number;
}

/**
 * Refactoring recommendation
 */
export interface RefactoringRecommendation {
  /** File path */
  filePath: string;

  /** Refactoring category */
  category: RefactoringCategory;

  /** Specific action */
  action: string;

  /** Rationale */
  rationale: string;

  /** Expected benefits */
  benefits: {
    /** Stability improvement (0-1) */
    stabilityImprovement: number;
    /** Churn reduction (%) */
    churnReduction: number;
    /** Defect reduction (%) */
    defectReduction: number;
  };

  /** Effort estimate */
  effort: {
    /** Estimated hours */
    hours: number;
    /** Complexity (LOW/MEDIUM/HIGH) */
    complexity: 'LOW' | 'MEDIUM' | 'HIGH';
  };

  /** Risk of refactoring */
  risk: {
    /** Risk level */
    level: 'LOW' | 'MEDIUM' | 'HIGH';
    /** Risk description */
    description: string;
  };

  /** Priority (1-10) */
  priority: number;

  /** Actionable steps */
  steps: string[];
}

/**
 * Churn trend forecast
 */
export interface ChurnTrend {
  /** File path */
  filePath: string;

  /** Current state */
  current: {
    /** Current churn rate */
    churnRate: number;
    /** Current stability score */
    stabilityScore: number;
    /** Current pattern */
    pattern: ChangePattern;
  };

  /** Future predictions */
  predictions: Array<{
    /** Days from now */
    daysFromNow: number;
    /** Predicted churn rate */
    churnRate: number;
    /** Predicted stability score */
    stabilityScore: number;
    /** Confidence (0-1) */
    confidence: number;
  }>;

  /** Trend analysis */
  trend: {
    /** Overall direction */
    direction: 'IMPROVING' | 'STABLE' | 'DEGRADING';
    /** Rate of change (per month) */
    rate: number;
    /** Confidence in trend (0-1) */
    confidence: number;
  };

  /** Intervention effectiveness */
  interventions: Array<{
    /** Intervention type */
    type: RefactoringCategory;
    /** Expected stability improvement (0-1) */
    expectedImprovement: number;
    /** Time to effect (days) */
    timeToEffect: number;
  }>;
}

/**
 * Git commit information
 */
interface GitCommit {
  hash: string;
  author: string;
  date: Date;
  message: string;
  linesAdded: number;
  linesDeleted: number;
  filesChanged: string[];
}

/**
 * Configuration options
 */
export interface ChurnPredictorConfig {
  /** Thresholds for stability risk levels */
  thresholds: {
    /** LOW risk: stability score ≥ 0.8 */
    low: number;
    /** MEDIUM risk: 0.6 ≤ stability score < 0.8 */
    medium: number;
    /** HIGH risk: 0.4 ≤ stability score < 0.6 */
    high: number;
    /** CRITICAL risk: stability score < 0.4 */
    critical: number;
  };

  /** Churn calculation parameters */
  churnParams: {
    /** Days to look back for churn calculation */
    lookbackDays: number;
    /** High churn threshold (commits per month) */
    highChurnThreshold: number;
    /** Low churn threshold (commits per month) */
    lowChurnThreshold: number;
  };

  /** Stability scoring weights */
  weights: {
    /** Weight for file churn (0-1) */
    fileChurn: number;
    /** Weight for line churn (0-1) */
    lineChurn: number;
    /** Weight for author churn (0-1) */
    authorChurn: number;
    /** Weight for temporal patterns (0-1) */
    temporal: number;
    /** Weight for structural factors (0-1) */
    structural: number;
  };

  /** Forecasting parameters */
  forecasting: {
    /** Use ML model for forecasting */
    useMachineLearning: boolean;
    /** Minimum historical data points */
    minDataPoints: number;
    /** Forecast confidence threshold */
    minConfidence: number;
  };
}

// ============================================================================
// Default Configuration
// ============================================================================

const DEFAULT_CONFIG: ChurnPredictorConfig = {
  thresholds: {
    low: 0.8,
    medium: 0.6,
    high: 0.4,
    critical: 0.0,
  },
  churnParams: {
    lookbackDays: 180, // 6 months
    highChurnThreshold: 10, // 10+ commits/month
    lowChurnThreshold: 2, // <2 commits/month
  },
  weights: {
    fileChurn: 0.25,
    lineChurn: 0.25,
    authorChurn: 0.2,
    temporal: 0.15,
    structural: 0.15,
  },
  forecasting: {
    useMachineLearning: true,
    minDataPoints: 10,
    minConfidence: 0.7,
  },
};

// ============================================================================
// ChurnPredictor Class
// ============================================================================

/**
 * Churn Predictor - Predict code stability based on change patterns
 * 
 * **Usage**:
 * ```typescript
 * const predictor = new ChurnPredictor(workspaceRoot, config);
 * 
 * // Analyze churn for a file
 * const churn = await predictor.analyzeChurn('src/components/App.tsx');
 * console.log(`Churn rate: ${churn.lineChurn.churnRate}`);
 * 
 * // Predict stability
 * const prediction = await predictor.predictStability('src/components/App.tsx');
 * console.log(`Stability score: ${prediction.stabilityScore}`);
 * 
 * // Identify unstable files
 * const unstable = await predictor.identifyUnstableCode();
 * console.log(`Found ${unstable.length} unstable files`);
 * 
 * // Get refactoring recommendations
 * const recommendations = await predictor.recommendRefactorings('src/components/App.tsx');
 * recommendations.forEach(r => console.log(`${r.category}: ${r.action}`));
 * 
 * // Forecast trend
 * const trend = await predictor.forecastTrend('src/components/App.tsx');
 * console.log(`Trend: ${trend.trend.direction}, Rate: ${trend.trend.rate}`);
 * ```
 */
export class ChurnPredictor {
  private workspaceRoot: string;
  private config: ChurnPredictorConfig;
  private gitCache: Map<string, GitCommit[]> = new Map();

  constructor(workspaceRoot: string, config: Partial<ChurnPredictorConfig> = {}) {
    this.workspaceRoot = workspaceRoot;
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  // ==========================================================================
  // Public API
  // ==========================================================================

  /**
   * Analyze churn metrics for a file
   * 
   * @param filePath - Absolute or relative file path
   * @returns Churn metrics
   * 
   * @example
   * ```typescript
   * const churn = await predictor.analyzeChurn('src/App.tsx');
   * console.log(`Commits: ${churn.fileChurn.totalCommits}`);
   * console.log(`Churn rate: ${churn.lineChurn.churnRate}`);
   * console.log(`Authors: ${churn.authorChurn.authorCount}`);
   * ```
   */
  async analyzeChurn(filePath: string): Promise<ChurnMetrics> {
    const absolutePath = path.isAbsolute(filePath) ? filePath : path.join(this.workspaceRoot, filePath);
    const relativePath = path.relative(this.workspaceRoot, absolutePath);

    // Get Git history
    const commits = await this.getGitHistory(relativePath);

    // Calculate metrics
    const fileChurn = this.calculateFileChurn(commits);
    const lineChurn = await this.calculateLineChurn(commits, relativePath);
    const authorChurn = this.calculateAuthorChurn(commits);
    const temporal = this.calculateTemporal(commits, relativePath);
    const structural = await this.calculateStructural(relativePath, commits);

    // Classify pattern
    const pattern = this.classifyPattern(fileChurn, lineChurn, temporal);

    return {
      filePath: relativePath,
      fileChurn,
      lineChurn,
      authorChurn,
      temporal,
      structural,
      pattern,
    };
  }

  /**
   * Predict stability score for a file
   * 
   * @param filePath - Absolute or relative file path
   * @returns Stability prediction with confidence and recommendations
   * 
   * @example
   * ```typescript
   * const prediction = await predictor.predictStability('src/App.tsx');
   * console.log(`Stability: ${prediction.stabilityScore.toFixed(2)}`);
   * console.log(`Risk: ${prediction.risk}`);
   * prediction.recommendations.forEach(r => console.log(r.action));
   * ```
   */
  async predictStability(filePath: string): Promise<StabilityPrediction> {
    const churn = await this.analyzeChurn(filePath);

    // Calculate stability score (0-1, higher is better)
    const stabilityScore = this.calculateStabilityScore(churn);

    // Determine risk level
    const risk = this.assessRisk(stabilityScore);

    // Calculate confidence based on data quality
    const confidence = this.calculateConfidence(churn);

    // Identify contributing factors
    const contributingFactors = this.identifyContributingFactors(churn);

    // Forecast future stability
    const forecast = await this.forecastStability(filePath, churn);

    // Get historical context
    const history = await this.getStabilityHistory(filePath);

    // Generate recommendations
    const recommendations = this.generateStabilityRecommendations(churn, stabilityScore);

    return {
      filePath: churn.filePath,
      stabilityScore,
      risk,
      confidence,
      contributingFactors,
      forecast,
      history,
      recommendations,
    };
  }

  /**
   * Identify all unstable files in workspace
   * 
   * @param filters - Optional filters (risk levels, file patterns)
   * @returns Array of unstable files sorted by priority
   * 
   * @example
   * ```typescript
   * const unstable = await predictor.identifyUnstableCode({ 
   *   risks: ['HIGH', 'CRITICAL'],
   *   filePattern: '*.tsx'
   * });
   * console.log(`Found ${unstable.length} unstable files`);
   * unstable.forEach(f => console.log(`${f.filePath}: ${f.risk}`));
   * ```
   */
  async identifyUnstableCode(filters?: {
    risks?: StabilityRisk[];
    filePattern?: string;
    minChurnRate?: number;
    maxStabilityScore?: number;
  }): Promise<UnstableFile[]> {
    const allFiles = await this.getAllTrackedFiles();
    const unstableFiles: UnstableFile[] = [];

    for (const filePath of allFiles) {
      // Apply file pattern filter
      if (filters?.filePattern && !this.matchesPattern(filePath, filters.filePattern)) {
        continue;
      }

      const churn = await this.analyzeChurn(filePath);

      // Apply churn rate filter
      if (filters?.minChurnRate && churn.lineChurn.churnRate < filters.minChurnRate) {
        continue;
      }

      const stabilityScore = this.calculateStabilityScore(churn);

      // Apply stability score filter
      if (filters?.maxStabilityScore && stabilityScore > filters.maxStabilityScore) {
        continue;
      }

      const risk = this.assessRisk(stabilityScore);

      // Apply risk filter
      if (filters?.risks && !filters.risks.includes(risk)) {
        continue;
      }

      const indicators = this.identifyInstabilityIndicators(churn);

      unstableFiles.push({
        filePath,
        metrics: churn,
        stabilityScore,
        risk,
        indicators,
        priority: 0, // Will be set in prioritization
      });
    }

    // Prioritize and sort
    return this.prioritizeUnstableFiles(unstableFiles);
  }

  /**
   * Generate refactoring recommendations for a file
   * 
   * @param filePath - Absolute or relative file path
   * @returns Prioritized refactoring recommendations
   * 
   * @example
   * ```typescript
   * const recommendations = await predictor.recommendRefactorings('src/App.tsx');
   * recommendations.forEach(r => {
   *   console.log(`${r.category}: ${r.action}`);
   *   console.log(`Expected improvement: ${r.benefits.stabilityImprovement * 100}%`);
   *   console.log(`Effort: ${r.effort.hours}h`);
   * });
   * ```
   */
  async recommendRefactorings(filePath: string): Promise<RefactoringRecommendation[]> {
    const churn = await this.analyzeChurn(filePath);
    const stabilityScore = this.calculateStabilityScore(churn);
    const recommendations: RefactoringRecommendation[] = [];

    // Recommend based on churn patterns
    if (churn.lineChurn.churnRate > 1.5) {
      recommendations.push({
        filePath: churn.filePath,
        category: RefactoringCategory.SPLIT,
        action: 'Split large file into smaller, focused modules',
        rationale: `High line churn rate (${churn.lineChurn.churnRate.toFixed(2)}) indicates file is doing too much`,
        benefits: {
          stabilityImprovement: 0.4,
          churnReduction: 60,
          defectReduction: 40,
        },
        effort: {
          hours: 16,
          complexity: 'HIGH',
        },
        risk: {
          level: 'MEDIUM',
          description: 'Requires careful dependency management',
        },
        priority: 9,
        steps: [
          'Identify distinct responsibilities',
          'Extract each responsibility to new module',
          'Update import statements',
          'Run full test suite',
        ],
      });
    }

    if (churn.authorChurn.authorDiversity > 0.7 && churn.authorChurn.primaryAuthorShare < 0.5) {
      recommendations.push({
        filePath: churn.filePath,
        category: RefactoringCategory.CLARIFY_OWNERSHIP,
        action: 'Assign clear code ownership',
        rationale: `High author diversity (${churn.authorChurn.authorCount} authors) with no primary owner`,
        benefits: {
          stabilityImprovement: 0.3,
          churnReduction: 30,
          defectReduction: 20,
        },
        effort: {
          hours: 2,
          complexity: 'LOW',
        },
        risk: {
          level: 'LOW',
          description: 'Organizational change only',
        },
        priority: 7,
        steps: [
          'Identify most knowledgeable developer',
          'Update CODEOWNERS file',
          'Document ownership in README',
          'Require owner review for changes',
        ],
      });
    }

    if (churn.fileChurn.commitsPerMonth > this.config.churnParams.highChurnThreshold) {
      recommendations.push({
        filePath: churn.filePath,
        category: RefactoringCategory.STABILIZE,
        action: 'Refactor to reduce change frequency',
        rationale: `Very high commit frequency (${churn.fileChurn.commitsPerMonth.toFixed(1)}/month)`,
        benefits: {
          stabilityImprovement: 0.5,
          churnReduction: 50,
          defectReduction: 35,
        },
        effort: {
          hours: 24,
          complexity: 'HIGH',
        },
        risk: {
          level: 'MEDIUM',
          description: 'Major refactoring requires thorough testing',
        },
        priority: 10,
        steps: [
          'Analyze reasons for frequent changes',
          'Extract volatile logic to configuration',
          'Implement strategy/plugin pattern for variations',
          'Add comprehensive tests',
        ],
      });
    }

    if (churn.structural.mergeConflicts > 5) {
      recommendations.push({
        filePath: churn.filePath,
        category: RefactoringCategory.DOCUMENT,
        action: 'Improve documentation to reduce conflicts',
        rationale: `High merge conflict count (${churn.structural.mergeConflicts}) indicates confusion`,
        benefits: {
          stabilityImprovement: 0.2,
          churnReduction: 20,
          defectReduction: 15,
        },
        effort: {
          hours: 8,
          complexity: 'MEDIUM',
        },
        risk: {
          level: 'LOW',
          description: 'Documentation improvements are low-risk',
        },
        priority: 6,
        steps: [
          'Add inline documentation for complex logic',
          'Document architectural decisions',
          'Create usage examples',
          'Document edge cases',
        ],
      });
    }

    if (stabilityScore < 0.5) {
      recommendations.push({
        filePath: churn.filePath,
        category: RefactoringCategory.TEST,
        action: 'Add comprehensive test coverage',
        rationale: `Low stability score (${stabilityScore.toFixed(2)}) requires safety net`,
        benefits: {
          stabilityImprovement: 0.3,
          churnReduction: 25,
          defectReduction: 50,
        },
        effort: {
          hours: 12,
          complexity: 'MEDIUM',
        },
        risk: {
          level: 'LOW',
          description: 'Tests reduce refactoring risk',
        },
        priority: 8,
        steps: [
          'Achieve 80%+ line coverage',
          'Add edge case tests',
          'Add integration tests',
          'Set up mutation testing',
        ],
      });
    }

    // Sort by priority (descending)
    return recommendations.sort((a, b) => b.priority - a.priority);
  }

  /**
   * Forecast churn trend for a file
   * 
   * @param filePath - Absolute or relative file path
   * @returns Trend forecast with predictions and intervention analysis
   * 
   * @example
   * ```typescript
   * const trend = await predictor.forecastTrend('src/App.tsx');
   * console.log(`Current churn: ${trend.current.churnRate}`);
   * console.log(`Predicted in 30 days: ${trend.predictions[0].churnRate}`);
   * console.log(`Trend: ${trend.trend.direction}`);
   * ```
   */
  async forecastTrend(filePath: string): Promise<ChurnTrend> {
    const churn = await this.analyzeChurn(filePath);
    const stabilityScore = this.calculateStabilityScore(churn);

    // Get historical data
    const history = await this.getChurnHistory(filePath);

    // Calculate current state
    const current = {
      churnRate: churn.lineChurn.churnRate,
      stabilityScore,
      pattern: churn.pattern,
    };

    // Generate predictions (30, 60, 90 days)
    const predictions = [30, 60, 90].map(daysFromNow => {
      const predicted = this.predictFutureChurn(history, daysFromNow);
      return {
        daysFromNow,
        churnRate: predicted.churnRate,
        stabilityScore: predicted.stabilityScore,
        confidence: predicted.confidence,
      };
    });

    // Analyze trend
    const trend = this.analyzeTrend(history, predictions);

    // Evaluate interventions
    const interventions = this.evaluateInterventions(churn, stabilityScore);

    return {
      filePath: churn.filePath,
      current,
      predictions,
      trend,
      interventions,
    };
  }

  // ==========================================================================
  // Private Methods - Git Operations
  // ==========================================================================

  /**
   * Get Git history for a file
   */
  private async getGitHistory(filePath: string): Promise<GitCommit[]> {
    // Check cache
    if (this.gitCache.has(filePath)) {
      return this.gitCache.get(filePath)!;
    }

    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - this.config.churnParams.lookbackDays);

      // Git log with stats
      const cmd = `git log --follow --numstat --format="COMMIT:%H|%an|%ad|%s" --date=iso --since="${cutoffDate.toISOString()}" -- "${filePath}"`;
      const output = execSync(cmd, {
        cwd: this.workspaceRoot,
        encoding: 'utf8',
        stdio: ['pipe', 'pipe', 'ignore'],
      });

      const commits: GitCommit[] = [];
      const lines = output.split('\n');
      let currentCommit: Partial<GitCommit> | null = null;

      for (const line of lines) {
        if (line.startsWith('COMMIT:')) {
          if (currentCommit) {
            commits.push(currentCommit as GitCommit);
          }
          const [hash, author, date, message] = line.substring(7).split('|');
          currentCommit = {
            hash,
            author,
            date: new Date(date),
            message,
            linesAdded: 0,
            linesDeleted: 0,
            filesChanged: [],
          };
        } else if (line.trim() && currentCommit) {
          const [added, deleted, file] = line.split('\t');
          currentCommit.linesAdded = (currentCommit.linesAdded || 0) + parseInt(added || '0', 10);
          currentCommit.linesDeleted = (currentCommit.linesDeleted || 0) + parseInt(deleted || '0', 10);
          if (file) {
            currentCommit.filesChanged = currentCommit.filesChanged || [];
            currentCommit.filesChanged.push(file);
          }
        }
      }

      if (currentCommit) {
        commits.push(currentCommit as GitCommit);
      }

      // Cache results
      this.gitCache.set(filePath, commits);

      return commits;
    } catch (error) {
      // Git not available or file not in Git
      return [];
    }
  }

  /**
   * Get all tracked files in workspace
   */
  private async getAllTrackedFiles(): Promise<string[]> {
    try {
      const cmd = 'git ls-files';
      const output = execSync(cmd, {
        cwd: this.workspaceRoot,
        encoding: 'utf8',
        stdio: ['pipe', 'pipe', 'ignore'],
      });
      return output.split('\n').filter(f => f.trim() && (f.endsWith('.ts') || f.endsWith('.tsx') || f.endsWith('.js') || f.endsWith('.jsx')));
    } catch (error) {
      return [];
    }
  }

  // ==========================================================================
  // Private Methods - Metric Calculation
  // ==========================================================================

  /**
   * Calculate file-level churn metrics
   */
  private calculateFileChurn(commits: GitCommit[]): ChurnMetrics['fileChurn'] {
    if (commits.length === 0) {
      return {
        totalCommits: 0,
        commitsPerMonth: 0,
        daysSinceLastChange: 9999,
        uniqueAuthors: 0,
      };
    }

    const totalCommits = commits.length;
    const oldestDate = commits[commits.length - 1].date;
    const newestDate = commits[0].date;
    const daysDiff = (newestDate.getTime() - oldestDate.getTime()) / (1000 * 60 * 60 * 24);
    const commitsPerMonth = (totalCommits / daysDiff) * 30;

    const now = new Date();
    const daysSinceLastChange = (now.getTime() - newestDate.getTime()) / (1000 * 60 * 60 * 24);

    const uniqueAuthors = new Set(commits.map(c => c.author)).size;

    return {
      totalCommits,
      commitsPerMonth,
      daysSinceLastChange,
      uniqueAuthors,
    };
  }

  /**
   * Calculate line-level churn metrics
   */
  private async calculateLineChurn(commits: GitCommit[], filePath: string): Promise<ChurnMetrics['lineChurn']> {
    if (commits.length === 0) {
      return {
        linesAdded: 0,
        linesDeleted: 0,
        linesModified: 0,
        linesPerMonth: 0,
        churnRate: 0,
      };
    }

    const linesAdded = commits.reduce((sum, c) => sum + c.linesAdded, 0);
    const linesDeleted = commits.reduce((sum, c) => sum + c.linesDeleted, 0);
    const linesModified = linesAdded + linesDeleted;

    const oldestDate = commits[commits.length - 1].date;
    const newestDate = commits[0].date;
    const daysDiff = (newestDate.getTime() - oldestDate.getTime()) / (1000 * 60 * 60 * 24);
    const linesPerMonth = (linesModified / daysDiff) * 30;

    // Get current file size
    const absolutePath = path.join(this.workspaceRoot, filePath);
    let currentLOC = 1000; // Default if file not readable
    try {
      const content = await fs.readFile(absolutePath, 'utf8');
      currentLOC = content.split('\n').length;
    } catch {
      // File not readable, use default
    }

    const churnRate = linesModified / currentLOC;

    return {
      linesAdded,
      linesDeleted,
      linesModified,
      linesPerMonth,
      churnRate,
    };
  }

  /**
   * Calculate author churn metrics
   */
  private calculateAuthorChurn(commits: GitCommit[]): ChurnMetrics['authorChurn'] {
    if (commits.length === 0) {
      return {
        authorCount: 0,
        primaryAuthor: 'unknown',
        primaryAuthorShare: 0,
        authorDiversity: 0,
      };
    }

    const authorCommits = new Map<string, number>();
    for (const commit of commits) {
      authorCommits.set(commit.author, (authorCommits.get(commit.author) || 0) + 1);
    }

    const authorCount = authorCommits.size;
    const totalCommits = commits.length;

    // Find primary author
    let primaryAuthor = 'unknown';
    let maxCommits = 0;
    for (const [author, count] of authorCommits.entries()) {
      if (count > maxCommits) {
        primaryAuthor = author;
        maxCommits = count;
      }
    }

    const primaryAuthorShare = maxCommits / totalCommits;

    // Calculate Shannon entropy for diversity
    let entropy = 0;
    for (const count of authorCommits.values()) {
      const p = count / totalCommits;
      entropy -= p * Math.log2(p);
    }
    const maxEntropy = Math.log2(authorCount);
    const authorDiversity = maxEntropy > 0 ? entropy / maxEntropy : 0;

    return {
      authorCount,
      primaryAuthor,
      primaryAuthorShare,
      authorDiversity,
    };
  }

  /**
   * Calculate temporal patterns
   */
  private calculateTemporal(commits: GitCommit[], filePath: string): ChurnMetrics['temporal'] {
    if (commits.length === 0) {
      return {
        ageInDays: 0,
        modificationFrequency: 0,
        peakActivityHours: [],
        activityTrend: 'STABLE',
      };
    }

    // File age
    const newestDate = commits[0].date;
    const oldestDate = commits[commits.length - 1].date;
    const ageInDays = (newestDate.getTime() - oldestDate.getTime()) / (1000 * 60 * 60 * 24);

    // Modification frequency (changes per week)
    const modificationFrequency = (commits.length / ageInDays) * 7;

    // Peak activity hours
    const hourCounts = new Array(24).fill(0);
    for (const commit of commits) {
      const hour = commit.date.getHours();
      hourCounts[hour]++;
    }
    const maxCount = Math.max(...hourCounts);
    const peakActivityHours = hourCounts
      .map((count, hour) => ({ hour, count }))
      .filter(h => h.count >= maxCount * 0.8)
      .map(h => h.hour);

    // Activity trend (last 30 days vs previous 30 days)
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

    const recentCommits = commits.filter(c => c.date >= thirtyDaysAgo).length;
    const previousCommits = commits.filter(c => c.date >= sixtyDaysAgo && c.date < thirtyDaysAgo).length;

    let activityTrend: 'INCREASING' | 'STABLE' | 'DECREASING' = 'STABLE';
    if (recentCommits > previousCommits * 1.5) {
      activityTrend = 'INCREASING';
    } else if (recentCommits < previousCommits * 0.5) {
      activityTrend = 'DECREASING';
    }

    return {
      ageInDays,
      modificationFrequency,
      peakActivityHours,
      activityTrend,
    };
  }

  /**
   * Calculate structural change metrics
   */
  private async calculateStructural(filePath: string, commits: GitCommit[]): Promise<ChurnMetrics['structural']> {
    if (commits.length === 0) {
      return {
        mergeConflicts: 0,
        avgReviewTime: 0,
        revertCount: 0,
        branchCount: 0,
      };
    }

    try {
      // Count merge conflicts (commits with "conflict" in message)
      const mergeConflicts = commits.filter(c => 
        c.message.toLowerCase().includes('conflict') || 
        c.message.toLowerCase().includes('merge')
      ).length;

      // Count reverts
      const revertCount = commits.filter(c => 
        c.message.toLowerCase().startsWith('revert')
      ).length;

      // Get branch count
      const branchCmd = `git branch -a --contains HEAD`;
      const branchOutput = execSync(branchCmd, {
        cwd: this.workspaceRoot,
        encoding: 'utf8',
        stdio: ['pipe', 'pipe', 'ignore'],
      });
      const branchCount = branchOutput.split('\n').filter(b => b.trim()).length;

      return {
        mergeConflicts,
        avgReviewTime: 2, // Default estimate (days)
        revertCount,
        branchCount,
      };
    } catch {
      return {
        mergeConflicts: 0,
        avgReviewTime: 0,
        revertCount: 0,
        branchCount: 0,
      };
    }
  }

  /**
   * Classify change pattern
   */
  private classifyPattern(
    fileChurn: ChurnMetrics['fileChurn'],
    lineChurn: ChurnMetrics['lineChurn'],
    temporal: ChurnMetrics['temporal']
  ): ChangePattern {
    const highChurnThreshold = this.config.churnParams.highChurnThreshold;
    const lowChurnThreshold = this.config.churnParams.lowChurnThreshold;

    // HOTSPOT: High churn + recent activity
    if (fileChurn.commitsPerMonth >= highChurnThreshold && fileChurn.daysSinceLastChange < 30) {
      return ChangePattern.HOTSPOT;
    }

    // VOLATILE: High churn + unstable
    if (lineChurn.churnRate > 1.0 && temporal.activityTrend === 'INCREASING') {
      return ChangePattern.VOLATILE;
    }

    // ABANDONED: No recent activity
    if (fileChurn.daysSinceLastChange > 180) {
      return ChangePattern.ABANDONED;
    }

    // LEGACY: Old file + low churn
    if (temporal.ageInDays > 365 && fileChurn.commitsPerMonth < lowChurnThreshold) {
      return ChangePattern.LEGACY;
    }

    // STABLE: Low churn
    return ChangePattern.STABLE;
  }

  // ==========================================================================
  // Private Methods - Stability Scoring
  // ==========================================================================

  /**
   * Calculate stability score (0-1, higher is better)
   */
  private calculateStabilityScore(churn: ChurnMetrics): number {
    const weights = this.config.weights;

    // File churn score (inverse of commits/month, normalized)
    const fileChurnScore = Math.max(0, 1 - churn.fileChurn.commitsPerMonth / 20);

    // Line churn score (inverse of churn rate)
    const lineChurnScore = Math.max(0, 1 - Math.min(churn.lineChurn.churnRate / 2, 1));

    // Author churn score (inverse of diversity)
    const authorChurnScore = 1 - churn.authorChurn.authorDiversity;

    // Temporal score (favor stable, mature code)
    const temporalScore = churn.temporal.activityTrend === 'DECREASING' ? 0.8 :
                         churn.temporal.activityTrend === 'STABLE' ? 0.6 : 0.4;

    // Structural score (inverse of issues)
    const structuralScore = Math.max(0, 1 - (churn.structural.mergeConflicts + churn.structural.revertCount) / 20);

    // Weighted average
    const stabilityScore = (
      fileChurnScore * weights.fileChurn +
      lineChurnScore * weights.lineChurn +
      authorChurnScore * weights.authorChurn +
      temporalScore * weights.temporal +
      structuralScore * weights.structural
    );

    return Math.max(0, Math.min(1, stabilityScore));
  }

  /**
   * Assess risk level based on stability score
   */
  private assessRisk(stabilityScore: number): StabilityRisk {
    const thresholds = this.config.thresholds;
    if (stabilityScore >= thresholds.low) return 'LOW';
    if (stabilityScore >= thresholds.medium) return 'MEDIUM';
    if (stabilityScore >= thresholds.high) return 'HIGH';
    return 'CRITICAL';
  }

  /**
   * Calculate prediction confidence
   */
  private calculateConfidence(churn: ChurnMetrics): number {
    // Confidence based on data quantity
    const commitConfidence = Math.min(churn.fileChurn.totalCommits / 20, 1);
    const ageConfidence = Math.min(churn.temporal.ageInDays / 180, 1);
    const authorConfidence = Math.min(churn.authorChurn.authorCount / 5, 1);

    return (commitConfidence + ageConfidence + authorConfidence) / 3;
  }

  /**
   * Identify contributing factors to instability
   */
  private identifyContributingFactors(churn: ChurnMetrics): StabilityPrediction['contributingFactors'] {
    const factors: StabilityPrediction['contributingFactors'] = [];

    if (churn.fileChurn.commitsPerMonth > this.config.churnParams.highChurnThreshold) {
      factors.push({
        factor: 'High Commit Frequency',
        type: ChurnMetricType.FILE_CHURN,
        value: churn.fileChurn.commitsPerMonth,
        impact: 0.3,
        description: `File is changed ${churn.fileChurn.commitsPerMonth.toFixed(1)} times per month`,
      });
    }

    if (churn.lineChurn.churnRate > 1.0) {
      factors.push({
        factor: 'High Line Churn',
        type: ChurnMetricType.LINE_CHURN,
        value: churn.lineChurn.churnRate,
        impact: 0.35,
        description: `Lines changed exceed total file size (rate: ${churn.lineChurn.churnRate.toFixed(2)})`,
      });
    }

    if (churn.authorChurn.authorDiversity > 0.7) {
      factors.push({
        factor: 'High Author Diversity',
        type: ChurnMetricType.AUTHOR_CHURN,
        value: churn.authorChurn.authorDiversity,
        impact: 0.2,
        description: `${churn.authorChurn.authorCount} authors with no clear owner`,
      });
    }

    if (churn.temporal.activityTrend === 'INCREASING') {
      factors.push({
        factor: 'Increasing Activity',
        type: ChurnMetricType.TEMPORAL_CHURN,
        value: 1,
        impact: 0.15,
        description: 'Change frequency is accelerating',
      });
    }

    if (churn.structural.mergeConflicts > 3) {
      factors.push({
        factor: 'Frequent Merge Conflicts',
        type: ChurnMetricType.STRUCTURAL_CHURN,
        value: churn.structural.mergeConflicts,
        impact: 0.25,
        description: `${churn.structural.mergeConflicts} merge conflicts indicate coordination issues`,
      });
    }

    return factors;
  }

  /**
   * Forecast future stability
   */
  private async forecastStability(filePath: string, churn: ChurnMetrics): Promise<StabilityPrediction['forecast']> {
    const currentScore = this.calculateStabilityScore(churn);

    // Simple linear extrapolation based on trend
    let trendMultiplier = 1;
    if (churn.temporal.activityTrend === 'INCREASING') {
      trendMultiplier = 0.9; // Degrading
    } else if (churn.temporal.activityTrend === 'DECREASING') {
      trendMultiplier = 1.1; // Improving
    }

    const in30Days = Math.max(0, Math.min(1, currentScore * trendMultiplier));
    const in90Days = Math.max(0, Math.min(1, currentScore * Math.pow(trendMultiplier, 3)));

    const trend = trendMultiplier > 1 ? 'IMPROVING' :
                 trendMultiplier < 1 ? 'DEGRADING' : 'STABLE';

    return {
      in30Days,
      in90Days,
      trend,
    };
  }

  /**
   * Get stability history
   */
  private async getStabilityHistory(filePath: string): Promise<StabilityPrediction['history']> {
    // For now, return mock data (would implement real historical tracking)
    return {
      pastScores: [],
      similarFiles: [],
      avgTimeToStabilize: 90,
    };
  }

  /**
   * Generate stability recommendations
   */
  private generateStabilityRecommendations(churn: ChurnMetrics, stabilityScore: number): StabilityPrediction['recommendations'] {
    const recommendations: StabilityPrediction['recommendations'] = [];

    if (churn.fileChurn.commitsPerMonth > 10) {
      recommendations.push({
        action: 'Reduce change frequency through better design',
        priority: 9,
        expectedImprovement: 0.3,
      });
    }

    if (churn.authorChurn.authorDiversity > 0.7) {
      recommendations.push({
        action: 'Assign clear code ownership',
        priority: 7,
        expectedImprovement: 0.2,
      });
    }

    if (stabilityScore < 0.5) {
      recommendations.push({
        action: 'Add comprehensive test coverage',
        priority: 8,
        expectedImprovement: 0.25,
      });
    }

    return recommendations.sort((a, b) => b.priority - a.priority);
  }

  /**
   * Identify instability indicators
   */
  private identifyInstabilityIndicators(churn: ChurnMetrics): UnstableFile['indicators'] {
    const indicators: UnstableFile['indicators'] = [];

    if (churn.lineChurn.churnRate > 1.5) {
      indicators.push({
        type: ChurnMetricType.LINE_CHURN,
        severity: 0.9,
        description: 'Extreme line churn indicates unstable requirements',
      });
    }

    if (churn.fileChurn.commitsPerMonth > 15) {
      indicators.push({
        type: ChurnMetricType.FILE_CHURN,
        severity: 0.85,
        description: 'Very high commit frequency suggests design issues',
      });
    }

    if (churn.structural.mergeConflicts > 5) {
      indicators.push({
        type: ChurnMetricType.STRUCTURAL_CHURN,
        severity: 0.75,
        description: 'Frequent merge conflicts indicate poor coordination',
      });
    }

    return indicators;
  }

  /**
   * Prioritize unstable files
   */
  private prioritizeUnstableFiles(files: UnstableFile[]): UnstableFile[] {
    // Priority formula: (1 - stability) * maxIndicatorSeverity * 10
    return files
      .map(file => ({
        ...file,
        priority: Math.round(
          (1 - file.stabilityScore) * 
          Math.max(...file.indicators.map(i => i.severity), 0.5) * 
          10
        ),
      }))
      .sort((a, b) => b.priority - a.priority);
  }

  // ==========================================================================
  // Private Methods - Forecasting
  // ==========================================================================

  /**
   * Get churn history over time
   */
  private async getChurnHistory(filePath: string): Promise<Array<{ date: Date; churnRate: number; stabilityScore: number }>> {
    // For now, return mock data (would implement real historical tracking)
    return [];
  }

  /**
   * Predict future churn
   */
  private predictFutureChurn(
    history: Array<{ date: Date; churnRate: number; stabilityScore: number }>,
    daysFromNow: number
  ): { churnRate: number; stabilityScore: number; confidence: number } {
    // Simple linear extrapolation (would use ML model in production)
    if (history.length < 2) {
      return { churnRate: 0, stabilityScore: 0.5, confidence: 0.3 };
    }

    const latest = history[0];
    const previous = history[Math.min(1, history.length - 1)];

    const churnRateDelta = (latest.churnRate - previous.churnRate) / 30;
    const stabilityDelta = (latest.stabilityScore - previous.stabilityScore) / 30;

    return {
      churnRate: Math.max(0, latest.churnRate + churnRateDelta * daysFromNow),
      stabilityScore: Math.max(0, Math.min(1, latest.stabilityScore + stabilityDelta * daysFromNow)),
      confidence: Math.max(0.5, 1 - daysFromNow / 180), // Confidence decreases over time
    };
  }

  /**
   * Analyze trend direction and rate
   */
  private analyzeTrend(
    history: Array<{ date: Date; churnRate: number; stabilityScore: number }>,
    predictions: Array<{ daysFromNow: number; churnRate: number; stabilityScore: number; confidence: number }>
  ): ChurnTrend['trend'] {
    if (predictions.length < 2) {
      return { direction: 'STABLE', rate: 0, confidence: 0.5 };
    }

    const first = predictions[0];
    const last = predictions[predictions.length - 1];

    const stabilityChange = last.stabilityScore - first.stabilityScore;
    const direction = stabilityChange > 0.1 ? 'IMPROVING' :
                     stabilityChange < -0.1 ? 'DEGRADING' : 'STABLE';

    const rate = Math.abs(stabilityChange / (last.daysFromNow - first.daysFromNow)) * 30; // Change per month

    const avgConfidence = predictions.reduce((sum, p) => sum + p.confidence, 0) / predictions.length;

    return {
      direction,
      rate,
      confidence: avgConfidence,
    };
  }

  /**
   * Evaluate intervention effectiveness
   */
  private evaluateInterventions(churn: ChurnMetrics, stabilityScore: number): ChurnTrend['interventions'] {
    const interventions: ChurnTrend['interventions'] = [];

    if (churn.lineChurn.churnRate > 1.5) {
      interventions.push({
        type: RefactoringCategory.SPLIT,
        expectedImprovement: 0.4,
        timeToEffect: 30,
      });
    }

    if (churn.authorChurn.authorDiversity > 0.7) {
      interventions.push({
        type: RefactoringCategory.CLARIFY_OWNERSHIP,
        expectedImprovement: 0.3,
        timeToEffect: 7,
      });
    }

    if (stabilityScore < 0.5) {
      interventions.push({
        type: RefactoringCategory.TEST,
        expectedImprovement: 0.3,
        timeToEffect: 14,
      });
    }

    return interventions;
  }

  /**
   * Check if file matches pattern
   */
  private matchesPattern(filePath: string, pattern: string): boolean {
    const regex = new RegExp(pattern.replace(/\*/g, '.*').replace(/\?/g, '.'));
    return regex.test(filePath);
  }
}
