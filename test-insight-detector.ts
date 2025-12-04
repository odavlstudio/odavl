#!/usr/bin/env tsx
import { TSDetector } from './odavl-studio/insight/core/src/detector/index.js';

async function testDetector() {
  console.log('\n🔍 Testing ODAVL Insight TypeScript Detector...\n');
  
  const workspacePath = process.cwd();
  const detector = new TSDetector(workspacePath);
  
  try {
    const issues = await detector.detect();
    
    console.log(`✅ Detector executed successfully!`);
    console.log(`📊 Total issues found: ${issues.length}\n`);
    
    // Show first 5 issues
    console.log('=== Sample Issues ===');
    issues.slice(0, 5).forEach((issue, i) => {
      console.log(`\n[${i + 1}] ${issue.severity.toUpperCase()}: ${issue.message}`);
      console.log(`   📁 ${issue.file}:${issue.line}:${issue.column}`);
      console.log(`   🏷️  Code: ${issue.code}`);
      if (issue.suggestedFix) {
        console.log(`   💡 Fix: ${issue.suggestedFix}`);
      }
    });
    
    // Stats by severity
    const stats = {
      error: issues.filter(i => i.severity === 'error').length,
      warning: issues.filter(i => i.severity === 'warning').length,
    };
    
    console.log('\n=== Severity Breakdown ===');
    console.log(`🔴 Errors: ${stats.error}`);
    console.log(`🟡 Warnings: ${stats.warning}`);
    
  } catch (error) {
    console.error('❌ Error running detector:', error);
    process.exit(1);
  }
}

testDetector();
