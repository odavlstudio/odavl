/**
 * Performance Profiler
 * CPU profiling, memory snapshots, and performance analysis
 */

import { Session } from 'node:inspector';
import { writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import logger from '@/lib/logger';

interface ProfileResult {
    success: boolean;
    type: 'cpu' | 'memory';
    duration?: number;
    filePath?: string;
    error?: string;
}

interface CPUProfile {
    nodes: Array<{
        id: number;
        callFrame: {
            functionName: string;
            scriptId: string;
            url: string;
            lineNumber: number;
            columnNumber: number;
        };
        hitCount: number;
        children: number[];
    }>;
    startTime: number;
    endTime: number;
    samples: number[];
    timeDeltas: number[];
}

let session: Session | null = null;
let isProfilingActive = false;

/**
 * Start CPU profiling
 */
export function startCPUProfiling(): { success: boolean; message: string } {
    if (isProfilingActive) {
        return { success: false, message: 'Profiling already active' };
    }

    try {
        session = new Session();
        session.connect();

        // Enable profiler
        session.post('Profiler.enable', () => {
            session!.post('Profiler.start', () => {
                isProfilingActive = true;
                logger.info('CPU profiling started');
            });
        });

        return { success: true, message: 'CPU profiling started' };
    } catch (error) {
        logger.error('Failed to start CPU profiling', { error });
        return {
            success: false,
            message: error instanceof Error ? error.message : 'Unknown error',
        };
    }
}

/**
 * Stop CPU profiling and save results
 */
export async function stopCPUProfiling(): Promise<ProfileResult> {
    if (!isProfilingActive || !session) {
        return { success: false, type: 'cpu', error: 'No active profiling session' };
    }

    return new Promise((resolve) => {
        session!.post('Profiler.stop', (err, { profile }: { profile: CPUProfile }) => {
            if (err) {
                logger.error('Failed to stop CPU profiling', { error: err });
                resolve({ success: false, type: 'cpu', error: err.message });
                return;
            }

            try {
                // Save profile to file
                const timestamp = new Date().toISOString().replaceAll(/[:.]/g, '-');
                const profilesDir = join(process.cwd(), 'reports', 'profiles');
                mkdirSync(profilesDir, { recursive: true });
                const filePath = join(profilesDir, `cpu-${timestamp}.cpuprofile`);

                writeFileSync(filePath, JSON.stringify(profile, null, 2));

                const duration = profile.endTime - profile.startTime;
                isProfilingActive = false;
                session!.disconnect();
                session = null;

                logger.info('CPU profiling stopped', { filePath, duration });

                resolve({
                    success: true,
                    type: 'cpu',
                    duration,
                    filePath,
                });
            } catch (error) {
                logger.error('Failed to save CPU profile', { error });
                resolve({
                    success: false,
                    type: 'cpu',
                    error: error instanceof Error ? error.message : 'Unknown error',
                });
            }
        });
    });
}

/**
 * Take memory heap snapshot
 */
export async function takeHeapSnapshot(): Promise<ProfileResult> {
    try {
        const timestamp = new Date().toISOString().replaceAll(/[:.]/g, '-');
        const profilesDir = join(process.cwd(), 'reports', 'profiles');
        mkdirSync(profilesDir, { recursive: true });
        const filePath = join(profilesDir, `heap-${timestamp}.heapsnapshot`);

        // Use v8.writeHeapSnapshot if available
        if (typeof require !== 'undefined') {
            try {
                const v8 = require('node:v8');
                const actualPath = v8.writeHeapSnapshot(filePath);
                logger.info('Heap snapshot taken', { filePath: actualPath });
                return { success: true, type: 'memory', filePath: actualPath };
            } catch (v8Error) {
                logger.warn('v8.writeHeapSnapshot not available, using inspector', { v8Error });
            }
        }

        // Fallback to inspector session
        const inspectorSession = new Session();
        inspectorSession.connect();

        const chunks: string[] = [];

        inspectorSession.on('HeapProfiler.addHeapSnapshotChunk', (m) => {
            chunks.push(m.params.chunk);
        });

        return new Promise<ProfileResult>((resolvePromise) => {
            inspectorSession.post('HeapProfiler.takeHeapSnapshot', undefined, (err) => {
                inspectorSession.disconnect();

                if (err) {
                    logger.error('Failed to take heap snapshot', { error: err });
                    resolvePromise({ success: false, type: 'memory', error: err.message });
                    return;
                }

                try {
                    writeFileSync(filePath, chunks.join(''));
                    logger.info('Heap snapshot saved', { filePath });
                    resolvePromise({ success: true, type: 'memory', filePath });
                } catch (writeError) {
                    logger.error('Failed to save heap snapshot', { error: writeError });
                    resolvePromise({
                        success: false,
                        type: 'memory',
                        error: writeError instanceof Error ? writeError.message : 'Unknown error',
                    });
                }
            });
        });
    } catch (error) {
        logger.error('Failed to take heap snapshot', { error });
        return {
            success: false,
            type: 'memory',
            error: error instanceof Error ? error.message : 'Unknown error',
        };
    }
}

/**
 * Get memory usage statistics
 */
export function getMemoryUsage() {
    const usage = process.memoryUsage();
    return {
        rss: Math.round(usage.rss / 1024 / 1024), // MB
        heapTotal: Math.round(usage.heapTotal / 1024 / 1024), // MB
        heapUsed: Math.round(usage.heapUsed / 1024 / 1024), // MB
        external: Math.round(usage.external / 1024 / 1024), // MB
        arrayBuffers: Math.round(usage.arrayBuffers / 1024 / 1024), // MB
    };
}

/**
 * Check if profiling is currently active
 */
export function isProfilingInProgress(): boolean {
    return isProfilingActive;
}

export default {
    startCPUProfiling,
    stopCPUProfiling,
    takeHeapSnapshot,
    getMemoryUsage,
    isProfilingInProgress,
};
