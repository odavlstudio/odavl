/**
 * Tests for SecureAuditLog
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { SecureAuditLog } from '../audit-log';
import crypto from 'crypto';

describe('SecureAuditLog', () => {
  let log: SecureAuditLog;
  const testSecret = 'test-secret-key-at-least-32-characters-long-12345';

  beforeEach(() => {
    log = new SecureAuditLog(testSecret);
  });

  describe('Constructor', () => {
    it('should create instance with valid secret', () => {
      expect(() => new SecureAuditLog(testSecret)).not.toThrow();
    });

    it('should throw error with short secret', () => {
      expect(() => new SecureAuditLog('short')).toThrow(
        /at least 32 characters/
      );
    });

    it('should throw error with empty secret', () => {
      expect(() => new SecureAuditLog('')).toThrow();
    });
  });

  describe('append()', () => {
    it('should add timestamp if missing', () => {
      const entry = log.append({ decision: 'approved' });
      const parsed = JSON.parse(entry);
      
      expect(parsed.timestamp).toBeDefined();
      expect(parsed.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    });

    it('should preserve existing timestamp', () => {
      const timestamp = '2024-11-15T14:30:00Z';
      const entry = log.append({ decision: 'approved', timestamp });
      const parsed = JSON.parse(entry);
      
      expect(parsed.timestamp).toBe(timestamp);
    });

    it('should add HMAC hash', () => {
      const entry = log.append({ decision: 'approved' });
      const parsed = JSON.parse(entry);
      
      expect(parsed.hash).toBeDefined();
      expect(parsed.hash).toMatch(/^[a-f0-9]{64}$/); // SHA-256 hex
    });

    it('should return JSONL format (with newline)', () => {
      const entry = log.append({ decision: 'approved' });
      
      expect(entry.endsWith('\n')).toBe(true);
    });

    it('should produce different hashes for different data', () => {
      const entry1 = log.append({ decision: 'approved' });
      const entry2 = log.append({ decision: 'rejected' });
      
      const parsed1 = JSON.parse(entry1);
      const parsed2 = JSON.parse(entry2);
      
      expect(parsed1.hash).not.toBe(parsed2.hash);
    });
  });

  describe('verify()', () => {
    it('should verify valid audit log', () => {
      const entry1 = log.append({ decision: 'approved' });
      const entry2 = log.append({ decision: 'rejected' });
      const fullLog = entry1 + entry2;
      
      expect(log.verify(fullLog)).toBe(true);
    });

    it('should reject tampered data', () => {
      const entry = log.append({ decision: 'approved' });
      const parsed = JSON.parse(entry);
      
      // Tamper with decision
      parsed.decision = 'rejected';
      const tamperedLog = JSON.stringify(parsed) + '\n';
      
      expect(log.verify(tamperedLog)).toBe(false);
    });

    it('should reject entry with wrong hash', () => {
      const entry = log.append({ decision: 'approved' });
      const parsed = JSON.parse(entry);
      
      // Replace hash with random value
      parsed.hash = 'a'.repeat(64);
      const tamperedLog = JSON.stringify(parsed) + '\n';
      
      expect(log.verify(tamperedLog)).toBe(false);
    });

    it('should reject entry without hash', () => {
      const entryWithoutHash = JSON.stringify({
        decision: 'approved',
        timestamp: new Date().toISOString()
      }) + '\n';
      
      expect(log.verify(entryWithoutHash)).toBe(false);
    });

    it('should handle empty log', () => {
      expect(log.verify('')).toBe(true);
    });

    it('should handle multiple entries', () => {
      let fullLog = '';
      for (let i = 0; i < 10; i++) {
        fullLog += log.append({ decision: i % 2 === 0 ? 'approved' : 'rejected' });
      }
      
      expect(log.verify(fullLog)).toBe(true);
    });
  });

  describe('verifyEntry()', () => {
    it('should verify valid entry', () => {
      const entryString = log.append({ decision: 'approved' });
      const entry = JSON.parse(entryString);
      
      expect(log.verifyEntry(entry)).toBe(true);
    });

    it('should reject invalid entry', () => {
      const entry = {
        decision: 'approved',
        timestamp: new Date().toISOString(),
        hash: 'invalid'
      };
      
      expect(log.verifyEntry(entry)).toBe(false);
    });
  });

  describe('parseLog()', () => {
    it('should extract entries without hashes', () => {
      const entry1 = log.append({ decision: 'approved', reason: 'high_trust' });
      const entry2 = log.append({ decision: 'rejected', reason: 'low_trust' });
      const fullLog = entry1 + entry2;
      
      const entries = SecureAuditLog.parseLog(fullLog);
      
      expect(entries).toHaveLength(2);
      expect(entries[0].decision).toBe('approved');
      expect(entries[1].decision).toBe('rejected');
      expect(entries[0]).not.toHaveProperty('hash');
      expect(entries[1]).not.toHaveProperty('hash');
    });

    it('should handle empty log', () => {
      const entries = SecureAuditLog.parseLog('');
      expect(entries).toHaveLength(0);
    });
  });

  describe('analyzeLog()', () => {
    it('should provide summary statistics', () => {
      let fullLog = '';
      fullLog += log.append({ decision: 'approved' });
      fullLog += log.append({ decision: 'approved' });
      fullLog += log.append({ decision: 'rejected' });
      
      const summary = SecureAuditLog.analyzLog(fullLog);
      
      expect(summary.totalEntries).toBe(3);
      expect(summary.firstEntry).toBeDefined();
      expect(summary.lastEntry).toBeDefined();
      expect(summary.decisionCounts).toEqual({
        approved: 2,
        rejected: 1
      });
    });

    it('should handle empty log', () => {
      const summary = SecureAuditLog.analyzLog('');
      
      expect(summary.totalEntries).toBe(0);
      expect(summary.firstEntry).toBeNull();
      expect(summary.lastEntry).toBeNull();
      expect(summary.decisionCounts).toEqual({});
    });
  });

  describe('Hash Consistency', () => {
    it('should produce same hash for same data', () => {
      const timestamp = '2024-11-15T14:30:00Z';
      const entry1 = log.append({ decision: 'approved', timestamp });
      const entry2 = log.append({ decision: 'approved', timestamp });
      
      const parsed1 = JSON.parse(entry1);
      const parsed2 = JSON.parse(entry2);
      
      expect(parsed1.hash).toBe(parsed2.hash);
    });

    it('should be deterministic (same input = same hash)', () => {
      const data = {
        decision: 'approved',
        reason: 'high_trust',
        runId: 'abc123',
        timestamp: '2024-11-15T14:30:00Z'
      };

      const hashes: string[] = [];
      for (let i = 0; i < 5; i++) {
        const entry = log.append(data);
        const parsed = JSON.parse(entry);
        hashes.push(parsed.hash);
      }

      // All hashes should be identical
      expect(new Set(hashes).size).toBe(1);
    });
  });
});
