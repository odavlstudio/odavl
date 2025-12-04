#!/usr/bin/env tsx
/**
 * ODAVL Insight - Java CLI Integration Test
 * Tests CLI with all 5 Java detectors
 * Week 10 Day 4 - Integration & Testing
 */

import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  JavaComplexityDetector,
  JavaStreamDetector,
  JavaExceptionDetector,
  JavaMemoryDetector,
  JavaSpringDetector,
} from '../odavl-studio/insight/core/dist/detector/index.js';

// CLI-style interface
interface CLIOptions {
  language?: 'java' | 'typescript' | 'python';
  languages?: string;
  detectors?: string;
  workspace?: string;
}

async function testJavaCLI(options: CLIOptions) {
  console.log('\n🔍 ODAVL Insight - Java CLI Integration Test');
  console.log('=' .repeat(70));
  
  const workspace = options.workspace || join(process.cwd(), 'test-fixtures', 'java');
  console.log(`📁 Workspace: ${workspace}`);
  console.log(`🔧 Options:`, options);
  
  // Parse languages/detectors
  const languages = options.languages?.split(',') || [options.language || 'java'];
  const detectorNames = options.detectors?.split(',') || ['all'];
  
  console.log(`\n🌐 Languages: ${languages.join(', ')}`);
  console.log(`🎯 Detectors: ${detectorNames.join(', ')}`);
  
  if (!languages.includes('java')) {
    console.log('\n❌ Java not selected, skipping...');
    return;
  }
  
  // Select detectors
  const allDetectors = {
    complexity: new JavaComplexityDetector(workspace),
    stream: new JavaStreamDetector(workspace),
    exception: new JavaExceptionDetector(workspace),
    memory: new JavaMemoryDetector(workspace),
    spring: new JavaSpringDetector(workspace),
  };
  
  type DetectorMap = Record<string, JavaComplexityDetector | JavaStreamDetector | JavaExceptionDetector | JavaMemoryDetector | JavaSpringDetector>;
  const selectedDetectors: DetectorMap = {};
  
  if (detectorNames.includes('all')) {
    Object.assign(selectedDetectors, allDetectors);
  } else {
    for (const name of detectorNames) {
      if (name in allDetectors) {
        selectedDetectors[name as keyof typeof allDetectors] = allDetectors[name as keyof typeof allDetectors];
      }
    }
  }
  
  console.log(`\n✅ Selected ${Object.keys(selectedDetectors).length} detector(s)\n`);
  
  // Run detectors
  const startTime = performance.now();
  let totalIssues = 0;
  const results: Array<{ name: string; issues: number; time: number }> = [];
  
  for (const [name, detector] of Object.entries(selectedDetectors)) {
    const detectorStart = performance.now();
    const issues = await detector.detect();
    const detectorTime = performance.now() - detectorStart;
    
    console.log(`${name.padEnd(12)} │ ${issues.length.toString().padStart(3)} issues │ ${detectorTime.toFixed(0).padStart(4)}ms`);
    
    totalIssues += issues.length;
    results.push({ name, issues: issues.length, time: detectorTime });
  }
  
  const totalTime = performance.now() - startTime;
  
  console.log('\n' + '='.repeat(70));
  console.log(`📊 Total Issues: ${totalIssues}`);
  console.log(`⏱️  Total Time: ${totalTime.toFixed(0)}ms`);
  console.log(`📈 Average: ${(totalTime / results.length).toFixed(0)}ms per detector`);
  
  // Performance rating
  const targetMs = 150;
  const rating = totalTime < targetMs ? '✅ EXCELLENT' : totalTime < targetMs * 1.5 ? '🟡 GOOD' : '❌ NEEDS IMPROVEMENT';
  const percentFaster = ((targetMs - totalTime) / targetMs * 100).toFixed(0);
  
  console.log(`\n🎯 Performance: ${rating}`);
  if (totalTime < targetMs) {
    console.log(`   🚀 ${percentFaster}% faster than ${targetMs}ms target`);
  }
  
  console.log('\n' + '='.repeat(70));
}

// Test scenarios
async function runTestScenarios() {
  console.log('\n╔══════════════════════════════════════════════════════════════════════╗');
  console.log('║        ODAVL Insight - Java CLI Integration Test Suite              ║');
  console.log('╚══════════════════════════════════════════════════════════════════════╝');
  
  // Scenario 1: Single language (Java)
  console.log('\n\n📋 Scenario 1: --language java');
  console.log('─'.repeat(70));
  await testJavaCLI({ language: 'java' });
  
  // Scenario 2: Multiple languages
  console.log('\n\n📋 Scenario 2: --languages typescript,python,java');
  console.log('─'.repeat(70));
  await testJavaCLI({ languages: 'typescript,python,java' });
  
  // Scenario 3: Specific detectors
  console.log('\n\n📋 Scenario 3: --language java --detectors complexity,memory,spring');
  console.log('─'.repeat(70));
  await testJavaCLI({ language: 'java', detectors: 'complexity,memory,spring' });
  
  // Scenario 4: Single detector
  console.log('\n\n📋 Scenario 4: --language java --detectors stream');
  console.log('─'.repeat(70));
  await testJavaCLI({ language: 'java', detectors: 'stream' });
  
  console.log('\n\n╔══════════════════════════════════════════════════════════════════════╗');
  console.log('║                         Test Suite Complete                         ║');
  console.log('╚══════════════════════════════════════════════════════════════════════╝\n');
}

// Run tests
runTestScenarios().catch(console.error);
