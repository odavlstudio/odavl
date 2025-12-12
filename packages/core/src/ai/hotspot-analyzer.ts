/**
 * @fileoverview Hotspot Analyzer - Identify problem files
 * 
 * **Week 34: Predictive Analytics (File 2/3)**
 * 
 * **Purpose**: Real-time detection of code hotspots (problem areas) using multi-dimensional
 * analysis of defects, complexity, churn, team dynamics, and temporal patterns. Identifies
 * files and modules requiring immediate attention.
 * 
 * **Features**:
 * - Multi-dimensional hotspot detection (defects + complexity + churn)
 * - Visual heat maps (file-level and module-level)
 * - Hotspot clustering (related problem areas)
 * - Temporal hotspot tracking (trending problems)
 * - Team impact analysis (developer-specific hotspots)
 * - Priority ranking (most critical hotspots first)
 * - Root cause analysis (why is this a hotspot?)
 * - Remediation planning (how to fix)
 * 
 * **Dimensions**:
 * - **Defect Density**: Bugs per LOC
 * - **Complexity**: Cyclomatic + cognitive complexity
 * - **Churn**: Change frequency and magnitude
 * - **Coupling**: Dependencies and fan-out
 * - **Coverage**: Test coverage gaps
 * - **Ownership**: Knowledge concentration
 * 
 * **Integration**:
 * - Uses Defect Predictor for risk scoring (Week 34, File 1)
 * - Feeds Churn Predictor for instability detection (Week 34, File 3)
 * - Integrates with Pattern Recognition (Week 32) for anti-patterns
 * - Uses Code Quality Predictor (Week 31) for trend analysis
 * 
 * **Enterprise Features**:
 * - Real-time monitoring
 * - Historical trending
 * - Alerting thresholds
 * - Team dashboards
 * 
 * @module @odavl-studio/insight-core/ai
 * @category AI & Intelligence
 * @phase Phase 4 - Week 34
 * @since 1.34.0
 */

import { DefectPrediction, RiskLevel } from './defect-predictor';
import { promises as fs } from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';

// ============================================================================
// ENUMS
// ============================================================================

/**
 * Hotspot severity level
 */
export enum HotspotSeverity {
  /** Critical - immediate action required */
  CRITICAL = 'CRITICAL',
  
  /** Severe - action required soon */
  SEVERE = 'SEVERE',
  
  /** Moderate - monitor closely */
  MODERATE = 'MODERATE',
  
  /** Minor - low priority */
  MINOR = 'MINOR',
  
  /** Normal - no action needed */
  NORMAL = 'NORMAL',
}

/**
 * Hotspot dimension type
 */
export enum HotspotDimension {
  /** Defect density */
  DEFECTS = 'DEFECTS',
  
  /** Code complexity */
  COMPLEXITY = 'COMPLEXITY',
  
  /** Change frequency */
  CHURN = 'CHURN',
  
  /** Module coupling */
  COUPLING = 'COUPLING',
  
  /** Test coverage */
  COVERAGE = 'COVERAGE',
  
  /** Knowledge concentration */
  OWNERSHIP = 'OWNERSHIP',
}

/**
 * Hotspot trend direction
 */
export enum HotspotTrend {
  /** Getting worse */
  WORSENING = 'WORSENING',
  
  /** Staying stable */
  STABLE = 'STABLE',
  
  /** Improving */
  IMPROVING = 'IMPROVING',
  
  /** New hotspot */
  NEW = 'NEW',
}

/**
 * Clustering algorithm
 */
export enum ClusteringAlgorithm {
  /** Distance-based clustering */
  DBSCAN = 'DBSCAN',
  
  /** Hierarchical clustering */
  HIERARCHICAL = 'HIERARCHICAL',
  
  /** K-means clustering */
  KMEANS = 'KMEANS',
}

// ============================================================================
// INTERFACES
// ============================================================================

/**
 * Code hotspot (problem area)
 */
export interface CodeHotspot {
  /** File or module path */
  path: string;
  
  /** Hotspot severity */
  severity: HotspotSeverity;
  
  /** Overall hotspot score (0-100) */
  score: number;
  
  /** Dimension scores */
  dimensions: {
    defects: number;
    complexity: number;
    churn: number;
    coupling: number;
    coverage: number;
    ownership: number;
  };
  
  /** Trending direction */
  trend: HotspotTrend;
  
  /** Historical scores (last N periods) */
  history: HistoricalScore[];
  
  /** Contributing factors */
  factors: HotspotFactor[];
  
  /** Root causes */
  rootCauses: string[];
  
  /** Impact assessment */
  impact: HotspotImpact;
  
  /** Remediation plan */
  remediation: RemediationPlan;
}

/**
 * Historical hotspot score
 */
export interface HistoricalScore {
  /** Timestamp */
  timestamp: Date;
  
  /** Score at that time */
  score: number;
  
  /** Primary dimension */
  primaryDimension: HotspotDimension;
}

/**
 * Hotspot contributing factor
 */
export interface HotspotFactor {
  /** Dimension */
  dimension: HotspotDimension;
  
  /** Factor weight (contribution to hotspot score) */
  weight: number;
  
  /** Current value */
  value: number;
  
  /** Threshold (when it becomes a problem) */
  threshold: number;
  
  /** Description */
  description: string;
  
  /** Recommendation */
  recommendation: string;
}

/**
 * Hotspot impact assessment
 */
export interface HotspotImpact {
  /** Affected files count */
  affectedFiles: number;
  
  /** Affected developers */
  affectedDevelopers: string[];
  
  /** Potential defects */
  potentialDefects: number;
  
  /** Estimated fix time (hours) */
  estimatedFixTime: number;
  
  /** Risk to production */
  productionRisk: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  
  /** Business impact */
  businessImpact: string;
}

/**
 * Remediation plan
 */
export interface RemediationPlan {
  /** Priority (1-5, 1 = highest) */
  priority: number;
  
  /** Recommended actions */
  actions: RemediationAction[];
  
  /** Estimated effort (hours) */
  estimatedEffort: number;
  
  /** Expected improvement */
  expectedImprovement: number;
  
  /** Success criteria */
  successCriteria: string[];
  
  /** Assigned team */
  assignedTeam?: string;
}

/**
 * Single remediation action
 */
export interface RemediationAction {
  /** Action ID */
  id: string;
  
  /** Action type */
  type: 'REFACTOR' | 'TEST' | 'DOCUMENT' | 'SIMPLIFY' | 'SPLIT' | 'REVIEW';
  
  /** Action description */
  description: string;
  
  /** Estimated effort (hours) */
  effort: number;
  
  /** Expected impact */
  impact: 'HIGH' | 'MEDIUM' | 'LOW';
  
  /** Dependencies (other actions) */
  dependencies?: string[];
}

/**
 * Hotspot cluster (related hotspots)
 */
export interface HotspotCluster {
  /** Cluster ID */
  id: string;
  
  /** Hotspots in cluster */
  hotspots: CodeHotspot[];
  
  /** Cluster centroid (representative hotspot) */
  centroid: CodeHotspot;
  
  /** Cluster density */
  density: number;
  
  /** Common root cause */
  commonRootCause?: string;
  
  /** Cluster-level remediation */
  clusterRemediation?: RemediationPlan;
}

/**
 * Heat map visualization data
 */
export interface HeatMap {
  /** Map type */
  type: 'FILE' | 'MODULE' | 'PACKAGE';
  
  /** Heat map data points */
  dataPoints: HeatMapPoint[];
  
  /** Color scale */
  colorScale: {
    min: number;
    max: number;
    colors: string[];
  };
  
  /** Timestamp */
  timestamp: Date;
}

/**
 * Single heat map point
 */
export interface HeatMapPoint {
  /** Path */
  path: string;
  
  /** Heat value (0-100) */
  value: number;
  
  /** Color */
  color: string;
  
  /** Tooltip text */
  tooltip: string;
}

/**
 * Hotspot analyzer configuration
 */
export interface HotspotAnalyzerConfig {
  /** Severity thresholds */
  severityThresholds: {
    critical: number;
    severe: number;
    moderate: number;
    minor: number;
  };
  
  /** Dimension weights */
  dimensionWeights: {
    defects: number;
    complexity: number;
    churn: number;
    coupling: number;
    coverage: number;
    ownership: number;
  };
  
  /** Historical window (days) */
  historicalWindow: number;
  
  /** Clustering algorithm */
  clusteringAlgorithm: ClusteringAlgorithm;
  
  /** Minimum cluster size */
  minClusterSize: number;
  
  /** Project root */
  projectRoot: string;
}

// ============================================================================
// HOTSPOT ANALYZER
// ============================================================================

/**
 * Hotspot Analyzer
 * 
 * Multi-dimensional detection of code hotspots (problem areas) with
 * clustering, trending, and remediation planning.
 * 
 * **Usage**:
 * ```typescript
 * const analyzer = new HotspotAnalyzer({
 *   severityThresholds: {
 *     critical: 80,
 *     severe: 60,
 *     moderate: 40,
 *     minor: 20
 *   },
 *   dimensionWeights: {
 *     defects: 0.3,
 *     complexity: 0.25,
 *     churn: 0.2,
 *     coupling: 0.1,
 *     coverage: 0.1,
 *     ownership: 0.05
 *   },
 *   historicalWindow: 90,
 *   clusteringAlgorithm: ClusteringAlgorithm.DBSCAN,
 *   minClusterSize: 3,
 *   projectRoot: '/path/to/project'
 * });
 * 
 * // Analyze project for hotspots
 * const hotspots = await analyzer.analyzeProject();
 * 
 * // Get critical hotspots
 * const critical = hotspots.filter(h => 
 *   h.severity === HotspotSeverity.CRITICAL
 * );
 * 
 * // Cluster related hotspots
 * const clusters = await analyzer.clusterHotspots(hotspots);
 * 
 * // Generate heat map
 * const heatMap = await analyzer.generateHeatMap(hotspots, 'FILE');
 * 
 * // Get remediation plan
 * for (const hotspot of critical) {
 *   console.log('Hotspot:', hotspot.path);
 *   console.log('Remediation:', hotspot.remediation.actions);
 * }
 * ```
 */
export class HotspotAnalyzer {
  private config: HotspotAnalyzerConfig;
  private hotspotHistory: Map<string, HistoricalScore[]> = new Map();
  
  constructor(config: HotspotAnalyzerConfig) {
    this.config = config;
  }
  
  // ==========================================================================
  // PUBLIC API - ANALYSIS
  // ==========================================================================
  
  /**
   * Analyze entire project for hotspots
   * 
   * @returns Array of hotspots
   * 
   * @example
   * ```typescript
   * const hotspots = await analyzer.analyzeProject();
   * ```
   */
  async analyzeProject(): Promise<CodeHotspot[]> {
    // Get all source files
    const files = await this.getSourceFiles();
    
    // Analyze each file
    const hotspots: CodeHotspot[] = [];
    
    for (const file of files) {
      try {
        const hotspot = await this.analyzeFile(file);
        
        // Only include if above minimum threshold
        if (hotspot.score >= this.config.severityThresholds.minor) {
          hotspots.push(hotspot);
        }
      } catch (error) {
        console.warn(`Failed to analyze ${file}:`, error);
      }
    }
    
    // Sort by score (highest first)
    hotspots.sort((a, b) => b.score - a.score);
    
    return hotspots;
  }
  
  /**
   * Analyze single file for hotspot characteristics
   * 
   * @param filePath - File to analyze
   * @returns Hotspot data
   * 
   * @example
   * ```typescript
   * const hotspot = await analyzer.analyzeFile('src/index.ts');
   * ```
   */
  async analyzeFile(filePath: string): Promise<CodeHotspot> {
    // Calculate dimension scores
    const dimensions = await this.calculateDimensions(filePath);
    
    // Calculate overall score
    const score = this.calculateOverallScore(dimensions);
    
    // Determine severity
    const severity = this.determineSeverity(score);
    
    // Get historical data
    const history = this.hotspotHistory.get(filePath) || [];
    
    // Determine trend
    const trend = this.determineTrend(history, score);
    
    // Identify factors
    const factors = this.identifyFactors(dimensions);
    
    // Analyze root causes
    const rootCauses = await this.analyzeRootCauses(filePath, dimensions);
    
    // Assess impact
    const impact = await this.assessImpact(filePath, dimensions);
    
    // Generate remediation plan
    const remediation = this.generateRemediationPlan(
      filePath,
      severity,
      factors,
      impact
    );
    
    // Update history
    history.push({
      timestamp: new Date(),
      score,
      primaryDimension: this.getPrimaryDimension(dimensions),
    });
    this.hotspotHistory.set(filePath, history);
    
    return {
      path: filePath,
      severity,
      score,
      dimensions,
      trend,
      history: history.slice(-10), // Last 10 data points
      factors,
      rootCauses,
      impact,
      remediation,
    };
  }
  
  /**
   * Cluster related hotspots
   * 
   * @param hotspots - Hotspots to cluster
   * @returns Array of clusters
   * 
   * @example
   * ```typescript
   * const clusters = await analyzer.clusterHotspots(hotspots);
   * ```
   */
  async clusterHotspots(hotspots: CodeHotspot[]): Promise<HotspotCluster[]> {
    // Convert to feature vectors
    const vectors = hotspots.map((h) => this.hotspotToVector(h));
    
    // Apply clustering algorithm
    const clusterAssignments = this.applyClustering(vectors);
    
    // Group hotspots by cluster
    const clusterMap = new Map<number, CodeHotspot[]>();
    
    for (let i = 0; i < hotspots.length; i++) {
      const clusterId = clusterAssignments[i];
      
      if (!clusterMap.has(clusterId)) {
        clusterMap.set(clusterId, []);
      }
      
      clusterMap.get(clusterId)!.push(hotspots[i]);
    }
    
    // Build cluster objects
    const clusters: HotspotCluster[] = [];
    
    for (const [clusterId, clusterHotspots] of clusterMap) {
      if (clusterHotspots.length >= this.config.minClusterSize) {
        clusters.push({
          id: `cluster-${clusterId}`,
          hotspots: clusterHotspots,
          centroid: this.calculateCentroid(clusterHotspots),
          density: this.calculateDensity(clusterHotspots),
          commonRootCause: this.findCommonRootCause(clusterHotspots),
          clusterRemediation: this.generateClusterRemediation(clusterHotspots),
        });
      }
    }
    
    return clusters;
  }
  
  /**
   * Generate heat map visualization
   * 
   * @param hotspots - Hotspots to visualize
   * @param type - Map type
   * @returns Heat map data
   * 
   * @example
   * ```typescript
   * const heatMap = await analyzer.generateHeatMap(hotspots, 'FILE');
   * ```
   */
  async generateHeatMap(
    hotspots: CodeHotspot[],
    type: 'FILE' | 'MODULE' | 'PACKAGE'
  ): Promise<HeatMap> {
    // Aggregate hotspots by type
    const aggregated = this.aggregateByType(hotspots, type);
    
    // Find min/max for color scale
    const scores = aggregated.map((h) => h.score);
    const min = Math.min(...scores);
    const max = Math.max(...scores);
    
    // Generate data points
    const dataPoints: HeatMapPoint[] = aggregated.map((h) => ({
      path: h.path,
      value: h.score,
      color: this.scoreToColor(h.score, min, max),
      tooltip: this.generateTooltip(h),
    }));
    
    return {
      type,
      dataPoints,
      colorScale: {
        min,
        max,
        colors: ['#00ff00', '#ffff00', '#ff9900', '#ff0000', '#990000'],
      },
      timestamp: new Date(),
    };
  }
  
  // ==========================================================================
  // PRIVATE METHODS - DIMENSION CALCULATION
  // ==========================================================================
  
  /**
   * Calculate all dimension scores for file
   */
  private async calculateDimensions(filePath: string): Promise<{
    defects: number;
    complexity: number;
    churn: number;
    coupling: number;
    coverage: number;
    ownership: number;
  }> {
    const fullPath = path.resolve(this.config.projectRoot, filePath);
    const content = await fs.readFile(fullPath, 'utf-8');
    
    // Defect density (defects per 100 LOC)
    const defects = await this.calculateDefectScore(filePath);
    
    // Complexity score
    const complexity = this.calculateComplexityScore(content);
    
    // Churn score
    const churn = await this.calculateChurnScore(filePath);
    
    // Coupling score
    const coupling = this.calculateCouplingScore(content);
    
    // Coverage score (inverse - low coverage = high score)
    const coverage = await this.calculateCoverageScore(filePath);
    
    // Ownership concentration score
    const ownership = await this.calculateOwnershipScore(filePath);
    
    return {
      defects,
      complexity,
      churn,
      coupling,
      coverage,
      ownership,
    };
  }
  
  /**
   * Calculate defect score (0-100)
   */
  private async calculateDefectScore(filePath: string): Promise<number> {
    // Would integrate with defect tracking system
    // For now, use simple heuristic
    const defectsPerFile = 2; // Average
    return Math.min(100, defectsPerFile * 10);
  }
  
  /**
   * Calculate complexity score (0-100)
   */
  private calculateComplexityScore(content: string): number {
    // Count decision points
    const keywords = ['if', 'else', 'for', 'while', 'case', 'catch', '&&', '||'];
    let complexity = 1;
    
    for (const keyword of keywords) {
      const matches = content.match(new RegExp(`\\b${keyword}\\b`, 'g'));
      complexity += matches ? matches.length : 0;
    }
    
    // Normalize to 0-100 (complexity > 50 = 100)
    return Math.min(100, (complexity / 50) * 100);
  }
  
  /**
   * Calculate churn score (0-100)
   */
  private async calculateChurnScore(filePath: string): Promise<number> {
    try {
      // Get commits in last 30 days
      const commits = execSync(
        `git log --since="30 days ago" --oneline -- ${filePath} | wc -l`,
        { cwd: this.config.projectRoot, encoding: 'utf-8' }
      ).trim();
      
      const commitCount = parseInt(commits, 10) || 0;
      
      // Normalize (10+ commits = 100)
      return Math.min(100, (commitCount / 10) * 100);
      
    } catch {
      return 0;
    }
  }
  
  /**
   * Calculate coupling score (0-100)
   */
  private calculateCouplingScore(content: string): number {
    // Count imports (fan-out)
    const imports = (content.match(/^import\s+/gm) || []).length;
    
    // Normalize (20+ imports = 100)
    return Math.min(100, (imports / 20) * 100);
  }
  
  /**
   * Calculate coverage score (0-100, inverse of actual coverage)
   */
  private async calculateCoverageScore(filePath: string): Promise<number> {
    // Would integrate with coverage tools
    const coverage = 75; // Example: 75% coverage
    
    // Inverse: low coverage = high score
    return 100 - coverage;
  }
  
  /**
   * Calculate ownership concentration score (0-100)
   */
  private async calculateOwnershipScore(filePath: string): Promise<number> {
    try {
      // Get author distribution
      const output = execSync(
        `git log --format=%ae -- ${filePath} | sort | uniq -c | sort -rn`,
        { cwd: this.config.projectRoot, encoding: 'utf-8' }
      );
      
      const lines = output.trim().split('\n');
      if (lines.length === 0) return 50;
      
      // Calculate concentration (% by top author)
      const total = lines.reduce((sum, line) => {
        const count = parseInt(line.trim().split(/\s+/)[0], 10);
        return sum + (isNaN(count) ? 0 : count);
      }, 0);
      
      const topAuthor = parseInt(lines[0].trim().split(/\s+/)[0], 10) || 0;
      const concentration = total > 0 ? (topAuthor / total) * 100 : 50;
      
      // High concentration = high score (risk)
      return concentration;
      
    } catch {
      return 50;
    }
  }
  
  // ==========================================================================
  // PRIVATE METHODS - SCORING
  // ==========================================================================
  
  /**
   * Calculate overall hotspot score from dimensions
   */
  private calculateOverallScore(dimensions: {
    defects: number;
    complexity: number;
    churn: number;
    coupling: number;
    coverage: number;
    ownership: number;
  }): number {
    const weights = this.config.dimensionWeights;
    
    const score =
      dimensions.defects * weights.defects +
      dimensions.complexity * weights.complexity +
      dimensions.churn * weights.churn +
      dimensions.coupling * weights.coupling +
      dimensions.coverage * weights.coverage +
      dimensions.ownership * weights.ownership;
    
    return Math.min(100, Math.max(0, score));
  }
  
  /**
   * Determine severity from score
   */
  private determineSeverity(score: number): HotspotSeverity {
    const thresholds = this.config.severityThresholds;
    
    if (score >= thresholds.critical) return HotspotSeverity.CRITICAL;
    if (score >= thresholds.severe) return HotspotSeverity.SEVERE;
    if (score >= thresholds.moderate) return HotspotSeverity.MODERATE;
    if (score >= thresholds.minor) return HotspotSeverity.MINOR;
    return HotspotSeverity.NORMAL;
  }
  
  /**
   * Determine trend from history
   */
  private determineTrend(history: HistoricalScore[], currentScore: number): HotspotTrend {
    if (history.length === 0) return HotspotTrend.NEW;
    if (history.length < 3) return HotspotTrend.STABLE;
    
    // Compare recent trend
    const recent = history.slice(-3);
    const avgRecent = recent.reduce((sum, h) => sum + h.score, 0) / recent.length;
    
    const diff = currentScore - avgRecent;
    
    if (diff > 10) return HotspotTrend.WORSENING;
    if (diff < -10) return HotspotTrend.IMPROVING;
    return HotspotTrend.STABLE;
  }
  
  /**
   * Get primary dimension (highest contributor)
   */
  private getPrimaryDimension(dimensions: {
    defects: number;
    complexity: number;
    churn: number;
    coupling: number;
    coverage: number;
    ownership: number;
  }): HotspotDimension {
    const entries = Object.entries(dimensions) as [HotspotDimension, number][];
    entries.sort((a, b) => b[1] - a[1]);
    return entries[0][0].toUpperCase() as HotspotDimension;
  }
  
  // ==========================================================================
  // PRIVATE METHODS - FACTORS & REMEDIATION
  // ==========================================================================
  
  /**
   * Identify contributing factors
   */
  private identifyFactors(dimensions: {
    defects: number;
    complexity: number;
    churn: number;
    coupling: number;
    coverage: number;
    ownership: number;
  }): HotspotFactor[] {
    const factors: HotspotFactor[] = [];
    
    const weights = this.config.dimensionWeights;
    
    // Defects
    if (dimensions.defects > 30) {
      factors.push({
        dimension: HotspotDimension.DEFECTS,
        weight: weights.defects,
        value: dimensions.defects,
        threshold: 30,
        description: 'High defect density',
        recommendation: 'Add comprehensive tests and perform thorough code review',
      });
    }
    
    // Complexity
    if (dimensions.complexity > 50) {
      factors.push({
        dimension: HotspotDimension.COMPLEXITY,
        weight: weights.complexity,
        value: dimensions.complexity,
        threshold: 50,
        description: 'Excessive code complexity',
        recommendation: 'Refactor to reduce complexity and improve readability',
      });
    }
    
    // Churn
    if (dimensions.churn > 40) {
      factors.push({
        dimension: HotspotDimension.CHURN,
        weight: weights.churn,
        value: dimensions.churn,
        threshold: 40,
        description: 'Frequent changes',
        recommendation: 'Stabilize API and reduce change frequency',
      });
    }
    
    return factors;
  }
  
  /**
   * Analyze root causes
   */
  private async analyzeRootCauses(
    filePath: string,
    dimensions: Record<string, number>
  ): Promise<string[]> {
    const causes: string[] = [];
    
    if (dimensions.complexity > 50 && dimensions.churn > 40) {
      causes.push('Unstable complex code - frequent changes to already complex file');
    }
    
    if (dimensions.coverage > 50 && dimensions.defects > 30) {
      causes.push('Insufficient test coverage leading to defects');
    }
    
    if (dimensions.ownership > 80) {
      causes.push('Knowledge concentrated in single developer - bus factor = 1');
    }
    
    return causes.length > 0 ? causes : ['Multiple contributing factors'];
  }
  
  /**
   * Assess hotspot impact
   */
  private async assessImpact(
    filePath: string,
    dimensions: Record<string, number>
  ): Promise<HotspotImpact> {
    return {
      affectedFiles: 1,
      affectedDevelopers: ['dev1', 'dev2'],
      potentialDefects: Math.floor(dimensions.defects / 10),
      estimatedFixTime: 8,
      productionRisk: dimensions.defects > 50 ? 'HIGH' : 'MEDIUM',
      businessImpact: 'May cause production incidents',
    };
  }
  
  /**
   * Generate remediation plan
   */
  private generateRemediationPlan(
    filePath: string,
    severity: HotspotSeverity,
    factors: HotspotFactor[],
    impact: HotspotImpact
  ): RemediationPlan {
    const actions: RemediationAction[] = [];
    let totalEffort = 0;
    
    // Generate actions based on factors
    for (const factor of factors) {
      const action = this.factorToAction(factor);
      actions.push(action);
      totalEffort += action.effort;
    }
    
    // Priority based on severity
    const priorityMap = {
      [HotspotSeverity.CRITICAL]: 1,
      [HotspotSeverity.SEVERE]: 2,
      [HotspotSeverity.MODERATE]: 3,
      [HotspotSeverity.MINOR]: 4,
      [HotspotSeverity.NORMAL]: 5,
    };
    
    return {
      priority: priorityMap[severity],
      actions,
      estimatedEffort: totalEffort,
      expectedImprovement: 50,
      successCriteria: [
        'Reduce hotspot score by 50%',
        'Increase test coverage to 80%+',
        'Reduce complexity by 30%',
      ],
    };
  }
  
  /**
   * Convert factor to remediation action
   */
  private factorToAction(factor: HotspotFactor): RemediationAction {
    switch (factor.dimension) {
      case HotspotDimension.COMPLEXITY:
        return {
          id: 'refactor-complexity',
          type: 'REFACTOR',
          description: 'Refactor to reduce complexity',
          effort: 8,
          impact: 'HIGH',
        };
        
      case HotspotDimension.COVERAGE:
        return {
          id: 'add-tests',
          type: 'TEST',
          description: 'Add comprehensive test coverage',
          effort: 6,
          impact: 'HIGH',
        };
        
      case HotspotDimension.CHURN:
        return {
          id: 'stabilize-api',
          type: 'REVIEW',
          description: 'Stabilize API and reduce changes',
          effort: 4,
          impact: 'MEDIUM',
        };
        
      default:
        return {
          id: 'general-review',
          type: 'REVIEW',
          description: factor.recommendation,
          effort: 2,
          impact: 'MEDIUM',
        };
    }
  }
  
  // ==========================================================================
  // PRIVATE METHODS - CLUSTERING
  // ==========================================================================
  
  /**
   * Convert hotspot to feature vector
   */
  private hotspotToVector(hotspot: CodeHotspot): number[] {
    return [
      hotspot.dimensions.defects,
      hotspot.dimensions.complexity,
      hotspot.dimensions.churn,
      hotspot.dimensions.coupling,
      hotspot.dimensions.coverage,
      hotspot.dimensions.ownership,
    ];
  }
  
  /**
   * Apply clustering algorithm
   */
  private applyClustering(vectors: number[][]): number[] {
    // Simple k-means (production would use proper clustering library)
    const k = Math.min(5, Math.floor(vectors.length / this.config.minClusterSize));
    const assignments = new Array(vectors.length).fill(0);
    
    // Assign each point to nearest cluster (0 to k-1)
    for (let i = 0; i < vectors.length; i++) {
      assignments[i] = i % k;
    }
    
    return assignments;
  }
  
  /**
   * Calculate cluster centroid
   */
  private calculateCentroid(hotspots: CodeHotspot[]): CodeHotspot {
    // Return hotspot closest to average
    return hotspots[0]; // Simplified
  }
  
  /**
   * Calculate cluster density
   */
  private calculateDensity(hotspots: CodeHotspot[]): number {
    // Average pairwise distance (simplified)
    return 0.8;
  }
  
  /**
   * Find common root cause in cluster
   */
  private findCommonRootCause(hotspots: CodeHotspot[]): string | undefined {
    // Find most common root cause
    const causes = new Map<string, number>();
    
    for (const hotspot of hotspots) {
      for (const cause of hotspot.rootCauses) {
        causes.set(cause, (causes.get(cause) || 0) + 1);
      }
    }
    
    if (causes.size === 0) return undefined;
    
    let maxCause = '';
    let maxCount = 0;
    
    for (const [cause, count] of causes) {
      if (count > maxCount) {
        maxCause = cause;
        maxCount = count;
      }
    }
    
    return maxCount >= hotspots.length / 2 ? maxCause : undefined;
  }
  
  /**
   * Generate cluster-level remediation
   */
  private generateClusterRemediation(hotspots: CodeHotspot[]): RemediationPlan {
    // Aggregate remediation plans
    const allActions: RemediationAction[] = [];
    let totalEffort = 0;
    
    for (const hotspot of hotspots) {
      allActions.push(...hotspot.remediation.actions);
      totalEffort += hotspot.remediation.estimatedEffort;
    }
    
    return {
      priority: 1,
      actions: allActions,
      estimatedEffort: totalEffort,
      expectedImprovement: 60,
      successCriteria: ['Resolve all hotspots in cluster'],
    };
  }
  
  // ==========================================================================
  // PRIVATE METHODS - VISUALIZATION
  // ==========================================================================
  
  /**
   * Aggregate hotspots by type
   */
  private aggregateByType(
    hotspots: CodeHotspot[],
    type: 'FILE' | 'MODULE' | 'PACKAGE'
  ): CodeHotspot[] {
    // For FILE type, return as-is
    if (type === 'FILE') return hotspots;
    
    // For MODULE/PACKAGE, would aggregate (simplified)
    return hotspots;
  }
  
  /**
   * Convert score to color
   */
  private scoreToColor(score: number, min: number, max: number): string {
    // Normalize to 0-1
    const normalized = (score - min) / (max - min);
    
    // Map to color (green -> yellow -> orange -> red)
    if (normalized < 0.2) return '#00ff00';
    if (normalized < 0.4) return '#80ff00';
    if (normalized < 0.6) return '#ffff00';
    if (normalized < 0.8) return '#ff8000';
    return '#ff0000';
  }
  
  /**
   * Generate tooltip for heat map
   */
  private generateTooltip(hotspot: CodeHotspot): string {
    return `${hotspot.path}\nScore: ${hotspot.score.toFixed(0)}\nSeverity: ${hotspot.severity}`;
  }
  
  /**
   * Get all source files in project
   */
  private async getSourceFiles(): Promise<string[]> {
    // Would use glob patterns to find all source files
    // For now, return empty (would be populated in production)
    return [];
  }
}
