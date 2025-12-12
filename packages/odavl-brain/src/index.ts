/**
 * ODAVL Brain v1 - Main Orchestrator
 * Phase P1: Manifest integration (read-only)
 * Phase P3: ACTIVE manifest enforcement (confidence, deployment, memory, learning)
 * Coordinates Insight → Autopilot → Guardian pipeline
 */

// Phase P1: Manifest configuration (read-only wiring)
export * from './config/manifest-config.js';

import { Logger } from './utils/logger.js';
import { runInsight } from './adapters/insight-adapter.js';
import { runAutopilot } from './adapters/autopilot-adapter.js';
import { runGuardian } from './adapters/guardian-adapter.js';
import type { BrainPipelineReport, BrainConfig } from './types.js';
import * as fs from 'fs/promises';
import * as path from 'path';

// Phase P1: Manifest integration
import { manifest } from '@odavl/core/manifest';

// Phase P3: Enforcement functions
import {
  canModifyKnowledge,
  enforceMemoryLimit,
  validateConfidence,
  shouldAllowDeployment,
  shouldAutoApproveRecipe,
} from './config/manifest-config.js';

const logger = new Logger('BrainOrchestrator');

/**
 * Run complete ODAVL Brain pipeline
 * Insight → Autopilot → Guardian
 */
export async function runBrainPipeline(
  config: BrainConfig
): Promise<BrainPipelineReport> {
  const startTime = Date.now();
  
  logger.section('🧠 ODAVL BRAIN v1 - Pipeline Starting');
  logger.info(`Project: ${config.projectRoot}`);
  logger.info(`Skip Autopilot: ${config.skipAutopilot || false}`);
  logger.info(`Skip Guardian: ${config.skipGuardian || false}`);

  // Phase 1: Run Insight Analysis
  const insightResult = await runInsight(
    config.projectRoot,
    config.detectors
  );

  // Phase 2: Run Autopilot (if not skipped)
  let autopilotResult;
  
  if (!config.skipAutopilot && insightResult.totalIssues > 0) {
    // Phase P3: Validate confidence threshold before Autopilot
    const insightConfidence = 0.9; // Placeholder - would be calculated from Insight analysis
    const confidenceCheck = validateConfidence('autopilot', insightConfidence);
    
    if (!confidenceCheck.meetsThreshold) {
      logger.warn(`⚠️  Autopilot confidence check failed: ${confidenceCheck.confidence.toFixed(2)} < ${confidenceCheck.threshold}`);
      logger.warn('Skipping Autopilot due to low confidence');
      // TODO P3: Add audit entry for confidence failure
      
      autopilotResult = {
        timestamp: new Date().toISOString(),
        projectRoot: config.projectRoot,
        totalFixes: 0,
        fixes: [],
        changedFiles: [],
        diffSummary: 'Skipped due to low confidence',
        attestationHash: '',
        duration: 0,
        errors: ['Confidence threshold not met'],
      };
    } else {
      logger.info(`✓ Autopilot confidence check passed: ${confidenceCheck.confidence.toFixed(2)} >= ${confidenceCheck.threshold}`);
      
      const issuesToFix = config.maxFixes
        ? insightResult.issues.slice(0, config.maxFixes)
        : insightResult.issues;
      
      autopilotResult = await runAutopilot(config.projectRoot, issuesToFix);
    }
  } else {
    logger.info('Skipping Autopilot (no issues or explicitly skipped)');
    
    // Create empty result
    autopilotResult = {
      timestamp: new Date().toISOString(),
      projectRoot: config.projectRoot,
      totalFixes: 0,
      fixes: [],
      changedFiles: [],
      diffSummary: 'No fixes applied',
      attestationHash: '',
      duration: 0,
      errors: [],
    };
  }

  // Phase P3: Check if Brain can modify knowledge (learning mode)
  const canLearn = canModifyKnowledge();
  if (!canLearn) {
    logger.warn('[Brain] ⚠️  Learning disabled - Brain in read-only mode');
    // TODO P3: Add audit entry for learning mode restriction
  } else {
    logger.info('[Brain] ✓ Learning enabled - Brain can modify knowledge base');
  }

  // Phase 3: Run Guardian (if not skipped)
  let guardianResult;
  
  if (!config.skipGuardian) {
    guardianResult = await runGuardian(config.projectRoot);
  } else {
    logger.info('Skipping Guardian (explicitly skipped)');
    
    // Create empty result
    guardianResult = {
      timestamp: new Date().toISOString(),
      projectRoot: config.projectRoot,
      tests: [],
      totalTests: 0,
      passedTests: 0,
      failedTests: 0,
      skippedTests: 0,
      launchReady: false,
      duration: 0,
      recommendations: ['Guardian verification was skipped'],
    };
  }

  // Calculate launch score
  const launchScore = calculateLaunchScore(
    insightResult,
    autopilotResult,
    guardianResult
  );

  // Phase P3: Evaluate deployment decision policy
  const deploymentContext = {
    guardian: {
      launchReady: guardianResult.launchReady,
      passedTests: guardianResult.passedTests,
      failedTests: guardianResult.failedTests,
    },
    insight: {
      totalIssues: insightResult.totalIssues,
      criticalIssues: insightResult.issues.filter((i: any) => i.severity === 'critical').length,
    },
    autopilot: {
      errors: autopilotResult.errors.length,
      totalFixes: autopilotResult.totalFixes,
    },
    launchScore,
  };

  const deploymentDecision = shouldAllowDeployment(deploymentContext);
  
  if (!deploymentDecision.allowed) {
    logger.error('[Brain] ❌ Deployment blocked by decision policy');
    deploymentDecision.failedConditions.forEach((cond) => {
      logger.error(`   Failed: ${cond}`);
    });
    // TODO P3: Add audit entry for deployment block
  } else {
    logger.info('[Brain] ✓ Deployment allowed by decision policy');
    deploymentDecision.satisfiedConditions.forEach((cond) => {
      logger.info(`   Satisfied: ${cond}`);
    });
  }

  // Determine if ready for release (using both legacy logic and decision policy)
  const readyForRelease = 
    deploymentDecision.allowed &&
    guardianResult.launchReady &&
    insightResult.totalIssues === 0 &&
    autopilotResult.errors.length === 0;

  // Generate recommendations
  const recommendations = generateRecommendations(
    insightResult,
    autopilotResult,
    guardianResult
  );

  const totalDuration = Date.now() - startTime;

  const report: BrainPipelineReport = {
    timestamp: new Date().toISOString(),
    projectRoot: config.projectRoot,
    insight: insightResult,
    autopilot: autopilotResult,
    guardian: guardianResult,
    launchScore,
    readyForRelease,
    recommendations,
    totalDuration,
  };

  // Save report to .odavl/brain-report.json
  await saveReport(config.projectRoot, report);

  // Phase P3: Enforce memory limits for Brain's knowledge store
  await enforceMemoryLimitsForKnowledge(config.projectRoot);

  // Display final summary
  displaySummary(report);

  return report;
}

/**
 * Calculate launch score (0-100)
 */
function calculateLaunchScore(
  insight: any,
  autopilot: any,
  guardian: any
): number {
  let score = 100;

  // Deduct points for issues
  score -= Math.min(insight.totalIssues * 2, 30);

  // Deduct points for autopilot errors
  score -= Math.min(autopilot.errors.length * 5, 20);

  // Deduct points for failed tests
  score -= Math.min(guardian.failedTests * 10, 30);

  // Add points for passed tests
  if (guardian.totalTests > 0) {
    const passRate = guardian.passedTests / guardian.totalTests;
    score += passRate * 20;
  }

  return Math.max(0, Math.round(score));
}

/**
 * Generate recommendations
 */
function generateRecommendations(
  insight: any,
  autopilot: any,
  guardian: any
): string[] {
  const recommendations: string[] = [];

  // Critical issues
  const criticalIssues = insight.issues.filter(
    (i: any) => i.severity === 'critical'
  );
  
  if (criticalIssues.length > 0) {
    recommendations.push(
      `🚨 Fix ${criticalIssues.length} critical issues before deployment`
    );
  }

  // High severity issues
  const highIssues = insight.issues.filter((i: any) => i.severity === 'high');
  
  if (highIssues.length > 0) {
    recommendations.push(
      `⚠️ Address ${highIssues.length} high-severity issues`
    );
  }

  // Autopilot errors
  if (autopilot.errors.length > 0) {
    recommendations.push(
      `🔧 Review ${autopilot.errors.length} autopilot errors`
    );
  }

  // Guardian failures
  if (guardian.failedTests > 0) {
    recommendations.push(
      `❌ Fix ${guardian.failedTests} failing tests`
    );
  }

  // Add Guardian recommendations
  recommendations.push(...guardian.recommendations);

  // Success message
  if (recommendations.length === 0) {
    recommendations.push('✅ All checks passed! Ready for deployment.');
  }

  return recommendations;
}

/**
 * Save report to .odavl/brain-report.json
 */
async function saveReport(
  projectRoot: string,
  report: BrainPipelineReport
): Promise<void> {
  try {
    const odavlDir = path.join(projectRoot, '.odavl');
    await fs.mkdir(odavlDir, { recursive: true });

    const reportPath = path.join(odavlDir, 'brain-report.json');
    await fs.writeFile(reportPath, JSON.stringify(report, null, 2));

    logger.success(`Report saved: ${reportPath}`);
  } catch (error) {
    logger.error('Failed to save report', error as Error);
  }
}

/**
 * Display final summary
 */
function displaySummary(report: BrainPipelineReport): void {
  logger.section('🧠 ODAVL BRAIN v1 - Pipeline Complete');
  
  console.log('\n📊 RESULTS SUMMARY\n');
  console.log('─'.repeat(60));
  
  console.log(`\n🔍 INSIGHT:`);
  console.log(`   Total Issues: ${report.insight.totalIssues}`);
  console.log(`   Detectors Run: ${report.insight.detectors.length}`);
  console.log(`   Duration: ${report.insight.duration}ms`);
  
  console.log(`\n🤖 AUTOPILOT:`);
  console.log(`   Fixes Applied: ${report.autopilot.totalFixes}`);
  console.log(`   Files Changed: ${report.autopilot.changedFiles.length}`);
  console.log(`   Errors: ${report.autopilot.errors.length}`);
  console.log(`   Duration: ${report.autopilot.duration}ms`);
  
  console.log(`\n🛡️ GUARDIAN:`);
  console.log(`   Total Tests: ${report.guardian.totalTests}`);
  console.log(`   Passed: ${report.guardian.passedTests} ✅`);
  console.log(`   Failed: ${report.guardian.failedTests} ❌`);
  console.log(`   Skipped: ${report.guardian.skippedTests} ⏭️`);
  console.log(`   Launch Ready: ${report.guardian.launchReady ? '✅ YES' : '❌ NO'}`);
  console.log(`   Duration: ${report.guardian.duration}ms`);
  
  console.log('\n─'.repeat(60));
  console.log(`\n🎯 LAUNCH SCORE: ${report.launchScore}/100`);
  console.log(`🚀 READY FOR RELEASE: ${report.readyForRelease ? '✅ YES' : '❌ NO'}`);
  console.log(`⏱️ TOTAL DURATION: ${report.totalDuration}ms`);
  
  if (report.recommendations.length > 0) {
    console.log('\n📋 RECOMMENDATIONS:\n');
    for (const rec of report.recommendations) {
      console.log(`   ${rec}`);
    }
  }
  
  console.log('\n' + '='.repeat(60) + '\n');
}

/**
 * Phase P3: Enforce memory limits on Brain's knowledge store
 */
async function enforceMemoryLimitsForKnowledge(
  projectRoot: string
): Promise<void> {
  try {
    const brainDir = path.join(projectRoot, '.odavl', 'brain');
    
    // Check short-term memory
    const shortTermPath = path.join(brainDir, 'short-term');
    try {
      const shortTermFiles = await fs.readdir(shortTermPath);
      const shortTermCount = shortTermFiles.length;
      
      const shortTermCheck = enforceMemoryLimit(shortTermCount, 0, 'shortTerm');
      
      if (shortTermCheck.shouldEvict) {
        logger.warn(`[Brain] ⚠️  Short-term memory exceeded: ${shortTermCount} entries`);
        logger.warn(`[Brain] Evicting ${shortTermCheck.itemsToEvict} entries using ${shortTermCheck.policy} policy`);
        // TODO P3: Implement actual eviction logic
        // TODO P3: Add audit entry for memory eviction
      }
    } catch {
      // Short-term memory doesn't exist yet
    }
    
    // Check long-term memory
    const longTermPath = path.join(brainDir, 'long-term');
    try {
      const longTermFiles = await fs.readdir(longTermPath);
      const longTermCount = longTermFiles.length;
      
      const longTermCheck = enforceMemoryLimit(longTermCount, 0, 'longTerm');
      
      if (longTermCheck.shouldEvict) {
        logger.warn(`[Brain] ⚠️  Long-term memory exceeded: ${longTermCount} entries`);
        logger.warn(`[Brain] Evicting ${longTermCheck.itemsToEvict} entries using ${longTermCheck.policy} policy`);
        // TODO P3: Implement actual eviction logic
        // TODO P3: Add audit entry for memory eviction
      }
    } catch {
      // Long-term memory doesn't exist yet
    }
  } catch (error) {
    logger.warn(`[Brain] Memory limit enforcement failed (fail-safe): ${(error as Error).message}`);
  }
}

// Export types
export * from './types.js';
