/**
 * ODAVL Guardian v4.0 - Visual Regression Testing Example
 * 
 * Purpose: Demonstrate AIVisualInspector usage for detecting UI issues
 * 
 * Workflow:
 * 1. Take screenshots of VS Code extension
 * 2. Analyze UI with Claude Vision API
 * 3. Compare versions for regressions
 * 4. Display results with recommendations
 * 
 * ⚠️ CRITICAL: Guardian detects ONLY (no execution)
 * Use ODAVL Autopilot to apply suggested fixes
 */

import { AIVisualInspector } from '../agents/ai-visual-inspector';
import { RuntimeTestingAgent } from '../agents/runtime-tester';
import * as fs from 'fs/promises';
import * as path from 'path';

async function runVisualRegressionTest() {
  console.log('\n═══════════════════════════════════════');
  console.log('🛡️  GUARDIAN v4.0 - Visual Regression Testing');
  console.log('═══════════════════════════════════════\n');

  const inspector = new AIVisualInspector();
  const runtimeTester = new RuntimeTestingAgent();
  
  try {
    // Initialize runtime tester (Playwright)
    await runtimeTester.initialize();
    
    console.log('[Step 1] 📸 Taking screenshots...\n');
    
    // Test ODAVL Insight Extension
    console.log('Testing: ODAVL Insight Extension');
    const insightPath = path.join(process.cwd(), '../insight/extension');
    const insightReport = await runtimeTester.testVSCodeExtension(insightPath);
    
    if (insightReport.screenshots && insightReport.screenshots.length > 0) {
      console.log(`  ✅ Captured ${insightReport.screenshots.length} screenshots\n`);
      
      // Analyze first screenshot
      console.log('[Step 2] 🤖 AI analyzing UI...\n');
      const analysis = await inspector.analyzeExtensionUI(insightReport.screenshots[0]);
      
      console.log('📊 Visual Analysis Results:');
      console.log(`  Dashboard Visible: ${analysis.dashboardVisible ? '✅' : '❌'}`);
      console.log(`  Icon Visible: ${analysis.iconVisible ? '✅' : '❌'}`);
      console.log(`  Layout Correct: ${analysis.layoutCorrect ? '✅' : '❌'}`);
      console.log(`  Confidence: ${(analysis.confidence * 100).toFixed(0)}%\n`);
      
      // Display errors
      if (analysis.errors.length > 0) {
        console.log('⚠️  Issues Detected:');
        analysis.errors.forEach((error, index) => {
          const emoji = error.severity === 'critical' ? '🔴' : 
                       error.severity === 'high' ? '🟠' : 
                       error.severity === 'medium' ? '🟡' : '🟢';
          
          console.log(`  ${index + 1}. ${emoji} ${error.severity.toUpperCase()}`);
          console.log(`     Type: ${error.type}`);
          console.log(`     ${error.description}`);
          if (error.location) {
            console.log(`     Location: ${error.location}`);
          }
        });
        console.log();
      } else {
        console.log('✅ No visual issues detected!\n');
      }
      
      // Display suggestions
      if (analysis.suggestions.length > 0) {
        console.log('💡 AI Suggestions:');
        analysis.suggestions.forEach((suggestion, index) => {
          console.log(`  ${index + 1}. ${suggestion}`);
        });
        console.log();
      }
      
      // Compare with previous version (if available)
      const previousScreenshotPath = '.odavl/guardian/screenshots/previous.png';
      const previousExists = await fs.access(previousScreenshotPath)
        .then(() => true)
        .catch(() => false);
      
      if (previousExists) {
        console.log('[Step 3] 🔄 Comparing with previous version...\n');
        
        const previousScreenshot = await fs.readFile(previousScreenshotPath);
        const report = await inspector.compareVersions(
          previousScreenshot,
          insightReport.screenshots[0]
        );
        
        console.log('📊 Regression Report:');
        console.log(`  Overall: ${report.overallAssessment}\n`);
        
        if (report.changes.length > 0) {
          console.log('  Changes Detected:');
          report.changes.forEach((change, index) => {
            console.log(`    ${index + 1}. ${change}`);
          });
          console.log();
        }
        
        if (report.regressions.length > 0) {
          console.log('  🚨 Regressions Detected:');
          report.regressions.forEach((regression, index) => {
            const emoji = regression.severity === 'critical' ? '🔴' : 
                         regression.severity === 'high' ? '🟠' : 
                         regression.severity === 'medium' ? '🟡' : '🟢';
            
            console.log(`    ${index + 1}. ${emoji} ${regression.severity.toUpperCase()} - ${regression.type}`);
            console.log(`       ${regression.description}`);
            console.log(`       Recommendation: ${regression.recommendation}`);
          });
          console.log();
        }
        
        if (report.improvements.length > 0) {
          console.log('  ✅ Improvements:');
          report.improvements.forEach((improvement, index) => {
            console.log(`    ${index + 1}. ${improvement}`);
          });
          console.log();
        }
        
        if (report.newBugs.length > 0) {
          console.log('  🐛 New Bugs:');
          report.newBugs.forEach((bug, index) => {
            console.log(`    ${index + 1}. ${bug}`);
          });
          console.log();
        }
      }
      
      // Save current screenshot as "previous" for next run
      const screenshotsDir = '.odavl/guardian/screenshots';
      await fs.mkdir(screenshotsDir, { recursive: true });
      await fs.writeFile(
        path.join(screenshotsDir, 'previous.png'),
        insightReport.screenshots[0]
      );
      console.log('💾 Saved screenshot for next comparison\n');
      
    } else {
      console.log('  ❌ No screenshots captured\n');
    }
    
  } catch (error: any) {
    console.error('\n❌ Visual regression test failed:');
    console.error(`   ${error.message}\n`);
  } finally {
    await runtimeTester.cleanup();
  }
  
  console.log('═══════════════════════════════════════');
  console.log('🛡️  Guardian Job: Detect + Suggest (NOT fix)');
  console.log('🤖 Autopilot Job: Execute fixes safely\n');
  console.log('Next steps:');
  console.log('  1. Review AI suggestions above');
  console.log('  2. Use Autopilot to apply fixes:');
  console.log('     odavl autopilot run');
  console.log('═══════════════════════════════════════\n');
}

// Run example
runVisualRegressionTest().catch(console.error);

/**
 * Example Output:
 * 
 * ═══════════════════════════════════════
 * 🛡️  GUARDIAN v4.0 - Visual Regression Testing
 * ═══════════════════════════════════════
 * 
 * [Step 1] 📸 Taking screenshots...
 * 
 * Testing: ODAVL Insight Extension
 *   ✅ Captured 3 screenshots
 * 
 * [Step 2] 🤖 AI analyzing UI...
 * 
 * 🤖 AI analyzing extension UI...
 * ✅ AI Analysis Complete (confidence: 92%)
 * 
 * 📊 Visual Analysis Results:
 *   Dashboard Visible: ✅
 *   Icon Visible: ✅
 *   Layout Correct: ❌
 *   Confidence: 92%
 * 
 * ⚠️  Issues Detected:
 *   1. 🟠 HIGH
 *      Type: broken-layout
 *      Results panel overlapping with controls
 *      Location: main dashboard area
 * 
 * 💡 AI Suggestions:
 *   1. Increase spacing between results panel and controls
 *   2. Use flexbox for better layout management
 * 
 * [Step 3] 🔄 Comparing with previous version...
 * 
 * 🤖 AI comparing versions...
 * ✅ Regression Analysis: regressions detected - do not deploy
 * 
 * 📊 Regression Report:
 *   Overall: regressions detected - do not deploy
 * 
 *   Changes Detected:
 *     1. Results panel position changed
 *     2. Font size decreased
 * 
 *   🚨 Regressions Detected:
 *     1. 🔴 CRITICAL - visual
 *        Results panel now overlaps with controls
 *        Recommendation: Revert layout changes or add margin
 * 
 * 💾 Saved screenshot for next comparison
 * 
 * ═══════════════════════════════════════
 * 🛡️  Guardian Job: Detect + Suggest (NOT fix)
 * 🤖 Autopilot Job: Execute fixes safely
 * 
 * Next steps:
 *   1. Review AI suggestions above
 *   2. Use Autopilot to apply fixes:
 *      odavl autopilot run
 * ═══════════════════════════════════════
 */
