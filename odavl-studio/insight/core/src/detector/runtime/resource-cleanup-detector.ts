/**
 * Resource Cleanup Detector Module
 * Detects missing cleanup for resources (streams, connections, etc.)
 */

import * as path from 'node:path';
import { globSync } from 'glob';
import { safeReadFile } from '../../utils/safe-file-reader.js';

export interface ResourceCleanupIssue {
    file: string;
    line: number;
    type: 'resource-not-cleaned';
    message: string;
    rootCause: string;
    suggestedFix: string;
    severity: 'critical' | 'high' | 'medium' | 'low';
    confidence: number;
}

export class ResourceCleanupDetector {
    constructor(private readonly workspaceRoot: string) {}

    /**
     * Detect missing resource cleanup
     */
    detect(targetDir?: string): ResourceCleanupIssue[] {
        const dir = targetDir || this.workspaceRoot;
        const errors: ResourceCleanupIssue[] = [];

        const tsFiles = globSync('**/*.{ts,tsx,js,jsx}', {
            cwd: dir,
            ignore: ['node_modules/**', 'dist/**', '.next/**']
        });

        for (const file of tsFiles) {
            const filePath = path.join(dir, file);
            const content = safeReadFile(filePath);
            if (!content) continue;
            const lines = content.split('\n');

            // Check for stream cleanup
            const streamIssues = this.detectStreamCleanupIssues(lines, file);
            errors.push(...streamIssues);

            // Check for connection cleanup
            const connectionIssues = this.detectConnectionCleanupIssues(lines, file);
            errors.push(...connectionIssues);

            // Check for file descriptor cleanup
            const fdIssues = this.detectFileDescriptorIssues(lines, file);
            errors.push(...fdIssues);
        }

        return errors;
    }

    /**
     * Detect streams without proper cleanup
     */
    private detectStreamCleanupIssues(lines: string[], file: string): ResourceCleanupIssue[] {
        const errors: ResourceCleanupIssue[] = [];

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];

            // Pattern: createReadStream/createWriteStream without cleanup
            if (line.includes('createReadStream') || line.includes('createWriteStream')) {
                if (!this.hasStreamCleanup(lines, i)) {
                    errors.push({
                        file,
                        line: i + 1,
                        type: 'resource-not-cleaned',
                        message: 'Stream created without cleanup',
                        rootCause: 'File stream not properly closed, may cause file descriptor leak',
                        suggestedFix: `Ensure stream is closed:
const stream = fs.createReadStream(path);
stream.on('end', () => stream.close());
stream.on('error', () => stream.close());

Or use stream/promises pipeline:
const { pipeline } = require('stream/promises');
await pipeline(
  fs.createReadStream(input),
  transform,
  fs.createWriteStream(output)
); // ✓ Auto-cleanup`,
                        severity: 'high',
                        confidence: 85
                    });
                }
            }
        }

        return errors;
    }

    /**
     * Detect connections without cleanup
     */
    private detectConnectionCleanupIssues(lines: string[], file: string): ResourceCleanupIssue[] {
        const errors: ResourceCleanupIssue[] = [];

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];

            // Pattern: HTTP/HTTPS agents without cleanup
            if (line.includes('new http.Agent') || line.includes('new https.Agent')) {
                if (!this.hasAgentCleanup(lines, i)) {
                    errors.push({
                        file,
                        line: i + 1,
                        type: 'resource-not-cleaned',
                        message: 'HTTP agent without cleanup',
                        rootCause: 'HTTP agent keeps connections alive indefinitely',
                        suggestedFix: `Clean up agent when done:
const agent = new http.Agent({ keepAlive: true });
// Use agent...
agent.destroy(); // ✓ Cleanup`,
                        severity: 'medium',
                        confidence: 80
                    });
                }
            }

            // Pattern: net.Socket without cleanup
            if (line.includes('new net.Socket') || line.includes('net.connect')) {
                if (!this.hasSocketCleanup(lines, i)) {
                    errors.push({
                        file,
                        line: i + 1,
                        type: 'resource-not-cleaned',
                        message: 'Socket connection without cleanup',
                        rootCause: 'Socket not closed, may cause connection leak',
                        suggestedFix: `Close socket properly:
const socket = net.connect(port, host);
socket.on('error', () => socket.destroy());
socket.on('end', () => socket.destroy());
// When done:
socket.end(); // ✓ Cleanup`,
                        severity: 'high',
                        confidence: 85
                    });
                }
            }
        }

        return errors;
    }

    /**
     * Detect file descriptor issues
     */
    private detectFileDescriptorIssues(lines: string[], file: string): ResourceCleanupIssue[] {
        const errors: ResourceCleanupIssue[] = [];

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];

            // Pattern: fs.open without fs.close
            if (line.includes('fs.open') && !this.hasFdClose(lines, i)) {
                errors.push({
                    file,
                    line: i + 1,
                    type: 'resource-not-cleaned',
                    message: 'File descriptor opened without close',
                    rootCause: 'File descriptor not closed, may exhaust system resources',
                    suggestedFix: `Always close file descriptors:
const fd = await fs.open(path, 'r');
try {
  // Use fd...
} finally {
  await fd.close(); // ✓ Cleanup
}`,
                    severity: 'critical',
                    confidence: 90
                });
            }
        }

        return errors;
    }

    // Helper methods
    private hasStreamCleanup(lines: string[], startIdx: number): boolean {
        // Look for .close(), .destroy(), or pipeline usage
        for (let i = startIdx; i < Math.min(startIdx + 15, lines.length); i++) {
            if (lines[i].includes('.close()') || 
                lines[i].includes('.destroy()') || 
                lines[i].includes('pipeline')) {
                return true;
            }
        }
        return false;
    }

    private hasAgentCleanup(lines: string[], startIdx: number): boolean {
        // Look for agent.destroy()
        for (let i = startIdx; i < Math.min(startIdx + 30, lines.length); i++) {
            if (lines[i].includes('.destroy()')) {
                return true;
            }
        }
        return false;
    }

    private hasSocketCleanup(lines: string[], startIdx: number): boolean {
        // Look for socket.end() or socket.destroy()
        for (let i = startIdx; i < Math.min(startIdx + 20, lines.length); i++) {
            if (lines[i].includes('.end()') || lines[i].includes('.destroy()')) {
                return true;
            }
        }
        return false;
    }

    private hasFdClose(lines: string[], startIdx: number): boolean {
        // Look for fd.close() in try-finally or explicit close
        for (let i = startIdx; i < Math.min(startIdx + 20, lines.length); i++) {
            if (lines[i].includes('.close()') || lines[i].includes('finally')) {
                return true;
            }
        }
        return false;
    }
}
