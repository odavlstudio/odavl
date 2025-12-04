# Sentry Configuration Guide for ODAVL Studio

This directory contains Sentry configuration files for production-grade error tracking across all ODAVL products.

## 📁 Files

- `sentry.client.config.ts` - Browser-side error tracking (Insight Cloud)
- `sentry.server.config.ts` - Server-side error tracking (Next.js API routes)
- `sentry.edge.config.ts` - Edge runtime tracking (middleware, edge routes)

## 🚀 Setup Instructions

### 1. Install Sentry SDK

```bash
# For Next.js projects (Insight Cloud, Guardian App, Studio Hub)
cd odavl-studio/insight/cloud
pnpm add @sentry/nextjs

# For CLI (Node.js)
cd apps/studio-cli
pnpm add @sentry/node
```

### 2. Configure Environment Variables

Add to `.env.local` (development) and Vercel environment variables (production):

```bash
# Required
SENTRY_DSN=https://your-dsn@sentry.io/project-id
SENTRY_ORG=your-org-name
SENTRY_PROJECT=odavl-insight-cloud

# Optional
NEXT_PUBLIC_SENTRY_DSN=https://your-dsn@sentry.io/project-id
NEXT_PUBLIC_RELEASE_VERSION=v2.0.0
SENTRY_AUTH_TOKEN=your-auth-token
```

### 3. Configure next.config.js

Add Sentry webpack plugin for source map upload:

```javascript
const { withSentryConfig } = require('@sentry/nextjs');

const nextConfig = {
  // ... your existing config
};

module.exports = withSentryConfig(
  nextConfig,
  {
    // Sentry webpack plugin options
    silent: true,
    org: process.env.SENTRY_ORG,
    project: process.env.SENTRY_PROJECT,
  },
  {
    // Sentry SDK options
    widenClientFileUpload: true,
    transpileClientSDK: true,
    tunnelRoute: "/monitoring",
    hideSourceMaps: true,
    disableLogger: true,
  }
);
```

### 4. Test Configuration

```bash
# Run in development
pnpm dev

# Trigger test error
# Add to any page:
<button onClick={() => { throw new Error("Sentry Test Error"); }}>
  Test Sentry
</button>
```

## 📊 Monitoring Dashboard

After setup, monitor errors at:
- **Insight Cloud:** https://sentry.io/organizations/YOUR_ORG/projects/odavl-insight-cloud/
- **Guardian App:** https://sentry.io/organizations/YOUR_ORG/projects/odavl-guardian-app/
- **Studio Hub:** https://sentry.io/organizations/YOUR_ORG/projects/odavl-studio-hub/

## 🔧 Configuration Options

### Sample Rates
- **Production:**
  - Error tracking: 100% (all errors captured)
  - Performance: 10% (1 in 10 transactions)
  - Session Replay: 10% (1 in 10 sessions)
  - Error Replay: 100% (all error sessions)

- **Development:**
  - All: 100% (full debugging)

### Filtered Errors
The configuration automatically filters:
- Browser extension errors
- Network errors (often not actionable)
- Localhost errors in production
- Cancelled requests (AbortError)

### Privacy Settings
- IP addresses: Auto-detected
- Sensitive headers: Removed (authorization, cookie)
- Text masking: Disabled (enable if needed)
- Media blocking: Disabled (enable if needed)

## 🚀 CI/CD Integration

The `.github/workflows/sentry-release.yml` workflow automatically:
1. Creates Sentry releases on version tags
2. Uploads source maps for all projects
3. Associates commits with releases
4. Marks releases as deployed to production

## 📈 Best Practices

### 1. Custom Error Boundaries
```typescript
import { Sentry } from './sentry.client.config';

class ErrorBoundary extends React.Component {
  componentDidCatch(error, errorInfo) {
    Sentry.captureException(error, { contexts: { react: errorInfo } });
  }
}
```

### 2. Performance Monitoring
```typescript
import { Sentry } from './sentry.client.config';

const transaction = Sentry.startTransaction({
  op: "function",
  name: "processData",
});

try {
  await processData();
} finally {
  transaction.finish();
}
```

### 3. User Context
```typescript
Sentry.setUser({
  id: user.id,
  email: user.email,
  username: user.username,
});
```

### 4. Custom Tags
```typescript
Sentry.setTag("detector_type", "typescript");
Sentry.setTag("language", "typescript");
```

## 🔍 Troubleshooting

### Source maps not uploading
1. Verify `SENTRY_AUTH_TOKEN` is set
2. Check `sentry-cli` is installed: `pnpm add -D @sentry/cli`
3. Run manually: `sentry-cli releases files <version> upload-sourcemaps .next`

### Errors not appearing in Sentry
1. Check `SENTRY_DSN` is correct
2. Verify environment is set (production/development)
3. Test with: `Sentry.captureException(new Error("Test"));`

### High volume alerts
1. Adjust sample rates in config
2. Add more ignored errors
3. Use `beforeSend` to filter

## 📚 Resources

- [Sentry Next.js Docs](https://docs.sentry.io/platforms/javascript/guides/nextjs/)
- [Sentry Performance](https://docs.sentry.io/platforms/javascript/performance/)
- [Session Replay](https://docs.sentry.io/platforms/javascript/session-replay/)
- [Source Maps](https://docs.sentry.io/platforms/javascript/sourcemaps/)

## 🎯 Success Metrics

Track these in Sentry dashboard:
- **Error Rate:** < 0.1% of total requests
- **MTTR (Mean Time To Resolution):** < 24 hours
- **Response Time (P95):** < 500ms
- **Crash-Free Sessions:** > 99.9%

---

**Last Updated:** 2025-01-09  
**ODAVL Studio v2.0** - Production-Grade Error Tracking
