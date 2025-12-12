/**
 * ODAVL Autopilot Core - Fix Engine
 * Wave 6 - Deterministic pattern matching for 7 fix types
 */

import type { FixRule, FixPatch } from './types';

// Safety constant - never auto-fix critical issues
export const EXCLUDED_SEVERITIES = ['critical'];
export const MAX_FIXES_PER_RUN = 20;

/**
 * Deterministic fix rules
 * Each rule transforms a specific issue type into a code patch
 */
export const FIX_RULES: FixRule[] = [
  {
    name: 'Remove unused imports',
    detector: 'typescript',
    ruleIds: ['unused-import', '@typescript-eslint/no-unused-vars'],
    confidence: 0.95,
    transform: (issue, fileContent) => {
      const lines = fileContent.split('\n');
      const line = lines[issue.line - 1];
      
      // Match TypeScript import statements
      if (line && /^\s*import\s+.*from\s+['"]/.test(line)) {
        return {
          file: issue.file,
          start: issue.line,
          end: issue.line,
          replacement: '',
          detector: 'typescript',
          ruleId: issue.ruleId,
          confidence: 0.95,
          originalText: line
        };
      }
      return null;
    }
  },
  {
    name: 'Remove unused variables',
    detector: 'typescript',
    ruleIds: ['unused-var', 'no-unused-vars'],
    confidence: 0.85,
    transform: (issue, fileContent) => {
      const lines = fileContent.split('\n');
      const line = lines[issue.line - 1];
      
      // Match variable declarations
      if (line && /^\s*(const|let|var)\s+\w+/.test(line)) {
        return {
          file: issue.file,
          start: issue.line,
          end: issue.line,
          replacement: '',
          detector: 'typescript',
          ruleId: issue.ruleId,
          confidence: 0.85,
          originalText: line
        };
      }
      return null;
    }
  },
  {
    name: 'Mask hardcoded secrets',
    detector: 'security',
    ruleIds: ['hardcoded-secret', 'hardcoded-api-key'],
    confidence: 0.90,
    transform: (issue, fileContent) => {
      const lines = fileContent.split('\n');
      const line = lines[issue.line - 1];
      
      // Match API_KEY = "..." or similar
      const match = line && line.match(/(.*=\s*["'])([^"']+)(["'].*)/);
      if (match) {
        return {
          file: issue.file,
          start: issue.line,
          end: issue.line,
          replacement: `${match[1]}***MASKED***${match[3]}`,
          detector: 'security',
          ruleId: issue.ruleId,
          confidence: 0.90,
          originalText: line
        };
      }
      return null;
    }
  },
  {
    name: 'Remove console.log in production',
    detector: 'typescript',
    ruleIds: ['no-console', 'console-log'],
    confidence: 0.80,
    transform: (issue, fileContent) => {
      const lines = fileContent.split('\n');
      const line = lines[issue.line - 1];
      
      // Match console.log/warn/error statements
      if (line && /console\.(log|warn|error)/.test(line)) {
        return {
          file: issue.file,
          start: issue.line,
          end: issue.line,
          replacement: '',
          detector: 'typescript',
          ruleId: issue.ruleId,
          confidence: 0.80,
          originalText: line
        };
      }
      return null;
    }
  },
  {
    name: 'Upgrade http to https',
    detector: 'security',
    ruleIds: ['insecure-http', 'http-url'],
    confidence: 0.75,
    transform: (issue, fileContent) => {
      const lines = fileContent.split('\n');
      const line = lines[issue.line - 1];
      
      // Replace http:// with https://
      if (line && line.includes('http://')) {
        return {
          file: issue.file,
          start: issue.line,
          end: issue.line,
          replacement: line.replace(/http:\/\//g, 'https://'),
          detector: 'security',
          ruleId: issue.ruleId,
          confidence: 0.75,
          originalText: line
        };
      }
      return null;
    }
  },
  {
    name: 'Parameterize Python SQL queries',
    detector: 'security',
    ruleIds: ['sql-injection', 'f-string-sql'],
    confidence: 0.70,
    transform: (issue, fileContent) => {
      const lines = fileContent.split('\n');
      const line = lines[issue.line - 1];
      
      // Match f-string SQL queries
      if (line && /f["']SELECT.*\{.*\}/.test(line)) {
        // Complex transformation - suggest manual review
        return {
          file: issue.file,
          start: issue.line,
          end: issue.line,
          replacement: line + ' # TODO: Use parameterized query',
          detector: 'security',
          ruleId: issue.ruleId,
          confidence: 0.70,
          originalText: line
        };
      }
      return null;
    }
  },
  {
    name: 'Replace Rust unwrap with expect',
    detector: 'rust',
    ruleIds: ['unwrap-used', 'rust-unwrap'],
    confidence: 0.80,
    transform: (issue, fileContent) => {
      const lines = fileContent.split('\n');
      const line = lines[issue.line - 1];
      
      // Replace .unwrap() with .expect("message")
      if (line && line.includes('.unwrap()')) {
        return {
          file: issue.file,
          start: issue.line,
          end: issue.line,
          replacement: line.replace(/\.unwrap\(\)/g, '.expect("Value should exist")'),
          detector: 'rust',
          ruleId: issue.ruleId,
          confidence: 0.80,
          originalText: line
        };
      }
      return null;
    }
  }
];

/**
 * Match issue to fix rule
 */
export function findMatchingRule(issue: any): FixRule | null {
  for (const rule of FIX_RULES) {
    if (rule.detector === issue.detector && 
        rule.ruleIds.some(ruleId => issue.ruleId?.includes(ruleId))) {
      return rule;
    }
  }
  return null;
}
