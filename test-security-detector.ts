#!/usr/bin/env tsx
import { SecurityDetector } from './odavl-studio/insight/core/src/detector/index.js';

async function testSecurityDetector() {
  console.log('\n🛡️  Testing ODAVL Insight Security Detector...\n');
  
  const workspacePath = process.cwd();
  const detector = new SecurityDetector(workspacePath);
  
  try {
    const issues = await detector.detect();
    
    console.log(`✅ Security scan completed!`);
    console.log(`📊 Total security issues found: ${issues.length}\n`);
    
    if (issues.length > 0) {
      console.log('=== Security Issues Detected ===');
      issues.forEach((issue, i) => {
        console.log(`\n[${i + 1}] 🚨 ${issue.severity.toUpperCase()}: ${issue.message}`);
        console.log(`   📁 ${issue.file}:${issue.line}:${issue.column}`);
        console.log(`   🏷️  Code: ${issue.code}`);
        if (issue.suggestedFix) {
          console.log(`   💡 Fix: ${issue.suggestedFix}`);
        }
      });
      
      // Stats by severity
      const stats = {
        critical: issues.filter(i => i.severity === 'critical').length,
        high: issues.filter(i => i.severity === 'high').length,
        medium: issues.filter(i => i.severity === 'medium').length,
        low: issues.filter(i => i.severity === 'low').length,
      };
      
      console.log('\n=== Security Summary ===');
      console.log(`🔴 Critical: ${stats.critical}`);
      console.log(`🟠 High: ${stats.high}`);
      console.log(`🟡 Medium: ${stats.medium}`);
      console.log(`🟢 Low: ${stats.low}`);
    } else {
      console.log('✅ No security issues found!');
    }
    
  } catch (error: any) {
    console.error('❌ Error running security detector:', error.message);
    process.exit(1);
  }
}

testSecurityDetector();
