/**
 * TypeScript types for ODAVL Manifest Standard (OMS) v1.0
 * These types mirror the JSON Schema at .odavl/schemas/manifest.schema.json
 */

export type RiskProfile = 'low' | 'medium' | 'high' | 'critical';
export type Criticality = 'low' | 'medium' | 'high';
export type Severity = 'low' | 'medium' | 'high' | 'critical';
export type LearningMode = 'adaptive' | 'conservative' | 'disabled';
export type BaselineMode = 'strict' | 'adaptive' | 'disabled';
export type BaselineUpdatePolicy = 'manual' | 'auto-improve' | 'auto-degrade' | 'never';
export type WCAGLevel = 'A' | 'AA' | 'AAA';
export type ConflictResolution = 'sequential' | 'highest-trust' | 'fail';
export type RecipeSelectionStrategy = 'ml-predictor' | 'trust-score' | 'success-rate' | 'random';

export interface ODAVLManifest {
  version: string;
  schemaVersion: string;
  project: ProjectMetadata;
  fileTaxonomy: FileTaxonomy;
  insight?: InsightConfiguration;
  autopilot?: AutopilotConfiguration;
  guardian?: GuardianConfiguration;
  brain?: BrainConfiguration;
  overrides?: Overrides;
}

export interface ProjectMetadata {
  id: string;
  name: string;
  description?: string;
  languages: string[];
  riskProfile: RiskProfile;
  criticality: Criticality;
  tags?: string[];
}

export interface FileTaxonomy {
  tests: TestsConfiguration;
  fixtures: string[];
  logs: string[];
  reports: string[];
  schemas?: string[];
  recipes?: string[];
  mlModels?: string[];
  uiSnapshots?: string[];
  migrations?: string[];
  coverage?: string[];
  diagnostics?: string[];
  trainingData?: string[];
  overrides?: FileTaxonomyOverrides;
}

export interface TestsConfiguration {
  unit: string[];
  integration: string[];
  e2e: string[];
  snapshots?: string[];
}

export interface FileTaxonomyOverrides {
  insight?: Record<string, string[]>;
  autopilot?: Record<string, string[]>;
  guardian?: Record<string, string[]>;
}

export interface InsightConfiguration {
  enabled?: string[];
  disabled?: string[];
  minSeverity?: Severity;
  maxFiles?: number;
  fileGlobs?: Record<string, string[]>;
  falsePositiveRules?: FalsePositiveRule[];
  detectorCapabilityMap?: Record<string, DetectorCapability>;
}

export interface FalsePositiveRule {
  detector: string;
  pattern: string;
  reason?: string;
  expires?: string;
}

export interface DetectorCapability {
  extensions?: string[];
  priority?: number;
}

export interface AutopilotConfiguration {
  riskBudget?: RiskBudget;
  protectedPaths?: string[];
  avoidChanges?: string[];
  trust?: TrustConfiguration;
  recipeSelection?: RecipeSelection;
}

export interface RiskBudget {
  maxLoc: number;
  maxFiles: number;
  maxRecipes?: number;
}

export interface TrustConfiguration {
  min?: number;
  max?: number;
  approveIf?: ApprovalCondition[];
}

export interface ApprovalCondition {
  condition: string;
  reason?: string;
}

export interface RecipeSelection {
  strategies?: RecipeSelectionStrategy[];
  modelVersion?: string;
  dependencyRules?: DependencyRules;
}

export interface DependencyRules {
  allowParallel?: boolean;
  maxParallelWorkers?: number;
  conflictResolution?: ConflictResolution;
}

export interface GuardianConfiguration {
  suites?: GuardianSuites;
  thresholds?: GuardianThresholds;
  environments?: Environment[];
  baselinePolicy?: BaselinePolicy;
}

export interface GuardianSuites {
  performance?: PerformanceSuite;
  accessibility?: AccessibilitySuite;
  security?: SecuritySuite;
  visual?: VisualSuite;
  e2e?: E2ESuite;
}

export interface PerformanceSuite {
  enabled?: boolean;
  tools?: string[];
}

export interface AccessibilitySuite {
  enabled?: boolean;
  tools?: string[];
  wcagLevel?: WCAGLevel;
}

export interface SecuritySuite {
  enabled?: boolean;
  checks?: string[];
}

export interface VisualSuite {
  enabled?: boolean;
  tool?: string;
  threshold?: number;
}

export interface E2ESuite {
  enabled?: boolean;
  framework?: string;
}

export interface GuardianThresholds {
  lighthouse?: LighthouseThresholds;
  webVitals?: WebVitalsThresholds;
}

export interface LighthouseThresholds {
  performance?: number;
  accessibility?: number;
  bestPractices?: number;
  seo?: number;
  pwa?: number;
}

export interface WebVitalsThresholds {
  lcp?: number;
  fid?: number;
  cls?: number;
}

export interface Environment {
  name: string;
  url: string;
  skipSuites?: string[];
}

export interface BaselinePolicy {
  mode?: BaselineMode;
  updateOn?: BaselineUpdatePolicy;
}

export interface BrainConfiguration {
  learningMode?: LearningMode;
  memory?: MemoryConfiguration;
  confidenceThresholds?: ConfidenceThresholds;
  decisionPolicy?: DecisionPolicy;
}

export interface MemoryConfiguration {
  shortTermLimit?: number;
  longTermLimit?: number;
}

export interface ConfidenceThresholds {
  insight?: number;
  autopilot?: number;
  guardian?: number;
}

export interface DecisionPolicy {
  allowDeployIf?: ApprovalCondition[];
  autoApproveRecipesIf?: ApprovalCondition[];
}

export interface Overrides {
  byDirectory?: Record<string, ProductOverrides>;
  byFileType?: Record<string, ProductOverrides>;
  byProduct?: ProductOverrides;
}

export interface ProductOverrides {
  insight?: Partial<InsightConfiguration>;
  autopilot?: Partial<AutopilotConfiguration>;
  guardian?: Partial<GuardianConfiguration>;
  brain?: Partial<BrainConfiguration>;
}
