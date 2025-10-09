import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    include: [
      'apps/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'
    ],
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      '**/.next/**',
      '**/out/**',
      '**/reports/**',
      'odavl-website/**'
    ],
    coverage: {
      provider: 'v8',
      include: [
        'apps/cli/src/**/*.ts',
        'apps/vscode-ext/src/**/*.ts'
      ],
      exclude: [
        '**/*.d.ts',
        '**/*.config.*',
        '**/node_modules/**',
        '**/dist/**',
        '**/*.test.*',
        '**/*.spec.*'
      ],
      reporter: ['json', 'lcov', 'text-summary'],
      reportsDirectory: 'reports/forensic/_last/tests',
      clean: true
    }
  }
})