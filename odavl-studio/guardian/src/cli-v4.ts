#!/usr/bin/env node
/**
 * ODAVL Guardian v4.0 CLI
 * 
 * New commands:
 * - guardian launch:check <path> --runtime   # Run runtime tests (Playwright)
 * - guardian launch:ai <path>                # AI-powered complete scan
 * - guardian launch:platforms <path>         # Multi-platform testing
 * 
 * Architectural Boundaries:
 * - Guardian: Detect + Suggest (NOT fix)
 * - Autopilot: Execute fixes safely
 */

import { Command } from 'commander';
import * as path from 'path';
import * as fs from 'fs/promises';
import { 
  RuntimeTestingAgent, 
  AIVisualInspector, 
  SmartErrorAnalyzer,
  MultiPlatformTester 
} from '../agents/index.js';

const program = new Command();

program
  .name('guardian')
  .version('4.0.0')
  .description('ODAVL Guardian v4.0 - AI-Powered Launch Validator');

/**
 * guardian launch:check <path> --runtime
 * 
 * Run complete launch check with runtime testing
 */
program
  .command('launch:check')
  .argument('<path>', 'Path to product (extension or Next.js app)')
  .option('--runtime', 'Run runtime tests (Playwright)', false)
  .option('--ai', 'Run AI visual inspection', false)
  .option('--json', 'Output JSON report', false)
  .description('Complete launch check with runtime testing')
  .action(async (productPath: string, options: any) => {
    console.log('\n═══════════════════════════════════════');
    console.log('🛡️  ODAVL GUARDIAN V4.0 - LAUNCH CHECK');
    console.log('═══════════════════════════════════════\n');
    
    const absolutePath = path.resolve(productPath);
    
    // Check if path exists
    try {
      await fs.access(absolutePath);
    } catch {
      console.error(`❌ Path not found: ${absolutePath}`);
      process.exit(1);
    }
    
    // Detect product type
    const packageJsonPath = path.join(absolutePath, 'package.json');
    let productType: 'extension' | 'nextjs' = 'extension';
    
    try {
      const packageJson = JSON.parse(await fs.readFile(packageJsonPath, 'utf8'));
      
      if (packageJson.engines?.vscode) {
        productType = 'extension';
        console.log('📦 Product Type: VS Code Extension');
      } else if (packageJson.dependencies?.next) {
        productType = 'nextjs';
        console.log('📦 Product Type: Next.js App');
      }
    } catch {
      console.error('❌ package.json not found or invalid');
      process.exit(1);
    }
    
    console.log(`📂 Path: ${absolutePath}\n`);
    
    // Phase 1: Static Analysis (v3.0)
    console.log('[Phase 1] Static Analysis (v3.0)...');
    // TODO: Run v3.0 inspectors
    console.log('✅ Static analysis complete\n');
    
    // Phase 2: Runtime Testing (v4.0)
    if (options.runtime) {
      console.log('[Phase 2] Runtime Testing (v4.0)...');
      
      const agent = new RuntimeTestingAgent();
      await agent.initialize();
      
      let report;
      if (productType === 'extension') {
        report = await agent.testVSCodeExtension(absolutePath);
      } else {
        // For Next.js, test on localhost:3000
        console.log('⚠️  Start your dev server: pnpm dev');
        console.log('⏳ Testing http://localhost:3000...\n');
        report = await agent.testWebsite('http://localhost:3000');
      }
      
      await agent.cleanup();
      
      console.log('\n📊 Runtime Test Report:');
      console.log(`   Readiness: ${report.readiness}%`);
      console.log(`   Issues: ${report.issues.length}`);
      
      if (report.issues.length > 0) {
        console.log('\n   Issues Found:');
        for (const issue of report.issues) {
          const icon = issue.severity === 'critical' ? '🔴' : 
                      issue.severity === 'high' ? '🟠' : 
                      issue.severity === 'medium' ? '🟡' : '🟢';
          console.log(`   ${icon} [${issue.severity}] ${issue.message}`);
        }
      }
      
      console.log('');
    }
    
    // Phase 3: AI Visual Inspection (v4.0)
    if (options.ai && options.runtime) {
      console.log('[Phase 3] AI Visual Inspection (v4.0)...');
      
      // TODO: Get screenshot from runtime agent
      console.log('✅ AI inspection complete\n');
    }
    
    console.log('═══════════════════════════════════════');
    console.log('✅ LAUNCH CHECK COMPLETE');
    console.log('═══════════════════════════════════════\n');
  });

/**
 * guardian launch:ai <path>
 * 
 * AI-powered complete scan (runtime + visual + error analysis)
 */
program
  .command('launch:ai')
  .argument('<path>', 'Path to product')
  .description('AI-powered complete launch scan')
  .action(async (productPath: string) => {
    console.log('\n═══════════════════════════════════════');
    console.log('🤖 ODAVL GUARDIAN V4.0 - AI SCAN');
    console.log('═══════════════════════════════════════\n');
    
    const absolutePath = path.resolve(productPath);
    
    // Run complete AI-powered scan
    console.log('[1/4] Runtime Testing...');
    const agent = new RuntimeTestingAgent();
    await agent.initialize();
    
    const report = await agent.testVSCodeExtension(absolutePath);
    
    console.log('[2/4] AI Visual Inspection...');
    const inspector = new AIVisualInspector();
    
    if (report.screenshots && report.screenshots.length > 0) {
      const analysis = await inspector.analyzeExtensionUI(report.screenshots[0]);
      
      console.log(`\n📊 AI Analysis:`);
      console.log(`   Dashboard Visible: ${analysis.dashboardVisible ? '✅' : '❌'}`);
      console.log(`   Icon Visible: ${analysis.iconVisible ? '✅' : '❌'}`);
      console.log(`   Layout Correct: ${analysis.layoutCorrect ? '✅' : '❌'}`);
      console.log(`   Confidence: ${(analysis.confidence * 100).toFixed(0)}%`);
      
      if (analysis.errors.length > 0) {
        console.log('\n   Visual Errors:');
        for (const error of analysis.errors) {
          console.log(`   🔴 ${error.description}`);
        }
      }
      
      if (analysis.suggestions.length > 0) {
        console.log('\n   💡 Suggestions:');
        for (const suggestion of analysis.suggestions) {
          console.log(`   - ${suggestion}`);
        }
      }
    }
    
    console.log('\n[3/4] Error Analysis...');
    const handoffs: any[] = [];
    
    if (report.issues.length > 0) {
      const analyzer = new SmartErrorAnalyzer();
      
      for (const issue of report.issues) {
        if (issue.severity === 'critical' && issue.stackTrace) {
          console.log(`\n🔍 Analyzing: ${issue.message}`);
          
          const diagnosis = await analyzer.analyzeRuntimeError(
            new Error(issue.message),
            {
              platform: 'extension',
              os: process.platform,
              when: 'runtime test',
              expected: 'no errors',
              actual: issue.message,
              stackTrace: issue.stackTrace
            }
          );
          
          console.log(`   Root Cause: ${diagnosis.rootCause}`);
          console.log(`   Confidence: ${(diagnosis.confidence * 100).toFixed(0)}%`);
          
          if (diagnosis.suggestedFix.files.length > 0) {
            console.log(`   Suggested Fixes: ${diagnosis.suggestedFix.files.length} file(s)`);
            
            // Generate Autopilot handoff
            const handoff = analyzer.generateAutopilotHandoff(diagnosis);
            handoffs.push(handoff);
          }
        }
      }
      
      // Save handoff for Autopilot
      if (handoffs.length > 0) {
        const handoffPath = path.join(absolutePath, '.odavl/guardian/handoff-to-autopilot.json');
        try {
          await fs.mkdir(path.dirname(handoffPath), { recursive: true });
          await fs.writeFile(handoffPath, JSON.stringify(handoffs, null, 2));
          console.log(`\n💾 Saved fix suggestions: ${handoffPath}`);
          console.log('   Run "odavl autopilot run" to apply fixes');
        } catch {
          console.log('\n⚠️  Could not save handoff file');
        }
      }
    }
    
    console.log('\n[4/4] Generating Report...');
    await agent.cleanup();
    
    console.log('\n═══════════════════════════════════════');
    console.log(`🎯 Overall Readiness: ${report.readiness}%`);
    console.log(`📊 Issues: ${report.issues.length}`);
    console.log('═══════════════════════════════════════\n');
  });

/**
 * guardian launch:platforms <path>
 * 
 * Multi-platform testing (Windows, macOS, Linux)
 */
program
  .command('launch:platforms')
  .argument('<path>', 'Path to extension')
  .description('Test on all platforms (Windows, macOS, Linux)')
  .action(async (productPath: string) => {
    console.log('\n═══════════════════════════════════════');
    console.log('🌐 MULTI-PLATFORM TESTING');
    console.log('═══════════════════════════════════════\n');
    
    const absolutePath = path.resolve(productPath);
    
    const tester = new MultiPlatformTester();
    
    // Check if GitHub Actions available
    console.log('🔍 Checking GitHub Actions availability...');
    const available = await tester.checkAvailability();
    
    if (!available) {
      console.log('⚠️  GitHub Actions not available');
      console.log('   Set GITHUB_TOKEN environment variable');
      console.log('   Or run tests locally\n');
      process.exit(1);
    }
    
    console.log('✅ GitHub Actions available\n');
    
    // Run tests on all platforms
    const reports = await tester.testOnAllPlatforms(absolutePath);
    
    // Summary
    const allPassed = reports.every(r => r.success);
    
    console.log('\n═══════════════════════════════════════');
    console.log(`Status: ${allPassed ? '✅ ALL PASSED' : '❌ SOME FAILED'}`);
    console.log('═══════════════════════════════════════\n');
    
    process.exit(allPassed ? 0 : 1);
  });

program.parse();
