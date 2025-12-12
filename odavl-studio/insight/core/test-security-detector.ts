/**
 * Direct detector test - Security detector on node-api-sample
 */

import { loadDetector } from './src/detector/detector-loader.js';
import * as path from 'path';

async function testSecurityDetector() {
  console.log('Loading security detector...');
  
  const Detector = await loadDetector('security');
  const detector = new Detector();
  
  const testDir = path.resolve('../runtime-tests/node-api-sample');
  console.log('Testing on directory:', testDir);
  
  const issues = await detector.detect(testDir);
  
  console.log('\nResults:');
  console.log(`Issues found: ${issues.length}`);
  
  if (issues.length > 0) {
    console.log('\nAll issues:');
    for (const issue of issues) {
      console.log(`  - [${issue.severity}] ${issue.message}`);
      if (issue.file) console.log(`    File: ${issue.file}`);
      if (issue.line) console.log(`    Line: ${issue.line}`);
    }
  } else {
    console.log('⚠️  No issues detected - detector may not be working properly');
  }
}

testSecurityDetector().catch(error => {
  console.error('Error:', error.message);
  console.error(error.stack);
  process.exit(1);
});
