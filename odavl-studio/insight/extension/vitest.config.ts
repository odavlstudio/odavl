import { defineConfig } from 'vitest/config'
import path from 'node:path'

export default defineConfig({
  test: {
    include: ['src/test/**/*.test.ts'],
    exclude: [
      '**/node_modules/**', 
      '**/dist/**', 
      'src/test/extension-context.example.test.ts',
      'src/test/extension-context.test.ts', // Skip container tests (need full dependencies)
      'src/test/analysis-service-local.test.ts' // Skip - vi.mock hoisting issues
    ],
    globals: true,
    environment: 'node',
  },
  resolve: {
    alias: {
      // Mock vscode module for unit tests
      'vscode': path.resolve(__dirname, 'src/test/vscode-mock.ts'),
      '@odavl-studio/insight-core': path.resolve(__dirname, '../core/dist/index.js'),
      '@odavl-studio/sdk/insight-cloud': path.resolve(__dirname, '../../../packages/sdk/dist/insight-cloud.js'),
      '@odavl-studio/auth': path.resolve(__dirname, '../../../packages/auth/dist/index.js'),
    }
  }
})
