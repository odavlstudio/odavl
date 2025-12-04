/**
 * Swagger UI API Documentation Endpoint
 * 
 * Serves interactive API documentation at /api/docs
 * with live testing capabilities and authentication.
 */

import { NextRequest, NextResponse } from 'next/server';
import { generateOpenAPISpec } from '@/lib/openapi/generator';
import { appRouter } from '@/server/trpc/router';

export const dynamic = 'force-dynamic';

/**
 * GET /api/docs - Serve Swagger UI HTML
 */
export async function GET(req: NextRequest) {
  // Generate OpenAPI spec without options
  const spec = {
    openapi: '3.0.0',
    info: {
      title: 'ODAVL Studio API',
      version: '2.0.0',
      description: `
# ODAVL Studio API Documentation

Welcome to the ODAVL Studio API! This comprehensive API enables you to integrate
ML-powered error detection, self-healing code infrastructure, and pre-deploy testing
into your development workflow.

## Getting Started

1. **Authentication**: Obtain a JWT token via \`/api/auth/signin\` or create an API key in your organization settings
2. **Rate Limits**: Free tier: 1,000 requests/hour, Pro tier: 10,000 requests/hour
3. **Versioning**: Current version is v2.0.0 (semantic versioning with 6-month deprecation policy)
4. **Support**: Contact support@odavl.studio or visit https://odavl.studio/docs

## Products

### Insight API
ML-powered error detection with 12 specialized detectors:
- TypeScript, ESLint, Import, Package errors
- Runtime errors, Build failures
- Security vulnerabilities, Circular dependencies
- Network issues, Performance bottlenecks
- Code complexity, Test isolation

### Autopilot API
Self-healing code infrastructure with O-D-A-V-L cycle:
- **Observe**: Collect metrics from ESLint, TypeScript, tests
- **Decide**: Select highest-trust improvement recipe
- **Act**: Apply changes with undo snapshots
- **Verify**: Re-run quality checks and gates
- **Learn**: Update recipe trust scores

### Guardian API
Pre-deploy testing and monitoring:
- Accessibility testing (axe-core, Lighthouse)
- Performance testing (Core Web Vitals)
- Security testing (OWASP Top 10)
- Quality gate enforcement

## Rate Limiting

All endpoints are rate-limited based on your subscription plan:

| Plan | Requests/Hour | Requests/Day |
|------|---------------|--------------|
| Free | 1,000 | 10,000 |
| Pro | 10,000 | 100,000 |
| Enterprise | Custom | Custom |

Rate limit headers are included in every response:
- \`X-RateLimit-Limit\`: Total requests allowed
- \`X-RateLimit-Remaining\`: Remaining requests
- \`X-RateLimit-Reset\`: Unix timestamp when limit resets

## Error Handling

All errors follow a consistent format:

\`\`\`json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "details": { /* Additional context */ }
  }
}
\`\`\`

Common error codes:
- \`UNAUTHORIZED\`: Missing or invalid authentication
- \`FORBIDDEN\`: Insufficient permissions
- \`NOT_FOUND\`: Resource does not exist
- \`BAD_REQUEST\`: Invalid input parameters
- \`TOO_MANY_REQUESTS\`: Rate limit exceeded
- \`INTERNAL_SERVER_ERROR\`: Server error (we're alerted)

## Webhooks

Subscribe to real-time events via webhooks:
- \`insight.issue.detected\`: New issue found
- \`autopilot.run.completed\`: O-D-A-V-L cycle finished
- \`guardian.test.failed\`: Quality gate failed

Configure webhooks in your organization settings.

## SDKs

Official TypeScript SDK available:

\`\`\`bash
npm install @odavl-studio/sdk
\`\`\`

\`\`\`typescript
import { ODAVLClient } from '@odavl-studio/sdk';

const client = new ODAVLClient({
  apiKey: process.env.ODAVL_API_KEY
});

const issues = await client.insight.getIssues({
  projectId: 'proj_123',
  severity: 'high'
});
\`\`\`
    `,
    },
    servers: [
      {
        url: 'https://odavl.studio',
        description: 'Production',
      },
    ],
    paths: {},
  };
  
  const html = generateSwaggerHTML(spec);
  
  return new NextResponse(html, {
    headers: {
      'Content-Type': 'text/html',
      'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
    },
  });
}

/**
 * Generate Swagger UI HTML with embedded OpenAPI spec
 */
function generateSwaggerHTML(spec: Record<string, unknown>): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>ODAVL Studio API Documentation</title>
  <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5/swagger-ui.css">
  <style>
    body {
      margin: 0;
      padding: 0;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    }
    
    .topbar {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      padding: 1rem 2rem;
      color: white;
    }
    
    .topbar-wrapper {
      display: flex;
      align-items: center;
      justify-content: space-between;
      max-width: 1460px;
      margin: 0 auto;
    }
    
    .topbar h1 {
      margin: 0;
      font-size: 1.5rem;
      font-weight: 600;
    }
    
    .topbar-links {
      display: flex;
      gap: 1.5rem;
    }
    
    .topbar-links a {
      color: white;
      text-decoration: none;
      font-weight: 500;
      opacity: 0.9;
      transition: opacity 0.2s;
    }
    
    .topbar-links a:hover {
      opacity: 1;
    }
    
    #swagger-ui {
      max-width: 1460px;
      margin: 0 auto;
    }
    
    .swagger-ui .topbar {
      display: none;
    }
  </style>
</head>
<body>
  <div class="topbar">
    <div class="topbar-wrapper">
      <h1>🚀 ODAVL Studio API</h1>
      <div class="topbar-links">
        <a href="https://odavl.studio/docs" target="_blank">Documentation</a>
        <a href="https://odavl.studio/docs/sdk" target="_blank">SDK</a>
        <a href="https://odavl.studio/playground" target="_blank">Playground</a>
        <a href="https://github.com/odavl-studio" target="_blank">GitHub</a>
      </div>
    </div>
  </div>
  
  <div id="swagger-ui"></div>
  
  <script src="https://unpkg.com/swagger-ui-dist@5/swagger-ui-bundle.js"></script>
  <script src="https://unpkg.com/swagger-ui-dist@5/swagger-ui-standalone-preset.js"></script>
  <script>
    window.onload = function() {
      const spec = ${JSON.stringify(spec)};
      
      SwaggerUIBundle({
        spec: spec,
        dom_id: '#swagger-ui',
        deepLinking: true,
        presets: [
          SwaggerUIBundle.presets.apis,
          SwaggerUIStandalonePreset
        ],
        plugins: [
          SwaggerUIBundle.plugins.DownloadUrl
        ],
        layout: "BaseLayout",
        defaultModelsExpandDepth: 1,
        defaultModelExpandDepth: 1,
        docExpansion: 'list',
        filter: true,
        persistAuthorization: true,
        tryItOutEnabled: true,
      });
    };
  </script>
</body>
</html>
  `;
}
