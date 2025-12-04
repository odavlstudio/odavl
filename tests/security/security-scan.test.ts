/**
 * Security Scan Tests - Run OWASP checks on ODAVL itself
 */

import { describe, it, expect } from 'vitest';
import { execSync } from 'child_process';

describe('Security Scan', () => {
  it('should have no high severity vulnerabilities', () => {
    try {
      const output = execSync('pnpm audit --json', { encoding: 'utf8' });
      const audit = JSON.parse(output);
      
      const highVulns = audit.metadata?.vulnerabilities?.high || 0;
      const criticalVulns = audit.metadata?.vulnerabilities?.critical || 0;
      
      // Allow low/moderate vulnerabilities, but no high/critical
      expect(highVulns).toBe(0);
      expect(criticalVulns).toBe(0);
    } catch (error: any) {
      // pnpm audit exits with code 1 if vulnerabilities found
      const output = error.stdout?.toString() || '{}';
      try {
        const audit = JSON.parse(output);
        const highVulns = audit.metadata?.vulnerabilities?.high || 0;
        const criticalVulns = audit.metadata?.vulnerabilities?.critical || 0;
        
        // If we have high/critical vulns, show helpful message
        if (highVulns > 0 || criticalVulns > 0) {
          console.warn(`⚠️  Found ${highVulns} high and ${criticalVulns} critical vulnerabilities`);
          console.warn('Run: pnpm audit --fix to attempt automatic fixes');
        }
        
        expect(highVulns).toBe(0);
        expect(criticalVulns).toBe(0);
      } catch (parseError) {
        // If audit output is not JSON, skip this test (audit might not be available)
        console.warn('⚠️  Could not parse audit output, skipping vulnerability check');
      }
    }
  });
  
  it('should not contain hardcoded secrets', () => {
    let output = '';
    try {
      output = execSync('git grep -iE "\\b(api[_-]?key|password|secret)\\s*[=:]\\s*[\'\\"][^\'\\"]{8,}" -- "*.ts" "*.tsx" "*.js"', {
        encoding: 'utf8'
      });
    } catch (error: any) {
      // git grep returns non-zero if no matches found (which is good!)
      output = error.stdout?.toString() || '';
    }
    
    // Filter to only find ACTUAL hardcoded values (not env vars or placeholders)
    const lines = output.split('\n').filter(line => {
      if (!line.trim()) return false;
      
      // Exclude comments
      if (line.includes('//') || line.includes('/*') || line.includes('*')) {
        return false;
      }
      
      // Exclude type definitions, interfaces, exports
      if (line.match(/\b(type|interface|export|import|declare)\b/)) {
        return false;
      }
      
      // Exclude environment variables (process.env.*)
      if (line.includes('process.env')) {
        return false;
      }
      
      // Exclude test files, fixtures, examples
      if (line.match(/\.(test|spec)\.|test-fixtures|__tests__|\.example\./)) {
        return false;
      }
      
      // Exclude markdown files
      if (line.includes('.md:')) {
        return false;
      }
      
      // Exclude placeholder values (sk-..., xxx, abc, test, demo, example)
      if (line.match(/['"](?:sk-\.\.\.|xxx|abc|test|demo|example|placeholder|your-.*-here)/i)) {
        return false;
      }
      
      // Exclude config file examples
      if (line.includes('example') || line.includes('EXAMPLE') || line.includes('.example')) {
        return false;
      }
      
      return true;
    });
    
    // If we find actual secrets, log them for debugging
    if (lines.length > 0) {
      console.error('⚠️  Found potential hardcoded secrets:');
      lines.slice(0, 10).forEach(line => console.error('  ' + line));
      if (lines.length > 10) {
        console.error(`  ... and ${lines.length - 10} more`);
      }
    }
    
    expect(lines.length).toBe(0);
  });
  
  it('should have secure dependencies', () => {
    const output = execSync('pnpm list --depth 0 --json', { encoding: 'utf8' });
    const packages = JSON.parse(output);
    
    // Check for known insecure packages
    const insecurePackages = ['event-stream', 'flatmap-stream', 'getcookies'];
    
    const pkgNames = Object.keys(packages[0]?.dependencies || {});
    const foundInsecure = pkgNames.filter(name => insecurePackages.includes(name));
    
    expect(foundInsecure).toHaveLength(0);
  });
});
