# 🛡️ ODAVL Guardian

**Pre-deploy testing and post-deploy monitoring system for ODAVL projects**

## Overview

ODAVL Guardian is a comprehensive testing and monitoring platform that ensures code quality before deployment and monitors application health after deployment.

## Features

### 🧪 Pre-Deploy Testing

- **E2E Tests**: Playwright-powered end-to-end testing
- **Visual Regression**: Screenshot comparison with Pixelmatch
- **Accessibility**: a11y testing with axe-core
- **i18n Validation**: Multi-language content verification
- **Performance**: Lighthouse audits

### 🏥 Post-Deploy Monitoring

- **Health Checks**: API and UI endpoint monitoring
- **Uptime Monitoring**: Scheduled availability checks
- **Error Tracking**: Real-time error detection
- **Performance Metrics**: Response time tracking
- **Real-time Alerts**: Socket.io-powered notifications

### 📊 Dashboard

- **Test Results**: Visual test execution history
- **Monitor Status**: Real-time monitoring dashboard
- **Historical Trends**: Performance over time
- **Alert Management**: Notification center

## Architecture

```
apps/guardian/
├── src/
│   ├── app/                    # Next.js 15 App Router
│   │   ├── api/               # REST API endpoints
│   │   │   ├── health/        # Health check endpoint
│   │   │   ├── tests/         # Test run management
│   │   │   └── monitors/      # Monitor configuration
│   │   ├── dashboard/         # Main dashboard UI
│   │   ├── tests/             # Test results UI
│   │   └── monitors/          # Monitoring UI
│   │
│   ├── lib/                   # Core libraries
│   │   ├── prisma.ts          # Database client (singleton)
│   │   ├── queue.ts           # Bull queues (Redis)
│   │   └── socket.ts          # Socket.io server
│   │
│   ├── services/
│   │   ├── testing/           # Test runners
│   │   │   ├── e2e-runner.ts      # Playwright E2E
│   │   │   ├── visual-runner.ts   # Screenshot comparison
│   │   │   ├── a11y-runner.ts     # Accessibility checks
│   │   │   ├── i18n-runner.ts     # i18n validation
│   │   │   └── performance-runner.ts # Lighthouse audits
│   │   │
│   │   └── monitoring/        # Monitoring services
│   │       ├── health-checker.ts   # HTTP health checks
│   │       ├── uptime-monitor.ts   # Scheduled monitoring
│   │       └── error-tracker.ts    # Error detection
│   │
│   └── types/                 # TypeScript type definitions
│
└── prisma/
    └── schema.prisma          # Database schema
```

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Database**: PostgreSQL + Prisma ORM
- **Queue**: Bull (Redis-backed job queue)
- **Real-time**: Socket.io
- **Testing**: Playwright, axe-core, Pixelmatch, Lighthouse
- **UI**: React 19, Tailwind CSS, Recharts

## Getting Started

### Prerequisites

- Node.js 20+
- pnpm 9+
- PostgreSQL 15+
- Redis 7+

### Installation

```bash
# From monorepo root
cd apps/guardian

# Install dependencies
pnpm install

# Setup environment
cp .env.example .env
# Edit .env with your database and Redis URLs

# Generate Prisma client
pnpm prisma:generate

# Run migrations
pnpm prisma:migrate
```

### Development

```bash
# Start dev server (port 3003)
pnpm dev

# Start queue worker (separate terminal)
pnpm queue:dev

# Run tests
pnpm test

# Run E2E tests
pnpm test:e2e
```

### Database Management

```bash
# Create migration
pnpm prisma migrate dev --name <migration_name>

# Reset database (⚠️ destructive)
pnpm prisma migrate reset

# Open Prisma Studio
pnpm prisma:studio
```

## API Endpoints

### Health Check

```bash
GET /api/health
# Returns system health status
```

### Tests

```bash
# List test runs
GET /api/tests?projectId=<id>&type=<type>&limit=50

# Create test run
POST /api/tests
{
  "projectId": "clxxx...",
  "type": "e2e",
  "config": {}
}
```

### Monitors

```bash
# List monitors
GET /api/monitors?projectId=<id>

# Create monitor
POST /api/monitors
{
  "projectId": "clxxx...",
  "name": "Production API",
  "type": "health",
  "endpoint": "https://api.example.com/health",
  "interval": 5,
  "responseTimeThreshold": 1000
}
```

## Database Schema

### Models

- **Project**: Monitored application
- **TestRun**: Test execution record
- **Monitor**: Monitoring configuration
- **MonitorCheck**: Health check result
- **Alert**: Notification record

See `prisma/schema.prisma` for complete schema.

## Queue Jobs

### Test Queue

- **execute-test**: Run test suites (E2E, visual, a11y, etc.)

### Monitor Queue

- **check-monitor**: Perform health/uptime checks (recurring)

### Alert Queue

- **send-alert**: Dispatch notifications (email, Slack, etc.)

## Real-time Events

### Socket.io Events

- `test:update` - Test run status change
- `monitor:update` - Monitor check result
- `alert:new` - New alert created

## Week 5 Progress (Foundation)

### ✅ Completed (Day 1-3)

- [x] Project setup (Next.js 15 + TypeScript)
- [x] Dependencies installed (Prisma, Bull, Socket.io, Playwright)
- [x] Prisma schema defined (5 models)
- [x] Database client singleton
- [x] Bull queues configured (3 queues)
- [x] Socket.io server setup
- [x] API routes (health, tests, monitors)
- [x] E2E runner (Playwright)
- [x] Health checker service

### 🔄 In Progress (Day 4-5)

- [ ] Visual regression runner (Pixelmatch)
- [ ] Accessibility runner (axe-core)
- [ ] i18n validation runner
- [ ] Performance runner (Lighthouse)
- [ ] Queue workers implementation
- [ ] Dashboard UI components

### 📅 Next Steps

- Week 6: Pre-deploy testing integration
- Week 7: Post-deploy monitoring automation
- Week 8: Integration with ODAVL CLI
- Week 9: Launch preparation

## License

MIT

## Links

- [ODAVL Master Plan](../../docs/ODAVL_STUDIO_MASTER_PLAN.md)
- [Prisma Docs](https://www.prisma.io/docs)
- [Playwright Docs](https://playwright.dev/docs/intro)
- [Bull Docs](https://optimalbits.github.io/bull/)
