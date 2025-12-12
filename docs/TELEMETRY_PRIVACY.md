# ODAVL Insight Telemetry & Privacy

**Last Updated**: December 11, 2025  
**Version**: 2.0

---

## Overview

ODAVL Insight collects **anonymous usage data** to help improve the product. We take your privacy seriously and follow these principles:

✅ **What We Collect**: Usage patterns, error rates, feature adoption  
❌ **What We DON'T Collect**: Your code, file names, or any sensitive information  
🔒 **Privacy-First**: Hashed user IDs, aggregated metrics, opt-out anytime

---

## What Data We Collect

### 1. **Usage Patterns**
- Analysis counts (local vs cloud)
- Detectors enabled/disabled
- Commands run (analyze, login, plans)
- File counts (aggregated into privacy-preserving buckets)

### 2. **Error Rates**
- Analysis failures (no error details)
- Detector crashes (no code content)
- Performance metrics (duration, memory)

### 3. **Feature Adoption**
- Which detectors are most used
- Cloud vs local analysis preference
- Export formats (JSON, SARIF, Problems Panel)

### 4. **Conversion Metrics**
- Trial activations
- Upgrade prompts shown/clicked
- Plan upgrades (FREE → PRO → TEAM → ENTERPRISE)

---

## What We DON'T Collect

❌ **Your Source Code**: Never collected, never logged, never transmitted  
❌ **File Names**: Only aggregated counts (e.g., "100-500 files")  
❌ **File Paths**: Privacy-preserving buckets instead of exact paths  
❌ **Error Messages**: Only error counts, not actual error text  
❌ **Environment Variables**: Never logged  
❌ **API Keys**: Never logged  
❌ **Sensitive Data**: No PII, credentials, or secrets

---

## Privacy Safeguards

### 1. **Anonymous User IDs**
```typescript
// Your email is hashed with SHA-256
const userId = InsightTelemetryClient.hashUserId('user@example.com');
// → 'abc123...' (first 16 characters of hash)
```

**Result**: We can track usage patterns without knowing who you are.

### 2. **File Count Bucketing**
```typescript
// Exact file count: 150 files
// Telemetry records: "100-500 files" (privacy-preserving bucket)
InsightTelemetryClient.binFileCount(150)
// → '100-500'
```

**Result**: We can see project size trends without exact numbers.

### 3. **No Code Content**
```typescript
// All telemetry properties are sanitized
const sanitized = sanitizeProperties({
  code: 'const x = 42;',       // ❌ Removed
  content: 'import React',     // ❌ Removed
  issuesFound: 5,              // ✅ Kept (metadata)
  durationMs: 1200,            // ✅ Kept (performance)
});
// → { issuesFound: 5, durationMs: 1200 }
```

**Result**: Only metadata is collected, never code.

### 4. **Local Logging**
- All telemetry events are logged locally in `.odavl/logs/odavl.log`
- You can review what's being sent before it's transmitted
- Even if remote endpoint fails, local logs are always written

---

## How to Opt-Out

### CLI (Command-Line)

**Check Current Setting**:
```bash
odavl config get telemetry.enabled
```

**Disable Telemetry**:
```bash
odavl config set telemetry.enabled false
```

**Re-Enable Telemetry**:
```bash
odavl config set telemetry.enabled true
```

**Config Location**: `~/.odavlrc.json`

---

### VS Code Extension

**Method 1: Settings UI**
1. Open VS Code Settings (`Ctrl+,` or `Cmd+,`)
2. Search for "ODAVL Telemetry"
3. Uncheck "Telemetry: Enabled"

**Method 2: Settings JSON**
```json
{
  "odavl.telemetry.enabled": false
}
```

**Method 3: Workspace Settings**
```json
// .vscode/settings.json
{
  "odavl.telemetry.enabled": false
}
```

---

### Cloud Console

**Dashboard Method**:
1. Sign in to [cloud.odavl.studio](https://cloud.odavl.studio)
2. Go to Profile → Privacy Settings
3. Toggle "Anonymous Usage Data" to OFF

**API Method**:
```bash
curl -X PATCH https://cloud.odavl.studio/api/user/settings \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -d '{"telemetryEnabled": false}'
```

---

### Environment Variable (All Platforms)

**Disable Telemetry Globally**:
```bash
# Linux/macOS
export ODAVL_TELEMETRY_ENABLED=false

# Windows PowerShell
$env:ODAVL_TELEMETRY_ENABLED = "false"

# Windows CMD
set ODAVL_TELEMETRY_ENABLED=false
```

**Note**: Environment variable takes precedence over config files.

---

## Telemetry Events

### Event Schema

All events follow this structure:
```typescript
{
  type: 'insight.analysis_started',  // Event type
  userId: 'abc123...',                // Hashed email (anonymous)
  sessionId: '1702339800000-xyz',     // Session tracking
  planId: 'INSIGHT_PRO',              // Current plan
  isTrial: true,                      // Trial status
  source: 'cli',                      // cli | cloud | vscode
  timestamp: '2025-12-11T23:30:00Z',  // ISO 8601
  properties: {
    mode: 'local',                    // Event-specific properties
    detectors: ['typescript', 'security'],
    fileCountBucket: '100-500',       // Privacy bucket
  }
}
```

### Event Types (20+)

#### Analysis Events
- `insight.analysis_started` - Analysis begins
- `insight.analysis_completed` - Analysis finishes
- `insight.cloud_analysis_started` - Cloud analysis begins
- `insight.cloud_analysis_completed` - Cloud analysis finishes

#### CLI Events
- `insight.cli_scan_triggered` - User runs `odavl insight analyze`
- `insight.cli_login` - User logs in via CLI
- `insight.cli_logout` - User logs out
- `insight.cli_plan_viewed` - User runs `odavl insight plans`

#### Extension Events
- `insight.extension_scan_triggered` - User triggers scan in VS Code
- `insight.extension_issue_clicked` - User clicks issue in Problems Panel
- `insight.sign_in` - User authenticates in extension
- `insight.cloud_run_triggered` - User runs cloud analysis from extension

#### Limit Events
- `insight.limit_hit` - User hits plan limit
- `insight.upgrade_prompt_shown` - Upgrade CTA displayed
- `insight.upgrade_prompt_clicked` - User clicks upgrade CTA

#### User Lifecycle
- `insight.user_signed_up` - New user registration
- `insight.trial_started` - Trial activation
- `insight.trial_expired` - Trial expiration
- `insight.plan_upgraded` - User upgrades plan
- `insight.plan_downgraded` - User downgrades plan

#### Project Events
- `insight.project_created` - New project created
- `insight.project_deleted` - Project deleted

---

## Data Retention

- **Raw Events**: 90 days
- **Aggregated Metrics**: 2 years
- **User Data**: Deleted upon account deletion

---

## Third-Party Analytics

ODAVL Insight may integrate with third-party analytics providers:

- **PostHog** (self-hosted): Product analytics
- **Sentry**: Error monitoring (errors only, no code)
- **Cloudflare Analytics**: CDN and performance metrics

**Note**: Even with third-party integrations, the same privacy safeguards apply.

---

## GDPR Compliance

ODAVL Insight is **GDPR-compliant**:

✅ **Right to Access**: Request your telemetry data via support  
✅ **Right to Erasure**: Delete your account and all data  
✅ **Right to Portability**: Export your telemetry data (JSON)  
✅ **Right to Opt-Out**: Disable telemetry anytime  
✅ **Data Minimization**: Only collect what's necessary  
✅ **Anonymization**: Hashed user IDs, no PII

---

## Contact & Support

**Privacy Questions**: privacy@odavl.studio  
**Data Request**: support@odavl.studio  
**Opt-Out Help**: [Documentation](https://docs.odavl.com/telemetry)  
**Status Page**: [status.odavl.studio](https://status.odavl.studio)

---

## Changelog

**v2.0** (2025-12-11): Initial telemetry implementation  
- 20+ event types  
- Privacy-first architecture  
- Opt-out support (CLI, Extension, Cloud)  
- GDPR-compliant data handling

---

## Learn More

- [Privacy Policy](https://odavl.studio/privacy)
- [Terms of Service](https://odavl.studio/terms)
- [Security Practices](https://odavl.studio/security)
- [Open Source Licenses](https://github.com/odavl-studio/odavl/blob/main/LICENSE)
