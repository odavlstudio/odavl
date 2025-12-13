/**
 * Phase 2.2 Task 8: Privacy Sanitization Verification Tests
 * 
 * Tests that no sensitive data leaks (absolute paths, variable names, code snippets)
 */

import { 
  runSuite, 
  assert, 
  createTempWorkspace, 
  cleanupTempWorkspace,
} from './test-utils.js';
import { sanitizeForCloud } from '../../src/utils/privacy-sanitizer.js';
import type { DetectionIssue } from '@odavl/types';

export async function verifyPrivacySanitization() {
  const tests = [
    {
      name: 'Removes absolute file paths',
      fn: async () => {
        const issue: DetectionIssue = {
          id: 'test-1',
          type: 'security',
          severity: 'high',
          message: 'Security issue found',
          file: 'C:\\Users\\john\\projects\\my-app\\src\\index.ts',
          line: 10,
          column: 5,
          detectorId: 'security-detector',
        };
        
        const sanitized = sanitizeForCloud([issue]);
        
        assert(!sanitized[0].file.includes('C:\\'), 'Should not contain drive letter');
        assert(!sanitized[0].file.includes('Users'), 'Should not contain Users path');
        assert(!sanitized[0].file.includes('john'), 'Should not contain username');
        assert(sanitized[0].file.startsWith('src/'), 'Should start with relative path');
      },
    },
    
    {
      name: 'Removes workspace-relative paths correctly',
      fn: async () => {
        const issue: DetectionIssue = {
          id: 'test-2',
          type: 'typescript',
          severity: 'error',
          message: 'Type error',
          file: '/home/alice/workspace/project/libs/utils/helper.ts',
          line: 20,
          column: 10,
          detectorId: 'typescript-detector',
        };
        
        const sanitized = sanitizeForCloud([issue]);
        
        assert(!sanitized[0].file.includes('/home'), 'Should not contain home path');
        assert(!sanitized[0].file.includes('alice'), 'Should not contain username');
        assert(!sanitized[0].file.includes('workspace'), 'Should not contain workspace path');
        assert(sanitized[0].file.includes('libs/utils'), 'Should retain project structure');
      },
    },
    
    {
      name: 'Does not leak variable names in messages',
      fn: async () => {
        const issue: DetectionIssue = {
          id: 'test-3',
          type: 'complexity',
          severity: 'warning',
          message: 'Variable "userPasswordHash" has complex type',
          file: 'src/auth.ts',
          line: 15,
          column: 8,
          detectorId: 'complexity-detector',
        };
        
        const sanitized = sanitizeForCloud([issue]);
        
        // Sanitizer should either remove variable name or anonymize it
        assert(
          !sanitized[0].message.includes('userPasswordHash') || 
          sanitized[0].message.includes('[REDACTED]'),
          'Should not leak variable name or should redact it'
        );
      },
    },
    
    {
      name: 'Does not leak code snippets',
      fn: async () => {
        const issue: DetectionIssue = {
          id: 'test-4',
          type: 'security',
          severity: 'critical',
          message: 'Hardcoded secret detected',
          file: 'src/config.ts',
          line: 8,
          column: 15,
          detectorId: 'security-detector',
          codeSnippet: 'const API_KEY = "sk-1234567890abcdef";',
        };
        
        const sanitized = sanitizeForCloud([issue]);
        
        // Code snippets should be removed entirely
        assert(
          !sanitized[0].codeSnippet || sanitized[0].codeSnippet === '[REDACTED]',
          'Should not include code snippet'
        );
      },
    },
    
    {
      name: 'Preserves relative file structure',
      fn: async () => {
        const issue: DetectionIssue = {
          id: 'test-5',
          type: 'import',
          severity: 'error',
          message: 'Import cycle detected',
          file: 'packages/core/src/utils/logger.ts',
          line: 5,
          column: 1,
          detectorId: 'import-detector',
        };
        
        const sanitized = sanitizeForCloud([issue]);
        
        assert(sanitized[0].file === 'packages/core/src/utils/logger.ts', 
          'Should preserve relative path structure');
      },
    },
    
    {
      name: 'Sanitizes multiple issues consistently',
      fn: async () => {
        const issues: DetectionIssue[] = [
          {
            id: 'test-6a',
            type: 'typescript',
            severity: 'error',
            message: 'Type error',
            file: '/Users/bob/dev/myapp/src/index.ts',
            line: 10,
            column: 5,
            detectorId: 'typescript-detector',
          },
          {
            id: 'test-6b',
            type: 'typescript',
            severity: 'error',
            message: 'Type error',
            file: '/Users/bob/dev/myapp/src/utils.ts',
            line: 20,
            column: 8,
            detectorId: 'typescript-detector',
          },
        ];
        
        const sanitized = sanitizeForCloud(issues);
        
        assert(!sanitized[0].file.includes('bob'), 'First issue should not leak username');
        assert(!sanitized[1].file.includes('bob'), 'Second issue should not leak username');
        assert(sanitized[0].file.startsWith('src/'), 'First issue should have relative path');
        assert(sanitized[1].file.startsWith('src/'), 'Second issue should have relative path');
      },
    },
    
    {
      name: 'Handles Windows-style paths',
      fn: async () => {
        const issue: DetectionIssue = {
          id: 'test-7',
          type: 'security',
          severity: 'high',
          message: 'Security issue',
          file: 'C:\\Projects\\MyApp\\src\\components\\Auth.tsx',
          line: 15,
          column: 10,
          detectorId: 'security-detector',
        };
        
        const sanitized = sanitizeForCloud([issue]);
        
        assert(!sanitized[0].file.includes('C:\\'), 'Should not contain drive letter');
        assert(!sanitized[0].file.includes('\\'), 'Should convert backslashes to forward slashes');
        assert(sanitized[0].file.includes('src/components'), 'Should preserve directory structure');
      },
    },
    
    {
      name: 'Handles Unix-style paths',
      fn: async () => {
        const issue: DetectionIssue = {
          id: 'test-8',
          type: 'performance',
          severity: 'warning',
          message: 'Performance issue',
          file: '/home/user/workspace/app/lib/database.js',
          line: 25,
          column: 12,
          detectorId: 'performance-detector',
        };
        
        const sanitized = sanitizeForCloud([issue]);
        
        assert(!sanitized[0].file.includes('/home'), 'Should not contain home directory');
        assert(!sanitized[0].file.includes('user'), 'Should not contain username');
        assert(sanitized[0].file.includes('lib/database'), 'Should preserve structure');
      },
    },
    
    {
      name: 'Validates sanitized output structure',
      fn: async () => {
        const issue: DetectionIssue = {
          id: 'test-9',
          type: 'typescript',
          severity: 'error',
          message: 'Type error',
          file: 'src/app.ts',
          line: 10,
          column: 5,
          detectorId: 'typescript-detector',
        };
        
        const sanitized = sanitizeForCloud([issue]);
        
        assert(sanitized.length === 1, 'Should have one sanitized issue');
        assert(typeof sanitized[0].id === 'string', 'ID should be string');
        assert(typeof sanitized[0].type === 'string', 'Type should be string');
        assert(typeof sanitized[0].severity === 'string', 'Severity should be string');
        assert(typeof sanitized[0].message === 'string', 'Message should be string');
        assert(typeof sanitized[0].file === 'string', 'File should be string');
        assert(typeof sanitized[0].line === 'number', 'Line should be number');
        assert(typeof sanitized[0].column === 'number', 'Column should be number');
      },
    },
    
    {
      name: 'Handles empty issue array',
      fn: async () => {
        const sanitized = sanitizeForCloud([]);
        
        assert(Array.isArray(sanitized), 'Should return array');
        assert(sanitized.length === 0, 'Should be empty array');
      },
    },
    
    {
      name: 'Preserves issue metadata (severity, type, line, column)',
      fn: async () => {
        const issue: DetectionIssue = {
          id: 'test-11',
          type: 'security',
          severity: 'critical',
          message: 'Critical security issue',
          file: '/var/www/app/src/auth.ts',
          line: 42,
          column: 18,
          detectorId: 'security-detector',
        };
        
        const sanitized = sanitizeForCloud([issue]);
        
        assert(sanitized[0].id === issue.id, 'ID should be preserved');
        assert(sanitized[0].type === issue.type, 'Type should be preserved');
        assert(sanitized[0].severity === issue.severity, 'Severity should be preserved');
        assert(sanitized[0].line === issue.line, 'Line should be preserved');
        assert(sanitized[0].column === issue.column, 'Column should be preserved');
        assert(sanitized[0].detectorId === issue.detectorId, 'DetectorId should be preserved');
      },
    },
    
    {
      name: 'Does not leak environment variables in messages',
      fn: async () => {
        const issue: DetectionIssue = {
          id: 'test-12',
          type: 'security',
          severity: 'critical',
          message: 'Environment variable DATABASE_URL contains sensitive data',
          file: 'src/config.ts',
          line: 10,
          column: 5,
          detectorId: 'security-detector',
        };
        
        const sanitized = sanitizeForCloud([issue]);
        
        // Message should be sanitized or generalized
        assert(
          !sanitized[0].message.includes('DATABASE_URL') || 
          sanitized[0].message.includes('[REDACTED]') ||
          sanitized[0].message.includes('environment variable'),
          'Should not leak specific environment variable names or should redact them'
        );
      },
    },
  ];

  return await runSuite('Privacy Sanitization Verification', tests);
}

// Run if executed directly
if (import.meta.url === `file:///${process.argv[1].replace(/\\/g, '/')}`) {
  verifyPrivacySanitization().then(() => process.exit(0)).catch(() => process.exit(1));
}
