# ODAVL Insight - Plans & Pricing

**Version**: 1.0.0  
**Last Updated**: December 12, 2025  
**Currency**: USD  
**Billing**: Monthly or Annual (save 20%)

---

## Overview

ODAVL Insight offers **4 plans** designed for individuals, teams, and enterprises:

| Plan | Price | Best For |
|------|-------|----------|
| **FREE** | $0/mo | Solo developers, open source |
| **PRO** | $29/mo | Professional developers, small teams |
| **TEAM** | $99/mo | Development teams (5-20 users) |
| **ENTERPRISE** | Custom | Large organizations (20+ users) |

**All plans include:**
- ✅ Local analysis (CLI + VS Code extension)
- ✅ Real-time error detection
- ✅ Multi-language support
- ✅ Privacy-first design
- ✅ No source code transmission

---

## FREE Plan

**Price**: $0/month forever

### What's Included

✅ **Analysis Limits**
- 1 project
- 100 files per analysis
- 5 analyses per day
- Local analysis only (no cloud)

✅ **6 Core Detectors**
- TypeScript - Type errors, strict mode violations
- ESLint - Code style, best practices
- Security - Basic security issues (SQL injection, XSS)
- Import - Import/export issues, circular dependencies
- Package - Package.json validation, dependency issues
- Runtime - Runtime errors, null/undefined issues

✅ **Tools**
- CLI (`@odavl/cli`)
- VS Code extension
- SDK (`@odavl-studio/sdk`)

✅ **History**
- 7 days local history
- No cloud backup

✅ **Support**
- Community support (Discord, GitHub)
- Documentation

### Who It's For

- 👨‍💻 Solo developers
- 📚 Learning & education
- 🌟 Open source projects
- 🧪 Trying ODAVL Insight

### Getting Started

```bash
# Install CLI
npm install -g @odavl/cli

# Run first analysis
odavl insight analyze

# No credit card required
```

---

## PRO Plan

**Price**: $29/month or $278/year (save $70)

### What's Included

✅ **Analysis Limits**
- 10 projects
- 1,000 files per analysis
- 100 analyses per day
- ☁️ **Cloud analysis enabled**

✅ **11 Standard Detectors**
- All FREE detectors (6)
- **Plus:**
  - Performance - Slow code, memory leaks, N+1 queries
  - Complexity - Cyclomatic complexity, cognitive complexity
  - Circular - Circular dependencies, module cycles
  - Build - Build configuration issues
  - Network - API calls, fetch issues

✅ **Cloud Features**
- Project history & trends
- 90 days retention
- Analysis comparison (before/after)
- Export reports (JSON, Markdown, PDF)

✅ **3 Concurrent Analyses**
- Run multiple analyses in parallel
- Faster CI/CD pipelines

✅ **Support**
- Email support (24-48h response)
- Priority bug fixes

### Who It's For

- 👨‍💼 Professional developers
- 🚀 Startups
- 🏢 Small businesses (1-5 people)
- ⚡ CI/CD pipelines

### ROI Calculator

**Scenario**: You find 1 critical bug per month that would take 4 hours to debug in production.

| Metric | Value |
|--------|-------|
| Developer hourly rate | $100/hr |
| Time saved per month | 4 hours |
| **Monthly savings** | **$400** |
| **ODAVL Insight cost** | **$29** |
| **Net savings** | **$371/mo** |
| **ROI** | **1,279%** |

### Getting Started

```bash
# Sign up with 14-day free trial
odavl auth signup --trial

# Run cloud analysis
odavl insight analyze --cloud

# No credit card required for trial
```

---

## TEAM Plan

**Price**: $99/month or $950/year (save $238)

### What's Included

✅ **Analysis Limits**
- 50 projects
- 5,000 files per analysis
- 500 analyses per day
- ☁️ Cloud analysis enabled

✅ **14 Enhanced Detectors**
- All PRO detectors (11)
- **Plus:**
  - Database - SQL queries, ORM issues, migrations
  - Infrastructure - Docker, Kubernetes, Terraform
  - CI/CD - GitHub Actions, GitLab CI, Jenkins

✅ **Team Collaboration**
- Share projects with team members
- Assign issues to developers
- Comment & discuss findings
- Track team progress
- Role-based access control (RBAC)

✅ **10 Concurrent Analyses**
- Massive parallelism for CI/CD
- Analyze monorepos efficiently

✅ **History**
- 180 days retention
- Unlimited exports

✅ **Support**
- Priority email support (12-24h response)
- Monthly check-in calls
- Custom integrations

### Who It's For

- 👥 Development teams (5-20 people)
- 🏢 Growing companies
- 🔧 DevOps teams
- 📊 Teams needing collaboration

### Team Features Deep Dive

**1. Project Sharing**
```
└── Project: "my-app"
    ├── Owner: john@company.com
    ├── Members:
    │   ├── jane@company.com (Admin)
    │   ├── bob@company.com (Developer)
    │   └── alice@company.com (Viewer)
    └── Permissions:
        ├── john, jane: full access
        ├── bob: can analyze, comment
        └── alice: read-only
```

**2. Issue Assignment**
```
🔴 Critical: SQL Injection in login endpoint
   ├── Assigned to: bob@company.com
   ├── Status: In Progress
   ├── Due: 2025-12-15
   └── Comments: 3
       ├── jane: "Use parameterized queries"
       ├── bob: "Working on fix"
       └── john: "Priority for v2.0 release"
```

**3. Team Dashboard**
- Real-time overview of all projects
- Team activity feed
- Issue burndown charts
- Developer productivity metrics

### Getting Started

```bash
# Sign up for TEAM plan
odavl auth signup --plan team

# Invite team members
odavl team invite jane@company.com --role admin
odavl team invite bob@company.com --role developer

# Share project
odavl project share my-app --with jane@company.com
```

---

## ENTERPRISE Plan

**Price**: Custom (contact sales)

### What's Included

✅ **Unlimited Everything**
- Unlimited projects
- Unlimited files per analysis
- Unlimited analyses per day
- Unlimited concurrent analyses
- Unlimited team members

✅ **16 Detectors + Custom Detectors**
- All TEAM detectors (14)
- **Plus:**
  - Next.js - Next.js-specific issues
  - CI/CD - Advanced CI/CD patterns
- **Custom detectors** - Build your own detectors

✅ **Enterprise Features**
- 🔐 **Single Sign-On (SSO)** - SAML, OAuth, LDAP
- 📜 **Audit Logs** - Complete audit trail
- 🏢 **On-Premise Deployment** - Host on your infrastructure
- 🎨 **White-Label** - Custom branding
- 📊 **Compliance Reports** - SOC 2, ISO 27001, GDPR
- 🛡️ **Advanced RBAC** - Custom roles and permissions
- 📞 **Dedicated Support** - Slack channel, phone support

✅ **History**
- 365 days retention (or custom)
- Unlimited exports
- Backup & disaster recovery

✅ **SLAs**
- 99.9% uptime guarantee
- 4-hour critical response time
- Dedicated customer success manager
- Quarterly business reviews

### Who It's For

- 🏦 Financial services
- 🏥 Healthcare
- 🏛️ Government
- 🏢 Large enterprises (100+ developers)
- 🔒 Security-conscious organizations

### Enterprise Add-Ons

| Add-On | Description | Price |
|--------|-------------|-------|
| **Custom Detector Development** | We build detectors for your stack | Included |
| **On-Premise Training** | On-site training for your team | Contact sales |
| **Integration Services** | Custom integrations (Jira, ServiceNow) | Contact sales |
| **Professional Services** | Code audits, architecture reviews | $300/hr |

### Getting Started

```bash
# Contact enterprise sales
Email: enterprise@odavl.studio
Phone: +1 (555) 123-4567
Calendar: https://cal.com/odavl/enterprise-demo
```

**Request Demo**: https://odavl.studio/demo

---

## Plan Comparison Table

| Feature | FREE | PRO | TEAM | ENTERPRISE |
|---------|------|-----|------|------------|
| **Pricing** |
| Monthly | $0 | $29 | $99 | Custom |
| Annual | $0 | $278 | $950 | Custom |
| **Analysis** |
| Projects | 1 | 10 | 50 | Unlimited |
| Files/Analysis | 100 | 1,000 | 5,000 | Unlimited |
| Analyses/Day | 5 | 100 | 500 | Unlimited |
| Concurrent | 1 | 3 | 10 | Unlimited |
| Cloud Analysis | ❌ | ✅ | ✅ | ✅ |
| **Detectors** |
| Core (6) | ✅ | ✅ | ✅ | ✅ |
| Standard (+5) | ❌ | ✅ | ✅ | ✅ |
| Enhanced (+3) | ❌ | ❌ | ✅ | ✅ |
| All (+2) | ❌ | ❌ | ❌ | ✅ |
| Custom Detectors | ❌ | ❌ | ❌ | ✅ |
| **History** |
| Retention | 7 days | 90 days | 180 days | 365 days |
| Cloud Backup | ❌ | ✅ | ✅ | ✅ |
| Exports | ❌ | ✅ | Unlimited | Unlimited |
| **Collaboration** |
| Team Members | 1 | 1 | 20 | Unlimited |
| Project Sharing | ❌ | ❌ | ✅ | ✅ |
| Issue Assignment | ❌ | ❌ | ✅ | ✅ |
| Comments | ❌ | ❌ | ✅ | ✅ |
| RBAC | ❌ | ❌ | Basic | Advanced |
| **Enterprise** |
| SSO/SAML | ❌ | ❌ | ❌ | ✅ |
| Audit Logs | ❌ | ❌ | ❌ | ✅ |
| On-Premise | ❌ | ❌ | ❌ | ✅ |
| White-Label | ❌ | ❌ | ❌ | ✅ |
| SLA | ❌ | ❌ | ❌ | 99.9% |
| **Support** |
| Community | ✅ | ✅ | ✅ | ✅ |
| Email | ❌ | ✅ | ✅ | ✅ |
| Priority | ❌ | ❌ | ✅ | ✅ |
| Phone | ❌ | ❌ | ❌ | ✅ |
| Dedicated CSM | ❌ | ❌ | ❌ | ✅ |

---

## Detector Breakdown

### Core Detectors (6) - ALL PLANS

| Detector | What It Finds | Example Issue |
|----------|---------------|---------------|
| **TypeScript** | Type errors, strict mode violations | `Variable 'x' has type 'any'` |
| **ESLint** | Code style, best practices | `Unexpected console statement` |
| **Security** | SQL injection, XSS, hardcoded secrets | `Hardcoded API key detected` |
| **Import** | Import/export issues, circular deps | `Circular dependency detected` |
| **Package** | package.json issues, dependencies | `Unused dependency 'lodash'` |
| **Runtime** | Null/undefined errors | `Cannot read property of undefined` |

### Standard Detectors (+5) - PRO+

| Detector | What It Finds | Example Issue |
|----------|---------------|---------------|
| **Performance** | Slow code, memory leaks | `Expensive operation in render loop` |
| **Complexity** | High complexity functions | `Cyclomatic complexity: 45 (max: 20)` |
| **Circular** | Module circular dependencies | `Circular dependency: A → B → A` |
| **Build** | Build config issues | `Invalid tsconfig.json` |
| **Network** | API calls, fetch issues | `Missing error handling in fetch` |

### Enhanced Detectors (+3) - TEAM+

| Detector | What It Finds | Example Issue |
|----------|---------------|---------------|
| **Database** | SQL queries, ORM issues | `N+1 query detected` |
| **Infrastructure** | Docker, K8s, Terraform | `Dockerfile missing health check` |
| **CI/CD** | GitHub Actions, GitLab CI | `Missing cache in CI pipeline` |

### All Detectors (+2) - ENTERPRISE

| Detector | What It Finds | Example Issue |
|----------|---------------|---------------|
| **Next.js** | Next.js-specific patterns | `getServerSideProps blocking render` |
| **CI/CD** | Advanced CI/CD | `Deploy job missing rollback` |

---

## Frequently Asked Questions

### General

**Q: Can I try PRO before paying?**  
A: Yes! 14-day free trial, no credit card required.

**Q: Can I change plans anytime?**  
A: Yes. Upgrade instantly, downgrade at end of billing cycle.

**Q: Is there a discount for annual billing?**  
A: Yes. Save 20% with annual billing.

**Q: Do you offer educational/non-profit discounts?**  
A: Yes. 50% off for students, teachers, and non-profits. Email: education@odavl.studio

**Q: Can I use ODAVL Insight for open source projects?**  
A: Yes. FREE plan is perfect for open source. Contact us for OSS sponsorship.

### Billing

**Q: What payment methods do you accept?**  
A: Credit card (Visa, Mastercard, Amex), ACH, wire transfer (Enterprise only).

**Q: Can I get a refund?**  
A: Yes. 30-day money-back guarantee, no questions asked.

**Q: Do you charge per user?**  
A: No. TEAM plan includes up to 20 users. Enterprise is unlimited.

**Q: What happens if I exceed limits?**  
A: You'll get a friendly notification to upgrade. Analysis continues until end of billing cycle.

### Features

**Q: What's the difference between local and cloud analysis?**  
A: Local analysis runs on your machine (FREE). Cloud analysis runs on our servers with project history, team collaboration, and enhanced detectors (PRO+).

**Q: Can I use my own detectors?**  
A: Yes. Enterprise plan includes custom detector development.

**Q: Do you support my language/framework?**  
A: Full support: TypeScript, JavaScript. Experimental: Python, Java, PHP, Ruby, Swift, Kotlin. More coming soon!

**Q: Can I export my data?**  
A: Yes. Export as JSON, Markdown, PDF (PRO+). Full data export via API (Enterprise).

### Security & Privacy

**Q: Do you send my source code to the cloud?**  
A: No. Only issue metadata (message, file, line, severity). Never source code.

**Q: Is my data encrypted?**  
A: Yes. TLS 1.3 in transit, AES-256 at rest.

**Q: Are you GDPR compliant?**  
A: Yes. Full GDPR compliance. Data residency options available (Enterprise).

**Q: Can I self-host ODAVL Insight?**  
A: Yes. On-premise deployment available (Enterprise).

---

## Migration Guide

### From FREE → PRO

```bash
# 1. Sign up for PRO trial
odavl auth signup --plan pro --trial

# 2. Run cloud analysis
odavl insight analyze --cloud

# 3. View results in dashboard
open https://cloud.odavl.studio

# 4. After trial, add payment method
odavl billing add-payment-method
```

### From PRO → TEAM

```bash
# 1. Upgrade to TEAM
odavl plan upgrade team

# 2. Invite team members
odavl team invite jane@company.com
odavl team invite bob@company.com

# 3. Share projects
odavl project share my-app --with jane@company.com

# 4. Set up RBAC
odavl team role jane@company.com --role admin
odavl team role bob@company.com --role developer
```

### From TEAM → ENTERPRISE

```bash
# 1. Contact enterprise sales
Email: enterprise@odavl.studio

# 2. Schedule demo & requirements gathering

# 3. Receive custom proposal

# 4. Sign contract & onboarding

# 5. Migration assistance included
```

---

## Contact Sales

### PRO/TEAM Plans

**Self-Service**: https://cloud.odavl.studio/upgrade  
**Email**: sales@odavl.studio  
**Chat**: https://odavl.studio (bottom-right widget)

### ENTERPRISE Plans

**Email**: enterprise@odavl.studio  
**Phone**: +1 (555) 123-4567  
**Calendar**: https://cal.com/odavl/enterprise-demo  
**Request Quote**: https://odavl.studio/enterprise-quote

---

## Start Your Free Trial Today

```bash
# Install CLI
npm install -g @odavl/cli

# Try PRO for 14 days (no credit card)
odavl auth signup --trial

# Run cloud analysis
odavl insight analyze --cloud

# Upgrade when ready
odavl plan upgrade pro
```

**Or start with FREE forever:**
```bash
odavl insight analyze  # No sign-up needed
```

---

*Pricing last updated: December 12, 2025*  
*Subject to change. See website for latest pricing.*  
*All prices in USD. Enterprise pricing available in other currencies.*

**Need help choosing?** Email: sales@odavl.studio
