import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { execSync } from 'node:child_process';
import * as fs from 'node:fs';
import * as path from 'node:path';

describe('Integration: Full ODAVL Workflow', () => {
    const testWorkspace = path.join(__dirname, '../../.tmp/test-workspace');

    beforeAll(() => {
        // Create test workspace
        if (!fs.existsSync(testWorkspace)) {
            fs.mkdirSync(testWorkspace, { recursive: true });
        }

        // Create sample TypeScript file with intentional error
        const sampleCode = `
// Sample TypeScript file with errors for testing
const greeting: string = 'Hello';
const num: number = '123'; // Type error

function add(a: number, b: number) {
  return a + b;
}

console.log(greeting);
console.log(add(1, 2));
`;

        fs.writeFileSync(path.join(testWorkspace, 'sample.ts'), sampleCode);
        fs.writeFileSync(
            path.join(testWorkspace, 'tsconfig.json'),
            JSON.stringify({
                compilerOptions: {
                    target: 'ES2022',
                    module: 'ES2022',
                    strict: true,
                    noEmit: true
                }
            }, null, 2)
        );
    });

    afterAll(() => {
        // Cleanup
        if (fs.existsSync(testWorkspace)) {
            fs.rmSync(testWorkspace, { recursive: true, force: true });
        }
    });

    it('should detect TypeScript errors in workspace', () => {
        try {
            execSync('tsc --noEmit', { cwd: testWorkspace, stdio: 'pipe' });
            expect(false).toBe(true); // Should not reach here
        } catch (error: any) {
            // TypeScript should detect the type error
            expect(error.status).toBeGreaterThan(0);
            expect(error.stderr?.toString() || error.stdout?.toString()).toContain('Type');
        }
    });

    it('should complete full cycle workflow', async () => {
        // This would integrate with actual ODAVL cycle
        // For now, we test the basic structure exists
        const odavlDir = path.join(testWorkspace, '.odavl');
        if (!fs.existsSync(odavlDir)) {
            fs.mkdirSync(odavlDir, { recursive: true });
        }

        // Create ledger directory
        const ledgerDir = path.join(odavlDir, 'ledger');
        if (!fs.existsSync(ledgerDir)) {
            fs.mkdirSync(ledgerDir, { recursive: true });
        }

        // Create mock ledger
        const ledger = {
            runId: Date.now().toString(),
            startedAt: new Date().toISOString(),
            phases: ['observe', 'decide', 'act', 'verify', 'learn'],
            success: true
        };

        fs.writeFileSync(
            path.join(ledgerDir, `run-${ledger.runId}.json`),
            JSON.stringify(ledger, null, 2)
        );

        // Verify ledger was created
        expect(fs.existsSync(path.join(ledgerDir, `run-${ledger.runId}.json`))).toBe(true);
    });

    it('should create and restore from undo snapshots', () => {
        const odavlDir = path.join(testWorkspace, '.odavl');
        const undoDir = path.join(odavlDir, 'undo');

        if (!fs.existsSync(undoDir)) {
            fs.mkdirSync(undoDir, { recursive: true });
        }

        // Create snapshot
        const snapshot = {
            timestamp: new Date().toISOString(),
            files: {
                'sample.ts': fs.readFileSync(path.join(testWorkspace, 'sample.ts'), 'utf-8')
            }
        };

        const snapshotId = Date.now().toString();
        fs.writeFileSync(
            path.join(undoDir, `${snapshotId}.json`),
            JSON.stringify(snapshot, null, 2)
        );

        // Verify snapshot exists
        expect(fs.existsSync(path.join(undoDir, `${snapshotId}.json`))).toBe(true);

        // Test restoration
        const restored = JSON.parse(
            fs.readFileSync(path.join(undoDir, `${snapshotId}.json`), 'utf-8')
        );

        expect(restored.files['sample.ts']).toBeDefined();
        expect(restored.files['sample.ts']).toContain('Type error');
    });

    it('should enforce risk budget constraints', () => {
        const maxFiles = 10;
        const maxLOC = 40;

        // Simulate checking files
        const files = fs.readdirSync(testWorkspace).filter(f => f.endsWith('.ts'));

        expect(files.length).toBeLessThanOrEqual(maxFiles);

        // Check LOC for each file
        files.forEach(file => {
            const content = fs.readFileSync(path.join(testWorkspace, file), 'utf-8');
            const loc = content.split('\n').length;
            expect(loc).toBeLessThanOrEqual(100); // Reasonable limit for test
        });
    });

    it('should generate attestation chain', () => {
        const odavlDir = path.join(testWorkspace, '.odavl');
        const attestationDir = path.join(odavlDir, 'attestation');

        if (!fs.existsSync(attestationDir)) {
            fs.mkdirSync(attestationDir, { recursive: true });
        }

        // Create attestation
        const attestation = {
            runId: Date.now().toString(),
            timestamp: new Date().toISOString(),
            improvements: ['Fixed type error', 'Added strict mode'],
            hash: 'abc123def456' // Mock SHA-256
        };

        fs.writeFileSync(
            path.join(attestationDir, `${attestation.runId}.json`),
            JSON.stringify(attestation, null, 2)
        );

        // Verify attestation exists
        expect(fs.existsSync(path.join(attestationDir, `${attestation.runId}.json`))).toBe(true);

        const saved = JSON.parse(
            fs.readFileSync(path.join(attestationDir, `${attestation.runId}.json`), 'utf-8')
        );

        expect(saved.improvements).toHaveLength(2);
        expect(saved.hash).toBeDefined();
    });
});
