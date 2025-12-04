#!/usr/bin/env node
/**
 * Guardian Workers Launcher
 * Starts test-worker and monitor-worker in parallel
 */

import { spawn, ChildProcess } from 'child_process';
import { join } from 'path';

const workers: { name: string; process: ChildProcess }[] = [];

function startWorker(name: string, scriptPath: string): ChildProcess {
    console.log(`[launcher] Starting ${name}...`);

    const workerProcess = spawn('tsx', [scriptPath], {
        stdio: 'inherit',
        env: { ...process.env, WORKER_NAME: name }
    });

    workerProcess.on('error', (error) => {
        console.error(`[launcher] ${name} error:`, error);
    });

    workerProcess.on('exit', (code) => {
        console.log(`[launcher] ${name} exited with code ${code}`);

        // Restart worker if it crashes
        if (code !== 0 && code !== null) {
            console.log(`[launcher] Restarting ${name} in 5s...`);
            setTimeout(() => {
                const newWorker = startWorker(name, scriptPath);
                const index = workers.findIndex(w => w.name === name);
                if (index >= 0) {
                    workers[index].process = newWorker;
                }
            }, 5000);
        }
    });

    return workerProcess;
}

// Start workers
const testWorkerPath = join(__dirname, '../workers/test-worker.ts');
const monitorWorkerPath = join(__dirname, '../workers/monitor-worker.ts');

workers.push({
    name: 'test-worker',
    process: startWorker('test-worker', testWorkerPath)
});

workers.push({
    name: 'monitor-worker',
    process: startWorker('monitor-worker', monitorWorkerPath)
});

// Graceful shutdown
function shutdown() {
    console.log('[launcher] Shutting down all workers...');

    workers.forEach(({ name, process }) => {
        console.log(`[launcher] Stopping ${name}...`);
        process.kill('SIGTERM');
    });

    // Force exit after 10s
    setTimeout(() => {
        console.log('[launcher] Force exit');
        process.exit(0);
    }, 10000);
}

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

console.log('[launcher] All workers started. Press Ctrl+C to stop.');
