import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate } from 'k6/metrics';

const errorRate = new Rate('errors');

export const options = {
  stages: [
    { duration: '2m', target: 100 },   // Warm up
    { duration: '5m', target: 100 },   // Baseline
    { duration: '2m', target: 200 },   // Increase load
    { duration: '2m', target: 400 },   // Increase load
    { duration: '2m', target: 800 },   // Increase load
    { duration: '2m', target: 1200 },  // Stress test
    { duration: '3m', target: 1200 },  // Maintain stress
    { duration: '5m', target: 0 },     // Recovery
  ],
  thresholds: {
    http_req_duration: ['p(95)<1000', 'p(99)<2000'], // More lenient for stress test
    http_req_failed: ['rate<0.05'],                   // Allow 5% error rate
    errors: ['rate<0.10'],                            // Allow 10% custom errors
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';

export default function () {
  // Simulate various user actions
  const actions = [
    () => http.get(`${BASE_URL}/en`),
    () => http.get(`${BASE_URL}/en/dashboard`),
    () => http.get(`${BASE_URL}/api/health`),
    () => http.get(`${BASE_URL}/api/edge/health`),
  ];

  // Randomly select an action
  const action = actions[Math.floor(Math.random() * actions.length)];
  const res = action();

  check(res, {
    'status is 200 or 503': (r) => r.status === 200 || r.status === 503, // Allow service unavailable
    'response received': (r) => r.body.length > 0,
  }) || errorRate.add(1);

  sleep(Math.random() * 2); // Random sleep 0-2s
}
