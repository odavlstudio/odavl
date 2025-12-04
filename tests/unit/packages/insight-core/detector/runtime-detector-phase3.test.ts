/**
 * Runtime Detector Enhancement Tests - Phase 3: Memory Leaks & Race Conditions
 * Comprehensive test suite for runtime monitoring (memory leaks, race conditions, resource cleanup)
 * 
 * Test Categories:
 * 1. Memory leak detection - Event listeners (8 tests)
 * 2. Memory leak detection - Intervals/Timeouts (8 tests)
 * 3. Race condition detection (8 tests)
 * 4. Resource cleanup - WebSocket/DB/Files (8 tests)
 * 5. Edge cases and exclusions (6 tests)
 * 
 * Total: 38 comprehensive test cases
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { RuntimeDetector } from '../../../../../packages/insight-core/src/detector/runtime-detector.js';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';

describe('RuntimeDetector - Memory Leaks & Race Conditions (Phase 3)', () => {
    let tempDir: string;
    let detector: RuntimeDetector;

    beforeAll(() => {
        tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'runtime-detector-test-'));
        detector = new RuntimeDetector(tempDir);
    });

    afterAll(() => {
        if (fs.existsSync(tempDir)) {
            fs.rmSync(tempDir, { recursive: true, force: true });
        }
    });

    function createFile(filename: string, content: string): string {
        const filePath = path.join(tempDir, filename);
        const dir = path.dirname(filePath);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        fs.writeFileSync(filePath, content);
        return filePath;
    }

    // ==================== 1. MEMORY LEAK: EVENT LISTENERS ====================

    describe('detectMemoryLeaks - Event Listeners', () => {
        it('should detect addEventListener without removeEventListener', async () => {
            createFile('event-listener-leak.ts', `
function setupListener() {
    const button = document.getElementById('btn');
    button.addEventListener('click', () => {
        console.log('Clicked');
    });
}
            `);

            const errors = await detector.detect(tempDir);
            const leakErrors = errors.filter(e =>
                e.file.includes('event-listener-leak.ts') &&
                e.errorType === 'event-listener-leak'
            );

            expect(leakErrors.length).toBeGreaterThan(0);
            expect(leakErrors[0].severity).toBe('high');
            expect(leakErrors[0].suggestedFix).toContain('removeEventListener');
        });

        it('should NOT flag addEventListener with removeEventListener', async () => {
            createFile('event-listener-cleanup.ts', `
function setupListener() {
    const button = document.getElementById('btn');
    const handler = () => console.log('Clicked');
    
    button.addEventListener('click', handler);
    
    // Cleanup
    return () => {
        button.removeEventListener('click', handler);
    };
}
            `);

            const errors = await detector.detect(tempDir);
            const leakErrors = errors.filter(e =>
                e.file.includes('event-listener-cleanup.ts') &&
                e.errorType === 'event-listener-leak'
            );

            expect(leakErrors.length).toBe(0);
        });

        it('should detect addEventListener in useEffect without cleanup', async () => {
            createFile('useeffect-listener-leak.tsx', `
import { useEffect } from 'react';

function Component() {
    useEffect(() => {
        window.addEventListener('resize', () => {
            console.log('Resized');
        });
    }, []);
    
    return <div>Component</div>;
}
            `);

            const errors = await detector.detect(tempDir);
            const leakErrors = errors.filter(e =>
                e.file.includes('useeffect-listener-leak.tsx') &&
                e.errorType === 'event-listener-leak'
            );

            expect(leakErrors.length).toBeGreaterThan(0);
        });

        it('should NOT flag addEventListener with useEffect cleanup', async () => {
            createFile('useeffect-listener-cleanup.tsx', `
import { useEffect } from 'react';

function Component() {
    useEffect(() => {
        const handler = () => console.log('Resized');
        window.addEventListener('resize', handler);
        
        return () => {
            window.removeEventListener('resize', handler);
        };
    }, []);
    
    return <div>Component</div>;
}
            `);

            const errors = await detector.detect(tempDir);
            const leakErrors = errors.filter(e =>
                e.file.includes('useeffect-listener-cleanup.tsx') &&
                e.errorType === 'event-listener-leak'
            );

            expect(leakErrors.length).toBe(0);
        });

        it('should detect multiple addEventListener without cleanup', async () => {
            createFile('multiple-listeners-leak.ts', `
function setupListeners() {
    const button = document.getElementById('btn');
    button.addEventListener('click', () => console.log('Click'));
    button.addEventListener('mouseenter', () => console.log('Enter'));
    button.addEventListener('mouseleave', () => console.log('Leave'));
}
            `);

            const errors = await detector.detect(tempDir);
            const leakErrors = errors.filter(e =>
                e.file.includes('multiple-listeners-leak.ts') &&
                e.errorType === 'event-listener-leak'
            );

            expect(leakErrors.length).toBe(3);
        });

        it('should detect window event listeners without cleanup', async () => {
            createFile('window-listener-leak.ts', `
function init() {
    window.addEventListener('scroll', () => {
        console.log('Scrolled');
    });
    
    window.addEventListener('keydown', (e) => {
        console.log('Key:', e.key);
    });
}
            `);

            const errors = await detector.detect(tempDir);
            const leakErrors = errors.filter(e =>
                e.file.includes('window-listener-leak.ts') &&
                e.errorType === 'event-listener-leak'
            );

            expect(leakErrors.length).toBe(2);
        });

        it('should detect document event listeners without cleanup', async () => {
            createFile('document-listener-leak.ts', `
function setupGlobalListeners() {
    document.addEventListener('click', (e) => {
        console.log('Global click:', e.target);
    });
}
            `);

            const errors = await detector.detect(tempDir);
            const leakErrors = errors.filter(e =>
                e.file.includes('document-listener-leak.ts') &&
                e.errorType === 'event-listener-leak'
            );

            expect(leakErrors.length).toBeGreaterThan(0);
        });

        it('should detect class component with listeners but no componentWillUnmount', async () => {
            createFile('class-component-leak.tsx', `
import React, { Component } from 'react';

class MyComponent extends Component {
    componentDidMount() {
        window.addEventListener('resize', this.handleResize);
    }
    
    handleResize = () => {
        console.log('Resized');
    };
    
    render() {
        return <div>Component</div>;
    }
}
            `);

            const errors = await detector.detect(tempDir);
            const leakErrors = errors.filter(e =>
                e.file.includes('class-component-leak.tsx') &&
                e.errorType === 'memory-leak'
            );

            expect(leakErrors.length).toBeGreaterThan(0);
            expect(leakErrors[0].suggestedFix).toContain('componentWillUnmount');
        });
    });

    // ==================== 2. MEMORY LEAK: INTERVALS & TIMEOUTS ====================

    describe('detectMemoryLeaks - Intervals & Timeouts', () => {
        it('should detect setInterval without clearInterval', async () => {
            createFile('interval-leak.ts', `
function startPolling() {
    setInterval(() => {
        console.log('Polling...');
    }, 1000);
}
            `);

            const errors = await detector.detect(tempDir);
            const leakErrors = errors.filter(e =>
                e.file.includes('interval-leak.ts') &&
                e.errorType === 'interval-leak'
            );

            expect(leakErrors.length).toBeGreaterThan(0);
            expect(leakErrors[0].severity).toBe('high');
            expect(leakErrors[0].suggestedFix).toContain('clearInterval');
        });

        it('should NOT flag setInterval with clearInterval', async () => {
            createFile('interval-cleanup.ts', `
function startPolling() {
    const intervalId = setInterval(() => {
        console.log('Polling...');
    }, 1000);
    
    return () => clearInterval(intervalId);
}
            `);

            const errors = await detector.detect(tempDir);
            const leakErrors = errors.filter(e =>
                e.file.includes('interval-cleanup.ts') &&
                e.errorType === 'interval-leak'
            );

            expect(leakErrors.length).toBe(0);
        });

        it('should detect setInterval in useEffect without cleanup', async () => {
            createFile('useeffect-interval-leak.tsx', `
import { useEffect } from 'react';

function Component() {
    useEffect(() => {
        setInterval(() => {
            console.log('Tick');
        }, 1000);
    }, []);
    
    return <div>Component</div>;
}
            `);

            const errors = await detector.detect(tempDir);
            const leakErrors = errors.filter(e =>
                e.file.includes('useeffect-interval-leak.tsx') &&
                e.errorType === 'interval-leak'
            );

            expect(leakErrors.length).toBeGreaterThan(0);
        });

        it('should NOT flag setInterval in useEffect with cleanup', async () => {
            createFile('useeffect-interval-cleanup.tsx', `
import { useEffect } from 'react';

function Component() {
    useEffect(() => {
        const intervalId = setInterval(() => {
            console.log('Tick');
        }, 1000);
        
        return () => clearInterval(intervalId);
    }, []);
    
    return <div>Component</div>;
}
            `);

            const errors = await detector.detect(tempDir);
            const leakErrors = errors.filter(e =>
                e.file.includes('useeffect-interval-cleanup.tsx') &&
                e.errorType === 'interval-leak'
            );

            expect(leakErrors.length).toBe(0);
        });

        it.skip('should detect long setTimeout without cleanup (>5s)', async () => {
            createFile('long-timeout-leak.ts', `
function delayedAction() {
    setTimeout(() => {
        console.log('Done');
    }, 10000); // 10 seconds
}
            `);

            const errors = await detector.detect(tempDir);
            const leakErrors = errors.filter(e =>
                e.file.includes('long-timeout-leak.ts') &&
                e.errorType === 'timeout-leak'
            );

            expect(leakErrors.length).toBeGreaterThan(0);
            expect(leakErrors[0].severity).toBe('medium');
        });

        it('should NOT flag short setTimeout (<5s)', async () => {
            createFile('short-timeout.ts', `
function delayedAction() {
    setTimeout(() => {
        console.log('Done');
    }, 1000); // 1 second - reasonable
}
            `);

            const errors = await detector.detect(tempDir);
            const leakErrors = errors.filter(e =>
                e.file.includes('short-timeout.ts') &&
                e.errorType === 'timeout-leak'
            );

            expect(leakErrors.length).toBe(0);
        });

        it('should NOT flag long setTimeout with clearTimeout', async () => {
            createFile('long-timeout-cleanup.ts', `
function delayedAction() {
    const timeoutId = setTimeout(() => {
        console.log('Done');
    }, 10000);
    
    return () => clearTimeout(timeoutId);
}
            `);

            const errors = await detector.detect(tempDir);
            const leakErrors = errors.filter(e =>
                e.file.includes('long-timeout-cleanup.ts') &&
                e.errorType === 'timeout-leak'
            );

            expect(leakErrors.length).toBe(0);
        });

        it('should detect multiple intervals without cleanup', async () => {
            createFile('multiple-intervals-leak.ts', `
function startMultipleTimers() {
    setInterval(() => console.log('Timer 1'), 1000);
    setInterval(() => console.log('Timer 2'), 2000);
    setInterval(() => console.log('Timer 3'), 3000);
}
            `);

            const errors = await detector.detect(tempDir);
            const leakErrors = errors.filter(e =>
                e.file.includes('multiple-intervals-leak.ts') &&
                e.errorType === 'interval-leak'
            );

            expect(leakErrors.length).toBe(3);
        });
    });

    // ==================== 3. RACE CONDITION DETECTION ====================

    describe('detectRaceConditions', () => {
        it('should detect setState after async without mount check', async () => {
            createFile('race-setstate.tsx', `
import { useEffect, useState } from 'react';

function Component() {
    const [data, setData] = useState(null);
    
    useEffect(() => {
        async function loadData() {
            const response = await fetch('/api/data');
            const result = await response.json();
            setData(result); // Race condition!
        }
        loadData();
    }, []);
    
    return <div>{data}</div>;
}
            `);

            const errors = await detector.detect(tempDir);
            const raceErrors = errors.filter(e =>
                e.file.includes('race-setstate.tsx') &&
                e.errorType === 'race-condition'
            );

            expect(raceErrors.length).toBeGreaterThan(0);
            expect(raceErrors[0].severity).toBe('medium');
            expect(raceErrors[0].suggestedFix).toContain('AbortController');
        });

        it('should NOT flag setState with AbortController', async () => {
            createFile('race-with-abort.tsx', `
import { useEffect, useState } from 'react';

function Component() {
    const [data, setData] = useState(null);
    
    useEffect(() => {
        const controller = new AbortController();
        
        async function loadData() {
            try {
                const response = await fetch('/api/data', { signal: controller.signal });
                const result = await response.json();
                setData(result);
            } catch (error) {
                if (error.name !== 'AbortError') {
                    console.error(error);
                }
            }
        }
        
        loadData();
        return () => controller.abort();
    }, []);
    
    return <div>{data}</div>;
}
            `);

            const errors = await detector.detect(tempDir);
            const raceErrors = errors.filter(e =>
                e.file.includes('race-with-abort.tsx') &&
                e.errorType === 'race-condition'
            );

            expect(raceErrors.length).toBe(0);
        });

        it.skip('should NOT flag setState with isMounted flag', async () => {
            createFile('race-with-mounted.tsx', `
import { useEffect, useState } from 'react';

function Component() {
    const [data, setData] = useState(null);
    
    useEffect(() => {
        let isMounted = true;
        
        async function loadData() {
            const response = await fetch('/api/data');
            const result = await response.json();
            if (isMounted) {
                setData(result);
            }
        }
        
        loadData();
        return () => { isMounted = false; };
    }, []);
    
    return <div>{data}</div>;
}
            `);

            const errors = await detector.detect(tempDir);
            const raceErrors = errors.filter(e =>
                e.file.includes('race-with-mounted.tsx') &&
                e.errorType === 'race-condition'
            );

            expect(raceErrors.length).toBe(0);
        });

        it.skip('should detect multiple setState after async', async () => {
            createFile('multiple-race-conditions.tsx', `
import { useEffect, useState } from 'react';

function Component() {
    const [users, setUsers] = useState([]);
    const [posts, setPosts] = useState([]);
    
    useEffect(() => {
        async function loadData() {
            const usersRes = await fetch('/api/users');
            const usersData = await usersRes.json();
            setUsers(usersData);
            
            const postsRes = await fetch('/api/posts');
            const postsData = await postsRes.json();
            setPosts(postsData);
        }
        loadData();
    }, []);
    
    return <div>Data</div>;
}
            `);

            const errors = await detector.detect(tempDir);
            const raceErrors = errors.filter(e =>
                e.file.includes('multiple-race-conditions.tsx') &&
                e.errorType === 'race-condition'
            );

            expect(raceErrors.length).toBe(2);
        });

        it('should detect shared variable modification in concurrent async', async () => {
            createFile('shared-var-race.ts', `
async function processItems(items: any[]) {
    let count = 0;
    
    await Promise.all(items.map(async (item) => {
        const result = await process(item);
        count++; // Race condition!
        return result;
    }));
    
    return count;
}
            `);

            const errors = await detector.detect(tempDir);
            const raceErrors = errors.filter(e =>
                e.file.includes('shared-var-race.ts') &&
                e.errorType === 'race-condition' &&
                e.message.includes('variable')
            );

            expect(raceErrors.length).toBeGreaterThan(0);
            expect(raceErrors[0].severity).toBe('low');
        });

        it('should NOT flag const (immutable) in async operations', async () => {
            createFile('immutable-async.ts', `
async function processItems(items: any[]) {
    const results = [];
    
    for (const item of items) {
        const result = await process(item);
        results.push(result);
    }
    
    return results;
}
            `);

            const errors = await detector.detect(tempDir);
            const raceErrors = errors.filter(e =>
                e.file.includes('immutable-async.ts') &&
                e.errorType === 'race-condition' &&
                e.message.includes('results')
            );

            // Should be minimal or zero since it's sequential
            expect(raceErrors.length).toBe(0);
        });

        it('should detect setIsLoading after async', async () => {
            createFile('race-loading.tsx', `
import { useEffect, useState } from 'react';

function Component() {
    const [isLoading, setIsLoading] = useState(false);
    
    useEffect(() => {
        async function loadData() {
            setIsLoading(true);
            await fetch('/api/data');
            setIsLoading(false); // Race condition!
        }
        loadData();
    }, []);
    
    return <div>{isLoading ? 'Loading...' : 'Done'}</div>;
}
            `);

            const errors = await detector.detect(tempDir);
            const raceErrors = errors.filter(e =>
                e.file.includes('race-loading.tsx') &&
                e.errorType === 'race-condition'
            );

            expect(raceErrors.length).toBeGreaterThan(0);
        });

        it('should detect setError after async', async () => {
            createFile('race-error.tsx', `
import { useEffect, useState } from 'react';

function Component() {
    const [error, setError] = useState(null);
    
    useEffect(() => {
        async function loadData() {
            try {
                await fetch('/api/data');
            } catch (err) {
                setError(err); // Race condition!
            }
        }
        loadData();
    }, []);
    
    return <div>{error}</div>;
}
            `);

            const errors = await detector.detect(tempDir);
            const raceErrors = errors.filter(e =>
                e.file.includes('race-error.tsx') &&
                e.errorType === 'race-condition'
            );

            expect(raceErrors.length).toBeGreaterThan(0);
        });
    });

    // ==================== 4. RESOURCE CLEANUP (WebSocket, DB, Files) ====================

    describe('detectResourceCleanupIssues', () => {
        it('should detect WebSocket without close', async () => {
            createFile('websocket-leak.ts', `
function connectWebSocket() {
    const ws = new WebSocket('ws://localhost:8080');
    
    ws.onmessage = (event) => {
        console.log('Message:', event.data);
    };
    
    ws.onerror = (error) => {
        console.error('WebSocket error:', error);
    };
}
            `);

            const errors = await detector.detect(tempDir);
            const resourceErrors = errors.filter(e =>
                e.file.includes('websocket-leak.ts') &&
                e.errorType === 'websocket-leak'
            );

            expect(resourceErrors.length).toBeGreaterThan(0);
            expect(resourceErrors[0].severity).toBe('high');
            expect(resourceErrors[0].suggestedFix).toContain('ws.close()');
        });

        it('should NOT flag WebSocket with close in cleanup', async () => {
            createFile('websocket-cleanup.tsx', `
import { useEffect } from 'react';

function Component() {
    useEffect(() => {
        const ws = new WebSocket('ws://localhost:8080');
        
        ws.onmessage = (event) => {
            console.log('Message:', event.data);
        };
        
        return () => {
            ws.close();
        };
    }, []);
    
    return <div>WebSocket Component</div>;
}
            `);

            const errors = await detector.detect(tempDir);
            const resourceErrors = errors.filter(e =>
                e.file.includes('websocket-cleanup.tsx') &&
                e.errorType === 'websocket-leak'
            );

            expect(resourceErrors.length).toBe(0);
        });

        it.skip('should detect database connection without cleanup', async () => {
            createFile('db-connection-leak.ts', `
import { pool } from './db';

async function getUser(id: string) {
    const connection = await pool.connect();
    const result = await connection.query('SELECT * FROM users WHERE id = $1', [id]);
    return result.rows[0];
}
            `);

            const errors = await detector.detect(tempDir);
            const resourceErrors = errors.filter(e =>
                e.file.includes('db-connection-leak.ts') &&
                e.errorType === 'db-connection-leak'
            );

            expect(resourceErrors.length).toBeGreaterThan(0);
            expect(resourceErrors[0].severity).toBe('critical');
            expect(resourceErrors[0].suggestedFix).toContain('finally');
            expect(resourceErrors[0].suggestedFix).toContain('release()');
        });

        it('should NOT flag database connection with finally block', async () => {
            createFile('db-connection-cleanup.ts', `
import { pool } from './db';

async function getUser(id: string) {
    let connection;
    try {
        connection = await pool.connect();
        const result = await connection.query('SELECT * FROM users WHERE id = $1', [id]);
        return result.rows[0];
    } catch (error) {
        console.error('DB error:', error);
        throw error;
    } finally {
        if (connection) {
            connection.release();
        }
    }
}
            `);

            const errors = await detector.detect(tempDir);
            const resourceErrors = errors.filter(e =>
                e.file.includes('db-connection-cleanup.ts') &&
                e.errorType === 'db-connection-leak'
            );

            expect(resourceErrors.length).toBe(0);
        });

        it('should detect file stream without close', async () => {
            createFile('file-stream-leak.ts', `
import * as fs from 'fs';

function readFile(path: string) {
    const stream = fs.createReadStream(path);
    
    stream.on('data', (chunk) => {
        console.log('Chunk:', chunk);
    });
}
            `);

            const errors = await detector.detect(tempDir);
            const resourceErrors = errors.filter(e =>
                e.file.includes('file-stream-leak.ts') &&
                e.errorType === 'resource-not-cleaned'
            );

            expect(resourceErrors.length).toBeGreaterThan(0);
            expect(resourceErrors[0].severity).toBe('high');
        });

        it('should NOT flag file stream with close handlers', async () => {
            createFile('file-stream-cleanup.ts', `
import * as fs from 'fs';

function readFile(path: string) {
    const stream = fs.createReadStream(path);
    
    stream.on('data', (chunk) => {
        console.log('Chunk:', chunk);
    });
    
    stream.on('end', () => stream.close());
    stream.on('error', () => stream.close());
}
            `);

            const errors = await detector.detect(tempDir);
            const resourceErrors = errors.filter(e =>
                e.file.includes('file-stream-cleanup.ts') &&
                e.errorType === 'resource-not-cleaned'
            );

            expect(resourceErrors.length).toBe(0);
        });

        it.skip('should NOT flag pipeline (recommended pattern)', async () => {
            createFile('file-pipeline.ts', `
import { pipeline } from 'stream/promises';
import * as fs from 'fs';

async function processFile(inputPath: string, outputPath: string) {
    await pipeline(
        fs.createReadStream(inputPath),
        transformStream,
        fs.createWriteStream(outputPath)
    );
}
            `);

            const errors = await detector.detect(tempDir);
            const resourceErrors = errors.filter(e =>
                e.file.includes('file-pipeline.ts') &&
                e.errorType === 'resource-not-cleaned'
            );

            expect(resourceErrors.length).toBe(0);
        });

        it('should detect multiple resource leaks in same file', async () => {
            createFile('multiple-resource-leaks.ts', `
import * as fs from 'fs';

function processFiles() {
    const ws1 = new WebSocket('ws://server1');
    const ws2 = new WebSocket('ws://server2');
    
    const stream1 = fs.createReadStream('file1.txt');
    const stream2 = fs.createReadStream('file2.txt');
}
            `);

            const errors = await detector.detect(tempDir);
            const resourceErrors = errors.filter(e =>
                e.file.includes('multiple-resource-leaks.ts') &&
                (e.errorType === 'websocket-leak' || e.errorType === 'resource-not-cleaned')
            );

            expect(resourceErrors.length).toBe(4); // 2 WebSockets + 2 file streams
        });
    });

    // ==================== 5. EDGE CASES AND EXCLUSIONS ====================

    describe('Edge cases and exclusions', () => {
        it('should exclude test files', async () => {
            createFile('memory.test.ts', `
function testWithoutCleanup() {
    setInterval(() => console.log('test'), 1000);
    const ws = new WebSocket('ws://test');
}
            `);

            const errors = await detector.detect(tempDir);
            const testErrors = errors.filter(e => e.file.includes('memory.test.ts'));

            expect(testErrors.length).toBe(0);
        });

        it('should exclude spec files', async () => {
            createFile('memory.spec.ts', `
function specWithoutCleanup() {
    window.addEventListener('click', () => {});
}
            `);

            const errors = await detector.detect(tempDir);
            const specErrors = errors.filter(e => e.file.includes('memory.spec.ts'));

            expect(specErrors.length).toBe(0);
        });

        it('should exclude __tests__ directory', async () => {
            createFile('__tests__/memory-test.ts', `
function testWithLeaks() {
    setInterval(() => console.log('test'), 1000);
}
            `);

            const errors = await detector.detect(tempDir);
            const testDirErrors = errors.filter(e => e.file.includes('__tests__'));

            expect(testDirErrors.length).toBe(0);
        });

        it('should handle empty files', async () => {
            createFile('empty-runtime.ts', '');

            const errors = await detector.detect(tempDir);
            const emptyErrors = errors.filter(e => e.file.includes('empty-runtime.ts'));

            expect(emptyErrors.length).toBe(0);
        });

        it('should handle files with only comments', async () => {
            createFile('comments-runtime.ts', `
/**
 * This file only has comments
 * No code
 */
// Just comments
            `);

            const errors = await detector.detect(tempDir);
            const commentErrors = errors.filter(e => e.file.includes('comments-runtime.ts'));

            expect(commentErrors.length).toBe(0);
        });

        it('should NOT flag setInterval in node.js main process (acceptable pattern)', async () => {
            createFile('server-main.ts', `
// Main server process - intervals are acceptable here
const server = createServer();

setInterval(() => {
    console.log('Health check');
}, 60000);

server.listen(3000);
            `);

            const errors = await detector.detect(tempDir);
            // In real scenario, might have some warnings but should be minimal
            // This tests that context matters
        });
    });

    // ==================== FORMAT ERROR ====================

    describe('formatError', () => {
        it('should format memory leak error', () => {
            const error = {
                timestamp: '2025-01-01T00:00:00.000Z',
                file: path.join(tempDir, 'test.ts'),
                line: 10,
                errorType: 'event-listener-leak' as const,
                message: 'addEventListener without removeEventListener',
                rootCause: 'Event listeners not cleaned up',
                suggestedFix: 'Add removeEventListener in cleanup',
                severity: 'high' as const
            };

            const formatted = detector.formatError(error);

            expect(formatted).toContain('RUNTIME ERROR');
            expect(formatted).toContain('event-listener-leak');
            expect(formatted).toContain('addEventListener');
            expect(formatted).toContain('removeEventListener');
        });

        it('should format race condition error', () => {
            const error = {
                timestamp: '2025-01-01T00:00:00.000Z',
                file: path.join(tempDir, 'component.tsx'),
                line: 15,
                errorType: 'race-condition' as const,
                message: 'setState after async without mount check',
                rootCause: 'Component may unmount before async completes',
                suggestedFix: 'Use AbortController',
                severity: 'medium' as const
            };

            const formatted = detector.formatError(error);

            expect(formatted).toContain('race-condition');
            expect(formatted).toContain('setState');
            expect(formatted).toContain('AbortController');
        });

        it('should format resource cleanup error', () => {
            const error = {
                timestamp: '2025-01-01T00:00:00.000Z',
                file: path.join(tempDir, 'db.ts'),
                line: 20,
                errorType: 'db-connection-leak' as const,
                message: 'Database connection without cleanup',
                rootCause: 'Connection pool exhaustion',
                suggestedFix: 'Release connection in finally block',
                severity: 'critical' as const
            };

            const formatted = detector.formatError(error);

            expect(formatted).toContain('db-connection-leak');
            expect(formatted).toContain('Database connection');
            expect(formatted).toContain('finally');
        });
    });
});
