# API Guide

Complete reference for the Guardian API.

## Base URL

```
Production: https://api.guardian.odavl.com
Development: http://localhost:3003/api
```

## Authentication

Guardian supports two authentication methods:

### 1. API Key Authentication

Include your API key in the request header:

```http
GET /api/projects
X-API-Key: grd_live_1234567890abcdef
```

#### API Key Format

- **Live keys**: `grd_live_` prefix (production)
- **Test keys**: `grd_test_` prefix (development/testing)

#### Rate Limits by Tier

| Tier | Rate Limit | Burst |
|------|------------|-------|
| **FREE** | 100 requests/hour | 10/minute |
| **PRO** | 1,000 requests/hour | 50/minute |
| **ENTERPRISE** | Unlimited | 200/minute |

### 2. JWT Token Authentication

For user-facing applications, use JWT tokens:

```http
GET /api/user/profile
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

#### Obtaining Tokens

```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "your-password"
}
```

**Response:**

```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIs...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIs...",
  "expiresIn": 900,
  "user": {
    "id": "usr_123",
    "email": "user@example.com",
    "name": "John Doe"
  }
}
```

#### Refreshing Tokens

```http
POST /api/auth/refresh
Content-Type: application/json

{
  "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
}
```

## Request Format

### Headers

| Header | Required | Description |
|--------|----------|-------------|
| `Content-Type` | Yes | `application/json` |
| `X-API-Key` | Yes* | API key for authentication |
| `Authorization` | Yes* | `Bearer <token>` for JWT auth |
| `X-CSRF-Token` | Yes** | CSRF token for state-changing operations |

\* Either `X-API-Key` or `Authorization` required  
\** Required for POST, PUT, PATCH, DELETE requests from browsers

### Query Parameters

Use query parameters for filtering, pagination, and sorting:

```http
GET /api/projects?page=1&limit=20&sort=createdAt&order=desc&status=active
```

### Request Body

All request bodies must be valid JSON:

```http
POST /api/projects
Content-Type: application/json

{
  "name": "My Test Project",
  "description": "Project description",
  "organizationId": "org_123"
}
```

## Response Format

### Success Response

```json
{
  "success": true,
  "data": {
    "id": "proj_123",
    "name": "My Test Project",
    "createdAt": "2025-01-15T10:30:00Z"
  },
  "meta": {
    "timestamp": "2025-01-15T10:30:00Z",
    "requestId": "req_abc123"
  }
}
```

### Error Response

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid request parameters",
    "details": [
      {
        "field": "email",
        "message": "Invalid email format"
      }
    ]
  },
  "meta": {
    "timestamp": "2025-01-15T10:30:00Z",
    "requestId": "req_abc123"
  }
}
```

### HTTP Status Codes

| Code | Meaning | Description |
|------|---------|-------------|
| **200** | OK | Request succeeded |
| **201** | Created | Resource created successfully |
| **204** | No Content | Request succeeded, no content to return |
| **400** | Bad Request | Invalid request parameters |
| **401** | Unauthorized | Authentication required or failed |
| **403** | Forbidden | Authenticated but not authorized |
| **404** | Not Found | Resource not found |
| **409** | Conflict | Resource already exists |
| **422** | Unprocessable Entity | Validation failed |
| **429** | Too Many Requests | Rate limit exceeded |
| **500** | Internal Server Error | Server error |
| **503** | Service Unavailable | Service temporarily unavailable |

## Pagination

List endpoints support pagination:

```http
GET /api/projects?page=1&limit=20
```

**Parameters:**

- `page`: Page number (1-indexed, default: 1)
- `limit`: Items per page (default: 20, max: 100)

**Response:**

```json
{
  "success": true,
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "totalPages": 8,
    "hasNextPage": true,
    "hasPreviousPage": false
  }
}
```

## Filtering and Sorting

### Filtering

```http
GET /api/projects?status=active&organizationId=org_123
```

### Sorting

```http
GET /api/projects?sort=createdAt&order=desc
```

**Parameters:**

- `sort`: Field to sort by
- `order`: `asc` or `desc` (default: `asc`)

### Search

```http
GET /api/projects?search=test
```

Searches across multiple fields (name, description, etc.)

## API Endpoints

### Authentication

#### POST /api/auth/login

Authenticate user and obtain tokens.

**Request:**

```json
{
  "email": "user@example.com",
  "password": "your-password"
}
```

**Response:**

```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIs...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIs...",
  "expiresIn": 900,
  "user": {
    "id": "usr_123",
    "email": "user@example.com",
    "name": "John Doe",
    "role": "DEVELOPER"
  }
}
```

#### POST /api/auth/refresh

Refresh access token.

**Request:**

```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
}
```

**Response:**

```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIs...",
  "expiresIn": 900
}
```

#### POST /api/auth/logout

Logout and invalidate tokens.

**Response:**

```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

### Organizations

#### GET /api/organizations

List organizations for authenticated user.

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "id": "org_123",
      "name": "My Organization",
      "slug": "my-organization",
      "tier": "PRO",
      "createdAt": "2025-01-01T00:00:00Z"
    }
  ]
}
```

#### POST /api/organizations

Create a new organization.

**Request:**

```json
{
  "name": "My Organization",
  "slug": "my-organization"
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "id": "org_123",
    "name": "My Organization",
    "slug": "my-organization",
    "tier": "FREE",
    "createdAt": "2025-01-15T10:30:00Z"
  }
}
```

#### GET /api/organizations/:id

Get organization details.

**Response:**

```json
{
  "success": true,
  "data": {
    "id": "org_123",
    "name": "My Organization",
    "slug": "my-organization",
    "tier": "PRO",
    "members": [
      {
        "userId": "usr_123",
        "role": "OWNER",
        "joinedAt": "2025-01-01T00:00:00Z"
      }
    ],
    "projectCount": 15,
    "apiKeyCount": 3,
    "createdAt": "2025-01-01T00:00:00Z"
  }
}
```

### Projects

#### GET /api/projects

List projects.

**Query Parameters:**

- `organizationId`: Filter by organization (required)
- `status`: Filter by status (`active`, `archived`)
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 20)

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "id": "proj_123",
      "name": "My Test Project",
      "description": "Project description",
      "organizationId": "org_123",
      "status": "active",
      "testCount": 25,
      "createdAt": "2025-01-10T00:00:00Z",
      "updatedAt": "2025-01-15T10:30:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 15,
    "totalPages": 1
  }
}
```

#### POST /api/projects

Create a new project.

**Request:**

```json
{
  "name": "My Test Project",
  "description": "Project description",
  "organizationId": "org_123"
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "id": "proj_123",
    "name": "My Test Project",
    "description": "Project description",
    "organizationId": "org_123",
    "status": "active",
    "createdAt": "2025-01-15T10:30:00Z"
  }
}
```

#### GET /api/projects/:id

Get project details.

**Response:**

```json
{
  "success": true,
  "data": {
    "id": "proj_123",
    "name": "My Test Project",
    "description": "Project description",
    "organizationId": "org_123",
    "status": "active",
    "testCount": 25,
    "lastTestRunAt": "2025-01-15T09:00:00Z",
    "createdAt": "2025-01-10T00:00:00Z",
    "updatedAt": "2025-01-15T10:30:00Z"
  }
}
```

#### PUT /api/projects/:id

Update project.

**Request:**

```json
{
  "name": "Updated Project Name",
  "description": "Updated description"
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "id": "proj_123",
    "name": "Updated Project Name",
    "description": "Updated description",
    "updatedAt": "2025-01-15T10:30:00Z"
  }
}
```

#### DELETE /api/projects/:id

Delete project.

**Response:**

```json
{
  "success": true,
  "message": "Project deleted successfully"
}
```

### Tests

#### GET /api/projects/:projectId/tests

List tests for a project.

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "id": "test_123",
      "projectId": "proj_123",
      "name": "Homepage Load Test",
      "type": "load",
      "status": "ready",
      "lastRunAt": "2025-01-15T09:00:00Z",
      "createdAt": "2025-01-10T00:00:00Z"
    }
  ]
}
```

#### POST /api/projects/:projectId/tests

Create a new test.

**Request:**

```json
{
  "name": "Homepage Load Test",
  "type": "load",
  "config": {
    "url": "https://example.com",
    "method": "GET",
    "duration": 60,
    "virtualUsers": 100
  }
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "id": "test_123",
    "projectId": "proj_123",
    "name": "Homepage Load Test",
    "type": "load",
    "status": "ready",
    "createdAt": "2025-01-15T10:30:00Z"
  }
}
```

#### POST /api/tests/:id/run

Execute a test.

**Request:**

```json
{
  "environment": "production",
  "parameters": {
    "virtualUsers": 100,
    "duration": 60
  }
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "runId": "run_123",
    "testId": "test_123",
    "status": "running",
    "startedAt": "2025-01-15T10:30:00Z",
    "estimatedDuration": 60
  }
}
```

### Test Runs

#### GET /api/test-runs/:id

Get test run details and results.

**Response:**

```json
{
  "success": true,
  "data": {
    "id": "run_123",
    "testId": "test_123",
    "status": "completed",
    "startedAt": "2025-01-15T10:30:00Z",
    "completedAt": "2025-01-15T10:31:00Z",
    "duration": 60,
    "results": {
      "totalRequests": 6000,
      "successfulRequests": 5980,
      "failedRequests": 20,
      "averageResponseTime": 250,
      "p95ResponseTime": 450,
      "p99ResponseTime": 800,
      "throughput": 100
    },
    "metrics": [
      {
        "timestamp": "2025-01-15T10:30:00Z",
        "activeUsers": 100,
        "responseTime": 250,
        "errorRate": 0.5
      }
    ]
  }
}
```

### API Keys

#### GET /api/organizations/:organizationId/api-keys

List API keys for an organization.

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "id": "key_123",
      "name": "Production API Key",
      "prefix": "grd_live_",
      "createdAt": "2025-01-01T00:00:00Z",
      "lastUsedAt": "2025-01-15T09:00:00Z",
      "expiresAt": null
    }
  ]
}
```

#### POST /api/organizations/:organizationId/api-keys

Create a new API key.

**Request:**

```json
{
  "name": "Production API Key",
  "expiresAt": "2026-01-01T00:00:00Z"
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "id": "key_123",
    "name": "Production API Key",
    "key": "grd_live_1234567890abcdef",
    "prefix": "grd_live_",
    "createdAt": "2025-01-15T10:30:00Z",
    "expiresAt": "2026-01-01T00:00:00Z"
  },
  "warning": "Save this key securely. It will not be shown again."
}
```

#### DELETE /api/api-keys/:id

Revoke an API key.

**Response:**

```json
{
  "success": true,
  "message": "API key revoked successfully"
}
```

### Health Check

#### GET /api/health

Check API health status.

**Response:**

```json
{
  "status": "healthy",
  "timestamp": "2025-01-15T10:30:00Z",
  "version": "1.0.0",
  "services": {
    "database": "healthy",
    "redis": "healthy",
    "queue": "healthy"
  },
  "uptime": 86400
}
```

## Rate Limiting

### Rate Limit Headers

All responses include rate limit headers:

```http
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 950
X-RateLimit-Reset: 1705320600
```

### Rate Limit Exceeded

When rate limit is exceeded, you'll receive a 429 response:

```json
{
  "success": false,
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Rate limit exceeded. Please retry after 3600 seconds.",
    "retryAfter": 3600
  }
}
```

## Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `VALIDATION_ERROR` | 400 | Invalid request parameters |
| `AUTHENTICATION_REQUIRED` | 401 | Missing authentication |
| `INVALID_CREDENTIALS` | 401 | Invalid API key or token |
| `TOKEN_EXPIRED` | 401 | JWT token expired |
| `INSUFFICIENT_PERMISSIONS` | 403 | Not authorized to perform action |
| `RESOURCE_NOT_FOUND` | 404 | Requested resource not found |
| `RESOURCE_CONFLICT` | 409 | Resource already exists |
| `RATE_LIMIT_EXCEEDED` | 429 | Too many requests |
| `INTERNAL_ERROR` | 500 | Internal server error |

## Webhooks

Guardian can send webhooks for various events:

### Configuring Webhooks

```http
POST /api/organizations/:organizationId/webhooks
Content-Type: application/json

{
  "url": "https://your-app.com/webhooks/guardian",
  "events": ["test.completed", "test.failed"],
  "secret": "your-webhook-secret"
}
```

### Webhook Payload

```json
{
  "id": "evt_123",
  "type": "test.completed",
  "createdAt": "2025-01-15T10:30:00Z",
  "data": {
    "testId": "test_123",
    "runId": "run_123",
    "status": "completed",
    "results": { ... }
  }
}
```

### Webhook Signature

Verify webhook authenticity using HMAC-SHA256:

```javascript
const crypto = require('crypto');

function verifyWebhook(payload, signature, secret) {
  const hmac = crypto.createHmac('sha256', secret);
  const digest = hmac.update(payload).digest('hex');
  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(digest));
}
```

## SDKs and Client Libraries

### Official SDKs

- **JavaScript/TypeScript**: `@guardian/sdk`
- **Python**: `guardian-python`
- **Go**: `guardian-go`

### JavaScript Example

```typescript
import { GuardianClient } from '@guardian/sdk';

const client = new GuardianClient({
  apiKey: 'grd_live_1234567890abcdef',
});

// Create project
const project = await client.projects.create({
  name: 'My Test Project',
  organizationId: 'org_123',
});

// Run test
const run = await client.tests.run('test_123', {
  environment: 'production',
});

// Get results
const results = await client.testRuns.get(run.id);
```

## Best Practices

1. **Use HTTPS**: Always use HTTPS in production
2. **Secure API Keys**: Never commit API keys to version control
3. **Handle Rate Limits**: Implement exponential backoff
4. **Validate Responses**: Check `success` field before processing
5. **Log Request IDs**: Use `requestId` from responses for debugging
6. **Set Timeouts**: Configure appropriate request timeouts
7. **Retry Failed Requests**: Retry with exponential backoff for 5xx errors

## Support

- **Documentation**: <https://docs.guardian.odavl.com>
- **API Status**: <https://status.guardian.odavl.com>
- **Support Email**: <support@guardian.odavl.com>
- **GitHub Issues**: <https://github.com/odavl/guardian/issues>

---

**Last Updated**: January 2025  
**API Version**: 1.0.0
