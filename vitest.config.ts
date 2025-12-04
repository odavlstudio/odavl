import { defineConfig } from 'vitest/config'
import path from 'node:path'

export default defineConfig({
    resolve: {
        alias: {
            '@odavl-studio/insight-core/detector': path.resolve(__dirname, 'odavl-studio/insight/core/dist/detector/index.mjs'),
            '@odavl-studio/insight-core': path.resolve(__dirname, 'odavl-studio/insight/core/dist/index.mjs'),
            '@odavl-studio/autopilot-engine': path.resolve(__dirname, 'odavl-studio/autopilot/engine/src'),
        }
    },
    test: {
        include: [
            'apps/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}',
            'tests/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}',
            'odavl-studio/insight/core/tests/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'
        ],
        exclude: [
            '**/node_modules/**',
            '**/dist/**',
            '**/.next/**',
            '**/out/**',
            '**/reports/**',
            'odavl-website/**',
            '**/playwright.config.ts'
        ],
        setupFiles: ['./tests/setup.ts'],
        testTimeout: 30000,
        hookTimeout: 10000,
        
        // Snapshot configuration
        snapshotFormat: {
            printBasicPrototype: false,  // Don't print [Object] prototype
            escapeString: false,          // Keep strings readable
            indent: 2,                    // 2-space indentation
            min: false,                   // Don't minify snapshots
            callToJSON: true,             // Use toJSON() if available
            maxDepth: 10,                 // Max nesting depth
            printFunctionName: true,      // Include function names
        },
        
        coverage: {
            provider: 'istanbul',
            enabled: true,
            include: [
                // Core products
                'odavl-studio/insight/core/src/**/*.ts',
                'odavl-studio/autopilot/engine/src/**/*.ts',
                'odavl-studio/guardian/core/src/**/*.ts',
                'odavl-studio/guardian/workers/src/**/*.ts',
                
                // Apps
                'apps/studio-cli/src/**/*.ts',
                
                // Packages
                'packages/sdk/src/**/*.ts',
                'packages/core/src/**/*.ts',
                'packages/auth/src/**/*.ts'
            ],
            exclude: [
                '**/*.d.ts',
                '**/*.config.*',
                '**/node_modules/**',
                '**/dist/**',
                '**/*.test.*',
                '**/*.spec.*',
                '**/*.ps1',
                '**/training.ts',  // ML training scripts
                '**/__tests__/**'
            ],
            reporter: ['json', 'lcov', 'text-summary', 'html'],
            reportsDirectory: 'coverage',
            clean: true,
            thresholds: {
                statements: 3,   // Current: 3.62%
                branches: 1.5,   // Current: 1.8%
                functions: 3,    // Current: 3.06%
                lines: 3         // Current: 3.72%
            }
        },
        reporters: ['verbose', 'json'],
        outputFile: {
            json: 'reports/test-results.json'
        }
    }
})
