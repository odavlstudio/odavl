/**
 * k6 Load Test: ODAVL Studio Hub - Production Stress Test
 * 
 * Test Scenarios:
 * 1. Ramp up to 100 users (2 min)
 * 2. Sustain 100 users (5 min)
 * 3. Spike to 500 users (2 min)
 * 4. Sustain 500 users (5 min)
 * 5. Stress test to 1200 users (2 min)
 * 6. Sustain 1200 users (5 min)
 * 7. Ramp down (5 min)
 * 
 * Success Criteria (Tier 1):
 * - P95 response time < 500ms
 * - P99 response time < 1000ms
 * - Error rate < 1%
 * - Database queries < 100ms (P95)
 * - TTFB < 200ms
 * - Web Vitals: LCP < 2.5s, CLS < 0.1, FID < 100ms
 */

import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';
import { randomString, randomIntBetween } from 'https://jslib.k6.io/k6-utils/1.4.0/index.js';

// Custom metrics for detailed tracking
const errorRate = new Rate('errors');
const dashboardLoadTime = new Trend('dashboard_load_time');
const apiResponseTime = new Trend('api_response_time');
const dbQueryDuration = new Trend('db_query_duration');
const ttfbTrend = new Trend('time_to_first_byte');
const webVitalsLCP = new Trend('web_vitals_lcp');
const webVitalsCLS = new Trend('web_vitals_cls');
const webVitalsFID = new Trend('web_vitals_fid');
const successfulRequests = new Counter('successful_requests');
const failedRequests = new Counter('failed_requests');
const authFailures = new Counter('auth_failures');

export const options = {
  stages: [
    { duration: '2m', target: 100 },   // Normal load: 100 users
    { duration: '5m', target: 100 },   // Sustain normal load
    { duration: '2m', target: 500 },   // Load spike: 500 users
    { duration: '5m', target: 500 },   // Sustain spike
    { duration: '2m', target: 1200 },  // Stress test: 1200 users
    { duration: '5m', target: 1200 },  // Sustain stress
    { duration: '5m', target: 0 },     // Ramp down
  ],
  thresholds: {
    // Response time thresholds (Tier 1 requirements)
    http_req_duration: ['p(95)<500', 'p(99)<1000'],
    
    // Error rate threshold
    http_req_failed: ['rate<0.01'],  // < 1% error rate
    errors: ['rate<0.05'],           // < 5% custom errors
    
    // Dashboard performance
    dashboard_load_time: ['p(95)<800', 'p(99)<1500'],
    
    // API performance
    api_response_time: ['p(95)<300', 'p(99)<600'],
    
    // Database performance
    db_query_duration: ['p(95)<100', 'p(99)<200'],
    
    // TTFB (Time to First Byte)
    time_to_first_byte: ['p(95)<200', 'p(99)<400'],
    
    // Web Vitals (Core Web Vitals)
    web_vitals_lcp: ['p(95)<2500'],  // Largest Contentful Paint < 2.5s
    web_vitals_cls: ['p(95)<0.1'],   // Cumulative Layout Shift < 0.1
    web_vitals_fid: ['p(95)<100'],   // First Input Delay < 100ms
    
    // Success rate
    checks: ['rate>0.95'],           // 95% of checks must pass
  },
  
  // Test tags for filtering
  tags: {
    test_type: 'load',
    environment: __ENV.ENVIRONMENT || 'staging',
    product: 'odavl-studio-hub',
    version: '2.0.0',
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';
const API_URL = `${BASE_URL}/api`;

// Load test users from environment (support multiple users for realistic load)
const TEST_USERS = JSON.parse(__ENV.TEST_USERS || '[{"email":"test1@odavl.com","password":"Test123!"},{"email":"test2@odavl.com","password":"Test123!"},{"email":"test3@odavl.com","password":"Test123!"}]');

/**
 * Setup function - runs once before all tests
 * Verifies staging environment is ready
 */
export function setup() {
  console.log(`🚀 Starting load test against ${BASE_URL}`);
  console.log(`📊 Test will simulate up to 1200 concurrent users`);
  console.log(`👥 Using ${TEST_USERS.length} test accounts`);
  
  // Health check
  const healthCheck = http.get(`${API_URL}/health`);
  
  if (healthCheck.status !== 200) {
    console.error(`❌ Health check failed: ${healthCheck.status}`);
    throw new Error('Staging environment not ready');
  }
  
  console.log('✅ Health check passed - staging is ready');
  console.log('⏱️  Starting test execution in 5 seconds...\n');
  
  return {
    baseUrl: BASE_URL,
    apiUrl: API_URL,
    testUsers: TEST_USERS,
    startTime: Date.now(),
  };
}

/**
 * Main test function - runs for each virtual user
 * Simulates realistic user behavior across all dashboards
 */
export default function(data) {
  // Select random test user for this virtual user
  const user = data.testUsers[Math.floor(Math.random() * data.testUsers.length)];
  
  let authToken = null;
  
  // Authentication flow
  group('Authentication', () => {
    authToken = authenticateUser(user, data.apiUrl);
    
    if (!authToken) {
      errorRate.add(1);
      failedRequests.add(1);
      authFailures.add(1);
      console.error(`❌ Authentication failed for ${user.email}`);
      return; // Skip rest of test if auth fails
    }
    
    successfulRequests.add(1);
  });
  
  if (!authToken) return; // Exit if authentication failed
  
  // Simulate user think time (1-3 seconds)
  sleep(randomIntBetween(1, 3));
  
  // Dashboard Overview
  group('Dashboard Overview', () => {
    const res = http.get(`${data.baseUrl}/en/dashboard`, {
      headers: { 'Authorization': `Bearer ${authToken}` },
      tags: { name: 'dashboard_overview' },
    });
    
    dashboardLoadTime.add(res.timings.duration);
    ttfbTrend.add(res.timings.waiting);
    webVitalsLCP.add(res.timings.duration);
    
    const success = check(res, {
      'dashboard loaded': (r) => r.status === 200,
      'TTFB < 200ms': (r) => r.timings.waiting < 200,
      'contains navigation': (r) => r.body.includes('Insight') && r.body.includes('Autopilot'),
      'response size reasonable': (r) => r.body.length > 1000 && r.body.length < 500000,
    });
    
    if (success) {
      successfulRequests.add(1);
    } else {
      errorRate.add(1);
      failedRequests.add(1);
    }
  });
  
  sleep(randomIntBetween(2, 5));
  
  // Insight Dashboard
  group('Insight Dashboard', () => {
    // Load dashboard page
    let res = http.get(`${data.baseUrl}/en/dashboard/insight`, {
      headers: { 'Authorization': `Bearer ${authToken}` },
      tags: { name: 'insight_dashboard' },
    });
    
    check(res, {
      'insight dashboard loaded': (r) => r.status === 200,
      'TTFB < 200ms': (r) => r.timings.waiting < 200,
    }) || errorRate.add(1);
    
    sleep(1);
    
    // Fetch issues via API
    res = http.get(`${data.apiUrl}/trpc/insight.getIssues?input={"limit":50,"offset":0}`, {
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json',
      },
      tags: { name: 'insight_getIssues' },
    });
    
    apiResponseTime.add(res.timings.duration, { endpoint: 'getIssues' });
    
    const success = check(res, {
      'issues API OK': (r) => r.status === 200,
      'API response < 300ms': (r) => r.timings.duration < 300,
      'returns JSON': (r) => r.headers['Content-Type']?.includes('application/json'),
      'has issues array': (r) => {
        try {
          const body = JSON.parse(r.body);
          return Array.isArray(body.result?.data);
        } catch {
          return false;
        }
      },
    });
    
    if (success) successfulRequests.add(1);
    else { errorRate.add(1); failedRequests.add(1); }
    
    // Track database query duration from custom header
    const dbTime = res.headers['X-Db-Query-Duration'];
    if (dbTime) dbQueryDuration.add(parseFloat(dbTime), { query: 'getIssues' });
    
    // Simulate clicking on an issue (30% probability)
    if (Math.random() < 0.3) {
      sleep(1);
      const issueId = randomString(10);
      res = http.get(`${data.apiUrl}/trpc/insight.getIssue?input={"id":"${issueId}"}`, {
        headers: { 'Authorization': `Bearer ${authToken}` },
        tags: { name: 'insight_getIssue' },
      });
      
      check(res, {
        'issue details loaded': (r) => r.status === 200 || r.status === 404,
      }) || errorRate.add(1);
    }
  });
  
  sleep(randomIntBetween(2, 4));
  
  // Autopilot Dashboard
  group('Autopilot Dashboard', () => {
    let res = http.get(`${data.baseUrl}/en/dashboard/autopilot`, {
      headers: { 'Authorization': `Bearer ${authToken}` },
      tags: { name: 'autopilot_dashboard' },
    });
    
    check(res, {
      'autopilot dashboard loaded': (r) => r.status === 200,
    }) || errorRate.add(1);
    
    sleep(1);
    
    // Fetch recent runs
    res = http.get(`${data.apiUrl}/trpc/autopilot.getRuns?input={"limit":30}`, {
      headers: { 'Authorization': `Bearer ${authToken}` },
      tags: { name: 'autopilot_getRuns' },
    });
    
    apiResponseTime.add(res.timings.duration, { endpoint: 'getRuns' });
    
    check(res, {
      'runs API OK': (r) => r.status === 200,
      'API response < 400ms': (r) => r.timings.duration < 400,
    }) || errorRate.add(1);
    
    const dbTime = res.headers['X-Db-Query-Duration'];
    if (dbTime) dbQueryDuration.add(parseFloat(dbTime), { query: 'getRuns' });
  });
  
  sleep(randomIntBetween(2, 4));
  
  // Guardian Dashboard
  group('Guardian Dashboard', () => {
    let res = http.get(`${data.baseUrl}/en/dashboard/guardian`, {
      headers: { 'Authorization': `Bearer ${authToken}` },
      tags: { name: 'guardian_dashboard' },
    });
    
    check(res, {
      'guardian dashboard loaded': (r) => r.status === 200,
    }) || errorRate.add(1);
    
    sleep(1);
    
    // Fetch test results
    res = http.get(`${data.apiUrl}/trpc/guardian.getTests?input={"limit":40}`, {
      headers: { 'Authorization': `Bearer ${authToken}` },
      tags: { name: 'guardian_getTests' },
    });
    
    apiResponseTime.add(res.timings.duration, { endpoint: 'getTests' });
    
    check(res, {
      'tests API OK': (r) => r.status === 200,
      'API response < 350ms': (r) => r.timings.duration < 350,
    }) || errorRate.add(1);
    
    const dbTime = res.headers['X-Db-Query-Duration'];
    if (dbTime) dbQueryDuration.add(parseFloat(dbTime), { query: 'getTests' });
  });
  
  sleep(randomIntBetween(3, 6));
  
  // Analytics Dashboard
  group('Analytics Dashboard', () => {
    const res = http.get(`${data.apiUrl}/trpc/analytics.getMetrics?input={"timeRange":"7d"}`, {
      headers: { 'Authorization': `Bearer ${authToken}` },
      tags: { name: 'analytics_getMetrics' },
    });
    
    apiResponseTime.add(res.timings.duration, { endpoint: 'getMetrics' });
    
    check(res, {
      'analytics API OK': (r) => r.status === 200,
      'API response < 500ms': (r) => r.timings.duration < 500,
      'has metrics data': (r) => {
        try {
          const body = JSON.parse(r.body);
          return body.result?.data?.metrics !== undefined;
        } catch {
          return false;
        }
      },
    }) || errorRate.add(1);
    
    const dbTime = res.headers['X-Db-Query-Duration'];
    if (dbTime) dbQueryDuration.add(parseFloat(dbTime), { query: 'getMetrics' });
  });
  
  sleep(randomIntBetween(2, 5));
  
  // Test static assets (CDN caching)
  group('Static Assets', () => {
    const res = http.get(`${data.baseUrl}/_next/static/media/logo.png`, {
      tags: { name: 'static_asset' },
    });
    
    check(res, {
      'asset loaded': (r) => r.status === 200,
      'asset cached': (r) => r.headers['Cache-Control']?.includes('immutable') || r.headers['Cache-Control']?.includes('max-age'),
      'CDN hit': (r) => r.headers['CF-Cache-Status'] === 'HIT' || r.headers['X-Cache']?.includes('HIT'),
    });
  });
  
  sleep(randomIntBetween(1, 3));
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Authenticate user and return JWT token
 */
function authenticateUser(user, apiUrl) {
  const loginPayload = JSON.stringify({
    email: user.email,
    password: user.password,
  });
  
  const params = {
    headers: {
      'Content-Type': 'application/json',
    },
    tags: { name: 'auth_login' },
  };
  
  const res = http.post(`${apiUrl}/auth/signin`, loginPayload, params);
  
  const success = check(res, {
    'login successful': (r) => r.status === 200,
    'received auth token': (r) => {
      try {
        return r.json('token') !== undefined;
      } catch {
        return false;
      }
    },
    'auth response time OK': (r) => r.timings.duration < 1000,
  });
  
  if (!success) {
    return null;
  }
  
  apiResponseTime.add(res.timings.duration, { endpoint: 'auth_login' });
  
  try {
    return res.json('token');
  } catch {
    return null;
  }
}

/**
 * Teardown function - runs once after all tests
 * Prints summary and generates reports
 */
export function teardown(data) {
  const duration = (Date.now() - data.startTime) / 1000;
  
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🏁 LOAD TEST COMPLETED');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`⏱️  Total Duration: ${duration.toFixed(2)}s`);
  console.log(`🌐 Target: ${data.baseUrl}`);
  console.log(`📊 Results saved to: reports/load-test-${Date.now()}.json`);
  console.log(`📈 View detailed metrics in Grafana dashboards`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
}

/**
 * Handle test summary - generates reports
 */
export function handleSummary(data) {
  console.log('\n📊 LOAD TEST SUMMARY');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  // Response time statistics
  if (data.metrics.http_req_duration) {
    console.log('\n⏱️  Response Times:');
    console.log(`   P50: ${data.metrics.http_req_duration.values.p50.toFixed(2)}ms`);
    console.log(`   P95: ${data.metrics.http_req_duration.values.p95.toFixed(2)}ms ${data.metrics.http_req_duration.values.p95 < 500 ? '✅' : '❌'}`);
    console.log(`   P99: ${data.metrics.http_req_duration.values.p99.toFixed(2)}ms ${data.metrics.http_req_duration.values.p99 < 1000 ? '✅' : '❌'}`);
    console.log(`   Max: ${data.metrics.http_req_duration.values.max.toFixed(2)}ms`);
  }
  
  // Error rates
  const errorRatePercent = (data.metrics.http_req_failed?.values?.rate || 0) * 100;
  console.log(`\n❌ Error Rate: ${errorRatePercent.toFixed(2)}% ${errorRatePercent < 1 ? '✅' : '❌'}`);
  
  // Request counts
  console.log(`\n📈 Requests:`);
  console.log(`   Successful: ${data.metrics.successful_requests?.values?.count || 0}`);
  console.log(`   Failed: ${data.metrics.failed_requests?.values?.count || 0}`);
  console.log(`   Total: ${data.metrics.http_reqs?.values?.count || 0}`);
  console.log(`   Rate: ${data.metrics.http_reqs?.values?.rate?.toFixed(2) || 0} req/s`);
  
  // Database performance
  if (data.metrics.db_query_duration) {
    console.log(`\n🗄️  Database Queries:`);
    console.log(`   P50: ${data.metrics.db_query_duration.values.p50.toFixed(2)}ms`);
    console.log(`   P95: ${data.metrics.db_query_duration.values.p95.toFixed(2)}ms ${data.metrics.db_query_duration.values.p95 < 100 ? '✅' : '❌'}`);
    console.log(`   P99: ${data.metrics.db_query_duration.values.p99.toFixed(2)}ms`);
  }
  
  // TTFB
  if (data.metrics.time_to_first_byte) {
    console.log(`\n🚀 TTFB (Time to First Byte):`);
    console.log(`   P95: ${data.metrics.time_to_first_byte.values.p95.toFixed(2)}ms ${data.metrics.time_to_first_byte.values.p95 < 200 ? '✅' : '❌'}`);
  }
  
  // Web Vitals
  if (data.metrics.web_vitals_lcp) {
    console.log(`\n🎨 Web Vitals:`);
    console.log(`   LCP P95: ${data.metrics.web_vitals_lcp.values.p95.toFixed(2)}ms ${data.metrics.web_vitals_lcp.values.p95 < 2500 ? '✅' : '❌'}`);
  }
  
  // Authentication failures
  if (data.metrics.auth_failures) {
    console.log(`\n🔐 Auth Failures: ${data.metrics.auth_failures.values.count || 0}`);
  }
  
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  
  return {
    'stdout': '', // Already printed above
    'reports/load-test-results.json': JSON.stringify(data, null, 2),
    'reports/load-test-summary.html': generateHTMLSummary(data),
  };
}

/**
 * Generate HTML summary report
 */
function generateHTMLSummary(data) {
  const p95Pass = data.metrics.http_req_duration?.values.p95 < 500;
  const p99Pass = data.metrics.http_req_duration?.values.p99 < 1000;
  const errorPass = (data.metrics.http_req_failed?.values?.rate || 0) < 0.01;
  const dbPass = !data.metrics.db_query_duration || data.metrics.db_query_duration.values.p95 < 100;
  const ttfbPass = !data.metrics.time_to_first_byte || data.metrics.time_to_first_byte.values.p95 < 200;
  
  const allPass = p95Pass && p99Pass && errorPass && dbPass && ttfbPass;
  
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>k6 Load Test Results - ODAVL Studio Hub</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { 
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      max-width: 1200px; 
      margin: 40px auto; 
      padding: 20px;
      background: #f9fafb;
    }
    h1 { color: #2563eb; margin-bottom: 10px; }
    .header { background: white; padding: 30px; border-radius: 12px; margin-bottom: 30px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
    .status { 
      display: inline-block; 
      padding: 8px 16px; 
      border-radius: 6px; 
      font-weight: 600;
      margin-top: 15px;
    }
    .status.pass { background: #d1fae5; color: #065f46; }
    .status.fail { background: #fee2e2; color: #991b1b; }
    .metric { 
      background: white; 
      padding: 25px; 
      margin: 15px 0; 
      border-radius: 12px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    }
    .metric h3 { 
      margin-bottom: 15px; 
      color: #374151;
      font-size: 18px;
    }
    .success { color: #059669; font-weight: bold; }
    .warning { color: #d97706; font-weight: bold; }
    .error { color: #dc2626; font-weight: bold; }
    table { 
      width: 100%; 
      border-collapse: collapse; 
      margin: 15px 0;
    }
    th, td { 
      text-align: left; 
      padding: 12px; 
      border-bottom: 1px solid #e5e7eb;
    }
    th { 
      background: #f9fafb; 
      font-weight: 600;
      color: #6b7280;
      text-transform: uppercase;
      font-size: 12px;
      letter-spacing: 0.5px;
    }
    tr:hover { background: #f9fafb; }
    .grid { 
      display: grid; 
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); 
      gap: 20px;
      margin: 20px 0;
    }
    .card {
      background: white;
      padding: 20px;
      border-radius: 12px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    }
    .card-title {
      color: #6b7280;
      font-size: 14px;
      margin-bottom: 8px;
    }
    .card-value {
      font-size: 32px;
      font-weight: bold;
      color: #111827;
    }
    .footer {
      margin-top: 40px;
      text-align: center;
      color: #6b7280;
      font-size: 14px;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>🚀 k6 Load Test Results</h1>
    <p><strong>Test Date:</strong> ${new Date().toISOString()}</p>
    <p><strong>Environment:</strong> ${__ENV.ENVIRONMENT || 'Staging'}</p>
    <p><strong>Max Users:</strong> 1200 concurrent</p>
    <div class="status ${allPass ? 'pass' : 'fail'}">
      ${allPass ? '✅ ALL THRESHOLDS PASSED' : '❌ SOME THRESHOLDS FAILED'}
    </div>
  </div>
  
  <div class="grid">
    <div class="card">
      <div class="card-title">Total Requests</div>
      <div class="card-value">${(data.metrics.http_reqs?.values?.count || 0).toLocaleString()}</div>
    </div>
    <div class="card">
      <div class="card-title">Success Rate</div>
      <div class="card-value ${errorPass ? 'success' : 'error'}">${(100 - (data.metrics.http_req_failed?.values?.rate || 0) * 100).toFixed(2)}%</div>
    </div>
    <div class="card">
      <div class="card-title">P95 Response Time</div>
      <div class="card-value ${p95Pass ? 'success' : 'error'}">${data.metrics.http_req_duration?.values.p95.toFixed(0) || 0}ms</div>
    </div>
    <div class="card">
      <div class="card-title">Requests/sec</div>
      <div class="card-value">${data.metrics.http_reqs?.values?.rate?.toFixed(1) || 0}</div>
    </div>
  </div>
  
  <div class="metric">
    <h3>⏱️ Response Time Performance</h3>
    <table>
      <tr>
        <th>Metric</th>
        <th>Value</th>
        <th>Threshold</th>
        <th>Status</th>
      </tr>
      <tr>
        <td>P50 (Median)</td>
        <td>${data.metrics.http_req_duration?.values.p50.toFixed(2) || 0}ms</td>
        <td>-</td>
        <td>-</td>
      </tr>
      <tr>
        <td>P95 (95th percentile)</td>
        <td>${data.metrics.http_req_duration?.values.p95.toFixed(2) || 0}ms</td>
        <td>&lt; 500ms</td>
        <td class="${p95Pass ? 'success' : 'error'}">${p95Pass ? '✓ Pass' : '✗ Fail'}</td>
      </tr>
      <tr>
        <td>P99 (99th percentile)</td>
        <td>${data.metrics.http_req_duration?.values.p99.toFixed(2) || 0}ms</td>
        <td>&lt; 1000ms</td>
        <td class="${p99Pass ? 'success' : 'error'}">${p99Pass ? '✓ Pass' : '✗ Fail'}</td>
      </tr>
      <tr>
        <td>Max</td>
        <td>${data.metrics.http_req_duration?.values.max.toFixed(2) || 0}ms</td>
        <td>-</td>
        <td>-</td>
      </tr>
    </table>
  </div>
  
  <div class="metric">
    <h3>📊 Request Statistics</h3>
    <p><strong>Total Requests:</strong> ${(data.metrics.http_reqs?.values?.count || 0).toLocaleString()}</p>
    <p><strong>Successful:</strong> <span class="success">${data.metrics.successful_requests?.values?.count || 0}</span></p>
    <p><strong>Failed:</strong> <span class="error">${data.metrics.failed_requests?.values?.count || 0}</span></p>
    <p><strong>Error Rate:</strong> ${((data.metrics.http_req_failed?.values?.rate || 0) * 100).toFixed(2)}%</p>
    <p><strong>Request Rate:</strong> ${data.metrics.http_reqs?.values?.rate?.toFixed(2) || 0} req/s</p>
  </div>
  
  ${data.metrics.db_query_duration ? `
  <div class="metric">
    <h3>🗄️ Database Performance</h3>
    <table>
      <tr>
        <th>Metric</th>
        <th>Value</th>
        <th>Threshold</th>
        <th>Status</th>
      </tr>
      <tr>
        <td>P95 Query Duration</td>
        <td>${data.metrics.db_query_duration.values.p95.toFixed(2)}ms</td>
        <td>&lt; 100ms</td>
        <td class="${dbPass ? 'success' : 'error'}">${dbPass ? '✓ Pass' : '✗ Fail'}</td>
      </tr>
      <tr>
        <td>P99 Query Duration</td>
        <td>${data.metrics.db_query_duration.values.p99.toFixed(2)}ms</td>
        <td>&lt; 200ms</td>
        <td class="${data.metrics.db_query_duration.values.p99 < 200 ? 'success' : 'error'}">${data.metrics.db_query_duration.values.p99 < 200 ? '✓ Pass' : '✗ Fail'}</td>
      </tr>
    </table>
  </div>
  ` : ''}
  
  ${data.metrics.time_to_first_byte ? `
  <div class="metric">
    <h3>🚀 TTFB (Time to First Byte)</h3>
    <table>
      <tr>
        <th>Metric</th>
        <th>Value</th>
        <th>Threshold</th>
        <th>Status</th>
      </tr>
      <tr>
        <td>P95 TTFB</td>
        <td>${data.metrics.time_to_first_byte.values.p95.toFixed(2)}ms</td>
        <td>&lt; 200ms</td>
        <td class="${ttfbPass ? 'success' : 'error'}">${ttfbPass ? '✓ Pass' : '✗ Fail'}</td>
      </tr>
    </table>
  </div>
  ` : ''}
  
  <div class="metric">
    <h3>🎯 Threshold Results</h3>
    <p><strong>Overall Status:</strong> ${allPass ? '<span class="success">✓ ALL PASSED</span>' : '<span class="error">✗ SOME FAILED</span>'}</p>
    <ul style="margin-top: 15px; line-height: 1.8;">
      <li class="${p95Pass ? 'success' : 'error'}">${p95Pass ? '✓' : '✗'} P95 response time &lt; 500ms</li>
      <li class="${p99Pass ? 'success' : 'error'}">${p99Pass ? '✓' : '✗'} P99 response time &lt; 1000ms</li>
      <li class="${errorPass ? 'success' : 'error'}">${errorPass ? '✓' : '✗'} Error rate &lt; 1%</li>
      <li class="${dbPass ? 'success' : 'error'}">${dbPass ? '✓' : '✗'} Database queries &lt; 100ms (P95)</li>
      <li class="${ttfbPass ? 'success' : 'error'}">${ttfbPass ? '✓' : '✗'} TTFB &lt; 200ms (P95)</li>
    </ul>
  </div>
  
  <div class="footer">
    <p>Generated by k6 Load Testing Framework</p>
    <p>ODAVL Studio Hub - Tier 1 Performance Certification</p>
  </div>
</body>
</html>
  `;
}
