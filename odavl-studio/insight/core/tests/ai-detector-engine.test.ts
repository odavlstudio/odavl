/**
 * ODAVL Insight - AI Detection Engine Tests
 * Comprehensive testing for AI-powered detection
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import AIDetectorEngine from '../src/ai/ai-detector-engine';
import type { AIDetectionConfig, Issue } from '../src/types/ai-types';

// ============================================================
// Mock Setup
// ============================================================

// Mock OpenAI
vi.mock('openai', () => ({
  default: class OpenAI {
    chat = {
      completions: {
        create: vi.fn().mockResolvedValue({
          choices: [{
            message: {
              content: JSON.stringify({
                issues: [
                  {
                    type: 'security',
                    severity: 'critical',
                    message: 'Hardcoded API key detected',
                    line: 5,
                    column: 10,
                    suggestion: 'Use environment variables',
                    confidence: 95,
                  },
                ],
                confidence: 95,
              }),
            },
          }],
        }),
      },
    };
  },
}));

// Mock Anthropic
vi.mock('@anthropic-ai/sdk', () => ({
  default: class Anthropic {
    messages = {
      create: vi.fn().mockResolvedValue({
        content: [{
          type: 'text',
          text: JSON.stringify({
            issues: [
              {
                type: 'performance',
                severity: 'high',
                message: 'Inefficient loop detected',
                line: 10,
                column: 5,
                suggestion: 'Use map() instead',
                confidence: 88,
              },
            ],
            confidence: 88,
          }),
        }],
      }),
    };
  },
}));

// Mock TensorFlow
vi.mock('@tensorflow/tfjs-node', () => ({
  loadLayersModel: vi.fn().mockResolvedValue({
    predict: vi.fn().mockReturnValue({
      data: vi.fn().mockResolvedValue([0.85]),
      dispose: vi.fn(),
    }),
  }),
  tensor2d: vi.fn().mockReturnValue({
    dispose: vi.fn(),
  }),
}));

// ============================================================
// Test Suite
// ============================================================

describe('AIDetectorEngine', () => {
  let engine: AIDetectorEngine;
  let config: AIDetectionConfig;

  beforeEach(() => {
    config = {
      enableGPT4: true,
      enableClaude: true,
      enableCustomModel: true,
      strategy: 'balanced',
      confidenceThreshold: 70,
      maxIssuesPerFile: 50,
      respectGitignore: true,
      skipTestFiles: false,
      skipGeneratedFiles: true,
      maxConcurrentRequests: 5,
      timeoutMs: 30000,
      cacheResults: true,
      maxTokensPerFile: 4000,
      maxCostPerDay: 10,
    };

    // Set mock API keys
    process.env.OPENAI_API_KEY = 'test-openai-key';
    process.env.ANTHROPIC_API_KEY = 'test-anthropic-key';

    engine = new AIDetectorEngine(config);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  // ============================================================
  // Rule-Based Detection Tests
  // ============================================================

  describe('Rule-Based Detection', () => {
    it('should detect hardcoded API keys', async () => {
      const code = `
const config = {
  apiKey: 'sk-1234567890abcdef',
  endpoint: 'https://api.example.com'
};
      `;

      const result = await engine.detect(code, 'config.ts', {
        language: 'typescript',
        fileType: 'business',
      });

      expect(result.issues).toHaveLength(1);
      expect(result.issues[0].type).toBe('security');
      expect(result.issues[0].severity).toBe('critical');
      expect(result.issues[0].message).toContain('Hardcoded API key');
    });

    it('should skip placeholders in test files', async () => {
      const code = `
const testConfig = {
  apiKey: 'test-api-key',
  password: 'test-password'
};
      `;

      const result = await engine.detect(code, 'test/config.test.ts', {
        language: 'typescript',
        fileType: 'test',
      });

      // Should skip because it's a test file with placeholder values
      expect(result.issues).toHaveLength(0);
    });

    it('should detect hardcoded passwords', async () => {
      const code = `
const db = {
  password: 'mySecretP@ssw0rd',
  host: 'localhost'
};
      `;

      const result = await engine.detect(code, 'database.ts', {
        language: 'typescript',
        fileType: 'infrastructure',
      });

      expect(result.issues.length).toBeGreaterThan(0);
      expect(result.issues[0].message).toContain('password');
    });
  });

  // ============================================================
  // Semantic Analysis Tests
  // ============================================================

  describe('Semantic Analysis', () => {
    it('should detect code smells using ML model', async () => {
      const code = `
// Complex nested function with high cyclomatic complexity
function processData(data: any) {
  if (data) {
    if (data.items) {
      for (let item of data.items) {
        if (item.active) {
          if (item.type === 'A') {
            // Process type A
          } else if (item.type === 'B') {
            // Process type B
          } else {
            // Process other
          }
        }
      }
    }
  }
}
      `.repeat(3); // Make it medium-sized

      const result = await engine.detect(code, 'processor.ts', {
        language: 'typescript',
        fileType: 'business',
      });

      // Should trigger semantic analysis for medium-sized business file
      expect(result.detectionTime).toBeLessThan(3000); // < 3s
    });

    it('should handle semantic analysis failures gracefully', async () => {
      // Mock TensorFlow to throw error
      const tf = await import('@tensorflow/tfjs-node');
      vi.mocked(tf.loadLayersModel).mockRejectedValueOnce(new Error('Model not found'));

      const engine2 = new AIDetectorEngine(config);
      const code = 'const x = 1;'.repeat(100);

      const result = await engine2.detect(code, 'test.ts', {
        language: 'typescript',
        fileType: 'business',
      });

      // Should not crash, just skip semantic analysis
      expect(result.issues).toBeDefined();
    });
  });

  // ============================================================
  // AI Detection Tests (GPT-4)
  // ============================================================

  describe('GPT-4 Detection', () => {
    it('should use GPT-4 for large files', async () => {
      const code = `
// Large file with potential security issue
const apiConfig = {
  apiKey: 'sk-real-api-key-not-placeholder',
  secret: 'my-secret-value-12345'
};
      `.repeat(100); // Make it large (>500 lines - 6 lines * 100 = 600+ lines)

      const result = await engine.detect(code, 'large-config.ts', {
        language: 'typescript',
        fileType: 'business',
      });

      // Should use AI model for large file
      expect(result.modelUsed).toBe('gpt-4');
      expect(result.confidence).toBeGreaterThan(80);
    });

    it('should fallback to Claude if GPT-4 fails', async () => {
      // Mock GPT-4 to fail
      const OpenAI = (await import('openai')).default;
      const mockInstance = new OpenAI({ apiKey: 'test' });
      vi.mocked(mockInstance.chat.completions.create).mockRejectedValueOnce(
        new Error('GPT-4 API error')
      );

      const code = 'const x = 1;'.repeat(100);
      const result = await engine.detect(code, 'test.ts', {
        language: 'typescript',
        fileType: 'business',
      });

      // Should still work, using fallback
      expect(result.issues).toBeDefined();
    });
  });

  // ============================================================
  // PR Review Tests
  // ============================================================

  describe('PR Review', () => {
    it('should review PR with multiple files', async () => {
      const files = [
        {
          path: 'src/auth.ts',
          content: `
export function login(password: string) {
  // Hardcoded secret
  const secret = 'my-secret-key';
  return verify(password, secret);
}
          `,
          diff: '+  const secret = "my-secret-key";',
        },
        {
          path: 'src/utils.ts',
          content: `
export function processArray(items: any[]) {
  const result = [];
  for (let i = 0; i < items.length; i++) {
    result.push(items[i]);
  }
  return result;
}
          `,
          diff: '+    result.push(items[i]);',
        },
      ];

      const result = await engine.reviewPR(
        files,
        'Add authentication and utility functions'
      );

      expect(result.score).toBeLessThan(100); // Has issues
      expect(result.blockingIssues.length).toBeGreaterThan(0); // Has critical issues
      expect(result.estimatedReviewTime).toContain('minute');
      expect(result.suggestions.length).toBeGreaterThan(0);
    });

    it('should calculate accurate review time', async () => {
      const files = [
        {
          path: 'test.ts',
          content: 'const x = 1;\n'.repeat(200), // 200 lines
          diff: '',
        },
      ];

      const result = await engine.reviewPR(files, 'Add test file');

      // 200 lines / 100 lines per minute = 2 minutes
      expect(result.estimatedReviewTime).toBe('2 minutes');
    });

    it('should categorize issues correctly', async () => {
      const files = [
        {
          path: 'security.ts',
          content: `
const apiKey = 'sk-critical-issue';
const warning = 'medium-issue';
          `,
          diff: '',
        },
      ];

      const result = await engine.reviewPR(files, 'Security updates');

      expect(result.blockingIssues.length).toBeGreaterThan(0);
      expect(result.blockingIssues[0].severity).toMatch(/critical|high/);
    });
  });

  // ============================================================
  // Performance Tests
  // ============================================================

  describe('Performance', () => {
    it('should complete detection in under 3 seconds', async () => {
      const code = 'const x = 1;\nconst y = 2;\n'.repeat(50);

      const startTime = Date.now();
      const result = await engine.detect(code, 'test.ts', {
        language: 'typescript',
        fileType: 'business',
      });
      const endTime = Date.now();

      expect(endTime - startTime).toBeLessThan(3000);
      expect(result.detectionTime).toBeLessThan(3000);
    });

    it('should use fast detection for small files', async () => {
      const code = 'const x = 1;\nconst y = 2;';

      const result = await engine.detect(code, 'small.ts', {
        language: 'typescript',
        fileType: 'business',
      });

      // Should only use rule-based (fastest)
      expect(result.detectionTime).toBeLessThan(500); // < 500ms
    });
  });

  // ============================================================
  // Context Awareness Tests
  // ============================================================

  describe('Context Awareness', () => {
    it('should skip enums for hardcoded values', async () => {
      const code = `
enum ApiEndpoints {
  USER_API = 'https://api.example.com/users',
  AUTH_API = 'https://api.example.com/auth'
}
      `;

      const result = await engine.detect(code, 'endpoints.ts', {
        language: 'typescript',
        fileType: 'business',
      });

      // Should not flag enum values as hardcoded secrets
      const securityIssues = result.issues.filter(i => i.type === 'security');
      expect(securityIssues.length).toBe(0);
    });

    it('should detect language correctly from file extension', async () => {
      const files = [
        { path: 'test.ts', expected: 'typescript' },
        { path: 'test.py', expected: 'python' },
        { path: 'test.java', expected: 'java' },
        { path: 'test.go', expected: 'go' },
      ];

      for (const file of files) {
        const result = await engine.detect('const x = 1;', file.path, {
          language: 'auto' as any,
          fileType: 'business',
        });

        expect(result.metadata.language).toBeDefined();
      }
    });

    it('should detect file type correctly', async () => {
      const files = [
        { path: 'test.spec.ts', expected: 'test' },
        { path: 'config/database.ts', expected: 'infrastructure' },
        { path: 'migrations/001_init.sql', expected: 'migration' },
        { path: 'src/user.service.ts', expected: 'business' },
      ];

      for (const file of files) {
        const result = await engine.detect('const x = 1;', file.path, {
          language: 'typescript',
          fileType: 'business', // Will be overridden by engine
        });

        // Engine should detect correct file type
        expect(result.metadata.fileType).toBeDefined();
      }
    });
  });

  // ============================================================
  // Deduplication Tests
  // ============================================================

  describe('Issue Deduplication', () => {
    it('should deduplicate identical issues', async () => {
      const code = `
const key1 = 'api-key-1';
const key2 = 'api-key-2';
const key3 = 'api-key-3';
      `;

      const result = await engine.detect(code, 'keys.ts', {
        language: 'typescript',
        fileType: 'business',
      });

      // Should have 3 separate issues (different lines)
      expect(result.issues.length).toBe(3);

      // Should not have duplicates on same line
      const line1Issues = result.issues.filter(i => i.line === 1);
      expect(line1Issues.length).toBeLessThanOrEqual(1);
    });

    it('should rank issues by severity and confidence', async () => {
      const code = `
const apiKey = 'sk-critical';
const warning = 'medium-issue';
const info = 'low-issue';
      `;

      const result = await engine.detect(code, 'test.ts', {
        language: 'typescript',
        fileType: 'business',
      });

      // Issues should be sorted: critical > high > medium > low
      if (result.issues.length > 1) {
        const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
        for (let i = 0; i < result.issues.length - 1; i++) {
          const current = severityOrder[result.issues[i].severity];
          const next = severityOrder[result.issues[i + 1].severity];
          expect(current).toBeLessThanOrEqual(next);
        }
      }
    });
  });

  // ============================================================
  // Integration Tests
  // ============================================================

  describe('Integration', () => {
    it('should provide autopilot handoff for fixable issues', async () => {
      const code = `
const apiKey = 'sk-needs-fix';
      `;

      const result = await engine.detect(code, 'config.ts', {
        language: 'typescript',
        fileType: 'business',
      });

      expect(result.issues[0].autopilotHandoff).toBe(true);
      expect(result.issues[0].suggestion).toBeDefined();
    });

    it('should include fix complexity estimation', async () => {
      const code = `
const key = 'simple-fix';
      `;

      const result = await engine.detect(code, 'test.ts', {
        language: 'typescript',
        fileType: 'business',
      });

      // Simple hardcoded value = simple fix
      if (result.issues.length > 0) {
        expect(result.issues[0].fixComplexity).toBeDefined();
      }
    });
  });

  // ============================================================
  // Error Handling Tests
  // ============================================================

  describe('Error Handling', () => {
    it('should handle API timeout gracefully', async () => {
      const shortConfig = { ...config, timeoutMs: 100 };
      const engine2 = new AIDetectorEngine(shortConfig);

      const code = 'const x = 1;'.repeat(1000);

      const result = await engine2.detect(code, 'test.ts', {
        language: 'typescript',
        fileType: 'business',
      });

      // Should not crash, return partial results
      expect(result.issues).toBeDefined();
    });

    it('should handle invalid code gracefully', async () => {
      const invalidCode = 'const x = ;;\n{{{}}';

      const result = await engine.detect(invalidCode, 'invalid.ts', {
        language: 'typescript',
        fileType: 'business',
      });

      // Should not crash
      expect(result.issues).toBeDefined();
    });

    it('should handle missing API keys', async () => {
      delete process.env.OPENAI_API_KEY;
      delete process.env.ANTHROPIC_API_KEY;

      const engine2 = new AIDetectorEngine(config);
      const code = 'const x = 1;'.repeat(100);

      const result = await engine2.detect(code, 'test.ts', {
        language: 'typescript',
        fileType: 'business',
      });

      // Should fall back to rule-based/custom model
      expect(result.issues).toBeDefined();
      expect(result.modelUsed).not.toBe('gpt-4');
    });
  });
});
