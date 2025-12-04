/**
 * Memory Leak Detector Module
 * Detects memory leaks in JavaScript/TypeScript code
 */

import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import { glob } from 'glob';

export interface MemoryLeakIssue {
    file: string;
    line: number;
    type: 'memory-leak' | 'event-listener-leak' | 'interval-leak' | 'timeout-leak' | 'websocket-leak';
    message: string;
    rootCause: string;
    suggestedFix: string;
    severity: 'critical' | 'high' | 'medium' | 'low';
    confidence: number;
}

export class MemoryLeakDetector {
    constructor(private readonly workspaceRoot: string) {}

    /**
     * Detect memory leaks in the codebase
     */
    async detect(targetDir?: string): Promise<MemoryLeakIssue[]> {
        const dir = targetDir || this.workspaceRoot;
        const errors: MemoryLeakIssue[] = [];

        const tsFiles = await glob('**/*.{ts,tsx,js,jsx}', {
            cwd: dir,
            ignore: ['node_modules/**', 'dist/**', '.next/**']
        });

        for (const file of tsFiles) {
            const filePath = path.join(dir, file);
            const content = await fs.readFile(filePath, 'utf8');
            const lines = content.split('\n');

            // Check for event listener leaks
            const eventListenerLeaks = this.detectEventListenerLeaks(lines, file);
            errors.push(...eventListenerLeaks);

            // Check for interval/timeout leaks
            const timerLeaks = this.detectTimerLeaks(lines, file);
            errors.push(...timerLeaks);

            // Check for WebSocket leaks
            const wsLeaks = this.detectWebSocketLeaks(lines, file);
            errors.push(...wsLeaks);
        }

        return errors;
    }

    /**
     * Detect event listener leaks (no cleanup in useEffect/componentWillUnmount)
     */
    private detectEventListenerLeaks(lines: string[], file: string): MemoryLeakIssue[] {
        const errors: MemoryLeakIssue[] = [];

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];

            // Pattern: addEventListener without removeEventListener
            if (line.includes('addEventListener') && !line.includes('removeEventListener')) {
                // Check if there's a cleanup in useEffect return or componentWillUnmount
                const hasCleanup = this.hasEventListenerCleanup(lines, i);

                if (!hasCleanup) {
                    errors.push({
                        file,
                        line: i + 1,
                        type: 'event-listener-leak',
                        message: 'Event listener added without cleanup',
                        rootCause: 'addEventListener called without corresponding removeEventListener in cleanup function',
                        suggestedFix: `Add cleanup:
useEffect(() => {
  const handler = () => { /* ... */ };
  element.addEventListener('event', handler);
  return () => element.removeEventListener('event', handler); // ✓ Cleanup
}, []);`,
                        severity: 'high',
                        confidence: 85
                    });
                }
            }
        }

        return errors;
    }

    /**
     * Detect setInterval/setTimeout leaks
     */
    private detectTimerLeaks(lines: string[], file: string): MemoryLeakIssue[] {
        const errors: MemoryLeakIssue[] = [];

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];

            // Pattern: setInterval without clearInterval
            if (line.includes('setInterval') && !line.match(/const\s+\w+\s*=/)) {
                errors.push({
                    file,
                    line: i + 1,
                    type: 'interval-leak',
                    message: 'setInterval without cleanup',
                    rootCause: 'setInterval called but interval ID not stored for cleanup',
                    suggestedFix: `Store interval ID and clear it:
const intervalId = setInterval(() => { /* ... */ }, 1000);
return () => clearInterval(intervalId); // ✓ Cleanup`,
                    severity: 'high',
                    confidence: 80
                });
            }

            // Pattern: setTimeout without clearTimeout in long-running contexts
            if (line.includes('useEffect') && this.hasUncleanedTimeout(lines, i)) {
                errors.push({
                    file,
                    line: i + 1,
                    type: 'timeout-leak',
                    message: 'setTimeout in useEffect without cleanup',
                    rootCause: 'setTimeout may continue after component unmount',
                    suggestedFix: `Clear timeout on cleanup:
useEffect(() => {
  const timeoutId = setTimeout(() => { /* ... */ }, 1000);
  return () => clearTimeout(timeoutId); // ✓ Cleanup
}, []);`,
                    severity: 'medium',
                    confidence: 75
                });
            }
        }

        return errors;
    }

    /**
     * Detect WebSocket leaks (no close in cleanup)
     */
    private detectWebSocketLeaks(lines: string[], file: string): MemoryLeakIssue[] {
        const errors: MemoryLeakIssue[] = [];

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];

            if (line.includes('new WebSocket') && !this.hasWebSocketCleanup(lines, i)) {
                errors.push({
                    file,
                    line: i + 1,
                    type: 'websocket-leak',
                    message: 'WebSocket connection without cleanup',
                    rootCause: 'WebSocket created but not closed on component unmount',
                    suggestedFix: `Close WebSocket in cleanup:
useEffect(() => {
  const ws = new WebSocket('ws://...');
  return () => ws.close(); // ✓ Cleanup
}, []);`,
                    severity: 'high',
                    confidence: 90
                });
            }
        }

        return errors;
    }

    // Helper methods
    private hasEventListenerCleanup(lines: string[], startIdx: number): boolean {
        // Look for return () => { ... removeEventListener ... } in next 20 lines
        for (let i = startIdx; i < Math.min(startIdx + 20, lines.length); i++) {
            if (lines[i].includes('removeEventListener') || lines[i].includes('cleanup')) {
                return true;
            }
        }
        return false;
    }

    private hasUncleanedTimeout(lines: string[], startIdx: number): boolean {
        // Check if setTimeout exists in useEffect without cleanup
        for (let i = startIdx; i < Math.min(startIdx + 15, lines.length); i++) {
            if (lines[i].includes('setTimeout')) {
                // Check if there's a return with clearTimeout
                for (let j = i; j < Math.min(i + 10, lines.length); j++) {
                    if (lines[j].includes('clearTimeout')) return false;
                }
                return true;
            }
        }
        return false;
    }

    private hasWebSocketCleanup(lines: string[], startIdx: number): boolean {
        // Look for ws.close() in cleanup
        for (let i = startIdx; i < Math.min(startIdx + 20, lines.length); i++) {
            if (lines[i].includes('.close()') && lines[i].includes('return')) {
                return true;
            }
        }
        return false;
    }
}
