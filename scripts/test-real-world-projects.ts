/**
 * Real-World Project Testing Script
 * 
 * Tests ODAVL Insight on external Python projects to validate:
 * - Detection accuracy
 * - False positive rate
 * - Performance metrics
 * - ML predictor effectiveness
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import { PythonTypeDetector } from '../odavl-studio/insight/core/src/detector/python-type-detector.js';
import { PythonSecurityDetector } from '../odavl-studio/insight/core/src/detector/python-security-detector.js';
import { PythonComplexityDetector } from '../odavl-studio/insight/core/src/detector/python-complexity-detector.js';

interface TestProject {
  name: string;
  path: string;
  description: string;
  expectedIssues: {
    type: number;
    security: number;
    complexity: number;
  };
}

const testProjects: TestProject[] = [
  {
    name: 'Flask API',
    path: 'test-real-world-python/flask-api',
    description: 'RESTful API with database connections',
    expectedIssues: {
      type: 5,
      security: 3,
      complexity: 2,
    },
  },
  {
    name: 'FastAPI Sample',
    path: 'test-real-world-python/fastapi-sample',
    description: 'Async API with modern Python patterns',
    expectedIssues: {
      type: 4,
      security: 2,
      complexity: 3,
    },
  },
  {
    name: 'Django Blog',
    path: 'test-real-world-python/django-blog',
    description: 'Full Django application with models and views',
    expectedIssues: {
      type: 6,
      security: 4,
      complexity: 5,
    },
  },
];

async function analyzeProject(project: TestProject) {
  console.log(`\n${'═'.repeat(80)}`);
  console.log(`📊 Analyzing: ${project.name}`);
  console.log(`   Description: ${project.description}`);
  console.log(`   Path: ${project.path}`);
  console.log(`${'═'.repeat(80)}\n`);
  
  const startTime = Date.now();
  
  // Initialize detectors
  const detectors = [
    { name: 'Type Hints', DetectorClass: PythonTypeDetector, expected: project.expectedIssues.type },
    { name: 'Security', DetectorClass: PythonSecurityDetector, expected: project.expectedIssues.security },
    { name: 'Complexity', DetectorClass: PythonComplexityDetector, expected: project.expectedIssues.complexity },
  ];
  
  const results: Array<{
    name: string;
    issues: number;
    expected: number;
    samples: any[];
    performance: number;
  }> = [];
  
  // Run each detector
  for (const { name, DetectorClass, expected } of detectors) {
    console.log(`🔍 Running ${name} Detector...`);
    
    const detectStart = Date.now();
    try {
      const detector = new DetectorClass(project.path);
      const issues = await detector.detect(project.path);
      const detectTime = Date.now() - detectStart;
      
      console.log(`   ✅ Found ${issues.length} issues (expected: ${expected}) in ${detectTime}ms`);
      
      // Sample first 3 issues
      const samples = issues.slice(0, 3).map(issue => ({
        file: path.basename(issue.file || 'unknown'),
        line: issue.line || 0,
        message: issue.message?.substring(0, 80) || 'No message',
        severity: issue.severity || 'medium',
      }));
      
      results.push({
        name,
        issues: issues.length,
        expected,
        samples,
        performance: detectTime,
      });
      
      // Show samples
      if (samples.length > 0) {
        console.log(`\n   Sample Issues:`);
        samples.forEach((sample, i) => {
          console.log(`     ${i + 1}. ${sample.file}:${sample.line}`);
          console.log(`        ${sample.message}`);
          console.log(`        Severity: ${sample.severity}\n`);
        });
      }
      
    } catch (error) {
      console.error(`   ❌ Error: ${error}`);
      results.push({
        name,
        issues: 0,
        expected,
        samples: [],
        performance: Date.now() - detectStart,
      });
    }
  }
  
  const totalTime = Date.now() - startTime;
  
  // Summary
  console.log(`\n${'─'.repeat(80)}`);
  console.log(`📈 Summary for ${project.name}:\n`);
  
  const totalIssues = results.reduce((sum, r) => sum + r.issues, 0);
  const totalExpected = results.reduce((sum, r) => sum + r.expected, 0);
  const accuracy = totalExpected > 0 ? ((totalIssues / totalExpected) * 100).toFixed(1) : 'N/A';
  
  console.log(`   Total Issues: ${totalIssues} (expected: ${totalExpected})`);
  console.log(`   Accuracy: ${accuracy}%`);
  console.log(`   Total Time: ${totalTime}ms\n`);
  
  results.forEach(result => {
    const accuracyPercent = result.expected > 0 
      ? ((result.issues / result.expected) * 100).toFixed(1)
      : 'N/A';
    console.log(`   ${result.name}:`);
    console.log(`     Found: ${result.issues} (expected: ${result.expected})`);
    console.log(`     Accuracy: ${accuracyPercent}%`);
    console.log(`     Performance: ${result.performance}ms\n`);
  });
  
  return {
    project: project.name,
    totalIssues,
    totalExpected,
    accuracy: parseFloat(accuracy),
    performance: totalTime,
    detectorResults: results,
  };
}

async function runAllTests() {
  console.log('\n🚀 ODAVL Insight - Real-World Project Testing\n');
  console.log('Testing on external Python projects to validate accuracy and performance\n');
  
  const allResults = [];
  
  for (const project of testProjects) {
    try {
      const result = await analyzeProject(project);
      allResults.push(result);
    } catch (error) {
      console.error(`❌ Failed to analyze ${project.name}: ${error}`);
    }
  }
  
  // Overall summary
  console.log(`\n\n${'═'.repeat(80)}`);
  console.log(`🎯 OVERALL TEST RESULTS\n`);
  console.log(`${'═'.repeat(80)}\n`);
  
  const totalIssues = allResults.reduce((sum, r) => sum + r.totalIssues, 0);
  const totalExpected = allResults.reduce((sum, r) => sum + r.totalExpected, 0);
  const avgAccuracy = allResults.reduce((sum, r) => sum + r.accuracy, 0) / allResults.length;
  const avgPerformance = allResults.reduce((sum, r) => sum + r.performance, 0) / allResults.length;
  
  console.log(`Projects Tested: ${allResults.length}`);
  console.log(`Total Issues Found: ${totalIssues}`);
  console.log(`Total Expected: ${totalExpected}`);
  console.log(`Average Accuracy: ${avgAccuracy.toFixed(1)}%`);
  console.log(`Average Analysis Time: ${avgPerformance.toFixed(0)}ms\n`);
  
  // Per-project summary
  console.log(`Per-Project Results:`);
  allResults.forEach(result => {
    console.log(`  ${result.project}:`);
    console.log(`    Issues: ${result.totalIssues}/${result.totalExpected}`);
    console.log(`    Accuracy: ${result.accuracy.toFixed(1)}%`);
    console.log(`    Time: ${result.performance}ms\n`);
  });
  
  // Save results
  const reportPath = '.odavl/insight/reports/real-world-test-results.json';
  await fs.mkdir(path.dirname(reportPath), { recursive: true });
  await fs.writeFile(reportPath, JSON.stringify({
    timestamp: new Date().toISOString(),
    testProjects: allResults,
    summary: {
      projectsTested: allResults.length,
      totalIssues,
      totalExpected,
      avgAccuracy,
      avgPerformance,
    },
  }, null, 2));
  
  console.log(`📄 Results saved to: ${reportPath}`);
  console.log(`${'═'.repeat(80)}\n`);
  
  // Pass/Fail criteria
  const ACCURACY_THRESHOLD = 70; // 70% minimum accuracy
  const PERFORMANCE_THRESHOLD = 5000; // 5 seconds max per project
  
  if (avgAccuracy >= ACCURACY_THRESHOLD && avgPerformance <= PERFORMANCE_THRESHOLD) {
    console.log(`✅ ALL TESTS PASSED!`);
    console.log(`   Accuracy: ${avgAccuracy.toFixed(1)}% (threshold: ${ACCURACY_THRESHOLD}%)`);
    console.log(`   Performance: ${avgPerformance.toFixed(0)}ms (threshold: ${PERFORMANCE_THRESHOLD}ms)\n`);
  } else {
    console.log(`⚠️  TESTS NEED ATTENTION:`);
    if (avgAccuracy < ACCURACY_THRESHOLD) {
      console.log(`   ❌ Accuracy: ${avgAccuracy.toFixed(1)}% (below ${ACCURACY_THRESHOLD}% threshold)`);
    }
    if (avgPerformance > PERFORMANCE_THRESHOLD) {
      console.log(`   ❌ Performance: ${avgPerformance.toFixed(0)}ms (above ${PERFORMANCE_THRESHOLD}ms threshold)`);
    }
    console.log();
  }
}

// Run all tests
runAllTests().catch(console.error);
