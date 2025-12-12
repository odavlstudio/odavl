# Changelog

All notable changes to ODAVL Insight Cloud will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2025-12-12

### Added

#### Core Features
- **Cloud Dashboard**: Next.js 15 app with Server Components and App Router
- **Project Management**: Create, view, archive projects
- **Analysis History**: View past analysis runs with filtering/sorting
- **Issue Explorer**: Browse issues by severity, detector, file, project
- **Trend Analysis**: Track metrics over time (error rates, complexity scores)
- **Team Collaboration**: Comments, assignments, shared workspaces (TEAM+)
- **Plan Management**: View current plan, usage, upgrade options

#### Authentication
- **NextAuth.js Integration**: JWT-based sessions with refresh tokens
- **OAuth Providers**: GitHub and Google login
- **API Key Management**: Generate keys for CLI/SDK integration
- **Session Persistence**: Remember me (30 days) or session-only
- **Email Verification**: Required for cloud analysis
- **Password Reset**: Secure token-based flow

#### Billing & Subscriptions (Stripe)
- **4 Plans**: FREE, PRO ($29/mo), TEAM ($99/mo), ENTERPRISE (custom)
- **Stripe Checkout**: Seamless upgrade flow with test mode support
- **Subscription Management**: View, upgrade, downgrade, cancel
- **Usage Tracking**: Monitor analyses, files, projects against plan limits
- **Webhook Handling**: Real-time subscription updates
- **Invoice History**: View past invoices and download receipts
- **Payment Methods**: Credit/debit cards, Google Pay, Apple Pay

#### Database (Prisma + PostgreSQL)
- **Schema**: Users, Organizations, Projects, Analyses, Subscriptions, Issues
- **Prisma Client**: Singleton pattern prevents connection leaks
- **Migrations**: Versioned schema changes with rollback support
- **Indexes**: Optimized queries for fast dashboard loading
- **Relationships**: Users ↔ Organizations ↔ Projects ↔ Analyses

#### API Endpoints
- `POST /api/analyze` - Run cloud analysis
- `GET /api/projects` - List user projects
- `GET /api/projects/:id` - Get project details
- `POST /api/projects` - Create new project
- `GET /api/analyses` - List analysis history
- `GET /api/analyses/:id` - Get analysis details
- `POST /api/checkout` - Create Stripe checkout session
- `POST /api/webhooks/stripe` - Handle Stripe events
- `GET /api/auth/[...nextauth]` - NextAuth.js routes
- `GET /api/health` - Health check endpoint

#### Dashboard Pages
- `/` - Landing page with feature overview
- `/dashboard` - Main dashboard (projects, recent analyses)
- `/projects` - Project list with search/filter
- `/projects/[id]` - Project detail with analysis history
- `/analyses` - Analysis history with sorting/filtering
- `/analyses/[id]` - Analysis detail with issue breakdown
- `/issues` - Issue explorer with multi-faceted search
- `/trends` - Trend charts (error rates, complexity over time)
- `/team` - Team management (TEAM+ only)
- `/settings` - User settings (profile, API keys, notifications)
- `/upgrade` - Plan comparison and upgrade flow
- `/docs` - Documentation links

#### UI Components (React + Tailwind CSS)
- **ProjectCard**: Project summary with status badge
- **AnalysisCard**: Analysis run summary with issue counts
- **IssueList**: Paginated issue list with severity icons
- **TrendChart**: Line/bar charts for metrics over time
- **PlanCard**: Plan comparison cards with feature lists
- **UpgradeModal**: Stripe checkout integration
- **LoadingSpinner**: Consistent loading states
- **ErrorBoundary**: Graceful error handling

#### Privacy & Security
- **No Source Code Storage**: Only metadata (issue counts, file paths)
- **Encrypted API Keys**: AES-256 encryption at rest
- **Rate Limiting**: Per-plan limits enforced server-side
- **CORS Protection**: Strict origin validation
- **CSRF Protection**: NextAuth.js built-in protection
- **SQL Injection Prevention**: Prisma ORM parameterized queries
- **XSS Prevention**: React automatic escaping

#### Telemetry (PostHog)
- **Anonymous Usage Stats**: Page views, button clicks, analysis runs
- **Feature Flags**: Gradual rollout of new features
- **A/B Testing**: Optimize upgrade flow conversion
- **Funnel Analysis**: Track sign-up → trial → paid conversion
- **Opt-Out**: `NEXT_PUBLIC_POSTHOG_ENABLED=false`

### Features by Plan

#### FREE Plan (Local + Limited Cloud)
- 1 project, 100 files, 5 analyses/day
- 6 core detectors
- 7-day analysis history retention
- Community support (Discord)

#### PRO Plan ($29/mo or $278/year)
- 10 projects, 1000 files, 100 analyses/day
- 11 detectors (+Performance, Complexity, Circular, Build, Network)
- 90-day analysis history retention
- Cloud dashboard with trends
- Email support (24-hour response)
- Priority inbox (ML-ranked issues)
- ROI calculator

#### TEAM Plan ($99/mo or $950/year)
- 50 projects, 5000 files, 500 analyses/day
- 14 detectors (+Database, Infrastructure, CI/CD)
- 1-year analysis history retention
- Team collaboration (up to 20 users)
- RBAC and permissions
- Slack/email alerts
- Custom detectors
- Priority support (4-hour response)

#### ENTERPRISE Plan (Custom Pricing)
- Unlimited projects, files, analyses
- 16 detectors (all + custom)
- Unlimited history retention
- SSO (SAML, LDAP)
- Audit logs
- On-premise deployment option
- White-label
- Dedicated CSM
- 99.9% SLA
- 1-hour critical response

### Performance
- **Page Load**: <2 seconds to First Contentful Paint (FCP)
- **Dashboard Query**: <500ms for project list (indexed queries)
- **Analysis API**: <30s for 1000 files (parallel detector execution)
- **Streaming**: Real-time analysis progress via SSE (coming in v1.1)

### Deployment
- **Vercel**: One-click deployment with environment variables
- **Docker**: Production Dockerfile with multi-stage build
- **AWS/GCP**: ECS/Cloud Run support with load balancing
- **Database**: PostgreSQL 14+ (managed or self-hosted)
- **Redis**: Optional caching layer for rate limiting

### Dependencies
- `next@15.0.0` - React framework with App Router
- `react@18.2.0` - UI library
- `prisma@5.7.0` - ORM for PostgreSQL
- `next-auth@4.24.0` - Authentication
- `stripe@14.0.0` - Payments
- `@odavl-studio/insight-core@1.0.0` - Analysis engine
- `tailwindcss@3.4.0` - Styling
- `posthog-js@1.96.0` - Telemetry

### Environment Variables
```bash
# Required
DATABASE_URL=postgresql://...
NEXTAUTH_URL=https://cloud.odavl.studio
NEXTAUTH_SECRET=<generate-with-openssl-rand-base64-32>
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

# OAuth
GITHUB_ID=<github-oauth-client-id>
GITHUB_SECRET=<github-oauth-client-secret>
GOOGLE_CLIENT_ID=<google-oauth-client-id>
GOOGLE_CLIENT_SECRET=<google-oauth-client-secret>

# Optional
NEXT_PUBLIC_POSTHOG_KEY=<posthog-project-key>
SENTRY_DSN=<sentry-dsn>
REDIS_URL=redis://...
```

### Breaking Changes
- N/A (first release)

### Known Issues
- **Large Projects**: Projects with >10K files may timeout (chunking coming in v1.1)
- **Safari iOS**: OAuth redirect may fail (workaround: use Chrome/Firefox)
- **Slow Queries**: Trend charts may be slow for >1 year history (pagination coming)

### Migration Guide
- N/A (first release)

---

## [Unreleased]

### Planned for v1.1
- [ ] Streaming analysis results (SSE)
- [ ] Real-time collaboration (WebSockets)
- [ ] Custom detector upload UI
- [ ] GraphQL API
- [ ] Mobile app (React Native)
- [ ] Slack bot integration
- [ ] Jira/Linear issue sync

---

## Version History

- **1.0.0** (2025-12-12) - Initial production release

---

For more details, see the [full documentation](https://docs.odavl.studio/insight-cloud).
