# Guardian API Documentation

## Overview

Guardian API provides programmatic access to all Guardian testing, monitoring, and alerting features. Built with Express.js, it offers a RESTful interface with JWT/API key authentication, rate limiting, and comprehensive error handling.

**Base URL**: `http://localhost:3003` (development)  
**Production**: `https://api.odavl.studio`

## Quick Start

### 1. Start the API Server

```bash
cd odavl-studio/guardian/api
cp .env.example .env
# Edit .env with your configuration
pnpm install
pnpm dev
```

### 2. Authentication

The API supports two authentication methods:

**API Key** (Recommended for automation):
```bash
curl -H "Authorization: Bearer your-api-key" \
  http://localhost:3003/api/tests
```

**JWT Token** (For user sessions):
```bash
curl -H "Authorization: Bearer eyJhbGc..." \
  http://localhost:3003/api/tests
```

Configure API keys in `.env`:
```env
API_KEYS=dev-key-123,prod-key-456
```

### 3. Create a Scheduled Test

```bash
curl -X POST http://localhost:3003/api/tests \
  -H "Authorization: Bearer dev-key-123" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Production Health Check",
    "url": "https://example.com",
    "schedule": "*/15 * * * *",
    "enabled": true,
    "detectors": ["white-screen", "performance", "accessibility"]
  }'
```

## API Endpoints

### Tests

#### Create Test
```http
POST /api/tests
Authorization: Bearer <token>

{
  "name": "string",
  "url": "https://example.com",
  "schedule": "*/5 * * * *",  // Cron expression
  "enabled": boolean,
  "detectors": ["white-screen", "404", "performance", ...],
  "timeout": 60000  // Optional, in milliseconds
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "Production Health Check",
    "url": "https://example.com",
    "schedule": "*/15 * * * *",
    "enabled": true,
    "detectors": ["white-screen", "performance"],
    "lastRun": null
  }
}
```

#### List Tests
```http
GET /api/tests
Authorization: Bearer <token>
```

#### Get Test
```http
GET /api/tests/:id
Authorization: Bearer <token>
```

#### Update Test
```http
PATCH /api/tests/:id
Authorization: Bearer <token>

{
  "enabled": false,
  "schedule": "0 * * * *"
}
```

#### Delete Test
```http
DELETE /api/tests/:id
Authorization: Bearer <token>
```

#### Execute Test Immediately
```http
POST /api/tests/:id/execute
Authorization: Bearer <token>
```

**Response**:
```json
{
  "success": true,
  "data": {
    "score": 92,
    "passed": true,
    "duration": 3245,
    "timestamp": "2025-01-10T...",
    "details": [
      {
        "detector": "performance",
        "score": 95,
        "metrics": { "lcp": 1.2, "fcp": 0.8, "cls": 0.05 }
      }
    ]
  }
}
```

#### Get Test Executions
```http
GET /api/tests/:id/executions?limit=10
Authorization: Bearer <token>
```

#### Get Test Statistics
```http
GET /api/tests/:id/stats
Authorization: Bearer <token>
```

**Response**:
```json
{
  "success": true,
  "data": {
    "totalExecutions": 234,
    "successRate": 0.96,
    "avgScore": 89.5,
    "avgDuration": 3102
  }
}
```

#### Get Trend Analysis
```http
GET /api/tests/:id/trends?days=30
Authorization: Bearer <token>
```

**Response**:
```json
{
  "success": true,
  "data": {
    "trend": [
      { "date": "2025-01-01", "score": 85, "duration": 3000, "issues": 2 },
      { "date": "2025-01-02", "score": 87, "duration": 2950, "issues": 1 }
    ],
    "topIssues": [
      { "type": "performance", "count": 12, "trend": "decreasing" },
      { "type": "accessibility", "count": 5, "trend": "stable" }
    ],
    "performance": {
      "lcp": { "current": 1.2, "average": 1.5, "trend": "improving" },
      "fcp": { "current": 0.8, "average": 0.9, "trend": "improving" },
      "cls": { "current": 0.05, "average": 0.08, "trend": "improving" }
    },
    "summary": {
      "totalExecutions": 234,
      "successRate": 0.96,
      "avgScore": 89.5,
      "trendDirection": "improving"
    }
  }
}
```

### Alerts

#### Create Alert Rule
```http
POST /api/alerts/rules
Authorization: Bearer <token>

{
  "testId": "uuid",
  "name": "Critical Quality Alert",
  "enabled": true,
  "conditions": [
    { "type": "score_below", "threshold": 80 },
    { "type": "issues_above", "threshold": 5 }
  ],
  "channels": ["slack", "email"],
  "severity": "critical",
  "cooldown": 60,
  "escalationDelay": 300
}
```

**Condition Types**:
- `score_below`: Alert when score drops below threshold
- `score_above`: Alert when score exceeds threshold
- `issues_above`: Alert when too many issues detected
- `duration_above`: Alert when test takes too long
- `failure_rate`: Alert on consecutive failures (e.g., 50% of last 5)
- `trend_degrading`: Alert when performance degrading over time

**Channels**: `email`, `slack`, `discord`, `webhook`, `pagerduty`, `sms`

**Severity**: `critical`, `high`, `medium`, `low`, `info`

#### List Alert Rules
```http
GET /api/alerts/rules?testId=uuid
Authorization: Bearer <token>
```

#### Get Alert Rule
```http
GET /api/alerts/rules/:id
Authorization: Bearer <token>
```

#### Update Alert Rule
```http
PATCH /api/alerts/rules/:id
Authorization: Bearer <token>

{
  "enabled": false,
  "severity": "high"
}
```

#### Delete Alert Rule
```http
DELETE /api/alerts/rules/:id
Authorization: Bearer <token>
```

#### List Alerts
```http
GET /api/alerts?testId=uuid&status=pending&severity=critical&limit=50
Authorization: Bearer <token>
```

**Query Parameters**:
- `testId` (optional): Filter by test ID
- `status` (optional): `pending`, `sent`, `acknowledged`, `resolved`, `failed`
- `severity` (optional): `critical`, `high`, `medium`, `low`, `info`
- `limit` (optional): Max results (1-100, default 50)

#### Acknowledge Alert
```http
POST /api/alerts/:id/acknowledge
Authorization: Bearer <token>

{
  "acknowledgedBy": "John Doe"
}
```

#### Resolve Alert
```http
POST /api/alerts/:id/resolve
Authorization: Bearer <token>
```

### Webhooks

#### Subscribe to Events
```http
POST /api/webhooks/subscribe
Authorization: Bearer <token>

{
  "url": "https://your-server.com/webhook",
  "events": ["test.completed", "alert.created", "alert.critical"],
  "secret": "optional-verification-secret"
}
```

**Event Types**:
- `test.completed`: Test execution finished
- `test.failed`: Test execution failed
- `alert.created`: New alert triggered
- `alert.critical`: Critical alert created
- `alert.acknowledged`: Alert acknowledged
- `alert.resolved`: Alert resolved
- `*`: All events

**Response**:
```json
{
  "success": true,
  "data": {
    "id": "sub_123456_abc",
    "url": "https://your-server.com/webhook",
    "events": ["test.completed", "alert.created"],
    "secret": "optional-verification-secret",
    "createdAt": "2025-01-10T..."
  }
}
```

#### List Subscriptions
```http
GET /api/webhooks/subscriptions
Authorization: Bearer <token>
```

#### Get Subscription
```http
GET /api/webhooks/subscriptions/:id
Authorization: Bearer <token>
```

#### Delete Subscription
```http
DELETE /api/webhooks/subscriptions/:id
Authorization: Bearer <token>
```

#### Test Webhook
```http
POST /api/webhooks/test
Authorization: Bearer <token>

{
  "url": "https://your-server.com/webhook"
}
```

**Webhook Payload Format**:
```json
{
  "event": "test.completed",
  "timestamp": "2025-01-10T12:00:00Z",
  "data": {
    "testId": "uuid",
    "name": "Production Health",
    "url": "https://example.com",
    "score": 92,
    "passed": true,
    "duration": 3245
  }
}
```

**Headers**:
- `Content-Type: application/json`
- `X-Guardian-Event: test.completed`
- `X-Guardian-Secret: your-secret` (if configured)

### Health Check

```http
GET /health
```

No authentication required.

**Response**:
```json
{
  "success": true,
  "status": "healthy",
  "timestamp": "2025-01-10T12:00:00Z"
}
```

## Rate Limiting

API enforces rate limits to prevent abuse:
- **Window**: 15 minutes
- **Max Requests**: 100 per window

Rate limit headers included in responses:
```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1641819600
```

## Error Handling

All errors follow consistent format:

```json
{
  "success": false,
  "error": "Error message",
  "details": [
    {
      "path": "field.name",
      "message": "Validation error"
    }
  ]
}
```

**HTTP Status Codes**:
- `200` OK - Request succeeded
- `201` Created - Resource created
- `400` Bad Request - Validation error
- `401` Unauthorized - Missing/invalid auth
- `403` Forbidden - Insufficient permissions
- `404` Not Found - Resource not found
- `429` Too Many Requests - Rate limit exceeded
- `500` Internal Server Error - Server error

## Environment Configuration

Create `.env` file from `.env.example`:

```env
# Server
PORT=3003
DB_PATH=./guardian-data.db

# Authentication
JWT_SECRET=change-this-secret-in-production
API_KEYS=dev-key-123,prod-key-456

# Email Configuration
EMAIL_FROM=guardian@odavl.studio
EMAIL_TO=team@company.com,alerts@company.com
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# Slack Configuration
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/WEBHOOK/URL

# Discord Configuration
DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/YOUR/WEBHOOK/URL
```

## OpenAPI Specification

Full OpenAPI 3.0 specification available at:
- `odavl-studio/guardian/api/openapi.yaml`
- Interactive docs: `http://localhost:3003/api/docs` (planned)

## Client Libraries

### JavaScript/TypeScript

```typescript
import { GuardianApiClient } from '@odavl-studio/guardian-sdk';

const client = new GuardianApiClient({
  apiUrl: 'http://localhost:3003',
  apiKey: 'your-api-key',
});

// Create test
const test = await client.createTest({
  name: 'Production Health',
  url: 'https://example.com',
  schedule: '*/15 * * * *',
  enabled: true,
});

// Execute test
const result = await client.executeTest(test.id);
console.log(`Score: ${result.score}/100`);

// Get trends
const trends = await client.getTrends(test.id, 30);
console.log(`Average score: ${trends.summary.avgScore}`);
```

### VS Code Extension

Guardian VS Code extension provides IDE integration:

```bash
code --install-extension odavl-guardian-vscode-2.0.0.vsix
```

Features:
- View scheduled tests in sidebar
- Monitor active alerts
- See quality trends
- Execute tests from IDE
- Acknowledge/resolve alerts
- Auto-refresh (configurable)

Configuration:
```json
{
  "guardian.apiUrl": "http://localhost:3003",
  "guardian.apiKey": "your-api-key",
  "guardian.autoRefresh": true,
  "guardian.refreshInterval": 60
}
```

## Examples

### CI/CD Integration (GitHub Actions)

```yaml
name: Guardian Pre-Deploy

on:
  pull_request:
    branches: [main]

jobs:
  guardian:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Build staging
        run: |
          pnpm install
          pnpm build
          pnpm start &
          sleep 10
      
      - name: Run Guardian Test
        run: |
          curl -X POST http://localhost:3003/api/tests \
            -H "Authorization: Bearer ${{ secrets.GUARDIAN_API_KEY }}" \
            -H "Content-Type: application/json" \
            -d '{
              "name": "PR #${{ github.event.pull_request.number }}",
              "url": "http://localhost:3000",
              "schedule": "@once",
              "enabled": true
            }' > test.json
          
          TEST_ID=$(cat test.json | jq -r '.data.id')
          
          curl -X POST http://localhost:3003/api/tests/$TEST_ID/execute \
            -H "Authorization: Bearer ${{ secrets.GUARDIAN_API_KEY }}" > result.json
          
          SCORE=$(cat result.json | jq -r '.data.score')
          
          if [ $SCORE -lt 80 ]; then
            echo "Quality gate failed: Score $SCORE < 80"
            exit 1
          fi
          
          echo "Quality gate passed: Score $SCORE"
```

### Monitoring Dashboard

```typescript
// Next.js API Route
export async function GET(request: Request) {
  const tests = await guardianClient.getTests();
  const alerts = await guardianClient.getAlerts({ limit: 10 });
  
  const summary = {
    totalTests: tests.length,
    activeTests: tests.filter(t => t.enabled).length,
    activeAlerts: alerts.filter(a => a.status === 'pending').length,
    criticalAlerts: alerts.filter(a => a.severity === 'critical').length,
  };
  
  return Response.json(summary);
}
```

### Custom Alert Webhook Handler

```typescript
import { createHmac } from 'crypto';

export async function POST(request: Request) {
  const signature = request.headers.get('X-Guardian-Secret');
  const body = await request.text();
  
  // Verify signature
  const expected = createHmac('sha256', process.env.WEBHOOK_SECRET!)
    .update(body)
    .digest('hex');
  
  if (signature !== expected) {
    return new Response('Invalid signature', { status: 401 });
  }
  
  const event = JSON.parse(body);
  
  switch (event.event) {
    case 'alert.critical':
      await sendPagerDutyAlert(event.data);
      break;
    case 'test.failed':
      await createJiraTicket(event.data);
      break;
  }
  
  return new Response('OK');
}
```

## Support

- **Documentation**: https://odavl.studio/docs/guardian
- **GitHub**: https://github.com/odavl-studio/odavl
- **Issues**: https://github.com/odavl-studio/odavl/issues
- **Discord**: https://discord.gg/odavl
