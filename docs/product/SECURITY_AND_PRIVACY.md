# ODAVL Insight: Security & Privacy

**Version**: 1.0.0  
**Last Updated**: December 2025  
**Applies To**: ODAVL Insight (Cloud & Local)

---

## Security Philosophy

ODAVL Insight is built on three foundational security principles:

**Security-by-Design**: Security is not an afterthought. Every architectural decision prioritizes data protection and user privacy. Local-first analysis means your source code never enters our infrastructure unless you explicitly enable specific features. Authentication, encryption, and audit logging are core components, not optional add-ons.

**Least-Privilege Principle**: Components access only the data required for their function. The analysis engine reads source files but cannot make network requests. The cloud upload process receives sanitized metadata, never raw source code. User access follows plan-based authorization—FREE tier users cannot access TEAM tier collaboration features without explicit upgrade.

**Defense in Depth**: Multiple security layers protect your data. Local analysis runs in isolation. Network communication uses TLS 1.3. Authentication employs JWT tokens with short expiration windows. Database credentials are never exposed to client applications. This layered approach ensures that compromise of any single component does not expose your entire codebase.

---

## Data Boundaries

### What Data NEVER Leaves Your Machine

The following data remains strictly local during analysis:

- **Source code content** (except when explicit snippet sharing is enabled for specific security detectors)
- **Environment variables** and system configuration
- **Absolute file paths** (converted to project-relative paths before any upload)
- **Developer names** and email addresses from Git metadata
- **Commit messages** and version control history
- **Internal network topology** (IP addresses, hostnames, internal URLs)
- **Authentication tokens** and API keys found in code (flagged but never uploaded)

These guarantees hold regardless of tier (FREE, PRO, TEAM, ENTERPRISE). Local analysis with the CLI or VS Code extension functions entirely offline without network access.

### What Data MAY Be Uploaded (Optional)

When you choose to sync analysis results to the cloud dashboard:

- **Project-relative file paths** (e.g., `src/utils/helper.ts`, not `/home/user/project/src/utils/helper.ts`)
- **Error counts by category** (TypeScript errors: 12, security issues: 3, complexity warnings: 8)
- **Metric summaries** (total lines of code, cyclomatic complexity, file counts)
- **Issue metadata** (line numbers, error types, severity levels)
- **Timestamps** and analysis duration
- **Detector configuration** (which detectors were enabled/disabled)

Cloud upload is always initiated by the user through explicit CLI commands (`--upload` flag) or VS Code extension settings. No background telemetry or automatic uploads occur.

### Clear Distinction: Local vs Cloud

**Local Mode** (default): Analysis runs entirely on your machine. Results stored in `.odavl/` directory. No authentication required. No network activity. Suitable for air-gapped environments and sensitive codebases.

**Cloud Mode** (optional): After local analysis completes, sanitized results upload to PostgreSQL database hosted in EU datacenters (Germany/Amsterdam by default). Enables historical trend tracking, team dashboards, and quality gate enforcement. Requires JWT authentication.

You control the boundary. Analysis always happens locally first. Cloud sync is an explicit, auditable action.

---

## Privacy Sanitization

### Path Sanitization

All file paths undergo sanitization before upload:

1. **Absolute Path Removal**: `/Users/developer/projects/acme-corp/src/app.ts` becomes `src/app.ts`
2. **Home Directory Stripping**: References to `~` or `$HOME` converted to project-relative paths
3. **Drive Letter Removal** (Windows): `C:\Projects\acme\app.ts` becomes `app.ts`
4. **Symbolic Link Resolution**: Symlinks resolved to canonical paths within project boundary

This ensures uploaded data contains no identifying information about your filesystem layout, username, or organizational directory structure.

### Variable & Identifier Stripping

Error messages and warnings are processed to remove sensitive identifiers:

- **Variable names with secrets**: `password`, `apiKey`, `token` replaced with generic placeholders
- **Credentials in URLs**: `https://user:pass@example.com` becomes `https://***:***@example.com`
- **API endpoints**: Internal hostnames stripped, only relative paths retained
- **Email addresses**: Extracted from error traces and replaced with `***@***.***`

The analysis engine uses allowlists for common framework patterns to avoid false positives while maintaining privacy protection.

### Code Snippet Removal

By default, no source code snippets upload to the cloud. Analysis results include:

- File path and line number
- Error type and severity
- Detector name that flagged the issue

The dashboard displays this metadata with links back to your local codebase. Developers click issues in the dashboard and VS Code opens the file at the exact line—no source code stored remotely.

**Exception**: Security detectors (hardcoded secrets, SQL injection patterns) can be configured to upload minimal context (2-3 lines) for manual review. This feature is disabled by default and requires explicit opt-in per project.

### Enforcement Mechanism

Sanitization is not optional or configurable. The upload pipeline enforces these rules at the code level:

1. Analysis engine produces local JSON with full data
2. Upload sanitizer processes JSON through validation rules
3. Sanitized output inspected via `--dry-run` flag before transmission
4. Cloud API rejects uploads that fail schema validation (contains absolute paths, email addresses, etc.)

This multi-layer enforcement prevents accidental leakage even if client code has bugs.

---

## Authentication & Access Control

### JWT Authentication

ODAVL Insight uses JSON Web Tokens (JWT) for stateless authentication:

- **Access Tokens**: 15-minute expiration, signed with HS256 algorithm
- **Refresh Tokens**: 30-day expiration, stored in PostgreSQL with user association
- **Token Rotation**: Each refresh generates new access + refresh token pair, invalidating old refresh token
- **Revocation**: Logout invalidates refresh token server-side, preventing further access

Access tokens contain minimal claims: `userId`, `email`, `plan` (FREE/PRO/TEAM/ENTERPRISE). No sensitive metadata embedded.

### Plan-Based Authorization

Every API endpoint validates user plan before granting access:

- **FREE**: Up to 3 projects, 10 uploads/month, 1 GB storage
- **PRO**: 10 projects, 100 uploads/month, 10 GB storage
- **TEAM**: 50 projects, 500 uploads/month, SSO integration
- **ENTERPRISE**: Unlimited, self-hosted option, audit logs

Attempting to access features above your plan tier returns `403 Forbidden` with clear error message. Plan enforcement happens at both application and database levels (unique constraints on project counts).

### OS Keychain Usage

Sensitive credentials never stored in plaintext:

- **macOS**: Stored in Keychain with `kSecAttrAccessibleAfterFirstUnlock` attribute
- **Windows**: Windows Credential Manager with `CredentialType.Generic` and local user scope
- **Linux**: Secret Service API (GNOME Keyring, KWallet) via libsecret

CLI and VS Code extension query keychain on startup. Failed keychain access prompts re-authentication, never falls back to environment variables or config files.

---

## Encryption & Storage

### In-Transit Encryption

All network communication uses TLS 1.3 with strong cipher suites:

- **Mandatory HTTPS**: HTTP connections redirected to HTTPS at infrastructure level
- **HSTS Enabled**: Strict-Transport-Security header with 1-year max-age
- **Certificate Pinning**: VS Code extension validates expected certificate chain
- **No Downgrades**: TLS 1.2 and below rejected at load balancer

WebSocket connections (future real-time features) will use WSS (TLS over WebSocket) with same security guarantees.

### At-Rest Encryption

**Database Encryption**: PostgreSQL data-at-rest encryption via provider (AWS RDS encryption, Azure Database for PostgreSQL encryption). AES-256 encryption for table storage and automated backups.

**Credential Storage**: User passwords hashed with Argon2id (winner of Password Hashing Competition, recommended by OWASP 2025):

```
Argon2id(password, salt, time=2, memory=64MB, parallelism=4)
```

Parameters chosen for balance between security and performance. Each password uses unique random salt (32 bytes).

**Backup Encryption**: Daily database backups encrypted with provider-managed keys. Backups retained for 30 days, then permanently deleted.

### Key Management Principles

- **JWT Signing Key**: Rotated quarterly, 64-byte random value stored in environment variables (not version control)
- **Database Credentials**: Managed by infrastructure provider, never exposed to application code
- **API Keys** (Stripe, etc.): Environment variables with read-only file permissions, separate per environment
- **No Hardcoded Secrets**: Pre-commit hooks scan for accidentally committed secrets (git-secrets integration)

Key rotation procedures documented in internal runbooks. Enterprise customers receive advance notice of planned rotations.

---

## Offline & Failure Safety

### Offline-First Design

ODAVL Insight functions fully without internet access:

- **Analysis**: Runs entirely on local machine, no network calls during detection phase
- **Results Storage**: Saved to `.odavl/` directory in JSON and SARIF formats
- **VS Code Integration**: Real-time linting and Problems Panel updates work offline
- **CLI Commands**: All commands except `--upload` operate without network

Developers on airplanes, secure networks, or privacy-focused environments experience zero degradation.

### Local Queue Behavior

Failed uploads enter a local retry queue:

1. Analysis completes, sanitization applied
2. Upload attempted with 30-second timeout
3. Network failure detected (DNS, TLS, or HTTP error)
4. Sanitized JSON saved to `.odavl/queue/pending-<timestamp>.json`
5. Next successful upload processes queue in chronological order
6. Queue persists across application restarts

No analysis results are lost due to transient network issues. Dashboard displays data once connectivity restores.

### No Data Loss Guarantees

**Local Analysis**: Results always saved to disk before any network operations. Power loss during upload affects only the upload, not the analysis.

**Database Transactions**: All writes wrapped in PostgreSQL transactions. Partial updates automatically rolled back on error.

**Audit Logging**: Critical actions (subscription changes, plan switches) logged before execution. Failed operations appear in audit trail with error details.

---

## GDPR & EU Compliance Posture

### Data Minimization

ODAVL Insight collects only data necessary for functionality:

- **No Behavioral Tracking**: No analytics on feature usage, click patterns, or time-on-page
- **No Third-Party Trackers**: No Google Analytics, Hotjar, or similar services
- **Minimal Metadata**: Uploads contain error counts and file paths, not developer identities

This minimalist approach reduces compliance burden and eliminates most GDPR concerns by design.

### Purpose Limitation

Data is used exclusively for declared purposes:

- **Analysis Results**: Code quality dashboards and trend visualization
- **Authentication Data**: Login and authorization enforcement
- **Billing Data**: Subscription management and invoice generation
- **Audit Logs**: Security and compliance reporting (ENTERPRISE tier only)

No data repurposed for advertising, profiling, or third-party sales. Data Processing Agreement (DPA) available for enterprise customers.

### User Control & Deletion

Users exercise full control over their data:

- **Deletion Requests**: Submit via email to privacy@odavl.studio, processed within 30 days
- **Data Export**: Download complete data archive in JSON format from dashboard
- **Selective Deletion**: Delete individual projects or analysis results without closing account
- **Account Termination**: Full account deletion removes all associated data within 30 days

Backups containing deleted data purged from backup rotation within 60 days maximum.

### EU-Friendly Defaults

- **Data Residency**: EU customers' data stored in Frankfurt or Amsterdam datacenters by default
- **EU-US Data Transfers**: Comply with EU-US Data Privacy Framework where applicable
- **GDPR-Compliant Subprocessors**: Stripe (payment), AWS/Azure (hosting)—all DPA-compliant

Enterprise customers can specify data residency requirements during onboarding.

---

## Auditability & Transparency

### Audit Logs

ODAVL Insight tracks security-critical actions:

- **Authentication Events**: Login, logout, token refresh, failed attempts
- **Authorization Changes**: Plan upgrades, downgrades, subscription modifications
- **Data Access**: Project creation, analysis uploads, deletion requests
- **Configuration Changes**: Detector enable/disable, feature flag toggles

Audit logs include: timestamp, userId, action type, IP address, user agent, and result (success/failure). Logs retained for 1 year (FREE/PRO), 3 years (TEAM), 7 years (ENTERPRISE).

### Deterministic Behavior

Analysis is deterministic and reproducible:

- **Same Input, Same Output**: Identical codebase analyzed twice produces bit-identical results
- **Version Pinning**: Detector versions recorded in analysis metadata for reproducibility
- **No Randomness**: No ML-based guessing that produces different results on reruns

This determinism is critical for security audits and compliance validation. Auditors can re-run analysis and verify results independently.

### Reproducible Analysis

Analysis results include complete provenance:

- **Detector Versions**: Which version of TypeScript detector, security scanner, etc.
- **Configuration Hash**: SHA-256 hash of active detector settings
- **Timestamp**: ISO 8601 timestamp with timezone
- **CLI Version**: Which version of ODAVL CLI executed the analysis

This metadata enables compliance teams to reproduce historical analysis results years later for audit purposes.

---

## Responsible Disclosure

### Reporting Security Issues

Security researchers and users who discover vulnerabilities should report via:

- **Email**: security@odavl.studio (PGP key available on website)
- **Encrypted Reporting**: Keybase encrypted messages to @odavlsecurity
- **Coordinated Disclosure**: 90-day disclosure timeline preferred

Do not publicly disclose security issues before receiving confirmation from ODAVL Studio security team.

### Commitment to Fixes

ODAVL Studio commits to:

- **Acknowledgment**: Response within 48 hours of report
- **Severity Assessment**: CVSS scoring within 7 days
- **Critical Fixes**: Patch deployed within 7 days for critical vulnerabilities (CVSS ≥9.0)
- **High-Priority Fixes**: Patch deployed within 30 days for high-priority issues (CVSS 7.0–8.9)
- **Coordinated Disclosure**: Work with reporter on responsible disclosure timing

Security fixes released as patch versions (e.g., 1.0.1 → 1.0.2) with detailed changelog in private security advisory before public announcement.

---

## Contact

**Security Inquiries**: security@odavl.studio  
**Privacy Requests**: privacy@odavl.studio  
**General Support**: support@odavl.studio

**Company**: ODAVL Studio GmbH, Berlin, Germany  
**Data Protection Officer**: dpo@odavl.studio  
**Legal**: [Privacy Policy](https://odavl.studio/privacy) | [DPA](https://odavl.studio/dpa) | [Terms](https://odavl.studio/terms)
