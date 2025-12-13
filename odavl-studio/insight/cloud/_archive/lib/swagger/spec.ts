/**
 * OpenAPI/Swagger Specification
 * Complete API documentation for ODAVL Insight Cloud
 */

export const swaggerSpec = {
  openapi: '3.0.0',
  info: {
    title: 'ODAVL Insight Cloud API',
    version: '1.0.0',
    description: `
# ODAVL Insight Cloud API

ML-powered code quality analysis platform with 12 specialized detectors.

## Features
- 🔐 JWT Authentication
- ✅ Input Validation (Zod)
- 🛡️ Security Headers (CSP, CORS, HSTS)
- ⚡ Rate Limiting (Redis)
- 🔒 XSS & SQL Injection Protection

## Rate Limits
- **Auth endpoints**: 5 requests per 15 minutes
- **API endpoints**: 100 requests per minute
- **Analysis endpoints**: 10 requests per hour
- **Email endpoints**: 3 requests per hour

## Authentication
All protected endpoints require a Bearer token in the Authorization header:
\`\`\`
Authorization: Bearer <your-access-token>
\`\`\`

Tokens expire after 15 minutes. Use the refresh token to get a new access token.
    `,
    contact: {
      name: 'ODAVL Support',
      email: 'support@odavl.com',
      url: 'https://odavl.com',
    },
    license: {
      name: 'MIT',
      url: 'https://opensource.org/licenses/MIT',
    },
  },
  servers: [
    {
      url: 'http://localhost:3001',
      description: 'Development server',
    },
    {
      url: 'https://app.odavl.com',
      description: 'Production server',
    },
    {
      url: 'https://staging.odavl.com',
      description: 'Staging server',
    },
  ],
  tags: [
    {
      name: 'Authentication',
      description: 'User registration, login, and token management',
    },
    {
      name: 'Projects',
      description: 'Code project management',
    },
    {
      name: 'Analysis',
      description: 'Code quality analysis and detectors',
    },
    {
      name: 'Teams',
      description: 'Team collaboration and management',
    },
    {
      name: 'Billing',
      description: 'Subscription and payment management',
    },
    {
      name: 'Health',
      description: 'API health and status checks',
    },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'JWT access token from login or refresh',
      },
    },
    schemas: {
      User: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          email: { type: 'string', format: 'email' },
          name: { type: 'string' },
          emailVerified: { type: 'boolean' },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },
      Tokens: {
        type: 'object',
        properties: {
          accessToken: { type: 'string', description: 'JWT access token (15 min)' },
          refreshToken: { type: 'string', description: 'JWT refresh token (7 days)' },
        },
      },
      Project: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          name: { type: 'string' },
          description: { type: 'string', nullable: true },
          language: { type: 'string', enum: ['typescript', 'python', 'java'] },
          repositoryUrl: { type: 'string', nullable: true },
          userId: { type: 'string', format: 'uuid' },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },
      Analysis: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          projectId: { type: 'string', format: 'uuid' },
          status: { type: 'string', enum: ['pending', 'running', 'completed', 'failed'] },
          detectors: {
            type: 'array',
            items: { type: 'string' },
            description: 'Detectors used (typescript, eslint, security, etc.)',
          },
          issuesFound: { type: 'integer' },
          createdAt: { type: 'string', format: 'date-time' },
          completedAt: { type: 'string', format: 'date-time', nullable: true },
        },
      },
      Issue: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          analysisId: { type: 'string', format: 'uuid' },
          severity: { type: 'string', enum: ['critical', 'high', 'medium', 'low'] },
          category: { type: 'string' },
          message: { type: 'string' },
          file: { type: 'string' },
          line: { type: 'integer' },
          column: { type: 'integer' },
          detector: { type: 'string' },
        },
      },
      Error: {
        type: 'object',
        properties: {
          error: { type: 'string' },
          message: { type: 'string' },
          details: { type: 'object', additionalProperties: true },
        },
      },
      ValidationError: {
        type: 'object',
        properties: {
          error: { type: 'string', example: 'Validation failed' },
          details: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                field: { type: 'string' },
                message: { type: 'string' },
              },
            },
          },
        },
      },
      RateLimitError: {
        type: 'object',
        properties: {
          error: { type: 'string', example: 'Too Many Requests' },
          message: { type: 'string', example: 'Rate limit exceeded. Please try again later.' },
          details: {
            type: 'object',
            properties: {
              limit: { type: 'integer' },
              remaining: { type: 'integer' },
              resetAt: { type: 'string', format: 'date-time' },
              retryAfter: { type: 'string', example: '900 seconds' },
            },
          },
        },
      },
    },
    responses: {
      UnauthorizedError: {
        description: 'Authentication required or invalid token',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/Error' },
            example: {
              error: 'Unauthorized',
              message: 'Invalid or missing authentication token',
            },
          },
        },
      },
      ValidationError: {
        description: 'Request validation failed',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/ValidationError' },
          },
        },
      },
      RateLimitError: {
        description: 'Rate limit exceeded',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/RateLimitError' },
          },
        },
        headers: {
          'X-RateLimit-Limit': {
            schema: { type: 'integer' },
            description: 'Request limit per window',
          },
          'X-RateLimit-Remaining': {
            schema: { type: 'integer' },
            description: 'Requests remaining in current window',
          },
          'X-RateLimit-Reset': {
            schema: { type: 'string', format: 'date-time' },
            description: 'Time when rate limit resets',
          },
          'Retry-After': {
            schema: { type: 'integer' },
            description: 'Seconds to wait before retrying',
          },
        },
      },
      NotFoundError: {
        description: 'Resource not found',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/Error' },
            example: {
              error: 'Not Found',
              message: 'The requested resource does not exist',
            },
          },
        },
      },
    },
  },
  paths: {
    '/api/auth/register': {
      post: {
        tags: ['Authentication'],
        summary: 'Register a new user',
        description: 'Create a new user account. Rate limited to 5 requests per 15 minutes.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'password', 'name'],
                properties: {
                  email: {
                    type: 'string',
                    format: 'email',
                    description: 'Valid email address',
                    example: 'user@example.com',
                  },
                  password: {
                    type: 'string',
                    minLength: 8,
                    description: 'Min 8 chars, must include uppercase, lowercase, number, and special character',
                    example: 'SecureP@ss123',
                  },
                  name: {
                    type: 'string',
                    minLength: 2,
                    maxLength: 100,
                    description: 'User full name',
                    example: 'John Doe',
                  },
                },
              },
            },
          },
        },
        responses: {
          '201': {
            description: 'User registered successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    user: { $ref: '#/components/schemas/User' },
                    tokens: { $ref: '#/components/schemas/Tokens' },
                  },
                },
              },
            },
          },
          '400': { $ref: '#/components/responses/ValidationError' },
          '409': {
            description: 'Email already exists',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' },
                example: { error: 'Conflict', message: 'User with this email already exists' },
              },
            },
          },
          '429': { $ref: '#/components/responses/RateLimitError' },
        },
      },
    },
    '/api/auth/login': {
      post: {
        tags: ['Authentication'],
        summary: 'Login with email and password',
        description: 'Authenticate and receive access/refresh tokens. Rate limited to 5 requests per 15 minutes.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'password'],
                properties: {
                  email: { type: 'string', format: 'email', example: 'user@example.com' },
                  password: { type: 'string', example: 'SecureP@ss123' },
                },
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Login successful',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    user: { $ref: '#/components/schemas/User' },
                    tokens: { $ref: '#/components/schemas/Tokens' },
                  },
                },
              },
            },
          },
          '400': { $ref: '#/components/responses/ValidationError' },
          '401': {
            description: 'Invalid credentials',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' },
                example: { error: 'Unauthorized', message: 'Invalid email or password' },
              },
            },
          },
          '429': { $ref: '#/components/responses/RateLimitError' },
        },
      },
    },
    '/api/auth/refresh': {
      post: {
        tags: ['Authentication'],
        summary: 'Refresh access token',
        description: 'Get a new access token using refresh token',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['refreshToken'],
                properties: {
                  refreshToken: { type: 'string', description: 'Refresh token from login' },
                },
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Token refreshed successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    accessToken: { type: 'string' },
                    refreshToken: { type: 'string' },
                  },
                },
              },
            },
          },
          '401': { $ref: '#/components/responses/UnauthorizedError' },
        },
      },
    },
    '/api/health': {
      get: {
        tags: ['Health'],
        summary: 'Health check endpoint',
        description: 'Check API health and uptime',
        responses: {
          '200': {
            description: 'API is healthy',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    status: { type: 'string', example: 'ok' },
                    timestamp: { type: 'string', format: 'date-time' },
                    uptime: { type: 'number', description: 'Uptime in seconds' },
                    version: { type: 'string', example: '1.0.0' },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/api/projects': {
      get: {
        tags: ['Projects'],
        summary: 'List user projects',
        description: 'Get all projects for authenticated user',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'page',
            in: 'query',
            schema: { type: 'integer', minimum: 1, default: 1 },
            description: 'Page number',
          },
          {
            name: 'limit',
            in: 'query',
            schema: { type: 'integer', minimum: 1, maximum: 100, default: 20 },
            description: 'Items per page',
          },
        ],
        responses: {
          '200': {
            description: 'Projects retrieved successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    projects: {
                      type: 'array',
                      items: { $ref: '#/components/schemas/Project' },
                    },
                    pagination: {
                      type: 'object',
                      properties: {
                        page: { type: 'integer' },
                        limit: { type: 'integer' },
                        total: { type: 'integer' },
                        pages: { type: 'integer' },
                      },
                    },
                  },
                },
              },
            },
          },
          '401': { $ref: '#/components/responses/UnauthorizedError' },
          '429': { $ref: '#/components/responses/RateLimitError' },
        },
      },
      post: {
        tags: ['Projects'],
        summary: 'Create a new project',
        description: 'Create a code analysis project',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['name', 'language'],
                properties: {
                  name: { type: 'string', minLength: 3, maxLength: 50 },
                  description: { type: 'string', maxLength: 500 },
                  language: { type: 'string', enum: ['typescript', 'python', 'java'] },
                  repositoryUrl: { type: 'string', format: 'uri' },
                },
              },
            },
          },
        },
        responses: {
          '201': {
            description: 'Project created successfully',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Project' },
              },
            },
          },
          '400': { $ref: '#/components/responses/ValidationError' },
          '401': { $ref: '#/components/responses/UnauthorizedError' },
          '429': { $ref: '#/components/responses/RateLimitError' },
        },
      },
    },
    '/api/projects/{projectId}': {
      get: {
        tags: ['Projects'],
        summary: 'Get project details',
        description: 'Get a specific project by ID',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'projectId',
            in: 'path',
            required: true,
            schema: { type: 'string', format: 'uuid' },
          },
        ],
        responses: {
          '200': {
            description: 'Project retrieved successfully',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Project' },
              },
            },
          },
          '401': { $ref: '#/components/responses/UnauthorizedError' },
          '404': { $ref: '#/components/responses/NotFoundError' },
        },
      },
    },
    '/api/analysis': {
      post: {
        tags: ['Analysis'],
        summary: 'Start code analysis',
        description: 'Analyze code with selected detectors. Rate limited to 10 requests per hour.',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['projectId'],
                properties: {
                  projectId: { type: 'string', format: 'uuid' },
                  detectors: {
                    type: 'array',
                    items: {
                      type: 'string',
                      enum: [
                        'typescript',
                        'eslint',
                        'security',
                        'import',
                        'package',
                        'runtime',
                        'build',
                        'circular',
                        'network',
                        'performance',
                        'complexity',
                        'isolation',
                      ],
                    },
                    description: 'Detectors to run (default: all)',
                  },
                  files: {
                    type: 'array',
                    items: { type: 'string' },
                    description: 'Specific files to analyze (default: all)',
                  },
                },
              },
            },
          },
        },
        responses: {
          '201': {
            description: 'Analysis started',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Analysis' },
              },
            },
          },
          '400': { $ref: '#/components/responses/ValidationError' },
          '401': { $ref: '#/components/responses/UnauthorizedError' },
          '429': { $ref: '#/components/responses/RateLimitError' },
        },
      },
    },
  },
};
