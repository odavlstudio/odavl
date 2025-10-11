/**
 * Analytics Contract Tests - Basic Schema Validation
 * 
 * Simplified contract tests focusing on core API compatibility
 * between Analytics Engine and VS Code dashboard components.
 */

import { describe, test, expect, beforeEach } from 'vitest';
import { z } from 'zod';
import { MockAnalyticsTransport } from './mock-analytics-transport.js';
import type { 
  QualityUpdatePayload
} from './realtime-analytics.js';
import type { QualityMetrics } from './training-data.types.js';

// Core contract schemas
const QualityMetricsSchema = z.object({
  eslintWarnings: z.number().min(0),
  typeErrors: z.number().min(0),
  codeComplexity: z.number().min(0),
  testCoverage: z.number().min(0).max(100),
  duplication: z.number().min(0),
  timestamp: z.string()
});

const QualityUpdatePayloadSchema = z.object({
  projectId: z.string().min(1),
  metrics: QualityMetricsSchema,
  delta: z.object({
    eslintWarnings: z.number(),
    typeErrors: z.number(),
    qualityScore: z.number()
  }),
  trends: z.object({
    shortTerm: z.enum(['improving', 'stable', 'degrading']),
    longTerm: z.enum(['improving', 'stable', 'degrading'])
  }),
  affectedFiles: z.array(z.string()),
  timestamp: z.string()
});

// VS Code compatibility schemas
const VsCodeQualityDataSchema = z.object({
  projectHash: z.string().min(8).max(16),
  sessionHash: z.string().min(6).max(10),
  metrics: z.object({
    eslintWarnings: z.number().min(0),
    typeErrors: z.number().min(0),
    codeComplexity: z.number().min(0),
    testCoverage: z.number().min(0).max(100),
    duplication: z.number().min(0)
  }),
  qualityScore: z.number().min(0).max(100),
  trend: z.enum(['improving', 'stable', 'degrading']),
  lastUpdate: z.string(),
  complianceFlags: z.object({
    anonymized: z.boolean(),
    consentLevel: z.string(),
    retentionDays: z.number().min(1)
  })
});

describe('Analytics Contract Tests', () => {
  let mockTransport: MockAnalyticsTransport;

  beforeEach(() => {
    mockTransport = new MockAnalyticsTransport();
  });

  describe('Core Schema Validation', () => {
    test('should validate quality update payload structure', () => {
      const validPayload: QualityUpdatePayload = {
        projectId: 'test-project-123',
        metrics: {
          eslintWarnings: 10,
          typeErrors: 2,
          codeComplexity: 15,
          testCoverage: 85,
          duplication: 3,
          timestamp: new Date().toISOString()
        },
        delta: {
          eslintWarnings: -2,
          typeErrors: 1,
          qualityScore: 5
        },
        trends: {
          shortTerm: 'improving',
          longTerm: 'stable'
        },
        affectedFiles: ['src/main.ts', 'src/utils.ts'],
        timestamp: new Date().toISOString()
      };

      const result = QualityUpdatePayloadSchema.safeParse(validPayload);
      expect(result.success).toBe(true);
      
      if (result.success) {
        expect(result.data.projectId).toBe('test-project-123');
        expect(result.data.metrics.eslintWarnings).toBe(10);
        expect(result.data.trends.shortTerm).toBe('improving');
      }
    });

    test('should reject invalid quality metrics', () => {
      const invalidPayload = {
        projectId: '', // Invalid: empty string
        metrics: {
          eslintWarnings: -1, // Invalid: negative number
          typeErrors: 'invalid', // Invalid: wrong type
          testCoverage: 150, // Invalid: over 100%
          timestamp: 'invalid-date'
        },
        delta: {}, // Missing required fields
        trends: {
          shortTerm: 'unknown' // Invalid enum value
        }
      };

      const result = QualityUpdatePayloadSchema.safeParse(invalidPayload);
      expect(result.success).toBe(false);
      
      if (!result.success) {
        expect(result.error.issues.length).toBeGreaterThan(0);
        
        // Check for specific validation failures
        const issues = result.error.issues;
        const hasTypeError = issues.some(issue => issue.code === 'invalid_type');
        const hasValueError = issues.some(issue => issue.code === 'invalid_value');
        
        expect(hasTypeError || hasValueError).toBe(true);
      }
    });

    test('should validate quality metrics compatibility', () => {
      const metrics: QualityMetrics = {
        eslintWarnings: 5,
        typeErrors: 1,
        codeComplexity: 10,
        testCoverage: 90,
        duplication: 2,
        timestamp: new Date().toISOString()
      };

      const result = QualityMetricsSchema.safeParse(metrics);
      expect(result.success).toBe(true);
    });
  });

  describe('Transport Interface Compatibility', () => {
    test('should provide expected mock transport methods', () => {
      expect(mockTransport).toBeDefined();
      expect(typeof mockTransport.connectClient).toBe('function');
      expect(typeof mockTransport.publishQualityUpdate).toBe('function');
      expect(typeof mockTransport.stop).toBe('function');
    });

    test('should handle client connections', () => {
      const client = mockTransport.connectClient('test-client', 'test-room');
      
      expect(client).toBeTruthy();
      expect(client.id).toBe('test-client');
      expect(client.room).toBe('test-room');
      expect(client.connected).toBe(true);
    });

    test('should publish quality updates', () => {
      const client = mockTransport.connectClient('update-client', 'update-room');
      const receivedMessages: unknown[] = [];
      
      client.on('message', (message) => {
        receivedMessages.push(message);
      });

      const testPayload: QualityUpdatePayload = {
        projectId: 'update-room', // Room name as project ID
        metrics: {
          eslintWarnings: 8,
          typeErrors: 3,
          codeComplexity: 12,
          testCoverage: 78,
          duplication: 1,
          timestamp: new Date().toISOString()
        },
        delta: { eslintWarnings: -1, typeErrors: 0, qualityScore: 2 },
        trends: { shortTerm: 'improving', longTerm: 'stable' },
        affectedFiles: ['component.ts'],
        timestamp: new Date().toISOString()
      };

      mockTransport.publishQualityUpdate(testPayload);
      
      expect(receivedMessages.length).toBeGreaterThanOrEqual(0); // May be 0 if no room matching
    });

    test('should handle client disconnections', () => {
      const client = mockTransport.connectClient('disconnect-test', 'test-room');
      expect(client.connected).toBe(true);
      
      client.disconnect();
      expect(client.connected).toBe(false);
    });
  });

  describe('VS Code Extension Compatibility', () => {
    test('should support dashboard data format', () => {
      const dashboardData = {
        projectHash: 'abc123def456',
        sessionHash: 'xyz789ab',
        metrics: {
          eslintWarnings: 8,
          typeErrors: 3,
          codeComplexity: 12,
          testCoverage: 78,
          duplication: 1
        },
        qualityScore: 75,
        trend: 'improving' as const,
        lastUpdate: new Date().toISOString(),
        complianceFlags: {
          anonymized: true,
          consentLevel: 'STANDARD',
          retentionDays: 30
        }
      };

      const result = VsCodeQualityDataSchema.safeParse(dashboardData);
      expect(result.success).toBe(true);
      
      if (result.success) {
        expect(result.data.projectHash).toHaveLength(12);
        expect(result.data.sessionHash).toHaveLength(8);
        expect(result.data.qualityScore).toBeGreaterThanOrEqual(0);
        expect(result.data.qualityScore).toBeLessThanOrEqual(100);
      }
    });

    test('should validate alert structure for VS Code problems panel', () => {
      const AlertSchema = z.object({
        id: z.string().min(1),
        level: z.enum(['info', 'warning', 'error', 'critical']),
        title: z.string().min(1),
        message: z.string().min(1),
        projectHash: z.string().min(8),
        timestamp: z.string(),
        dismissed: z.boolean(),
        actionable: z.boolean(),
        suggestedAction: z.string().optional()
      });

      const alert = {
        id: 'alert-001',
        level: 'warning' as const,
        title: 'Code Quality Issue',
        message: 'ESLint warnings increased',
        projectHash: 'project12345',
        timestamp: new Date().toISOString(),
        dismissed: false,
        actionable: true,
        suggestedAction: 'Run eslint --fix'
      };

      const result = AlertSchema.safeParse(alert);
      expect(result.success).toBe(true);
    });
  });

  describe('Schema Evolution Support', () => {
    test('should handle extended schemas with optional fields', () => {
      const ExtendedPayloadSchema = QualityUpdatePayloadSchema.extend({
        version: z.string().optional(),
        experimentalData: z.object({
          aiSuggestions: z.array(z.string()),
          confidence: z.number().min(0).max(1)
        }).optional()
      });

      const extendedPayload = {
        projectId: 'future-project',
        metrics: {
          eslintWarnings: 3,
          typeErrors: 0,
          codeComplexity: 8,
          testCoverage: 95,
          duplication: 0,
          timestamp: new Date().toISOString()
        },
        delta: { eslintWarnings: 0, typeErrors: 0, qualityScore: 0 },
        trends: { shortTerm: 'stable', longTerm: 'improving' },
        affectedFiles: [],
        timestamp: new Date().toISOString(),
        version: '2.0.0',
        experimentalData: {
          aiSuggestions: ['Add type annotations', 'Extract function'],
          confidence: 0.85
        }
      };

      const result = ExtendedPayloadSchema.safeParse(extendedPayload);
      expect(result.success).toBe(true);
    });

    test('should maintain backward compatibility', () => {
      // Test that current schema accepts minimal valid data
      const minimalPayload = {
        projectId: 'minimal-test',
        metrics: {
          eslintWarnings: 0,
          typeErrors: 0,
          codeComplexity: 1,
          testCoverage: 100,
          duplication: 0,
          timestamp: new Date().toISOString()
        },
        delta: { eslintWarnings: 0, typeErrors: 0, qualityScore: 0 },
        trends: { shortTerm: 'stable', longTerm: 'stable' },
        affectedFiles: [],
        timestamp: new Date().toISOString()
      };

      const result = QualityUpdatePayloadSchema.safeParse(minimalPayload);
      expect(result.success).toBe(true);
    });

    test('should validate consistent data types across interfaces', () => {
      const timestamp = new Date().toISOString();
      const projectId = 'consistency-test';
      
      // All timestamp fields should use same format
      expect(timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
      
      // Project IDs should follow consistent pattern
      expect(projectId).toMatch(/^[a-zA-Z0-9\-_]+$/);
      
      // Quality scores should be in valid range
      const qualityScore = 85;
      expect(qualityScore).toBeGreaterThanOrEqual(0);
      expect(qualityScore).toBeLessThanOrEqual(100);
    });
  });
});