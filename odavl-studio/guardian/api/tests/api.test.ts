import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/server.js';
import type { Application } from 'express';

describe('Guardian API - Tests Endpoint', () => {
  let app: Application;

  beforeEach(() => {
    app = createApp();
  });

  afterEach(() => {
    // Cleanup
  });

  it('should return 401 without authentication', async () => {
    const response = await request(app).get('/api/tests');
    expect(response.status).toBe(401);
  });

  it('should create a test with valid API key', async () => {
    const response = await request(app)
      .post('/api/tests')
      .set('Authorization', 'Bearer dev-key-123')
      .send({
        name: 'Test Website',
        url: 'https://example.com',
        schedule: '*/5 * * * *',
        enabled: true,
        detectors: ['white-screen', 'performance'],
      });

    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
    expect(response.body.data).toHaveProperty('id');
  });

  it('should list all tests', async () => {
    const response = await request(app)
      .get('/api/tests')
      .set('Authorization', 'Bearer dev-key-123');

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(Array.isArray(response.body.data)).toBe(true);
  });

  it('should reject invalid test data', async () => {
    const response = await request(app)
      .post('/api/tests')
      .set('Authorization', 'Bearer dev-key-123')
      .send({
        name: '',
        url: 'not-a-url',
        schedule: 'invalid-cron',
      });

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
  });
});

describe('Guardian API - Alerts Endpoint', () => {
  let app: Application;

  beforeEach(() => {
    app = createApp();
  });

  it('should create alert rule', async () => {
    // First create a test
    const testResponse = await request(app)
      .post('/api/tests')
      .set('Authorization', 'Bearer dev-key-123')
      .send({
        name: 'Test for Alerts',
        url: 'https://example.com',
        schedule: '*/5 * * * *',
      });

    const testId = testResponse.body.data.id;

    // Then create alert rule
    const response = await request(app)
      .post('/api/alerts/rules')
      .set('Authorization', 'Bearer dev-key-123')
      .send({
        testId,
        name: 'Critical Alert',
        enabled: true,
        conditions: [
          { type: 'score_below', threshold: 80 },
        ],
        channels: ['email', 'slack'],
        severity: 'critical',
        cooldown: 60,
      });

    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
    expect(response.body.data).toHaveProperty('id');
  });

  it('should list alert rules', async () => {
    const response = await request(app)
      .get('/api/alerts/rules')
      .set('Authorization', 'Bearer dev-key-123');

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
  });
});
