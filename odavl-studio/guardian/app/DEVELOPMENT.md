# Development Guide

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js**: Version 20.x or higher ([Download](https://nodejs.org/))
- **pnpm**: Version 8.x or higher (`npm install -g pnpm`)
- **PostgreSQL**: Version 14.x or higher ([Download](https://www.postgresql.org/download/))
- **Redis**: Version 7.x or higher ([Download](https://redis.io/download))
- **Git**: For version control ([Download](https://git-scm.com/downloads))

Optional but recommended:

- **Docker**: For running services in containers
- **VS Code**: Recommended IDE with extensions (ESLint, Prettier, Prisma)

## Local Setup

### 1. Clone the Repository

```bash
git clone https://github.com/odavl/guardian.git
cd guardian/apps/guardian
```

### 2. Install Dependencies

```bash
pnpm install
```

This will install all dependencies for the Guardian application.

### 3. Environment Configuration

Copy the example environment file:

```bash
cp .env.example .env
```

Edit `.env` with your local configuration:

```env
# Database
DATABASE_URL="postgresql://postgres:password@localhost:5432/guardian?schema=public&connection_limit=10&pool_timeout=5"

# Redis
REDIS_URL="redis://localhost:6379"

# Application
NODE_ENV="development"
PORT=3003
NEXT_PUBLIC_API_URL="http://localhost:3003"

# Security
JWT_SECRET="your-jwt-secret-change-in-production"
API_KEYS_SECRET="your-api-keys-secret-change-in-production"

# Performance
SLOW_QUERY_THRESHOLD=100

# Monitoring
PROMETHEUS_ENABLED=true
JAEGER_ENABLED=false
```

### 4. Database Setup

Generate Prisma Client:

```bash
pnpx prisma generate
```

Run database migrations:

```bash
pnpx prisma migrate dev
```

Seed the database (optional):

```bash
pnpx prisma db seed
```

### 5. Start Development Server

```bash
pnpm dev
```

The application will be available at:

- **Web UI**: <http://localhost:3003>
- **API**: <http://localhost:3003/api>
- **Health Check**: <http://localhost:3003/api/health>

## Running Tests

### Unit Tests

```bash
# Run all tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Run with coverage
pnpm test:coverage
```

### E2E Tests

```bash
# Run E2E tests
pnpm test:e2e

# Run E2E tests in UI mode
pnpm test:e2e:ui
```

### Linting and Type Checking

```bash
# Lint code
pnpm lint

# Fix linting issues
pnpm lint:fix

# Type check
pnpm type-check
```

## Database Migrations

### Creating a New Migration

```bash
# Create a migration after schema changes
pnpx prisma migrate dev --name add_new_feature

# Create migration without applying
pnpx prisma migrate dev --create-only --name add_new_feature
```

### Applying Migrations

```bash
# Apply pending migrations
pnpx prisma migrate deploy

# Reset database (⚠️ destructive)
pnpx prisma migrate reset
```

### Rolling Back Migrations

```bash
# Mark a migration as rolled back
pnpx prisma migrate resolve --rolled-back <migration_name>

# Then manually restore from backup and replay
```

## Debugging

### VS Code Launch Configuration

Create `.vscode/launch.json`:

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Next.js: debug server-side",
      "type": "node-terminal",
      "request": "launch",
      "command": "pnpm dev",
      "cwd": "${workspaceFolder}/apps/guardian",
      "serverReadyAction": {
        "pattern": "ready - started server on .+, url: (https?://.+)",
        "uriFormat": "%s",
        "action": "debugWithChrome"
      }
    },
    {
      "name": "Next.js: debug client-side",
      "type": "chrome",
      "request": "launch",
      "url": "http://localhost:3003"
    },
    {
      "name": "Next.js: debug full stack",
      "type": "node-terminal",
      "request": "launch",
      "command": "pnpm dev",
      "cwd": "${workspaceFolder}/apps/guardian",
      "console": "integratedTerminal",
      "serverReadyAction": {
        "pattern": "ready - started server on .+, url: (https?://.+)",
        "action": "debugWithEdge"
      }
    }
  ]
}
```

### Debugging with Chrome DevTools

1. Start the dev server: `pnpm dev`
2. Open Chrome: `chrome://inspect`
3. Click "Open dedicated DevTools for Node"
4. Set breakpoints in your code

### Network Debugging

Enable verbose logging:

```env
# .env
DEBUG=*
LOG_LEVEL=debug
```

Use the Network tab in Chrome DevTools to inspect API requests.

## Project Structure

```
apps/guardian/
├── src/
│   ├── app/              # Next.js App Router pages
│   │   ├── api/          # API routes
│   │   │   ├── auth/     # Authentication endpoints
│   │   │   ├── projects/ # Project management
│   │   │   ├── tests/    # Test execution
│   │   │   └── health/   # Health check
│   │   ├── dashboard/    # Dashboard pages
│   │   └── layout.tsx    # Root layout
│   ├── components/       # React components
│   │   ├── ui/           # Reusable UI components
│   │   └── features/     # Feature-specific components
│   ├── lib/              # Utility libraries
│   │   ├── db.ts         # Prisma client
│   │   ├── cache.ts      # Redis cache
│   │   ├── logger.ts     # Winston logger
│   │   ├── csrf.ts       # CSRF protection
│   │   ├── sanitization.ts # Input sanitization
│   │   └── middleware/   # Express/Next.js middleware
│   ├── types/            # TypeScript types
│   └── utils/            # Helper functions
├── prisma/
│   ├── schema.prisma     # Database schema
│   ├── migrations/       # Migration history
│   └── seed.ts           # Database seeding
├── public/               # Static assets
├── tests/                # Test files
│   ├── unit/             # Unit tests
│   ├── integration/      # Integration tests
│   └── e2e/              # End-to-end tests
├── .env                  # Environment variables (gitignored)
├── .env.example          # Example environment file
├── next.config.mjs       # Next.js configuration
├── tsconfig.json         # TypeScript configuration
└── package.json          # Dependencies and scripts
```

## Coding Standards

### TypeScript

- Use **strict mode** (`strict: true` in tsconfig.json)
- Prefer **interfaces** over types for object shapes
- Use **explicit return types** for functions
- Avoid `any` type; use `unknown` if type is truly unknown
- Use **const assertions** for literal types

```typescript
// ✅ Good
interface User {
  id: string;
  email: string;
  role: Role;
}

async function getUser(id: string): Promise<User | null> {
  return await prisma.user.findUnique({ where: { id } });
}

// ❌ Bad
function getUser(id: any): any {
  return prisma.user.findUnique({ where: { id } });
}
```

### ESLint

Configuration in `eslint.config.mjs`:

- **no-console**: Error (use `logger` instead)
- **no-debugger**: Error
- **@typescript-eslint/no-unused-vars**: Warning (prefix with `_` to ignore)
- **@typescript-eslint/no-explicit-any**: Warning

### Prettier

Code formatting is handled by Prettier:

```bash
# Format all files
pnpm format

# Check formatting
pnpm format:check
```

### Naming Conventions

- **Files**: `kebab-case.ts`, `PascalCase.tsx` (components)
- **Variables/Functions**: `camelCase`
- **Classes/Interfaces**: `PascalCase`
- **Constants**: `UPPER_SNAKE_CASE`
- **Private properties**: `_privateProperty`

```typescript
// File: user-service.ts
export class UserService {
  private readonly _cache: Cache;
  
  async getUserById(userId: string): Promise<User> {
    // ...
  }
}

// File: UserProfile.tsx
export function UserProfile({ userId }: UserProfileProps) {
  // ...
}
```

## Performance Best Practices

### Database Queries

1. **Use Prisma's query optimization**:

```typescript
// ✅ Good: Select only needed fields
const users = await prisma.user.findMany({
  select: { id: true, email: true, name: true },
});

// ❌ Bad: Fetch all fields
const users = await prisma.user.findMany();
```

1. **Use pagination for large datasets**:

```typescript
const users = await prisma.user.findMany({
  take: 20,
  skip: page * 20,
  orderBy: { createdAt: 'desc' },
});
```

1. **Use database indexes** (defined in `schema.prisma`):

```prisma
model User {
  id    String @id @default(cuid())
  email String @unique
  
  @@index([email])
  @@index([createdAt])
}
```

### Caching

Use Redis caching for frequently accessed data:

```typescript
import { getOrSet } from '@/lib/cache';

const user = await getOrSet(
  `user:${userId}`,
  async () => await prisma.user.findUnique({ where: { id: userId } }),
  3600 // TTL in seconds
);
```

### React Components

1. **Use React Server Components** (RSC) by default
2. **Client Components** only when needed (interactivity, hooks)
3. **Memoize expensive computations**:

```typescript
'use client';

import { useMemo } from 'react';

export function DataTable({ data }: DataTableProps) {
  const sortedData = useMemo(
    () => data.sort((a, b) => a.name.localeCompare(b.name)),
    [data]
  );
  
  return <table>{/* ... */}</table>;
}
```

## Common Issues and Solutions

### Database Connection Errors

**Problem**: `P1001: Can't reach database server`

**Solution**:

1. Verify PostgreSQL is running: `pg_isready`
2. Check DATABASE_URL in `.env`
3. Test connection: `psql $DATABASE_URL`

### Redis Connection Errors

**Problem**: `ECONNREFUSED ::1:6379`

**Solution**:

1. Verify Redis is running: `redis-cli ping`
2. Check REDIS_URL in `.env`
3. Start Redis: `redis-server`

### Port Already in Use

**Problem**: `Error: listen EADDRINUSE: address already in use :::3003`

**Solution**:

```bash
# Find process using port 3003
lsof -i :3003

# Kill process
kill -9 <PID>
```

### TypeScript Errors in node_modules

**Problem**: Type errors in external packages

**Solution**:

```bash
# Clear node_modules and reinstall
rm -rf node_modules
pnpm install

# Restart TypeScript server in VS Code
Cmd+Shift+P → "TypeScript: Restart TS Server"
```

### Build Errors

**Problem**: `Error: Failed to compile`

**Solution**:

```bash
# Clear Next.js cache
rm -rf .next

# Clear TypeScript cache
rm -rf tsconfig.tsbuildinfo

# Rebuild
pnpm build
```

## Git Workflow

### Branch Naming

```
feature/add-user-authentication
bugfix/fix-login-redirect
hotfix/critical-security-patch
docs/update-api-documentation
```

### Commit Messages

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
feat(auth): add JWT token refresh
fix(api): handle null values in user endpoint
docs(readme): update installation instructions
chore(deps): upgrade Next.js to 15.1.0
test(auth): add unit tests for login flow
```

### Pull Request Checklist

- [ ] Tests pass (`pnpm test`)
- [ ] Type checks pass (`pnpm type-check`)
- [ ] Linting passes (`pnpm lint`)
- [ ] Documentation updated
- [ ] No console.log statements
- [ ] Meaningful commit messages
- [ ] PR description explains changes

## Additional Resources

- **Next.js Documentation**: <https://nextjs.org/docs>
- **Prisma Documentation**: <https://www.prisma.io/docs>
- **TypeScript Handbook**: <https://www.typescriptlang.org/docs/handbook/>
- **React Documentation**: <https://react.dev/>
- **Redis Documentation**: <https://redis.io/docs/>

## Getting Help

- **Internal Wiki**: Check the team wiki for internal documentation
- **Slack Channel**: #guardian-dev for development questions
- **GitHub Issues**: Report bugs or request features
- **Code Reviews**: Ask teammates for review and feedback

---

**Last Updated**: January 2025  
**Maintainer**: ODAVL Development Team
