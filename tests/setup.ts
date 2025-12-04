/**
 * Vitest Global Setup
 * Ensures .odavl/ infrastructure exists before tests run
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import { beforeAll, afterAll } from 'vitest';

// WebSocket polyfill for Node.js environment
if (typeof globalThis.WebSocket === 'undefined') {
    // Simple WebSocket mock for tests
    class WebSocketMock {
        static CONNECTING = 0;
        static OPEN = 1;
        static CLOSING = 2;
        static CLOSED = 3;

        readyState = WebSocketMock.OPEN;

        constructor(public url: string) { }
        send(_data: string | Buffer) { }
        close() { this.readyState = WebSocketMock.CLOSED; }
        addEventListener(_event: string, _handler: Function) { }
        removeEventListener(_event: string, _handler: Function) { }
    }

    (globalThis as any).WebSocket = WebSocketMock;
}

const ROOT = process.cwd();
const ODAVL_DIR = path.join(ROOT, '.odavl');

/**
 * Creates .odavl/ directory structure required by tests
 */
export function setupOdavlInfrastructure() {
    const dirs = [
        ODAVL_DIR,
        path.join(ODAVL_DIR, 'recipes'),
        path.join(ODAVL_DIR, 'undo'),
        path.join(ODAVL_DIR, 'attestation'),
        path.join(ODAVL_DIR, 'ledger'),
        path.join(ODAVL_DIR, 'logs'),
        path.join(ODAVL_DIR, 'audit'),
    ];

    dirs.forEach(dir => {
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
    });

    // Create 5 core recipe files
    const recipes = [
        {
            id: 'typescript-fixer',
            name: 'TypeScript Error Fixer',
            description: 'Fixes common TypeScript errors',
            trust: 0.85,
            priority: 8,
            condition: {
                type: 'threshold',
                rules: [{ metric: 'typeErrors', operator: '>=', value: 3 }]
            },
            actions: [{ type: 'shell', command: 'pnpm exec tsc --noEmit', description: 'Run TypeScript compiler' }]
        },
        {
            id: 'import-cleaner',
            name: 'Import Cleaner',
            description: 'Removes unused imports',
            trust: 0.5,
            priority: 6,
            condition: {
                type: 'threshold',
                rules: [{ metric: 'unusedImports', operator: '>=', value: 5 }]
            },
            actions: [{ type: 'shell', command: 'pnpm exec eslint . --fix', description: 'Clean imports' }]
        },
        {
            id: 'security-hardening',
            name: 'Security Hardening',
            description: 'Fixes security vulnerabilities',
            trust: 0.95,
            priority: 10,
            condition: {
                type: 'threshold',
                rules: [{ metric: 'securityIssues', operator: '>=', value: 1 }]
            },
            actions: [{ type: 'shell', command: 'pnpm audit --fix', description: 'Fix security issues' }]
        },
        {
            id: 'remove-unused',
            name: 'Remove Unused Code',
            description: 'Removes unused variables and imports',
            trust: 0.70,
            priority: 5,
            condition: {
                type: 'threshold',
                rules: [{ metric: 'eslintWarnings', operator: '>=', value: 10 }]
            },
            actions: [{ type: 'shell', command: 'pnpm -s exec eslint . --fix', description: 'Remove unused code' }]
        },
        {
            id: 'esm-hygiene',
            name: 'ESM Hygiene',
            description: 'Ensures proper ESM module structure',
            trust: 0.80,
            priority: 7,
            condition: {
                type: 'threshold',
                rules: [{ metric: 'esmIssues', operator: '>=', value: 1 }]
            },
            actions: [{ type: 'shell', command: 'pnpm -s exec eslint . --fix', description: 'Fix ESM issues' }]
        }
    ];

    const recipesDir = path.join(ODAVL_DIR, 'recipes');
    recipes.forEach(recipe => {
        const recipePath = path.join(recipesDir, `${recipe.id}.json`);
        if (!fs.existsSync(recipePath)) {
            fs.writeFileSync(recipePath, JSON.stringify(recipe, null, 2), 'utf8');
        }
    });

    // Create recipes-trust.json with sample data including blacklisted property
    const trustPath = path.join(ODAVL_DIR, 'recipes-trust.json');
    if (!fs.existsSync(trustPath)) {
        const trustData = recipes.map(r => ({
            id: r.id,
            runs: 10,
            success: Math.floor(r.trust * 10),
            trust: r.trust,
            consecutiveFailures: 0,
            blacklisted: false
        }));
        fs.writeFileSync(trustPath, JSON.stringify(trustData, null, 2), 'utf8');
    }

    // Create empty history.json if it doesn't exist
    const historyPath = path.join(ODAVL_DIR, 'history.json');
    if (!fs.existsSync(historyPath)) {
        // Add a sample history entry for integration tests
        const sampleHistory = [{
            timestamp: new Date().toISOString(),
            recipeId: 'sample-recipe',
            success: true,
            improvement: {
                eslint: 5,
                typescript: 3,
                total: 8
            }
        }];
        fs.writeFileSync(historyPath, JSON.stringify(sampleHistory, null, 2), 'utf8');
    }

    // Create default gates.yml if it doesn't exist
    const gatesPath = path.join(ODAVL_DIR, 'gates.yml');
    if (!fs.existsSync(gatesPath)) {
        const defaultGates = `# ODAVL Quality Gates
version: "1.0"
risk_budget: 100
forbidden_paths:
  - "security/**"
  - "public-api/**"
  - "**/*.spec.*"
  - "**/*.test.*"
  - "auth/**"
actions:
  max_auto_changes: 10
  max_files_per_cycle: 10
enforcement:
  - block_if_risk_exceeded
  - rollback_on_failure
  - require_attestation
thresholds:
  max_risk_per_action: 25
  min_success_rate: 0.75
  max_consecutive_failures: 3
`;
        fs.writeFileSync(gatesPath, defaultGates, 'utf8');
    }
}

// Run setup before all tests
beforeAll(() => {
    setupOdavlInfrastructure();
});

// Optional: Clean up test artifacts after all tests
afterAll(() => {
    // Keep .odavl/ for manual inspection - don't delete
    // Tests should clean up their own temporary files
});
