/**
 * E2E Test: Full Plugin Workflow
 * Install → Analyze → View Results
 */

import { describe, it, expect } from 'vitest';
import { execSync } from 'child_process';
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';

describe('E2E: Plugin Workflow', () => {
  const testDir = join(__dirname, '../fixtures/test-project');
  
  it('should complete full plugin workflow', () => {
    // 1. Search plugins
    const searchOutput = execSync('odavl plugin search react', { 
      cwd: testDir,
      encoding: 'utf8' 
    });
    expect(searchOutput).toContain('React Best Practices');
    
    // 2. Install plugin
    execSync('odavl plugin install odavl-react-best-practices', { cwd: testDir });
    
    const installedFile = join(process.env.HOME!, '.odavl/installed-plugins.json');
    expect(existsSync(installedFile)).toBe(true);
    
    const installed = JSON.parse(readFileSync(installedFile, 'utf8'));
    expect(installed.some((p: any) => p.id === 'odavl-react-best-practices')).toBe(true);
    
    // 3. Analyze code
    const analyzeOutput = execSync('odavl insight analyze', {
      cwd: testDir,
      encoding: 'utf8'
    });
    expect(analyzeOutput).toContain('issues found');
  });
});
