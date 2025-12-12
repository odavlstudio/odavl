/**
 * ODAVL Protocol Layer - Insight Core Adapter
 * Wraps Insight Core detectors for AnalysisProtocol
 * 
 * Phase 3B: Lazy Loading Support
 * Detectors loaded on-demand via dynamic imports
 * 
 * ⚠️ Uses dynamic require() for runtime loading (not static imports)
 * This is acceptable adapter pattern - no compile-time coupling.
 */

import type {
  AnalysisAdapter,
} from '../protocols/analysis.js';

import type {
  AnalysisRequest,
  AnalysisSummary,
  DetectorId,
  AnalysisIssue,
  Severity,
} from '../types/analysis.js';

// Phase 3B: Import parallel execution utilities
import { runInParallel, getOptimalConcurrency } from '../utilities/parallel.js';

// Map DetectorId (protocol) to DetectorName (Insight Core)
type DetectorName = string;
const detectorNameMap: Record<DetectorId, DetectorName> = {
  typescript: 'typescript',
  eslint: 'eslint',
  security: 'security',
  performance: 'performance',
  complexity: 'complexity',
  circular: 'circular',
  import: 'import',
  package: 'package',
  runtime: 'runtime',
  build: 'build',
  network: 'network',
  isolation: 'isolation',
};

/**
 * Adapter that wraps Insight Core detectors
 * **Round 12**: Fixed detector loading using createRequire for CJS compatibility
 * Detectors are now loaded as class instances with analyze() method
 */
export class InsightCoreAnalysisAdapter implements AnalysisAdapter {
  private initialized = false;
  private detectors: Record<string, any> = {};

  /**
   * Initialize all detectors using createRequire for CJS module resolution
   * **Round 12 Fix**: Use barrel export (all detectors bundled in detector/index.js)
   * InsightCore builds with tsup → all detectors in single bundle
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;
    
    try {
      // Use createRequire to force CommonJS resolution
      const { createRequire } = await import('node:module');
      const require = createRequire(import.meta.url);
      
      // Load the barrel module (all detectors in one bundled file)
      const detectorModule = require('@odavl-studio/insight-core/detector');
      
      // Map detector IDs to their class names in the barrel export
      const detectorMap: Record<string, string> = {
        typescript: 'TSDetector',
        eslint: 'ESLintDetector',
        security: 'SecurityDetector',
        performance: 'PerformanceDetector',
        import: 'ImportDetector',
        package: 'PackageDetector',
        runtime: 'RuntimeDetector',
        build: 'BuildDetector',
        circular: 'CircularDependencyDetector',
        network: 'NetworkDetector',
        complexity: 'ComplexityDetector',
        isolation: 'ComponentIsolationDetector',
      };
      
      this.detectors = {};
      let successCount = 0;
      
      // Instantiate each detector from the barrel module
      for (const [detectorId, className] of Object.entries(detectorMap)) {
        try {
          const DetectorClass = detectorModule[className];
          if (!DetectorClass) {
            console.warn(`[InsightCoreAdapter] Class ${className} not exported from barrel module`);
            continue;
          }
          
          const instance = new DetectorClass();
          
          // Verify it has detect method (InsightCore uses detect(), not analyze())
          if (typeof instance.detect !== 'function') {
            console.warn(`[InsightCoreAdapter] ${className} missing detect() method`);
            continue;
          }
          
          this.detectors[detectorId] = instance;
          console.log(`[InsightCoreAdapter] Loaded ${detectorId} (${className}) ✓`);
          successCount++;
        } catch (err) {
          console.error(`[InsightCoreAdapter] Failed to instantiate ${className}:`, err);
        }
      }
      
      this.initialized = true;
      console.log(`✅ [InsightCoreAdapter] Initialized ${successCount}/12 detectors from barrel export`);
      
      if (successCount === 0) {
        throw new Error('No detectors loaded successfully');
      }
    } catch (err) {
      console.error('❌ [InsightCoreAdapter] Failed to load detector barrel module:', err);
      this.initialized = true; // Prevent retry loops
      throw new Error('Failed to initialize InsightCore detectors: ' + (err as Error).message);
    }
  }

  async analyze(request: AnalysisRequest): Promise<AnalysisSummary> {
    // Ensure initialization before analysis
    await this.initialize();
    
    const detectorsToRun =
      request.detectors && request.detectors.length > 0
        ? request.detectors
        : ([
            'typescript',
            'eslint',
            'security',
            'performance',
            'complexity',
            'circular',
            'import',
            'package',
            'runtime',
            'build',
            'network',
            'isolation',
          ] as DetectorId[]);

    const allIssues: AnalysisIssue[] = [];
    const metrics: Record<string, number> = {};
    const detectorStats: Record<string, { issues: number; tookMs?: number }> = {};
    const start = Date.now();

    // Phase 3B: Run detectors in parallel with optimal concurrency
    const concurrency = getOptimalConcurrency(4); // Max 4 concurrent detectors
    const detectorTasks = detectorsToRun.map((detId) => async () => {
      const detectorName = detectorNameMap[detId];
      const detector = this.detectors[detectorName];
      
      if (!detector) {
        console.warn(`[InsightCoreAdapter] Detector not loaded: ${detId}`);
        return null;
      }

      const detStart = Date.now();
      try {
        // Call detect() on the detector instance (InsightCore uses detect(), not analyze())
        const result = await detector.detect(request.workspaceRoot);
        const detTookMs = Date.now() - detStart;

        const issues: AnalysisIssue[] = [];

        // Transform issues to protocol format
        // InsightCore detectors return array directly, not {issues: [...]}
        const issueArray = Array.isArray(result) ? result : (result?.issues || []);
        
        for (const issue of issueArray) {
          issues.push({
            id: `${detId}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            detector: detId,
            severity: mapSeverity(issue.severity),
            message: issue.message || 'No message',
            ruleId: issue.ruleId || issue.rule,
            location: issue.filePath || issue.file
              ? {
                  file: issue.filePath || issue.file,
                  startLine: issue.line || 0,
                  startColumn: issue.column || issue.col || 0,
                }
              : undefined,
            tags: issue.tags,
            raw: issue,
          });
        }

        // Aggregate metrics
        const detectorMetrics: Record<string, number> = {};
        if (result.metrics) {
          for (const [key, value] of Object.entries(result.metrics)) {
            detectorMetrics[`${detId}.${key}`] =
              typeof value === 'number' ? value : Number(value) || 0;
          }
        }

        return {
          detId,
          issues,
          metrics: detectorMetrics,
          stats: { issues: issues.length, tookMs: detTookMs },
        };
      } catch (error) {
        console.warn(
          `[InsightCoreAdapter] Error running ${detId}:`,
          error instanceof Error ? error.message : String(error)
        );
        return {
          detId,
          issues: [],
          metrics: {},
          stats: { issues: 0, tookMs: Date.now() - detStart },
        };
      }
    });

    // Execute all detectors in parallel
    const { results } = await runInParallel(detectorTasks, concurrency);

    // Aggregate all results
    for (const result of results) {
      if (result) {
        allIssues.push(...result.issues);
        Object.assign(metrics, result.metrics);
        detectorStats[result.detId] = result.stats;
      }
    }

    const tookMs = Date.now() - start;

    return {
      issues: allIssues,
      metrics,
      tookMs,
      detectorStats: detectorStats as any,
    };
  }
}

/**
 * Map Insight severity to protocol severity
 */
function mapSeverity(severity?: string | number): Severity {
  if (typeof severity === 'number') {
    if (severity >= 4) return 'critical';
    if (severity >= 3) return 'high';
    if (severity >= 2) return 'medium';
    if (severity >= 1) return 'low';
    return 'info';
  }

  const s = (severity || 'info').toLowerCase();
  if (s === 'critical' || s === 'error') return 'critical';
  if (s === 'high' || s === 'warning') return 'high';
  if (s === 'medium') return 'medium';
  if (s === 'low') return 'low';
  return 'info';
}
