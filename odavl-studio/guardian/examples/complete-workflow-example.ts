/**
 * ODAVL Guardian v4.0 - Complete 4-Phase Workflow Example
 * 
 * ⚠️ DEPRECATED - BOUNDARY VIOLATION
 * This example violated Guardian boundaries (code analysis + fixing).
 * Guardian = Website Testing ONLY.
 * 
 * TODO: Refactor to website testing workflow or remove.
 */

// ❌ REMOVED: handoff-schema.ts violated Guardian boundaries
// import { GuardianAutopilotHandoff } from '../lib/handoff-schema.js';
import * as fs from 'fs/promises';
import * as path from 'path';

/**
 * Mock Phase 1: Runtime Testing
 * In production, this uses Playwright to test VS Code extension
 */
async function phase1_runtimeTesting(extensionPath: string) {
  console.log('\n═══════════════════════════════════════════════════════');
  console.log('📋 PHASE 1: Runtime Testing');
  console.log('═══════════════════════════════════════════════════════');
  console.log(`Extension Path: ${extensionPath}\n`);

  // Mock: In production, RuntimeTestingAgent.testVSCodeExtension()
  console.log('🚀 Launching VS Code with extension...');
  console.log('⏱️  Measuring activation time...');
  console.log('📸 Taking screenshots...');
  console.log('🔍 Checking console errors...\n');

  const runtimeReport = {
    success: false,
    readiness: 60,
    issues: [
      {
        type: 'console-error' as const,
        severity: 'critical' as const,
        message: 'Uncaught TypeError: Cannot read properties of null (reading \'useContext\')',
        stackTrace: `Error: Cannot read properties of null (reading 'useContext')
    at Dashboard.render (Dashboard.tsx:15:25)
    at activate (extension.ts:42:10)
    at Promise (extension.ts:38:5)`,
        consoleLogs: [
          'ERROR: Failed to initialize dashboard',
          'ERROR: useContext called outside provider',
          'Warning: React hydration error'
        ],
        screenshot: Buffer.from('mock-screenshot-data')
      }
    ],
    screenshots: [Buffer.from('dashboard-error-screenshot')],
    metrics: {
      activationTime: 2150, // ms - should be <200ms
      memoryUsage: 85.5, // MB
      cpuUsage: 12.3 // %
    }
  };

  console.log('❌ Runtime Testing Results:');
  console.log(`   Success: ${runtimeReport.success}`);
  console.log(`   Readiness: ${runtimeReport.readiness}%`);
  console.log(`   Issues Found: ${runtimeReport.issues.length}`);
  console.log(`   Activation Time: ${runtimeReport.metrics?.activationTime}ms (⚠️  should be <200ms)`);
  console.log(`\n🔴 Critical Issue Detected:`);
  console.log(`   ${runtimeReport.issues[0].message}`);
  console.log(`\n   Stack Trace:`);
  runtimeReport.issues[0].stackTrace?.split('\n').forEach(line => {
    console.log(`   ${line}`);
  });

  return runtimeReport;
}

/**
 * Mock Phase 2: Visual Inspection
 * In production, this uses Claude Vision API to analyze screenshots
 */
async function phase2_visualInspection(screenshot: Buffer) {
  console.log('\n═══════════════════════════════════════════════════════');
  console.log('👁️  PHASE 2: Visual Inspection (AI)');
  console.log('═══════════════════════════════════════════════════════');
  console.log('🤖 Analyzing screenshot with Claude Vision API...\n');

  // Mock: In production, AIVisualInspector.analyzeExtensionUI()
  const visualAnalysis = {
    dashboardVisible: false,
    iconVisible: true,
    layoutCorrect: false,
    errors: [
      {
        type: 'missing-element' as const,
        severity: 'critical' as const,
        description: 'Dashboard panel failed to render after clicking activity bar icon',
        location: 'Main webview content area'
      },
      {
        type: 'broken-layout' as const,
        severity: 'high' as const,
        description: 'Error boundary displayed instead of dashboard UI',
        location: 'Webview panel'
      }
    ],
    suggestions: [
      'Check React hydration errors in console',
      'Verify webview registration in extension.ts',
      'Ensure "use client" directive present in Next.js components'
    ],
    confidence: 0.88
  };

  console.log('🔍 Visual Analysis Results:');
  console.log(`   Dashboard Visible: ${visualAnalysis.dashboardVisible ? '✅' : '❌'}`);
  console.log(`   Icon Visible: ${visualAnalysis.iconVisible ? '✅' : '❌'}`);
  console.log(`   Layout Correct: ${visualAnalysis.layoutCorrect ? '✅' : '❌'}`);
  console.log(`   AI Confidence: ${(visualAnalysis.confidence * 100).toFixed(0)}%\n`);

  console.log('⚠️  Visual Errors Detected:');
  visualAnalysis.errors.forEach((err, i) => {
    console.log(`   ${i + 1}. [${err.severity.toUpperCase()}] ${err.description}`);
    console.log(`      Location: ${err.location}`);
  });

  console.log('\n💡 AI Suggestions:');
  visualAnalysis.suggestions.forEach((s, i) => {
    console.log(`   ${i + 1}. ${s}`);
  });

  return visualAnalysis;
}

/**
 * Mock Phase 3: AI Error Analysis
 * In production, this uses Claude Sonnet to analyze root cause
 */
async function phase3_errorAnalysis(
  runtimeError: any,
  visualErrors: any[]
) {
  console.log('\n═══════════════════════════════════════════════════════');
  console.log('🧠 PHASE 3: AI Error Analysis');
  console.log('═══════════════════════════════════════════════════════');
  console.log('🤖 Analyzing with Claude Sonnet for root cause...\n');

  // Mock: In production, SmartErrorAnalyzer.analyzeRuntimeError()
  const diagnosis = {
    rootCause: `React useContext hook called outside of provider context. This is a Next.js 13+ 
client component error. The Dashboard component uses useContext but is missing the 
"use client" directive, causing it to render as server component where hooks are not available.`,
    
    isPlatformSpecific: false,
    isRuntimeIssue: true,
    
    affectedFiles: [
      'src/components/Dashboard.tsx',
      'src/extension.ts'
    ],
    
    suggestedFix: {
      files: [
        {
          path: 'src/components/Dashboard.tsx',
          action: 'modify' as const,
          before: `import React from 'react';
import { useContext } from 'react';

export default function Dashboard() {
  const theme = useContext(ThemeContext);`,
          
          after: `'use client';

import React from 'react';
import { useContext } from 'react';

export default function Dashboard() {
  const theme = useContext(ThemeContext);`,
          
          explanation: 'Add "use client" directive at the top of the file to mark this as a client component that can use React hooks'
        },
        {
          path: 'src/extension.ts',
          action: 'modify' as const,
          before: `// Immediately render dashboard
panel.webview.html = getDashboardHtml();`,
          
          after: `// Wait for React hydration
await new Promise(resolve => setTimeout(resolve, 100));
panel.webview.html = getDashboardHtml();`,
          
          explanation: 'Add small delay to allow React client components to hydrate properly before rendering'
        }
      ],
      testPlan: [
        'Rebuild extension with: pnpm build',
        'Reload VS Code window (Cmd+R or Ctrl+R)',
        'Click ODAVL activity bar icon',
        'Verify dashboard appears without errors',
        'Check console for "useContext" errors (should be none)',
        'Test theme context functionality'
      ],
      verificationSteps: [
        'Console should have no React errors',
        'Dashboard should render correctly',
        'Theme context should work (test theme switcher)',
        'No "useContext called outside provider" error'
      ]
    },
    
    confidence: 0.92,
    
    reasoning: `Analysis:
1. Error message: "Cannot read properties of null (reading 'useContext')"
2. Stack trace points to Dashboard.tsx:15 (useContext call)
3. Visual analysis confirms dashboard not rendering
4. Console logs show "useContext called outside provider"

Root Cause:
This is a classic Next.js 13+ client component error. When using App Router, 
components are server components by default. The useContext hook ONLY works in 
client components. Missing "use client" directive causes this error.

Why Two Fixes:
1. "use client" directive: Marks Dashboard as client component
2. Hydration delay: Ensures React has time to set up context providers before render

Confidence: 92% (high) - This is a well-documented Next.js pattern.`
  };

  console.log('🎯 Root Cause Analysis:');
  console.log(diagnosis.rootCause);
  
  console.log('\n📁 Affected Files:');
  diagnosis.affectedFiles.forEach(file => {
    console.log(`   • ${file}`);
  });

  console.log('\n🔧 Suggested Fixes:');
  diagnosis.suggestedFix.files.forEach((fix, i) => {
    console.log(`\n   ${i + 1}. ${fix.path} (${fix.action})`);
    console.log(`      ${fix.explanation}`);
  });

  console.log(`\n📊 AI Confidence: ${(diagnosis.confidence * 100).toFixed(0)}%`);

  return diagnosis;
}

/**
 * Phase 4: Generate Handoff for Autopilot
 */
async function phase4_generateHandoff(
  runtimeReport: any,
  visualAnalysis: any,
  diagnosis: any
): Promise<GuardianAutopilotHandoff> {
  console.log('\n═══════════════════════════════════════════════════════');
  console.log('📝 PHASE 4: Handoff Generation');
  console.log('═══════════════════════════════════════════════════════');
  console.log('📦 Creating Guardian → Autopilot handoff package...\n');

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
      severity: 'critical'
    },
    
    suggestedFix: diagnosis.suggestedFix,
    reasoning: diagnosis.reasoning,
    
    nextSteps: [
      '1. Review the suggested fixes carefully',
      '2. Verify the fix makes sense for your use case',
      '3. Run: odavl autopilot run',
      '4. Autopilot will safely apply fixes with O-D-A-V-L cycle',
      '5. Verify with test plan above',
      '6. Rollback if needed: odavl autopilot undo'
    ],
    
    metadata: {
      guardianVersion: '4.0.0',
      analysisType: 'runtime',
      platform: 'Windows 11',
      os: 'Windows'
    }
  };

  // Save handoff
  const handoffPath = '.odavl/guardian/handoff-to-autopilot.json';
  await fs.mkdir('.odavl/guardian', { recursive: true });
  await fs.writeFile(
    handoffPath,
    JSON.stringify(handoff, null, 2),
    'utf8'
  );

  console.log('✅ Handoff Created Successfully!');
  console.log(`   Saved to: ${handoffPath}`);
  console.log(`   Schema Version: ${handoff.schemaVersion}`);
  console.log(`   Issue Type: ${handoff.issue.type}`);
  console.log(`   Confidence: ${(handoff.issue.confidence * 100).toFixed(0)}%`);
  console.log(`   Files to Modify: ${handoff.suggestedFix.files.length}`);

  return handoff;
}

/**
 * Display final summary and next steps
 */
function displaySummary(handoff: GuardianAutopilotHandoff) {
  console.log('\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📊 GUARDIAN v4.0 - COMPLETE ANALYSIS SUMMARY');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  console.log('🔍 Detection Results:');
  console.log(`   ✅ Phase 1: Runtime Testing (Playwright)`);
  console.log(`   ✅ Phase 2: Visual Inspection (Claude Vision)`);
  console.log(`   ✅ Phase 3: Error Analysis (Claude Sonnet)`);
  console.log(`   ✅ Phase 4: Handoff Generation\n`);

  console.log('🎯 Issue Summary:');
  console.log(`   Type: ${handoff.issue.type}`);
  console.log(`   Severity: ${handoff.issue.severity}`);
  console.log(`   Root Cause: ${handoff.issue.rootCause.substring(0, 80)}...`);
  console.log(`   Confidence: ${(handoff.issue.confidence * 100).toFixed(0)}%`);
  console.log(`   Platform-Specific: ${handoff.issue.isPlatformSpecific ? 'Yes' : 'No'}\n`);

  console.log('🔧 Suggested Fixes:');
  handoff.suggestedFix.files.forEach((fix, i) => {
    console.log(`   ${i + 1}. ${fix.path} (${fix.action})`);
  });

  console.log('\n📋 Next Steps:');
  handoff.nextSteps.forEach((step, i) => {
    console.log(`   ${step}`);
  });

  console.log('\n🛡️  Guardian v4.0 - Detection Complete');
  console.log('   Guardian detected issues and generated fix suggestions.');
  console.log('   Use ODAVL Autopilot to apply fixes safely.\n');

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🚀 Ready for Autopilot Execution');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  console.log('To apply fixes:');
  console.log('   $ cd odavl-studio/insight/extension');
  console.log('   $ odavl autopilot run\n');

  console.log('To rollback if needed:');
  console.log('   $ odavl autopilot undo\n');

  console.log('To view handoff:');
  console.log('   $ cat .odavl/guardian/handoff-to-autopilot.json\n');
}

/**
 * Main workflow
 */
async function main() {
  console.log('\n🤖 ODAVL Guardian v4.0 - Complete 4-Phase Workflow Demo');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('Simulating full detection pipeline for VS Code extension\n');

  try {
    const extensionPath = '../insight/extension';

    // Phase 1: Runtime Testing
    const runtimeReport = await phase1_runtimeTesting(extensionPath);

    // Phase 2: Visual Inspection
    const screenshot = runtimeReport.screenshots?.[0] || Buffer.from('');
    const visualAnalysis = await phase2_visualInspection(screenshot);

    // Phase 3: AI Error Analysis
    const diagnosis = await phase3_errorAnalysis(
      runtimeReport.issues[0],
      visualAnalysis.errors
    );

    // Phase 4: Generate Handoff
    const handoff = await phase4_generateHandoff(
      runtimeReport,
      visualAnalysis,
      diagnosis
    );

    // Display Summary
    displaySummary(handoff);

  } catch (error) {
    console.error('\n❌ Error during workflow execution:');
    console.error(error);
    process.exit(1);
  }
}

// Run workflow
main().catch(console.error);
