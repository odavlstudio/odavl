/**
 * k6 Load Testing - API Stress Test
 * Tests API endpoints under extreme load
 */

import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Rate, Trend } from 'k6/metrics';

const errorRate = new Rate('errors');
const apiLatency = new Trend('api_latency');

export const options = {
  stages: [
    { duration: '1m', target: 1000 },    // Warm up
    { duration: '2m', target: 5000 },    // Ramp to 5K RPS
    { duration: '3m', target: 10000 },   // Ramp to 10K RPS
    { duration: '5m', target: 10000 },   // Sustain 10K RPS
    { duration: '2m', target: 20000 },   // Spike to 20K RPS
    { duration: '3m', target: 20000 },   // Sustain spike
    { duration: '3m', target: 0 },       // Ramp down
  ],
  
  thresholds: {
    'http_req_duration': ['p(99)<1000'],
    'http_req_failed': ['rate<0.02'],
    'errors': ['rate<0.05'],
    'api_latency': ['p(95)<500', 'p(99)<1000'],
  },
};

const BASE_URL = __ENV.BASE_URL || 'https://odavl.studio';

export default function() {
  const endpoints = [
    '/api/health',
    '/api/trpc/insight.getIssues',
    '/api/trpc/autopilot.getRuns',
    '/api/trpc/guardian.getTests',
    '/api/trpc/analytics.getMetrics',
  ];
  
  // Random endpoint selection
  const endpoint = endpoints[Math.floor(Math.random() * endpoints.length)];
  
  const start = Date.now();
  const res = http.get(`${BASE_URL}${endpoint}`);
  const duration = Date.now() - start;
  
  apiLatency.add(duration);
  
  check(res, {
    'status is 200': (r) => r.status === 200,
    'response time < 1s': () => duration < 1000,
  }) || errorRate.add(1);
  
  sleep(0.1); // 100ms think time
}
