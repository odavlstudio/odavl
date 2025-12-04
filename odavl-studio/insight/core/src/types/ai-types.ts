/**
 * ODAVL Insight - AI Detection Types
 * TypeScript interfaces for AI-powered detection
 */

// ============================================================
// Core Issue Types
// ============================================================

export interface Issue {
  id: string;
  type: 'security' | 'performance' | 'quality' | 'complexity';
  severity: 'critical' | 'high' | 'medium' | 'low';
  message: string;
  confidence: number; // 0-100
  line: number;
  column: number;
  source: 'rule-based' | 'semantic-analysis' | 'gpt-4' | 'claude' | 'custom';
  suggestion: string; // How to fix (explanation only)
  autopilotHandoff: boolean; // Can be fixed by Autopilot?
  codeSnippet?: string;
  fixComplexity?: 'simple' | 'medium' | 'complex';
}

// ============================================================
// Detection Configuration
// ============================================================

export interface AIDetectionConfig {
  // AI Models
  enableGPT4: boolean;
  enableClaude: boolean;
  enableCustomModel: boolean;

  // Detection Strategy
  strategy: 'fast' | 'balanced' | 'thorough';
  
  // Thresholds
  confidenceThreshold: number; // Minimum confidence to report (0-100)
  maxIssuesPerFile: number;
  
  // Context Awareness
  respectGitignore: boolean;
  skipTestFiles: boolean;
  skipGeneratedFiles: boolean;
  
  // Performance
  maxConcurrentRequests: number;
  timeoutMs: number;
  cacheResults: boolean;
  
  // Cost Control (for paid APIs)
  maxTokensPerFile: number;
  maxCostPerDay: number; // USD
}

// ============================================================
// Detection Results
// ============================================================

export interface DetectionResult {
  issues: Issue[];
  confidence: number;
  detectionTime: number; // milliseconds
  modelUsed: 'none' | 'rule-based' | 'semantic' | 'gpt-4' | 'claude' | 'hybrid';
  metadata: {
    filePath: string;
    language: string;
    fileType: 'test' | 'business' | 'infrastructure' | 'migration';
    linesOfCode?: number;
    complexity?: number;
  };
  costEstimate?: {
    tokensUsed: number;
    costUSD: number;
  };
}

// ============================================================
// AI Model Types
// ============================================================

export interface AIModel {
  id: string;
  name: string;
  provider: 'openai' | 'anthropic' | 'custom';
  version: string;
  accuracy: number; // 0-100
  avgLatency: number; // milliseconds
  costPerToken: number; // USD
  maxTokens: number;
  capabilities: AICapability[];
}

export type AICapability =
  | 'security-analysis'
  | 'performance-analysis'
  | 'code-smell-detection'
  | 'bug-prediction'
  | 'complexity-analysis'
  | 'best-practices'
  | 'pr-review'
  | 'context-understanding';

// ============================================================
// PR Review Types
// ============================================================

export interface PRReviewResult {
  score: number; // 0-100
  estimatedReviewTime: string;
  complexity: 'simple' | 'medium' | 'complex';
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  
  issues: {
    blocking: Issue[];
    nonBlocking: Issue[];
  };
  
  suggestions: string[];
  suggestedReviewers?: string[]; // Based on file ownership
  
  metrics: {
    filesChanged: number;
    linesAdded: number;
    linesDeleted: number;
    totalIssues: number;
  };
  
  aiInsights?: {
    model: string;
    confidence: number;
    reasoning: string;
  };
}

// ============================================================
// Semantic Analysis Types
// ============================================================

export interface CodeEmbedding {
  vector: number[];
  model: 'codebert' | 'graphcodebert' | 'custom';
  dimension: number;
}

export interface SimilarityResult {
  filePath: string;
  similarity: number; // 0-1
  issues: Issue[];
}

// ============================================================
// ML Training Types
// ============================================================

export interface TrainingDatapoint {
  code: string;
  language: string;
  features: number[];
  label: 'issue' | 'clean';
  issueType?: Issue['type'];
  severity?: Issue['severity'];
  metadata: {
    projectId: string;
    teamId: string;
    timestamp: number;
    userFeedback?: 'correct' | 'false-positive' | 'false-negative';
  };
}

export interface ModelMetrics {
  accuracy: number;
  precision: number;
  recall: number;
  f1Score: number;
  falsePositiveRate: number;
  falseNegativeRate: number;
  confusionMatrix: number[][];
  trainingTime: number; // seconds
  lastUpdated: number; // timestamp
}

// ============================================================
// Context Types
// ============================================================

export interface CodeContext {
  filePath: string;
  language: string;
  framework?: string;
  fileType: 'test' | 'business' | 'infrastructure' | 'migration';
  
  project: {
    name: string;
    type: 'web' | 'mobile' | 'backend' | 'library' | 'cli';
    architecture?: 'monolith' | 'microservices' | 'serverless';
  };
  
  team: {
    id: string;
    size: number;
    seniority: 'junior' | 'mixed' | 'senior';
    conventions?: Record<string, any>;
  };
  
  git?: {
    branch: string;
    author: string;
    commitMessage: string;
    prNumber?: number;
  };
}

// ============================================================
// Export All
// ============================================================
// Types already exported above with 'export interface' keyword
