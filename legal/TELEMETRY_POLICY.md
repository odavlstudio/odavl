# ODAVL Studio Telemetry Policy

**Effective Date:** January 1, 2025  
**Last Updated:** January 9, 2025

## Overview

This document provides detailed information about telemetry and data collection practices in ODAVL Studio. Our approach prioritizes user privacy and transparency while enabling continuous product improvement.

## Core Principles

### Opt-in by Default

All telemetry collection is **disabled by default**. Users must explicitly enable data collection through:

- CLI configuration commands
- VS Code extension settings
- Website analytics preferences

### Minimal Data Collection

We collect only the minimum data necessary for:

- Service functionality and reliability
- Product improvement and optimization
- Security monitoring and threat detection

### Local-First Processing

Quality metrics and reports are stored locally whenever possible:

- CLI reports: `reports/` directory in your project
- Learning data: `.odavl/history.json` and `.odavl/recipes-trust.json`
- Configuration: `.odavl/config.yml`, `.odavl/gates.yml`, `.odavl/policy.yml`

## Data Collection Categories

### 1. Essential Service Data

**Collection Status:** Always collected (required for functionality)

**CLI Metrics (Local Only):**

- ESLint warning/error counts
- TypeScript error counts
- Quality improvement deltas
- Recipe execution success rates

**Storage:** Local files only, never transmitted

### 2. Optional Usage Analytics

**Collection Status:** Opt-in only, disabled by default

**CLI Usage Data:**

- Command execution frequency
- Feature usage patterns
- Error occurrence rates
- Performance timing data

**VS Code Extension Data:**

- UI interaction patterns
- Configuration preferences
- Feature adoption rates
- Error and crash reports

**Collection Method:**

```bash
# Check current telemetry status
pnpm odavl:config telemetry --status

# Enable basic telemetry (errors only)
pnpm odavl:config telemetry --enable-basic

# Enable full telemetry (usage + errors)
pnpm odavl:config telemetry --enable-full

# Disable all telemetry (default)
pnpm odavl:config telemetry --disable
```

### 3. Website Analytics

**Collection Status:** Anonymized, cookie-free

**Plausible.io Integration:**

- Page views and session duration
- Referrer sources and geographic regions
- Device types and browser information
- No personal identifiers or tracking cookies

**Opt-out Method:**

- Browser "Do Not Track" setting respected
- JavaScript blocking disables analytics
- No impact on site functionality

### 4. Security Monitoring

**Collection Status:** Always active (required for security)

**Threat Detection:**

- Authentication attempt patterns
- Rate limiting violations
- Suspicious API usage patterns
- Security header compliance

**Data Retention:** 90 days maximum for security logs

## Telemetry Configuration

### CLI Configuration

The ODAVL CLI stores telemetry preferences in `.odavl/config.yml`:

```yaml
telemetry:
  enabled: false          # Master switch (default: false)
  crashReports: false     # Error reporting (default: false)
  usageMetrics: false     # Usage analytics (default: false)
  performanceData: false  # Performance metrics (default: false)
```

### VS Code Extension Settings

Configure telemetry through VS Code settings:

```json
{
  "odavl.telemetry.enabled": false,
  "odavl.telemetry.crashReports": false,
  "odavl.telemetry.usageMetrics": false,
  "odavl.telemetry.performanceData": false
}
```

### Enterprise Configuration

Enterprise customers can centrally manage telemetry policies:

```yaml
# .odavl/enterprise-policy.yml
telemetry:
  organizationDefault: "disabled"
  allowUserOverride: true
  requiredReporting: ["security", "compliance"]
  dataResidency: "us-east-1"
```

## Data Processing and Transmission

### Data Anonymization

When telemetry is enabled, all data is anonymized:

- **No source code content** is ever collected or transmitted
- **No file paths** that might contain sensitive information
- **No environment variables** or configuration secrets
- **No personal identifiers** beyond aggregate usage patterns

### Transmission Security

All telemetry data transmission uses:

- **TLS 1.3 encryption** for data in transit
- **Certificate pinning** to prevent man-in-the-middle attacks
- **Request signing** to ensure data integrity
- **Rate limiting** to prevent data exfiltration

### Data Aggregation

Individual telemetry events are aggregated before analysis:

- **Minimum cohort size** of 100 users for any reported statistic
- **Differential privacy** techniques to prevent re-identification
- **Statistical noise** added to protect individual usage patterns

## User Rights and Controls

### Real-time Control

Users maintain full control over telemetry at all times:

```bash
# View all collected data (local files only)
pnpm odavl:telemetry --export

# Delete all local telemetry data
pnpm odavl:telemetry --clear

# Check data transmission status
pnpm odavl:telemetry --status --verbose
```

### Data Portability

Users can export all telemetry data in machine-readable formats:

- JSON format for programmatic access
- CSV format for spreadsheet analysis
- Human-readable reports for transparency

### Data Deletion

Users can request deletion of all transmitted telemetry data:

- **Self-service deletion** through account dashboard
- **Email request** to privacy@odavl.studio
- **Automatic deletion** upon account closure

## Enterprise Telemetry

### Enhanced Controls

Enterprise customers receive additional telemetry controls:

**Centralized Management:**

- Organization-wide telemetry policies
- Role-based access to telemetry data
- Custom data retention periods
- On-premise telemetry aggregation

**Compliance Features:**

- **GDPR compliance** mode for EU operations
- **Data residency** options for sensitive environments
- **Audit logging** for all telemetry configuration changes
- **Legal hold** capabilities for litigation support

### Data Processing Agreements

Enterprise customers can execute Data Processing Agreements (DPAs) that specify:

- Permitted data processing activities
- Data retention and deletion schedules
- Security and encryption requirements
- Incident notification procedures

## Transparency and Accountability

### Open Source Telemetry

Key telemetry components are open source:

- **Data collection libraries** available on GitHub
- **Anonymization algorithms** publicly auditable
- **Transmission protocols** documented and reviewable

### Regular Audits

We conduct regular audits of our telemetry practices:

- **Quarterly internal reviews** of data collection practices
- **Annual third-party audits** by independent security firms
- **Continuous monitoring** of data access and usage patterns

### Breach Notification

In the event of a telemetry data breach:

- **Immediate notification** to affected users within 24 hours
- **Detailed incident reports** published within 72 hours
- **Remediation steps** provided with timeline for resolution

## Contact and Support

**Telemetry Questions:**

- Email: telemetry@odavl.studio
- Documentation: https://docs.odavl.studio/telemetry

**Privacy Concerns:**

- Email: privacy@odavl.studio
- Data Protection Officer: dpo@odavl.studio

**Enterprise Support:**

- Email: enterprise@odavl.studio
- Phone: +1 (555) 123-ODAVL

---

*This Telemetry Policy is part of the ODAVL Studio Privacy Policy and requires professional legal review before production deployment.*
