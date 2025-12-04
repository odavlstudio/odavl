/**
 * K6 Spike Test - Guardian API
 * Tests system recovery from sudden traffic spikes
 * 
 * Run: k6 run loadtest-spike.js
 */

import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
    stages: [
        { duration: '30s', target: 50 },    // Normal load
        { duration: '10s', target: 1000 },  // SPIKE!
        { duration: '1m', target: 1000 },   // Sustained spike
        { duration: '30s', target: 50 },    // Recovery
        { duration: '30s', target: 50 },    // Normal operation
        { duration: '10s', target: 1200 },  // Second SPIKE!
        { duration: '1m', target: 1200 },   // Sustained
        { duration: '1m', target: 0 },      // Ramp down
    ],
    thresholds: {
        http_req_duration: ['p(95)<1500'],
        http_req_failed: ['rate<0.1'], // 10% error rate acceptable during spikes
    },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3003';

export default function () {
    const res = http.get(`${BASE_URL}/api/health`);

    check(res, {
        'status is 200 or 429 or 503': (r) => [200, 429, 503].includes(r.status),
        'response time < 5s': (r) => r.timings.duration < 5000,
    });

    sleep(0.3);
}

export function setup() {
    console.log('🌊 SPIKE TEST - Testing resilience to traffic spikes');
}
