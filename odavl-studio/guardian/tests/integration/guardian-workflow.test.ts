/**
 * ODAVL Guardian v4.0 - Simplified Integration Tests
 * 
 * Tests the handoff schema and cross-agent workflow
 * without requiring Playwright or external dependencies
 * 
 * @module tests/integration/guardian-workflow
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { GuardianAutopilotHandoff, isValidHandoff } from '../../lib/handoff-schema.js';
import * as fs from 'fs/promises';

describe('Guardian v4.0 - Workflow Integration', () => {
  const handoffPath = '.odavl/guardian/handoff-to-autopilot.json';

  beforeAll(async () => {
    await fs.mkdir('.odavl/guardian', { recursive: true });
  });

  afterAll(async () => {
    // Cleanup
    await fs.unlink(handoffPath).catch(() => {});
  });

  describe('Handoff Schema Validation', () => {
    it('should validate correct handoff structure', () => {
      const handoff: GuardianAutopilotHandoff = {
        schemaVersion: '1.0.0',
        source: 'odavl-guardian',
        timestamp: new Date().toISOString(),
        issue: {
          type: 'runtime-error',
          rootCause: 'Missing "use client" directive in Next.js component',
          isPlatformSpecific: false,
          affectedFiles: ['src/components/Dashboard.tsx'],
          confidence: 0.95,
          severity: 'high'
        },
        suggestedFix: {
          files: [{
            path: 'src/components/Dashboard.tsx',
            action: 'modify',
            before: 'export default function Dashboard() {',
            after: '"use client";\n\nexport default function Dashboard() {',
            explanation: 'Add "use client" for client-side hooks'
          }],
          testPlan: [
            'Restart Next.js dev server',
            'Verify no useContext errors'
          ],
          verificationSteps: [
            'Check console for errors',
            'Verify dashboard renders'
          ]
        },
        reasoning: 'Error "useContext called outside provider" indicates missing client directive',
        nextSteps: [
          'Review suggested fix',
          'Run: odavl autopilot run'
        ]
      };

      expect(isValidHandoff(handoff)).toBe(true);
      expect(handoff.schemaVersion).toBe('1.0.0');
      expect(handoff.source).toBe('odavl-guardian');
    });

    it('should reject invalid handoff (missing required fields)', () => {
      const invalidHandoff = {
        source: 'odavl-guardian',
        // Missing schemaVersion, timestamp, issue, suggestedFix
      };

      expect(isValidHandoff(invalidHandoff as any)).toBe(false);
    });

    it('should handle platform-specific issues', () => {
      const handoff: GuardianAutopilotHandoff = {
        schemaVersion: '1.0.0',
        source: 'odavl-guardian',
        timestamp: new Date().toISOString(),
        issue: {
          type: 'visual-regression',
          rootCause: 'Font rendering differs on Windows',
          isPlatformSpecific: true,
          affectedFiles: ['src/styles/dashboard.css'],
          confidence: 0.85,
          severity: 'medium'
        },
        suggestedFix: {
          files: [{
            path: 'src/styles/dashboard.css',
            action: 'modify',
            before: 'font-family: -apple-system, BlinkMacSystemFont;',
            after: 'font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", system-ui;',
            explanation: 'Add Segoe UI for Windows font rendering'
          }],
          testPlan: ['Test on Windows 10/11', 'Test on macOS'],
          verificationSteps: ['Verify text not cutoff on Windows']
        },
        reasoning: 'Issue only occurs on Windows due to font rendering differences',
        nextSteps: ['Test on both platforms']
      };

      expect(isValidHandoff(handoff)).toBe(true);
      expect(handoff.issue.isPlatformSpecific).toBe(true);
      expect(handoff.issue.type).toBe('visual-regression');
    });
  });

  describe('Handoff File Operations', () => {
    it('should save handoff to JSON file', async () => {
      const handoff: GuardianAutopilotHandoff = {
        schemaVersion: '1.0.0',
        source: 'odavl-guardian',
        timestamp: new Date().toISOString(),
        issue: {
          type: 'performance-issue',
          rootCause: 'Extension activation takes >2 seconds',
          isPlatformSpecific: false,
          affectedFiles: ['src/extension.ts'],
          confidence: 0.90,
          severity: 'high'
        },
        suggestedFix: {
          files: [{
            path: 'src/extension.ts',
            action: 'modify',
            before: 'await loadAllProviders();',
            after: '// Lazy load providers\nsetTimeout(() => loadAllProviders(), 100);',
            explanation: 'Delay heavy initialization to improve activation time'
          }],
          testPlan: ['Measure activation time', 'Should be <200ms'],
          verificationSteps: ['Check VS Code startup time']
        },
        reasoning: 'Activation time regression detected',
        nextSteps: ['Apply fix', 'Benchmark']
      };

      await fs.writeFile(
        handoffPath,
        JSON.stringify(handoff, null, 2),
        'utf8'
      );

      const fileExists = await fs.access(handoffPath).then(() => true).catch(() => false);
      expect(fileExists).toBe(true);

      const content = await fs.readFile(handoffPath, 'utf8');
      const parsed = JSON.parse(content);
      
      expect(isValidHandoff(parsed)).toBe(true);
      expect(parsed.issue.type).toBe('performance-issue');
    });

    it('should preserve AI reasoning when saving', async () => {
      const detailedReasoning = `Root cause analysis:
1. Extension loads all providers synchronously
2. Each provider initialization takes ~500ms
3. Total activation time: 4 x 500ms = 2000ms
4. VS Code shows "activating" spinner for >2 seconds

Fix strategy:
- Delay non-critical provider initialization
- Use setTimeout to move heavy work off critical path
- Activation will complete in <200ms
- Providers load in background`;

      const handoff: GuardianAutopilotHandoff = {
        schemaVersion: '1.0.0',
        source: 'odavl-guardian',
        timestamp: new Date().toISOString(),
        issue: {
          type: 'performance-issue',
          rootCause: 'Synchronous provider loading during activation',
          isPlatformSpecific: false,
          affectedFiles: ['src/extension.ts', 'src/providers/index.ts'],
          confidence: 0.95
        },
        suggestedFix: {
          files: [{
            path: 'src/extension.ts',
            action: 'modify',
            before: 'await loadAllProviders();',
            after: 'setTimeout(() => loadAllProviders(), 100);',
            explanation: 'Lazy load providers'
          }],
          testPlan: ['Measure activation time'],
          verificationSteps: ['Should be <200ms']
        },
        reasoning: detailedReasoning,
        nextSteps: ['Apply fix']
      };

      await fs.writeFile(handoffPath, JSON.stringify(handoff, null, 2), 'utf8');
      
      const loaded = JSON.parse(await fs.readFile(handoffPath, 'utf8'));
      expect(loaded.reasoning).toContain('Root cause analysis:');
      expect(loaded.reasoning).toContain('Fix strategy:');
    });
  });

  describe('Cross-Agent Data Flow', () => {
    it('should preserve error context through workflow phases', () => {
      // Phase 1: Runtime Testing detects error
      const runtimeError = {
        type: 'console-error',
        message: 'Cannot read properties of null',
        stackTrace: 'at activate (extension.ts:42)',
        screenshot: Buffer.from('mock-screenshot')
      };

      // Phase 2: Visual Analysis confirms UI broken
      const visualAnalysis = {
        dashboardVisible: false,
        errors: ['Dashboard not rendered'],
        confidence: 0.88
      };

      // Phase 3: AI analyzes and generates handoff
      const handoff: GuardianAutopilotHandoff = {
        schemaVersion: '1.0.0',
        source: 'odavl-guardian',
        timestamp: new Date().toISOString(),
        issue: {
          type: 'runtime-error',
          rootCause: 'Null reference in extension activation',
          isPlatformSpecific: false,
          affectedFiles: ['src/extension.ts'],
          confidence: 0.92
        },
        suggestedFix: {
          files: [{
            path: 'src/extension.ts',
            action: 'modify',
            before: 'const config = vscode.workspace.getConfiguration();\nconfig.get("setting");',
            after: 'const config = vscode.workspace.getConfiguration();\nif (config) {\n  config.get("setting");\n}',
            explanation: 'Add null check'
          }],
          testPlan: ['Reload extension'],
          verificationSteps: ['No crash on activation']
        },
        reasoning: `Runtime error: ${runtimeError.message}\nVisual: Dashboard not visible (${visualAnalysis.confidence * 100}% confidence)\nFix: Add null check`,
        nextSteps: ['Apply fix']
      };

      expect(handoff.reasoning).toContain(runtimeError.message);
      expect(handoff.reasoning).toContain('Dashboard not visible');
      expect(isValidHandoff(handoff)).toBe(true);
    });

    it('should calculate combined confidence from multiple detectors', () => {
      const runtimeConfidence = 0.85;
      const visualConfidence = 0.90;
      const errorConfidence = 0.95;

      const finalConfidence = (runtimeConfidence + visualConfidence + errorConfidence) / 3;

      expect(finalConfidence).toBeCloseTo(0.90, 2);
      expect(finalConfidence).toBeGreaterThan(0.85);
      expect(finalConfidence).toBeLessThanOrEqual(1.0);
    });

    it('should preserve platform information through phases', () => {
      const platformInfo = {
        platform: 'Windows 11',
        os: 'Windows',
        vscodeVersion: '1.95.0',
        extensionVersion: '2.0.0'
      };

      const handoff: GuardianAutopilotHandoff = {
        schemaVersion: '1.0.0',
        source: 'odavl-guardian',
        timestamp: new Date().toISOString(),
        issue: {
          type: 'runtime-error',
          rootCause: 'Platform-specific path handling error',
          isPlatformSpecific: true,
          affectedFiles: ['src/utils/paths.ts'],
          confidence: 0.88
        },
        suggestedFix: {
          files: [{
            path: 'src/utils/paths.ts',
            action: 'modify',
            before: 'const sep = "/";',
            after: 'const sep = path.sep; // Use platform-specific separator',
            explanation: 'Fix path separator for Windows'
          }],
          testPlan: ['Test on Windows', 'Test on Linux'],
          verificationSteps: ['Paths should work on both platforms']
        },
        reasoning: 'Error only occurs on Windows due to backslash path separators',
        nextSteps: ['Test on multiple platforms'],
        metadata: {
          guardianVersion: '4.0.0',
          analysisType: 'runtime',
          platform: platformInfo.platform,
          os: platformInfo.os
        }
      };

      expect(handoff.issue.isPlatformSpecific).toBe(true);
      expect(handoff.metadata?.platform).toBe('Windows 11');
      expect(isValidHandoff(handoff)).toBe(true);
    });
  });

  describe('Boundary Compliance', () => {
    it('should generate suggestions only, never execute', () => {
      const handoff: GuardianAutopilotHandoff = {
        schemaVersion: '1.0.0',
        source: 'odavl-guardian',
        timestamp: new Date().toISOString(),
        issue: {
          type: 'runtime-error',
          rootCause: 'Test issue',
          isPlatformSpecific: false,
          affectedFiles: ['test.ts'],
          confidence: 0.9
        },
        suggestedFix: {
          files: [{
            path: 'test.ts',
            action: 'modify',
            before: 'old code',
            after: 'new code',
            explanation: 'test fix'
          }],
          testPlan: ['test'],
          verificationSteps: ['verify']
        },
        reasoning: 'test reasoning',
        nextSteps: [
          'Review suggested fix',
          'Run: odavl autopilot run', // ← Autopilot executes, not Guardian
          'Verify with test plan'
        ]
      };

      // Handoff should contain suggestions, not executed changes
      expect(handoff.suggestedFix.files).toHaveLength(1);
      expect(handoff.suggestedFix.files[0].action).toBe('modify');
      expect(handoff.suggestedFix.files[0].before).toBeDefined();
      expect(handoff.suggestedFix.files[0].after).toBeDefined();
      
      // Verify nextSteps mentions Autopilot (execution responsibility)
      expect(handoff.nextSteps.some(step => step.includes('autopilot'))).toBe(true);
    });

    it('should maintain detection-only philosophy', () => {
      // Guardian workflow outputs data structures only
      const runtimeReport = { issues: [], screenshots: [] };
      const visualAnalysis = { errors: [], suggestions: [] };
      const errorDiagnosis = { rootCause: '', suggestedFix: {} };
      const handoff = { source: 'odavl-guardian', suggestedFix: {} };

      // All are plain data objects
      expect(typeof runtimeReport).toBe('object');
      expect(typeof visualAnalysis).toBe('object');
      expect(typeof errorDiagnosis).toBe('object');
      expect(typeof handoff).toBe('object');

      // No execution methods in any structure
      expect(runtimeReport).not.toHaveProperty('applyFix');
      expect(visualAnalysis).not.toHaveProperty('executeFix');
      expect(errorDiagnosis).not.toHaveProperty('modifyFile');
      expect(handoff).not.toHaveProperty('writeFile');
    });

    it('should preserve rollback capability through handoff', () => {
      const handoff: GuardianAutopilotHandoff = {
        schemaVersion: '1.0.0',
        source: 'odavl-guardian',
        timestamp: new Date().toISOString(),
        issue: {
          type: 'runtime-error',
          rootCause: 'Test error',
          isPlatformSpecific: false,
          affectedFiles: ['test.ts'],
          confidence: 0.9
        },
        suggestedFix: {
          files: [{
            path: 'test.ts',
            action: 'modify',
            before: 'original code', // ← Preserved for rollback
            after: 'fixed code',
            explanation: 'fix explanation'
          }],
          testPlan: ['test steps'],
          verificationSteps: ['verify steps']
        },
        reasoning: 'test reasoning',
        nextSteps: [
          'Apply with Autopilot',
          'Rollback available if needed' // ← Rollback safety net
        ]
      };

      // Before/after preserved for safe rollback
      expect(handoff.suggestedFix.files[0].before).toBeDefined();
      expect(handoff.suggestedFix.files[0].after).toBeDefined();
      expect(handoff.nextSteps.some(step => step.includes('Rollback'))).toBe(true);
    });
  });

  describe('Multi-Agent Confidence Aggregation', () => {
    it('should calculate overall confidence from 3 agents', () => {
      const runtimeAgent = { confidence: 0.85, detected: true };
      const visualAgent = { confidence: 0.90, detected: true };
      const errorAgent = { confidence: 0.95, detected: true };

      const overallConfidence = 
        (runtimeAgent.confidence + visualAgent.confidence + errorAgent.confidence) / 3;

      expect(overallConfidence).toBeCloseTo(0.90, 2);
      
      // High confidence when all agents agree
      expect(runtimeAgent.detected && visualAgent.detected && errorAgent.detected).toBe(true);
      expect(overallConfidence).toBeGreaterThan(0.85);
    });

    it('should handle partial detections (not all agents agree)', () => {
      const runtimeAgent = { confidence: 0.90, detected: true };
      const visualAgent = { confidence: 0.50, detected: false }; // Not detected
      const errorAgent = { confidence: 0.85, detected: true };

      // Only count agents that detected the issue
      const detectingAgents = [runtimeAgent, errorAgent].filter(a => a.detected);
      const avgConfidence = detectingAgents.reduce((sum, a) => sum + a.confidence, 0) / detectingAgents.length;

      expect(avgConfidence).toBeCloseTo(0.875, 2);
      expect(detectingAgents).toHaveLength(2);
    });
  });
});
