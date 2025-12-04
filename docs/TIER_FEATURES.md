# ODAVL Studio - Tier Features Matrix

**Version:** 1.0.0  
**Last Updated:** November 22, 2025

---

## 📊 Quick Comparison

| Feature | FREE | PRO ⭐ | ENTERPRISE |
|---------|------|--------|------------|
| **Price** | $0/mo | $29/mo | $299/mo |
| **Projects** | 3 | 10 | Unlimited |
| **Analyses/Month** | 100 | 1,000 | Unlimited |
| **Storage** | 1 GB | 10 GB | 100 GB |
| **Basic Detectors** | ✅ | ✅ | ✅ |
| **Problems Panel** | ✅ | ✅ | ✅ |
| **TypeScript Analysis** | ✅ | ✅ | ✅ |
| **ESLint Integration** | ✅ | ✅ | ✅ |
| **Import Checks** | ✅ | ✅ | ✅ |
| **ML Predictions** | ❌ | ✅ | ✅ |
| **Auto-Fix** | ❌ | ✅ | ✅ |
| **Advanced Detectors** | ❌ | ✅ | ✅ |
| **Security Scanning** | ❌ | ✅ | ✅ |
| **Performance Analysis** | ❌ | ✅ | ✅ |
| **Circular Deps Detection** | ❌ | ✅ | ✅ |
| **Custom Rules** | ❌ | ❌ | ✅ |
| **Team Collaboration** | ❌ | ❌ | ✅ |
| **SSO/SAML** | ❌ | ❌ | ✅ |
| **Audit Logs** | ❌ | ❌ | ✅ |
| **Support** | Community | Priority | Dedicated |
| **Response Time** | Best effort | 24-48h | <4h |

---

## 🆓 FREE Plan

**Perfect for:**
- Individual developers
- Personal projects
- Evaluation/trial
- Learning ODAVL

### Included Features

#### Core Analysis
- ✅ **TypeScript Detector** - Type errors, strict mode violations
- ✅ **ESLint Integration** - Linting errors/warnings
- ✅ **Import Checker** - Missing/circular imports
- ✅ **Package Analyzer** - Dependency issues
- ✅ **Build Detector** - Compilation failures

#### IDE Integration
- ✅ **VS Code Extension** - Real-time analysis
- ✅ **Problems Panel** - Click-to-navigate errors
- ✅ **File Save Triggers** - Auto-run on Ctrl+S

#### Developer Tools
- ✅ **CLI Access** - `odavl insight analyze`
- ✅ **JSON Export** - Machine-readable reports
- ✅ **Basic Metrics** - Error counts, severity distribution

#### Support
- ✅ **Community Forum** - GitHub Discussions
- ✅ **Documentation** - Comprehensive guides
- ✅ **Examples** - Code samples, tutorials

### Limits

- **Projects:** 3 max
- **Analyses:** 100/month
- **Storage:** 1 GB
- **API Rate:** 100 requests/hour
- **Team Size:** 1 user only

---

## ⭐ PRO Plan (Most Popular)

**Perfect for:**
- Professional developers
- Freelancers
- Small teams (1-5 devs)
- Production applications

**Price:** $29/month or $290/year (save $58)

### Everything in FREE, Plus:

#### Advanced Analysis
- ✅ **ML Predictions** - AI-powered bug detection
  - Potential null references
  - Unused variables
  - Performance bottlenecks
  - Security vulnerabilities
- ✅ **Security Scanning** - OWASP Top 10 checks
  - Hardcoded secrets detection
  - SQL injection patterns
  - XSS vulnerabilities
- ✅ **Performance Analysis** - Runtime optimization
  - Inefficient loops
  - Memory leaks
  - N+1 queries
- ✅ **Circular Dependency Detection** - Module graph analysis
- ✅ **Network Error Detection** - API/fetch error handling

#### Automation
- ✅ **Auto-Fix Suggestions** - One-click fixes
  - Import organization
  - Type annotations
  - Formatting corrections
- ✅ **CI/CD Integration** - GitHub Actions, GitLab CI
- ✅ **Webhook Support** - Real-time notifications

#### Reporting
- ✅ **Advanced Metrics** - Complexity scores, maintainability index
- ✅ **Historical Trends** - Track improvements over time
- ✅ **Export Formats** - PDF, CSV, HTML

#### Support
- ✅ **Priority Email Support** - 24-48 hour response
- ✅ **Bug Fixes Priority** - Fast-tracked patches
- ✅ **Feature Requests** - Voting on roadmap

### Limits

- **Projects:** 10 max
- **Analyses:** 1,000/month
- **Storage:** 10 GB
- **API Rate:** 1,000 requests/hour
- **Team Size:** 1-5 users
- **License Transfer:** Yes (1 per month)

---

## 🏢 ENTERPRISE Plan

**Perfect for:**
- Large teams (5+ devs)
- Organizations
- Mission-critical applications
- Compliance requirements

**Price:** $299/month or $2,990/year (save $598)

### Everything in PRO, Plus:

#### Custom Analysis
- ✅ **Custom Rules Engine** - Define company-specific rules
  - Naming conventions
  - Architecture patterns
  - Code style enforcement
- ✅ **Custom Detectors** - Write your own analysis plugins
- ✅ **Rule Templates** - Industry-specific rule sets (HIPAA, SOC2, PCI-DSS)

#### Collaboration
- ✅ **Team Workspaces** - Shared projects, rules
- ✅ **Role-Based Access** - Admin, Developer, Viewer roles
- ✅ **Code Review Integration** - Inline comments, approvals
- ✅ **Shared Reports** - Team dashboards

#### Security & Compliance
- ✅ **SSO/SAML** - Okta, Azure AD, Google Workspace
- ✅ **Audit Logs** - Complete activity history
- ✅ **IP Whitelisting** - Network-level security
- ✅ **SOC 2 Compliance** - Certified secure
- ✅ **GDPR Ready** - Data privacy controls

#### Deployment Options
- ✅ **On-Premise** - Self-hosted in your infrastructure
- ✅ **Private Cloud** - Dedicated instance
- ✅ **Air-Gap** - Offline installations
- ✅ **White-Label** - Custom branding

#### Enterprise Support
- ✅ **Dedicated Support** - <4 hour response (24/7)
- ✅ **Onboarding Session** - 2-hour setup call
- ✅ **Training Sessions** - Team workshops
- ✅ **Account Manager** - Direct contact
- ✅ **SLA Guarantee** - 99.9% uptime

### Limits

- **Projects:** Unlimited
- **Analyses:** Unlimited
- **Storage:** 100 GB (expandable)
- **API Rate:** 10,000 requests/hour
- **Team Size:** Unlimited users
- **License Transfer:** Unlimited

---

## 🎯 Feature Slugs (for API)

Use these slugs with `canAccessFeature()`:

### FREE Tier
```typescript
'basic-detectors'
'problems-panel'
'typescript-analysis'
'eslint-integration'
'import-checks'
'community-support'
```

### PRO Tier (includes all FREE)
```typescript
'ml-predictions'
'auto-fix'
'advanced-detectors'
'security-scanning'
'performance-analysis'
'circular-dependency-detection'
'priority-support'
```

### ENTERPRISE Tier (includes all PRO)
```typescript
'custom-rules'
'team-sharing'
'sso-saml'
'audit-logs'
'dedicated-support'
'on-premise-deployment'
'unlimited-users'
```

---

## 💡 Choosing the Right Plan

### Choose FREE if:
- 👨‍💻 You're an individual developer
- 🎓 Learning ODAVL for the first time
- 🧪 Running proof-of-concept projects
- 💸 Budget is $0

### Choose PRO if:
- 🚀 Building production applications
- 👥 Working in a small team (1-5)
- 🤖 Need ML-powered predictions
- ⚡ Want auto-fix suggestions
- 📊 Require advanced metrics
- 💼 Professional/freelance developer

### Choose ENTERPRISE if:
- 🏢 Large organization (5+ devs)
- 🔐 Need SSO/SAML authentication
- 📜 Compliance requirements (SOC2, HIPAA)
- 🎨 Custom rules/detectors needed
- 🌐 On-premise deployment required
- 🆘 Need dedicated support

---

## 📈 Upgrade Path

```
FREE → PRO → ENTERPRISE
```

- ✅ **Instant Upgrades** - No downtime
- ✅ **Prorated Billing** - Pay only for remaining days
- ✅ **Data Preserved** - All projects/history retained
- ✅ **Downgrade Anytime** - No penalties (data archived after 30 days)

---

## 🔄 Annual Billing Discounts

| Plan | Monthly | Yearly | Savings |
|------|---------|--------|---------|
| PRO | $29/mo | $290/yr | $58 (17%) |
| ENTERPRISE | $299/mo | $2,990/yr | $598 (17%) |

---

## 🎁 Add-Ons (Coming Soon)

- **Extra Storage:** $10/50GB per month
- **Extra Users:** $15/user per month (PRO), $25/user (ENTERPRISE)
- **Extra Analyses:** $0.01/analysis (overage)
- **Priority Queue:** $50/month (faster analysis)

---

## 📞 Contact

**Questions about plans?**
- Email: sales@odavlstudio.com
- Chat: https://odavlstudio.com/chat
- Enterprise Demo: https://odavlstudio.com/demo

**Need a custom plan?**
Contact our sales team for volume discounts, educational pricing, or custom enterprise agreements.

---

**Last Updated:** November 22, 2025  
**Version:** 1.0.0
