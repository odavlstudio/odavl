#!/usr/bin/env node
/**
 * Quick test for ArchitectureDetector
 * Run: node test-architecture-detector.mjs
 */

import { ArchitectureDetector, analyzeArchitecture } from './dist/index.mjs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Test workspace root (use current Insight Core package)
const workspaceRoot = __dirname;

console.log('🧪 Testing ArchitectureDetector...\n');
console.log(`📂 Workspace: ${workspaceRoot}\n`);

try {
  const result = await analyzeArchitecture(workspaceRoot);
  
  console.log('✅ Analysis Complete!\n');
  console.log('📊 Metrics:');
  console.log(`   - Total Modules: ${result.metrics.totalModules}`);
  console.log(`   - Circular Dependencies: ${result.metrics.circularDeps}`);
  console.log(`   - Average Coupling: ${result.metrics.avgCoupling.toFixed(2)}`);
  console.log(`   - Layer Health: ${result.metrics.layerHealth}%`);
  console.log(`   - Architecture Score: ${result.metrics.architectureScore}/100\n`);
  
  console.log('🔍 Issues Found:');
  if (result.issues.length === 0) {
    console.log('   ✨ No issues detected!\n');
  } else {
    console.log(`   Total: ${result.issues.length}\n`);
    const bySeverity = result.issues.reduce((acc, issue) => {
      acc[issue.severity] = (acc[issue.severity] || 0) + 1;
      return acc;
    }, {});
    console.log(`   - Critical: ${bySeverity.critical || 0}`);
    console.log(`   - High: ${bySeverity.high || 0}`);
    console.log(`   - Medium: ${bySeverity.medium || 0}`);
    console.log(`   - Low: ${bySeverity.low || 0}\n`);
    
    // Show first 3 issues
    console.log('   Top 3 Issues:');
    result.issues.slice(0, 3).forEach((issue, i) => {
      console.log(`   ${i + 1}. [${issue.severity.toUpperCase()}] ${issue.message}`);
      if (issue.file) console.log(`      File: ${issue.file}`);
      if (issue.suggestion) console.log(`      Suggestion: ${issue.suggestion}`);
    });
  }
  
  console.log('\n🎉 Test passed!');
  process.exit(0);
} catch (error) {
  console.error('❌ Test failed:', error.message);
  console.error(error.stack);
  process.exit(1);
}
