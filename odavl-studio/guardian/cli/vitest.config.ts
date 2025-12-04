/**
 * @file vitest.config.ts
 * @description Vitest configuration for Guardian CLI testing
 * @target Coverage: >85% (lines, functions, branches, statements)
 */

import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    // ============================================================================
    // Test Environment Configuration
    // ============================================================================
    globals: true,
    environment: 'node',
    
    // ============================================================================
    // Test File Patterns
    // ============================================================================
    include: ['__tests__/**/*.test.ts'],
    exclude: [
      'node_modules/**',
      'dist/**',
      '**/*.d.ts',
      '**/*.config.*',
    ],

    // ============================================================================
    // Coverage Configuration (v8 provider - faster than istanbul)
    // ============================================================================
    coverage: {
      provider: 'v8',
      reporter: [
        'text',        // Console output
        'text-summary', // Brief summary
        'html',        // HTML report in coverage/
        'lcov',        // For CI/CD integration
        'json',        // Machine-readable
      ],
      
      // Coverage Thresholds (STRICT - must maintain >85%)
      thresholds: {
        lines: 85,
        functions: 85,
        branches: 80,
        statements: 85,
      },

      // Files to include in coverage
      include: [
        'guardian.ts',
        'impact-analyzer.ts',
        'universal-detector.ts',
        'odavl-context.ts',
      ],

      // Files to exclude from coverage
      exclude: [
        'node_modules/**',
        'dist/**',
        '__tests__/**',
        '**/*.test.ts',
        '**/*.spec.ts',
        '**/*.d.ts',
        '**/*.config.*',
        '**/types.ts',
      ],

      // Report all files (even if not imported in tests)
      all: true,

      // Clean coverage directory before each run
      clean: true,
    },

    // ============================================================================
    // Test Execution Configuration
    // ============================================================================
    
    // Timeout for individual tests (30 seconds for heavy operations)
    testTimeout: 30000,

    // Timeout for hooks (beforeAll, afterAll, etc.)
    hookTimeout: 10000,

    // Number of retry attempts for flaky tests
    retry: 1,

    // Bail on first test failure (useful for debugging)
    // bail: 1,

    // ============================================================================
    // Reporter Configuration
    // ============================================================================
    reporters: [
      'default',    // Standard console output
      'verbose',    // Detailed test results
      'html',       // HTML report
    ],

    // ============================================================================
    // Mock Configuration
    // ============================================================================
    clearMocks: true,
    mockReset: true,
    restoreMocks: true,

    // ============================================================================
    // Performance & Optimization
    // ============================================================================
    
    // Run tests in parallel (faster)
    threads: true,
    
    // Number of threads (auto-detect CPU cores)
    maxThreads: undefined,
    minThreads: undefined,

    // Isolate tests in separate threads
    isolate: true,

    // ============================================================================
    // Watch Mode Configuration
    // ============================================================================
    watch: false,
    watchExclude: [
      'node_modules/**',
      'dist/**',
      'coverage/**',
    ],
  },

  // ============================================================================
  // Module Resolution
  // ============================================================================
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './'),
      '@tests': path.resolve(__dirname, './__tests__'),
    },
  },

  // ============================================================================
  // Build Configuration (for ESM support)
  // ============================================================================
  esbuild: {
    target: 'node18',
  },
});
