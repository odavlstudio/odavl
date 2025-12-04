/**
 * K6 Load Test - Guardian API
 * Tests API endpoints under load with gradual ramp-up
 * 
 * Run: k6 run loadtest-api.js
 * Run with Docker: docker run -v $(pwd):/scripts grafana/k6 run /scripts/loadtest-api.js
 */

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';

// Custom metrics
const errorRate = new Rate('errors');
const apiLatency = new Trend('api_latency');
const requestCounter = new Counter('requests_total');

// Test configuration
export const options = {
    stages: [
        { duration: '2m', target: 50 },   // Ramp-up to 50 users
        { duration: '5m', target: 50 },   // Stay at 50 users
        { duration: '2m', target: 100 },  // Ramp-up to 100 users
        { duration: '5m', target: 100 },  // Stay at 100 users
        { duration: '2m', target: 200 },  // Ramp-up to 200 users
        { duration: '5m', target: 200 },  // Stay at 200 users
        { duration: '3m', target: 0 },    // Ramp-down to 0 users
    ],
    thresholds: {
        http_req_duration: ['p(95)<500', 'p(99)<1000'], // 95% < 500ms, 99% < 1s
        http_req_failed: ['rate<0.01'],                  // Error rate < 1%
        errors: ['rate<0.01'],                           // Custom error rate < 1%
    },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3003';

// Test scenarios
export default function () {
    const scenarios = [
        testHealthCheck,
        testGetTestRuns,
        testGetMonitors,
        testMetrics,
    ];

    // Randomly pick a scenario
    const scenario = scenarios[Math.floor(Math.random() * scenarios.length)];
    scenario();

    sleep(1); // Think time between requests
}

// Scenario 1: Health Check
function testHealthCheck() {
    const res = http.get(`${BASE_URL}/api/health`);

    const success = check(res, {
        'health check status is 200': (r) => r.status === 200,
        'health check has status field': (r) => JSON.parse(r.body).status !== undefined,
        'health check response time < 200ms': (r) => r.timings.duration < 200,
    });

    errorRate.add(!success);
    apiLatency.add(res.timings.duration);
    requestCounter.add(1);
}

// Scenario 2: Get Test Runs
function testGetTestRuns() {
    const res = http.get(`${BASE_URL}/api/test-runs?limit=20`);

    const success = check(res, {
        'get test runs status is 200': (r) => r.status === 200,
        'get test runs returns array': (r) => Array.isArray(JSON.parse(r.body)),
        'get test runs response time < 500ms': (r) => r.timings.duration < 500,
    });

    errorRate.add(!success);
    apiLatency.add(res.timings.duration);
    requestCounter.add(1);
}

// Scenario 3: Get Monitors
function testGetMonitors() {
    const res = http.get(`${BASE_URL}/api/monitors`);

    const success = check(res, {
        'get monitors status is 200': (r) => r.status === 200,
        'get monitors returns array': (r) => Array.isArray(JSON.parse(r.body)),
        'get monitors response time < 500ms': (r) => r.timings.duration < 500,
    });

    errorRate.add(!success);
    apiLatency.add(res.timings.duration);
    requestCounter.add(1);
}

// Scenario 4: Metrics Endpoint
function testMetrics() {
    const res = http.get(`${BASE_URL}/api/metrics`);

    const success = check(res, {
        'metrics status is 200': (r) => r.status === 200,
        'metrics response time < 300ms': (r) => r.timings.duration < 300,
    });

    errorRate.add(!success);
    apiLatency.add(res.timings.duration);
    requestCounter.add(1);
}

// Setup - runs once before test
export function setup() {
    console.log(`🚀 Starting load test against ${BASE_URL}`);
    console.log(`📊 Target: 200 concurrent users`);
    console.log(`⏱️  Duration: 24 minutes`);
}

// Teardown - runs once after test
export function teardown(data) {
    console.log('✅ Load test completed');
}
