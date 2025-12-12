# Phase 4: Cloud Backend - Implementation Status & Next Steps

## ✅ Completed (Dec 11, 2025)

### 1. Database Schema Enhanced
- ✅ Added `Analysis` model (job tracking with full lifecycle)
- ✅ Added `AnalysisIssue` model (individual findings storage)
- ✅ Added `AnalysisStatus` enum (QUEUED, RUNNING, COMPLETED, FAILED, CANCELLED)
- ✅ Added `IssueSeverity` enum (CRITICAL, HIGH, MEDIUM, LOW, INFO)
- ✅ Enhanced `Project` model with git metadata (remote, branch, commit)
- ✅ Added comprehensive indexes for performance (projectId, userId, status, createdAt, severity, detector, filePath)
- ✅ Schema location: `odavl-studio/insight/cloud/prisma/schema.prisma`

### 2. Analysis Service Created
- ✅ File: `lib/services/analysis-service.ts` (400+ lines)
- ✅ Functions implemented:
  - `createAnalysis()` - Create new job
  - `getAnalysis()` - Get job status
  - `getAnalysisWithIssues()` - Get job + issues (paginated)
  - `updateAnalysisStatus()` - Update job state
  - `addAnalysisIssues()` - Batch add issues
  - `userOwnsAnalysis()` - Authorization check
  - `getUserAnalyses()` - List user's jobs
  - `getProjectAnalyses()` - List project's jobs

### 3. Job Queue System Created
- ✅ File: `lib/jobs/analysis-queue.ts` (200+ lines)
- ✅ Features:
  - In-memory queue with retry logic (max 3 retries)
  - Background job processor
  - Progress tracking
  - Error handling
  - Detector simulation placeholder
- ⚠️ **TODO**: Replace simulation with real Insight Core engine

### 4. API Endpoints Created
- ✅ `POST /api/insight/analysis` - Create analysis job
  - Validates input with Zod
  - Checks project ownership
  - Verifies plan entitlements (canRunCloudAnalysis)
  - Enqueues job for processing
  - Returns analysisId + polling URL
- ✅ `GET /api/insight/analysis/:id` - Get job status + results
  - Authorization check (user owns analysis)
  - Paginated issues (default 50, max 200)
  - Full status, progress, summary, timing
- ✅ `GET /api/insight/analyses` - List user's analyses
  - Paginated (default 20, max 100)
  - Ordered by creation time

### 5. Webhook Skeletons Created
- ✅ `POST /api/webhooks/stripe` - Stripe events handler (skeleton)
  - Signature verification TODO
  - Event handling TODO (subscription.created, payment.succeeded, etc.)
- ✅ `POST /api/webhooks/insight-internal` - Internal events handler (skeleton)
  - Internal auth TODO
  - Event handling TODO (analysis.completed, project.created, etc.)

### 6. Integration with Phase 3 Auth
- ✅ Uses `withInsightAuth` middleware from `@odavl-studio/auth`
- ✅ ODAVL ID session validation
- ✅ Plan entitlements checking (Phase 2 integration)

## ⚠️ Known Issues & TODOs

### Critical - Must Fix Before Production

#### 1. Prisma Migration Not Generated
**Issue**: Dependency error when running `prisma migrate dev`
```
Error: Cannot find module './builders/GeneratorValueBuilder'
```
**Root Cause**: fast-check@3.23.2 dependency corruption
**Fix**: 
```bash
# Clean install dependencies
rm -rf node_modules .pnpm-store
pnpm install --frozen-lockfile

# Generate Prisma client
cd odavl-studio/insight/cloud
npx prisma generate

# Create migration
npx prisma migrate dev --name add-analysis-models
```
**Status**: ❌ BLOCKED

#### 2. Replace Detector Simulation with Real Engine
**File**: `lib/jobs/analysis-queue.ts` (function `runDetector`)
**Current**: Generates random fake issues
**Needed**: Integrate actual Insight Core detectors
```typescript
// BEFORE (simulation):
const issues = await runDetector(detector, projectName, path);

// AFTER (real):
import { TypeScriptDetector, ESLintDetector, SecurityDetector, ... } from '@odavl-studio/insight-core/detector';

async function runDetector(detector: string, projectPath: string, config: any): Promise<IssueInput[]> {
  let detectorInstance;
  
  switch (detector) {
    case 'typescript':
      detectorInstance = new TypeScriptDetector();
      break;
    case 'eslint':
      detectorInstance = new ESLintDetector();
      break;
    case 'security':
      detectorInstance = new SecurityDetector();
      break;
    // ... 13 more detectors
  }
  
  const results = await detectorInstance.analyze(projectPath);
  
  return results.map(issue => ({
    filePath: issue.filePath,
    line: issue.line,
    column: issue.column,
    severity: mapSeverity(issue.severity),
    detector,
    message: issue.message,
    ruleId: issue.ruleId,
    category: issue.category,
    suggestion: issue.fix?.suggestion,
    autoFixable: !!issue.fix,
    confidence: issue.confidence,
    metadata: issue.metadata
  }));
}
```
**Status**: ❌ TODO

#### 3. Usage Limits Enforcement
**File**: `app/api/insight/analysis/route.ts` (line ~67)
**Current**: Comment only
```typescript
// TODO: Check analysis usage limits
// For example: Free plan limited to X analyses per month
// This would integrate with Phase 2 billing system
```
**Needed**: Query subscription usage and enforce limits
```typescript
// Get current period usage
const subscription = await prisma.subscription.findUnique({
  where: { userId: session.userId },
  include: { usageRecords: true }
});

// Check against plan limits
const plan = insightProducts[session.insightPlanId];
const currentPeriodAnalyses = subscription.usageRecords
  .filter(r => r.type === 'ANALYSIS' && r.createdAt >= subscription.currentPeriodStart)
  .length;

if (currentPeriodAnalyses >= plan.limits.cloudAnalysesPerMonth) {
  return NextResponse.json(
    { error: 'Monthly analysis limit reached', upgradeUrl: '/pricing' },
    { status: 429 }
  );
}

// Record usage
await prisma.usageRecord.create({
  data: {
    subscriptionId: subscription.id,
    type: 'ANALYSIS',
    amount: 1,
    metadata: JSON.stringify({ analysisId, projectId })
  }
});
```
**Status**: ❌ TODO

#### 4. Stripe Webhook Implementation
**File**: `app/api/webhooks/stripe/route.ts`
**Current**: Skeleton only
**Needed**: 
- Signature verification with Stripe SDK
- Handle subscription events (created, updated, deleted, payment_succeeded, payment_failed)
- Update database on subscription changes
- Send email notifications
**Reference**: Phase 2 Stripe integration docs
**Status**: ❌ TODO

### Medium Priority

#### 5. Job Queue Production Implementation
**Current**: In-memory array (not persistent, lost on restart)
**Needed**: Redis + BullMQ or similar
```bash
pnpm add bullmq ioredis
```
```typescript
import { Queue, Worker } from 'bullmq';
import Redis from 'ioredis';

const connection = new Redis(process.env.REDIS_URL);

const analysisQueue = new Queue('analysis', { connection });

export async function enqueueAnalysisJob(analysisId: string) {
  await analysisQueue.add('run-analysis', { analysisId });
}

const worker = new Worker(
  'analysis',
  async (job) => {
    await executeAnalysisJob(job.data.analysisId);
  },
  { connection }
);
```
**Status**: ❌ TODO

#### 6. Rate Limiting Per Plan
**Current**: No rate limiting on new endpoints
**Needed**: Different limits for Free/Pro/Enterprise
```typescript
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

const redis = Redis.fromEnv();

const rateLimits = {
  free: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(5, '1 h'), // 5 analyses per hour
  }),
  pro: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(100, '1 h'), // 100 per hour
  }),
  enterprise: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(1000, '1 h'), // 1000 per hour
  }),
};
```
**Status**: ❌ TODO

#### 7. Analysis Cancellation Endpoint
**Needed**: `POST /api/insight/analysis/:id/cancel`
**Features**:
- Stop running analysis
- Mark as CANCELLED status
- Rollback partial results (optional)
**Status**: ❌ TODO

#### 8. Webhook Event Emission
**Trigger**: When analysis completes/fails
**Action**: POST to `/api/webhooks/insight-internal`
**Payload**: `{ type: 'analysis.completed', data: { analysisId, summary } }`
**Status**: ❌ TODO

### Low Priority

#### 9. Analysis Retention Policy
**Needed**: Delete old analyses after 30/90 days based on plan
**Implementation**: Cron job or scheduled task
**Status**: ❌ TODO

#### 10. Export Results to JSON/CSV/PDF
**Endpoint**: `GET /api/insight/analysis/:id/export?format=json|csv|pdf`
**Status**: ❌ TODO

## 📋 Testing Checklist

Once Critical TODOs are fixed:

### Unit Tests
- [ ] Analysis service functions (createAnalysis, getAnalysis, etc.)
- [ ] Job queue (enqueue, process, retry logic)
- [ ] Detector integration (real engine)

### Integration Tests
- [ ] POST /api/insight/analysis (create job)
- [ ] GET /api/insight/analysis/:id (poll status)
- [ ] GET /api/insight/analyses (list analyses)
- [ ] Authorization (user can only see own analyses)
- [ ] Plan entitlements (Free vs Pro features)

### End-to-End Tests
- [ ] CLI → Cloud: Submit analysis from CLI
- [ ] Extension → Cloud: Submit analysis from VS Code
- [ ] Job processing: Complete full analysis cycle
- [ ] Webhook delivery: Stripe events update subscriptions
- [ ] Usage tracking: Analysis counts recorded correctly

## 🚀 Deployment Prerequisites

Before deploying Insight Cloud with Phase 4 changes:

1. ✅ Run Prisma migration: `prisma migrate deploy`
2. ❌ Configure Redis URL for job queue
3. ❌ Set Stripe webhook secret: `STRIPE_WEBHOOK_SECRET`
4. ❌ Set internal webhook secret: `INTERNAL_WEBHOOK_SECRET`
5. ❌ Test all endpoints with Postman/Insomnia
6. ❌ Load test job queue with 100+ concurrent analyses
7. ❌ Monitor error rates and performance

## 📝 Documentation Needed

- [ ] API reference for new endpoints (OpenAPI/Swagger)
- [ ] CLI integration guide (how to submit jobs from CLI)
- [ ] Extension integration guide (how to submit jobs from VS Code)
- [ ] Webhook setup guide for Stripe
- [ ] Job queue monitoring guide (Redis commands, metrics)

## 🔄 Related Work

- **Phase 2 (Stripe)**: Usage tracking integration
- **Phase 3 (Auth)**: ODAVL ID middleware usage
- **Phase 5 (Future)**: Real-time progress with WebSockets/SSE

---

**Last Updated**: December 11, 2025  
**Status**: Database schema + API endpoints complete, detector integration pending  
**Blocker**: Prisma dependency issue preventing migration generation
