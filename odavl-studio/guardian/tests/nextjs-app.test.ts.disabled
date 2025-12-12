/**
 * Test: Next.js Application Inspector
 */

import { describe, it, expect } from 'vitest';
import { NextJSAppInspector } from '../inspectors/nextjs-app.js';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

// ESM equivalent of __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

describe('NextJSAppInspector', () => {
  it('should detect studio-hub (Next.js app) issues', async () => {
    const inspector = new NextJSAppInspector();
    // Resolve from project root: odavl-studio/guardian/tests -> apps/studio-hub
    const appPath = join(__dirname, '../../../apps/studio-hub');
    
    console.log(`\n🔍 Testing Next.js app at: ${appPath}`);
    
    const report = await inspector.inspect(appPath);
    
    console.log('\n📊 Inspection Report:');
    console.log(`Product: ${report.productName}`);
    console.log(`Readiness: ${report.readinessScore}%`);
    console.log(`Status: ${report.status}`);
    console.log(`Next.js Version: ${report.metadata?.nextVersion || 'unknown'}`);
    console.log(`\nIssues found: ${report.issues.length}`);
    
    report.issues.forEach((issue, index) => {
      const emoji = issue.severity === 'critical' ? '🔴' : 
                    issue.severity === 'high' ? '🟡' : 
                    issue.severity === 'medium' ? '🔵' : '⚪';
      console.log(`\n${index + 1}. ${emoji} ${issue.message}`);
      console.log(`   Severity: ${issue.severity}`);
      console.log(`   File: ${issue.file || 'N/A'}`);
      console.log(`   Impact: ${issue.impact}`);
      if (issue.autoFixable) {
        console.log(`   ✨ Auto-fixable: ${issue.fix}`);
      }
    });
    
    expect(report).toBeDefined();
    expect(report.productType).toBe('nextjs-app');
    expect(report.readinessScore).toBeGreaterThanOrEqual(0);
    expect(report.readinessScore).toBeLessThanOrEqual(100);
    expect(report.productName).toBeTruthy();
  });
  
  it('should check for critical Next.js configuration issues', async () => {
    const inspector = new NextJSAppInspector();
    const appPath = join(__dirname, '../../../apps/studio-hub');
    
    const report = await inspector.inspect(appPath);
    
    // Check for critical issues
    const criticalIssues = report.issues.filter(i => i.severity === 'critical');
    
    if (criticalIssues.length > 0) {
      console.log('\n🚨 Critical Issues Detected:');
      criticalIssues.forEach(issue => {
        console.log(`   - ${issue.message}`);
      });
    } else {
      console.log('\n✅ No critical issues found!');
    }
    
    // Validate report structure
    expect(report.issues).toBeInstanceOf(Array);
    expect(report.metadata).toBeDefined();
  });
});
