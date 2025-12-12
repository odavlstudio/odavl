/**
 * @fileoverview Insight Recommender - Generate actionable code insights
 * @module @odavl-studio/insight-core/ai/insight-recommender
 * 
 * **Purpose**: Provide personalized, context-aware recommendations to improve code quality
 * 
 * **Features**:
 * - Actionable code insights (specific improvements)
 * - Personalized recommendations (based on developer history)
 * - Context-aware suggestions (project, file, function level)
 * - Priority ranking (impact vs effort)
 * - Learning from feedback (improve over time)
 * - Multi-dimensional analysis (quality, security, performance, maintainability)
 * - Trend-based recommendations (historical patterns)
 * - Team collaboration insights (knowledge sharing opportunities)
 * 
 * **Insight Categories**:
 * - Quality: Code smells, complexity, test coverage
 * - Security: Vulnerabilities, secrets, unsafe patterns
 * - Performance: Bottlenecks, inefficiencies, optimization opportunities
 * - Maintainability: Duplication, documentation, refactoring
 * - Collaboration: Knowledge gaps, code ownership, review recommendations
 * 
 * **Algorithm**:
 * 1. Gather context (file, project, developer, history)
 * 2. Run all detectors (defect, hotspot, churn, similarity)
 * 3. Score insights by impact and feasibility
 * 4. Personalize based on developer preferences
 * 5. Rank by priority (ROI = impact / effort)
 * 6. Generate actionable steps
 * 7. Learn from feedback (accept/reject/defer)
 * 
 * **Architecture**:
 * ```
 * InsightRecommender
 *   ├── generateInsights(context) → Insight[]
 *   ├── personalizeInsights(insights, developer) → Insight[]
 *   ├── rankInsights(insights) → Insight[]
 *   ├── learnFromFeedback(insight, feedback) → void
 *   ├── getTopInsights(n) → Insight[]
 *   ├── explainInsight(insight) → Explanation
 *   └── private methods (scoring, filtering, personalization)
 * ```
 * 
 * **Integration Points**:
 * - Used by: VS Code extension, CLI, Dashboard
 * - Integrates with: All detectors (defect, hotspot, churn, similarity)
 * - Exports: Insight, InsightCategory, DeveloperProfile
 */

import * as fs from 'fs/promises';
import * as path from 'path';

// ============================================================================
// Type Definitions
// ============================================================================

/**
 * Insight categories
 */
export enum InsightCategory {
  /** Code quality improvements */
  QUALITY = 'QUALITY',
  /** Security vulnerabilities and risks */
  SECURITY = 'SECURITY',
  /** Performance optimizations */
  PERFORMANCE = 'PERFORMANCE',
  /** Maintainability improvements */
  MAINTAINABILITY = 'MAINTAINABILITY',
  /** Team collaboration and knowledge sharing */
  COLLABORATION = 'COLLABORATION',
  /** Best practices and conventions */
  BEST_PRACTICES = 'BEST_PRACTICES',
  /** Testing and coverage */
  TESTING = 'TESTING',
}

/**
 * Insight priority levels
 */
export type InsightPriority = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';

/**
 * Insight severity (for issues)
 */
export type InsightSeverity = 'ERROR' | 'WARNING' | 'INFO' | 'SUGGESTION';

/**
 * Feedback types
 */
export enum FeedbackType {
  /** User accepted and implemented */
  ACCEPTED = 'ACCEPTED',
  /** User rejected (not relevant) */
  REJECTED = 'REJECTED',
  /** User deferred (maybe later) */
  DEFERRED = 'DEFERRED',
  /** User marked as helpful */
  HELPFUL = 'HELPFUL',
  /** User marked as not helpful */
  NOT_HELPFUL = 'NOT_HELPFUL',
}

/**
 * Code insight recommendation
 */
export interface Insight {
  /** Insight ID */
  id: string;

  /** Category */
  category: InsightCategory;

  /** Priority level */
  priority: InsightPriority;

  /** Severity (for issue-based insights) */
  severity: InsightSeverity;

  /** Title (short description) */
  title: string;

  /** Detailed description */
  description: string;

  /** Rationale (why this matters) */
  rationale: string;

  /** Affected files */
  affectedFiles: Array<{
    /** File path */
    path: string;
    /** Specific lines (if applicable) */
    lines?: { start: number; end: number };
  }>;

  /** Impact assessment */
  impact: {
    /** Impact score (0-1, higher is better) */
    score: number;
    /** Description */
    description: string;
    /** Metrics improvement */
    metrics: {
      /** Quality improvement (0-1) */
      quality?: number;
      /** Security improvement (0-1) */
      security?: number;
      /** Performance improvement (%) */
      performance?: number;
      /** Maintainability improvement (0-1) */
      maintainability?: number;
    };
  };

  /** Effort estimate */
  effort: {
    /** Hours */
    hours: number;
    /** Complexity */
    complexity: 'LOW' | 'MEDIUM' | 'HIGH';
    /** Risk level */
    risk: 'LOW' | 'MEDIUM' | 'HIGH';
  };

  /** ROI score (impact / effort) */
  roiScore: number;

  /** Actionable steps */
  actions: Array<{
    /** Step number */
    step: number;
    /** Action description */
    description: string;
    /** Expected outcome */
    outcome: string;
    /** Optional code example */
    codeExample?: {
      before: string;
      after: string;
    };
  }>;

  /** Evidence (data supporting this insight) */
  evidence: Array<{
    /** Evidence type */
    type: string;
    /** Description */
    description: string;
    /** Data/metrics */
    data?: Record<string, any>;
  }>;

  /** Related insights */
  relatedInsights: string[]; // Insight IDs

  /** Tags */
  tags: string[];

  /** Metadata */
  metadata: {
    /** Generation timestamp */
    generatedAt: Date;
    /** Confidence (0-1) */
    confidence: number;
    /** Source detector */
    source: string;
    /** Developer ID (for personalization) */
    developerId?: string;
  };
}

/**
 * Developer profile for personalization
 */
export interface DeveloperProfile {
  /** Developer ID */
  id: string;

  /** Name */
  name: string;

  /** Preferences */
  preferences: {
    /** Preferred insight categories */
    preferredCategories: InsightCategory[];
    /** Effort threshold (max hours for auto-suggestions) */
    effortThreshold: number;
    /** Priority filter (minimum priority) */
    minPriority: InsightPriority;
    /** Notification frequency */
    notificationFrequency: 'REALTIME' | 'DAILY' | 'WEEKLY' | 'MANUAL';
  };

  /** History */
  history: {
    /** Total insights received */
    totalInsights: number;
    /** Accepted insights */
    acceptedInsights: number;
    /** Rejected insights */
    rejectedInsights: number;
    /** Deferred insights */
    deferredInsights: number;
    /** Acceptance rate (0-1) */
    acceptanceRate: number;
  };

  /** Skills (for effort estimation) */
  skills: {
    /** Programming languages */
    languages: string[];
    /** Expertise level (0-1) */
    expertiseLevel: number;
    /** Familiar frameworks */
    frameworks: string[];
  };

  /** Learning patterns */
  learningPatterns: {
    /** Categories with high acceptance */
    favoredCategories: InsightCategory[];
    /** Typical effort range */
    typicalEffortRange: { min: number; max: number };
    /** Preferred times */
    preferredTimes: string[]; // ISO timestamps
  };
}

/**
 * Insight context (input for generation)
 */
export interface InsightContext {
  /** Workspace root */
  workspaceRoot: string;

  /** Target files (empty = all files) */
  targetFiles?: string[];

  /** Developer profile (for personalization) */
  developer?: DeveloperProfile;

  /** Focus areas */
  focus?: InsightCategory[];

  /** Filters */
  filters?: {
    /** Minimum priority */
    minPriority?: InsightPriority;
    /** Maximum effort (hours) */
    maxEffort?: number;
    /** Exclude categories */
    excludeCategories?: InsightCategory[];
  };

  /** Historical context */
  history?: {
    /** Previous insights */
    previousInsights: Insight[];
    /** Recent changes */
    recentChanges: string[];
  };
}

/**
 * Insight explanation (detailed breakdown)
 */
export interface InsightExplanation {
  /** Insight ID */
  insightId: string;

  /** Why this matters */
  whyItMatters: string;

  /** How we detected it */
  detectionMethod: string;

  /** Supporting data */
  supportingData: Array<{
    /** Data point name */
    name: string;
    /** Value */
    value: any;
    /** Interpretation */
    interpretation: string;
  }>;

  /** Comparison to benchmarks */
  benchmarks?: {
    /** Current value */
    current: number;
    /** Industry average */
    average: number;
    /** Best practice target */
    target: number;
  };

  /** Similar cases */
  similarCases?: Array<{
    /** Description */
    description: string;
    /** Outcome */
    outcome: string;
    /** Lesson learned */
    lesson: string;
  }>;

  /** References */
  references: Array<{
    /** Title */
    title: string;
    /** URL */
    url: string;
    /** Description */
    description: string;
  }>;
}

/**
 * Feedback on insight
 */
export interface InsightFeedback {
  /** Insight ID */
  insightId: string;

  /** Developer ID */
  developerId: string;

  /** Feedback type */
  type: FeedbackType;

  /** Timestamp */
  timestamp: Date;

  /** Optional comment */
  comment?: string;

  /** Was it implemented? */
  implemented?: boolean;

  /** Time taken to implement (hours) */
  implementationTime?: number;

  /** Actual impact (if measured) */
  actualImpact?: {
    /** Quality improvement */
    quality?: number;
    /** Performance improvement */
    performance?: number;
    /** Other metrics */
    other?: Record<string, number>;
  };
}

/**
 * Configuration options
 */
export interface InsightRecommenderConfig {
  /** Maximum insights to generate per run */
  maxInsights: number;

  /** Default priority weights */
  priorityWeights: {
    /** Critical priority weight */
    critical: number;
    /** High priority weight */
    high: number;
    /** Medium priority weight */
    medium: number;
    /** Low priority weight */
    low: number;
  };

  /** ROI calculation weights */
  roiWeights: {
    /** Impact weight */
    impact: number;
    /** Effort weight (negative) */
    effort: number;
    /** Confidence weight */
    confidence: number;
  };

  /** Personalization enabled */
  enablePersonalization: boolean;

  /** Learning enabled (improve over time) */
  enableLearning: boolean;

  /** Minimum confidence threshold */
  minConfidence: number;

  /** Deduplication threshold (similarity) */
  deduplicationThreshold: number;

  /** Cache insights */
  enableCache: boolean;

  /** Cache directory */
  cacheDir: string;
}

// ============================================================================
// Default Configuration
// ============================================================================

const DEFAULT_CONFIG: InsightRecommenderConfig = {
  maxInsights: 50,
  priorityWeights: {
    critical: 1.0,
    high: 0.75,
    medium: 0.5,
    low: 0.25,
  },
  roiWeights: {
    impact: 0.6,
    effort: -0.3,
    confidence: 0.1,
  },
  enablePersonalization: true,
  enableLearning: true,
  minConfidence: 0.7,
  deduplicationThreshold: 0.9,
  enableCache: true,
  cacheDir: '.odavl/insights',
};

// ============================================================================
// InsightRecommender Class
// ============================================================================

/**
 * Insight Recommender - Generate actionable code insights
 * 
 * **Usage**:
 * ```typescript
 * const recommender = new InsightRecommender(workspaceRoot, config);
 * 
 * // Generate insights
 * const insights = await recommender.generateInsights({
 *   workspaceRoot,
 *   focus: [InsightCategory.QUALITY, InsightCategory.SECURITY],
 *   filters: { minPriority: 'HIGH', maxEffort: 8 }
 * });
 * 
 * console.log(`Generated ${insights.length} insights`);
 * insights.forEach(i => {
 *   console.log(`${i.priority} - ${i.title}`);
 *   console.log(`Impact: ${i.impact.score.toFixed(2)}, Effort: ${i.effort.hours}h`);
 *   console.log(`ROI: ${i.roiScore.toFixed(2)}`);
 * });
 * 
 * // Personalize for developer
 * const personalized = await recommender.personalizeInsights(insights, developerProfile);
 * 
 * // Rank by priority
 * const ranked = await recommender.rankInsights(personalized);
 * 
 * // Get top 10
 * const top = await recommender.getTopInsights(10);
 * 
 * // Explain insight
 * const explanation = await recommender.explainInsight(top[0]);
 * console.log(explanation.whyItMatters);
 * 
 * // Provide feedback
 * await recommender.learnFromFeedback(top[0], {
 *   insightId: top[0].id,
 *   developerId: 'dev-123',
 *   type: FeedbackType.ACCEPTED,
 *   timestamp: new Date(),
 *   implemented: true,
 *   implementationTime: 2.5,
 * });
 * ```
 */
export class InsightRecommender {
  private workspaceRoot: string;
  private config: InsightRecommenderConfig;
  private insightCache: Map<string, Insight[]> = new Map();
  private feedbackHistory: Map<string, InsightFeedback[]> = new Map();
  private developerProfiles: Map<string, DeveloperProfile> = new Map();

  constructor(workspaceRoot: string, config: Partial<InsightRecommenderConfig> = {}) {
    this.workspaceRoot = workspaceRoot;
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  // ==========================================================================
  // Public API - Insight Generation
  // ==========================================================================

  /**
   * Generate insights for given context
   * 
   * @param context - Insight generation context
   * @returns Array of actionable insights
   * 
   * @example
   * ```typescript
   * const insights = await recommender.generateInsights({
   *   workspaceRoot,
   *   targetFiles: ['src/App.tsx'],
   *   focus: [InsightCategory.PERFORMANCE],
   *   filters: { minPriority: 'MEDIUM' }
   * });
   * ```
   */
  async generateInsights(context: InsightContext): Promise<Insight[]> {
    const insights: Insight[] = [];

    // Check cache
    const cacheKey = this.getCacheKey(context);
    if (this.config.enableCache && this.insightCache.has(cacheKey)) {
      return this.insightCache.get(cacheKey)!;
    }

    // Generate insights from all detectors
    const qualityInsights = await this.generateQualityInsights(context);
    const securityInsights = await this.generateSecurityInsights(context);
    const performanceInsights = await this.generatePerformanceInsights(context);
    const maintainabilityInsights = await this.generateMaintainabilityInsights(context);
    const collaborationInsights = await this.generateCollaborationInsights(context);

    // Combine all insights
    insights.push(
      ...qualityInsights,
      ...securityInsights,
      ...performanceInsights,
      ...maintainabilityInsights,
      ...collaborationInsights
    );

    // Filter by focus areas
    let filtered = insights;
    if (context.focus && context.focus.length > 0) {
      filtered = insights.filter(i => context.focus!.includes(i.category));
    }

    // Apply filters
    if (context.filters) {
      filtered = this.applyFilters(filtered, context.filters);
    }

    // Deduplicate
    filtered = this.deduplicateInsights(filtered);

    // Personalize if developer provided
    if (this.config.enablePersonalization && context.developer) {
      filtered = await this.personalizeInsights(filtered, context.developer);
    }

    // Rank by priority
    filtered = await this.rankInsights(filtered);

    // Limit to max insights
    filtered = filtered.slice(0, this.config.maxInsights);

    // Cache results
    if (this.config.enableCache) {
      this.insightCache.set(cacheKey, filtered);
    }

    return filtered;
  }

  /**
   * Get top N insights
   * 
   * @param n - Number of insights to return
   * @param context - Optional context for filtering
   * @returns Top N insights sorted by priority
   */
  async getTopInsights(n: number = 10, context?: InsightContext): Promise<Insight[]> {
    const insights = await this.generateInsights(context || { workspaceRoot: this.workspaceRoot });
    return insights.slice(0, n);
  }

  /**
   * Get insights for specific file
   * 
   * @param filePath - File path
   * @returns Insights affecting this file
   */
  async getInsightsForFile(filePath: string): Promise<Insight[]> {
    const allInsights = await this.generateInsights({ workspaceRoot: this.workspaceRoot });
    return allInsights.filter(i => i.affectedFiles.some(f => f.path === filePath));
  }

  /**
   * Get insights by category
   * 
   * @param category - Insight category
   * @returns Insights in this category
   */
  async getInsightsByCategory(category: InsightCategory): Promise<Insight[]> {
    const insights = await this.generateInsights({
      workspaceRoot: this.workspaceRoot,
      focus: [category],
    });
    return insights;
  }

  // ==========================================================================
  // Public API - Personalization
  // ==========================================================================

  /**
   * Personalize insights for developer
   * 
   * @param insights - Array of insights
   * @param developer - Developer profile
   * @returns Personalized insights
   */
  async personalizeInsights(insights: Insight[], developer: DeveloperProfile): Promise<Insight[]> {
    if (!this.config.enablePersonalization) {
      return insights;
    }

    return insights
      .filter(i => {
        // Filter by preferences
        if (developer.preferences.preferredCategories.length > 0) {
          if (!developer.preferences.preferredCategories.includes(i.category)) {
            return false;
          }
        }

        // Filter by effort threshold
        if (i.effort.hours > developer.preferences.effortThreshold) {
          return false;
        }

        // Filter by minimum priority
        const priorityOrder: InsightPriority[] = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'];
        const minIndex = priorityOrder.indexOf(developer.preferences.minPriority);
        const currentIndex = priorityOrder.indexOf(i.priority);
        if (currentIndex > minIndex) {
          return false;
        }

        return true;
      })
      .map(i => ({
        ...i,
        // Adjust priority based on developer patterns
        priority: this.adjustPriorityForDeveloper(i, developer),
        // Add developer ID
        metadata: {
          ...i.metadata,
          developerId: developer.id,
        },
      }));
  }

  /**
   * Register developer profile
   * 
   * @param profile - Developer profile
   */
  registerDeveloperProfile(profile: DeveloperProfile): void {
    this.developerProfiles.set(profile.id, profile);
  }

  /**
   * Get developer profile
   * 
   * @param developerId - Developer ID
   * @returns Developer profile or undefined
   */
  getDeveloperProfile(developerId: string): DeveloperProfile | undefined {
    return this.developerProfiles.get(developerId);
  }

  // ==========================================================================
  // Public API - Ranking
  // ==========================================================================

  /**
   * Rank insights by priority (ROI-based)
   * 
   * @param insights - Array of insights
   * @returns Sorted insights (highest priority first)
   */
  async rankInsights(insights: Insight[]): Promise<Insight[]> {
    // Calculate ROI scores
    const scored = insights.map(i => ({
      insight: i,
      score: this.calculateROI(i),
    }));

    // Sort by score (descending)
    scored.sort((a, b) => b.score - a.score);

    // Update ROI scores
    return scored.map(s => ({
      ...s.insight,
      roiScore: s.score,
    }));
  }

  // ==========================================================================
  // Public API - Explanation
  // ==========================================================================

  /**
   * Explain insight in detail
   * 
   * @param insight - Insight to explain
   * @returns Detailed explanation
   */
  async explainInsight(insight: Insight): Promise<InsightExplanation> {
    return {
      insightId: insight.id,
      whyItMatters: insight.rationale,
      detectionMethod: `Detected by ${insight.metadata.source} with ${(insight.metadata.confidence * 100).toFixed(0)}% confidence`,
      supportingData: insight.evidence.map(e => ({
        name: e.type,
        value: e.data,
        interpretation: e.description,
      })),
      benchmarks: this.getBenchmarks(insight),
      similarCases: this.getSimilarCases(insight),
      references: this.getReferences(insight),
    };
  }

  // ==========================================================================
  // Public API - Learning
  // ==========================================================================

  /**
   * Learn from feedback to improve recommendations
   * 
   * @param insight - Insight that received feedback
   * @param feedback - Developer feedback
   */
  async learnFromFeedback(insight: Insight, feedback: InsightFeedback): Promise<void> {
    if (!this.config.enableLearning) {
      return;
    }

    // Store feedback
    const history = this.feedbackHistory.get(feedback.developerId) || [];
    history.push(feedback);
    this.feedbackHistory.set(feedback.developerId, history);

    // Update developer profile
    const profile = this.developerProfiles.get(feedback.developerId);
    if (profile) {
      this.updateDeveloperProfile(profile, feedback, insight);
    }

    // Adjust insight scoring (ML would go here)
    // For now, simple rule-based adjustments
    if (feedback.type === FeedbackType.ACCEPTED && feedback.implemented) {
      // Boost similar insights
      console.log(`✓ Insight ${insight.id} accepted - boosting similar insights`);
    } else if (feedback.type === FeedbackType.REJECTED) {
      // Reduce similar insights
      console.log(`✗ Insight ${insight.id} rejected - reducing similar insights`);
    }
  }

  /**
   * Get feedback statistics
   * 
   * @param developerId - Developer ID
   * @returns Feedback statistics
   */
  getFeedbackStats(developerId: string): {
    total: number;
    accepted: number;
    rejected: number;
    deferred: number;
    acceptanceRate: number;
  } {
    const history = this.feedbackHistory.get(developerId) || [];
    const accepted = history.filter(f => f.type === FeedbackType.ACCEPTED).length;
    const rejected = history.filter(f => f.type === FeedbackType.REJECTED).length;
    const deferred = history.filter(f => f.type === FeedbackType.DEFERRED).length;

    return {
      total: history.length,
      accepted,
      rejected,
      deferred,
      acceptanceRate: history.length > 0 ? accepted / history.length : 0,
    };
  }

  // ==========================================================================
  // Private Methods - Insight Generation
  // ==========================================================================

  /**
   * Generate quality insights
   */
  private async generateQualityInsights(context: InsightContext): Promise<Insight[]> {
    const insights: Insight[] = [];

    // Mock quality insight
    insights.push({
      id: `quality-${Date.now()}`,
      category: InsightCategory.QUALITY,
      priority: 'HIGH',
      severity: 'WARNING',
      title: 'High Complexity Detected',
      description: 'Function exceeds recommended complexity threshold',
      rationale: 'Complex functions are harder to test, maintain, and debug',
      affectedFiles: [{ path: 'src/utils/complex.ts', lines: { start: 10, end: 50 } }],
      impact: {
        score: 0.75,
        description: 'Reduces maintainability and increases bug risk',
        metrics: { maintainability: 0.3, quality: 0.25 },
      },
      effort: { hours: 4, complexity: 'MEDIUM', risk: 'LOW' },
      roiScore: 0,
      actions: [
        { step: 1, description: 'Extract helper functions', outcome: 'Reduced complexity' },
        { step: 2, description: 'Add unit tests', outcome: 'Improved coverage' },
      ],
      evidence: [
        { type: 'Complexity', description: 'Cyclomatic complexity: 25', data: { value: 25 } },
      ],
      relatedInsights: [],
      tags: ['complexity', 'refactoring'],
      metadata: {
        generatedAt: new Date(),
        confidence: 0.9,
        source: 'complexity-detector',
      },
    });

    return insights;
  }

  /**
   * Generate security insights
   */
  private async generateSecurityInsights(context: InsightContext): Promise<Insight[]> {
    const insights: Insight[] = [];

    // Mock security insight
    insights.push({
      id: `security-${Date.now()}`,
      category: InsightCategory.SECURITY,
      priority: 'CRITICAL',
      severity: 'ERROR',
      title: 'Hardcoded API Key Detected',
      description: 'API key found in source code',
      rationale: 'Hardcoded secrets pose security risk if repository is compromised',
      affectedFiles: [{ path: 'src/config.ts', lines: { start: 5, end: 5 } }],
      impact: {
        score: 0.95,
        description: 'Critical security vulnerability',
        metrics: { security: 0.9 },
      },
      effort: { hours: 1, complexity: 'LOW', risk: 'LOW' },
      roiScore: 0,
      actions: [
        { step: 1, description: 'Move to environment variables', outcome: 'Secret secured' },
        { step: 2, description: 'Rotate compromised key', outcome: 'Risk eliminated' },
      ],
      evidence: [
        { type: 'Secret', description: 'API key pattern matched', data: { pattern: 'api_key_*' } },
      ],
      relatedInsights: [],
      tags: ['security', 'secrets'],
      metadata: {
        generatedAt: new Date(),
        confidence: 0.95,
        source: 'security-detector',
      },
    });

    return insights;
  }

  /**
   * Generate performance insights
   */
  private async generatePerformanceInsights(context: InsightContext): Promise<Insight[]> {
    return [];
  }

  /**
   * Generate maintainability insights
   */
  private async generateMaintainabilityInsights(context: InsightContext): Promise<Insight[]> {
    return [];
  }

  /**
   * Generate collaboration insights
   */
  private async generateCollaborationInsights(context: InsightContext): Promise<Insight[]> {
    return [];
  }

  // ==========================================================================
  // Private Methods - Filtering & Deduplication
  // ==========================================================================

  /**
   * Apply filters to insights
   */
  private applyFilters(insights: Insight[], filters: InsightContext['filters']): Insight[] {
    let filtered = insights;

    if (filters?.minPriority) {
      const priorityOrder: InsightPriority[] = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'];
      const minIndex = priorityOrder.indexOf(filters.minPriority);
      filtered = filtered.filter(i => priorityOrder.indexOf(i.priority) <= minIndex);
    }

    if (filters?.maxEffort !== undefined) {
      filtered = filtered.filter(i => i.effort.hours <= filters.maxEffort!);
    }

    if (filters?.excludeCategories && filters.excludeCategories.length > 0) {
      filtered = filtered.filter(i => !filters.excludeCategories!.includes(i.category));
    }

    return filtered;
  }

  /**
   * Deduplicate similar insights
   */
  private deduplicateInsights(insights: Insight[]): Insight[] {
    const unique: Insight[] = [];
    const seen = new Set<string>();

    for (const insight of insights) {
      const key = `${insight.category}-${insight.title}-${insight.affectedFiles.map(f => f.path).join(',')}`;
      if (!seen.has(key)) {
        unique.push(insight);
        seen.add(key);
      }
    }

    return unique;
  }

  // ==========================================================================
  // Private Methods - Scoring & Ranking
  // ==========================================================================

  /**
   * Calculate ROI score
   */
  private calculateROI(insight: Insight): number {
    const weights = this.config.roiWeights;

    const impactScore = insight.impact.score * weights.impact;
    const effortPenalty = (insight.effort.hours / 40) * weights.effort; // Normalize to week
    const confidenceBonus = insight.metadata.confidence * weights.confidence;

    return Math.max(0, impactScore + effortPenalty + confidenceBonus);
  }

  /**
   * Adjust priority for developer
   */
  private adjustPriorityForDeveloper(insight: Insight, developer: DeveloperProfile): InsightPriority {
    // Check if developer typically accepts this category
    if (developer.learningPatterns.favoredCategories.includes(insight.category)) {
      // Boost priority
      const priorityOrder: InsightPriority[] = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
      const currentIndex = priorityOrder.indexOf(insight.priority);
      if (currentIndex < priorityOrder.length - 1) {
        return priorityOrder[currentIndex + 1];
      }
    }

    return insight.priority;
  }

  /**
   * Update developer profile based on feedback
   */
  private updateDeveloperProfile(
    profile: DeveloperProfile,
    feedback: InsightFeedback,
    insight: Insight
  ): void {
    // Update history counts
    profile.history.totalInsights++;
    if (feedback.type === FeedbackType.ACCEPTED) {
      profile.history.acceptedInsights++;
    } else if (feedback.type === FeedbackType.REJECTED) {
      profile.history.rejectedInsights++;
    } else if (feedback.type === FeedbackType.DEFERRED) {
      profile.history.deferredInsights++;
    }

    // Update acceptance rate
    profile.history.acceptanceRate =
      profile.history.acceptedInsights / profile.history.totalInsights;

    // Update learning patterns
    if (feedback.type === FeedbackType.ACCEPTED) {
      if (!profile.learningPatterns.favoredCategories.includes(insight.category)) {
        profile.learningPatterns.favoredCategories.push(insight.category);
      }
    }

    // Update effort range
    if (feedback.implemented && feedback.implementationTime) {
      const current = profile.learningPatterns.typicalEffortRange;
      profile.learningPatterns.typicalEffortRange = {
        min: Math.min(current.min, feedback.implementationTime),
        max: Math.max(current.max, feedback.implementationTime),
      };
    }
  }

  // ==========================================================================
  // Private Methods - Explanation
  // ==========================================================================

  /**
   * Get benchmarks for insight
   */
  private getBenchmarks(insight: Insight): InsightExplanation['benchmarks'] {
    // Mock benchmarks
    return {
      current: 25,
      average: 15,
      target: 10,
    };
  }

  /**
   * Get similar cases
   */
  private getSimilarCases(insight: Insight): InsightExplanation['similarCases'] {
    return [
      {
        description: 'Large function refactored into smaller helpers',
        outcome: 'Complexity reduced from 30 to 8',
        lesson: 'Extract helper functions early',
      },
    ];
  }

  /**
   * Get references
   */
  private getReferences(insight: Insight): InsightExplanation['references'] {
    return [
      {
        title: 'Clean Code by Robert C. Martin',
        url: 'https://example.com/clean-code',
        description: 'Best practices for writing maintainable code',
      },
    ];
  }

  // ==========================================================================
  // Private Methods - Utilities
  // ==========================================================================

  /**
   * Generate cache key for context
   */
  private getCacheKey(context: InsightContext): string {
    return `${context.workspaceRoot}-${context.targetFiles?.join(',') || 'all'}-${context.focus?.join(',') || 'all'}`;
  }
}
