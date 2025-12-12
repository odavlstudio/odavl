/**
 * ODAVL Brain - Insight Adapter
 * Runs ODAVL Insight programmatically and returns structured results
 * 
 * Wave 8 Phase 2: Process Isolation
 * - Heavy detectors run in isolated workers (TypeScript, ESLint, Security, Build, Circular)
 * - Fast detectors run in-process (Import, Package, Network, Isolation, Performance, Complexity)
 */

import { Logger } from '../utils/logger.js';
import type { InsightResult, InsightIssue } from '../types.js';
import * as os from 'node:os';

// Use shared types instead of product-specific imports
import type { DetectorName } from '@odavl/types';

const logger = new Logger('InsightAdapter');

// Wave 8 Phase 2: Worker pool for process isolation (lazy-initialized)
let workerPool: any = null;

/**
 * Available detector names
 */
const DETECTOR_NAMES: string[] = [
  'typescript',
  'eslint',
  'security',
  'import',
  'package',
  'runtime',
  'build',
  'circular',
  'performance',
  'complexity',
  'network',
  'isolation',
];

/**
 * Heavy detectors that should run in isolated workers
 * These are slow, memory-intensive, or use external processes
 */
const HEAVY_DETECTORS = new Set([
  'typescript',   // tsc - slow compilation
  'eslint',       // eslint - slow linting
  'security',     // large file scanning
  'build',        // external build processes
  'circular',     // graph algorithms
]);

/**
 * Fast detectors that can run in-process
 * These are quick and safe to run in the main process
 */
const FAST_DETECTORS = new Set([
  'import',
  'package',
  'runtime',
  'network',
  'isolation',
  'performance',
  'complexity',
]);

/**
 * Initialize worker pool (lazy, cached)
 */
async function getWorkerPool(): Promise<any> {
  if (workerPool) {
    return workerPool;
  }

  try {
    // Dynamically import worker pool from main export
    const { DetectorWorkerPool } = await import('@odavl-studio/insight-core');
    
    // Get workspace root from current working directory or environment
    const workspaceRoot = process.cwd();
    
    // Create worker pool with conservative settings
    workerPool = new DetectorWorkerPool(
      workspaceRoot,
      {
        maxWorkers: Math.max(1, Math.floor(os.cpus().length / 2)),
        taskTimeoutMs: 300000, // 5 minutes
        verbose: process.env.ODAVL_WORKER_VERBOSE === 'true',
      }
    );

    logger.info(`Worker pool initialized with ${Math.max(1, Math.floor(os.cpus().length / 2))} workers`);
    
    return workerPool;
  } catch (error) {
    logger.error('Failed to initialize worker pool, falling back to in-process execution', error as Error);
    return null;
  }
}

/**
 * Run ODAVL Insight analysis
 * Wave 8 Phase 2: Uses worker pool for heavy detectors, in-process for fast detectors
 */
export async function runInsight(
  projectRoot: string,
  detectors?: string[]
): Promise<InsightResult> {
  const startTime = Date.now();
  logger.section('ODAVL INSIGHT - Analysis Starting');
  logger.info(`Project: ${projectRoot}`);

  const detectorsToRun = detectors || DETECTOR_NAMES;
  logger.info(`Detectors: ${detectorsToRun.join(', ')}`);

  const allIssues: InsightIssue[] = [];
  const loadedDetectors: string[] = [];

  // Split detectors into heavy (workers) and fast (in-process)
  const heavyDetectorsToRun = detectorsToRun.filter(d => HEAVY_DETECTORS.has(d));
  const fastDetectorsToRun = detectorsToRun.filter(d => FAST_DETECTORS.has(d));

  logger.info(`Heavy detectors (workers): ${heavyDetectorsToRun.length}`);
  logger.info(`Fast detectors (in-process): ${fastDetectorsToRun.length}`);

  // Run heavy detectors in parallel via worker pool
  if (heavyDetectorsToRun.length > 0) {
    const pool = await getWorkerPool();
    
    if (pool) {
      logger.info('Running heavy detectors in isolated workers...');
      
      try {
        const workerResults = await pool.executeDetectors(heavyDetectorsToRun, projectRoot);
        
        // Process worker results
        for (const [detectorName, result] of workerResults.entries()) {
          if (result.crashed || result.timedOut) {
            logger.error(
              `${detectorName}: ${result.crashed ? 'CRASHED' : 'TIMED OUT'} ` +
              `(${result.errors.length} errors)`
            );
          } else {
            logger.success(`${detectorName}: ${result.issues.length} issues`);
          }

          // Convert worker issues to InsightIssue format
          for (const issue of result.issues) {
            allIssues.push({
              file: issue.file || 'unknown',
              line: issue.line || 0,
              column: issue.column,
              severity: mapSeverity(issue.severity),
              type: issue.type || detectorName,
              detector: detectorName,
              message: issue.message || 'No description',
              code: issue.code,
              fix: issue.fix,
            });
          }

          if (!result.crashed && !result.timedOut) {
            loadedDetectors.push(detectorName);
          }
        }

        // Log worker errors
        const workerErrors = pool.getErrors();
        if (workerErrors.size > 0) {
          logger.error(`Worker errors detected in ${workerErrors.size} detectors`);
          for (const [detector, errors] of workerErrors.entries()) {
            for (const error of errors) {
              logger.error(`  ${detector}: [${error.code}] ${error.message}`);
            }
          }
        }
      } catch (error) {
        logger.error('Worker pool execution failed, falling back to in-process', error as Error);
        // Fall back to in-process for heavy detectors
        await runDetectorsInProcess(heavyDetectorsToRun, projectRoot, allIssues, loadedDetectors);
      }
    } else {
      // No worker pool available, run in-process
      logger.info('Worker pool not available, running heavy detectors in-process');
      await runDetectorsInProcess(heavyDetectorsToRun, projectRoot, allIssues, loadedDetectors);
    }
  }

  // Run fast detectors in-process (existing logic)
  if (fastDetectorsToRun.length > 0) {
    logger.info('Running fast detectors in-process...');
    await runDetectorsInProcess(fastDetectorsToRun, projectRoot, allIssues, loadedDetectors);
  }

  const duration = Date.now() - startTime;

  const result: InsightResult = {
    timestamp: new Date().toISOString(),
    projectRoot,
    totalIssues: allIssues.length,
    issues: allIssues,
    detectors: loadedDetectors,
    duration,
  };

  logger.section('ODAVL INSIGHT - Analysis Complete');
  logger.success(`Total issues: ${allIssues.length}`);
  logger.info(`Duration: ${duration}ms`);

  return result;
}

/**
 * Run detectors in-process (original implementation)
 * Used for fast detectors or as fallback when worker pool unavailable
 */
async function runDetectorsInProcess(
  detectorsToRun: string[],
  projectRoot: string,
  allIssues: InsightIssue[],
  loadedDetectors: string[]
): Promise<void> {
  // Dynamically import the detector loader (handles CJS/ESM compatibility)
  let loadDetector: any;
  try {
    // Try ESM dynamic import first
    const module = await import('@odavl-studio/insight-core');
    loadDetector = module.loadDetector || module.default?.loadDetector;
  } catch (esmError) {
    // Fallback to CJS require for compatibility
    try {
      const module = require('@odavl-studio/insight-core');
      loadDetector = module.loadDetector || module.default?.loadDetector;
    } catch (cjsError) {
      throw new Error(`Failed to load detector: ${(esmError as Error).message}`);
    }
  }

  if (!loadDetector) {
    throw new Error('Failed to load detector loader from @odavl-studio/insight-core');
  }

  // Run each detector
  for (const detectorName of detectorsToRun) {
    try {
      logger.info(`Running ${detectorName} detector...`);
      
      // Load detector class and instantiate it
      const DetectorClass = await loadDetector(detectorName as any);
      const detector = new DetectorClass(projectRoot);
      const results = await detector.detect();  // Use detect(), not analyze()
      
      // Convert detector results to InsightIssue format
      if (results && Array.isArray(results)) {
        for (const result of results) {
          allIssues.push({
            file: result.file || 'unknown',
            line: result.line || 0,
            column: result.column,
            severity: mapSeverity(result.severity),
            type: result.type || detectorName,
            detector: detectorName,
            message: result.message || 'No description',
            code: result.code,
            fix: result.fix,
          });
        }
      }
      
      loadedDetectors.push(detectorName);
      logger.success(`${detectorName}: ${results?.length || 0} issues`);
    } catch (error) {
      // TEMPORARY: Always log full error for debugging
      console.error(`[DEBUG] ${detectorName} error:`, error);
      logger.error(`Failed to run ${detectorName} detector`, error as Error);
    }
  }
}

/**
 * Map detector severity to standard format
 */
function mapSeverity(
  severity?: string | number
): 'critical' | 'high' | 'medium' | 'low' {
  if (!severity) return 'low';
  
  const sev = String(severity).toLowerCase();
  
  if (sev.includes('critical') || sev === '2') return 'critical';
  if (sev.includes('high') || sev.includes('error') || sev === '1') return 'high';
  if (sev.includes('medium') || sev.includes('warn')) return 'medium';
  
  return 'low';
}
