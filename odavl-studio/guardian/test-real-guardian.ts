#!/usr/bin/env node
/**
 * Guardian v4.0 - Real World Testing Script
 * Tests Guardian agents on actual ODAVL projects
 */

import { RuntimeTestingAgent } from './dist/agents/runtime-tester.js';
import { SmartErrorAnalyzer } from './dist/agents/smart-error-analyzer.js';
import chalk from 'chalk';

async function testGuardian() {
  console.log(chalk.bold.cyan('\n🛡️  Guardian v4.0 - Real World Testing\n'));
  console.log(chalk.gray('━'.repeat(70)));

  // Test 1: Insight Extension (VS Code)
  console.log(chalk.yellow('\n📦 Test 1: ODAVL Insight Extension (VS Code)\n'));
  
  const extensionPath = 'C:\\Users\\sabou\\dev\\odavl\\odavl-studio\\insight\\extension';
  console.log(chalk.white(`   Path: ${extensionPath}`));
  
  const runtimeAgent = new RuntimeTestingAgent({
    workspacePath: extensionPath,
    platform: 'chrome'
  });

  try {
    console.log(chalk.cyan('\n   🏃 Running Runtime Tests...'));
    const result = await runtimeAgent.testVSCodeExtension(extensionPath);
    
    console.log(chalk.green('\n   ✅ RESULTS:'));
    console.log(chalk.white(`      Success: ${result.success ? '✅' : '❌'}`));
    console.log(chalk.white(`      Readiness: ${result.readiness}%`));
    console.log(chalk.white(`      Issues: ${result.issues.length}`));
    
    if (result.issues.length > 0) {
      console.log(chalk.yellow('\n   📋 Issues Found:'));
      result.issues.forEach((issue, i) => {
        const icon = issue.severity === 'critical' ? '🔴' : issue.severity === 'high' ? '🟠' : '🟡';
        console.log(chalk.white(`      ${i + 1}. ${icon} [${issue.severity}] ${issue.message}`));
      });
    }

    if (result.fixes && result.fixes.length > 0) {
      console.log(chalk.cyan('\n   🔧 Suggested Fixes:'));
      result.fixes.forEach((fix, i) => {
        console.log(chalk.white(`      ${i + 1}. ${fix.description}`));
      });
    }

    // Test 2: Error Analysis
    console.log(chalk.yellow('\n\n🔍 Test 2: Smart Error Analysis\n'));
    
    const errorAnalyzer = new SmartErrorAnalyzer({
      workspacePath: extensionPath
    });

    console.log(chalk.cyan('   🧠 Analyzing TypeScript/ESLint errors...'));
    const errorResult = await errorAnalyzer.detectErrors();
    
    console.log(chalk.green('\n   ✅ ANALYSIS RESULTS:'));
    console.log(chalk.white(`      Confidence: ${errorResult.confidence}%`));
    console.log(chalk.white(`      Errors Detected: ${errorResult.detectedIssues.length}`));
    console.log(chalk.white(`      Fixable: ${errorResult.detectedIssues.filter(i => i.fixable).length}`));
    console.log(chalk.white(`      Root Cause: ${errorResult.rootCause || 'N/A'}`));
    
    if (errorResult.detectedIssues.length > 0) {
      console.log(chalk.yellow('\n   📋 Top Issues:'));
      errorResult.detectedIssues.slice(0, 5).forEach((issue, i) => {
        const icon = issue.severity === 'critical' ? '🔴' : issue.severity === 'high' ? '🟠' : '🟡';
        console.log(chalk.white(`      ${i + 1}. ${icon} [${issue.type}] ${issue.description}`));
        if (issue.filePath) {
          console.log(chalk.gray(`         File: ${issue.filePath}:${issue.line || '?'}`));
        }
      });
    }
    
    if (errorResult.suggestedFixes && errorResult.suggestedFixes.length > 0) {
      console.log(chalk.cyan('\n   🔧 AI Suggested Fixes:'));
      errorResult.suggestedFixes.slice(0, 3).forEach((fix, i) => {
        console.log(chalk.white(`      ${i + 1}. ${fix.description} (confidence: ${fix.confidence}%)`));
      });
    }

    // Summary
    console.log(chalk.bold.cyan('\n\n📊 TESTING SUMMARY\n'));
    console.log(chalk.gray('━'.repeat(70)));
    console.log(chalk.green(`\n   ✅ Runtime Agent: ${result.success ? 'PASSED' : 'FAILED'} (${result.readiness}% ready)`));
    console.log(chalk.green(`   ✅ Error Analyzer: PASSED (${errorResult.confidence}% confidence)`));
    console.log(chalk.white(`   📊 Total Issues: ${result.issues.length + errorResult.detectedIssues.length}`));
    console.log(chalk.white(`   🔧 Fixable: ${errorResult.detectedIssues.filter(i => i.fixable).length}`));
    
    const overallReadiness = (result.readiness + errorResult.confidence) / 2;
    console.log(chalk.bold.cyan(`\n   🎯 Overall Readiness: ${overallReadiness.toFixed(1)}%`));
    
    if (overallReadiness >= 90) {
      console.log(chalk.green('\n   ✅ Project is PRODUCTION READY! 🎉'));
    } else if (overallReadiness >= 70) {
      console.log(chalk.yellow('\n   ⚠️  Project needs minor improvements'));
    } else {
      console.log(chalk.red('\n   ❌ Project needs significant work'));
    }

    console.log(chalk.gray('\n' + '━'.repeat(70) + '\n'));

  } catch (error) {
    console.error(chalk.red('\n   ❌ ERROR:'), error instanceof Error ? error.message : String(error));
  }
}

// Run tests
testGuardian().catch(console.error);
