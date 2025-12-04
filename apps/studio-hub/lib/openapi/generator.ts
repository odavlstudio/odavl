import type { OpenApiMeta } from 'trpc-openapi';
import { generateOpenApiDocument } from 'trpc-openapi';
import { appRouter } from '@/server/trpc/router';

/**
 * Generate OpenAPI 3.0 specification from tRPC router
 * 
 * This creates a complete API documentation that can be used with:
 * - Swagger UI for interactive exploration
 * - Client SDK generation
 * - API testing tools (Postman, Insomnia)
 * - Third-party integrations
 */
export function generateOpenAPISpec() {
  return generateOpenApiDocument(appRouter, {
    title: 'ODAVL Studio API',
    description: 'Complete API documentation for ODAVL Studio Hub - Autonomous code quality platform with Insight (ML-powered error detection), Autopilot (self-healing infrastructure), and Guardian (pre-deploy testing).',
    version: '2.0.0',
    baseUrl: process.env.NEXT_PUBLIC_APP_URL || 'https://studio.odavl.com',
    docsUrl: 'https://docs.odavl.com',
    tags: [
      'insight',
      'autopilot', 
      'guardian',
      'analytics',
      'organizations',
      'projects',
      'users'
    ],
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'JWT token obtained from NextAuth.js authentication'
      },
      apiKey: {
        type: 'apiKey',
        in: 'header',
        name: 'X-API-Key',
        description: 'Organization API key for programmatic access'
      }
    },
  });
}

/**
 * OpenAPI metadata for tRPC procedures
 * 
 * Add this to tRPC procedures to include them in OpenAPI spec:
 * ```typescript
 * .meta({
 *   openapi: {
 *     method: 'GET',
 *     path: '/insight/issues',
 *     tags: ['insight'],
 *     summary: 'Get all issues',
 *   }
 * } satisfies OpenApiMeta)
 * ```
 */
export type OpenApiMetadata = OpenApiMeta;

/**
 * Get OpenAPI spec as JSON
 */
export async function getOpenAPIJSON(): Promise<string> {
  const spec = generateOpenAPISpec();
  return JSON.stringify(spec, null, 2);
}

/**
 * Get OpenAPI spec as YAML
 */
export async function getOpenAPIYAML(): Promise<string> {
  const spec = generateOpenAPISpec();
  
  // Simple YAML conversion (for production, use a proper YAML library)
  const yaml = Object.entries(spec)
    .map(([key, value]) => `${key}: ${JSON.stringify(value)}`)
    .join('\n');
  
  return yaml;
}

/**
 * Validation helper for OpenAPI responses
 */
export function validateOpenAPIResponse<T>(
  data: unknown,
  schema: { parse: (data: unknown) => T }
): T {
  return schema.parse(data);
}
