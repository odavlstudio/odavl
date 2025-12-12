# ODAVL Public API

**REST API v1 for programmatic access to ODAVL products.**

## Overview

The ODAVL Public API provides RESTful endpoints for:
- Authentication (JWT + API keys)
- Project management
- Insight analysis runs
- Autopilot O-D-A-V-L cycles
- Guardian website tests
- Marketplace package operations
- Intelligence predictions

**Base URL**: `https://api.odavl.com/v1` (Production)  
**Base URL**: `http://localhost:8080/api/v1` (Development)

## Authentication

### JWT Authentication
```bash
# Login
curl -X POST https://api.odavl.com/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"secret"}'

# Response
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": { "id": "user-123", "email": "user@example.com" }
}
```

### API Key Authentication
```bash
curl -X GET https://api.odavl.com/v1/projects \
  -H "X-API-Key: odavl_abc123..."
```

## Rate Limits

- **Free**: 100 requests/hour
- **Pro**: 1,000 requests/hour
- **Enterprise**: Unlimited

Rate limit headers:
- `X-RateLimit-Limit`: Total requests allowed
- `X-RateLimit-Remaining`: Requests remaining
- `X-RateLimit-Reset`: Unix timestamp when limit resets

## Error Handling

Standard HTTP status codes:
- `200` - Success
- `400` - Bad request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not found
- `429` - Rate limit exceeded
- `500` - Server error

Error response format:
```json
{
  "error": "Invalid credentials",
  "code": "AUTH_FAILED",
  "details": {}
}
```

## Endpoints

See product-specific docs:
- [Authentication API](./auth.md)
- [Insight API](./insight.md)
- [Autopilot API](./autopilot.md)
- [Guardian API](./guardian.md)
- [Marketplace API](./marketplace.md)
- [Intelligence API](./intelligence.md)
