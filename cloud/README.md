# ODAVL Cloud Platform

**Cloud-native infrastructure for global deployment of ODAVL Studio products.**

## Architecture Overview

```
cloud/
├── infra/           # Infrastructure components
│   ├── api-gateway/ # REST API gateway (Express)
│   ├── auth/        # JWT authentication layer
│   ├── compute/     # Job queue & runner
│   ├── events/      # Event bus (pub/sub)
│   └── storage/     # Storage abstraction
├── services/        # Cloud services
│   ├── telemetry-proxy/  # Event ingestion
│   ├── autopilot-runner/ # O-D-A-V-L executor
│   ├── guardian-runner/  # Website testing
│   └── intelligence/     # AI analytics & predictions
├── marketplace/     # Extension ecosystem (Phase 8)
│   ├── registry.ts  # Package registry
│   ├── publisher.ts # Publishing workflow
│   └── storage/     # Local & cloud adapters
├── auth/            # Authentication service (Phase 9)
│   ├── jwt.ts       # JWT tokens
│   ├── api-keys.ts  # API key management
│   └── models/      # User, org, team, project
├── billing/         # Stripe billing (Phase 9)
│   ├── stripe.ts    # Payment processing
│   ├── plans.ts     # Subscription plans
│   └── usage.ts     # Usage tracking
├── tasks/           # Job orchestration (Phase 9)
│   ├── queue.ts     # Task queue
│   ├── runner.ts    # Task execution
│   └── worker.ts    # Worker pool
├── shared/          # Shared utilities
│   ├── types/       # TypeScript interfaces
│   └── utils/       # Common helpers
└── deploy/          # Deployment configs
    ├── docker/      # Container images
    └── github-actions/ # CI/CD workflows
```

## Quick Start

```bash
# Start API Gateway locally
cd cloud/infra/api-gateway
pnpm install && pnpm dev

# Start telemetry proxy
cd cloud/services/telemetry-proxy
pnpm install && pnpm dev

# Start intelligence service
cd cloud/services/intelligence
pnpm install && pnpm dev
```

## Design Philosophy

- **Skeleton-first**: Interfaces only, minimal logic
- **Local-first**: Runs locally for development
- **Cloud-ready**: Easy migration to AWS/Azure/GCP
