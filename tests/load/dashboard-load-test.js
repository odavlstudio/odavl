/**
 * k6 Load Testing Suite
 * Dashboard Performance Test - 100K+ concurrent users
 */

import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';
import { htmlReport } from 'https://raw.githubusercontent.com/benc-uk/k6-reporter/main/dist/bundle.js';

// Custom metrics
const errorRate = new Rate('errors');
const apiDuration = new Trend('api_duration');
const pageLoadTime = new Trend('page_load_time');
const requestCounter = new Counter('requests_total');

// Test configuration
export const options = {
  stages: [
    // Warm-up phase
    { duration: '2m', target: 100 },     // Ramp up to 100 users
    { duration: '3m', target: 100 },     // Stay at 100 users
    
    // Load test phase
    { duration: '2m', target: 1000 },    // Ramp to 1K users
    { duration: '5m', target: 1000 },    // Stay at 1K users
    
    // Stress test phase
    { duration: '2m', target: 10000 },   // Ramp to 10K users
    { duration: '5m', target: 10000 },   // Stay at 10K users
    
    // Peak test phase (spike)
    { duration: '1m', target: 50000 },   // Spike to 50K users
    { duration: '2m', target: 50000 },   // Stay at 50K users
    
    // Endurance test phase
    { duration: '2m', target: 100000 },  // Ramp to 100K users
    { duration: '10m', target: 100000 }, // Stay at 100K users
    
    // Cool down
    { duration: '5m', target: 0 },       // Ramp down
  ],
  
  thresholds: {
    // HTTP metrics
    'http_req_duration': [
      'p(95)<500',   // 95% of requests must complete below 500ms
      'p(99)<1000',  // 99% of requests must complete below 1s
      'max<5000',    // No request should take more than 5s
    ],
    'http_req_failed': ['rate<0.01'],  // Error rate < 1%
    
    // Custom metrics
    'errors': ['rate<0.05'],           // Custom error rate < 5%
    'api_duration': [
      'p(95)<300',   // API P95 < 300ms
      'p(99)<500',   // API P99 < 500ms
    ],
    'page_load_time': [
      'p(95)<2000',  // Page load P95 < 2s
      'p(99)<3000',  // Page load P99 < 3s
    ],
  },
  
  // Browser-like behavior
  userAgent: 'k6/1.0 (Load Test)',
  
  // Connection settings
  noConnectionReuse: false,
  batch: 10,
  batchPerHost: 5,
};

// Test configuration
const BASE_URL = __ENV.BASE_URL || 'https://odavl.studio';
const API_TOKEN = __ENV.API_TOKEN || '';

// Test users (pre-created for load testing)
const TEST_USERS = JSON.parse(open('./test-users.json'));

/**
 * Setup: Runs once before tests
 */
export function setup() {
  console.log(`Starting load test against ${BASE_URL}`);
  console.log(`Target: 100K concurrent users`);
  console.log(`Duration: ~40 minutes`);
  
  // Health check
  const healthCheck = http.get(`${BASE_URL}/api/health`);
  check(healthCheck, {
    'health check passed': (r) => r.status === 200,
  });
  
  return { startTime: new Date().toISOString() };
}

/**
 * Main test scenario
 */
export default function(data) {
  // Select random test user
  const user = TEST_USERS[Math.floor(Math.random() * TEST_USERS.length)];
  const token = user.token;
  
  const headers = {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
  
  // Scenario 1: Dashboard access (70% of traffic)
  if (Math.random() < 0.7) {
    dashboardScenario(headers);
  }
  // Scenario 2: API operations (20% of traffic)
  else if (Math.random() < 0.9) {
    apiScenario(headers);
  }
  // Scenario 3: Real-time updates (10% of traffic)
  else {
    realtimeScenario(headers);
  }
  
  // Think time: 1-5 seconds (simulate real user behavior)
  sleep(Math.random() * 4 + 1);
}

/**
 * Dashboard browsing scenario
 */
function dashboardScenario(headers) {
  group('Dashboard Browsing', () => {
    // Load dashboard homepage
    let res = http.get(`${BASE_URL}/dashboard`, { headers });
    
    requestCounter.add(1);
    pageLoadTime.add(res.timings.duration);
    
    check(res, {
      'dashboard loaded': (r) => r.status === 200,
      'dashboard TTFB < 200ms': (r) => r.timings.waiting < 200,
      'dashboard contains nav': (r) => r.body.includes('navigation'),
    }) || errorRate.add(1);
    
    sleep(2);
    
    // Load Insight page
    res = http.get(`${BASE_URL}/dashboard/insight`, { headers });
    
    requestCounter.add(1);
    pageLoadTime.add(res.timings.duration);
    
    check(res, {
      'insight page loaded': (r) => r.status === 200,
      'insight TTFB < 200ms': (r) => r.timings.waiting < 200,
    }) || errorRate.add(1);
    
    sleep(1);
    
    // Load Autopilot page
    res = http.get(`${BASE_URL}/dashboard/autopilot`, { headers });
    
    requestCounter.add(1);
    pageLoadTime.add(res.timings.duration);
    
    check(res, {
      'autopilot page loaded': (r) => r.status === 200,
    }) || errorRate.add(1);
  });
}

/**
 * API operations scenario
 */
function apiScenario(headers) {
  group('API Operations', () => {
    // Fetch Insight issues
    let res = http.get(`${BASE_URL}/api/trpc/insight.getIssues?projectId=test-project`, {
      headers,
    });
    
    requestCounter.add(1);
    apiDuration.add(res.timings.duration);
    
    check(res, {
      'insight API success': (r) => r.status === 200,
      'insight API < 300ms': (r) => r.timings.duration < 300,
      'insight API returns JSON': (r) => r.headers['Content-Type']?.includes('json'),
    }) || errorRate.add(1);
    
    sleep(0.5);
    
    // Fetch Autopilot runs
    res = http.get(`${BASE_URL}/api/trpc/autopilot.getRuns?projectId=test-project`, {
      headers,
    });
    
    requestCounter.add(1);
    apiDuration.add(res.timings.duration);
    
    check(res, {
      'autopilot API success': (r) => r.status === 200,
      'autopilot API < 300ms': (r) => r.timings.duration < 300,
    }) || errorRate.add(1);
    
    sleep(0.5);
    
    // Fetch Guardian tests
    res = http.get(`${BASE_URL}/api/trpc/guardian.getTests?projectId=test-project`, {
      headers,
    });
    
    requestCounter.add(1);
    apiDuration.add(res.timings.duration);
    
    check(res, {
      'guardian API success': (r) => r.status === 200,
      'guardian API < 300ms': (r) => r.timings.duration < 300,
    }) || errorRate.add(1);
    
    sleep(0.5);
    
    // Fetch analytics
    res = http.get(`${BASE_URL}/api/trpc/analytics.getMetrics?orgId=test-org&range=7d`, {
      headers,
    });
    
    requestCounter.add(1);
    apiDuration.add(res.timings.duration);
    
    check(res, {
      'analytics API success': (r) => r.status === 200,
      'analytics API < 500ms': (r) => r.timings.duration < 500,
    }) || errorRate.add(1);
  });
}

/**
 * Real-time updates scenario (WebSocket)
 */
function realtimeScenario(headers) {
  group('Real-time Updates', () => {
    // Poll for updates (simulating WebSocket)
    for (let i = 0; i < 5; i++) {
      const res = http.get(`${BASE_URL}/api/trpc/realtime.poll?lastEventId=${Date.now()}`, {
        headers,
      });
      
      requestCounter.add(1);
      
      check(res, {
        'realtime poll success': (r) => r.status === 200 || r.status === 304,
      }) || errorRate.add(1);
      
      sleep(1);
    }
  });
}

/**
 * Teardown: Runs once after all tests
 */
export function teardown(data) {
  console.log(`Load test completed`);
  console.log(`Started: ${data.startTime}`);
  console.log(`Ended: ${new Date().toISOString()}`);
}

/**
 * Generate HTML report
 */
export function handleSummary(data) {
  return {
    'load-test-report.html': htmlReport(data),
    'load-test-results.json': JSON.stringify(data),
  };
}
