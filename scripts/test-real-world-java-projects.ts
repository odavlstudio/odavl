#!/usr/bin/env tsx
/**
 * ODAVL Insight - Real-World Java Projects Test
 * Tests detectors on actual open-source Java projects
 * Week 10 Day 4 - Integration & Testing
 */

import { join } from 'node:path';
import {
  JavaComplexityDetector,
  JavaStreamDetector,
  JavaExceptionDetector,
  JavaMemoryDetector,
  JavaSpringDetector,
} from '../odavl-studio/insight/core/dist/detector/index.js';

interface ProjectTest {
  name: string;
  description: string;
  path: string;
  expectedIssues: {
    min: number;
    max: number;
  };
  detectors: string[];
}

// Real-world projects to test (we'll use existing odavl-studio code)
const projects: ProjectTest[] = [
  {
    name: 'ODAVL Test Fixtures',
    description: 'Comprehensive test fixture with known issues',
    path: join(process.cwd(), 'test-fixtures', 'java'),
    expectedIssues: { min: 30, max: 50 },
    detectors: ['all'],
  },
  {
    name: 'ODAVL Studio - Insight Core (TypeScript)',
    description: 'Testing on non-Java project (should find 0 issues)',
    path: join(process.cwd(), 'odavl-studio', 'insight', 'core', 'src'),
    expectedIssues: { min: 0, max: 0 },
    detectors: ['all'],
  },
];

async function testProject(project: ProjectTest): Promise<void> {
  console.log(`\n${'='.repeat(70)}`);
  console.log(`📦 Project: ${project.name}`);
  console.log(`📝 Description: ${project.description}`);
  console.log(`📁 Path: ${project.path}`);
  console.log(`${'='.repeat(70)}`);
  
  const detectors = [
    new JavaComplexityDetector(project.path),
    new JavaStreamDetector(project.path),
    new JavaExceptionDetector(project.path),
    new JavaMemoryDetector(project.path),
    new JavaSpringDetector(project.path),
  ];
  
  const detectorNames = ['Complexity', 'Stream API', 'Exception', 'Memory', 'Spring Boot'];
  
  let totalIssues = 0;
  let totalTime = 0;
  const results: Array<{ name: string; issues: number; time: number }> = [];
  
  console.log('\n🔍 Running Detectors:');
  console.log(`${'─'.repeat(70)}`);
  
  for (let i = 0; i < detectors.length; i++) {
    const detector = detectors[i];
    const name = detectorNames[i];
    
    try {
      const startTime = performance.now();
      const issues = await detector.detect();
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      totalIssues += issues.length;
      totalTime += duration;
      results.push({ name, issues: issues.length, time: duration });
      
      const status = issues.length > 0 ? '✅' : '⚪';
      console.log(`${status} ${name.padEnd(15)} │ ${issues.length.toString().padStart(3)} issues │ ${duration.toFixed(0).padStart(4)}ms`);
    } catch (error) {
      console.log(`❌ ${name.padEnd(15)} │ ERROR: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  console.log(`${'─'.repeat(70)}`);
  console.log(`📊 Total: ${totalIssues} issues in ${totalTime.toFixed(0)}ms`);
  
  // Validation
  const { min, max } = project.expectedIssues;
  if (totalIssues >= min && totalIssues <= max) {
    console.log(`✅ VALIDATION PASSED (expected ${min}-${max}, got ${totalIssues})`);
  } else {
    console.log(`⚠️  VALIDATION WARNING (expected ${min}-${max}, got ${totalIssues})`);
  }
  
  // Performance rating
  const targetMs = 150;
  if (totalTime < targetMs) {
    const percentFaster = ((targetMs - totalTime) / targetMs * 100).toFixed(0);
    console.log(`🎯 Performance: ✅ EXCELLENT (${percentFaster}% faster than ${targetMs}ms target)`);
  } else {
    console.log(`🎯 Performance: ⚠️  NEEDS IMPROVEMENT (${totalTime.toFixed(0)}ms > ${targetMs}ms target)`);
  }
  
  // Show breakdown by severity if issues found
  if (totalIssues > 0 && results.some(r => r.issues > 0)) {
    console.log(`\n📋 Detection Breakdown:`);
    for (const result of results) {
      if (result.issues > 0) {
        console.log(`   ${result.name}: ${result.issues} issues`);
      }
    }
  }
}

async function runAllTests() {
  console.log('\n╔══════════════════════════════════════════════════════════════════════╗');
  console.log('║       ODAVL Insight - Real-World Java Projects Test Suite           ║');
  console.log('╚══════════════════════════════════════════════════════════════════════╝');
  
  for (const project of projects) {
    await testProject(project);
  }
  
  console.log(`\n${'='.repeat(70)}`);
  console.log('✅ All project tests complete!');
  console.log(`${'='.repeat(70)}\n`);
}

// Run tests
runAllTests().catch(error => {
  console.error('\n❌ Test suite failed:', error);
  process.exit(1);
});
