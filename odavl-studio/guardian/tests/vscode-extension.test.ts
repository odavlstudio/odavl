/**
 * Test: VS Code Extension Inspector
 */

import { describe, it, expect } from 'vitest';
import { VSCodeExtensionInspector } from '../inspectors/vscode-extension.js';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

// ESM equivalent of __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

describe('VSCodeExtensionInspector', () => {
  it('should detect ODAVL Insight Extension issues', async () => {
    const inspector = new VSCodeExtensionInspector();
    // Resolve from project root: odavl-studio/guardian/tests -> odavl-studio/insight/extension
    const extensionPath = join(__dirname, '../../insight/extension');
    
    console.log(`🔍 Testing extension at: ${extensionPath}`);
    console.log(`📁 __dirname: ${__dirname}`);
    
    const report = await inspector.inspect(extensionPath);
    
    console.log('\n🔍 Inspection Report:');
    console.log(`Product: ${report.productName}`);
    console.log(`Readiness: ${report.readinessScore}%`);
    console.log(`Status: ${report.status}`);
    console.log(`\nIssues found: ${report.issues.length}`);
    
    report.issues.forEach((issue, index) => {
      const emoji = issue.severity === 'critical' ? '🔴' : 
                    issue.severity === 'high' ? '🟡' : 
                    issue.severity === 'medium' ? '🔵' : '⚪';
      console.log(`\n${index + 1}. ${emoji} ${issue.message}`);
      console.log(`   File: ${issue.file || 'N/A'}`);
      console.log(`   Impact: ${issue.impact}`);
      if (issue.autoFixable) {
        console.log(`   ✨ Auto-fixable: ${issue.fix}`);
      }
    });
    
    expect(report).toBeDefined();
    expect(report.productType).toBe('vscode-extension');
    expect(report.readinessScore).toBeGreaterThanOrEqual(0);
    expect(report.readinessScore).toBeLessThanOrEqual(100);
  });
});
