# 📚 ODAVL Studio Documentation

**Welcome to ODAVL Studio** - Your unified platform for autonomous code quality and self-healing infrastructure.

---

## 🚀 Quick Links

- **[Getting Started](./1-getting-started/)** - Installation, setup, and first steps
- **[User Guides](./2-user-guides/)** - How to use ODAVL products
- **[Developer Guides](./3-developer-guides/)** - Contributing and architecture
- **[Language Support](./4-language-support/)** - TypeScript, Python, Java detectors
- **[Deployment](./5-deployment/)** - Production deployment guides
- **[Security](./6-security/)** - Security best practices
- **[API Reference](./7-api-reference/)** - Complete API documentation
- **[Blog](./8-blog/)** - Technical articles and tutorials
- **[Project Management](./9-project-management/)** - Roadmap and milestones

---

## 🎯 What is ODAVL Studio?

ODAVL Studio is a **unified platform** with three distinct products:

### 1. 🔍 ODAVL Insight - ML-Powered Error Detection
Real-time error detection with machine learning, supporting:
- **12 Specialized Detectors**: TypeScript, ESLint, Import, Package, Runtime, Build, Security, Circular, Network, Performance, Complexity, Isolation
- **VS Code Integration**: Problems Panel with click-to-navigate
- **Cloud Dashboard**: Next.js 15 with PostgreSQL/Prisma

**Quick Start:** [Insight User Guide](./2-user-guides/insight-user-guide.md)

### 2. 🤖 ODAVL Autopilot - Self-Healing Code Infrastructure
Autonomous code improvement following the O-D-A-V-L cycle:
- **Observe**: Detect quality issues
- **Decide**: Choose best improvement recipe
- **Act**: Apply changes safely
- **Verify**: Validate improvements
- **Learn**: Update trust scores

**Features:**
- ✅ Risk Budget Guard (max 10 files/cycle)
- ✅ Undo Snapshots (restore any change)
- ✅ Attestation Chain (cryptographic audit trail)

### 3. 🛡️ ODAVL Guardian - Pre-Deploy Testing & Monitoring
Quality gates before deployment:
- Accessibility testing
- Performance testing (Lighthouse)
- Security scanning
- Compliance checking

---

## 📖 Documentation Structure

### 1. [Getting Started](./1-getting-started/)
- **[Installation](./1-getting-started/)** - Install ODAVL Studio
- **[Quick Start](./1-getting-started/quick-start.md)** - 5-minute tutorial
- **[Configuration](./1-getting-started/)** - Configure your workspace

### 2. [User Guides](./2-user-guides/)
- **[Insight User Guide](./2-user-guides/insight-user-guide.md)** - Using error detection
- **[CLI Reference](./2-user-guides/cli-reference.md)** - Command-line interface
- **[VS Code Extension](./2-user-guides/)** - Extension features

### 3. [Developer Guides](./3-developer-guides/)
- **[Architecture](./3-developer-guides/architecture.md)** - System design
- **[Contributing](./3-developer-guides/contributing.md)** - How to contribute
- **[API Reference](./3-developer-guides/api-reference.md)** - REST API docs
- **[Development Setup](./3-developer-guides/)** - Local setup

### 4. [Language Support](./4-language-support/)
- **[TypeScript](./4-language-support/)** - TypeScript detector
- **[Python](./4-language-support/python.md)** - Python detector (23 rules)
- **[Java](./4-language-support/java.md)** - Java detector (15 rules)

### 5. [Deployment](./5-deployment/)
- **[Production Checklist](./5-deployment/production-checklist.md)** - 80+ launch items
- **[CI/CD Setup](./5-deployment/ci-cd-setup.md)** - GitHub Actions
- **[Deployment Runbook](./5-deployment/)** - Step-by-step

### 6. [Security](./6-security/)
- **[Security Guide](./6-security/security-guide.md)** - Best practices
- **[Secret Management](./6-security/)** - Environment variables

### 7. [API Reference](./7-api-reference/)
- **[SDK Reference](./7-api-reference/)** - TypeScript SDK
- **[ML System Guide](./7-api-reference/)** - ML training

### 8. [Blog](./8-blog/)
Technical articles, tutorials, and case studies

### 9. [Project Management](./9-project-management/)
- **[Roadmap](./9-project-management/roadmap.md)** - Current roadmap
- **[Phase 1 Complete](./9-project-management/phase-1-complete.md)** - Technical foundation
- **[Phase 2 Complete](./9-project-management/phase-2-complete.md)** - Language expansion
- **[Recent Milestones](./9-project-management/)** - Week 10, 11, 12

### 10. [Archive](./10-archive/)
Historical reports, deprecated docs, old plans

---

## 🏗️ Architecture Overview

```
ODAVL Studio (pnpm monorepo)
├── odavl-studio/
│   ├── insight/        # ML-powered error detection
│   ├── autopilot/      # Self-healing engine
│   └── guardian/       # Pre-deploy testing
├── apps/
│   ├── studio-cli/     # Unified CLI
│   └── studio-hub/     # Marketing website
└── packages/
    ├── sdk/            # Public TypeScript SDK
    ├── auth/           # JWT authentication
    └── types/          # TypeScript interfaces
```

---

## 📊 Current Status

**Phase 1: Technical Foundation** ✅ 100% Complete
- 29/29 packages building
- 314/314 tests passing

**Phase 2: Infrastructure & Security** ✅ 100% Complete
- Week 7-12 all complete
- Production ready (Nov 24, 2025)

**Phase 3: Language Expansion** ✅ 100% Complete
- 23 code detectors
- TypeScript, Python, Java support

---

## 🤝 Contributing

We welcome contributions! See our [Contributing Guide](./3-developer-guides/contributing.md).

---

## 📄 License

MIT License - See [LICENSE](../LICENSE) for details.

---

**Need Help?**
- 📖 Read the [Getting Started Guide](./1-getting-started/)
- 💬 Join our [Discord Community](https://discord.gg/odavl)
- 🐛 Report bugs on [GitHub Issues](https://github.com/your-org/odavl/issues)

---

**Last Updated:** November 24, 2025

### For Developers

- **Build Validation Guides** - Troubleshooting build issues
- **Quality Gate Documentation** - Understanding quality thresholds
- **Historical Context** - Learning from past development cycles

### For Stakeholders

- **Enterprise Certifications** - Production launch approvals
- **Security Compliance** - Security audit results
- **System Analysis** - Performance and quality metrics

---

## 🔄 Maintenance

This documentation structure is maintained as part of the repository cleanup and organization effort. All documents have been:

- ✅ Categorized by purpose and audience
- ✅ Organized for easy navigation
- ✅ Preserved for historical reference
- ✅ Linked to maintain context relationships

---

## 📈 Usage Guidelines

1. **Start with certifications/** for production-related questions
2. **Check decisions/** for understanding technical choices
3. **Use troubleshooting/** for resolving issues
4. **Reference archive/** for historical context

*Documentation consolidated: 2025-01-09*
*Cleanup Phase: S3 Archive & Consolidate*
