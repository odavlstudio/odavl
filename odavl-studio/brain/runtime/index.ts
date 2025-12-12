/**
 * ODAVL Brain - Runtime Deployment Confidence Module
 * Phase P8: Centralized exports for Brain intelligence
 * Phase P9: Machine Learning & Predictive Intelligence
 * 
 * This module provides the complete Brain deployment confidence system
 * for intelligent, risk-aware deployment decisions with ML-enhanced predictions.
 * 
 * @module @odavl/brain/runtime
 */

// Core Functions
export {
  classifyRiskLevel,
  calculateTestImpact,
  calculateBaselineStability,
  computeDeploymentConfidence,
} from './runtime-deployment-confidence';

// Auditor
export {
  BrainDeploymentAuditor,
  getBrainDeploymentAuditor,
} from './runtime-deployment-confidence';

// Type Exports
export type {
  FileTypeStats,
  GuardianReport,
  BaselineHistory,
  RiskClassification,
  TestImpact,
  BaselineStability,
  DeploymentDecision,
  AuditEntry,
  AuditStats,
} from './runtime-deployment-confidence';

// Phase P9: Learning Module Exports
export type {
  BrainMLModel,
  TrainingSample,
  TrainingMetrics,
  ModelConfig,
  BrainHistoryStore,
  StoredTrainingSample,
  RollingWindowStats,
  MLInputVector,
  MLPrediction,
  EnhancedConfidence,
} from '../learning/index.js';
