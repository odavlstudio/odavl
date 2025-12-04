/**
 * Example: Using RuntimeTestingAgent
 * 
 * This example shows how to use Guardian v4.0's RuntimeTestingAgent
 * to detect runtime issues in VS Code extensions.
 * 
 * ⚠️ IMPORTANT: Guardian detects issues. Autopilot fixes them.
 */

import { RuntimeTestingAgent } from '../agents/runtime-tester.js';

async function main() {
  console.log('🛡️  ODAVL Guardian v4.0 - Runtime Testing Example\n');
  
  const agent = new RuntimeTestingAgent();
  
  try {
    // Initialize Playwright browser
    await agent.initialize();
    console.log('✅ Browser initialized\n');
    
    // Test 1: Insight Extension
    console.log('📋 Test 1: ODAVL Insight Extension');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    const insightPath = process.cwd() + '/../insight/extension';
    const insightReport = await agent.testVSCodeExtension(insightPath);
    
    console.log(`Readiness Score: ${insightReport.readiness}%`);
    console.log(`Status: ${insightReport.success ? '✅ READY' : '⚠️  ISSUES DETECTED'}`);
    console.log(`Issues Found: ${insightReport.issues.length}\n`);
    
    if (insightReport.issues.length > 0) {
      console.log('Issues:');
      insightReport.issues.forEach((issue, i) => {
        console.log(`  ${i + 1}. [${issue.severity.toUpperCase()}] ${issue.message}`);
      });
      console.log();
    }
    
    // Test 2: Guardian Extension
    console.log('📋 Test 2: ODAVL Guardian Extension');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    const guardianPath = process.cwd() + '/extension';
    const guardianReport = await agent.testVSCodeExtension(guardianPath);
    
    console.log(`Readiness Score: ${guardianReport.readiness}%`);
    console.log(`Status: ${guardianReport.success ? '✅ READY' : '⚠️  ISSUES DETECTED'}`);
    console.log(`Issues Found: ${guardianReport.issues.length}\n`);
    
    if (guardianReport.issues.length > 0) {
      console.log('Issues:');
      guardianReport.issues.forEach((issue, i) => {
        console.log(`  ${i + 1}. [${issue.severity.toUpperCase()}] ${issue.message}`);
      });
      console.log();
    }
    
    // Summary
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📊 SUMMARY');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    const avgReadiness = Math.round(
      (insightReport.readiness + guardianReport.readiness) / 2
    );
    
    console.log(`Average Readiness: ${avgReadiness}%`);
    console.log(`Total Issues: ${insightReport.issues.length + guardianReport.issues.length}`);
    
    const criticalCount = [
      ...insightReport.issues,
      ...guardianReport.issues
    ].filter(i => i.severity === 'critical').length;
    
    if (criticalCount > 0) {
      console.log(`\n⚠️  ${criticalCount} critical issues found`);
      console.log('\n💡 Next Steps:');
      console.log('   1. Review issues above');
      console.log('   2. Guardian detected issues (this tool)');
      console.log('   3. Use Autopilot to apply fixes:');
      console.log('      odavl autopilot run');
    } else {
      console.log('\n✅ No critical issues! Extensions ready to publish.');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await agent.cleanup();
    console.log('\n🧹 Cleaned up resources');
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export { main };
