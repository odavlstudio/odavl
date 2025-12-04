/**
 * ODAVL Guardian v4.0 - Complete Integration Example
 * 
 * Purpose: Demonstrate full Guardian→Autopilot workflow
 * 
 * Workflow:
 * 1. RuntimeTestingAgent detects runtime error
 * 2. SmartErrorAnalyzer diagnoses error with AI
 * 3. Generate Autopilot handoff JSON
 * 4. Save handoff file for Autopilot consumption
 * 5. User runs Autopilot to apply fixes safely
 * 
 * ⚠️ CRITICAL: Guardian detects + suggests ONLY (NEVER executes)
 * Autopilot executes fixes with O-D-A-V-L cycle (safe with undo)
 */

import { RuntimeTestingAgent } from '../agents/runtime-tester';
import { AIVisualInspector } from '../agents/ai-visual-inspector';
import { SmartErrorAnalyzer } from '../agents/smart-error-analyzer';
import type { GuardianAutopilotHandoff } from '../agents/handoff-schema';
import { getHandoffFilePath, isValidHandoff } from '../agents/handoff-schema';
import * as fs from 'fs/promises';
import * as path from 'path';

async function runCompleteGuardianWorkflow() {
  console.log('\n═══════════════════════════════════════════════════════');
  console.log('🛡️  ODAVL GUARDIAN v4.0 - Complete Workflow');
  console.log('   AI-Powered Detection → Autopilot Integration');
  console.log('═══════════════════════════════════════════════════════\n');

  const workspaceRoot = process.cwd();
  const runtimeTester = new RuntimeTestingAgent();
  const visualInspector = new AIVisualInspector();
  const errorAnalyzer = new SmartErrorAnalyzer();
  
  try {
    // ══════════════════════════════════════════════════════
    // Phase 1: Runtime Testing (Playwright)
    // ══════════════════════════════════════════════════════
    console.log('[Phase 1] 🤖 Runtime Testing\n');
    
    await runtimeTester.initialize();
    
    const extensionPath = path.join(workspaceRoot, '../insight/extension');
    console.log(`Testing: ${extensionPath}\n`);
    
    const runtimeReport = await runtimeTester.testVSCodeExtension(extensionPath);
    
    console.log(`📊 Runtime Test Results:`);
    console.log(`  Success: ${runtimeReport.success ? '✅' : '❌'}`);
    console.log(`  Readiness: ${runtimeReport.readiness}%`);
    console.log(`  Issues Found: ${runtimeReport.issues.length}\n`);
    
    if (runtimeReport.issues.length > 0) {
      console.log('⚠️  Issues Detected:\n');
      
      runtimeReport.issues.forEach((issue, index) => {
        const emoji = issue.severity === 'critical' ? '🔴' : 
                     issue.severity === 'high' ? '🟠' : 
                     issue.severity === 'medium' ? '🟡' : '🟢';
        
        console.log(`  ${index + 1}. ${emoji} ${issue.severity.toUpperCase()} - ${issue.type}`);
        console.log(`     ${issue.message}`);
        if (issue.stackTrace) {
          console.log(`     Stack: ${issue.stackTrace.substring(0, 100)}...`);
        }
        console.log();
      });
      
      // ══════════════════════════════════════════════════════
      // Phase 2: Visual Analysis (Claude Vision)
      // ══════════════════════════════════════════════════════
      if (runtimeReport.screenshots && runtimeReport.screenshots.length > 0) {
        console.log('[Phase 2] 👁️  AI Visual Analysis\n');
        
        const visualAnalysis = await visualInspector.analyzeExtensionUI(
          runtimeReport.screenshots[0]
        );
        
        console.log('📊 Visual Analysis Results:');
        console.log(`  Dashboard Visible: ${visualAnalysis.dashboardVisible ? '✅' : '❌'}`);
        console.log(`  Icon Visible: ${visualAnalysis.iconVisible ? '✅' : '❌'}`);
        console.log(`  Layout Correct: ${visualAnalysis.layoutCorrect ? '✅' : '❌'}`);
        console.log(`  AI Confidence: ${(visualAnalysis.confidence * 100).toFixed(0)}%\n`);
        
        if (visualAnalysis.errors.length > 0) {
          console.log('⚠️  Visual Issues:');
          visualAnalysis.errors.forEach((error, index) => {
            console.log(`  ${index + 1}. ${error.type}: ${error.description}`);
          });
          console.log();
        }
      }
      
      // ══════════════════════════════════════════════════════
      // Phase 3: Smart Error Analysis (Claude AI)
      // ══════════════════════════════════════════════════════
      console.log('[Phase 3] 🧠 AI Error Analysis\n');
      
      // Analyze the most critical issue
      const criticalIssue = runtimeReport.issues.find(i => i.severity === 'critical') 
        || runtimeReport.issues[0];
      
      const mockError = new Error(criticalIssue.message);
      mockError.stack = criticalIssue.stackTrace || '';
      
      const diagnosis = await errorAnalyzer.analyzeRuntimeError(mockError, {
        platform: 'extension',
        os: process.platform,
        vscodeVersion: '1.85.0',
        extensionVersion: '2.0.0',
        when: 'runtime testing',
        expected: 'extension works without errors',
        actual: criticalIssue.message,
        consoleLogs: criticalIssue.consoleLogs,
        stackTrace: criticalIssue.stackTrace
      });
      
      console.log('📊 AI Diagnosis:');
      console.log(`  Root Cause: ${diagnosis.rootCause}`);
      console.log(`  Platform Specific: ${diagnosis.isPlatformSpecific ? 'Yes' : 'No'}`);
      console.log(`  Runtime Issue: ${diagnosis.isRuntimeIssue ? 'Yes' : 'No'}`);
      console.log(`  Confidence: ${(diagnosis.confidence * 100).toFixed(0)}%`);
      console.log(`  Affected Files: ${diagnosis.affectedFiles.length}\n`);
      
      if (diagnosis.suggestedFix.files.length > 0) {
        console.log('💡 AI Suggested Fixes:');
        diagnosis.suggestedFix.files.forEach((fix, index) => {
          console.log(`  ${index + 1}. ${fix.action.toUpperCase()}: ${fix.path}`);
          console.log(`     ${fix.explanation}`);
        });
        console.log();
      }
      
      // ══════════════════════════════════════════════════════
      // Phase 4: Generate Autopilot Handoff
      // ══════════════════════════════════════════════════════
      console.log('[Phase 4] 📦 Generating Autopilot Handoff\n');
      
      const handoff: GuardianAutopilotHandoff = {
        schemaVersion: '1.0.0',
        source: 'odavl-guardian',
        timestamp: new Date().toISOString(),
        issue: {
          type: 'runtime-error',
          rootCause: diagnosis.rootCause,
          isPlatformSpecific: diagnosis.isPlatformSpecific,
          affectedFiles: diagnosis.affectedFiles,
          confidence: diagnosis.confidence,
          severity: criticalIssue.severity
        },
        suggestedFix: diagnosis.suggestedFix,
        reasoning: diagnosis.reasoning,
        nextSteps: [
          '1. Review suggested fix above',
          '2. Run: odavl autopilot run',
          '3. Autopilot will safely apply fixes with O-D-A-V-L cycle',
          '4. Verify with test plan'
        ],
        metadata: {
          guardianVersion: '4.0.0',
          analysisType: 'runtime',
          platform: 'extension',
          os: process.platform
        }
      };
      
      // Validate handoff structure
      if (!isValidHandoff(handoff)) {
        throw new Error('Generated handoff does not match schema!');
      }
      
      // Save handoff file
      const handoffPath = getHandoffFilePath(workspaceRoot);
      await fs.mkdir(path.dirname(handoffPath), { recursive: true });
      await fs.writeFile(
        handoffPath,
        JSON.stringify(handoff, null, 2),
        'utf8'
      );
      
      console.log('✅ Handoff JSON saved:');
      console.log(`  Path: ${handoffPath}`);
      console.log(`  Size: ${JSON.stringify(handoff).length} bytes`);
      console.log(`  Schema: v${handoff.schemaVersion}\n`);
      
      // Display handoff preview
      console.log('📄 Handoff Preview:\n');
      console.log(JSON.stringify(handoff, null, 2).substring(0, 500) + '...\n');
      
    } else {
      console.log('✅ No issues detected! Extension is working perfectly.\n');
    }
    
  } catch (error: any) {
    console.error('\n❌ Guardian workflow failed:');
    console.error(`   ${error.message}\n`);
    if (error.stack) {
      console.error('   Stack trace:');
      console.error(`   ${error.stack}\n`);
    }
  } finally {
    await runtimeTester.cleanup();
  }
  
  // ══════════════════════════════════════════════════════
  // Final Summary
  // ══════════════════════════════════════════════════════
  console.log('═══════════════════════════════════════════════════════');
  console.log('📋 SUMMARY\n');
  console.log('🛡️  Guardian Responsibilities:');
  console.log('   ✅ Detect issues (runtime, visual, performance)');
  console.log('   ✅ Analyze with AI (Claude Vision + Sonnet)');
  console.log('   ✅ Generate fix suggestions');
  console.log('   ✅ Create Autopilot handoff JSON');
  console.log('   ❌ NEVER execute file modifications\n');
  
  console.log('🤖 Autopilot Responsibilities:');
  console.log('   ✅ Read Guardian handoff JSON');
  console.log('   ✅ Execute fixes safely (O-D-A-V-L cycle)');
  console.log('   ✅ Create undo snapshots');
  console.log('   ✅ Verify quality gates');
  console.log('   ✅ Learn from success/failure\n');
  
  console.log('📋 Next Steps:');
  console.log('  1. Review handoff file: cat .odavl/guardian/handoff-to-autopilot.json');
  console.log('  2. Apply fixes safely: odavl autopilot run');
  console.log('  3. Autopilot will:');
  console.log('     - Create undo snapshot');
  console.log('     - Apply suggested fixes');
  console.log('     - Run quality checks (TypeScript, ESLint, tests)');
  console.log('     - Verify improvement');
  console.log('  4. If anything fails: odavl autopilot undo\n');
  
  console.log('═══════════════════════════════════════════════════════\n');
}

// Run complete workflow
runCompleteGuardianWorkflow().catch(console.error);

/**
 * Example Output:
 * 
 * ═══════════════════════════════════════════════════════
 * 🛡️  ODAVL GUARDIAN v4.0 - Complete Workflow
 *    AI-Powered Detection → Autopilot Integration
 * ═══════════════════════════════════════════════════════
 * 
 * [Phase 1] 🤖 Runtime Testing
 * 
 * Testing: C:/project/odavl-studio/insight/extension
 * 
 * 📊 Runtime Test Results:
 *   Success: ❌
 *   Readiness: 70%
 *   Issues Found: 2
 * 
 * ⚠️  Issues Detected:
 * 
 *   1. 🔴 CRITICAL - console-error
 *      Cannot read properties of null (reading 'useContext')
 *      Stack: Error: Cannot read properties of null...
 * 
 *   2. 🟠 HIGH - ui-error
 *      Dashboard panel failed to render
 * 
 * [Phase 2] 👁️  AI Visual Analysis
 * 
 * 📊 Visual Analysis Results:
 *   Dashboard Visible: ❌
 *   Icon Visible: ✅
 *   Layout Correct: ❌
 *   AI Confidence: 92%
 * 
 * ⚠️  Visual Issues:
 *   1. missing-element: Dashboard panel not visible
 * 
 * [Phase 3] 🧠 AI Error Analysis
 * 
 * 📊 AI Diagnosis:
 *   Root Cause: Missing 'use client' directive in React component
 *   Platform Specific: No
 *   Runtime Issue: Yes
 *   Confidence: 95%
 *   Affected Files: 1
 * 
 * 💡 AI Suggested Fixes:
 *   1. MODIFY: src/components/Dashboard.tsx
 *      Add 'use client' directive for Next.js 13+ compatibility
 * 
 * [Phase 4] 📦 Generating Autopilot Handoff
 * 
 * ✅ Handoff JSON saved:
 *   Path: .odavl/guardian/handoff-to-autopilot.json
 *   Size: 1247 bytes
 *   Schema: v1.0.0
 * 
 * ═══════════════════════════════════════════════════════
 * 📋 SUMMARY
 * 
 * 🛡️  Guardian: Detect + Suggest (NEVER execute)
 * 🤖 Autopilot: Execute fixes safely (O-D-A-V-L cycle)
 * 
 * Next: odavl autopilot run
 * ═══════════════════════════════════════════════════════
 */
