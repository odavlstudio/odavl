/**
 * ODAVL Guardian v4.0 - Smart Error Analyzer Tests
 * 
 * Tests:
 * 1. analyzeRuntimeError functionality
 * 2. Error diagnosis structure
 * 3. Common pattern detection
 * 4. Autopilot handoff generation
 * 5. Boundary compliance (NO execution)
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SmartErrorAnalyzer } from '../../agents/smart-error-analyzer';
import Anthropic from '@anthropic-ai/sdk';
import type { ErrorContext } from '../../agents/smart-error-analyzer';

// Mock Anthropic SDK
vi.mock('@anthropic-ai/sdk', () => {
  return {
    default: vi.fn().mockImplementation(() => ({
      messages: {
        create: vi.fn().mockResolvedValue({
          content: [{
            type: 'text',
            text: JSON.stringify({
              rootCause: 'Missing "use client" directive in React component',
              isPlatformSpecific: false,
              isRuntimeIssue: true,
              affectedFiles: ['src/components/Dashboard.tsx'],
              suggestedFix: {
                files: [{
                  path: 'src/components/Dashboard.tsx',
                  action: 'modify',
                  before: 'export default function Dashboard()',
                  after: '"use client";\n\nexport default function Dashboard()',
                  explanation: 'Add "use client" directive for Next.js 13+ compatibility'
                }],
                testPlan: ['Open dashboard', 'Check console for errors'],
                verificationSteps: ['Dashboard should open without errors']
              },
              confidence: 0.95,
              reasoning: 'Context hooks require "use client" in Next.js App Router'
            })
          }]
        })
      }
    }))
  };
});

describe('SmartErrorAnalyzer', () => {
  let analyzer: SmartErrorAnalyzer;
  let mockError: Error;
  let mockContext: ErrorContext;

  beforeEach(() => {
    analyzer = new SmartErrorAnalyzer('fake-api-key-for-tests');
    
    mockError = new Error('Cannot read properties of null (reading "useContext")');
    mockError.stack = `Error: Cannot read properties of null
    at Dashboard (C:/project/src/components/Dashboard.tsx:15:10)
    at App (C:/project/src/App.tsx:20:5)`;
    
    mockContext = {
      platform: 'extension',
      os: 'Windows',
      vscodeVersion: '1.85.0',
      extensionVersion: '2.0.0',
      when: 'opening dashboard panel',
      expected: 'Dashboard panel should open successfully',
      actual: 'Extension crashes with context error',
      consoleLogs: [
        'Error: Cannot read properties of null',
        'at Dashboard.tsx:15'
      ],
      stackTrace: mockError.stack
    };
  });

  describe('analyzeRuntimeError', () => {
    it('should analyze error and return ErrorDiagnosis', async () => {
      const diagnosis = await analyzer.analyzeRuntimeError(mockError, mockContext);

      expect(diagnosis).toHaveProperty('rootCause');
      expect(diagnosis).toHaveProperty('isPlatformSpecific');
      expect(diagnosis).toHaveProperty('isRuntimeIssue');
      expect(diagnosis).toHaveProperty('affectedFiles');
      expect(diagnosis).toHaveProperty('suggestedFix');
      expect(diagnosis).toHaveProperty('confidence');
      expect(diagnosis).toHaveProperty('reasoning');
      
      expect(typeof diagnosis.rootCause).toBe('string');
      expect(typeof diagnosis.isPlatformSpecific).toBe('boolean');
      expect(typeof diagnosis.isRuntimeIssue).toBe('boolean');
      expect(Array.isArray(diagnosis.affectedFiles)).toBe(true);
      expect(typeof diagnosis.confidence).toBe('number');
    });

    it('should provide high confidence for known errors', async () => {
      const diagnosis = await analyzer.analyzeRuntimeError(mockError, mockContext);

      expect(diagnosis.confidence).toBeGreaterThanOrEqual(0.8);
      expect(diagnosis.rootCause).toBeTruthy();
      expect(diagnosis.suggestedFix.files.length).toBeGreaterThan(0);
    });

    it('should include file fixes in suggestion', async () => {
      const diagnosis = await analyzer.analyzeRuntimeError(mockError, mockContext);

      expect(diagnosis.suggestedFix.files.length).toBeGreaterThan(0);
      
      const firstFix = diagnosis.suggestedFix.files[0];
      expect(firstFix).toHaveProperty('path');
      expect(firstFix).toHaveProperty('action');
      expect(firstFix).toHaveProperty('explanation');
      
      expect(['modify', 'create', 'delete']).toContain(firstFix.action);
    });

    it('should provide test plan and verification steps', async () => {
      const diagnosis = await analyzer.analyzeRuntimeError(mockError, mockContext);

      expect(Array.isArray(diagnosis.suggestedFix.testPlan)).toBe(true);
      expect(Array.isArray(diagnosis.suggestedFix.verificationSteps)).toBe(true);
      expect(diagnosis.suggestedFix.testPlan.length).toBeGreaterThan(0);
      expect(diagnosis.suggestedFix.verificationSteps.length).toBeGreaterThan(0);
    });

    it('should return fallback diagnosis on API error', async () => {
      const errorAnalyzer = new SmartErrorAnalyzer('invalid-key');
      const mockCreate = vi.fn().mockRejectedValue(new Error('API key invalid'));
      (errorAnalyzer as any).claude.messages.create = mockCreate;

      const diagnosis = await errorAnalyzer.analyzeRuntimeError(mockError, mockContext);

      expect(diagnosis.confidence).toBe(0);
      expect(diagnosis.rootCause).toContain('AI diagnosis failed');
      expect(diagnosis.isRuntimeIssue).toBe(true);
    });
  });

  describe('analyzeCommonPattern', () => {
    it('should detect React context errors', async () => {
      const suggestions = await analyzer.analyzeCommonPattern(
        'Cannot read properties of null (reading "useContext")'
      );

      expect(suggestions.length).toBeGreaterThan(0);
      expect(suggestions.some(s => s.includes('use client'))).toBe(true);
    });

    it('should detect module not found errors', async () => {
      const suggestions = await analyzer.analyzeCommonPattern(
        'Module not found: Cannot resolve module "@odavl/core"'
      );

      expect(suggestions.length).toBeGreaterThan(0);
      expect(suggestions.some(s => s.includes('pnpm install'))).toBe(true);
    });

    it('should detect fetch errors', async () => {
      const suggestions = await analyzer.analyzeCommonPattern(
        'Failed to fetch: ECONNREFUSED'
      );

      expect(suggestions.length).toBeGreaterThan(0);
      expect(suggestions.some(s => s.includes('server is running'))).toBe(true);
    });

    it('should detect TypeScript type errors', async () => {
      const suggestions = await analyzer.analyzeCommonPattern(
        'Type "string" is not assignable to type "number"'
      );

      expect(suggestions.length).toBeGreaterThan(0);
      expect(suggestions.some(s => s.includes('typecheck'))).toBe(true);
    });
  });

  describe('generateAutopilotHandoff', () => {
    it('should generate valid handoff package', async () => {
      const diagnosis = await analyzer.analyzeRuntimeError(mockError, mockContext);
      const handoff = analyzer.generateAutopilotHandoff(diagnosis);

      expect(handoff).toHaveProperty('source', 'odavl-guardian');
      expect(handoff).toHaveProperty('timestamp');
      expect(handoff).toHaveProperty('issue');
      expect(handoff).toHaveProperty('suggestedFix');
      expect(handoff).toHaveProperty('reasoning');
      expect(handoff).toHaveProperty('nextSteps');
      
      expect(Array.isArray(handoff.nextSteps)).toBe(true);
      expect(handoff.nextSteps.length).toBeGreaterThan(0);
    });

    it('should include issue details', async () => {
      const diagnosis = await analyzer.analyzeRuntimeError(mockError, mockContext);
      const handoff = analyzer.generateAutopilotHandoff(diagnosis);

      expect(handoff.issue).toHaveProperty('type', 'runtime-error');
      expect(handoff.issue).toHaveProperty('rootCause');
      expect(handoff.issue).toHaveProperty('isPlatformSpecific');
      expect(handoff.issue).toHaveProperty('affectedFiles');
      expect(handoff.issue).toHaveProperty('confidence');
      
      expect(typeof handoff.issue.rootCause).toBe('string');
      expect(Array.isArray(handoff.issue.affectedFiles)).toBe(true);
    });

    it('should include next steps for Autopilot', async () => {
      const diagnosis = await analyzer.analyzeRuntimeError(mockError, mockContext);
      const handoff = analyzer.generateAutopilotHandoff(diagnosis);

      expect(handoff.nextSteps.some(step => step.includes('odavl autopilot run'))).toBe(true);
      expect(handoff.nextSteps.some(step => step.includes('O-D-A-V-L'))).toBe(true);
    });

    it('should preserve suggested fix structure', async () => {
      const diagnosis = await analyzer.analyzeRuntimeError(mockError, mockContext);
      const handoff = analyzer.generateAutopilotHandoff(diagnosis);

      expect(handoff.suggestedFix).toHaveProperty('files');
      expect(handoff.suggestedFix).toHaveProperty('testPlan');
      expect(handoff.suggestedFix).toHaveProperty('verificationSteps');
      
      expect(Array.isArray(handoff.suggestedFix.files)).toBe(true);
    });
  });

  describe('boundary compliance', () => {
    it('should NOT have applyFix method', () => {
      expect(typeof (analyzer as any).applyFix).toBe('undefined');
      expect(Object.getOwnPropertyNames(Object.getPrototypeOf(analyzer))).not.toContain('applyFix');
    });

    it('should NOT have rollback method', () => {
      expect(typeof (analyzer as any).rollback).toBe('undefined');
      expect(Object.getOwnPropertyNames(Object.getPrototypeOf(analyzer))).not.toContain('rollback');
    });

    it('should NOT have any file modification methods', () => {
      const prototype = Object.getPrototypeOf(analyzer);
      const methods = Object.getOwnPropertyNames(prototype).filter(
        name => typeof (prototype as any)[name] === 'function' && name !== 'constructor'
      );

      // Check for forbidden method names
      const forbiddenMethods = ['applyFix', 'rollback', 'modifyFile', 'deleteFile', 'writeFile', 'createFile', 'executefix'];
      const hasForbiddenMethods = methods.some(method => 
        forbiddenMethods.some(forbidden => method.toLowerCase().includes(forbidden.toLowerCase()))
      );

      expect(hasForbiddenMethods).toBe(false);
    });

    it('should ONLY generate suggestions (NOT execute)', async () => {
      const diagnosis = await analyzer.analyzeRuntimeError(mockError, mockContext);

      // Diagnosis should have suggestedFix (not appliedFix)
      expect(diagnosis).toHaveProperty('suggestedFix');
      expect(diagnosis).not.toHaveProperty('appliedFix');
      expect(diagnosis).not.toHaveProperty('fixResult');
      
      // Should provide guidance but not execute
      expect(diagnosis.suggestedFix.files.length).toBeGreaterThan(0);
      expect(diagnosis.suggestedFix.testPlan.length).toBeGreaterThan(0);
    });

    it('should ONLY have detection and suggestion methods', () => {
      const prototype = Object.getPrototypeOf(analyzer);
      const methods = Object.getOwnPropertyNames(prototype).filter(
        name => typeof (prototype as any)[name] === 'function' && name !== 'constructor'
      );

      // All methods should be analysis/suggestion related
      const allowedMethods = ['analyzeRuntimeError', 'analyzeCommonPattern', 'generateAutopilotHandoff', 'readRelevantFiles'];
      
      methods.forEach(method => {
        expect(allowedMethods).toContain(method);
      });

      expect(methods.length).toBe(allowedMethods.length);
    });

    it('should generate handoff for Autopilot (NOT apply directly)', async () => {
      const diagnosis = await analyzer.analyzeRuntimeError(mockError, mockContext);
      const handoff = analyzer.generateAutopilotHandoff(diagnosis);

      // Handoff should instruct user to use Autopilot
      expect(handoff.nextSteps.some(step => step.includes('autopilot'))).toBe(true);
      expect(handoff.source).toBe('odavl-guardian');
      
      // Should NOT have executed status
      expect(handoff).not.toHaveProperty('executed');
      expect(handoff).not.toHaveProperty('appliedAt');
    });
  });
});
