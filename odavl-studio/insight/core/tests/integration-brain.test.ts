/**
 * WAVE 8 PHASE 2G: Brain Integration Test
 * Tests: Full Brain Pipeline with Worker Pool
 */

import { describe, test, expect } from 'vitest';
import * as path from 'node:path';
import { runBrainPipeline } from '@odavl-studio/brain';

describe('WAVE 8 PHASE 2G - Brain Integration', () => {
  test('Brain analyzes test fixtures using worker pool', async () => {
    console.log('\n=== BRAIN INTEGRATION TEST ===');
    
    const testProjectRoot = path.resolve(__dirname, '../test-fixtures/security');
    
    const startTime = Date.now();
    
    const result = await runBrainPipeline({
      projectRoot: testProjectRoot,
      detectors: ['security', 'typescript', 'import', 'performance', 'circular'],
      skipAutopilot: true, // Don't fix anything, just analyze
      skipGuardian: true,  // Skip website testing
      maxFixes: 0,
    });
    
    const totalDuration = Date.now() - startTime;

    console.log('\n=== BRAIN PIPELINE RESULT ===');
    console.log(`Total Duration: ${totalDuration}ms`);
    console.log(`Insight Issues: ${result.insight.totalIssues}`);
    console.log(`Insight Detectors Run: ${result.insight.detectorsRun}`);
    console.log(`Ready for Release: ${result.readyForRelease}`);
    console.log(`Launch Score: ${result.launchScore}/100`);

    // Detailed breakdown
    console.log('\n=== INSIGHT BREAKDOWN ===');
    console.log(`Critical: ${result.insight.criticalIssues}`);
    console.log(`High: ${result.insight.highIssues}`);
    console.log(`Medium: ${result.insight.mediumIssues}`);
    console.log(`Low: ${result.insight.lowIssues}`);

    // Verify results
    expect(result.insight).toBeDefined();
    expect(result.insight.totalIssues).toBeGreaterThanOrEqual(0);
    expect(result.insight.detectorsRun).toBeGreaterThan(0);
    expect(Array.isArray(result.insight.issues)).toBe(true);
    expect(typeof result.launchScore).toBe('number');

    console.log('\n✓ Brain integration test passed');
  }, 300000); // 5 minutes timeout
});
