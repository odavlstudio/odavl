/**
 * Race Condition Detector Module
 * Detects potential race conditions in async code
 */

import * as path from 'node:path';
import { globSync } from 'glob';
import { safeReadFile } from '../../utils/safe-file-reader.js';

export interface RaceConditionIssue {
    file: string;
    line: number;
    type: 'race-condition';
    message: string;
    rootCause: string;
    suggestedFix: string;
    severity: 'critical' | 'high' | 'medium' | 'low';
    confidence: number;
}

export class RaceConditionDetector {
    constructor(private readonly workspaceRoot: string) {}

    /**
     * Detect race conditions in async code
     */
    detect(targetDir?: string): RaceConditionIssue[] {
        const dir = targetDir || this.workspaceRoot;
        const errors: RaceConditionIssue[] = [];

        const tsFiles = globSync('**/*.{ts,tsx,js,jsx}', {
            cwd: dir,
            ignore: ['node_modules/**', 'dist/**', '.next/**']
        });

        for (const file of tsFiles) {
            const filePath = path.join(dir, file);
            const content = safeReadFile(filePath);
            if (!content) continue;
            const lines = content.split('\n');

            // Check for parallel async operations without proper synchronization
            const parallelRaces = this.detectParallelAsyncRaces(lines, file);
            errors.push(...parallelRaces);

            // Check for state updates in useEffect without dependencies
            const stateRaces = this.detectStateUpdateRaces(lines, file);
            errors.push(...stateRaces);

            // Check for shared resource access without locks
            const resourceRaces = this.detectSharedResourceRaces(lines, file);
            errors.push(...resourceRaces);
        }

        return errors;
    }

    /**
     * Detect parallel async operations that should be sequential
     */
    private detectParallelAsyncRaces(lines: string[], file: string): RaceConditionIssue[] {
        const errors: RaceConditionIssue[] = [];

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];

            // Pattern: Multiple await calls that might be parallel but shouldn't be
            if (line.includes('await') && i + 1 < lines.length && lines[i + 1].includes('await')) {
                // Check if these are independent operations (potential race)
                const op1 = line.match(/await\s+(\w+)\(/)?.[1];
                const op2 = lines[i + 1].match(/await\s+(\w+)\(/)?.[1];

                if (op1 && op2 && this.looksLikeRaceCondition(lines, i)) {
                    errors.push({
                        file,
                        line: i + 1,
                        type: 'race-condition',
                        message: 'Potential race condition: parallel async operations on shared state',
                        rootCause: 'Multiple async operations executing in parallel may cause race condition',
                        suggestedFix: `If operations are independent, use Promise.all:
const [result1, result2] = await Promise.all([operation1(), operation2()]);

If operations are dependent, keep sequential:
const result1 = await operation1();
const result2 = await operation2(result1);

For shared resources, use mutex:
const mutex = new Mutex();
await mutex.runExclusive(async () => {
  await operation1();
  await operation2();
});`,
                        severity: 'high',
                        confidence: 70
                    });
                }
            }
        }

        return errors;
    }

    /**
     * Detect state updates in useEffect without proper dependencies
     */
    private detectStateUpdateRaces(lines: string[], file: string): RaceConditionIssue[] {
        const errors: RaceConditionIssue[] = [];

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];

            // Pattern: useEffect with state updates but missing dependencies
            if (line.includes('useEffect')) {
                const effectBody = this.getEffectBody(lines, i);
                const hasStateUpdate = effectBody.some(l => l.includes('setState') || l.includes('set'));
                const deps = this.getEffectDeps(lines, i);

                if (hasStateUpdate && (!deps || deps === '[]')) {
                    errors.push({
                        file,
                        line: i + 1,
                        type: 'race-condition',
                        message: 'State update in useEffect without dependencies',
                        rootCause: 'State updates in useEffect with missing dependencies can cause stale closures',
                        suggestedFix: `Add proper dependencies to useEffect:
useEffect(() => {
  // State update
  setState(prevState => newValue);
}, [dependency1, dependency2]); // ✓ Add dependencies`,
                        severity: 'medium',
                        confidence: 75
                    });
                }
            }
        }

        return errors;
    }

    /**
     * Detect shared resource access without synchronization
     */
    private detectSharedResourceRaces(lines: string[], file: string): RaceConditionIssue[] {
        const errors: RaceConditionIssue[] = [];

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];

            // Pattern: File operations without locks
            if ((line.includes('fs.writeFile') || line.includes('fs.appendFile')) && 
                !this.hasFileLock(lines, i)) {
                errors.push({
                    file,
                    line: i + 1,
                    type: 'race-condition',
                    message: 'File write operation without lock',
                    rootCause: 'Concurrent file writes can cause data corruption',
                    suggestedFix: `Use file locking or queue writes:
import lockfile from 'proper-lockfile';
await lockfile.lock(filePath);
try {
  await fs.writeFile(filePath, data);
} finally {
  await lockfile.unlock(filePath);
}`,
                    severity: 'high',
                    confidence: 80
                });
            }
        }

        return errors;
    }

    // Helper methods
    private looksLikeRaceCondition(lines: string[], startIdx: number): boolean {
        // Check if operations access shared variables
        const next5Lines = lines.slice(startIdx, startIdx + 5).join('\n');
        return next5Lines.includes('this.') || next5Lines.includes('state.');
    }

    private getEffectBody(lines: string[], startIdx: number): string[] {
        const body: string[] = [];
        let braceCount = 0;
        let inBody = false;

        for (let i = startIdx; i < Math.min(startIdx + 30, lines.length); i++) {
            const line = lines[i];
            if (line.includes('{')) {
                braceCount++;
                inBody = true;
            }
            if (inBody) body.push(line);
            if (line.includes('}')) {
                braceCount--;
                if (braceCount === 0) break;
            }
        }

        return body;
    }

    private getEffectDeps(lines: string[], startIdx: number): string | null {
        for (let i = startIdx; i < Math.min(startIdx + 30, lines.length); i++) {
            const match = lines[i].match(/}\s*,\s*(\[.*?\])/);
            if (match) return match[1];
        }
        return null;
    }

    private hasFileLock(lines: string[], startIdx: number): boolean {
        // Check for lockfile or mutex in surrounding code
        for (let i = Math.max(0, startIdx - 5); i < Math.min(startIdx + 5, lines.length); i++) {
            if (lines[i].includes('lock') || lines[i].includes('mutex')) {
                return true;
            }
        }
        return false;
    }
}
