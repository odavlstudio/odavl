# ODAVL Insight: Pricing & Plans

**Version**: 1.0.0  
**Last Updated**: December 2025  
**Currency**: EUR (€)

---

## Pricing Philosophy

ODAVL Insight is not "paywalled intelligence." The analysis engine, all 16 detectors, multi-language support, and VS Code integration are identical across every tier—including FREE. We do not artificially limit analysis quality to create upgrade pressure.

The FREE tier provides real value: unlimited local analysis, full detector suite, CLI and VS Code extension, and basic cloud sync. Individual developers and small projects can use ODAVL Insight indefinitely at no cost without hitting feature walls.

Paid tiers exist to cover operational costs at scale: database storage, cloud infrastructure, historical data retention, and support bandwidth. When your usage grows beyond FREE tier quotas, you are paying for server resources and operational overhead, not for access to better analysis.

This approach reflects our belief that code quality tools should be accessible by default. Monetization happens when usage patterns require sustained infrastructure, not when features become useful.

---

## The FREE Plan

### Who It Is For

**Individual developers** working on personal projects, open source contributions, or side projects. Developers who analyze code occasionally (weekly or monthly) rather than continuously. Teams evaluating ODAVL Insight before committing to paid plans. Hobbyists, students, and educators learning code analysis techniques.

### What It Includes

The FREE plan provides:

- **Unlimited local analysis** across all supported languages (TypeScript, JavaScript, Python, Java, Go, Rust, Kotlin, Swift, Ruby, PHP)
- **All 16 detectors enabled** (TypeScript, security, performance, complexity, circular dependencies, import validation, package analysis, runtime patterns, build configuration, network issues, isolation problems, infrastructure checks, CI/CD validation, database patterns, Next.js specifics, and multi-language detectors)
- **CLI tool** for terminal-based analysis and CI/CD integration
- **VS Code extension** with real-time linting, Problems Panel integration, and click-to-navigate error locations
- **Local reporting** in JSON and SARIF formats for integration with other tools
- **Cloud sync for 3 projects** with historical trend tracking
- **10 analysis uploads per month** to the cloud dashboard
- **1 GB cloud storage** for historical data retention
- **Community support** via documentation and public forums

### What Limits Exist and Why

**3 Projects**: Prevents abuse where a single free account manages hundreds of repositories. Most individual developers work on 1-3 active projects simultaneously. If you maintain more projects, the local CLI continues working without limits—you simply cannot sync all of them to the cloud.

**10 Uploads per Month**: Cloud infrastructure (database writes, storage, API requests) has marginal cost per upload. Ten uploads per month supports weekly analysis cadence for active projects without incurring unsustainable hosting costs for free users.

**1 GB Storage**: Historical data accumulates over time. One gigabyte stores approximately 6-12 months of weekly analysis results for typical projects (50K-200K lines of code). Older data is archived but not deleted—you retain access via data export.

These limits are not arbitrary scarcity. They reflect the balance between providing genuine utility and maintaining financial sustainability for the platform.

### What Is Intentionally NOT Limited

**Local analysis speed**: FREE users get the same performance as ENTERPRISE customers. No artificial slowdowns.

**Detector quality**: All detectors use identical logic across tiers. No "lite" versions with reduced accuracy.

**VS Code integration**: Full feature set including auto-analysis on save, diagnostic highlighting, and quick-fix suggestions.

**Export formats**: JSON and SARIF exports are unrestricted. You can generate reports locally and process them with external tools without cloud involvement.

**Support documentation**: Complete technical documentation, architecture guides, and troubleshooting resources available to all users.

The FREE tier is not a trial or demo. It is a fully functional product tier designed for users whose operational scale fits within the quotas.

---

## The PRO Plan

**Price**: €49/month (billed monthly or €490/year with 2 months free)

### Who Should Upgrade to PRO

**Professional developers** managing 5-10 active projects. Freelancers or consultants working on client projects with frequent analysis requirements. Teams of 1-3 developers who need centralized historical tracking. Projects with continuous integration pipelines that analyze code on every commit or pull request.

### What Practical Problems PRO Solves

**Project Scale**: Ten projects covers most professional scenarios: 3-5 client projects, 2-3 internal tools, 1-2 experimental projects. If you regularly exceed 3 projects, PRO eliminates manual project rotation.

**CI/CD Integration**: One hundred analyses per month supports daily builds for 3-4 active repositories or per-commit analysis for smaller projects. This cadence enables automated quality gates without quota anxiety.

**Historical Depth**: 10 GB storage retains 2-3 years of weekly analysis data or 6-12 months of daily analysis. Long-term trends become visible: "Is technical debt improving?" and "When did complexity spike?"

**Priority Support**: Email support with 24-hour response time for technical issues. Direct communication with engineering team for bug reports and feature requests.

### What Changes Operationally

**Quota Relief**: You stop manually managing which projects sync to the cloud. All active repositories can upload results without tracking monthly limits.

**Trend Analysis**: Longer historical retention enables quarter-over-quarter and year-over-year comparisons. Leadership reporting becomes feasible ("Show me code quality trends for Q4").

**CI/CD Confidence**: Automated pipelines can run analysis on every build without risk of hitting monthly limits mid-sprint.

### Clear Upgrade Trigger Points

Upgrade to PRO when:

- You consistently hit the 3-project limit and manually rotate projects
- CI/CD pipelines fail due to monthly upload quota exhaustion
- You need historical data older than 6 months for compliance or audit purposes
- You require direct email support for technical issues

Do not upgrade to PRO if:

- You work on 1-2 projects with weekly analysis—FREE remains sufficient
- You use ODAVL Insight primarily for local analysis without cloud sync
- You are exploring the platform and have not yet established regular usage patterns

---

## The TEAM Plan

**Price**: €199/month (billed monthly or €1,990/year with 2 months free)

### Team Collaboration Rationale

TEAM is not "PRO × 5 developers." It introduces multi-user workflows that do not exist in single-developer tiers:

**Shared Quota Pool**: Five team members share 50 projects and 500 analyses/month. This pooling prevents individual quota exhaustion when one developer runs heavy analysis during a refactoring sprint.

**Unified Dashboard**: All team members see the same historical data. Code reviews reference specific analysis runs: "Check the security scan from commit abc123."

**Audit Logging**: Track which team member uploaded analysis, modified project settings, or changed detector configurations. Critical for compliance and accountability in regulated industries.

**SSO Integration**: GitHub and Google OAuth for team-wide authentication. Simplifies onboarding and offboarding—no manual credential management.

### Why This Is Not Just "PRO × N"

**Collaboration Context**: TEAM adds features that only make sense with multiple users: role-based access (admin vs member), project sharing permissions, and team-wide notification settings.

**Operational Efficiency**: Centralized billing, unified support channel, and shared quota management reduce administrative overhead compared to managing multiple PRO subscriptions.

**Compliance Requirements**: Audit logs and SSO integration meet requirements for SOC 2, ISO 27001, and similar certifications that individual plans cannot satisfy.

### When TEAM Makes Sense

Upgrade to TEAM when:

- Your development team exceeds 3-5 people working on shared repositories
- Compliance requires audit trails for code analysis activities
- Onboarding/offboarding frequency justifies SSO integration
- Multiple developers need simultaneous dashboard access without credential sharing

---

## ENTERPRISE (Conceptual, Not Salesy)

ENTERPRISE is not a predefined plan. It is a conversation that starts with "What constraints or requirements make standard plans unsuitable?"

### When It Makes Sense

**Self-Hosted Deployment**: Regulatory requirements prohibit cloud-hosted analysis results (defense contractors, financial institutions with data residency mandates).

**Unlimited Scale**: Analyzing hundreds of repositories with thousands of developers exceeds TEAM quotas by orders of magnitude.

**Custom Detectors**: Organization-specific patterns that require bespoke detector logic (proprietary frameworks, internal security standards).

**SLA Guarantees**: Uptime commitments, dedicated support engineer, contractual response times.

**Advanced Compliance**: HIPAA BAA, FedRAMP authorization, custom DPA terms.

### No Pricing Promises

ENTERPRISE pricing is custom because requirements vary dramatically. A 50-developer team with air-gapped deployment has different costs than a 500-developer organization using cloud deployment with custom detectors.

Contact sales@odavl.studio to discuss specific needs. Expect pricing in the range of €2,000-€10,000/month depending on scale and customization requirements.

---

## Upgrade Journey

### Natural Progression: FREE → PRO → TEAM

**Starting Point (FREE)**: Evaluate ODAVL Insight, establish analysis workflows, build confidence in detector accuracy.

**Growth Trigger (PRO)**: Project count or analysis frequency exceeds FREE quotas. You have established regular usage and need operational headroom.

**Team Expansion (TEAM)**: Multiple developers collaborate on shared repositories. Individual PRO subscriptions become administratively burdensome.

This progression is not mandatory. Developers who maintain 1-2 projects indefinitely never need to leave FREE. Teams that start with 10 developers can begin at TEAM tier directly.

### No Lock-In Philosophy

**Downgrade Anytime**: Downgrading from PRO to FREE or TEAM to PRO happens immediately. Billing prorates the remainder of the current period.

**Data Retention**: Downgrading does not delete historical data. You lose upload access beyond new tier limits, but existing data remains accessible for 90 days. After 90 days, data is archived (read-only, no dashboard access) but not deleted—available via data export API.

**Local Analysis Unaffected**: CLI and VS Code extension continue working identically across all tiers. Downgrading impacts only cloud features.

### Downgrade Guarantees

- **No surprise data loss**: 90-day grace period before dashboard access restriction
- **Export before restriction**: Full data export in JSON format available during grace period
- **Reactivation**: Upgrading restores full access to archived data within 12 months of downgrade

---

## What Happens If You Don't Pay

If subscription payment fails or you voluntarily cancel:

**Local Analysis Continues**: CLI and VS Code extension function normally. All detectors remain enabled. Local reporting (JSON, SARIF) still works.

**Cloud Features Degrade Gracefully**:
- **Dashboard Access**: Read-only for 90 days, then archived (export API only)
- **New Uploads**: Blocked immediately—local queue accumulates pending uploads
- **Historical Data**: Not deleted—archived and accessible via data export
- **Re-upload on Reactivation**: Queued uploads automatically sync when subscription reactivates

**No Data Hostage Situations**: We never delete data to force upgrades. Analysis results are yours. If you stop paying, you lose cloud infrastructure access, not your data.

**Reactivation Process**: Subscribe at any tier, data restores within minutes. No re-upload required for historical data archived within 12 months.

---

## Transparency Commitments

### No Dark Patterns

- **Clear Limits**: Quotas displayed in dashboard with real-time usage counters
- **Approaching Limits**: Warning at 80% usage, not after exceeding quota
- **Upgrade Prompts**: Factual ("You have 2 analyses remaining this month") not manipulative ("Don't miss out!")

### No Surprise Limits

- **Documented Quotas**: All limits published in documentation and visible before sign-up
- **No Hidden Throttling**: FREE users get identical performance, not artificially slowed analysis
- **No Feature Creep**: Features launched in paid tiers stay in those tiers—no retroactive FREE tier restrictions

### No Hidden Tracking

- **No Analytics**: No Google Analytics, Mixpanel, or behavioral tracking
- **No A/B Tests**: No experimental pricing or feature availability variations
- **Usage Metrics Only**: We track analysis count and storage usage for billing—nothing else

These commitments are not marketing. They are engineering constraints enforced at the code level. The platform is built to make hidden manipulation difficult, not just promised.

---

## Pricing Summary Table

| Feature | FREE | PRO | TEAM | ENTERPRISE |
|---------|------|-----|------|------------|
| **Price** | €0/month | €49/month | €199/month | Custom |
| **Local Analysis** | Unlimited | Unlimited | Unlimited | Unlimited |
| **All Detectors** | ✓ | ✓ | ✓ | ✓ |
| **CLI & VS Code** | ✓ | ✓ | ✓ | ✓ |
| **Cloud Projects** | 3 | 10 | 50 | Unlimited |
| **Monthly Uploads** | 10 | 100 | 500 | Unlimited |
| **Cloud Storage** | 1 GB | 10 GB | 50 GB | Custom |
| **Support** | Community | Email (24h) | Priority (12h) | Dedicated |
| **Team Features** | — | — | SSO, Audit Logs | Advanced |
| **Self-Hosted** | — | — | — | ✓ |

---

## Contact

**Pricing Questions**: sales@odavl.studio  
**Billing Support**: billing@odavl.studio  
**General Inquiries**: support@odavl.studio

**Online**: [odavl.studio/pricing](https://odavl.studio/pricing)

**Company**: ODAVL Studio GmbH, Berlin, Germany
