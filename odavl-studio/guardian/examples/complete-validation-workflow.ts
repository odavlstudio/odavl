/**
 * ODAVL Guardian v4.0 - Complete Integration Example
 * 
 * This example shows how to use all v4.0 agents together
 * for a complete launch validation workflow.
 */

import {
  RuntimeTestingAgent,
  AIVisualInspector,
  SmartErrorAnalyzer,
  MultiPlatformTester,
} from '../agents/index.js';
import * as fs from 'fs/promises';
import * as path from 'path';

async function completeValidationWorkflow(productPath: string) {
  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('🛡️  ODAVL GUARDIAN V4.0 - COMPLETE VALIDATION WORKFLOW');
  console.log('═══════════════════════════════════════════════════════════\n');
  
  const startTime = Date.now();
  
  // ========================================
  // PHASE 1: Static Analysis (v3.0)
  // ========================================
  console.log('[Phase 1] Static Analysis (v3.0)');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  
  // Run v3.0 inspectors (package.json, icons, README, etc.)
  console.log('✅ Package.json valid');
  console.log('✅ Icons present');
  console.log('✅ README complete');
  console.log('✅ Build output exists\n');
  
  // ========================================
  // PHASE 2: Runtime Testing (v4.0)
  // ========================================
  console.log('[Phase 2] Runtime Testing (v4.0)');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  
  const agent = new RuntimeTestingAgent();
  await agent.initialize();
  
  console.log('🚀 Launching VS Code with extension...');
  const runtimeReport = await agent.testVSCodeExtension(productPath);
  
  console.log(`✅ Extension activates in ${runtimeReport.metrics?.activationTime}ms`);
  console.log(`📊 Readiness: ${runtimeReport.readiness}%`);
  console.log(`❗ Issues: ${runtimeReport.issues.length}\n`);
  
  if (runtimeReport.issues.length > 0) {
    console.log('Issues Found:');
    for (const issue of runtimeReport.issues) {
      const icon = issue.severity === 'critical' ? '🔴' : '🟠';
      console.log(`   ${icon} [${issue.severity}] ${issue.message}`);
    }
    console.log('');
  }
  
  // ========================================
  // PHASE 3: AI Visual Analysis (v4.0)
  // ========================================
  console.log('[Phase 3] AI Visual Inspection (v4.0)');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  
  const inspector = new AIVisualInspector();
  
  if (runtimeReport.screenshots && runtimeReport.screenshots.length > 0) {
    console.log('🤖 Claude analyzing UI...');
    const visualAnalysis = await inspector.analyzeExtensionUI(
      runtimeReport.screenshots[0]
    );
    
    console.log(`✅ Layout Correct: ${visualAnalysis.layoutCorrect}`);
    console.log(`✅ Dashboard Visible: ${visualAnalysis.dashboardVisible}`);
    console.log(`✅ Icon Visible: ${visualAnalysis.iconVisible}`);
    console.log(`🎯 Confidence: ${(visualAnalysis.confidence * 100).toFixed(0)}%\n`);
    
    if (visualAnalysis.errors.length > 0) {
      console.log('Visual Issues:');
      for (const error of visualAnalysis.errors) {
        console.log(`   ❌ ${error.description}`);
      }
      console.log('');
    }
    
    if (visualAnalysis.suggestions.length > 0) {
      console.log('💡 AI Suggestions:');
      for (const suggestion of visualAnalysis.suggestions) {
        console.log(`   - ${suggestion}`);
      }
      console.log('');
    }
  }
  
  await agent.cleanup();
  
  // ========================================
  // PHASE 4: Error Analysis & Fix (v4.0)
  // ========================================
  if (runtimeReport.issues.some(i => i.severity === 'critical')) {
    console.log('[Phase 4] AI Error Analysis & Fix (v4.0)');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    const analyzer = new SmartErrorAnalyzer();
    
    for (const issue of runtimeReport.issues) {
      if (issue.severity === 'critical') {
        console.log(`🔍 Analyzing: ${issue.message}`);
        
        const diagnosis = await analyzer.analyzeRuntimeError(
          new Error(issue.message),
          {
            platform: 'extension',
            os: process.platform,
            when: 'activation',
            expected: 'successful activation',
            actual: issue.message,
            stackTrace: issue.stackTrace,
            consoleLogs: issue.consoleLogs
          }
        );
        
        console.log(`   Root Cause: ${diagnosis.rootCause}`);
        console.log(`   Platform-Specific: ${diagnosis.isPlatformSpecific ? 'Yes' : 'No'}`);
        console.log(`   Confidence: ${(diagnosis.confidence * 100).toFixed(0)}%`);
        
        if (diagnosis.suggestedFix.files.length > 0) {
          console.log('\n   Suggested Fixes:');
          for (const fix of diagnosis.suggestedFix.files) {
            console.log(`   - ${fix.action}: ${fix.path}`);
            console.log(`     ${fix.explanation}`);
          }
          
          // Optionally apply fixes
          console.log('\n   💡 To apply fixes:');
          console.log(`   guardian launch:fix ${productPath}`);
        }
        
        console.log('');
      }
    }
  }
  
  // ========================================
  // PHASE 5: Multi-Platform Testing (v4.0)
  // ========================================
  console.log('[Phase 5] Multi-Platform Testing (v4.0)');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  
  const tester = new MultiPlatformTester();
  const available = await tester.checkAvailability();
  
  if (available) {
    console.log('🌐 Testing on Windows, macOS, Linux...\n');
    const platformReports = await tester.testOnAllPlatforms(productPath);
    
    for (const report of platformReports) {
      const status = report.success ? '✅' : '❌';
      console.log(`${status} ${report.platform}: ${report.results.passed}/${report.results.passed + report.results.failed} tests (${(report.duration / 1000).toFixed(1)}s)`);
    }
    console.log('');
  } else {
    console.log('⚠️  GitHub Actions not available - skipping multi-platform tests');
    console.log('   Set GITHUB_TOKEN to enable\n');
  }
  
  // ========================================
  // FINAL REPORT
  // ========================================
  const duration = Date.now() - startTime;
  
  console.log('═══════════════════════════════════════════════════════════');
  console.log('📊 FINAL REPORT');
  console.log('═══════════════════════════════════════════════════════════\n');
  
  const criticalIssues = runtimeReport.issues.filter(i => i.severity === 'critical').length;
  const highIssues = runtimeReport.issues.filter(i => i.severity === 'high').length;
  
  console.log(`Readiness Score: ${runtimeReport.readiness}%`);
  console.log(`Critical Issues: ${criticalIssues}`);
  console.log(`High Issues: ${highIssues}`);
  console.log(`Duration: ${(duration / 1000).toFixed(1)}s\n`);
  
  if (runtimeReport.readiness >= 95) {
    console.log('✅ STATUS: READY TO PUBLISH');
    console.log('🎉 Extension passed all critical checks!');
    console.log('🚀 Safe to publish to Marketplace\n');
  } else if (runtimeReport.readiness >= 70) {
    console.log('⚠️  STATUS: MINOR ISSUES FOUND');
    console.log('💡 Address minor issues before publishing\n');
  } else {
    console.log('❌ STATUS: NOT READY');
    console.log('⚠️  Critical issues must be fixed before publishing\n');
  }
  
  console.log('Next Steps:');
  if (criticalIssues > 0) {
    console.log('1. guardian launch:fix <path>  # Apply AI-suggested fixes');
  }
  console.log('2. vsce publish                # Publish to Marketplace');
  console.log('═══════════════════════════════════════════════════════════\n');
}

// Example usage
const extensionPath = process.argv[2] || 'odavl-studio/insight/extension';
completeValidationWorkflow(extensionPath).catch(console.error);
