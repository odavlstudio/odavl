/**
 * Tests for file-naming utilities
 */

import { describe, it, expect } from 'vitest';
import {
  formatTimestampForFilename,
  sanitizeForFilename,
  generateRunId,
  parseRunId,
  generateMetricsFilename,
  generateUndoFilename
} from '../src/utils/file-naming';

describe('formatTimestampForFilename', () => {
  it('should format date as YYYY-MM-DDTHH-mm-ss', () => {
    const date = new Date('2024-11-24T14:30:45.123Z');
    const result = formatTimestampForFilename(date);

    expect(result).toBe('2024-11-24T14-30-45');
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}$/);
  });

  it('should handle current date by default', () => {
    const result = formatTimestampForFilename();
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}$/);
  });
});

describe('sanitizeForFilename', () => {
  it('should remove special characters', () => {
    expect(sanitizeForFilename('fix-typescript-errors!')).toBe('fix-typescript-errors');
    expect(sanitizeForFilename('Hello World 123')).toBe('hello-world-123');
    expect(sanitizeForFilename('test@#$%file')).toBe('test-file');
  });

  it('should handle multiple dashes', () => {
    expect(sanitizeForFilename('foo---bar')).toBe('foo-bar');
    expect(sanitizeForFilename('---test---')).toBe('test');
  });

  it('should truncate long strings', () => {
    const longString = 'a'.repeat(100);
    const result = sanitizeForFilename(longString);
    expect(result.length).toBeLessThanOrEqual(50);
  });

  it('should convert to lowercase', () => {
    expect(sanitizeForFilename('FixTypeScriptErrors')).toBe('fixtypescripterrors');
  });
});

describe('generateRunId', () => {
  it('should generate timestamp-only runId when no recipe name', () => {
    const runId = generateRunId();
    expect(runId).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}$/);
  });

  it('should include recipe name when provided', () => {
    const runId = generateRunId('fix-typescript-errors');
    expect(runId).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}-fix-typescript-errors$/);
  });

  it('should sanitize recipe name', () => {
    const runId = generateRunId('Fix TypeScript Errors!');
    expect(runId).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}-fix-typescript-errors$/);
  });
});

describe('parseRunId', () => {
  it('should parse new format with recipe name', () => {
    const result = parseRunId('2024-11-24T14-30-45-fix-typescript-errors');

    expect(result.timestamp).toBeInstanceOf(Date);
    expect(result.recipeName).toBe('fix-typescript-errors');
    expect(result.timestamp?.getFullYear()).toBe(2024);
    expect(result.timestamp?.getMonth()).toBe(10); // November (0-indexed)
    expect(result.timestamp?.getDate()).toBe(24);
    expect(result.timestamp?.getHours()).toBe(14);
    expect(result.timestamp?.getMinutes()).toBe(30);
    expect(result.timestamp?.getSeconds()).toBe(45);
  });

  it('should parse new format without recipe name', () => {
    const result = parseRunId('2024-11-24T14-30-45');

    expect(result.timestamp).toBeInstanceOf(Date);
    expect(result.recipeName).toBeNull();
  });

  it('should parse legacy format', () => {
    const result = parseRunId('run-1700841045123');

    expect(result.timestamp).toBeInstanceOf(Date);
    expect(result.recipeName).toBeNull();
    expect(result.timestamp?.getTime()).toBe(1700841045123);
  });

  it('should handle invalid format', () => {
    const result = parseRunId('invalid-format');

    expect(result.timestamp).toBeNull();
    expect(result.recipeName).toBeNull();
  });
});

describe('generateMetricsFilename', () => {
  it('should append .json extension', () => {
    const filename = generateMetricsFilename('2024-11-24T14-30-45-fix-typescript-errors');
    expect(filename).toBe('2024-11-24T14-30-45-fix-typescript-errors.json');
  });
});

describe('generateUndoFilename', () => {
  it('should generate timestamp-based filename', () => {
    const filename = generateUndoFilename();
    expect(filename).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}\.json$/);
  });
});
