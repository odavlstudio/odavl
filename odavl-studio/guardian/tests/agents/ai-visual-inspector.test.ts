/**
 * ODAVL Guardian v4.0 - AI Visual Inspector Tests
 * 
 * Tests:
 * 1. analyzeExtensionUI functionality
 * 2. compareVersions functionality
 * 3. analyzeWebsiteUI functionality
 * 4. Error handling (missing API key)
 * 5. Boundary compliance (NO execution methods)
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AIVisualInspector } from '../../agents/ai-visual-inspector';
import Anthropic from '@anthropic-ai/sdk';

// Mock Anthropic SDK
vi.mock('@anthropic-ai/sdk', () => {
  return {
    default: vi.fn().mockImplementation(() => ({
      messages: {
        create: vi.fn().mockResolvedValue({
          content: [{
            type: 'text',
            text: JSON.stringify({
              dashboardVisible: true,
              iconVisible: true,
              layoutCorrect: true,
              errors: [],
              suggestions: ['Great UI!'],
              confidence: 0.95
            })
          }]
        })
      }
    }))
  };
});

describe('AIVisualInspector', () => {
  let inspector: AIVisualInspector;
  let mockScreenshot: Buffer;

  beforeEach(() => {
    // Use fake API key for testing
    inspector = new AIVisualInspector('fake-api-key-for-tests');
    
    // Create mock screenshot (1x1 PNG)
    mockScreenshot = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==', 'base64');
  });

  describe('analyzeExtensionUI', () => {
    it('should analyze screenshot and return VisualAnalysis', async () => {
      const analysis = await inspector.analyzeExtensionUI(mockScreenshot);

      expect(analysis).toHaveProperty('dashboardVisible');
      expect(analysis).toHaveProperty('iconVisible');
      expect(analysis).toHaveProperty('layoutCorrect');
      expect(analysis).toHaveProperty('errors');
      expect(analysis).toHaveProperty('suggestions');
      expect(analysis).toHaveProperty('confidence');
      
      expect(typeof analysis.dashboardVisible).toBe('boolean');
      expect(typeof analysis.iconVisible).toBe('boolean');
      expect(typeof analysis.layoutCorrect).toBe('boolean');
      expect(Array.isArray(analysis.errors)).toBe(true);
      expect(Array.isArray(analysis.suggestions)).toBe(true);
      expect(typeof analysis.confidence).toBe('number');
    });

    it('should return fallback analysis on API error', async () => {
      // Mock API error
      const errorInspector = new AIVisualInspector('invalid-key');
      const mockCreate = vi.fn().mockRejectedValue(new Error('API key invalid'));
      (errorInspector as any).claude.messages.create = mockCreate;

      const analysis = await errorInspector.analyzeExtensionUI(mockScreenshot);

      expect(analysis.confidence).toBe(0);
      expect(analysis.errors.length).toBeGreaterThan(0);
      expect(analysis.errors[0].severity).toBe('critical');
      expect(analysis.errors[0].description).toContain('AI analysis failed');
    });

    it('should handle JSON extraction from markdown code blocks', async () => {
      // Mock response with markdown code block
      const mockCreate = vi.fn().mockResolvedValue({
        content: [{
          type: 'text',
          text: '```json\n{"dashboardVisible": true, "iconVisible": true, "layoutCorrect": true, "errors": [], "suggestions": [], "confidence": 0.9}\n```'
        }]
      });
      (inspector as any).claude.messages.create = mockCreate;

      const analysis = await inspector.analyzeExtensionUI(mockScreenshot);

      expect(analysis.dashboardVisible).toBe(true);
      expect(analysis.confidence).toBe(0.9);
    });
  });

  describe('compareVersions', () => {
    it('should compare two screenshots and return RegressionReport', async () => {
      // Mock regression detection
      const mockCreate = vi.fn().mockResolvedValue({
        content: [{
          type: 'text',
          text: JSON.stringify({
            changes: ['Icon color changed'],
            regressions: [],
            improvements: ['Better contrast'],
            newBugs: [],
            overallAssessment: 'safe to deploy'
          })
        }]
      });
      (inspector as any).claude.messages.create = mockCreate;

      const report = await inspector.compareVersions(mockScreenshot, mockScreenshot);

      expect(report).toHaveProperty('changes');
      expect(report).toHaveProperty('regressions');
      expect(report).toHaveProperty('improvements');
      expect(report).toHaveProperty('newBugs');
      expect(report).toHaveProperty('overallAssessment');
      
      expect(Array.isArray(report.changes)).toBe(true);
      expect(Array.isArray(report.regressions)).toBe(true);
      expect(Array.isArray(report.improvements)).toBe(true);
      expect(Array.isArray(report.newBugs)).toBe(true);
    });

    it('should detect regressions with severity', async () => {
      // Mock regression detection
      const mockCreate = vi.fn().mockResolvedValue({
        content: [{
          type: 'text',
          text: JSON.stringify({
            changes: ['Dashboard removed'],
            regressions: [{
              type: 'functional',
              severity: 'critical',
              description: 'Dashboard no longer visible',
              recommendation: 'Restore dashboard panel'
            }],
            improvements: [],
            newBugs: [],
            overallAssessment: 'regressions detected - do not deploy'
          })
        }]
      });
      (inspector as any).claude.messages.create = mockCreate;

      const report = await inspector.compareVersions(mockScreenshot, mockScreenshot);

      expect(report.regressions.length).toBeGreaterThan(0);
      expect(report.regressions[0].severity).toBe('critical');
      expect(report.overallAssessment).toContain('do not deploy');
    });

    it('should return fallback report on API error', async () => {
      const mockCreate = vi.fn().mockRejectedValue(new Error('Rate limit exceeded'));
      (inspector as any).claude.messages.create = mockCreate;

      const report = await inspector.compareVersions(mockScreenshot, mockScreenshot);

      expect(report.regressions.length).toBeGreaterThan(0);
      expect(report.regressions[0].severity).toBe('critical');
      expect(report.overallAssessment).toContain('manual review required');
    });
  });

  describe('analyzeWebsiteUI', () => {
    it('should analyze website screenshot', async () => {
      const analysis = await inspector.analyzeWebsiteUI(mockScreenshot);

      expect(analysis).toHaveProperty('layoutCorrect');
      expect(analysis).toHaveProperty('errors');
      expect(typeof analysis.layoutCorrect).toBe('boolean');
    });

    it('should detect website errors', async () => {
      // Mock error detection
      const mockCreate = vi.fn().mockResolvedValue({
        content: [{
          type: 'text',
          text: JSON.stringify({
            dashboardVisible: true,
            iconVisible: true,
            layoutCorrect: false,
            errors: [{
              type: 'broken-layout',
              severity: 'high',
              description: '404 error page visible',
              location: 'main content area'
            }],
            suggestions: ['Check routing configuration'],
            confidence: 0.92
          })
        }]
      });
      (inspector as any).claude.messages.create = mockCreate;

      const analysis = await inspector.analyzeWebsiteUI(mockScreenshot);

      expect(analysis.errors.length).toBeGreaterThan(0);
      expect(analysis.errors[0].type).toBe('broken-layout');
      expect(analysis.layoutCorrect).toBe(false);
    });
  });

  describe('boundary compliance', () => {
    it('should NOT have applyFix method', () => {
      expect(typeof (inspector as any).applyFix).toBe('undefined');
      expect(Object.getOwnPropertyNames(Object.getPrototypeOf(inspector))).not.toContain('applyFix');
    });

    it('should NOT have rollback method', () => {
      expect(typeof (inspector as any).rollback).toBe('undefined');
      expect(Object.getOwnPropertyNames(Object.getPrototypeOf(inspector))).not.toContain('rollback');
    });

    it('should NOT have any file modification methods', () => {
      const prototype = Object.getPrototypeOf(inspector);
      const methods = Object.getOwnPropertyNames(prototype).filter(
        name => typeof (prototype as any)[name] === 'function' && name !== 'constructor'
      );

      // Check for forbidden method names
      const forbiddenMethods = ['applyFix', 'rollback', 'modifyFile', 'deleteFile', 'writeFile', 'createFile'];
      const hasForbiddenMethods = methods.some(method => 
        forbiddenMethods.some(forbidden => method.toLowerCase().includes(forbidden.toLowerCase()))
      );

      expect(hasForbiddenMethods).toBe(false);
    });

    it('should ONLY have detection and analysis methods', () => {
      const prototype = Object.getPrototypeOf(inspector);
      const methods = Object.getOwnPropertyNames(prototype).filter(
        name => typeof (prototype as any)[name] === 'function' && name !== 'constructor'
      );

      // All methods should be analysis/detection related
      const allowedMethods = ['analyzeExtensionUI', 'compareVersions', 'analyzeWebsiteUI'];
      
      methods.forEach(method => {
        expect(allowedMethods).toContain(method);
      });

      expect(methods.length).toBe(allowedMethods.length);
    });
  });
});
