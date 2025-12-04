/**
 * K6 Stress Test - Guardian API
 * Aggressive stress test to find breaking points
 * 
 * Run: k6 run loadtest-stress.js
 */

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';

const errorRate = new Rate('errors');
const apiLatency = new Trend('api_latency');

export const options = {
    stages: [
        { duration: '1m', target: 100 },   // Fast ramp to 100
        { duration: '2m', target: 300 },   // Ramp to 300
        { duration: '2m', target: 500 },   // Ramp to 500
        { duration: '3m', target: 1000 },  // Stress: 1000 users
        { duration: '2m', target: 1500 },  // Peak stress: 1500 users
        { duration: '1m', target: 0 },     // Fast ramp down
    ],
    thresholds: {
        http_req_duration: ['p(95)<2000'],  // 95% < 2s (relaxed for stress)
        http_req_failed: ['rate<0.05'],     // Error rate < 5%
    },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3003';

export default function () {
    // Mix of endpoints
    const endpoints = [
        '/api/health',
        '/api/test-runs?limit=50',
        '/api/monitors',
        '/api/metrics',
    ];

    const endpoint = endpoints[Math.floor(Math.random() * endpoints.length)];
    const res = http.get(`${BASE_URL}${endpoint}`);

    const success = check(res, {
        'status is 200 or 429 (rate limited)': (r) => r.status === 200 || r.status === 429,
        'response time < 3s': (r) => r.timings.duration < 3000,
    });

    errorRate.add(!success);
    apiLatency.add(res.timings.duration);

    sleep(0.5); // Reduced sleep for stress test
}

export function setup() {
    console.log('⚠️  STRESS TEST - Finding breaking points');
    console.log(`🎯 Target: 1500 concurrent users (peak)`);
}

export function teardown() {
    console.log('✅ Stress test completed - Review results for bottlenecks');
}
