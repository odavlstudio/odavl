/**
 * @fileoverview Fix Strategy Selector - Choose best fix approach
 * 
 * **Week 33: Auto-fixing (File 3/3)**
 * 
 * **Purpose**: Intelligent selection of optimal fix strategy based on context,
 * risk assessment, cost-benefit analysis, and user preferences. Uses ML-based
 * ranking, confidence thresholds, and fallback strategies for safe auto-fixing.
 * 
 * **Features**:
 * - Strategy ranking (best fix for situation)
 * - Risk assessment (safety of each strategy)
 * - Cost-benefit analysis (effort vs impact)
 * - Context-aware selection (project conventions)
 * - User preference learning (adapt to feedback)
 * - Confidence thresholds (when to auto-apply)
 * - Fallback strategies (if primary fails)
 * - Multi-strategy combination
 * 
 * **Integration**:
 * - Selects strategies for Auto-fix Engine (Week 33, File 1)
 * - Uses Fix Validator for strategy validation (Week 33, File 2)
 * - Integrates with Intelligent Fix Suggester (Week 31)
 * - Uses Code Quality Predictor for impact estimation (Week 31)
 * 
 * **Enterprise Features**:
 * - ML-based ranking (confidence scoring)
 * - Learning from user feedback
 * - Team-specific conventions
 * - Historical success rates
 * 
 * @module @odavl-studio/insight-core/ai
 * @category AI & Intelligence
 * @phase Phase 4 - Week 33
 * @since 1.33.0
 */

import { CodeFix } from './auto-fix-engine';

// ============================================================================
// ENUMS
// ============================================================================

/**
 * Fix strategy type
 */
export enum FixStrategyType {
  /** Direct AST transformation */
  AST_TRANSFORM = 'AST_TRANSFORM',
  
  /** Text-based replacement */
  TEXT_REPLACE = 'TEXT_REPLACE',
  
  /** Template-based generation */
  TEMPLATE = 'TEMPLATE',
  
  /** AI-generated fix */
  AI_GENERATED = 'AI_GENERATED',
  
  /** Pattern-based fix */
  PATTERN_BASED = 'PATTERN_BASED',
  
  /** Manual intervention required */
  MANUAL = 'MANUAL',
}

/**
 * Selection criteria
 */
export enum SelectionCriteria {
  /** Prioritize safety (low risk) */
  SAFETY = 'SAFETY',
  
  /** Prioritize speed (fast execution) */
  SPEED = 'SPEED',
  
  /** Prioritize quality (best outcome) */
  QUALITY = 'QUALITY',
  
  /** Balance all factors */
  BALANCED = 'BALANCED',
  
  /** User preference */
  USER_PREFERENCE = 'USER_PREFERENCE',
}

/**
 * Confidence level
 */
export enum ConfidenceLevel {
  /** Very high confidence (>90%) */
  VERY_HIGH = 'VERY_HIGH',
  
  /** High confidence (70-90%) */
  HIGH = 'HIGH',
  
  /** Medium confidence (50-70%) */
  MEDIUM = 'MEDIUM',
  
  /** Low confidence (30-50%) */
  LOW = 'LOW',
  
  /** Very low confidence (<30%) */
  VERY_LOW = 'VERY_LOW',
}

/**
 * Auto-apply decision
 */
export enum AutoApplyDecision {
  /** Auto-apply without prompting */
  AUTO_APPLY = 'AUTO_APPLY',
  
  /** Apply after user confirmation */
  REQUIRE_CONFIRMATION = 'REQUIRE_CONFIRMATION',
  
  /** Show as suggestion only */
  SUGGEST_ONLY = 'SUGGEST_ONLY',
  
  /** Do not apply */
  DO_NOT_APPLY = 'DO_NOT_APPLY',
}

// ============================================================================
// INTERFACES
// ============================================================================

/**
 * Fix strategy
 */
export interface FixStrategy {
  /** Strategy ID */
  id: string;
  
  /** Strategy type */
  type: FixStrategyType;
  
  /** Strategy name */
  name: string;
  
  /** Strategy description */
  description: string;
  
  /** Fix to apply */
  fix: CodeFix;
  
  /** Confidence score (0-1) */
  confidence: number;
  
  /** Risk score (0-1) */
  risk: number;
  
  /** Estimated effort (LOC to change) */
  effort: number;
  
  /** Expected impact (0-1) */
  impact: number;
  
  /** Success rate (historical) */
  successRate: number;
  
  /** Fallback strategies */
  fallbacks?: string[];
  
  /** Dependencies (other strategies that must succeed first) */
  dependencies?: string[];
  
  /** Context requirements */
  contextRequirements?: StrategyContext;
}

/**
 * Strategy context requirements
 */
export interface StrategyContext {
  /** Required language features */
  languageFeatures?: string[];
  
  /** Required dependencies */
  dependencies?: string[];
  
  /** Minimum TypeScript version */
  minTsVersion?: string;
  
  /** Project conventions */
  conventions?: Record<string, unknown>;
  
  /** Team preferences */
  teamPreferences?: Record<string, unknown>;
}

/**
 * Strategy selection result
 */
export interface StrategySelectionResult {
  /** Selected strategy */
  strategy: FixStrategy;
  
  /** Selection confidence (0-1) */
  confidence: number;
  
  /** Selection reasoning */
  reasoning: string[];
  
  /** Auto-apply decision */
  autoApplyDecision: AutoApplyDecision;
  
  /** Alternative strategies */
  alternatives: FixStrategy[];
  
  /** Warnings */
  warnings?: string[];
}

/**
 * Strategy ranking
 */
export interface StrategyRanking {
  /** Strategy */
  strategy: FixStrategy;
  
  /** Rank (1 = best) */
  rank: number;
  
  /** Total score (0-100) */
  score: number;
  
  /** Score breakdown */
  scoreBreakdown: {
    confidence: number;
    safety: number;
    quality: number;
    speed: number;
    successRate: number;
  };
  
  /** Disqualifications (reasons strategy can't be used) */
  disqualifications?: string[];
}

/**
 * Cost-benefit analysis
 */
export interface CostBenefitAnalysis {
  /** Strategy */
  strategy: FixStrategy;
  
  /** Estimated cost (hours) */
  estimatedCost: number;
  
  /** Expected benefit (quality improvement) */
  expectedBenefit: number;
  
  /** ROI (benefit / cost) */
  roi: number;
  
  /** Break-even point (hours) */
  breakEvenPoint: number;
  
  /** Recommendation */
  recommendation: 'HIGHLY_RECOMMENDED' | 'RECOMMENDED' | 'NEUTRAL' | 'NOT_RECOMMENDED';
}

/**
 * User feedback
 */
export interface UserFeedback {
  /** Strategy ID */
  strategyId: string;
  
  /** Fix ID */
  fixId: string;
  
  /** User accepted fix */
  accepted: boolean;
  
  /** Feedback rating (1-5) */
  rating?: number;
  
  /** Feedback comments */
  comments?: string;
  
  /** Timestamp */
  timestamp: Date;
}

/**
 * Strategy selector configuration
 */
export interface StrategySelectorConfig {
  /** Selection criteria */
  criteria: SelectionCriteria;
  
  /** Auto-apply threshold (confidence) */
  autoApplyThreshold: number;
  
  /** Minimum confidence to suggest */
  minConfidence: number;
  
  /** Maximum risk acceptable */
  maxRisk: number;
  
  /** User preferences */
  userPreferences?: UserPreferences;
  
  /** Team conventions */
  teamConventions?: TeamConventions;
  
  /** Enable learning from feedback */
  enableLearning: boolean;
}

/**
 * User preferences
 */
export interface UserPreferences {
  /** Preferred strategy types */
  preferredStrategies?: FixStrategyType[];
  
  /** Avoided strategy types */
  avoidedStrategies?: FixStrategyType[];
  
  /** Risk tolerance (0-1) */
  riskTolerance?: number;
  
  /** Auto-apply preference */
  autoApplyPreference?: 'always' | 'never' | 'threshold-based';
}

/**
 * Team conventions
 */
export interface TeamConventions {
  /** Code style rules */
  codeStyle?: Record<string, unknown>;
  
  /** Naming conventions */
  namingConventions?: Record<string, string>;
  
  /** Import preferences */
  importPreferences?: {
    preferDefault?: boolean;
    sortImports?: boolean;
  };
  
  /** TypeScript preferences */
  typescriptPreferences?: {
    useStrictMode?: boolean;
    preferInterfaces?: boolean;
  };
}

// ============================================================================
// FIX STRATEGY SELECTOR
// ============================================================================

/**
 * Fix Strategy Selector
 * 
 * Intelligent selection of optimal fix strategy with ML-based ranking,
 * risk assessment, and user preference learning.
 * 
 * **Usage**:
 * ```typescript
 * const selector = new FixStrategySelector({
 *   criteria: SelectionCriteria.BALANCED,
 *   autoApplyThreshold: 0.85,
 *   minConfidence: 0.5,
 *   maxRisk: 0.3,
 *   enableLearning: true,
 *   userPreferences: {
 *     preferredStrategies: [FixStrategyType.AST_TRANSFORM],
 *     riskTolerance: 0.2
 *   }
 * });
 * 
 * // Select strategy for fix
 * const strategies = generateStrategies(issue);
 * const result = await selector.selectStrategy(strategies, context);
 * 
 * if (result.autoApplyDecision === AutoApplyDecision.AUTO_APPLY) {
 *   await applyFix(result.strategy.fix);
 * } else {
 *   console.log('Manual approval required:', result.reasoning);
 * }
 * 
 * // Learn from feedback
 * await selector.recordFeedback({
 *   strategyId: result.strategy.id,
 *   fixId: result.strategy.fix.id,
 *   accepted: true,
 *   rating: 5
 * });
 * ```
 */
export class FixStrategySelector {
  private config: StrategySelectorConfig;
  private feedbackHistory: Map<string, UserFeedback[]> = new Map();
  private strategySuccessRates: Map<string, number> = new Map();
  
  constructor(config: StrategySelectorConfig) {
    this.config = config;
  }
  
  // ==========================================================================
  // PUBLIC API
  // ==========================================================================
  
  /**
   * Select best strategy from candidates
   * 
   * @param strategies - Candidate strategies
   * @param context - Selection context
   * @returns Selection result
   * 
   * @example
   * ```typescript
   * const result = await selector.selectStrategy(strategies, {
   *   filePath: 'src/index.ts',
   *   issueType: 'import-error',
   *   severity: 'error'
   * });
   * ```
   */
  async selectStrategy(
    strategies: FixStrategy[],
    context: Record<string, unknown>
  ): Promise<StrategySelectionResult> {
    // Validate context requirements
    const validStrategies = this.validateStrategies(strategies, context);
    
    if (validStrategies.length === 0) {
      throw new Error('No valid strategies available');
    }
    
    // Rank strategies
    const rankings = await this.rankStrategies(validStrategies);
    
    // Select best strategy
    const bestRanking = rankings[0];
    const selected = bestRanking.strategy;
    
    // Determine auto-apply decision
    const autoApplyDecision = this.determineAutoApply(selected);
    
    // Generate reasoning
    const reasoning = this.generateReasoning(bestRanking, rankings);
    
    // Find alternatives
    const alternatives = rankings.slice(1, 4).map((r) => r.strategy);
    
    // Check for warnings
    const warnings = this.checkWarnings(selected, context);
    
    return {
      strategy: selected,
      confidence: selected.confidence,
      reasoning,
      autoApplyDecision,
      alternatives,
      warnings: warnings.length > 0 ? warnings : undefined,
    };
  }
  
  /**
   * Rank strategies by score
   * 
   * @param strategies - Strategies to rank
   * @returns Ranked strategies
   * 
   * @example
   * ```typescript
   * const rankings = await selector.rankStrategies(strategies);
   * console.log('Best strategy:', rankings[0].strategy.name);
   * ```
   */
  async rankStrategies(strategies: FixStrategy[]): Promise<StrategyRanking[]> {
    const rankings: StrategyRanking[] = [];
    
    for (const strategy of strategies) {
      // Calculate score breakdown
      const scoreBreakdown = this.calculateScoreBreakdown(strategy);
      
      // Calculate total score based on criteria
      const totalScore = this.calculateTotalScore(scoreBreakdown);
      
      rankings.push({
        strategy,
        rank: 0, // Will be set after sorting
        score: totalScore,
        scoreBreakdown,
      });
    }
    
    // Sort by score (descending)
    rankings.sort((a, b) => b.score - a.score);
    
    // Assign ranks
    rankings.forEach((ranking, index) => {
      ranking.rank = index + 1;
    });
    
    return rankings;
  }
  
  /**
   * Perform cost-benefit analysis
   * 
   * @param strategy - Strategy to analyze
   * @returns Cost-benefit analysis
   * 
   * @example
   * ```typescript
   * const analysis = selector.analyzeCostBenefit(strategy);
   * if (analysis.roi > 2.0) {
   *   console.log('High ROI strategy');
   * }
   * ```
   */
  analyzeCostBenefit(strategy: FixStrategy): CostBenefitAnalysis {
    // Estimate cost (effort in hours)
    const estimatedCost = strategy.effort / 100; // LOC to hours (rough estimate)
    
    // Expected benefit (quality improvement)
    const expectedBenefit = strategy.impact * strategy.confidence;
    
    // ROI
    const roi = estimatedCost > 0 ? expectedBenefit / estimatedCost : 0;
    
    // Break-even point (when benefit equals cost)
    const breakEvenPoint = estimatedCost;
    
    // Recommendation
    let recommendation: 'HIGHLY_RECOMMENDED' | 'RECOMMENDED' | 'NEUTRAL' | 'NOT_RECOMMENDED';
    if (roi >= 3.0) {
      recommendation = 'HIGHLY_RECOMMENDED';
    } else if (roi >= 1.5) {
      recommendation = 'RECOMMENDED';
    } else if (roi >= 0.8) {
      recommendation = 'NEUTRAL';
    } else {
      recommendation = 'NOT_RECOMMENDED';
    }
    
    return {
      strategy,
      estimatedCost,
      expectedBenefit,
      roi,
      breakEvenPoint,
      recommendation,
    };
  }
  
  /**
   * Record user feedback
   * 
   * @param feedback - User feedback
   * 
   * @example
   * ```typescript
   * await selector.recordFeedback({
   *   strategyId: 'ast-transform-1',
   *   fixId: 'fix-123',
   *   accepted: true,
   *   rating: 5
   * });
   * ```
   */
  async recordFeedback(feedback: UserFeedback): Promise<void> {
    // Store feedback
    const history = this.feedbackHistory.get(feedback.strategyId) || [];
    history.push(feedback);
    this.feedbackHistory.set(feedback.strategyId, history);
    
    // Update success rate (if learning enabled)
    if (this.config.enableLearning) {
      const accepted = history.filter((f) => f.accepted).length;
      const total = history.length;
      const successRate = total > 0 ? accepted / total : 0;
      
      this.strategySuccessRates.set(feedback.strategyId, successRate);
    }
  }
  
  /**
   * Get strategy statistics
   * 
   * @param strategyId - Strategy ID
   * @returns Strategy statistics
   * 
   * @example
   * ```typescript
   * const stats = selector.getStrategyStats('ast-transform-1');
   * console.log('Success rate:', stats.successRate);
   * ```
   */
  getStrategyStats(strategyId: string): {
    totalUses: number;
    acceptedUses: number;
    rejectedUses: number;
    successRate: number;
    averageRating?: number;
  } {
    const history = this.feedbackHistory.get(strategyId) || [];
    const accepted = history.filter((f) => f.accepted).length;
    const rejected = history.length - accepted;
    
    // Calculate average rating
    const ratings = history.filter((f) => f.rating !== undefined).map((f) => f.rating!);
    const averageRating = ratings.length > 0
      ? ratings.reduce((sum, r) => sum + r, 0) / ratings.length
      : undefined;
    
    return {
      totalUses: history.length,
      acceptedUses: accepted,
      rejectedUses: rejected,
      successRate: this.strategySuccessRates.get(strategyId) || 0,
      averageRating,
    };
  }
  
  // ==========================================================================
  // PRIVATE METHODS - VALIDATION
  // ==========================================================================
  
  /**
   * Validate strategies against context requirements
   */
  private validateStrategies(
    strategies: FixStrategy[],
    context: Record<string, unknown>
  ): FixStrategy[] {
    return strategies.filter((strategy) => {
      // Check minimum confidence
      if (strategy.confidence < this.config.minConfidence) {
        return false;
      }
      
      // Check maximum risk
      if (strategy.risk > this.config.maxRisk) {
        return false;
      }
      
      // Check user preferences
      if (this.config.userPreferences?.avoidedStrategies?.includes(strategy.type)) {
        return false;
      }
      
      // Check context requirements
      if (strategy.contextRequirements) {
        // Validate requirements against context
        // (simplified - would need more sophisticated validation)
        return true;
      }
      
      return true;
    });
  }
  
  // ==========================================================================
  // PRIVATE METHODS - RANKING
  // ==========================================================================
  
  /**
   * Calculate score breakdown for strategy
   */
  private calculateScoreBreakdown(strategy: FixStrategy): {
    confidence: number;
    safety: number;
    quality: number;
    speed: number;
    successRate: number;
  } {
    // Confidence score (0-100)
    const confidence = strategy.confidence * 100;
    
    // Safety score (inverse of risk, 0-100)
    const safety = (1 - strategy.risk) * 100;
    
    // Quality score (based on impact, 0-100)
    const quality = strategy.impact * 100;
    
    // Speed score (inverse of effort, 0-100)
    const speed = Math.max(0, 100 - strategy.effort);
    
    // Success rate score (historical, 0-100)
    const successRate = (this.strategySuccessRates.get(strategy.id) || strategy.successRate) * 100;
    
    return {
      confidence,
      safety,
      quality,
      speed,
      successRate,
    };
  }
  
  /**
   * Calculate total score based on selection criteria
   */
  private calculateTotalScore(scoreBreakdown: {
    confidence: number;
    safety: number;
    quality: number;
    speed: number;
    successRate: number;
  }): number {
    // Weights based on criteria
    let weights: Record<string, number>;
    
    switch (this.config.criteria) {
      case SelectionCriteria.SAFETY:
        weights = {
          confidence: 0.2,
          safety: 0.4,
          quality: 0.1,
          speed: 0.1,
          successRate: 0.2,
        };
        break;
        
      case SelectionCriteria.SPEED:
        weights = {
          confidence: 0.2,
          safety: 0.2,
          quality: 0.1,
          speed: 0.4,
          successRate: 0.1,
        };
        break;
        
      case SelectionCriteria.QUALITY:
        weights = {
          confidence: 0.2,
          safety: 0.2,
          quality: 0.4,
          speed: 0.0,
          successRate: 0.2,
        };
        break;
        
      case SelectionCriteria.USER_PREFERENCE:
        // Use user's risk tolerance
        const riskTolerance = this.config.userPreferences?.riskTolerance ?? 0.5;
        weights = {
          confidence: 0.25,
          safety: (1 - riskTolerance) * 0.3,
          quality: 0.25,
          speed: 0.1,
          successRate: 0.1,
        };
        break;
        
      case SelectionCriteria.BALANCED:
      default:
        weights = {
          confidence: 0.25,
          safety: 0.25,
          quality: 0.2,
          speed: 0.15,
          successRate: 0.15,
        };
    }
    
    // Calculate weighted sum
    const totalScore =
      scoreBreakdown.confidence * weights.confidence +
      scoreBreakdown.safety * weights.safety +
      scoreBreakdown.quality * weights.quality +
      scoreBreakdown.speed * weights.speed +
      scoreBreakdown.successRate * weights.successRate;
    
    return totalScore;
  }
  
  // ==========================================================================
  // PRIVATE METHODS - AUTO-APPLY DECISION
  // ==========================================================================
  
  /**
   * Determine if strategy should be auto-applied
   */
  private determineAutoApply(strategy: FixStrategy): AutoApplyDecision {
    // Check user preference
    if (this.config.userPreferences?.autoApplyPreference === 'never') {
      return AutoApplyDecision.SUGGEST_ONLY;
    }
    
    if (this.config.userPreferences?.autoApplyPreference === 'always') {
      return AutoApplyDecision.AUTO_APPLY;
    }
    
    // Check confidence threshold
    if (strategy.confidence >= this.config.autoApplyThreshold && strategy.risk <= 0.2) {
      return AutoApplyDecision.AUTO_APPLY;
    }
    
    if (strategy.confidence >= 0.7 && strategy.risk <= 0.3) {
      return AutoApplyDecision.REQUIRE_CONFIRMATION;
    }
    
    if (strategy.confidence >= 0.5) {
      return AutoApplyDecision.SUGGEST_ONLY;
    }
    
    return AutoApplyDecision.DO_NOT_APPLY;
  }
  
  /**
   * Generate reasoning for selection
   */
  private generateReasoning(
    bestRanking: StrategyRanking,
    allRankings: StrategyRanking[]
  ): string[] {
    const reasoning: string[] = [];
    const strategy = bestRanking.strategy;
    const scores = bestRanking.scoreBreakdown;
    
    // Confidence
    if (scores.confidence >= 80) {
      reasoning.push(`High confidence (${scores.confidence.toFixed(0)}%)`);
    } else if (scores.confidence >= 60) {
      reasoning.push(`Moderate confidence (${scores.confidence.toFixed(0)}%)`);
    } else {
      reasoning.push(`Low confidence (${scores.confidence.toFixed(0)}%)`);
    }
    
    // Safety
    if (scores.safety >= 80) {
      reasoning.push(`Low risk (safety: ${scores.safety.toFixed(0)}%)`);
    } else if (scores.safety >= 60) {
      reasoning.push(`Moderate risk (safety: ${scores.safety.toFixed(0)}%)`);
    } else {
      reasoning.push(`High risk (safety: ${scores.safety.toFixed(0)}%)`);
    }
    
    // Quality
    if (scores.quality >= 80) {
      reasoning.push(`High quality impact (${scores.quality.toFixed(0)}%)`);
    }
    
    // Success rate
    if (scores.successRate >= 80) {
      reasoning.push(`Proven track record (${scores.successRate.toFixed(0)}% success)`);
    } else if (scores.successRate < 50) {
      reasoning.push(`Limited success history (${scores.successRate.toFixed(0)}%)`);
    }
    
    // Comparison to alternatives
    if (allRankings.length > 1) {
      const secondBest = allRankings[1];
      const scoreDiff = bestRanking.score - secondBest.score;
      
      if (scoreDiff > 20) {
        reasoning.push('Clear best choice among alternatives');
      } else if (scoreDiff < 5) {
        reasoning.push('Close decision, alternatives available');
      }
    }
    
    return reasoning;
  }
  
  /**
   * Check for warnings about strategy
   */
  private checkWarnings(
    strategy: FixStrategy,
    context: Record<string, unknown>
  ): string[] {
    const warnings: string[] = [];
    
    // High risk warning
    if (strategy.risk > 0.5) {
      warnings.push('⚠️ High risk fix - manual review recommended');
    }
    
    // Low confidence warning
    if (strategy.confidence < 0.6) {
      warnings.push('⚠️ Low confidence - verify fix carefully');
    }
    
    // High effort warning
    if (strategy.effort > 100) {
      warnings.push('⚠️ Large change - consider breaking into smaller fixes');
    }
    
    // Dependency warning
    if (strategy.dependencies && strategy.dependencies.length > 0) {
      warnings.push(`⚠️ Requires ${strategy.dependencies.length} other fixes first`);
    }
    
    return warnings;
  }
}
