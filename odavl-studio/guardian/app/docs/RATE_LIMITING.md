# Rate Limiting System Documentation

## Overview

Guardian's rate limiting system protects APIs from abuse and ensures fair resource allocation across organizations and users. It uses Redis for distributed rate limiting with a sliding window algorithm.

## Features

- **Sliding Window Algorithm**: Accurate rate limiting with smooth request distribution
- **Multi-Level Limiting**: Organization, API Key, and IP-based rate limits
- **Tier-Based Quotas**: Different limits for Free, Pro, and Enterprise plans
- **Graceful Degradation**: Falls back to allowing requests if Redis is unavailable
- **Real-time Status**: API endpoints to check current rate limit status
- **Admin Controls**: Reset rate limits for troubleshooting

## Architecture

### Rate Limit Middleware

Located in `src/middleware/rate-limit.ts`, provides core rate limiting functionality:

```typescript
import { rateLimitMiddleware } from '@/middleware/rate-limit';

// In your API route
const rateLimitResponse = await rateLimitMiddleware(request, {
  type: 'organization',
  identifier: organizationId,
});

if (rateLimitResponse) {
  return rateLimitResponse; // 429 Too Many Requests
}

// Continue with request processing
```

### Rate Limit Types

1. **Organization-based**: Limits based on organization tier
   - Free: 60 requests/minute
   - Pro: 300 requests/minute
   - Enterprise: 1000 requests/minute

2. **API Key-based**: Per-key limits stored in database
   - Custom limits per API key
   - Tracks usage count and last used timestamp

3. **IP-based**: For public endpoints without authentication
   - Configurable limit (default: 100 requests/minute)

### Redis Key Structure

```
ratelimit:org:<orgId>           # Organization rate limit
ratelimit:apikey:<keyId>        # API key rate limit
ratelimit:ip:<ipAddress>        # IP rate limit
```

Each key stores a sorted set of request timestamps using sliding window algorithm:

```
ZADD ratelimit:org:123 <timestamp> <unique-request-id>
ZREMRANGEBYSCORE ratelimit:org:123 0 <window-start>
ZCARD ratelimit:org:123
```

## API Endpoints

### GET /api/rate-limits/status

Check current rate limit status.

**Query Parameters:**

- `type` (required): `organization` or `apikey`
- `identifier` (required): Organization ID or API key

**Response:**

```json
{
  "success": true,
  "rateLimit": {
    "allowed": true,
    "remaining": 245,
    "reset": 1704124800,
    "resetDate": "2024-01-01T14:00:00.000Z",
    "total": 300,
    "tier": "pro"
  }
}
```

### POST /api/rate-limits/reset

Reset rate limit for an identifier (admin only).

**Request Body:**

```json
{
  "type": "organization",
  "identifier": "org-123"
}
```

**Response:**

```json
{
  "success": true,
  "message": "Rate limit reset successfully",
  "reset": {
    "type": "organization",
    "identifier": "org-123",
    "timestamp": "2024-01-01T14:00:00.000Z"
  }
}
```

## Integration Examples

### Example 1: Organization Rate Limiting

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { rateLimitMiddleware } from '@/middleware/rate-limit';

export async function GET(request: NextRequest) {
  const organizationId = request.headers.get('x-organization-id');
  
  if (!organizationId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Check rate limit
  const rateLimitResponse = await rateLimitMiddleware(request, {
    type: 'organization',
    identifier: organizationId,
  });

  if (rateLimitResponse) {
    return rateLimitResponse;
  }

  // Process request
  return NextResponse.json({ success: true });
}
```

### Example 2: API Key Rate Limiting

```typescript
export async function POST(request: NextRequest) {
  const apiKey = request.headers.get('x-api-key');
  
  if (!apiKey) {
    return NextResponse.json({ error: 'API key required' }, { status: 401 });
  }

  const rateLimitResponse = await rateLimitMiddleware(request, {
    type: 'apikey',
    identifier: apiKey,
  });

  if (rateLimitResponse) {
    return rateLimitResponse;
  }

  return NextResponse.json({ success: true });
}
```

### Example 3: Public Endpoint with IP Rate Limiting

```typescript
export async function GET(request: NextRequest) {
  // Limit public endpoint to 100 requests/minute per IP
  const rateLimitResponse = await rateLimitMiddleware(request, {
    type: 'ip',
    limit: 100,
    windowSeconds: 60,
  });

  if (rateLimitResponse) {
    return rateLimitResponse;
  }

  return NextResponse.json({ data: 'Public data' });
}
```

### Example 4: Combined RBAC + Rate Limiting

```typescript
import { requirePermissionWithRateLimit } from '@/middleware/combined-auth';

export async function DELETE(request: NextRequest) {
  const organizationId = request.headers.get('x-organization-id');
  const memberId = request.headers.get('x-member-id');

  // Check both permission and rate limit
  const authResponse = await requirePermissionWithRateLimit(
    request,
    'monitors:delete',
    organizationId!,
    memberId!
  );

  if (authResponse) {
    return authResponse;
  }

  // Proceed with deletion
  return NextResponse.json({ success: true });
}
```

## Rate Limit Headers

All responses include rate limit headers:

```
X-RateLimit-Limit: 300
X-RateLimit-Remaining: 245
X-RateLimit-Reset: 1704124800
```

When rate limit is exceeded (429 response):

```json
{
  "success": false,
  "error": "Rate limit exceeded",
  "message": "Too many requests. Please try again after 2024-01-01T14:00:00.000Z",
  "rateLimit": {
    "limit": 300,
    "remaining": 0,
    "reset": 1704124800
  }
}
```

## Configuration

### Environment Variables

```env
# Redis Connection
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=your-redis-password
REDIS_DB=0

# Optional: Redis TLS
REDIS_TLS=false
REDIS_TLS_REJECT_UNAUTHORIZED=true
```

### Organization Tier Limits

Edit limits in `src/middleware/rate-limit.ts`:

```typescript
const limits: Record<string, number> = {
  free: 60,      // requests per minute
  pro: 300,
  enterprise: 1000,
};
```

### API Key Limits

Set custom limits when creating API keys:

```typescript
await prisma.apiKey.create({
  data: {
    key: hashedKey,
    name: 'Production API Key',
    rateLimit: 500, // Custom limit
    organizationId,
  },
});
```

## Monitoring

### Check Rate Limit Status

```bash
curl -X GET "http://localhost:3000/api/rate-limits/status?type=organization&identifier=org-123"
```

### Reset Rate Limit (Admin)

```bash
curl -X POST http://localhost:3000/api/rate-limits/reset \
  -H "Content-Type: application/json" \
  -d '{"type": "organization", "identifier": "org-123"}'
```

### Redis CLI Monitoring

```bash
# Connect to Redis
redis-cli

# Check organization rate limit
ZCARD ratelimit:org:org-123

# View request timestamps
ZRANGE ratelimit:org:org-123 0 -1 WITHSCORES

# Manual cleanup
DEL ratelimit:org:org-123
```

## Best Practices

1. **Apply rate limiting early**: Check rate limits before expensive operations
2. **Use appropriate limits**: Match limits to API endpoint resource intensity
3. **Monitor rate limit hits**: Track 429 responses to adjust limits
4. **Combine with RBAC**: Use `requirePermissionWithRateLimit` for protected endpoints
5. **Handle failures gracefully**: Implement retry logic with exponential backoff
6. **Cache Redis client**: Use singleton pattern from `@/lib/redis`
7. **Set appropriate TTLs**: Sliding window keeps history for 2x window duration
8. **Log rate limit violations**: Track abuse patterns for security

## Troubleshooting

### Rate Limit Not Working

1. Check Redis connection:

   ```typescript
   import { checkRedisHealth } from '@/lib/redis';
   const healthy = await checkRedisHealth();
   ```

2. Verify environment variables are set
3. Check Redis logs for connection errors
4. Ensure middleware is applied to route

### Too Many 429 Responses

1. Check current limits: GET /api/rate-limits/status
2. Review organization tier assignments
3. Consider upgrading tier or increasing limits
4. Reset rate limit if false positive: POST /api/rate-limits/reset

### Redis Memory Issues

1. Monitor Redis memory usage: `INFO memory`
2. Check TTL settings in `@/lib/redis`
3. Implement key eviction policy: `maxmemory-policy allkeys-lru`
4. Clean up old keys: Rate limit keys auto-expire after 2 minutes

## Performance

- **Latency**: ~5-10ms per rate limit check (Redis in-memory operation)
- **Throughput**: Supports thousands of requests/second per organization
- **Memory**: ~100 bytes per request timestamp in Redis
- **Cleanup**: Automatic with TTL expiration (2x window duration)

## Security Considerations

1. **DDoS Protection**: IP-based rate limiting prevents distributed attacks
2. **API Key Rotation**: Track `lastUsedAt` to detect compromised keys
3. **Brute Force Prevention**: Low limits on authentication endpoints
4. **Resource Exhaustion**: Per-organization quotas prevent single tenant abuse
5. **Redis Security**: Use password authentication and TLS in production

## Future Enhancements

- [ ] Dynamic rate limit adjustment based on load
- [ ] Whitelist/blacklist for specific IPs or organizations
- [ ] Rate limit analytics dashboard
- [ ] Burst allowance for short traffic spikes
- [ ] Geographic rate limiting
- [ ] Integration with CDN rate limiting (Cloudflare, etc.)
- [ ] Cost-based rate limiting (different weights for different endpoints)
