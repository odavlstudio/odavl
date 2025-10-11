// ODAVL Wave 9: ML Training Data Framework  
// System to collect and structure training data from existing ODAVL runs

import type { 
  CodeContextAnalysis,
  ProjectType,
  QualityLevel
} from './ml-engine.types.js';

// Local type definitions for training data framework
export interface QualityMetrics {
  eslintWarnings: number;
  typeErrors: number;
  codeComplexity: number;
  testCoverage: number;
  duplication: number;
  timestamp: string;
}

export interface ActionOutcome {
  success: boolean;
  qualityImprovement: number;
  regressionIntroduced: boolean;
  userAcceptance: boolean;
  timeToComplete: number;
}

// Training data collection types
export interface TrainingDataPoint {
  id: string;
  timestamp: string;
  sessionId: string;
  
  // Context information
  projectContext: {
    type: ProjectType;
    language: string;
    framework?: string;
    codebaseSize: number; // lines of code
    teamSize: number;
    complexity: QualityLevel;
  };
  
  // Pre-action state
  beforeState: {
    eslintWarnings: number;
    typeErrors: number;
    codeComplexity: number;
    testCoverage: number;
    duplication: number;
  };
  
  // Action taken
  action: {
    type: string;
    description: string;
    filesModified: string[];
    linesChanged: number;
    confidence: number;
  };
  
  // Post-action state
  afterState: {
    eslintWarnings: number;
    typeErrors: number;
    codeComplexity: number;
    testCoverage: number;
    duplication: number;
  };
  
  // Outcome assessment
  outcome: {
    success: boolean;
    qualityImprovement: number; // -100 to 100
    regressionIntroduced: boolean;
    userAcceptance: boolean;
    timeToComplete: number; // milliseconds
  };
  
  // Environment context
  environment: {
    nodeVersion: string;
    packageManager: 'npm' | 'yarn' | 'pnpm';
    ciEnvironment?: string;
    deploymentStage: 'development' | 'staging' | 'production';
  };
  
  // Team context
  team: {
    experience: QualityLevel;
    codeStyle: string;
    testingCulture: QualityLevel;
    automationPreference: QualityLevel;
  };
}

// Training data aggregation and analysis
export interface TrainingDataSet {
  id: string;
  name: string;
  description: string;
  createdAt: string;
  updatedAt: string;
  
  // Data points
  dataPoints: TrainingDataPoint[];
  totalSamples: number;
  
  // Quality metrics
  quality: {
    completeness: number; // 0-1
    consistency: number; // 0-1  
    accuracy: number; // 0-1
    representativeness: number; // 0-1
  };
  
  // Distribution analysis
  distribution: {
    projectTypes: Record<ProjectType, number>;
    languages: Record<string, number>;
    teamSizes: { min: number; max: number; avg: number };
    complexityLevels: Record<QualityLevel, number>;
    outcomes: { successful: number; failed: number; mixed: number };
  };
  
  // Feature statistics
  features: {
    mostPredictiveFeatures: {
      name: string;
      importance: number;
      correlation: number;
    }[];
    
    featureCorrelations: Record<string, Record<string, number>>;
    
    outliers: {
      dataPointId: string;
      reason: string;
      severity: 'low' | 'medium' | 'high';
    }[];
  };
}

// Data collection configuration
export interface DataCollectionConfig {
  // Collection settings
  enabled: boolean;
  samplingRate: number; // 0-1, percentage of runs to collect
  maxStorageSize: number; // bytes
  retentionDays: number;
  
  // Privacy and compliance
  anonymize: boolean;
  excludeFields: string[];
  consentRequired: boolean;
  
  // Quality filters
  minQualityThreshold: number;
  excludeFailedRuns: boolean;
  requireUserFeedback: boolean;
  
  // Storage options
  storage: {
    local: boolean;
    remote?: {
      endpoint: string;
      apiKey: string;
      encryption: boolean;
    };
  };
}

// Data preprocessing and feature engineering
export interface FeatureEngineering {
  /**
   * Extracts meaningful features from raw training data
   */  
  extractFeatures(dataPoint: TrainingDataPoint): Promise<EngineeredFeatures>;
  
  /**
   * Normalizes and scales feature values
   */
  normalizeFeatures(features: EngineeredFeatures[]): Promise<NormalizedFeatures[]>;
  
  /**
   * Generates synthetic training data for underrepresented scenarios
   */
  generateSyntheticData(
    templateData: TrainingDataPoint[],
    targetCount: number
  ): Promise<TrainingDataPoint[]>;
  
  /**
   * Validates feature quality and consistency
   */
  validateFeatures(features: EngineeredFeatures[]): Promise<ValidationResult>;
}

export interface EngineeredFeatures {
  // Basic metrics (normalized 0-1)
  warningsDensity: number; // warnings per 1000 lines
  errorsDensity: number;
  complexityScore: number;
  testCoverageScore: number;
  
  // Derived features
  codeHealth: number; // composite score
  changeRisk: number; // risk of introducing regressions
  maintenanceLoad: number; // technical debt indicator
  
  // Temporal features
  timeOfDay: number; // 0-23
  dayOfWeek: number; // 0-6
  commitFrequency: number; // commits per day
  
  // Team context features
  teamExperience: number; // 0-1
  codeStyleConsistency: number; // 0-1
  testingMaturity: number; // 0-1
  
  // Project context features
  projectMaturity: number; // age in months
  dependencyCount: number;
  bundleSize: number; // KB
  
  // Historical context
  recentFailures: number; // failures in last 7 days
  averageSuccess: number; // success rate over last 30 days
  trendDirection: number; // -1 to 1, quality trend
}

export interface NormalizedFeatures {
  features: Record<string, number>;
  scalingFactors: Record<string, { min: number; max: number; mean: number; std: number }>;
  version: string;
}

export interface ValidationResult {
  valid: boolean;
  issues: {
    type: 'missing_values' | 'outliers' | 'inconsistency' | 'correlation_issues';
    description: string;
    severity: 'low' | 'medium' | 'high';
    affectedFeatures: string[];
  }[];
  recommendations: string[];
  dataQualityScore: number; // 0-1
}

// Training data collection system
export interface TrainingDataCollector {
  /**
   * Collects training data from an ODAVL run
   */
  collectFromRun(
    runId: string,
    beforeMetrics: QualityMetrics,
    action: { type: string; description: string; confidence: number },
    afterMetrics: QualityMetrics,
    outcome: ActionOutcome
  ): Promise<TrainingDataPoint>;
  
  /**
   * Stores training data point with privacy compliance
   */
  storeDataPoint(dataPoint: TrainingDataPoint): Promise<void>;
  
  /**
   * Retrieves training data with filtering and pagination
   */
  getTrainingData(filters: {
    projectType?: ProjectType;
    language?: string;
    dateRange?: { start: string; end: string };
    minQuality?: number;
    limit?: number;
    offset?: number;
  }): Promise<{ data: TrainingDataPoint[]; total: number }>;
  
  /**
   * Creates a training dataset from collected data points
   */
  createDataSet(
    name: string,
    filters: Record<string, unknown>,
    config: { 
      splitRatio?: { train: number; validation: number; test: number };
      balancing?: 'none' | 'oversample' | 'undersample';
      shuffleSeed?: number;
    }
  ): Promise<TrainingDataSet>;
  
  /**
   * Exports training data in ML-ready formats
   */
  exportData(
    dataSetId: string,
    format: 'json' | 'csv' | 'parquet' | 'tfrecord' | 'pytorch'
  ): Promise<Buffer>;
  
  /**
   * Validates and cleans training data
   */
  validateData(dataSetId: string): Promise<ValidationResult>;
  
  /**
   * Anonymizes sensitive information in training data
   */
  anonymizeData(dataPoints: TrainingDataPoint[]): Promise<TrainingDataPoint[]>;
}

// ML model training interfaces
export interface ModelTrainingConfig {
  modelType: 'decision_tree' | 'random_forest' | 'neural_network' | 'gradient_boosting';
  hyperparameters: Record<string, unknown>;
  
  // Training settings
  epochs?: number;
  batchSize?: number;
  learningRate?: number;
  validationSplit: number;
  
  // Early stopping
  earlyStoppingPatience?: number;
  minDeltaImprovement?: number;
  
  // Regularization
  l1Regularization?: number;
  l2Regularization?: number;
  dropout?: number;
  
  // Feature selection
  featureSelection: {
    method: 'all' | 'correlation' | 'importance' | 'pca';
    maxFeatures?: number;
    threshold?: number;
  };
}

export interface TrainingResult {
  modelId: string;
  trainingTime: number; // milliseconds
  
  // Performance metrics
  metrics: {
    accuracy: number;
    precision: number;
    recall: number;
    f1Score: number;
    auc: number;
    confusionMatrix: number[][];
  };
  
  // Training progression
  trainingHistory: {
    epoch: number;
    trainLoss: number;
    validationLoss: number;
    trainAccuracy: number;
    validationAccuracy: number;
  }[];
  
  // Feature importance
  featureImportance: {
    feature: string;
    importance: number;
    rank: number;
  }[];
  
  // Model artifacts
  modelArtifacts: {
    weights: Buffer;
    config: ModelTrainingConfig;
    scalingFactors: Record<string, unknown>;
    featureNames: string[];
  };
}

// Model training pipeline
export interface MLTrainingPipeline {
  /**
   * Trains a new ML model using collected training data
   */
  trainModel(
    dataSetId: string,
    config: ModelTrainingConfig
  ): Promise<TrainingResult>;
  
  /**
   * Evaluates model performance on test data
   */
  evaluateModel(
    modelId: string,
    testDataSetId: string
  ): Promise<{
    metrics: TrainingResult['metrics'];
    predictions: { actual: number; predicted: number; confidence: number }[];
  }>;
  
  /**
   * Compares multiple models and selects the best performer
   */
  compareModels(
    modelIds: string[]
  ): Promise<{
    bestModel: string;
    rankings: { modelId: string; score: number; rank: number }[];
    detailedComparison: Record<string, TrainingResult['metrics']>;
  }>;
  
  /**
   * Deploys trained model for production use
   */
  deployModel(
    modelId: string,
    deploymentConfig: {
      version: string;
      environment: 'staging' | 'production';
      rolloutStrategy: 'immediate' | 'gradual' | 'canary';
    }
  ): Promise<{ deploymentId: string; endpoint: string }>;
  
  /**
   * Monitors model performance in production
   */
  monitorModel(modelId: string): Promise<{
    predictions: number;
    accuracy: number;
    latency: number;
    errorRate: number;
    driftDetected: boolean;
  }>;
}

// Integration with main ODAVL system
export interface MLDataIntegration {
  /**
   * Integrates with main ODAVL cycle to collect training data
   */
  enableDataCollection(config: DataCollectionConfig): Promise<void>;
  
  /**
   * Hooks into ODAVL decision making to record context and outcomes
   */
  recordDecisionContext(
    context: CodeContextAnalysis,
    decision: string,
    confidence: number
  ): Promise<string>; // returns correlation ID
  
  /**
   * Records the outcome of ODAVL actions for training
   */
  recordActionOutcome(
    correlationId: string,
    outcome: ActionOutcome,
    userFeedback?: { helpful: boolean; comment?: string }
  ): Promise<void>;
  
  /**
   * Provides real-time feedback to improve model predictions
   */
  provideFeedback(
    predictionId: string,
    actualOutcome: ActionOutcome,
    userSatisfaction: number // 1-5 scale
  ): Promise<void>;
}

// Data privacy and compliance
export interface DataPrivacyManager {
  /**
   * Ensures GDPR compliance for training data collection
   */
  ensureGDPRCompliance(dataPoint: TrainingDataPoint): Promise<boolean>;
  
  /**
   * Handles user consent management
   */
  manageConsent(userId: string, consentType: 'collection' | 'processing' | 'storage'): Promise<boolean>;
  
  /**
   * Anonymizes personal information in training data
   */
  anonymizePersonalData(data: TrainingDataPoint[]): Promise<TrainingDataPoint[]>;
  
  /**
   * Provides data deletion capabilities (right to be forgotten)
   */
  deleteUserData(userId: string): Promise<{ deletedRecords: number }>;
  
  /**
   * Generates compliance reports
   */
  generateComplianceReport(): Promise<{
    dataPoints: number;
    anonymizedPercentage: number;
    consentStatus: Record<string, number>;
    retentionCompliance: boolean;
  }>;
}