// ODAVL Wave 9: ML Training Data Collection Implementation
// Concrete implementation of training data collection system

import type { 
  TrainingDataCollector,
  TrainingDataPoint,
  TrainingDataSet,
  DataCollectionConfig,
  ValidationResult,
  QualityMetrics,
  ActionOutcome
} from './training-data.types.js';

import type { 
  ProjectType
} from './ml-engine.types.js';

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { randomUUID } from 'node:crypto';

export class ODAvlTrainingDataCollector implements TrainingDataCollector {
  private config: DataCollectionConfig;
  private storageDir: string;
  
  constructor(config: DataCollectionConfig, storageDir = '.odavl/training-data') {
    this.config = config;
    this.storageDir = storageDir;
    
    // Ensure storage directory exists
    if (!existsSync(this.storageDir)) {
      mkdirSync(this.storageDir, { recursive: true });
    }
  }
  
  async collectFromRun(
    runId: string,
    beforeMetrics: QualityMetrics,
    action: { type: string; description: string; confidence: number },
    afterMetrics: QualityMetrics,
    outcome: ActionOutcome
  ): Promise<TrainingDataPoint> {
    
    // Skip if collection is disabled or sampling says no
    if (!this.config.enabled || Math.random() > this.config.samplingRate) {
      throw new Error('Data collection skipped due to configuration');
    }
    
    const timestamp = new Date().toISOString();
    const sessionId = runId;
    
    // Collect project context
    const projectContext = await this.analyzeProjectContext();
    
    // Collect environment context  
    const environment = await this.analyzeEnvironmentContext();
    
    // Collect team context
    const team = await this.analyzeTeamContext();
    
    const dataPoint: TrainingDataPoint = {
      id: randomUUID(),
      timestamp,
      sessionId,
      projectContext,
      beforeState: {
        eslintWarnings: beforeMetrics.eslintWarnings,
        typeErrors: beforeMetrics.typeErrors,
        codeComplexity: beforeMetrics.codeComplexity,
        testCoverage: beforeMetrics.testCoverage,
        duplication: beforeMetrics.duplication
      },
      action: {
        type: action.type,
        description: action.description,
        filesModified: [], // Will be populated by caller
        linesChanged: 0,    // Will be populated by caller
        confidence: action.confidence
      },
      afterState: {
        eslintWarnings: afterMetrics.eslintWarnings,
        typeErrors: afterMetrics.typeErrors,
        codeComplexity: afterMetrics.codeComplexity,
        testCoverage: afterMetrics.testCoverage,
        duplication: afterMetrics.duplication
      },
      outcome: {
        success: outcome.success,
        qualityImprovement: outcome.qualityImprovement,
        regressionIntroduced: outcome.regressionIntroduced,
        userAcceptance: outcome.userAcceptance,
        timeToComplete: outcome.timeToComplete
      },
      environment,
      team
    };
    
    // Apply privacy filters
    if (this.config.anonymize) {
      await this.anonymizeDataPoint(dataPoint);
    }
    
    return dataPoint;
  }
  
  async storeDataPoint(dataPoint: TrainingDataPoint): Promise<void> {
    // Check storage limits
    const currentSize = await this.getCurrentStorageSize();
    if (currentSize > this.config.maxStorageSize) {
      await this.cleanupOldData();
    }
    
    // Store data point
    const fileName = `training-${dataPoint.timestamp}-${dataPoint.id}.json`;
    const filePath = join(this.storageDir, fileName);
    
    writeFileSync(filePath, JSON.stringify(dataPoint, null, 2));
    
    // Update index
    await this.updateDataIndex(dataPoint);
  }
  
  async getTrainingData(filters: {
    projectType?: ProjectType;
    language?: string;
    dateRange?: { start: string; end: string };
    minQuality?: number;
    limit?: number;
    offset?: number;
  }): Promise<{ data: TrainingDataPoint[]; total: number }> {
    
    const index = await this.loadDataIndex();
    let filteredData = index.dataPoints;
    
    // Apply filters
    if (filters.projectType) {
      filteredData = filteredData.filter(d => d.projectContext.type === filters.projectType);
    }
    
    if (filters.language) {
      filteredData = filteredData.filter(d => d.projectContext.language === filters.language);
    }
    
    if (filters.dateRange) {
      filteredData = filteredData.filter(d => 
        d.timestamp >= filters.dateRange!.start && 
        d.timestamp <= filters.dateRange!.end
      );
    }
    
    // Note: minQuality filter would require loading full data points first
    // Simplified implementation skips this filter for performance
    
    const total = filteredData.length;
    
    // Apply pagination
    const offset = filters.offset || 0;
    const limit = filters.limit || 100;
    const paginatedData = filteredData.slice(offset, offset + limit);
    
    // Load full data points
    const data = await Promise.all(
      paginatedData.map(indexEntry => this.loadDataPoint(indexEntry.id))
    );
    
    return { data, total };
  }
  
  async createDataSet(
    name: string,
    filters: Record<string, unknown>,
    config: { 
      splitRatio?: { train: number; validation: number; test: number };
      balancing?: 'none' | 'oversample' | 'undersample';
      shuffleSeed?: number;
    }
  ): Promise<TrainingDataSet> {
    
    // Get filtered data
    const { data: dataPoints } = await this.getTrainingData(filters as Parameters<typeof this.getTrainingData>[0]);
    
    // Apply balancing if specified
    let balancedData = dataPoints;
    if (config.balancing && config.balancing !== 'none') {
      balancedData = await this.balanceDataSet(dataPoints, config.balancing);
    }
    
    // Shuffle data if seed provided
    if (config.shuffleSeed !== undefined) {
      balancedData = this.shuffleArray(balancedData, config.shuffleSeed);
    }
    
    // Calculate quality metrics
    const quality = await this.calculateDataQuality(balancedData);
    
    // Calculate distribution analysis
    const distribution = this.calculateDistribution(balancedData);
    
    // Analyze features (simplified for now)
    const features = {
      mostPredictiveFeatures: [],
      featureCorrelations: {},
      outliers: []
    };
    
    const dataSet: TrainingDataSet = {
      id: randomUUID(),
      name,
      description: `Training dataset created with ${Object.keys(filters).length} filters`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      dataPoints: balancedData,
      totalSamples: balancedData.length,
      quality,
      distribution,
      features
    };
    
    // Store dataset
    await this.storeDataSet(dataSet);
    
    return dataSet;
  }
  
  async exportData(
    dataSetId: string,
    format: 'json' | 'csv' | 'parquet' | 'tfrecord' | 'pytorch'
  ): Promise<Buffer> {
    
    const dataSet = await this.loadDataSet(dataSetId);
    
    if (format === 'json') {
      return Buffer.from(JSON.stringify(dataSet.dataPoints, null, 2));
    }
    
    if (format === 'csv') {
      return this.exportToCSV(dataSet.dataPoints);
    }
    
    // For other formats, would need additional libraries
    throw new Error(`Export format ${format} not yet implemented`);
  }
  
  async validateData(dataSetId: string): Promise<ValidationResult> {
    const dataSet = await this.loadDataSet(dataSetId);
    const issues: ValidationResult['issues'] = [];
    
    // Check for missing values
    let missingValueCount = 0;
    for (const dataPoint of dataSet.dataPoints) {
      if (!dataPoint.beforeState || !dataPoint.afterState || !dataPoint.outcome) {
        missingValueCount++;
      }
    }
    
    if (missingValueCount > 0) {
      issues.push({
        type: 'missing_values',
        description: `${missingValueCount} data points have missing values`,
        severity: missingValueCount > dataSet.totalSamples * 0.1 ? 'high' : 'medium',
        affectedFeatures: ['beforeState', 'afterState', 'outcome']
      });
    }
    
    // Check for outliers (simplified)
    const qualityImprovements = dataSet.dataPoints.map(d => d.outcome.qualityImprovement);
    const mean = qualityImprovements.reduce((a, b) => a + b, 0) / qualityImprovements.length;
    const stdDev = Math.sqrt(qualityImprovements.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / qualityImprovements.length);
    
    const outliers = dataSet.dataPoints.filter(d => 
      Math.abs(d.outcome.qualityImprovement - mean) > 3 * stdDev
    );
    
    if (outliers.length > 0) {
      issues.push({
        type: 'outliers',
        description: `${outliers.length} data points are statistical outliers`,
        severity: outliers.length > dataSet.totalSamples * 0.05 ? 'medium' : 'low',
        affectedFeatures: ['qualityImprovement']
      });
    }
    
    const dataQualityScore = Math.max(0, 1 - (issues.length * 0.2));
    
    return {
      valid: issues.every(i => i.severity !== 'high'),
      issues,
      recommendations: [
        'Remove or impute missing values',
        'Consider outlier removal or robust scaling',
        'Validate data consistency across features'
      ],
      dataQualityScore
    };
  }
  
  async anonymizeData(dataPoints: TrainingDataPoint[]): Promise<TrainingDataPoint[]> {
    return dataPoints.map(dataPoint => ({
      ...dataPoint,
      // Remove potentially sensitive information
      sessionId: this.hashString(dataPoint.sessionId),
      action: {
        ...dataPoint.action,
        description: this.anonymizeDescription(dataPoint.action.description),
        filesModified: dataPoint.action.filesModified.map(() => 'anonymized_file')
      }
    }));
  }
  
  // Private helper methods
  
  private async analyzeProjectContext(): Promise<TrainingDataPoint['projectContext']> {
    // Simplified implementation - in practice would analyze package.json, tsconfig, etc.
    return {
      type: 'frontend', // would be detected
      language: 'typescript',
      framework: 'react',
      codebaseSize: 10000,
      teamSize: 3,
      complexity: 'medium'
    };
  }
  
  private async analyzeEnvironmentContext(): Promise<TrainingDataPoint['environment']> {
    return {
      nodeVersion: process.version,
      packageManager: 'pnpm',
      deploymentStage: 'development'
    };
  }
  
  private async analyzeTeamContext(): Promise<TrainingDataPoint['team']> {
    return {
      experience: 'medium',
      codeStyle: 'standard',
      testingCulture: 'medium',
      automationPreference: 'high'
    };
  }
  
  private async anonymizeDataPoint(dataPoint: TrainingDataPoint): Promise<void> {
    // Remove or hash sensitive fields
    dataPoint.sessionId = this.hashString(dataPoint.sessionId);
  }
  
  private async getCurrentStorageSize(): Promise<number> {
    // Simplified - would calculate actual directory size
    return 0;
  }
  
  private async cleanupOldData(): Promise<void> {
    // Remove data older than retention period
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - this.config.retentionDays);
    
    // Implementation would remove old files
  }
  
  private async updateDataIndex(dataPoint: TrainingDataPoint): Promise<void> {
    const indexPath = join(this.storageDir, 'index.json');
    let index = { dataPoints: [] as { id: string; timestamp: string; projectContext: TrainingDataPoint['projectContext'] }[] };
    
    if (existsSync(indexPath)) {
      index = JSON.parse(readFileSync(indexPath, 'utf-8'));
    }
    
    index.dataPoints.push({
      id: dataPoint.id,
      timestamp: dataPoint.timestamp,
      projectContext: dataPoint.projectContext
    });
    
    writeFileSync(indexPath, JSON.stringify(index, null, 2));
  }
  
  private async loadDataIndex(): Promise<{ dataPoints: { id: string; timestamp: string; projectContext: TrainingDataPoint['projectContext'] }[] }> {
    const indexPath = join(this.storageDir, 'index.json');
    if (!existsSync(indexPath)) {
      return { dataPoints: [] };
    }
    return JSON.parse(readFileSync(indexPath, 'utf-8'));
  }
  
  private async loadDataPoint(id: string): Promise<TrainingDataPoint> {
    // Find file by ID (simplified)
    const { readdirSync } = await import('node:fs');
    const files = readdirSync(this.storageDir);
    const file = files.find((f: string) => f.includes(id));
    if (!file) throw new Error(`Data point ${id} not found`);
    
    const filePath = join(this.storageDir, file);
    return JSON.parse(readFileSync(filePath, 'utf-8'));
  }
  
  private async storeDataSet(dataSet: TrainingDataSet): Promise<void> {
    const filePath = join(this.storageDir, `dataset-${dataSet.id}.json`);
    writeFileSync(filePath, JSON.stringify(dataSet, null, 2));
  }
  
  private async loadDataSet(id: string): Promise<TrainingDataSet> {
    const filePath = join(this.storageDir, `dataset-${id}.json`);
    return JSON.parse(readFileSync(filePath, 'utf-8'));
  }
  
  private async balanceDataSet(
    dataPoints: TrainingDataPoint[], 
    _method: 'oversample' | 'undersample'
  ): Promise<TrainingDataPoint[]> {
    // Simplified balancing implementation - method parameter reserved for future use
    return dataPoints;
  }
  
  private shuffleArray<T>(array: T[], seed: number): T[] {
    const shuffled = [...array];
    // Simple seeded shuffle implementation
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(((seed * 9301 + 49297) % 233280) / 233280 * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
      seed = (seed * 9301 + 49297) % 233280;
    }
    return shuffled;
  }
  
  private async calculateDataQuality(dataPoints: TrainingDataPoint[]): Promise<TrainingDataSet['quality']> {
    // Simplified quality calculation
    const complete = dataPoints.filter(d => d.beforeState && d.afterState && d.outcome).length;
    const completeness = complete / dataPoints.length;
    
    return {
      completeness,
      consistency: 0.9, // Would calculate based on data consistency checks
      accuracy: 0.85,   // Would validate against known good outcomes
      representativeness: 0.8 // Would check distribution coverage
    };
  }
  
  private calculateDistribution(dataPoints: TrainingDataPoint[]): TrainingDataSet['distribution'] {
    const projectTypes = dataPoints.reduce((acc, d) => {
      acc[d.projectContext.type] = (acc[d.projectContext.type] || 0) + 1;
      return acc;
    }, {} as Record<ProjectType, number>);
    
    const languages = dataPoints.reduce((acc, d) => {
      acc[d.projectContext.language] = (acc[d.projectContext.language] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const teamSizes = dataPoints.map(d => d.projectContext.teamSize);
    const complexityLevels = dataPoints.reduce((acc, d) => {
      acc[d.projectContext.complexity] = (acc[d.projectContext.complexity] || 0) + 1;
      return acc;
    }, {} as Record<typeof dataPoints[0]['projectContext']['complexity'], number>);
    
    const outcomes = dataPoints.reduce((acc, d) => {
      if (d.outcome.success) acc.successful++;
      else if (d.outcome.qualityImprovement > 0) acc.mixed++;
      else acc.failed++;
      return acc;
    }, { successful: 0, failed: 0, mixed: 0 });
    
    return {
      projectTypes,
      languages,
      teamSizes: {
        min: Math.min(...teamSizes),
        max: Math.max(...teamSizes),
        avg: teamSizes.reduce((a, b) => a + b, 0) / teamSizes.length
      },
      complexityLevels,
      outcomes
    };
  }
  
  private exportToCSV(dataPoints: TrainingDataPoint[]): Buffer {
    const headers = [
      'id', 'timestamp', 'projectType', 'language', 'beforeEslintWarnings', 
      'beforeTypeErrors', 'afterEslintWarnings', 'afterTypeErrors', 
      'qualityImprovement', 'success', 'confidence'
    ];
    
    const rows = dataPoints.map(d => [
      d.id,
      d.timestamp,
      d.projectContext.type,
      d.projectContext.language,
      d.beforeState.eslintWarnings,
      d.beforeState.typeErrors,
      d.afterState.eslintWarnings,
      d.afterState.typeErrors,
      d.outcome.qualityImprovement,
      d.outcome.success,
      d.action.confidence
    ]);
    
    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    return Buffer.from(csv);
  }
  
  private hashString(input: string): string {
    // Simple hash function for anonymization
    let hash = 0;
    for (let i = 0; i < input.length; i++) {
      const char = input.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36);
  }
  
  private anonymizeDescription(description: string): string {
    // Replace specific file paths, function names, etc. with generic terms
    return description
      .replace(/\/[^\s]+/g, '/anonymized/path')
      .replace(/\w+\.(js|ts|tsx|jsx)/g, 'file.ext')
      .replace(/function\s+\w+/g, 'function anonymized');
  }
}