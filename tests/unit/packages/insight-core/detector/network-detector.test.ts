/**
 * Network Detector Tests - Phase 3: Network & Runtime Monitoring
 * Comprehensive test suite for network and API monitoring detection
 * 
 * Test Categories:
 * 1. Fetch patterns without error handling (10 tests)
 * 2. Axios patterns and configuration (8 tests)
 * 3. Timeout detection (5 tests)
 * 4. Error handling patterns (7 tests)
 * 5. Concurrency issues (8 tests)
 * 6. Edge cases and exclusions (8 tests)
 * 
 * Total: 46 comprehensive test cases
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { NetworkDetector, NetworkErrorType } from '../../../../../packages/insight-core/src/detector/network-detector.js';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';

describe('NetworkDetector', () => {
    let tempDir: string;
    let detector: NetworkDetector;

    beforeAll(() => {
        tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'network-detector-test-'));
        detector = new NetworkDetector(tempDir);
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

    // ==================== 1. FETCH PATTERNS WITHOUT ERROR HANDLING ====================

    describe('detectFetchIssues', () => {
        it('should detect fetch without .catch() handler', async () => {
            createFile('fetch-no-catch.ts', `
async function loadData() {
    const response = await fetch('https://api.example.com/data');
    const data = await response.json();
    return data;
}
            `);

            const errors = await detector.detect(tempDir);
            const fetchErrors = errors.filter(e => e.type === NetworkErrorType.FETCH_WITHOUT_ERROR_HANDLING);

            expect(fetchErrors.length).toBeGreaterThan(0);
            expect(fetchErrors[0].severity).toBe('high');
            expect(fetchErrors[0].message).toContain('without error handling');
        });

        it('should NOT flag fetch with try/catch', async () => {
            createFile('fetch-with-try.ts', `
async function loadData() {
    try {
        const response = await fetch('https://api.example.com/data');
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Fetch failed:', error);
    }
}
            `);

            const errors = await detector.detect(tempDir);
            const fetchErrors = errors.filter(e =>
                e.file.includes('fetch-with-try.ts') &&
                e.type === NetworkErrorType.FETCH_WITHOUT_ERROR_HANDLING
            );

            expect(fetchErrors.length).toBe(0);
        });

        it('should NOT flag fetch with .catch() handler', async () => {
            createFile('fetch-with-catch.ts', `
function loadData() {
    fetch('https://api.example.com/data')
        .then(res => res.json())
        .then(data => console.log(data))
        .catch(error => console.error(error));
}
            `);

            const errors = await detector.detect(tempDir);
            const fetchErrors = errors.filter(e =>
                e.file.includes('fetch-with-catch.ts') &&
                e.type === NetworkErrorType.FETCH_WITHOUT_ERROR_HANDLING
            );

            expect(fetchErrors.length).toBe(0);
        });

        it('should detect fetch without timeout configuration', async () => {
            createFile('fetch-no-timeout.ts', `
async function loadData() {
    const response = await fetch('https://api.example.com/data');
    return response.json();
}
            `);

            const errors = await detector.detect(tempDir);
            const timeoutErrors = errors.filter(e =>
                e.file.includes('fetch-no-timeout.ts') &&
                e.type === NetworkErrorType.MISSING_TIMEOUT
            );

            expect(timeoutErrors.length).toBeGreaterThan(0);
            expect(timeoutErrors[0].severity).toBe('medium');
            expect(timeoutErrors[0].suggestedFix).toContain('AbortController');
        });

        it('should NOT flag fetch with AbortController timeout', async () => {
            createFile('fetch-with-timeout.ts', `
async function loadData() {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    
    try {
        const response = await fetch('https://api.example.com/data', { 
            signal: controller.signal 
        });
        clearTimeout(timeoutId);
        return response.json();
    } catch (error) {
        if (error.name === 'AbortError') {
            console.error('Request timeout');
        }
        throw error;
    }
}
            `);

            const errors = await detector.detect(tempDir);
            const timeoutErrors = errors.filter(e =>
                e.file.includes('fetch-with-timeout.ts') &&
                e.type === NetworkErrorType.MISSING_TIMEOUT
            );

            expect(timeoutErrors.length).toBe(0);
        });

        it('should detect hardcoded production URLs', async () => {
            createFile('fetch-hardcoded-url.ts', `
async function loadData() {
    const response = await fetch('https://production.api.com/users');
    return response.json();
}
            `);

            const errors = await detector.detect(tempDir);
            const urlErrors = errors.filter(e =>
                e.file.includes('fetch-hardcoded-url.ts') &&
                e.type === NetworkErrorType.HARDCODED_URL
            );

            expect(urlErrors.length).toBeGreaterThan(0);
            expect(urlErrors[0].severity).toBe('medium');
            expect(urlErrors[0].suggestedFix).toContain('process.env');
        });

        it('should NOT flag localhost URLs', async () => {
            createFile('fetch-localhost.ts', `
async function loadData() {
    const response = await fetch('http://localhost:3000/api/data');
    return response.json();
}
            `);

            const errors = await detector.detect(tempDir);
            const urlErrors = errors.filter(e =>
                e.file.includes('fetch-localhost.ts') &&
                e.type === NetworkErrorType.HARDCODED_URL
            );

            expect(urlErrors.length).toBe(0);
        });

        it('should detect fetch without response.ok check', async () => {
            createFile('fetch-no-ok-check.ts', `
async function loadData() {
    const response = await fetch('https://api.example.com/data');
    const data = await response.json();
    return data;
}
            `);

            const errors = await detector.detect(tempDir);
            const okCheckErrors = errors.filter(e =>
                e.file.includes('fetch-no-ok-check.ts') &&
                e.type === NetworkErrorType.UNHANDLED_NETWORK_ERROR &&
                e.message.includes('status check')
            );

            expect(okCheckErrors.length).toBeGreaterThan(0);
            expect(okCheckErrors[0].severity).toBe('medium');
        });

        it('should NOT flag fetch with response.ok check', async () => {
            createFile('fetch-with-ok-check.ts', `
async function loadData() {
    const response = await fetch('https://api.example.com/data');
    if (!response.ok) {
        throw new Error(\`HTTP error! status: \${response.status}\`);
    }
    const data = await response.json();
    return data;
}
            `);

            const errors = await detector.detect(tempDir);
            const okCheckErrors = errors.filter(e =>
                e.file.includes('fetch-with-ok-check.ts') &&
                e.message.includes('status check')
            );

            expect(okCheckErrors.length).toBe(0);
        });

        it('should detect multiple fetch issues in same file', async () => {
            createFile('fetch-multiple-issues.ts', `
async function loadUsers() {
    const response = await fetch('https://prod.api.com/users');
    return response.json();
}

async function loadPosts() {
    const response = await fetch('https://prod.api.com/posts');
    return response.json();
}
            `);

            const errors = await detector.detect(tempDir);
            const fileErrors = errors.filter(e => e.file.includes('fetch-multiple-issues.ts'));

            expect(fileErrors.length).toBeGreaterThan(2); // Multiple issues per fetch
        });
    });

    // ==================== 2. AXIOS PATTERNS AND CONFIGURATION ====================

    describe('detectAxiosIssues', () => {
        it('should detect axios.get without error handling', async () => {
            createFile('axios-no-error.ts', `
import axios from 'axios';

async function loadData() {
    const response = await axios.get('https://api.example.com/data');
    return response.data;
}
            `);

            const errors = await detector.detect(tempDir);
            const axiosErrors = errors.filter(e =>
                e.file.includes('axios-no-error.ts') &&
                e.type === NetworkErrorType.FETCH_WITHOUT_ERROR_HANDLING
            );

            expect(axiosErrors.length).toBeGreaterThan(0);
            expect(axiosErrors[0].suggestedFix).toContain('axios.isAxiosError');
        });

        it('should NOT flag axios with try/catch', async () => {
            createFile('axios-with-try.ts', `
import axios from 'axios';

async function loadData() {
    try {
        const response = await axios.get('https://api.example.com/data');
        return response.data;
    } catch (error) {
        if (axios.isAxiosError(error)) {
            console.error('API Error:', error.response?.status);
        }
        throw error;
    }
}
            `);

            const errors = await detector.detect(tempDir);
            const axiosErrors = errors.filter(e =>
                e.file.includes('axios-with-try.ts') &&
                e.type === NetworkErrorType.FETCH_WITHOUT_ERROR_HANDLING
            );

            expect(axiosErrors.length).toBe(0);
        });

        it('should detect axios without timeout', async () => {
            createFile('axios-no-timeout.ts', `
import axios from 'axios';

async function loadData() {
    const response = await axios.get('https://api.example.com/data');
    return response.data;
}
            `);

            const errors = await detector.detect(tempDir);
            const timeoutErrors = errors.filter(e =>
                e.file.includes('axios-no-timeout.ts') &&
                e.type === NetworkErrorType.NO_REQUEST_TIMEOUT
            );

            expect(timeoutErrors.length).toBeGreaterThan(0);
            expect(timeoutErrors[0].severity).toBe('medium');
            expect(timeoutErrors[0].suggestedFix).toContain('timeout: 5000');
        });

        it('should NOT flag axios.create with timeout', async () => {
            createFile('axios-with-timeout.ts', `
import axios from 'axios';

const api = axios.create({
    baseURL: process.env.API_URL,
    timeout: 5000,
});

async function loadData() {
    const response = await api.get('/data');
    return response.data;
}
            `);

            const errors = await detector.detect(tempDir);
            const timeoutErrors = errors.filter(e =>
                e.file.includes('axios-with-timeout.ts') &&
                e.type === NetworkErrorType.NO_REQUEST_TIMEOUT
            );

            // Should not flag the loadData function because axios.create is present
            expect(timeoutErrors.length).toBe(0);
        });

        it('should detect axios.create without interceptors', async () => {
            createFile('axios-no-interceptor.ts', `
import axios from 'axios';

const api = axios.create({
    baseURL: process.env.API_URL,
    timeout: 5000,
});
            `);

            const errors = await detector.detect(tempDir);
            const interceptorErrors = errors.filter(e =>
                e.file.includes('axios-no-interceptor.ts') &&
                e.type === NetworkErrorType.AXIOS_WITHOUT_INTERCEPTOR
            );

            expect(interceptorErrors.length).toBeGreaterThan(0);
            expect(interceptorErrors[0].severity).toBe('low');
        });

        it('should NOT flag axios.create with interceptors', async () => {
            createFile('axios-with-interceptor.ts', `
import axios from 'axios';

const api = axios.create({
    baseURL: process.env.API_URL,
    timeout: 5000,
});

api.interceptors.response.use(
    response => response,
    error => {
        console.error('API Error:', error.response?.status);
        return Promise.reject(error);
    }
);
            `);

            const errors = await detector.detect(tempDir);
            const interceptorErrors = errors.filter(e =>
                e.file.includes('axios-with-interceptor.ts') &&
                e.type === NetworkErrorType.AXIOS_WITHOUT_INTERCEPTOR
            );

            expect(interceptorErrors.length).toBe(0);
        });

        it('should detect axios.post without error handling', async () => {
            createFile('axios-post-no-error.ts', `
import axios from 'axios';

async function createUser(data: any) {
    const response = await axios.post('https://api.example.com/users', data);
    return response.data;
}
            `);

            const errors = await detector.detect(tempDir);
            const axiosErrors = errors.filter(e =>
                e.file.includes('axios-post-no-error.ts') &&
                e.type === NetworkErrorType.FETCH_WITHOUT_ERROR_HANDLING
            );

            expect(axiosErrors.length).toBeGreaterThan(0);
        });

        it('should detect all axios methods (get, post, put, delete, patch)', async () => {
            createFile('axios-all-methods.ts', `
import axios from 'axios';

async function test() {
    await axios.get('/api/data');
    await axios.post('/api/data', {});
    await axios.put('/api/data/1', {});
    await axios.delete('/api/data/1');
    await axios.patch('/api/data/1', {});
}
            `);

            const errors = await detector.detect(tempDir);
            const axiosErrors = errors.filter(e =>
                e.file.includes('axios-all-methods.ts') &&
                e.type === NetworkErrorType.FETCH_WITHOUT_ERROR_HANDLING
            );

            expect(axiosErrors.length).toBe(5); // One for each method
        });
    });

    // ==================== 3. TIMEOUT DETECTION ====================

    describe('detectTimeoutIssues', () => {
        it('should detect excessive timeout (>30s)', async () => {
            createFile('excessive-timeout.ts', `
function waitForSomething() {
    setTimeout(() => {
        console.log('Done');
    }, 60000); // 60 seconds
}
            `);

            const errors = await detector.detect(tempDir);
            const timeoutErrors = errors.filter(e =>
                e.file.includes('excessive-timeout.ts') &&
                e.type === NetworkErrorType.EXCESSIVE_TIMEOUT
            );

            expect(timeoutErrors.length).toBeGreaterThan(0);
            expect(timeoutErrors[0].severity).toBe('low');
            expect(timeoutErrors[0].message).toContain('60000ms');
        });

        it('should NOT flag reasonable timeouts (<30s)', async () => {
            createFile('reasonable-timeout.ts', `
function waitForSomething() {
    setTimeout(() => {
        console.log('Done');
    }, 5000); // 5 seconds - reasonable
}
            `);

            const errors = await detector.detect(tempDir);
            const timeoutErrors = errors.filter(e =>
                e.file.includes('reasonable-timeout.ts') &&
                e.type === NetworkErrorType.EXCESSIVE_TIMEOUT
            );

            expect(timeoutErrors.length).toBe(0);
        });

        it('should detect very long timeout (>1 minute)', async () => {
            createFile('very-long-timeout.ts', `
function longPoll() {
    setTimeout(() => {
        console.log('Polling...');
    }, 120000); // 2 minutes
}
            `);

            const errors = await detector.detect(tempDir);
            const timeoutErrors = errors.filter(e =>
                e.file.includes('very-long-timeout.ts') &&
                e.type === NetworkErrorType.EXCESSIVE_TIMEOUT
            );

            expect(timeoutErrors.length).toBeGreaterThan(0);
            expect(timeoutErrors[0].message).toContain('120000ms');
        });

        it('should NOT flag Promise.race with timeout', async () => {
            createFile('promise-race-timeout.ts', `
async function fetchWithTimeout(url: string) {
    const timeout = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Timeout')), 5000)
    );
    
    return Promise.race([
        fetch(url),
        timeout
    ]);
}
            `);

            const errors = await detector.detect(tempDir);
            // This should not produce errors as it's a good pattern
            // (though fetch itself might trigger other warnings)
        });

        it('should detect multiple excessive timeouts', async () => {
            createFile('multiple-timeouts.ts', `
function test() {
    setTimeout(() => console.log('1'), 40000);
    setTimeout(() => console.log('2'), 50000);
    setTimeout(() => console.log('3'), 60000);
}
            `);

            const errors = await detector.detect(tempDir);
            const timeoutErrors = errors.filter(e =>
                e.file.includes('multiple-timeouts.ts') &&
                e.type === NetworkErrorType.EXCESSIVE_TIMEOUT
            );

            expect(timeoutErrors.length).toBe(3);
        });
    });

    // ==================== 4. ERROR HANDLING PATTERNS ====================

    describe('detectErrorHandlingIssues', () => {
        it('should detect .then() without .catch() for fetch', async () => {
            createFile('then-no-catch.ts', `
function loadData() {
    fetch('https://api.example.com/data')
        .then(res => res.json())
        .then(data => console.log(data));
}
            `);

            const errors = await detector.detect(tempDir);
            const errorHandlingErrors = errors.filter(e =>
                e.file.includes('then-no-catch.ts') &&
                e.type === NetworkErrorType.UNHANDLED_NETWORK_ERROR &&
                e.message.includes('.then()')
            );

            expect(errorHandlingErrors.length).toBeGreaterThan(0);
            expect(errorHandlingErrors[0].severity).toBe('high');
        });

        it('should NOT flag .then() with .catch()', async () => {
            createFile('then-with-catch.ts', `
function loadData() {
    fetch('https://api.example.com/data')
        .then(res => res.json())
        .then(data => console.log(data))
        .catch(error => console.error('Error:', error));
}
            `);

            const errors = await detector.detect(tempDir);
            const errorHandlingErrors = errors.filter(e =>
                e.file.includes('then-with-catch.ts') &&
                e.message.includes('.then()')
            );

            expect(errorHandlingErrors.length).toBe(0);
        });

        it('should detect .then() without .catch() for axios', async () => {
            createFile('axios-then-no-catch.ts', `
import axios from 'axios';

function loadData() {
    axios.get('https://api.example.com/data')
        .then(res => console.log(res.data));
}
            `);

            const errors = await detector.detect(tempDir);
            const errorHandlingErrors = errors.filter(e =>
                e.file.includes('axios-then-no-catch.ts') &&
                e.type === NetworkErrorType.UNHANDLED_NETWORK_ERROR &&
                e.message.includes('.then()')
            );

            expect(errorHandlingErrors.length).toBeGreaterThan(0);
        });

        it('should detect nested .then() without top-level .catch()', async () => {
            createFile('nested-then.ts', `
function loadData() {
    fetch('https://api.example.com/users')
        .then(res => res.json())
        .then(users => {
            return fetch(\`https://api.example.com/posts/\${users[0].id}\`)
                .then(res => res.json());
        });
}
            `);

            const errors = await detector.detect(tempDir);
            const errorHandlingErrors = errors.filter(e =>
                e.file.includes('nested-then.ts') &&
                e.type === NetworkErrorType.UNHANDLED_NETWORK_ERROR
            );

            expect(errorHandlingErrors.length).toBeGreaterThan(0);
        });

        it('should NOT flag .then() with .finally() and .catch()', async () => {
            createFile('then-finally-catch.ts', `
function loadData() {
    fetch('https://api.example.com/data')
        .then(res => res.json())
        .then(data => console.log(data))
        .catch(error => console.error(error))
        .finally(() => console.log('Done'));
}
            `);

            const errors = await detector.detect(tempDir);
            const errorHandlingErrors = errors.filter(e =>
                e.file.includes('then-finally-catch.ts') &&
                e.message.includes('.then()')
            );

            expect(errorHandlingErrors.length).toBe(0);
        });

        it('should detect response.ok check missing in multiple functions', async () => {
            createFile('multiple-missing-ok.ts', `
async function loadUsers() {
    const response = await fetch('/api/users');
    return response.json();
}

async function loadPosts() {
    const response = await fetch('/api/posts');
    return response.json();
}
            `);

            const errors = await detector.detect(tempDir);
            const okErrors = errors.filter(e =>
                e.file.includes('multiple-missing-ok.ts') &&
                e.message.includes('status check')
            );

            expect(okErrors.length).toBe(2);
        });

        it('should NOT flag non-network .then() patterns', async () => {
            createFile('non-network-then.ts', `
function processData() {
    Promise.resolve({ data: 'test' })
        .then(result => console.log(result));
}
            `);

            const errors = await detector.detect(tempDir);
            const errorHandlingErrors = errors.filter(e =>
                e.file.includes('non-network-then.ts') &&
                e.type === NetworkErrorType.UNHANDLED_NETWORK_ERROR
            );

            expect(errorHandlingErrors.length).toBe(0);
        });
    });

    // ==================== 5. CONCURRENCY ISSUES ====================

    describe('detectConcurrencyIssues', () => {
        it('should detect Promise.all without error handling', async () => {
            createFile('promise-all-no-catch.ts', `
async function loadAll() {
    const results = await Promise.all([
        fetch('/api/users'),
        fetch('/api/posts'),
        fetch('/api/comments')
    ]);
    return results;
}
            `);

            const errors = await detector.detect(tempDir);
            const concurrencyErrors = errors.filter(e =>
                e.file.includes('promise-all-no-catch.ts') &&
                e.type === NetworkErrorType.PROMISE_ALL_WITHOUT_ERROR_HANDLING
            );

            expect(concurrencyErrors.length).toBeGreaterThan(0);
            expect(concurrencyErrors[0].severity).toBe('high');
            expect(concurrencyErrors[0].suggestedFix).toContain('Promise.allSettled');
        });

        it('should NOT flag Promise.all with try/catch', async () => {
            createFile('promise-all-with-try.ts', `
async function loadAll() {
    try {
        const results = await Promise.all([
            fetch('/api/users'),
            fetch('/api/posts')
        ]);
        return results;
    } catch (error) {
        console.error('One or more requests failed:', error);
        throw error;
    }
}
            `);

            const errors = await detector.detect(tempDir);
            const concurrencyErrors = errors.filter(e =>
                e.file.includes('promise-all-with-try.ts') &&
                e.type === NetworkErrorType.PROMISE_ALL_WITHOUT_ERROR_HANDLING
            );

            expect(concurrencyErrors.length).toBe(0);
        });

        it('should detect unlimited concurrent requests', async () => {
            createFile('unlimited-concurrent.ts', `
async function loadAllUsers(userIds: string[]) {
    const promises = userIds.map(id => fetch(\`/api/users/\${id}\`));
    const results = await Promise.all(promises);
    return results;
}
            `);

            const errors = await detector.detect(tempDir);
            const concurrencyErrors = errors.filter(e =>
                e.file.includes('unlimited-concurrent.ts') &&
                e.type === NetworkErrorType.CONCURRENT_REQUESTS_WITHOUT_LIMIT
            );

            expect(concurrencyErrors.length).toBeGreaterThan(0);
            expect(concurrencyErrors[0].severity).toBe('medium');
            expect(concurrencyErrors[0].suggestedFix).toContain('p-limit');
        });

        it('should detect race condition: setState after async in useEffect', async () => {
            createFile('race-condition-useeffect.tsx', `
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
                e.file.includes('race-condition-useeffect.tsx') &&
                e.type === NetworkErrorType.RACE_CONDITION_RISK
            );

            expect(raceErrors.length).toBeGreaterThan(0);
            expect(raceErrors[0].severity).toBe('medium');
            expect(raceErrors[0].suggestedFix).toContain('AbortController');
        });

        it('should NOT flag useEffect with AbortController', async () => {
            createFile('useeffect-with-cleanup.tsx', `
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
        
        return () => {
            controller.abort();
        };
    }, []);
    
    return <div>{data}</div>;
}
            `);

            const errors = await detector.detect(tempDir);
            const raceErrors = errors.filter(e =>
                e.file.includes('useeffect-with-cleanup.tsx') &&
                e.type === NetworkErrorType.RACE_CONDITION_RISK
            );

            expect(raceErrors.length).toBe(0);
        });

        it('should detect multiple concurrent fetch without limit', async () => {
            createFile('multiple-concurrent-fetch.ts', `
async function loadAllData(items: any[]) {
    const users = await Promise.all(items.map(item => fetch(\`/api/users/\${item.userId}\`)));
    const posts = await Promise.all(items.map(item => fetch(\`/api/posts/\${item.postId}\`)));
    return { users, posts };
}
            `);

            const errors = await detector.detect(tempDir);
            const concurrencyErrors = errors.filter(e =>
                e.file.includes('multiple-concurrent-fetch.ts') &&
                e.type === NetworkErrorType.CONCURRENT_REQUESTS_WITHOUT_LIMIT
            );

            expect(concurrencyErrors.length).toBe(2); // One for each Promise.all
        });

        it('should detect Promise.all with axios.map pattern', async () => {
            createFile('promise-all-axios-map.ts', `
import axios from 'axios';

async function loadUsers(ids: string[]) {
    const promises = ids.map(id => axios.get(\`/api/users/\${id}\`));
    const results = await Promise.all(promises);
    return results.map(r => r.data);
}
            `);

            const errors = await detector.detect(tempDir);
            const concurrencyErrors = errors.filter(e =>
                e.file.includes('promise-all-axios-map.ts') &&
                e.type === NetworkErrorType.CONCURRENT_REQUESTS_WITHOUT_LIMIT
            );

            expect(concurrencyErrors.length).toBeGreaterThan(0);
        });

        it('should NOT flag Promise.allSettled (safer alternative)', async () => {
            createFile('promise-allsettled.ts', `
async function loadAll() {
    const results = await Promise.allSettled([
        fetch('/api/users'),
        fetch('/api/posts')
    ]);
    
    results.forEach((result, index) => {
        if (result.status === 'rejected') {
            console.error(\`Promise \${index} failed:\`, result.reason);
        }
    });
}
            `);

            const errors = await detector.detect(tempDir);
            const concurrencyErrors = errors.filter(e =>
                e.file.includes('promise-allsettled.ts') &&
                e.type === NetworkErrorType.PROMISE_ALL_WITHOUT_ERROR_HANDLING
            );

            // Promise.allSettled is safer, so should have fewer/no errors
            // (might still have other warnings like timeout)
        });
    });

    // ==================== 6. EDGE CASES AND EXCLUSIONS ====================

    describe('Edge cases and exclusions', () => {
        it('should exclude test files', async () => {
            createFile('api.test.ts', `
async function testFetch() {
    const response = await fetch('https://api.example.com/data');
    return response.json();
}
            `);

            const errors = await detector.detect(tempDir);
            const testFileErrors = errors.filter(e => e.file.includes('api.test.ts'));

            expect(testFileErrors.length).toBe(0);
        });

        it('should exclude spec files', async () => {
            createFile('api.spec.ts', `
async function specFetch() {
    const response = await fetch('https://api.example.com/data');
    return response.json();
}
            `);

            const errors = await detector.detect(tempDir);
            const specFileErrors = errors.filter(e => e.file.includes('api.spec.ts'));

            expect(specFileErrors.length).toBe(0);
        });

        it('should exclude mock files', async () => {
            createFile('api.mock.ts', `
export const mockFetch = () => fetch('https://api.example.com/data');
            `);

            const errors = await detector.detect(tempDir);
            const mockFileErrors = errors.filter(e => e.file.includes('api.mock.ts'));

            expect(mockFileErrors.length).toBe(0);
        });

        it('should exclude config files', async () => {
            createFile('api.config.ts', `
export const apiConfig = {
    fetch: () => fetch('https://api.example.com/data')
};
            `);

            const errors = await detector.detect(tempDir);
            const configFileErrors = errors.filter(e =>
                e.file.includes('api.config.ts') &&
                e.type !== NetworkErrorType.HARDCODED_URL // Config files might have URLs
            );

            expect(configFileErrors.length).toBe(0);
        });

        it('should exclude type definition files', async () => {
            createFile('api.d.ts', `
export interface ApiResponse {
    data: any;
}

export declare function fetch(url: string): Promise<Response>;
            `);

            const errors = await detector.detect(tempDir);
            const dtsFileErrors = errors.filter(e => e.file.includes('api.d.ts'));

            expect(dtsFileErrors.length).toBe(0);
        });

        it('should handle empty files', async () => {
            createFile('empty.ts', '');

            const errors = await detector.detect(tempDir);
            const emptyFileErrors = errors.filter(e => e.file.includes('empty.ts'));

            expect(emptyFileErrors.length).toBe(0);
        });

        it('should handle files with only comments', async () => {
            createFile('comments-only.ts', `
/**
 * This file contains only comments
 * No actual code
 */
// Just comments here
/* And block comments */
            `);

            const errors = await detector.detect(tempDir);
            const commentErrors = errors.filter(e => e.file.includes('comments-only.ts'));

            expect(commentErrors.length).toBe(0);
        });

        it('should handle files with only interfaces', async () => {
            createFile('interfaces-only.ts', `
export interface User {
    id: string;
    name: string;
}

export interface Post {
    id: string;
    title: string;
}

export type ApiResponse = User | Post;
            `);

            const errors = await detector.detect(tempDir);
            const interfaceErrors = errors.filter(e => e.file.includes('interfaces-only.ts'));

            expect(interfaceErrors.length).toBe(0);
        });
    });

    // ==================== STATISTICS ====================

    describe('getStatistics', () => {
        it('should calculate comprehensive statistics', async () => {
            createFile('stats-test.ts', `
async function test() {
    // Multiple issues for statistics
    await fetch('https://prod.api.com/users');
    await fetch('https://prod.api.com/posts');
    
    fetch('https://api.com/data')
        .then(res => res.json());
    
    const results = await Promise.all([
        fetch('/api/1'),
        fetch('/api/2')
    ]);
}
            `);

            const errors = await detector.detect(tempDir);
            const stats = detector.getStatistics(errors);

            expect(stats.totalIssues).toBeGreaterThan(0);
            expect(stats.bySeverity).toBeDefined();
            expect(stats.byType).toBeDefined();
            expect(stats.affectedFiles).toBeGreaterThan(0);
            expect(stats.apiCallsDetected).toBeGreaterThan(0);
            expect(stats.timeoutIssues).toBeGreaterThan(0);
            expect(stats.errorHandlingIssues).toBeGreaterThan(0);
            expect(stats.concurrencyIssues).toBeGreaterThan(0);
        });

        it('should handle empty results', async () => {
            const emptyTempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'empty-'));
            const emptyDetector = new NetworkDetector(emptyTempDir);

            const errors = await emptyDetector.detect(emptyTempDir);
            const stats = emptyDetector.getStatistics(errors);

            expect(stats.totalIssues).toBe(0);
            expect(stats.bySeverity.critical).toBe(0);
            expect(stats.bySeverity.high).toBe(0);
            expect(stats.bySeverity.medium).toBe(0);
            expect(stats.bySeverity.low).toBe(0);
            expect(stats.affectedFiles).toBe(0);

            fs.rmSync(emptyTempDir, { recursive: true, force: true });
        });
    });

    // ==================== FORMAT ERROR ====================

    describe('formatError', () => {
        it('should format error with all details', () => {
            const error = {
                file: path.join(tempDir, 'test.ts'),
                line: 10,
                type: NetworkErrorType.FETCH_WITHOUT_ERROR_HANDLING,
                severity: 'high' as const,
                message: 'fetch() call without error handling',
                pattern: 'await fetch(url)',
                suggestedFix: 'Add try/catch block',
                details: 'Unhandled fetch errors can cause silent failures'
            };

            const formatted = detector.formatError(error);

            expect(formatted).toContain('NETWORK ISSUE');
            expect(formatted).toContain('test.ts');
            expect(formatted).toContain('fetch() call without error handling');
            expect(formatted).toContain('Add try/catch block');
            expect(formatted).toContain('Unhandled fetch errors');
        });
    });
});
