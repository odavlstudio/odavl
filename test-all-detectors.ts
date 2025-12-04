#!/usr/bin/env tsx
/**
 * ODAVL Insight - Comprehensive Test Suite
 * Tests all major detectors to verify functionality
 */

import {
  TSDetector,
  ESLintDetector,
  ComplexityDetector,
  SecurityDetector,
  PythonTypeDetector,
  PythonSecurityDetector,
  JavaComplexityDetector,
} from './odavl-studio/insight/core/src/detector/index.js';

const workspacePath = process.cwd();
const results: { name: string; status: string; issues: number; time: number }[] = [];

async function testDetector(name: string, fn: () => Promise<any[]>) {
  const start = Date.now();
  try {
    const issues = await fn();
    const time = Date.now() - start;
    results.push({ name, status: '✅ PASS', issues: issues.length, time });
    return issues.length;
  } catch (error: any) {
    const time = Date.now() - start;
    results.push({ name, status: '❌ FAIL', issues: 0, time });
    console.error(`  Error: ${error.message}`);
    return 0;
  }
}

async function runTests() {
  console.log('\n🔍 ODAVL Insight - Comprehensive Detector Tests\n');
  console.log('═'.repeat(60));
  
  // Test 1: TypeScript Detector
  console.log('\n1️⃣  Testing TypeScript Detector...');
  await testDetector('TypeScript', async () => {
    const detector = new TSDetector(workspacePath);
    return await detector.detect();
  });
  
  // Test 2: ESLint Detector
  console.log('2️⃣  Testing ESLint Detector...');
  await testDetector('ESLint', async () => {
    const detector = new ESLintDetector(workspacePath);
    return await detector.detect();
  });
  
  // Test 3: Complexity Detector
  console.log('3️⃣  Testing Complexity Detector...');
  await testDetector('Complexity', async () => {
    const detector = new ComplexityDetector(workspacePath);
    return await detector.detect();
  });
  
  // Test 4: Security Detector (on specific file)
  console.log('4️⃣  Testing Security Detector...');
  await testDetector('Security', async () => {
    const detector = new SecurityDetector(workspacePath);
    return await detector.detect('./test-security-issues.ts');
  });
  
  // Test 5: Python Type Detector
  console.log('5️⃣  Testing Python Type Detector...');
  await testDetector('Python Types', async () => {
    const detector = new PythonTypeDetector(workspacePath);
    return await detector.detect();
  });
  
  // Test 6: Python Security Detector
  console.log('6️⃣  Testing Python Security Detector...');
  await testDetector('Python Security', async () => {
    const detector = new PythonSecurityDetector(workspacePath);
    return await detector.detect();
  });
  
  // Test 7: Java Complexity Detector
  console.log('7️⃣  Testing Java Complexity Detector...');
  await testDetector('Java Complexity', async () => {
    const detector = new JavaComplexityDetector(workspacePath);
    return await detector.detect();
  });
  
  // Print Results
  console.log('\n═'.repeat(60));
  console.log('\n📊 TEST RESULTS SUMMARY\n');
  console.log('═'.repeat(60));
  
  console.table(results.map(r => ({
    '🔍 Detector': r.name,
    '📊 Status': r.status,
    '🐛 Issues': r.issues,
    '⏱️  Time (ms)': r.time
  })));
  
  const passed = results.filter(r => r.status === '✅ PASS').length;
  const failed = results.filter(r => r.status === '❌ FAIL').length;
  const totalIssues = results.reduce((sum, r) => sum + r.issues, 0);
  const totalTime = results.reduce((sum, r) => sum + r.time, 0);
  
  console.log('\n═'.repeat(60));
  console.log(`\n✅ Passed: ${passed}/${results.length}`);
  console.log(`❌ Failed: ${failed}/${results.length}`);
  console.log(`🐛 Total Issues Found: ${totalIssues}`);
  console.log(`⏱️  Total Time: ${totalTime}ms`);
  console.log(`\n${passed === results.length ? '🎉 All tests passed!' : '⚠️  Some tests failed'}`);
  console.log('\n═'.repeat(60));
}

runTests().catch(console.error);
