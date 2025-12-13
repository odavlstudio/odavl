# ODAVL Insight: Product Overview

**Version**: 1.0.0  
**Last Updated**: December 2025  
**Status**: Production Ready

---

## What is ODAVL Insight?

ODAVL Insight is a production-grade static analysis platform designed for modern development teams. It detects code quality issues, security vulnerabilities, and architectural problems across multiple programming languages through deterministic analysis—not guesswork.

Unlike traditional linters that analyze individual files in isolation, ODAVL Insight understands your entire codebase: import dependencies, circular references, runtime patterns, and cross-file relationships. The platform combines local-first analysis for privacy with optional cloud synchronization for historical tracking and team collaboration. Analysis runs locally on your machine or in your CI pipeline, with results optionally uploaded as sanitized JSON or SARIF reports to a secure dashboard.

---

## Who is ODAVL Insight for?

**Individual Developers**: Engineers working on personal projects or open source who need comprehensive code analysis without vendor lock-in. Run analysis locally with full control over your data.

**Development Teams**: Small to mid-sized teams (5-50 developers) who need shared visibility into code quality across repositories. Track improvements over time and establish quality gates without enterprise complexity.

**Engineering Organizations**: Companies managing multiple projects, large codebases, or strict compliance requirements. ODAVL Insight scales to analyze millions of lines of code while maintaining performance and privacy guarantees. Suitable for regulated industries (finance, healthcare, government) with data residency requirements.

**Use Cases**:
- Local development: Real-time feedback in VS Code as you write code
- Pre-commit validation: Catch issues before they reach version control
- CI/CD integration: Block merges that introduce critical defects
- Large-scale audits: Analyze legacy codebases with 500K+ lines of code
- Multi-language projects: Unified analysis across TypeScript, Python, Java, Go, Rust, and more

---

## What Problems Does It Solve?

**Code Quality Blind Spots**: Traditional tools analyze syntax and style but miss architectural issues like circular dependencies, runtime error patterns, and cross-file complexity. ODAVL Insight provides whole-program analysis that detects problems invisible to file-level linters.

**Scale Limitations**: ESLint, Pylint, and similar tools slow down dramatically on large codebases. ODAVL Insight maintains sub-second analysis times even on projects with hundreds of thousands of lines through efficient caching and parallel execution.

**Privacy Concerns with Cloud Tools**: Many modern analysis platforms require uploading source code to third-party servers. ODAVL Insight performs analysis entirely on your infrastructure—cloud upload is optional and always sanitized (file paths, error messages, and metrics only, never source code).

**Fragmented Tooling**: Teams juggle separate tools for TypeScript checking, security scanning, dependency analysis, and performance validation. ODAVL Insight consolidates 16 specialized detectors into a single platform with unified reporting.

**Historical Blindness**: One-time scans provide snapshots but no trend data. ODAVL Insight tracks code quality metrics over time, showing whether technical debt is growing or shrinking across sprints and releases.

---

## How ODAVL Insight Works

### Architecture Overview

**Local Analysis Layer**: The core analysis engine runs as a CLI tool or VS Code extension on developer workstations or CI servers. Analysis is deterministic and repeatable—the same code always produces identical results. Supports offline operation with zero network dependencies for the analysis phase.

**Privacy Sanitization**: Before any data leaves your machine, ODAVL Insight applies configurable sanitization rules. By default, only metadata is extracted: file paths (relative to project root), error counts by category, and metric summaries. Source code fragments are never included unless explicitly enabled for specific detector types.

**Cloud Dashboard (Optional)**: Sanitized analysis results can be uploaded as JSON or SARIF format to a cloud-hosted PostgreSQL database. The dashboard provides historical trend visualization, team-wide error aggregation, and quality gate enforcement. Authentication uses JWT tokens with refresh token rotation. Data is encrypted at rest and in transit (TLS 1.3).

**Detector Architecture**: Analysis runs through specialized detectors for different categories: TypeScript compilation, security vulnerabilities (injection patterns, hardcoded secrets), performance anti-patterns, circular imports, unused code, build configuration issues, and runtime error patterns. Each detector can be enabled/disabled individually.

### Workflow Example

1. Developer writes code in VS Code
2. ODAVL Insight extension analyzes on save (500ms debounce)
3. Issues appear in VS Code Problems Panel with click-to-navigate
4. Developer commits code, triggering CI pipeline
5. CI runs `odavl insight analyze --format sarif --upload`
6. Sanitized results upload to team dashboard
7. Quality gates block merge if critical issues exceed threshold
8. Team reviews trends weekly via dashboard

---

## What Makes ODAVL Insight Different?

**Privacy-First by Design**: Analysis happens locally. Cloud upload is optional, sanitized, and auditable. You control what data leaves your network. Suitable for companies with strict data residency requirements (EU GDPR, German BDSG, US HIPAA).

**Deterministic Analysis**: No machine learning guesswork. Same input always produces same output. Results are reproducible across machines and CI environments. This predictability is critical for compliance auditing and quality gate enforcement.

**Offline-First with Sync**: Full functionality without internet access. Analysis, reporting, and VS Code integration work on air-gapped developer machines. Cloud sync enhances but never blocks local workflows.

**Enterprise-Grade Architecture**: Built on production-tested infrastructure (Next.js 15, Prisma ORM, PostgreSQL, Stripe billing, JWT authentication). Scales to thousands of developers across hundreds of repositories. Supports self-hosted deployment for regulated environments.

**Controlled Intelligence**: ODAVL Insight uses rule-based analysis with optional ML-enhanced pattern recognition for trust scoring. ML augments deterministic rules—it does not replace them. This hybrid approach provides intelligence without unpredictability.

**Multi-Language Native**: Single platform for TypeScript, JavaScript, Python, Java, Go, Rust, Kotlin, Swift, Ruby, and PHP. Each language has specialized detectors that understand framework patterns (React, Django, Spring Boot, etc.). No plugin architecture required—language support is built-in.

---

## Free vs Paid Philosophy

### Free Tier (No Credit Card Required)

The FREE tier provides real value, not a crippled demo:
- Unlimited local analysis across all languages
- All 16 detectors enabled
- VS Code extension with full feature set
- CLI tool for CI/CD integration
- Export to JSON/SARIF formats
- Up to 3 projects in cloud dashboard
- 10 analysis uploads per month
- 1 GB cloud storage for historical data

This tier is sufficient for individual developers, small open source projects, and evaluation by enterprise teams.

### Paid Tiers (PRO, TEAM, ENTERPRISE)

Paid plans unlock scale and collaboration:
- **PRO** (€49/month): 10 projects, 100 analyses/month, 10 GB storage, priority support
- **TEAM** (€199/month): 50 projects, 500 analyses/month, 50 GB storage, team management, SSO integration
- **ENTERPRISE** (Custom): Unlimited projects, self-hosted option, dedicated support, SLA guarantees, custom detectors

**Why Upgrade?** When your team grows beyond 3 projects or needs historical analysis beyond 10 uploads monthly, paid tiers provide the infrastructure for long-term quality tracking. Historical data enables trend analysis ("Are we improving?"), regression detection ("What changed between releases?"), and leadership reporting ("Show me technical debt over Q4").

Upgrading is about operational scale, not feature access. Core analysis remains identical across tiers.

---

## Security & Privacy Principles

### Data That Never Leaves Your Machine

- Source code (unless explicit snippets enabled for security scanning)
- Environment variables and secrets
- Local file paths (sanitized to relative paths)
- Developer names and email addresses
- Commit messages and Git history
- Internal IP addresses and network topology

### Upload Sanitization Process

When you choose to upload analysis results:
1. Absolute paths converted to project-relative paths
2. Error messages stripped of sensitive values (tokens, passwords, API keys)
3. Only aggregated metrics uploaded (error counts, file counts, complexity scores)
4. SARIF format includes file/line references but not full source content
5. User can inspect sanitized JSON before upload with `--dry-run` flag

### Authentication & Encryption

- JWT access tokens (15-minute expiry) with refresh tokens (30-day expiry)
- Passwords hashed with Argon2id (industry standard for 2025)
- TLS 1.3 for all network communication
- Secrets stored in OS keychain (macOS Keychain, Windows Credential Manager, Linux Secret Service)
- Optional SSO via GitHub/Google OAuth (TEAM tier and above)

### GDPR & EU Compliance

- Data processing agreement available for enterprise customers
- EU data residency option (Frankfurt/Amsterdam datacenters)
- User data deletion within 30 days of request
- No third-party analytics or tracking without consent
- Audit logs for all data access (ENTERPRISE tier)

---

## Production Readiness Statement

ODAVL Insight is production-ready software, not a beta or preview:

**Stability**: 105+ automated tests covering core analysis, authentication, billing, and audit logging. TypeScript compiled in strict mode with zero tolerance for type errors. Vitest for unit tests, Playwright for end-to-end validation.

**Testing**: Continuous integration runs full test suite on every commit. Pre-commit hooks enforce linting (ESLint), type checking (TypeScript), and coverage thresholds. Manual QA on Windows, macOS, and Linux before each release.

**Failure Handling**: Analysis engine uses safe error handling—individual detector failures never crash the process. Database connection failures fail gracefully with local caching. Stripe webhook processing is idempotent with retry logic.

**Enterprise Suitability**: Currently used in production by development teams across finance, healthcare, and SaaS companies. Proven scalability to repositories with 1M+ lines of code. Support for air-gapped deployment and custom security audits available for enterprise customers.

**Update Cadence**: Stable releases monthly with patch releases as needed. Breaking changes follow semantic versioning with 90-day deprecation notices. LTS (Long-Term Support) releases available for enterprise customers requiring stability over new features.

---

## Getting Started

**Download**: `npm install -g @odavl-studio/cli` or install VS Code extension from marketplace  
**Documentation**: [docs.odavl.studio](https://docs.odavl.studio)  
**Support**: support@odavl.studio (PRO+ customers), community forum for FREE tier  
**Pricing**: [odavl.studio/pricing](https://odavl.studio/pricing)

---

**Company**: ODAVL Studio GmbH, Berlin, Germany  
**Legal**: [Terms of Service](https://odavl.studio/terms) | [Privacy Policy](https://odavl.studio/privacy) | [DPA](https://odavl.studio/dpa)
