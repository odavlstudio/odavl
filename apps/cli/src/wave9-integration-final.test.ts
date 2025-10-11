/**
 * ODAVL Wave 9 - Working Integration Testing Suite
 * 
 * Focused integration tests for Wave 9 Intelligence & Analytics components
 * that align with actual implementations and can compile successfully.
 * 
 * @version 1.0.0
 * @author ODAVL Intelligence System
 * @created 2025-10-11
 */

import { describe, test, expect, beforeAll, afterAll } from 'vitest';
import { promises as fs } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';

// Import Wave 9 components  
import { ODAvlTrainingDataCollector } from './training-data-collector.js';
import { ODAvlContextAnalyzer, ContextAnalysisConfig } from './context-analyzer.js';
import { createRealtimeAnalyticsEngine, QualityUpdatePayload } from './realtime-analytics.js';

// Import mock transport for testing
import { createMockAnalyticsTransport } from './mock-analytics-transport.js';

// Import types
import {
  QualityMetrics,
  DataCollectionConfig,
  ActionOutcome
} from './training-data.types.js';

// ============================================================================
// TEST ENVIRONMENT SETUP
// ============================================================================

class WorkingTestEnvironment {
  private tempDir: string;
  private testProject: string;

  constructor() {
    this.tempDir = join(tmpdir(), `odavl-test-${Date.now()}`);
    this.testProject = join(this.tempDir, 'test-project');
  }

  async setup(): Promise<void> {
    await fs.mkdir(this.testProject, { recursive: true });
    await fs.mkdir(join(this.testProject, 'src'), { recursive: true });
    await fs.mkdir(join(this.testProject, '.odavl'), { recursive: true });

    // Create sample TypeScript file
    await fs.writeFile(
      join(this.testProject, 'src', 'index.ts'),
      `
// Sample TypeScript file for testing
import { data } from './utils';
console.log(data.name);
export default data;
      `.trim()
    );

    // Create package.json
    await fs.writeFile(
      join(this.testProject, 'package.json'),
      JSON.stringify({
        name: 'test-project',
        version: '1.0.0',
        devDependencies: {
          'typescript': '^5.0.0',
          'eslint': '^8.0.0'
        }
      }, null, 2)
    );

    // Create tsconfig.json
    await fs.writeFile(
      join(this.testProject, 'tsconfig.json'),
      JSON.stringify({
        compilerOptions: {
          target: 'ES2022',
          module: 'commonjs',
          strict: true,
          esModuleInterop: true
        }
      }, null, 2)
    );
  }

  async teardown(): Promise<void> {
    try {
      await fs.rm(this.tempDir, { recursive: true, force: true });
    } catch (error) {
      console.warn('Failed to cleanup test directory:', error);
    }
  }

  getProjectPath(): string {
    return this.testProject;
  }
}

// ============================================================================
// WORKING INTEGRATION TESTS
// ============================================================================

describe('Wave 9 Working Integration Tests', () => {
  let testEnv: WorkingTestEnvironment;

  beforeAll(async () => {
    testEnv = new WorkingTestEnvironment();
    await testEnv.setup();
  });

  afterAll(async () => {
    await testEnv.teardown();
  });

  describe('Training Data Collector - Basic Integration', () => {
    test('should create collector with valid configuration', () => {
      const config: DataCollectionConfig = {
        enabled: true,
        samplingRate: 1.0,
        maxStorageSize: 1000000,
        retentionDays: 30,
        anonymize: false,
        excludeFields: [],
        consentRequired: false,
        minQualityThreshold: 0.7,
        excludeFailedRuns: false,
        requireUserFeedback: false,
        storage: {
          local: true
        }
      };

      const collector = new ODAvlTrainingDataCollector(config, testEnv.getProjectPath());
      expect(collector).toBeDefined();
    });

    test('should collect training data from EDAVL runs', async () => {
      const config: DataCollectionConfig = {
        enabled: true,
        samplingRate: 1.0,
        maxStorageSize: 1000000,
        retentionDays: 30,
        anonymize: false,
        excludeFields: [],
        consentRequired: false,
        minQualityThreshold: 0.7,
        excludeFailedRuns: false,
        requireUserFeedback: false,
        storage: {
          local: true
        }
      };

      const collector = new ODAvlTrainingDataCollector(config, testEnv.getProjectPath());
      
      const beforeMetrics: QualityMetrics = {
        eslintWarnings: 10,
        typeErrors: 3,
        codeComplexity: 20,
        testCoverage: 75,
        duplication: 5,
        timestamp: new Date().toISOString()
      };

      const afterMetrics: QualityMetrics = {
        eslintWarnings: 5,
        typeErrors: 1,
        codeComplexity: 18,
        testCoverage: 80,
        duplication: 3,
        timestamp: new Date().toISOString()
      };

      const action = {
        type: 'eslint-fix',
        description: 'Fixed ESLint warnings',
        confidence: 0.85
      };

      const outcome: ActionOutcome = {
        success: true,
        qualityImprovement: 15,
        regressionIntroduced: false,
        userAcceptance: true,
        timeToComplete: 1200
      };

      const dataPoint = await collector.collectFromRun(
        'test-run-1',
        beforeMetrics,
        action,
        afterMetrics,
        outcome
      );

      expect(dataPoint).toBeDefined();
      expect(dataPoint.id).toBeDefined();
      expect(dataPoint.beforeState.eslintWarnings).toBe(10);
      expect(dataPoint.afterState.eslintWarnings).toBe(5);
    });
  });

  describe('Context Analyzer - Basic Integration', () => {
    test('should create analyzer with valid configuration', () => {
      const config: ContextAnalysisConfig = {
        maxFilesToAnalyze: 100,
        excludePatterns: ['node_modules', '.git'],
        includePatterns: ['**/*.ts', '**/*.js'],
        analyzeGitHistory: false,
        analyzeDependencies: true,
        analyzeCodeStyle: true,
        analyzeArchitecture: true,
        enableCaching: false,
        cacheExpiryHours: 24,
        enableTeamLearning: true,
        minDataPointsForLearning: 10
      };

      const analyzer = new ODAvlContextAnalyzer(config);
      expect(analyzer).toBeDefined();
    });

    test('should analyze project structure successfully', async () => {
      const config: ContextAnalysisConfig = {
        maxFilesToAnalyze: 100,
        excludePatterns: ['node_modules'],
        includePatterns: ['**/*.ts'],
        analyzeGitHistory: false,
        analyzeDependencies: true,
        analyzeCodeStyle: true,
        analyzeArchitecture: true,
        enableCaching: false,
        cacheExpiryHours: 24,
        enableTeamLearning: true,
        minDataPointsForLearning: 10
      };

      const analyzer = new ODAvlContextAnalyzer(config);
      const analysis = await analyzer.analyzeProject(testEnv.getProjectPath());

      expect(analysis).toBeDefined();
      expect(analysis.projectType).toBeDefined();
      expect(analysis.primaryLanguages).toBeDefined();
      expect(analysis.fileStats).toBeDefined();
    });

    test('should analyze code style patterns', async () => {
      const config: ContextAnalysisConfig = {
        maxFilesToAnalyze: 100,
        excludePatterns: ['node_modules'],
        includePatterns: ['**/*.ts'],
        analyzeGitHistory: false,
        analyzeDependencies: true,
        analyzeCodeStyle: true,
        analyzeArchitecture: true,
        enableCaching: false,
        cacheExpiryHours: 24,
        enableTeamLearning: true,
        minDataPointsForLearning: 10
      };

      const analyzer = new ODAvlContextAnalyzer(config);
      const styleAnalysis = await analyzer.analyzeCodeStyle(testEnv.getProjectPath());

      expect(styleAnalysis).toBeDefined();
      expect(styleAnalysis.indentation).toBeDefined();
      expect(styleAnalysis.lineLength).toBeDefined();
      expect(styleAnalysis.importStyle).toBeDefined();
    });
  });

  describe('Real-time Analytics Engine - Core Integration', () => {
    test('should create and start mock analytics transport', async () => {
      const mockTransport = createMockAnalyticsTransport({
        maxConnections: 10,
        heartbeatInterval: 1000
      });

      expect(mockTransport).toBeDefined();
      
      await mockTransport.start();
      expect(mockTransport.isRunning()).toBe(true);
      
      const stats = mockTransport.getAnalyticsStats();
      expect(stats.connectedClients).toBe(0);
      expect(stats.activeRooms).toBe(0);

      await mockTransport.stop();
      expect(mockTransport.isRunning()).toBe(false);
    });

    test('should handle quality updates without errors', async () => {
      const mockTransport = createMockAnalyticsTransport({
        maxConnections: 10,
        heartbeatInterval: 1000
      });

      await mockTransport.start();

      const qualityUpdate: QualityUpdatePayload = {
        projectId: 'test-project',
        metrics: {
          eslintWarnings: 5,
          typeErrors: 2,
          codeComplexity: 15,
          testCoverage: 85,
          duplication: 3,
          timestamp: new Date().toISOString()
        },
        delta: {
          eslintWarnings: -3,
          typeErrors: -1,
          qualityScore: 8
        },
        trends: {
          shortTerm: 'improving',
          longTerm: 'stable'
        },
        affectedFiles: ['src/index.ts'],
        timestamp: new Date().toISOString()
      };

      expect(() => {
        mockTransport.publishQualityUpdate(qualityUpdate);
      }).not.toThrow();

      await mockTransport.stop();
    });

    test('should generate alerts for quality threshold violations', async () => {
      const mockTransport = createMockAnalyticsTransport({
        maxConnections: 10,
        heartbeatInterval: 1000,
        alertThresholds: {
          qualityScoreMin: 70,
          eslintWarningsMax: 10,
          typeErrorsMax: 0,
          buildFailureRate: 0.1
        }
      });

      await mockTransport.start();

      const alerts: Array<{severity: string; category: string}> = [];
      mockTransport.on('alert', (alert) => {
        alerts.push(alert);
      });

      const poorQualityUpdate: QualityUpdatePayload = {
        projectId: 'test-project',
        metrics: {
          eslintWarnings: 15, // Above threshold
          typeErrors: 3,
          codeComplexity: 25,
          testCoverage: 40,
          duplication: 8,
          timestamp: new Date().toISOString()
        },
        delta: {
          eslintWarnings: 10,
          typeErrors: 2,
          qualityScore: -15
        },
        trends: {
          shortTerm: 'degrading',
          longTerm: 'degrading'
        },
        affectedFiles: ['src/problematic.ts'],
        timestamp: new Date().toISOString()
      };

      mockTransport.publishQualityUpdate(poorQualityUpdate);

      // Wait for alert processing
      await new Promise(resolve => setTimeout(resolve, 50));

      expect(alerts.length).toBeGreaterThan(0);
      if (alerts.length > 0) {
        expect(alerts[0].severity).toBeDefined();
        expect(alerts[0].category).toBe('quality');
      }

      await mockTransport.stop();
    });
  });

  describe('Component Integration - Basic Workflow', () => {
    test('should execute basic data collection and analysis workflow', async () => {
      // Setup components
      const collectorConfig: DataCollectionConfig = {
        enabled: true,
        samplingRate: 1.0,
        maxStorageSize: 1000000,
        retentionDays: 30,
        anonymize: false,
        excludeFields: [],
        consentRequired: false,
        minQualityThreshold: 0.7,
        excludeFailedRuns: false,
        requireUserFeedback: false,
        storage: {
          local: true
        }
      };

      const analyzerConfig: ContextAnalysisConfig = {
        maxFilesToAnalyze: 100,
        excludePatterns: ['node_modules'],
        includePatterns: ['**/*.ts'],
        analyzeGitHistory: false,
        analyzeDependencies: true,
        analyzeCodeStyle: true,
        analyzeArchitecture: true,
        enableCaching: false,
        cacheExpiryHours: 24,
        enableTeamLearning: true,
        minDataPointsForLearning: 10
      };

      const collector = new ODAvlTrainingDataCollector(collectorConfig, testEnv.getProjectPath());
      const analyzer = new ODAvlContextAnalyzer(analyzerConfig);
      const analyticsEngine = await createRealtimeAnalyticsEngine(testEnv.getProjectPath(), {
        port: 0
      });

      try {
        // Step 1: Collect training data
        const beforeMetrics: QualityMetrics = {
          eslintWarnings: 10,
          typeErrors: 3,
          codeComplexity: 20,
          testCoverage: 75,
          duplication: 5,
          timestamp: new Date().toISOString()
        };

        const afterMetrics: QualityMetrics = {
          eslintWarnings: 5,
          typeErrors: 1,
          codeComplexity: 18,
          testCoverage: 80,
          duplication: 3,
          timestamp: new Date().toISOString()
        };

        const trainingData = await collector.collectFromRun(
          'integration-test',
          beforeMetrics,
          { type: 'eslint-fix', description: 'Fixed ESLint warnings', confidence: 0.85 },
          afterMetrics,
          { success: true, qualityImprovement: 15, regressionIntroduced: false, userAcceptance: true, timeToComplete: 1200 }
        );

        // Step 2: Analyze project context
        const projectAnalysis = await analyzer.analyzeProject(testEnv.getProjectPath());
        const styleAnalysis = await analyzer.analyzeCodeStyle(testEnv.getProjectPath());

        // Step 3: Stream results
        const qualityUpdate: QualityUpdatePayload = {
          projectId: 'integration-test',
          metrics: afterMetrics,
          delta: {
            eslintWarnings: -5,
            typeErrors: -2,
            qualityScore: 15
          },
          trends: {
            shortTerm: 'improving',
            longTerm: 'stable'
          },
          affectedFiles: ['src/index.ts'],
          timestamp: new Date().toISOString()
        };

        analyticsEngine.publishQualityUpdate(qualityUpdate);

        // Verify workflow execution
        expect(trainingData).toBeDefined();
        expect(projectAnalysis).toBeDefined();
        expect(styleAnalysis).toBeDefined();

        console.log('✅ Basic integration workflow executed successfully');
      } finally {
        await analyticsEngine.stop();
      }
    });
  });

  describe('Performance & Stability Tests', () => {
    test('should handle concurrent data collection operations', async () => {
      const config: DataCollectionConfig = {
        enabled: true,
        samplingRate: 1.0,
        maxStorageSize: 1000000,
        retentionDays: 30,
        anonymize: false,
        excludeFields: [],
        consentRequired: false,
        minQualityThreshold: 0.7,
        excludeFailedRuns: false,
        requireUserFeedback: false,
        storage: {
          local: true
        }
      };

      const collector = new ODAvlTrainingDataCollector(config, testEnv.getProjectPath());
      const promises: Array<Promise<unknown>> = [];

      // Execute multiple operations concurrently
      for (let i = 0; i < 5; i++) {
        const beforeMetrics: QualityMetrics = {
          eslintWarnings: Math.floor(Math.random() * 20),
          typeErrors: Math.floor(Math.random() * 5),
          codeComplexity: Math.floor(Math.random() * 30),
          testCoverage: Math.floor(Math.random() * 100),
          duplication: Math.floor(Math.random() * 10),
          timestamp: new Date().toISOString()
        };

        const afterMetrics: QualityMetrics = {
          eslintWarnings: Math.max(0, beforeMetrics.eslintWarnings - Math.floor(Math.random() * 5)),
          typeErrors: Math.max(0, beforeMetrics.typeErrors - Math.floor(Math.random() * 2)),
          codeComplexity: beforeMetrics.codeComplexity,
          testCoverage: beforeMetrics.testCoverage,
          duplication: beforeMetrics.duplication,
          timestamp: new Date().toISOString()
        };

        promises.push(collector.collectFromRun(
          `concurrent-test-${i}`,
          beforeMetrics,
          { type: 'test-action', description: `Test action ${i}`, confidence: 0.8 },
          afterMetrics,
          { success: true, qualityImprovement: 5, regressionIntroduced: false, userAcceptance: true, timeToComplete: 1000 }
        ));
      }

      const results = await Promise.allSettled(promises);
      const failures = results.filter(r => r.status === 'rejected');
      
      expect(failures).toHaveLength(0);
      console.log('✅ Concurrent operations completed successfully');
    });

    test('should maintain performance under moderate load', async () => {
      const analyticsEngine = await createRealtimeAnalyticsEngine(testEnv.getProjectPath(), {
        port: 0,
        maxConnections: 50
      });

      try {
        const startTime = Date.now();
        const iterations = 25;

        for (let i = 0; i < iterations; i++) {
          const qualityUpdate: QualityUpdatePayload = {
            projectId: `load-test-${i % 3}`,
            metrics: {
              eslintWarnings: Math.floor(Math.random() * 20),
              typeErrors: Math.floor(Math.random() * 5),
              codeComplexity: Math.floor(Math.random() * 30),
              testCoverage: Math.floor(Math.random() * 100),
              duplication: Math.floor(Math.random() * 10),
              timestamp: new Date().toISOString()
            },
            delta: {
              eslintWarnings: Math.floor(Math.random() * 5) - 2,
              typeErrors: Math.floor(Math.random() * 2) - 1,
              qualityScore: Math.floor(Math.random() * 10) - 5
            },
            trends: {
              shortTerm: 'stable',
              longTerm: 'stable'
            },
            affectedFiles: [`src/load-test-${i}.ts`],
            timestamp: new Date().toISOString()
          };

          analyticsEngine.publishQualityUpdate(qualityUpdate);
        }

        const endTime = Date.now();
        const processingTime = endTime - startTime;

        // Should handle 25 updates efficiently (under 1 second)
        expect(processingTime).toBeLessThan(1000);
        console.log(`✅ Performance test completed in ${processingTime}ms`);
      } finally {
        await analyticsEngine.stop();
      }
    });
  });
});

export { WorkingTestEnvironment };