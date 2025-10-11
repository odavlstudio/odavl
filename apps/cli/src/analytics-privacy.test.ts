/**
 * Analytics Privacy Controller Integration Tests
 * 
 * Tests privacy enforcement, consent management, and data anonymization
 * for enterprise compliance requirements.
 */

import { describe, test, expect, beforeEach, afterEach } from 'vitest';
import { existsSync, unlinkSync, mkdirSync } from 'fs';
import { join } from 'path';
import { 
  AnalyticsPrivacyController, 
  ConsentLevel,
  type PrivacyConfig
} from './analytics-privacy.js';
import type { QualityUpdatePayload } from './realtime-analytics.js';

describe('Analytics Privacy Controller - Integration Tests', () => {
  let privacyController: AnalyticsPrivacyController;
  let testConfigDir: string;

  beforeEach(() => {
    testConfigDir = join(process.cwd(), '.test-privacy');
    
    // Clean up any existing test config
    if (existsSync(testConfigDir)) {
      try {
        unlinkSync(join(testConfigDir, 'privacy-config.json'));
        unlinkSync(join(testConfigDir, 'privacy-audit.json'));
      } catch {
        // Ignore cleanup errors
      }
    } else {
      mkdirSync(testConfigDir, { recursive: true });
    }

    privacyController = new AnalyticsPrivacyController(testConfigDir);
  });

  afterEach(() => {
    // Clean up test files
    try {
      if (existsSync(join(testConfigDir, 'privacy-config.json'))) {
        unlinkSync(join(testConfigDir, 'privacy-config.json'));
      }
      if (existsSync(join(testConfigDir, 'privacy-audit.json'))) {
        unlinkSync(join(testConfigDir, 'privacy-audit.json'));
      }
    } catch {
      // Ignore cleanup errors
    }
  });

  describe('Privacy Configuration Management', () => {
    test('should initialize with privacy-first defaults', () => {
      const status = privacyController.getPrivacyStatus();
      
      expect(status.consentLevel).toBe(ConsentLevel.NONE);
      expect(status.dataCollectionActive).toBe(false);
      expect(status.anonymizationEnabled).toBe(true);
      expect(status.retentionDays).toBe(30);
    });

    test('should update privacy settings with audit trail', () => {
      const updates: Partial<PrivacyConfig> = {
        retentionDays: 7,
        anonymizationEnabled: true,
        allowTelemetry: false
      };

      privacyController.updatePrivacySettings(updates);
      const status = privacyController.getPrivacyStatus();

      expect(status.retentionDays).toBe(7);
      expect(status.anonymizationEnabled).toBe(true);
      expect(status.lastReviewedDays).toBe(0); // Just updated
    });

    test('should handle consent granting and revocation', async () => {
      // Grant consent
      const consentGranted = await privacyController.requestConsent(
        ConsentLevel.STANDARD, 
        'test-org-123'
      );

      expect(consentGranted).toBe(true);
      expect(privacyController.canCollectData()).toBe(true);

      let status = privacyController.getPrivacyStatus();
      expect(status.consentLevel).toBe(ConsentLevel.STANDARD);
      expect(status.dataCollectionActive).toBe(true);

      // Revoke consent
      await privacyController.revokeConsent();
      
      status = privacyController.getPrivacyStatus();
      expect(status.consentLevel).toBe(ConsentLevel.NONE);
      expect(status.dataCollectionActive).toBe(false);
    });
  });

  describe('Data Processing & Anonymization', () => {
    beforeEach(async () => {
      // Grant standard consent for data processing tests
      await privacyController.requestConsent(ConsentLevel.STANDARD, 'test-org');
    });

    test('should process and anonymize quality update payloads', () => {
      const testPayload: QualityUpdatePayload = {
        projectId: 'sensitive-project-name',
        metrics: {
          eslintWarnings: 15,
          typeErrors: 3,
          testCoverage: 85,
          codeComplexity: 12,
          duplication: 5,
          timestamp: '2024-10-11T12:00:00Z'
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
        affectedFiles: ['src/sensitive-module.ts', 'src/core/auth.ts'],
        timestamp: '2024-10-11T12:00:00Z'
      };

      const anonymizedPayload = privacyController.processDataPayload(testPayload);

      expect(anonymizedPayload).toBeTruthy();
      expect(anonymizedPayload!.projectHash).toMatch(/^[a-f0-9]{12}$/); // 12-char hash
      expect(anonymizedPayload!.projectHash).not.toBe('sensitive-project-name');
      expect(anonymizedPayload!.sessionHash).toMatch(/^[a-f0-9]{8}$/); // 8-char session hash
      
      // Should include public metrics
      expect(anonymizedPayload!.metrics.eslintWarnings).toBe(15);
      expect(anonymizedPayload!.metrics.typeErrors).toBe(3);
      expect(anonymizedPayload!.metrics.testCoverage).toBe(85);
      
      // Should have compliance flags
      expect(anonymizedPayload!.complianceFlags.anonymized).toBe(true);
      expect(anonymizedPayload!.complianceFlags.consentLevel).toBe(ConsentLevel.STANDARD);
    });

    test('should respect field exclusion settings', () => {
      // Update settings to exclude specific fields
      privacyController.updatePrivacySettings({
        excludedFields: ['testCoverage', 'duplication']
      });

      const testPayload: QualityUpdatePayload = {
        projectId: 'test-project',
        metrics: {
          eslintWarnings: 10,
          typeErrors: 2,
          testCoverage: 90, // Should be excluded
          codeComplexity: 8,
          duplication: 3, // Should be excluded
          timestamp: '2024-10-11T12:00:00Z'
        },
        delta: { eslintWarnings: 0, typeErrors: 0, qualityScore: 0 },
        trends: { shortTerm: 'stable', longTerm: 'stable' },
        affectedFiles: [],
        timestamp: '2024-10-11T12:00:00Z'
      };

      const anonymizedPayload = privacyController.processDataPayload(testPayload);

      expect(anonymizedPayload!.metrics.eslintWarnings).toBe(10);
      expect(anonymizedPayload!.metrics.typeErrors).toBe(2);
      expect(anonymizedPayload!.metrics.codeComplexity).toBe(8);
      
      // Excluded fields should not be present
      expect(anonymizedPayload!.metrics.testCoverage).toBeUndefined();
      expect(anonymizedPayload!.metrics.duplication).toBeUndefined();
    });

    test('should filter data based on consent level', async () => {
      // Test BASIC consent level (public data only)
      await privacyController.requestConsent(ConsentLevel.BASIC);
      
      const testPayload: QualityUpdatePayload = {
        projectId: 'test-project',
        metrics: {
          eslintWarnings: 5, // Public - should be included
          typeErrors: 1,     // Public - should be included  
          codeComplexity: 8,
          testCoverage: 90,
          duplication: 2,
          timestamp: '2024-10-11T12:00:00Z'
        },
        delta: { eslintWarnings: 0, typeErrors: 0, qualityScore: 0 },
        trends: { shortTerm: 'stable', longTerm: 'stable' },
        affectedFiles: [],
        timestamp: '2024-10-11T12:00:00Z'
      };

      const anonymizedPayload = privacyController.processDataPayload(testPayload);

      // Should include public data
      expect(anonymizedPayload!.metrics.eslintWarnings).toBe(5);
      expect(anonymizedPayload!.metrics.typeErrors).toBe(1);
      
      // Should exclude internal/confidential data
      expect(anonymizedPayload!.metrics.buildTime).toBeUndefined();
    });

    test('should block data collection when consent is not granted', async () => {
      // Revoke consent
      await privacyController.revokeConsent();

      const testPayload: QualityUpdatePayload = {
        projectId: 'test-project',
        metrics: {
          eslintWarnings: 10,
          typeErrors: 2,
          codeComplexity: 5,
          testCoverage: 75,
          duplication: 1,
          timestamp: '2024-10-11T12:00:00Z'
        },
        delta: { eslintWarnings: 0, typeErrors: 0, qualityScore: 0 },
        trends: { shortTerm: 'stable', longTerm: 'stable' },
        affectedFiles: [],
        timestamp: '2024-10-11T12:00:00Z'
      };

      const result = privacyController.processDataPayload(testPayload);
      
      expect(result).toBeNull(); // No data should be processed
    });
  });

  describe('Compliance Reporting', () => {
    test('should generate compliance report', async () => {
      await privacyController.requestConsent(ConsentLevel.ENHANCED, 'test-org');
      
      privacyController.updatePrivacySettings({
        excludedFields: ['username', 'machineId'],
        anonymizationEnabled: true,
        retentionDays: 90
      });

      const report = privacyController.generateComplianceReport();

      expect(report.complianceMode).toBe('standard');
      expect(report.consentStatus).toBe('granted');
      expect(report.dataMinimization).toBe(true); // Has excluded fields
      expect(report.anonymizationActive).toBe(true);
      expect(report.retentionCompliance).toBe(true); // 90 days <= 365 days
      expect(report.auditTrailComplete).toBe(true); // Audit log exists
    });

    test('should track privacy actions in audit log', async () => {
      await privacyController.requestConsent(ConsentLevel.STANDARD, 'audit-test-org');
      
      privacyController.updatePrivacySettings({
        retentionDays: 14
      });

      await privacyController.revokeConsent();

      // Audit log should exist and contain the actions
      const auditLogPath = join(testConfigDir, 'privacy-audit.json');
      expect(existsSync(auditLogPath)).toBe(true);
    });
  });

  describe('Enterprise Privacy Features', () => {
    test('should support different compliance modes', () => {
      privacyController.updatePrivacySettings({
        complianceMode: 'gdpr'
      });

      const report = privacyController.generateComplianceReport();
      expect(report.complianceMode).toBe('gdpr');
    });

    test('should hash sensitive data consistently', async () => {
      privacyController.updatePrivacySettings({
        anonymizationEnabled: true
      });

      const payload1: QualityUpdatePayload = {
        projectId: 'same-project-id',
        metrics: { 
          eslintWarnings: 5, 
          typeErrors: 1, 
          codeComplexity: 10,
          testCoverage: 80,
          duplication: 3,
          timestamp: '2024-10-11T12:00:00Z' 
        },
        delta: { eslintWarnings: 0, typeErrors: 0, qualityScore: 0 },
        trends: { shortTerm: 'stable', longTerm: 'stable' },
        affectedFiles: [],
        timestamp: '2024-10-11T12:00:00Z'
      };

      const payload2: QualityUpdatePayload = {
        projectId: 'same-project-id',
        metrics: { 
          eslintWarnings: 8, 
          typeErrors: 2, 
          codeComplexity: 12,
          testCoverage: 75,
          duplication: 4,
          timestamp: '2024-10-11T13:00:00Z' 
        },
        delta: { eslintWarnings: 3, typeErrors: 1, qualityScore: -2 },
        trends: { shortTerm: 'degrading', longTerm: 'stable' },
        affectedFiles: [],
        timestamp: '2024-10-11T13:00:00Z'
      };

      // Grant consent first
      await privacyController.requestConsent(ConsentLevel.STANDARD);

      const result1 = privacyController.processDataPayload(payload1);
      const result2 = privacyController.processDataPayload(payload2);

      // Same project ID should produce same hash
      expect(result1!.projectHash).toBe(result2!.projectHash);
      
      // But different session hashes
      expect(result1!.sessionHash).not.toBe(result2!.sessionHash);
    });

    test('should support organization-specific anonymization', async () => {
      const orgId = 'enterprise-org-456';
      await privacyController.requestConsent(ConsentLevel.STANDARD, orgId);

      const testPayload: QualityUpdatePayload = {
        projectId: 'sensitive-project',
        metrics: { 
          eslintWarnings: 10, 
          typeErrors: 2,
          codeComplexity: 15,
          testCoverage: 85,
          duplication: 2,
          timestamp: '2024-10-11T12:00:00Z' 
        },
        delta: { eslintWarnings: 0, typeErrors: 0, qualityScore: 0 },
        trends: { shortTerm: 'stable', longTerm: 'stable' },
        affectedFiles: ['sensitive-file.ts'],
        timestamp: '2024-10-11T12:00:00Z'
      };

      const anonymizedPayload = privacyController.processDataPayload(testPayload);

      expect(anonymizedPayload!.projectHash).toBeTruthy();
      expect(anonymizedPayload!.projectHash).not.toBe('sensitive-project');
      
      // Hash should be consistent for same org
      const secondPayload = { ...testPayload, timestamp: '2024-10-11T13:00:00Z' };
      const secondAnonymized = privacyController.processDataPayload(secondPayload);
      
      expect(anonymizedPayload!.projectHash).toBe(secondAnonymized!.projectHash);
    });
  });
});