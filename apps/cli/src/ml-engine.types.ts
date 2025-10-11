// ODAVL Wave 9: ML-Powered Decision Engine Schema
// Advanced decision making with context analysis and predictive capabilities

// Type aliases for common unions
export type ProjectType = 'frontend' | 'backend' | 'fullstack' | 'library' | 'monorepo';
export type PackageManager = 'npm' | 'yarn' | 'pnpm';
export type IndentationType = 'spaces' | 'tabs';
export type ImportStyle = 'named' | 'default' | 'mixed';
export type RiskTolerance = 'conservative' | 'moderate' | 'aggressive';
export type QualityLevel = 'low' | 'medium' | 'high';
export type QualityTrajectory = 'improving' | 'stable' | 'degrading';
export type TimeHorizon = '1day' | '1week' | '1month' | '3months';
export type InsightType = 'improvement' | 'warning' | 'optimization';
export type Priority = 'low' | 'medium' | 'high' | 'critical';
export type PerformanceTrend = 'improving' | 'stable' | 'declining';

export interface Metrics {
  eslintWarnings: number;
  typeErrors: number;
  timestamp: string;
  filesAnalyzed?: number;
  codeComplexity?: number;
  testCoverage?: number;
}

export interface CodeContextAnalysis {
  // Project characteristics
  projectType: ProjectType;
  primaryLanguages: string[];
  frameworks: string[];
  packageManager: PackageManager;
  
  // Code patterns
  architecturalPatterns: string[];
  codingStyle: {
    indentation: IndentationType;
    lineLength: number;
    importStyle: ImportStyle;
  };
  
  // Team preferences (learned over time)
  preferredRecipes: string[];
  riskTolerance: RiskTolerance;
  qualityThresholds: {
    eslintWarningTolerance: number;
    typeErrorTolerance: number;
  };
  
  // Historical context
  recentChanges: {
    filesModified: number;
    linesChanged: number;
    commitsInLastWeek: number;
  };
  
  // Quality trends
  qualityTrajectory: QualityTrajectory;
  technicalDebtLevel: QualityLevel;
}

export interface Recipe extends Record<string, unknown> {
  id: string;
  name: string;
  description: string;
  trust?: number;
  
  // Enhanced ML properties
  applicabilityScore?: number;
  contextSuitability?: string[];
  riskLevel: QualityLevel;
  estimatedImpact: {
    eslintReduction: number;
    typeErrorReduction: number;
    processingTime: number;
  };
  
  // Learning metadata
  successRate?: number;
  contextualSuccessRates?: Record<string, number>;
  lastUpdated?: string;
}

export interface MLDecisionContext {
  currentMetrics: Metrics;
  codeContext: CodeContextAnalysis;
  availableRecipes: Recipe[];
  historicalPerformance: TrustRecord[];
  environmentConstraints: {
    timebudget: number; // milliseconds
    riskBudget: RiskTolerance;
    qualityGates: QualityGates;
  };
}

export interface MLDecisionResult {
  selectedRecipe: Recipe;
  confidence: number; // 0-1
  reasoning: string[];
  alternativeOptions: Recipe[];
  predictedOutcome: {
    expectedEslintReduction: number;
    expectedTypeErrorReduction: number;
    riskAssessment: string;
  };
  fallbackStrategy?: Recipe;
}

export interface QualityForecast {
  timeHorizon: TimeHorizon;
  predictions: {
    eslintWarnings: {
      current: number;
      predicted: number;
      confidence: number;
    };
    typeErrors: {
      current: number;
      predicted: number;  
      confidence: number;
    };
    technicalDebt: {
      current: QualityLevel;
      predicted: QualityLevel;
      confidence: number;
    };
  };
  recommendations: ActionableInsight[];
}

export interface ActionableInsight {
  type: InsightType;
  priority: Priority;
  title: string;
  description: string;
  suggestedAction: string;
  estimatedImpact: string;
  timeToImplement: string;
}

export interface TrustRecord {
  id: string;
  runs: number;
  success: number;
  trust: number;
  
  // Enhanced ML tracking
  contextualPerformance: Record<string, {
    runs: number;
    success: number;
    averageImpact: number;
  }>;
  recentPerformance: {
    lastWeek: number;
    lastMonth: number;
  };
  performanceTrend: PerformanceTrend;
}

export interface QualityGates {
  eslint?: { deltaMax: number };
  typeErrors?: { deltaMax: number };
  [key: string]: unknown;
}

// ML Decision Engine Interface
export interface MLDecisionEngine {
  /**
   * Analyzes current code context to understand project patterns and preferences
   */
  analyzeCodeContext(metrics: Metrics): Promise<CodeContextAnalysis>;
  
  /**
   * Selects optimal recipe based on ML analysis of context and historical performance
   */
  selectOptimalRecipe(
    context: MLDecisionContext
  ): Promise<MLDecisionResult>;
  
  /**
   * Updates ML model based on the outcome of a recipe execution
   */
  learnFromOutcome(
    decision: MLDecisionResult, 
    outcome: RunReport
  ): Promise<void>;
  
  /**
   * Predicts future code quality trends based on current patterns
   */
  predictQualityTrend(
    context: CodeContextAnalysis,
    timeHorizon: TimeHorizon
  ): Promise<QualityForecast>;
  
  /**
   * Provides explanation for ML decisions (for transparency)
   */
  explainDecision(decision: MLDecisionResult): Promise<string[]>;
  
  /**
   * Validates ML model performance and triggers retraining if needed
   */
  validateModelPerformance(): Promise<{
    accuracy: number;
    needsRetraining: boolean;
    lastTraining: string;
  }>;
}

// Context Analysis Utilities
export interface ContextAnalyzer {
  /**
   * Analyzes project structure to determine type and characteristics
   */
  analyzeProjectStructure(rootPath: string): Promise<Partial<CodeContextAnalysis>>;
  
  /**
   * Extracts coding style preferences from existing code
   */
  analyzeCodingStyle(files: string[]): Promise<CodeContextAnalysis['codingStyle']>;
  
  /**
   * Identifies architectural patterns used in the project
   */
  identifyArchitecturalPatterns(rootPath: string): Promise<string[]>;
  
  /**
   * Analyzes git history to understand change patterns
   */
  analyzeChangePatterns(rootPath: string): Promise<CodeContextAnalysis['recentChanges']>;
}

// Training Data Collection
export interface MLTrainingData {
  timestamp: string;
  context: CodeContextAnalysis;
  availableRecipes: Recipe[];
  selectedRecipe: Recipe;
  outcome: RunReport;
  humanFeedback?: {
    satisfaction: number; // 1-5
    wouldChooseSameRecipe: boolean;
    suggestedAlternative?: string;
  };
}

export interface TrainingDataCollector {
  /**
   * Collects training data from ODAVL runs
   */
  collectTrainingData(
    context: MLDecisionContext,
    decision: MLDecisionResult,
    outcome: RunReport
  ): Promise<MLTrainingData>;
  
  /**
   * Exports training data for ML model training
   */
  exportTrainingDataSet(
    fromDate?: string,
    toDate?: string
  ): Promise<MLTrainingData[]>;
  
  /**
   * Validates training data quality and consistency
   */
  validateTrainingData(data: MLTrainingData[]): Promise<{
    valid: boolean;
    issues: string[];
    recommendedCleanup: string[];
  }>;
}

// Existing interfaces for compatibility
export interface RunReport {
  before: Metrics;
  after: Metrics;
  deltas: { eslint: number; types: number };
  decision: string;
  gatesPassed?: boolean;
  gates?: unknown;
  
  // Enhanced for ML
  mlDecision?: MLDecisionResult;
  contextAnalysis?: CodeContextAnalysis;
  actualVsPredicted?: {
    eslintDelta: { predicted: number; actual: number };
    typeErrorDelta: { predicted: number; actual: number };
  };
}