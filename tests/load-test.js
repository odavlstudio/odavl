/**
 * Load Testing Script for ODAVL Insight Cloud
 * 
 * Installation:
 * npm install -g k6
 * 
 * Usage:
 * k6 run load-test.js
 * k6 run --vus 200 --duration 10m load-test.js
 * 
 * Scenarios:
 * 1. Normal Load: 100 users, 10 minutes
 * 2. Peak Load: 500 users, 5 minutes
 * 3. Stress Test: 1000 users, 3 minutes
 */

import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';

// Custom metrics
const errorRate = new Rate('errors');
const loginTrend = new Trend('login_duration');
const dashboardTrend = new Trend('dashboard_duration');
const apiTrend = new Trend('api_duration');
const requestCounter = new Counter('requests_total');

// Configuration
const BASE_URL = __ENV.BASE_URL || 'https://odavl-insight.vercel.app';

// Test scenarios
export const options = {
  scenarios: {
    // Scenario 1: Normal load - Baseline performance
    normal_load: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '2m', target: 50 },   // Ramp up to 50
        { duration: '5m', target: 50 },   // Stay at 50
        { duration: '2m', target: 100 },  // Ramp to 100
        { duration: '5m', target: 100 },  // Stay at 100
        { duration: '2m', target: 0 },    // Ramp down
      ],
      gracefulRampDown: '30s',
      tags: { scenario: 'normal' },
    },

    // Scenario 2: Peak load - Expected maximum traffic
    peak_load: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '1m', target: 200 },  // Quick ramp to 200
        { duration: '3m', target: 200 },  // Stay at 200
        { duration: '1m', target: 500 },  // Spike to 500
        { duration: '2m', target: 500 },  // Stay at 500
        { duration: '1m', target: 0 },    // Ramp down
      ],
      gracefulRampDown: '30s',
      tags: { scenario: 'peak' },
      startTime: '20m', // Start after normal load
    },

    // Scenario 3: Stress test - Beyond expected capacity
    stress_test: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '1m', target: 500 },   // Ramp to 500
        { duration: '2m', target: 1000 },  // Ramp to 1000
        { duration: '3m', target: 1000 },  // Stay at 1000
        { duration: '1m', target: 0 },     // Ramp down
      ],
      gracefulRampDown: '30s',
      tags: { scenario: 'stress' },
      startTime: '30m', // Start after peak load
    },
  },

  // Performance thresholds
  thresholds: {
    // 95% of requests should be below 500ms
    http_req_duration: ['p(95)<500', 'p(99)<1000'],
    
    // Error rate should be less than 1%
    'errors': ['rate<0.01'],
    
    // 95% of requests should succeed
    'http_req_failed': ['rate<0.05'],
    
    // Login should be fast
    'login_duration': ['p(95)<800'],
    
    // Dashboard should load quickly
    'dashboard_duration': ['p(95)<1000'],
    
    // API calls should be responsive
    'api_duration': ['p(95)<400'],
  },
};

// Setup function - runs once per VU
export function setup() {
  console.log(`Starting load test against ${BASE_URL}`);
  
  // Health check
  const healthRes = http.get(`${BASE_URL}/api/health`);
  if (healthRes.status !== 200) {
    console.error('Health check failed! Server may be down.');
  }
  
  return { timestamp: Date.now() };
}

// Main test function
export default function (data) {
  requestCounter.add(1);

  // Test 1: Home page
  group('01_Homepage', () => {
    const res = http.get(BASE_URL);
    
    check(res, {
      'Homepage status is 200': (r) => r.status === 200,
      'Homepage loads in <2s': (r) => r.timings.duration < 2000,
    }) || errorRate.add(1);
    
    sleep(1);
  });

  // Test 2: Authentication flow
  group('02_Authentication', () => {
    const email = `loadtest-${__VU}-${__ITER}@odavl.com`;
    const password = 'TestP@ss123';

    // Register
    const registerStart = Date.now();
    const regRes = http.post(
      `${BASE_URL}/api/auth/register`,
      JSON.stringify({
        email,
        password,
        name: `Load Test User ${__VU}`,
      }),
      {
        headers: { 'Content-Type': 'application/json' },
      }
    );

    check(regRes, {
      'Register status is 201': (r) => r.status === 201,
      'Register has token': (r) => r.json('tokens.accessToken') !== undefined,
    }) || errorRate.add(1);

    // Login
    const loginStart = Date.now();
    const loginRes = http.post(
      `${BASE_URL}/api/auth/login`,
      JSON.stringify({ email, password }),
      {
        headers: { 'Content-Type': 'application/json' },
      }
    );

    const loginDuration = Date.now() - loginStart;
    loginTrend.add(loginDuration);

    const loginSuccess = check(loginRes, {
      'Login status is 200': (r) => r.status === 200,
      'Login returns tokens': (r) => r.json('tokens') !== undefined,
      'Login completes in <1s': (r) => loginDuration < 1000,
    });

    if (!loginSuccess) {
      errorRate.add(1);
      return; // Skip remaining tests if login fails
    }

    const accessToken = loginRes.json('tokens.accessToken');
    sleep(1);

    // Test 3: Dashboard access
    group('03_Dashboard', () => {
      const dashStart = Date.now();
      const dashRes = http.get(`${BASE_URL}/dashboard`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });

      const dashDuration = Date.now() - dashStart;
      dashboardTrend.add(dashDuration);

      check(dashRes, {
        'Dashboard status is 200': (r) => r.status === 200,
        'Dashboard loads in <2s': (r) => dashDuration < 2000,
      }) || errorRate.add(1);

      sleep(2);
    });

    // Test 4: API calls
    group('04_API_Calls', () => {
      const endpoints = [
        '/api/analysis/metrics',
        '/api/charts/trends',
        '/api/widgets/recent',
      ];

      endpoints.forEach((endpoint) => {
        const apiStart = Date.now();
        const apiRes = http.get(`${BASE_URL}${endpoint}`, {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        });

        const apiDuration = Date.now() - apiStart;
        apiTrend.add(apiDuration);

        check(apiRes, {
          [`${endpoint} status is 200`]: (r) => r.status === 200,
          [`${endpoint} responds in <500ms`]: (r) => apiDuration < 500,
        }) || errorRate.add(1);

        sleep(0.5);
      });
    });
  });

  // Think time between iterations
  sleep(Math.random() * 3 + 2); // 2-5 seconds
}

// Teardown function - runs once at the end
export function teardown(data) {
  const duration = (Date.now() - data.timestamp) / 1000;
  console.log(`Load test completed in ${duration.toFixed(2)} seconds`);
}

/**
 * Expected Results:
 * 
 * Normal Load (100 users):
 * - Homepage: <500ms (p95)
 * - Login: <800ms (p95)
 * - Dashboard: <1000ms (p95)
 * - API: <400ms (p95)
 * - Error rate: <1%
 * 
 * Peak Load (500 users):
 * - Homepage: <1000ms (p95)
 * - Login: <1500ms (p95)
 * - Dashboard: <2000ms (p95)
 * - API: <800ms (p95)
 * - Error rate: <2%
 * 
 * Stress Test (1000 users):
 * - Some degradation expected
 * - Error rate: <5%
 * - Should not crash
 * - Should recover gracefully
 */
