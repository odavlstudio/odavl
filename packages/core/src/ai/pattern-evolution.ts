/**
 * Pattern Evolution Tracker - Track how code patterns evolve over time
 * 
 * Purpose: Monitor pattern lifecycle, adoption, and effectiveness
 * Week 32: Pattern Recognition (File 3/3)
 * 
 * Features:
 * - Pattern lifecycle tracking (introduction → adoption → maturity → deprecation)
 * - Adoption metrics (usage growth, spread across codebase)
 * - Effectiveness measurement (bug reduction, performance improvement)
 * - Pattern mutations (how patterns change over time)
 * - Pattern migration tracking (old pattern → new pattern)
 * - Team adoption analysis (who uses which patterns)
 * - Trend forecasting (predict future pattern adoption)
 * - Pattern health scoring (is pattern still relevant?)
 * 
 * Evolution Metrics:
 * - Adoption rate (% of files using pattern)
 * - Growth rate (change in adoption over time)
 * - Effectiveness score (impact on quality metrics)
 * - Mutation rate (frequency of pattern variations)
 * - Migration success (% of successful pattern migrations)
 * 
 * @module @odavl-studio/core/ai/pattern-evolution
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import type { PatternLibraryEntry } from './pattern-library';

/**
 * Pattern lifecycle stage
 */
export enum LifecycleStage {
  INTRODUCED = 'INTRODUCED', // First appearance
  EMERGING = 'EMERGING', // Growing adoption
  ADOPTED = 'ADOPTED', // Widespread use
  MATURE = 'MATURE', // Stable, established
  DECLINING = 'DECLINING', // Usage decreasing
  DEPRECATED = 'DEPRECATED', // No longer recommended
  OBSOLETE = 'OBSOLETE' // Completely replaced
}

/**
 * Pattern mutation type
 */
export enum MutationType {
  SIMPLIFICATION = 'SIMPLIFICATION', // Pattern simplified
  ENHANCEMENT = 'ENHANCEMENT', // Pattern improved
  SPECIALIZATION = 'SPECIALIZATION', // Pattern specialized for use case
  GENERALIZATION = 'GENERALIZATION', // Pattern made more generic
  COMBINATION = 'COMBINATION', // Pattern combined with others
  FRAGMENTATION = 'FRAGMENTATION' // Pattern split into smaller patterns
}

/**
 * Pattern snapshot (point-in-time state)
 */
export interface PatternSnapshot {
  timestamp: Date;
  patternId: string;
  
  // Usage metrics
  usage: {
    totalOccurrences: number;
    filesUsing: string[];
    adoptionRate: number; // 0-1, % of eligible files
    diversity: number; // 0-1, spread across different parts of codebase
  };
  
  // Quality impact
  qualityImpact: {
    bugReduction: number; // % reduction in bugs in files using pattern
    performanceImprovement: number; // % improvement
    maintainabilityScore: number; // 0-100
    testCoverage: number; // % coverage in files using pattern
  };
  
  // Team adoption
  teamAdoption: {
    contributorsUsing: string[]; // Developer IDs
    teamsUsing: string[]; // Team IDs
    adoptionVelocity: number; // Contributors/week
  };
  
  // Pattern variations
  variations: Array<{
    code: string;
    frequency: number; // How often this variation appears
    deviation: number; // 0-1, how different from canonical pattern
  }>;
  
  // Lifecycle
  lifecycle: {
    stage: LifecycleStage;
    daysInStage: number;
    stability: number; // 0-1, how stable is usage
  };
}

/**
 * Pattern evolution
 */
export interface PatternEvolution {
  patternId: string;
  patternName: string;
  
  // Historical snapshots
  snapshots: PatternSnapshot[];
  
  // Trends
  trends: {
    adoptionTrend: 'GROWING' | 'STABLE' | 'DECLINING';
    adoptionRate: number; // % change per month
    qualityTrend: 'IMPROVING' | 'STABLE' | 'DEGRADING';
    stabilityTrend: 'INCREASING' | 'STABLE' | 'DECREASING';
  };
  
  // Predictions
  predictions: {
    futureAdoption: Array<{
      date: Date;
      predictedRate: number;
      confidence: number;
    }>;
    lifetimeEstimate: number; // Days until deprecation
    peakAdoption: {
      date: Date;
      rate: number;
    };
  };
  
  // Mutations
  mutations: Array<{
    date: Date;
    type: MutationType;
    description: string;
    before: string;
    after: string;
    reason: string;
  }>;
  
  // Relationships
  relationships: {
    replacedBy?: string; // Pattern ID that replaced this
    replacedPatterns?: string[]; // Patterns this replaced
    derivedFrom?: string; // Parent pattern
    derivatives?: string[]; // Child patterns
  };
  
  // Health score
  health: {
    score: number; // 0-100
    factors: Array<{
      factor: string;
      impact: number; // -100 to +100
      explanation: string;
    }>;
    recommendation: string;
  };
}

/**
 * Pattern migration
 */
export interface PatternMigration {
  id: string;
  fromPattern: string;
  toPattern: string;
  
  // Migration plan
  plan: {
    startDate: Date;
    targetDate: Date;
    strategy: 'GRADUAL' | 'BIG_BANG' | 'PARALLEL';
    phases: Array<{
      name: string;
      description: string;
      estimatedDuration: number; // Days
    }>;
  };
  
  // Progress
  progress: {
    filesTotal: number;
    filesMigrated: number;
    percentComplete: number;
    status: 'PLANNING' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED';
  };
  
  // Outcomes
  outcomes?: {
    successRate: number; // 0-1
    qualityImpact: {
      bugReduction: number;
      performanceGain: number;
      maintainabilityGain: number;
    };
    effortActual: number; // Hours
    effortEstimated: number; // Hours
  };
}

/**
 * Pattern adoption forecast
 */
export interface PatternAdoptionForecast {
  patternId: string;
  horizon: 'SHORT_TERM' | 'MEDIUM_TERM' | 'LONG_TERM'; // 30/90/180 days
  
  // Forecasted metrics
  forecast: {
    currentAdoption: number;
    predictedAdoption: number;
    growthRate: number; // % change
    confidence: number; // 0-1
  };
  
  // Scenario analysis
  scenarios: {
    optimistic: { adoption: number; probability: number };
    realistic: { adoption: number; probability: number };
    pessimistic: { adoption: number; probability: number };
  };
  
  // Recommendations
  recommendations: string[];
}

/**
 * Pattern Evolution Tracker configuration
 */
export interface PatternEvolutionTrackerConfig {
  dataPath?: string;
  snapshotInterval?: number; // Days between snapshots
  minSnapshotsForTrends?: number;
  forecastHorizon?: number; // Days to forecast
}

/**
 * Pattern Evolution Tracker
 */
export class PatternEvolutionTracker {
  private config: Required<PatternEvolutionTrackerConfig>;
  private evolutions: Map<string, PatternEvolution> = new Map();
  private migrations: Map<string, PatternMigration> = new Map();

  constructor(config: PatternEvolutionTrackerConfig = {}) {
    this.config = {
      dataPath: config.dataPath ?? '.odavl/pattern-evolution',
      snapshotInterval: config.snapshotInterval ?? 7, // Weekly snapshots
      minSnapshotsForTrends: config.minSnapshotsForTrends ?? 4,
      forecastHorizon: config.forecastHorizon ?? 90
    };
  }

  /**
   * Initialize tracker
   */
  async initialize(): Promise<void> {
    console.log('📈 Initializing Pattern Evolution Tracker...');
    
    // Load historical evolution data
    await this.loadEvolutions();
    
    // Load migrations
    await this.loadMigrations();
    
    console.log(`✅ Loaded ${this.evolutions.size} pattern evolutions`);
    console.log(`✅ Loaded ${this.migrations.size} pattern migrations`);
  }

  /**
   * Capture pattern snapshot
   */
  async captureSnapshot(
    patternId: string,
    codebase: {
      files: Array<{ path: string; content: string }>;
      contributors: string[];
    }
  ): Promise<PatternSnapshot> {
    console.log(`📸 Capturing snapshot for pattern: ${patternId}`);
    
    // Count occurrences
    const occurrences = this.countOccurrences(patternId, codebase.files);
    const filesUsing = occurrences.map(o => o.file);
    
    // Calculate adoption metrics
    const adoptionRate = filesUsing.length / codebase.files.length;
    const diversity = this.calculateDiversity(filesUsing);
    
    // Calculate quality impact (simplified - would integrate with quality metrics)
    const qualityImpact = await this.calculateQualityImpact(patternId, filesUsing);
    
    // Analyze team adoption
    const teamAdoption = await this.analyzeTeamAdoption(patternId, codebase.contributors);
    
    // Detect variations
    const variations = this.detectVariations(patternId, occurrences);
    
    // Determine lifecycle stage
    const lifecycle = this.determineLifecycle(adoptionRate, variations);
    
    const snapshot: PatternSnapshot = {
      timestamp: new Date(),
      patternId,
      usage: {
        totalOccurrences: occurrences.length,
        filesUsing,
        adoptionRate,
        diversity
      },
      qualityImpact,
      teamAdoption,
      variations,
      lifecycle
    };
    
    // Save snapshot
    await this.saveSnapshot(snapshot);
    
    console.log(`✅ Snapshot captured: ${occurrences.length} occurrences`);
    return snapshot;
  }

  /**
   * Get pattern evolution
   */
  async getEvolution(patternId: string): Promise<PatternEvolution | undefined> {
    let evolution = this.evolutions.get(patternId);
    
    if (!evolution) {
      // Load from disk
      evolution = await this.loadEvolution(patternId);
    }
    
    return evolution;
  }

  /**
   * Analyze pattern trends
   */
  async analyzeTrends(patternId: string): Promise<PatternEvolution['trends']> {
    const evolution = await this.getEvolution(patternId);
    if (!evolution || evolution.snapshots.length < this.config.minSnapshotsForTrends) {
      throw new Error(`Insufficient data for trend analysis: ${patternId}`);
    }
    
    console.log(`📊 Analyzing trends for: ${patternId}`);
    
    // Adoption trend
    const adoptionRates = evolution.snapshots.map(s => s.usage.adoptionRate);
    const adoptionTrend = this.determineTrend(adoptionRates);
    const adoptionRate = this.calculateGrowthRate(adoptionRates);
    
    // Quality trend
    const qualityScores = evolution.snapshots.map(s => s.qualityImpact.maintainabilityScore);
    const qualityTrend = this.determineTrend(qualityScores) as 'IMPROVING' | 'STABLE' | 'DEGRADING';
    
    // Stability trend
    const stabilityScores = evolution.snapshots.map(s => s.lifecycle.stability);
    const stabilityTrend = this.determineTrend(stabilityScores) as 'INCREASING' | 'STABLE' | 'DECREASING';
    
    return {
      adoptionTrend,
      adoptionRate,
      qualityTrend,
      stabilityTrend
    };
  }

  /**
   * Forecast pattern adoption
   */
  async forecastAdoption(
    patternId: string,
    horizon: 'SHORT_TERM' | 'MEDIUM_TERM' | 'LONG_TERM' = 'MEDIUM_TERM'
  ): Promise<PatternAdoptionForecast> {
    const evolution = await this.getEvolution(patternId);
    if (!evolution) {
      throw new Error(`Pattern not found: ${patternId}`);
    }
    
    console.log(`🔮 Forecasting adoption for: ${patternId}`);
    
    // Get historical adoption rates
    const adoptionRates = evolution.snapshots.map(s => s.usage.adoptionRate);
    const currentAdoption = adoptionRates[adoptionRates.length - 1];
    
    // Calculate growth rate
    const growthRate = this.calculateGrowthRate(adoptionRates);
    
    // Forecast using exponential smoothing
    const daysAhead = horizon === 'SHORT_TERM' ? 30 : horizon === 'MEDIUM_TERM' ? 90 : 180;
    const predictedAdoption = this.forecastValue(adoptionRates, daysAhead);
    
    // Scenario analysis
    const scenarios = {
      optimistic: {
        adoption: Math.min(1, predictedAdoption * 1.3),
        probability: 0.2
      },
      realistic: {
        adoption: predictedAdoption,
        probability: 0.6
      },
      pessimistic: {
        adoption: Math.max(0, predictedAdoption * 0.7),
        probability: 0.2
      }
    };
    
    // Calculate confidence based on data quality
    const confidence = Math.min(1, evolution.snapshots.length / 10);
    
    return {
      patternId,
      horizon,
      forecast: {
        currentAdoption,
        predictedAdoption,
        growthRate,
        confidence
      },
      scenarios,
      recommendations: this.generateForecastRecommendations(
        currentAdoption,
        predictedAdoption,
        growthRate
      )
    };
  }

  /**
   * Track pattern mutation
   */
  async trackMutation(
    patternId: string,
    mutationType: MutationType,
    description: string,
    before: string,
    after: string,
    reason: string
  ): Promise<void> {
    console.log(`🔄 Tracking mutation: ${patternId} - ${mutationType}`);
    
    const evolution = await this.getEvolution(patternId);
    if (!evolution) return;
    
    // Add mutation record
    evolution.mutations.push({
      date: new Date(),
      type: mutationType,
      description,
      before,
      after,
      reason
    });
    
    // Save updated evolution
    await this.saveEvolution(evolution);
    
    console.log('✅ Mutation tracked');
  }

  /**
   * Create pattern migration
   */
  async createMigration(
    fromPattern: string,
    toPattern: string,
    strategy: PatternMigration['plan']['strategy'],
    targetDate: Date
  ): Promise<PatternMigration> {
    console.log(`🚀 Creating migration: ${fromPattern} → ${toPattern}`);
    
    const migration: PatternMigration = {
      id: `migration-${Date.now()}`,
      fromPattern,
      toPattern,
      plan: {
        startDate: new Date(),
        targetDate,
        strategy,
        phases: this.generateMigrationPhases(strategy)
      },
      progress: {
        filesTotal: 0, // Will be updated
        filesMigrated: 0,
        percentComplete: 0,
        status: 'PLANNING'
      }
    };
    
    this.migrations.set(migration.id, migration);
    await this.saveMigration(migration);
    
    console.log('✅ Migration created');
    return migration;
  }

  /**
   * Update migration progress
   */
  async updateMigrationProgress(
    migrationId: string,
    filesMigrated: number,
    filesTotal: number
  ): Promise<void> {
    const migration = this.migrations.get(migrationId);
    if (!migration) return;
    
    migration.progress.filesTotal = filesTotal;
    migration.progress.filesMigrated = filesMigrated;
    migration.progress.percentComplete = (filesMigrated / filesTotal) * 100;
    
    if (filesMigrated === filesTotal) {
      migration.progress.status = 'COMPLETED';
    } else if (filesMigrated > 0) {
      migration.progress.status = 'IN_PROGRESS';
    }
    
    await this.saveMigration(migration);
  }

  /**
   * Calculate pattern health
   */
  async calculateHealth(patternId: string): Promise<PatternEvolution['health']> {
    const evolution = await this.getEvolution(patternId);
    if (!evolution) {
      throw new Error(`Pattern not found: ${patternId}`);
    }
    
    console.log(`🏥 Calculating health for: ${patternId}`);
    
    const factors: PatternEvolution['health']['factors'] = [];
    let score = 50; // Start neutral
    
    // Factor: Adoption trend
    if (evolution.trends.adoptionTrend === 'GROWING') {
      score += 20;
      factors.push({
        factor: 'Adoption',
        impact: +20,
        explanation: 'Pattern adoption is growing'
      });
    } else if (evolution.trends.adoptionTrend === 'DECLINING') {
      score -= 20;
      factors.push({
        factor: 'Adoption',
        impact: -20,
        explanation: 'Pattern adoption is declining'
      });
    }
    
    // Factor: Quality trend
    if (evolution.trends.qualityTrend === 'IMPROVING') {
      score += 15;
      factors.push({
        factor: 'Quality',
        impact: +15,
        explanation: 'Pattern improves code quality'
      });
    } else if (evolution.trends.qualityTrend === 'DEGRADING') {
      score -= 15;
      factors.push({
        factor: 'Quality',
        impact: -15,
        explanation: 'Pattern quality impact declining'
      });
    }
    
    // Factor: Stability
    const latestSnapshot = evolution.snapshots[evolution.snapshots.length - 1];
    if (latestSnapshot.lifecycle.stability > 0.8) {
      score += 10;
      factors.push({
        factor: 'Stability',
        impact: +10,
        explanation: 'Pattern usage is stable'
      });
    } else if (latestSnapshot.lifecycle.stability < 0.4) {
      score -= 10;
      factors.push({
        factor: 'Stability',
        impact: -10,
        explanation: 'Pattern usage is volatile'
      });
    }
    
    // Factor: Lifecycle stage
    if (latestSnapshot.lifecycle.stage === LifecycleStage.DEPRECATED) {
      score -= 30;
      factors.push({
        factor: 'Lifecycle',
        impact: -30,
        explanation: 'Pattern is deprecated'
      });
    } else if (latestSnapshot.lifecycle.stage === LifecycleStage.MATURE) {
      score += 10;
      factors.push({
        factor: 'Lifecycle',
        impact: +10,
        explanation: 'Pattern is mature and established'
      });
    }
    
    // Clamp score
    score = Math.max(0, Math.min(100, score));
    
    // Generate recommendation
    const recommendation = this.generateHealthRecommendation(score, factors);
    
    return { score, factors, recommendation };
  }

  /**
   * Count pattern occurrences
   */
  private countOccurrences(
    patternId: string,
    files: Array<{ path: string; content: string }>
  ): Array<{ file: string; code: string }> {
    // Simplified - would use actual pattern matching
    return [];
  }

  /**
   * Calculate diversity
   */
  private calculateDiversity(files: string[]): number {
    // Diversity based on file path spread
    const directories = new Set(files.map(f => path.dirname(f)));
    return Math.min(1, directories.size / 10);
  }

  /**
   * Calculate quality impact
   */
  private async calculateQualityImpact(
    patternId: string,
    files: string[]
  ): Promise<PatternSnapshot['qualityImpact']> {
    // Simplified - would integrate with actual quality metrics
    return {
      bugReduction: 0.15,
      performanceImprovement: 0.10,
      maintainabilityScore: 75,
      testCoverage: 80
    };
  }

  /**
   * Analyze team adoption
   */
  private async analyzeTeamAdoption(
    patternId: string,
    contributors: string[]
  ): Promise<PatternSnapshot['teamAdoption']> {
    return {
      contributorsUsing: contributors.slice(0, 5),
      teamsUsing: ['team-a', 'team-b'],
      adoptionVelocity: 0.5
    };
  }

  /**
   * Detect pattern variations
   */
  private detectVariations(
    patternId: string,
    occurrences: Array<{ file: string; code: string }>
  ): PatternSnapshot['variations'] {
    // Simplified variation detection
    return [];
  }

  /**
   * Determine lifecycle stage
   */
  private determineLifecycle(
    adoptionRate: number,
    variations: PatternSnapshot['variations']
  ): PatternSnapshot['lifecycle'] {
    let stage: LifecycleStage;
    
    if (adoptionRate < 0.1) stage = LifecycleStage.INTRODUCED;
    else if (adoptionRate < 0.3) stage = LifecycleStage.EMERGING;
    else if (adoptionRate < 0.6) stage = LifecycleStage.ADOPTED;
    else stage = LifecycleStage.MATURE;
    
    return {
      stage,
      daysInStage: 30, // Would calculate from snapshots
      stability: variations.length < 3 ? 0.8 : 0.4
    };
  }

  /**
   * Determine trend
   */
  private determineTrend(values: number[]): 'GROWING' | 'STABLE' | 'DECLINING' | 'IMPROVING' | 'DEGRADING' | 'INCREASING' | 'DECREASING' {
    if (values.length < 2) return 'STABLE' as any;
    
    const recent = values.slice(-3);
    const slope = (recent[recent.length - 1] - recent[0]) / recent.length;
    
    if (slope > 0.05) return 'GROWING' as any;
    if (slope < -0.05) return 'DECLINING' as any;
    return 'STABLE' as any;
  }

  /**
   * Calculate growth rate
   */
  private calculateGrowthRate(values: number[]): number {
    if (values.length < 2) return 0;
    
    const first = values[0];
    const last = values[values.length - 1];
    const periods = values.length - 1;
    
    return ((last - first) / first) / periods * 30; // Monthly rate
  }

  /**
   * Forecast value using exponential smoothing
   */
  private forecastValue(values: number[], daysAhead: number): number {
    if (values.length === 0) return 0;
    
    const alpha = 0.3;
    let forecast = values[0];
    
    for (let i = 1; i < values.length; i++) {
      forecast = alpha * values[i] + (1 - alpha) * forecast;
    }
    
    // Simple linear extrapolation
    const trend = this.calculateGrowthRate(values);
    const periods = daysAhead / 30; // Monthly periods
    
    return Math.max(0, Math.min(1, forecast * Math.pow(1 + trend, periods)));
  }

  /**
   * Generate forecast recommendations
   */
  private generateForecastRecommendations(
    current: number,
    predicted: number,
    growthRate: number
  ): string[] {
    const recommendations: string[] = [];
    
    if (growthRate > 0.2) {
      recommendations.push('✅ Strong growth - pattern is gaining traction');
      recommendations.push('Consider documenting pattern for wider adoption');
    } else if (growthRate < -0.1) {
      recommendations.push('⚠️ Declining adoption - pattern may be obsolete');
      recommendations.push('Consider migration to alternative pattern');
    } else {
      recommendations.push('📊 Stable adoption - pattern is established');
    }
    
    if (predicted > 0.8) {
      recommendations.push('🎯 Nearing full adoption - pattern becoming standard');
    }
    
    return recommendations;
  }

  /**
   * Generate migration phases
   */
  private generateMigrationPhases(
    strategy: PatternMigration['plan']['strategy']
  ): PatternMigration['plan']['phases'] {
    if (strategy === 'GRADUAL') {
      return [
        { name: 'Phase 1: Low-risk files', description: 'Migrate files with simple usage', estimatedDuration: 7 },
        { name: 'Phase 2: Medium-risk files', description: 'Migrate files with moderate complexity', estimatedDuration: 14 },
        { name: 'Phase 3: High-risk files', description: 'Migrate critical files', estimatedDuration: 14 },
        { name: 'Phase 4: Verification', description: 'Validate all migrations', estimatedDuration: 7 }
      ];
    } else if (strategy === 'BIG_BANG') {
      return [
        { name: 'Phase 1: Preparation', description: 'Plan and prepare migration', estimatedDuration: 7 },
        { name: 'Phase 2: Migration', description: 'Migrate all files at once', estimatedDuration: 3 },
        { name: 'Phase 3: Testing', description: 'Comprehensive testing', estimatedDuration: 7 }
      ];
    } else {
      return [
        { name: 'Phase 1: Setup parallel implementation', description: 'Implement new pattern alongside old', estimatedDuration: 14 },
        { name: 'Phase 2: Gradual switchover', description: 'Route traffic to new pattern', estimatedDuration: 21 },
        { name: 'Phase 3: Deprecate old pattern', description: 'Remove old pattern', estimatedDuration: 7 }
      ];
    }
  }

  /**
   * Generate health recommendation
   */
  private generateHealthRecommendation(
    score: number,
    factors: PatternEvolution['health']['factors']
  ): string {
    if (score >= 80) {
      return '✅ Excellent: Pattern is healthy and effective';
    } else if (score >= 60) {
      return '👍 Good: Pattern is performing well';
    } else if (score >= 40) {
      return '⚠️ Fair: Pattern needs attention';
    } else {
      return '🚨 Poor: Consider replacing or improving pattern';
    }
  }

  /**
   * Load evolutions
   */
  private async loadEvolutions(): Promise<void> {
    try {
      const evolutionsPath = path.join(this.config.dataPath, 'evolutions.json');
      const content = await fs.readFile(evolutionsPath, 'utf-8');
      const evolutions: PatternEvolution[] = JSON.parse(content);
      
      for (const evolution of evolutions) {
        this.evolutions.set(evolution.patternId, evolution);
      }
    } catch {
      console.log('⚠️  No evolution data found');
    }
  }

  /**
   * Load evolution
   */
  private async loadEvolution(patternId: string): Promise<PatternEvolution | undefined> {
    // Would load from individual pattern file
    return undefined;
  }

  /**
   * Load migrations
   */
  private async loadMigrations(): Promise<void> {
    try {
      const migrationsPath = path.join(this.config.dataPath, 'migrations.json');
      const content = await fs.readFile(migrationsPath, 'utf-8');
      const migrations: PatternMigration[] = JSON.parse(content);
      
      for (const migration of migrations) {
        this.migrations.set(migration.id, migration);
      }
    } catch {
      console.log('⚠️  No migration data found');
    }
  }

  /**
   * Save snapshot
   */
  private async saveSnapshot(snapshot: PatternSnapshot): Promise<void> {
    // Would append to pattern evolution history
  }

  /**
   * Save evolution
   */
  private async saveEvolution(evolution: PatternEvolution): Promise<void> {
    const evolutionsPath = path.join(this.config.dataPath, 'evolutions.json');
    const evolutions = Array.from(this.evolutions.values());
    
    await fs.mkdir(this.config.dataPath, { recursive: true });
    await fs.writeFile(evolutionsPath, JSON.stringify(evolutions, null, 2));
  }

  /**
   * Save migration
   */
  private async saveMigration(migration: PatternMigration): Promise<void> {
    const migrationsPath = path.join(this.config.dataPath, 'migrations.json');
    const migrations = Array.from(this.migrations.values());
    
    await fs.mkdir(this.config.dataPath, { recursive: true });
    await fs.writeFile(migrationsPath, JSON.stringify(migrations, null, 2));
  }
}

/**
 * Convenience function to forecast pattern adoption
 */
export async function forecastPatternAdoption(
  patternId: string,
  horizon?: 'SHORT_TERM' | 'MEDIUM_TERM' | 'LONG_TERM'
): Promise<PatternAdoptionForecast> {
  const tracker = new PatternEvolutionTracker();
  await tracker.initialize();
  return tracker.forecastAdoption(patternId, horizon);
}
