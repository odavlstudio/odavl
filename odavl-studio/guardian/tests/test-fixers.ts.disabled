/**
 * Test Guardian Auto-Fixers on Real Projects
 */

import { NextJSAppInspector } from '../inspectors/nextjs-app.js';
import { NextJSFixer } from '../fixers/nextjs-fixer.js';
import { LaunchValidator } from '../core/launch-validator.js';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function testStudioHubFixes() {
  console.log('🧪 Testing Guardian Auto-Fixers on Studio Hub\n');

  const projectPath = join(__dirname, '../../../apps/studio-hub');
  
  // Step 1: Initial scan
  console.log('Step 1: Initial scan...');
  const inspector = new NextJSAppInspector();
  const initialReport = await inspector.inspect(projectPath);
  
  console.log(`\n📊 Initial Readiness: ${initialReport.readinessScore}%`);
  console.log(`   Status: ${initialReport.status}`);
  console.log(`   Issues found: ${initialReport.issues.length}`);
  
  initialReport.issues.forEach(issue => {
    console.log(`   - [${issue.severity}] ${issue.message}`);
  });

  // Step 2: Apply fixes
  console.log('\n\nStep 2: Applying auto-fixes...');
  const fixer = new NextJSFixer();
  const fixResults = await fixer.applyFixes(projectPath, initialReport.issues);
  
  console.log(`\n🔧 Applied ${fixResults.length} fixes:`);
  fixResults.forEach(result => {
    const status = result.success ? '✅' : '❌';
    console.log(`   ${status} ${result.fixType}`);
    if (result.details) {
      console.log(`      Details: ${result.details}`);
    }
    if (!result.success && result.error) {
      console.log(`      Error: ${result.error}`);
    }
  });

  // Step 3: Verify fixes
  console.log('\n\nStep 3: Verifying fixes...');
  const verificationReport = await inspector.inspect(projectPath);
  
  console.log(`\n📊 After Fixes: ${verificationReport.readinessScore}%`);
  console.log(`   Status: ${verificationReport.status}`);
  console.log(`   Issues remaining: ${verificationReport.issues.length}`);
  
  if (verificationReport.issues.length > 0) {
    verificationReport.issues.forEach(issue => {
      console.log(`   - [${issue.severity}] ${issue.message}`);
    });
  }

  // Step 4: Summary
  const improvement = verificationReport.readinessScore - initialReport.readinessScore;
  console.log(`\n\n✨ Summary:`);
  console.log(`   Improvement: ${improvement > 0 ? '+' : ''}${improvement}%`);
  console.log(`   Status: ${initialReport.status} → ${verificationReport.status}`);
  console.log(`   Fixed: ${initialReport.issues.length - verificationReport.issues.length} issues`);
  
  if (verificationReport.readinessScore >= 90) {
    console.log('\n🎉 Studio Hub is now READY for launch!');
  } else if (verificationReport.readinessScore >= 60) {
    console.log('\n⚠️  Studio Hub is UNSTABLE - remaining issues need attention');
  } else {
    console.log('\n🚫 Studio Hub is BLOCKED - critical issues remain');
  }
}

// Test with LaunchValidator
async function testLaunchValidator() {
  console.log('\n\n' + '='.repeat(80));
  console.log('🎯 Testing LaunchValidator End-to-End Flow\n');

  const projectPath = join(__dirname, '../../../apps/studio-hub');
  const validator = new LaunchValidator();

  const result = await validator.validateAndFix('nextjs-app', projectPath);

  console.log('📋 Initial Report:');
  console.log(`   Readiness: ${result.report.readinessScore}%`);
  console.log(`   Issues: ${result.report.issues.length}`);

  console.log('\n🔧 Fixes Applied:');
  result.fixesApplied?.forEach(fix => {
    const status = fix.success ? '✅' : '❌';
    console.log(`   ${status} ${fix.fixType}`);
  });

  console.log('\n✅ Verification Report:');
  if (result.verificationReport) {
    console.log(`   Readiness: ${result.verificationReport.readinessScore}%`);
    console.log(`   Status: ${result.verificationReport.status}`);
    console.log(`   Remaining Issues: ${result.verificationReport.issues.length}`);

    const improvement = result.verificationReport.readinessScore - result.report.readinessScore;
    console.log(`\n✨ Total Improvement: ${improvement > 0 ? '+' : ''}${improvement}%`);
  }
}

// Run tests
async function runTests() {
  try {
    await testStudioHubFixes();
    await testLaunchValidator();
    
    console.log('\n\n' + '='.repeat(80));
    console.log('✅ All Guardian auto-fixer tests completed successfully!');
  } catch (error) {
    console.error('\n❌ Test failed:', error);
    process.exit(1);
  }
}

runTests();
