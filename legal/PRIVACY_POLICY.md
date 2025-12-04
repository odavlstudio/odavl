# ODAVL Studio Privacy Policy

**Effective Date:** January 1, 2025  
**Last Updated:** January 9, 2025

## Overview

ODAVL Studio ("we," "us," or "our") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our autonomous code quality improvement service.

**Key Principles:**

- **Opt-in by Default**: All telemetry collection requires explicit consent
- **Minimal Data Collection**: We collect only what's necessary for service delivery
- **Local-First**: Quality metrics stored locally whenever possible
- **Transparent Processing**: Clear explanation of all data handling practices

## Information We Collect

### 1. Account Information

- **Registration Data**: Email address, company name, billing information
- **Authentication**: Login credentials, session tokens
- **Subscription**: Plan type, usage limits, billing history

### 2. Code Quality Metrics (Optional)

With your explicit consent, we may collect:

- **ESLint Metrics**: Warning counts, error counts, rule violations
- **TypeScript Metrics**: Type error counts, compilation status
- **Improvement Deltas**: Before/after quality measurements
- **Recipe Performance**: Success rates of automated fixes

**Important**: Code content is NEVER collected or transmitted. Only statistical metrics are processed.

### 3. Usage Analytics (Optional)

With your explicit consent:

- **CLI Usage**: Command execution frequency, feature usage patterns
- **VS Code Extension**: UI interactions, configuration preferences
- **Website Analytics**: Page views, time on site (via Plausible.io)

### 4. Technical Information

- **Error Reports**: Crash logs, error stack traces (when explicitly submitted)
- **Performance Metrics**: Response times, system resource usage
- **Security Logs**: Authentication attempts, rate limiting events

## How We Use Your Information

### Service Delivery

- Provide autonomous code quality improvements
- Generate quality reports and recommendations
- Authenticate and authorize access to features
- Process billing and subscription management

### Product Improvement

- Analyze usage patterns to improve feature effectiveness
- Develop new automated fix recipes
- Optimize performance and reliability
- Conduct security monitoring and threat detection

### Communication

- Send service notifications and security alerts
- Provide customer support and technical assistance
- Share product updates and feature announcements (opt-in)

## Data Storage and Security

### Security Measures

- **Encryption**: All data encrypted in transit (TLS 1.3) and at rest (AES-256)
- **Access Controls**: Role-based access with multi-factor authentication
- **Security Headers**: Comprehensive CSP, HSTS, and security policies
- **Regular Audits**: Quarterly security assessments and penetration testing

### Data Retention

- **Account Data**: Retained for duration of active subscription
- **Quality Metrics**: 24 months maximum retention for analytics
- **Error Logs**: 90 days maximum retention for debugging
- **Billing Records**: 7 years retention for tax/legal compliance

### Data Location

- **Primary Storage**: United States (AWS US-East-1)
- **EU Customers**: Data residency options available for enterprise plans
- **Local Storage**: Quality reports stored locally in `.odavl/` and `reports/` directories

## Your Privacy Rights

### GDPR Rights (EU Residents)

- **Access**: Request copies of your personal data
- **Rectification**: Correct inaccurate or incomplete information
- **Erasure**: Request deletion of your personal data
- **Portability**: Export your data in machine-readable format
- **Restriction**: Limit how we process your information
- **Objection**: Opt out of certain data processing activities

### California Privacy Rights (CCPA)

- **Right to Know**: Categories of personal information collected
- **Right to Delete**: Request deletion of personal information
- **Right to Opt-Out**: Opt out of sale of personal information (we don't sell data)
- **Non-Discrimination**: Equal service regardless of privacy choices

### Exercising Your Rights

Contact our Data Protection Officer at privacy@odavl.studio or use the privacy dashboard in your account settings.

## Telemetry Controls

### CLI Telemetry

```bash
# Disable all telemetry (default)
pnpm odavl:config telemetry --disable

# Enable basic metrics only
pnpm odavl:config telemetry --enable-basic

# Enable full analytics (requires explicit consent)
pnpm odavl:config telemetry --enable-all
```

### VS Code Extension

Telemetry controls available in VS Code settings:

- `odavl.telemetry.enabled`: Master telemetry toggle
- `odavl.telemetry.crashReports`: Error reporting only
- `odavl.telemetry.usageMetrics`: Feature usage analytics

### Website Analytics

- **Cookie-Free**: Plausible.io analytics with no tracking cookies
- **Anonymized**: No personal identifiers collected
- **Opt-Out**: Respect Do Not Track browser settings

## Third-Party Services

### Payment Processing

- **Stripe**: Billing and subscription management (PCI DSS compliant)
- **Data Shared**: Billing information, subscription status

### Analytics

- **Plausible.io**: Privacy-friendly website analytics
- **Data Shared**: Anonymized page views, no personal information

### Infrastructure

- **AWS**: Cloud hosting and data storage
- **Vercel**: Website hosting and CDN
- **GitHub**: Code repository hosting (for open source components)

## Children's Privacy

ODAVL Studio is not intended for use by individuals under 13 years of age. We do not knowingly collect personal information from children under 13.

## International Transfers

Personal data may be transferred to countries outside your residence. We ensure adequate protection through:

- **Standard Contractual Clauses**: EU-approved data transfer mechanisms
- **Adequacy Decisions**: Transfers only to countries with adequate privacy laws
- **Data Processing Agreements**: Contractual protections for enterprise customers

## Changes to This Policy

We may update this Privacy Policy periodically. Material changes will be communicated via:

- Email notification to registered users
- Prominent notice on our website
- In-product notifications for significant changes

Continued use of ODAVL Studio after policy updates constitutes acceptance of changes.

## Contact Information

**Data Protection Officer**  
Email: privacy@odavl.studio  
Address: [Legal Review Required - Add Company Address]

**General Privacy Questions**  
Email: support@odavl.studio  
Phone: +1 (555) 123-ODAVL

**EU Representative** (for GDPR compliance)  
[Legal Review Required - Appoint EU representative if serving EU customers]

---

*This Privacy Policy is a template and requires professional legal review before production deployment. Consult with qualified legal counsel for jurisdiction-specific compliance requirements.*
