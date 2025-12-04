// Vitest configuration for ODAVL Studio Hub
// Tests Next.js components, API routes, and utilities

import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    // Test environment
    environment: 'jsdom',

    // Global setup files
    setupFiles: ['./tests/setup.ts'],

    // Coverage configuration
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      reportsDirectory: './coverage',
      include: [
        'app/**/*.{ts,tsx}',
        'components/**/*.{ts,tsx}',
        'lib/**/*.{ts,tsx}',
        'server/**/*.{ts,tsx}',
      ],
      exclude: [
        'node_modules/',
        'tests/',
        '**/*.d.ts',
        '**/*.config.*',
        '**/dist/',
        '**/build/',
        '**/.next/',
        'app/api/trpc/[trpc]/route.ts', // tRPC adapter
        'prisma/',
      ],
      // Coverage thresholds (increased to 80% for production readiness)
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 75,
        statements: 80,
      },
    },

    // Test patterns
    include: [
      'tests/unit/**/*.{test,spec}.{ts,tsx}',
      'tests/integration/**/*.{test,spec}.{ts,tsx}',
      'app/**/*.{test,spec}.{ts,tsx}',
      'components/**/*.{test,spec}.{ts,tsx}',
      'lib/**/*.{test,spec}.{ts,tsx}',
    ],

    // Exclude E2E tests (run with Playwright separately)
    exclude: [
      'tests/e2e/**',
      'node_modules/',
      'dist/',
      '.next/',
    ],

    // Globals for Jest-like API
    globals: true,

    // Test timeout (30 seconds)
    testTimeout: 30000,

    // Pool options for parallel testing
    pool: 'threads',

    // Mock reset behavior
    mockReset: true,
    restoreMocks: true,
    clearMocks: true,
  },

  resolve: {
    alias: {
      '@': path.resolve(__dirname, './'),
      '~': path.resolve(__dirname, './'),
    },
  },
});
