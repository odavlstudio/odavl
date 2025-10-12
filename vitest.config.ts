import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    include: [
      'apps/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}',
      'tests/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'
    ],
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      '**/.next/**',
      '**/out/**',
      '**/reports/**',
      'odavl-website/**'
    ],
    testTimeout: 30000,
    hookTimeout: 10000,
    coverage: {
      provider: 'v8',
      include: [
        'apps/cli/src/**/*.ts',
        'apps/vscode-ext/src/**/*.ts',
        'tools/**/*.ps1'
      ],
      exclude: [
        '**/*.d.ts',
        '**/*.config.*',
        '**/node_modules/**',
        '**/dist/**',
        '**/*.test.*',
        '**/*.spec.*',
        '**/common.ps1'
      ],
      reporter: ['json', 'lcov', 'text-summary', 'html'],
      reportsDirectory: 'reports/forensic/_last/tests',
      clean: true,
      thresholds: {
        lines: 70,
        functions: 70,
        branches: 60,
        statements: 70
      }
    },
    reporters: ['verbose', 'json'],
    outputFile: {
      json: 'reports/test-results.json'
    }
  }
})