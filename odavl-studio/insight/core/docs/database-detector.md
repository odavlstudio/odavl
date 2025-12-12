# DatabaseDetector

## Overview

The `DatabaseDetector` analyzes database usage patterns in Prisma/PostgreSQL projects to identify performance issues, security vulnerabilities, and architectural problems.

## Features

### 1. Schema Drift Detection
Compares Prisma schema with actual implementation to find:
- Missing foreign key indexes
- Schema/code mismatches
- Unused models

**Example Issue:**
```typescript
// Prisma schema has: author User @relation(fields: [authorId])
// But missing: @@index([authorId])

// Issue: Foreign key "authorId" missing index
// Impact: Slow queries on Post.author joins
// Fix: Add @@index([authorId]) to Post model
```

### 2. Slow Query Detection
Identifies queries that may cause performance bottlenecks:
- Unpaginated `findMany()` calls
- Missing `select` clauses (fetching unnecessary data)
- Critical queries (>500ms threshold)

**Example Issue:**
```typescript
// ❌ Bad: No pagination
const users = await prisma.user.findMany();

// ✅ Good: Paginated
const users = await prisma.user.findMany({
  take: 20,
  skip: 0,
});
```

### 3. N+1 Query Detection
Detects queries inside loops that cause N+1 problems:
- Queries in `.forEach()` loops
- Queries in `.map()` loops
- Queries in `for` loops

**Example Issue:**
```typescript
// ❌ Bad: N+1 problem (1 query for posts + N queries for authors)
const posts = await prisma.post.findMany();
posts.forEach(async (post) => {
  const author = await prisma.user.findUnique({ where: { id: post.authorId } });
});

// ✅ Good: Single batch query
const posts = await prisma.post.findMany({
  include: { author: true }, // JOIN query
});
```

### 4. Missing Index Detection
Finds WHERE clauses on non-indexed fields:
- Standard WHERE conditions
- Destructured query objects
- Inline findFirst/findUnique calls

**Example Issue:**
```typescript
// Prisma schema missing: @@index([email])
const user = await prisma.user.findFirst({
  where: { email: 'test@example.com' }
});

// Issue: WHERE clause on non-indexed field "email"
// Fix: Add @@index([email]) to User model
```

### 5. Connection Leak Detection
Identifies potential connection leaks:
- PrismaClient without `$disconnect()`
- Multiple PrismaClient instances
- SQL injection vulnerabilities in raw queries

**Example Issue:**
```typescript
// ❌ Bad: Connection leak
const prisma = new PrismaClient();
await prisma.user.findMany();
// Missing: await prisma.$disconnect()

// ✅ Good: Proper cleanup
const prisma = new PrismaClient();
try {
  await prisma.user.findMany();
} finally {
  await prisma.$disconnect();
}
```

## Usage

### CLI

```bash
# Analyze current directory
odavl insight database

# Analyze specific workspace
odavl insight database ./my-project

# Custom Prisma schema path
odavl insight database --schema custom/schema.prisma

# Custom slow query threshold (default: 100ms)
odavl insight database --threshold 50

# JSON output
odavl insight database --json
```

### Programmatic

```typescript
import { DatabaseDetector } from '@odavl-studio/insight-core/detector';

const detector = new DatabaseDetector({
  workspacePath: './my-project',
  prismaSchemaPath: 'prisma/schema.prisma',
  slowQueryThreshold: 100, // milliseconds
  criticalQueryThreshold: 500, // milliseconds
});

const result = await detector.analyze('./my-project');

console.log(`Score: ${result.metrics.databaseScore}/100`);
console.log(`Issues: ${result.issues.length}`);
console.log(`Database: ${result.metrics.databaseType}`);
```

### Helper Function

```typescript
import { analyzeDatabase } from '@odavl-studio/insight-core/detector';

const result = await analyzeDatabase('./my-project', {
  prismaSchemaPath: 'prisma/schema.prisma',
  slowQueryThreshold: 100,
});
```

## Configuration

### DatabaseConfig Interface

```typescript
interface DatabaseConfig {
  workspacePath: string;              // Workspace root
  prismaSchemaPath?: string;          // Default: 'prisma/schema.prisma'
  slowQueryThreshold?: number;        // Default: 100ms
  criticalQueryThreshold?: number;    // Default: 500ms
}
```

## Output Format

### DatabaseAnalysisResult

```typescript
interface DatabaseAnalysisResult {
  issues: DatabaseIssue[];
  metrics: DatabaseMetrics;
}

interface DatabaseIssue {
  type: 'schema-drift' | 'slow-query' | 'n-plus-one' | 'missing-index' | 'connection-leak';
  severity: 'critical' | 'high' | 'medium' | 'low';
  message: string;
  file: string;
  line: number;
  suggestion?: string;
  details?: Record<string, any>;
}

interface DatabaseMetrics {
  databaseScore: number;           // 0-100
  totalIssues: number;
  criticalIssues: number;
  highIssues: number;
  mediumIssues: number;
  lowIssues: number;
  analysisTime: number;            // milliseconds
  databaseType: 'postgresql' | 'mysql' | 'sqlite' | 'mongodb' | 'unknown';
}
```

## Score Calculation

- **100 points** - Perfect (no issues)
- **-15 points** per critical issue (N+1 queries, connection leaks)
- **-10 points** per high issue (slow queries, missing indexes)
- **-5 points** per medium/low issue (schema drift)
- **Minimum score: 0**

## Supported Databases

- ✅ **PostgreSQL** - Full support
- ✅ **MySQL** - Full support
- ✅ **SQLite** - Full support
- ⚠️ **MongoDB** - Limited support (schema-less)

## Performance

- **Typical workspace** (~100 files): 150-300ms
- **Large workspace** (500+ files): 1-2 seconds
- **Caching**: None (stateless analysis)

## Limitations

1. **Prisma-only**: Requires Prisma ORM (doesn't analyze raw SQL)
2. **Static analysis**: Cannot detect runtime query patterns
3. **False positives**: May flag intentional patterns (e.g., admin queries without pagination)
4. **TypeScript/JavaScript only**: Doesn't analyze other languages

## Best Practices

### 1. Run regularly
```bash
# Add to pre-commit hook
pnpm odavl:insight -- database
```

### 2. CI/CD Integration
```yaml
# .github/workflows/quality.yml
- name: Database Analysis
  run: |
    pnpm odavl insight database --json > db-report.json
    if [ $(jq '.metrics.databaseScore' db-report.json) -lt 70 ]; then
      echo "Database score too low!"
      exit 1
    fi
```

### 3. Incremental fixes
```bash
# Fix critical issues first
odavl insight database | grep "critical"
```

## Troubleshooting

### "No Prisma schema found"
```bash
# Specify custom path
odavl insight database --schema packages/database/schema.prisma
```

### "Database type: unknown"
- Ensure `datasource db` is defined in schema.prisma
- Check provider value: `postgresql`, `mysql`, `sqlite`, or `mongodb`

### Too many false positives
```bash
# Increase threshold for slow queries
odavl insight database --threshold 200
```

## Examples

### Multi-module Monorepo
```bash
# Analyze each package separately
odavl insight database packages/api --schema packages/api/prisma/schema.prisma
odavl insight database packages/admin --schema packages/admin/prisma/schema.prisma
```

### Custom Workflow
```typescript
import { DatabaseDetector } from '@odavl-studio/insight-core/detector';

const detector = new DatabaseDetector({
  workspacePath: './src',
  slowQueryThreshold: 50, // Stricter for critical services
});

const result = await detector.analyze('./src');

// Custom filtering
const criticalIssues = result.issues.filter(i => i.severity === 'critical');
const nPlusOneIssues = result.issues.filter(i => i.type === 'n-plus-one');

// Export to file
await fs.writeFile('db-report.json', JSON.stringify(result, null, 2));
```

## Related Detectors

- **PerformanceDetector** - General performance issues
- **ArchitectureDetector** - Circular dependencies, layer violations
- **SecurityDetector** - SQL injection, hardcoded secrets

## Support

- **Issues**: https://github.com/odavlstudio/odavl/issues
- **Docs**: https://docs.odavl.com/insight/database-detector
- **Slack**: #odavl-support

---

**Version**: 2.0.0  
**Last Updated**: December 2025  
**Status**: ✅ Stable (36/36 tests passing)
