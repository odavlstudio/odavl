# ODAVL Studio Documentation Index

Welcome to the comprehensive documentation for **ODAVL Studio** - the autonomous code quality platform with ML-powered error detection, self-healing capabilities, and pre-deploy testing.

## 📚 Complete Documentation Library

### Getting Started (New Users Start Here!)

- **[Getting Started Guide](./GETTING_STARTED.md)** ⭐ - Quick 5-minute setup and first analysis
- **[Installation Guide](./GETTING_STARTED.md#installation)** - Step-by-step installation instructions
- **[Quick Start](./GETTING_STARTED.md#5-minute-quick-start)** - Get running in 5 minutes

### Core References

#### CLI Documentation

- **[CLI Reference](./CLI_REFERENCE.md)** - Complete command reference (~15,000 words)
  - Installation & setup
  - All commands (Insight, Autopilot, Guardian)
  - Configuration files
  - Troubleshooting guide
  
- **[CLI Integration Guide](./CLI_INTEGRATION.md)** - CI/CD integration (~6,000 words)
  - GitHub Actions, GitLab CI, Azure DevOps, Jenkins
  - Docker containers
  - IDE integration
  - Best practices

#### SDK Documentation

- **[SDK Reference](./SDK_REFERENCE.md)** - Complete TypeScript API (~18,000 words)
  - Installation & setup
  - 19 interfaces, 40+ methods
  - All product APIs (Insight, Autopilot, Guardian)
  - Error handling patterns
  - Complete code examples

- **[SDK Integration Guide](./SDK_INTEGRATION.md)** - Real-world integrations (~7,500 words)
  - Next.js integration
  - Express.js integration
  - GitHub App integration
  - VS Code extension integration
  - Testing patterns

### Architecture & Design

- **[Architecture Complete](./ARCHITECTURE_COMPLETE.md)** - Full system architecture (~1,800 words)
  - System overview
  - Three product architectures
  - Data flows & schemas
  - Security model
  - Deployment patterns

- **[Design Patterns](./DESIGN_PATTERNS.md)** - Core architectural patterns (~3,200 words)
  - Monorepo patterns
  - Dual export strategy
  - Detector pattern
  - O-D-A-V-L pipeline
  - Safety patterns (Risk Guard, Undo, Attestation)
  - Performance patterns

### Development Standards

- **[Best Practices](./BEST_PRACTICES.md)** - Development standards (~3,500 words)
  - TypeScript strict mode
  - ESLint configuration
  - Testing best practices (AAA pattern, 80%+ coverage)
  - Performance optimization
  - Error handling
  - Git workflow (Conventional Commits)
  - Documentation standards

- **[Security Guide](./SECURITY_GUIDE.md)** - Security implementation (~3,800 words)
  - 5-layer security architecture
  - JWT & RBAC implementation
  - Input validation (path traversal, injection prevention)
  - Secret management & rotation
  - Encryption (AES-256 at rest, TLS 1.3 in transit)
  - Autopilot security (Risk Budget, Undo, Attestation)
  - Incident response

### Video Tutorials

All scripts located in `docs/videos/` with timing, visuals, and code examples:

- **[ODAVL Studio Introduction](./videos/ODAVL_STUDIO_INTRO.md)** (5 min) - Platform overview
- **[Insight Quick Start](./videos/INSIGHT_QUICK_START.md)** (10 min) - First analysis tutorial
- **[Autopilot Workflow](./videos/AUTOPILOT_WORKFLOW.md)** (15 min) - Self-healing deep dive
- **[Guardian Testing](./videos/GUARDIAN_TESTING.md)** (10 min) - Pre-deploy quality gates

### Community Documentation

- **[Contributing Guide](./CONTRIBUTING.md)** - How to contribute (~4,500 words)
  - Development setup
  - Project structure
  - Branching strategy & commit conventions
  - Adding new features (detectors, CLI commands, extension features)
  - Testing guidelines
  - Pull request process

- **[Code of Conduct](./CODE_OF_CONDUCT.md)** - Community standards (~2,000 words)
  - Contributor Covenant v2.1
  - Reporting process
  - Enforcement guidelines

## 🎯 Quick Navigation by Role

### 👨‍💻 For Developers

**New to ODAVL?**
1. [Getting Started Guide](./GETTING_STARTED.md)
2. [ODAVL Studio Introduction Video](./videos/ODAVL_STUDIO_INTRO.md)
3. [Insight Quick Start Video](./videos/INSIGHT_QUICK_START.md)

**Building with ODAVL?**
1. [SDK Integration Guide](./SDK_INTEGRATION.md)
2. [Best Practices](./BEST_PRACTICES.md)
3. [Security Guide](./SECURITY_GUIDE.md)

### ⚙️ For DevOps Engineers

**Setting up CI/CD?**
1. [CLI Integration Guide](./CLI_INTEGRATION.md)
2. [Architecture Complete](./ARCHITECTURE_COMPLETE.md#deployment)
3. [Security Guide](./SECURITY_GUIDE.md)

### 🤝 For Contributors

**Contributing to ODAVL?**
1. [Code of Conduct](./CODE_OF_CONDUCT.md)
2. [Contributing Guide](./CONTRIBUTING.md)
3. [Design Patterns](./DESIGN_PATTERNS.md)

### 👔 For Team Leads

**Evaluating ODAVL?**
1. [ODAVL Studio Introduction Video](./videos/ODAVL_STUDIO_INTRO.md)
2. [Architecture Complete](./ARCHITECTURE_COMPLETE.md)
3. [Security Guide](./SECURITY_GUIDE.md)

## 📖 Documentation by Product

### ODAVL Insight - ML-Powered Error Detection

**12 Specialized Detectors:**
TypeScript • ESLint • Import • Package • Runtime • Build • Security • Circular • Network • Performance • Complexity • Isolation

**Key Docs:**
- [Insight Quick Start Video](./videos/INSIGHT_QUICK_START.md)
- [CLI Reference - Insight](./CLI_REFERENCE.md#insight-commands)
- [SDK Reference - Insight](./SDK_REFERENCE.md#insight-api)

### ODAVL Autopilot - Self-Healing Code

**O-D-A-V-L Cycle:**
Observe → Decide → Act → Verify → Learn

**Triple Safety:**
Risk Budget Guard • Undo Snapshots • Attestation Chain

**Key Docs:**
- [Autopilot Workflow Video](./videos/AUTOPILOT_WORKFLOW.md)
- [CLI Reference - Autopilot](./CLI_REFERENCE.md#autopilot-commands)
- [Design Patterns - O-D-A-V-L](./DESIGN_PATTERNS.md#4-o-d-a-v-l-pipeline-pattern)

### ODAVL Guardian - Pre-Deploy Quality Gates

**4 Test Suites:**
Accessibility (90%+) • Performance (80%+) • Security (95%+) • Functional (E2E)

**Key Docs:**
- [Guardian Testing Video](./videos/GUARDIAN_TESTING.md)
- [CLI Reference - Guardian](./CLI_REFERENCE.md#guardian-commands)

## 🛠️ Common Use Cases

### Use Case 1: CI/CD Integration

**Goal:** Automate analysis on every commit/PR

**Quick Start:**
```yaml
# .github/workflows/odavl.yml
- run: pnpm dlx @odavl-studio/cli insight analyze --detectors all
- run: pnpm dlx @odavl-studio/cli guardian test --url staging.example.com
```

**Full Guide:** [CLI Integration](./CLI_INTEGRATION.md)

### Use Case 2: VS Code Extension

**Goal:** Real-time error detection in editor

**Quick Start:**
1. Install from VS Code Marketplace
2. Save file (Ctrl+S) to trigger analysis
3. View results in Problems Panel

**Full Guide:** [Getting Started - VS Code](./GETTING_STARTED.md#vs-code-extension)

### Use Case 3: SDK Integration

**Goal:** Embed ODAVL in your own tools

**Quick Start:**
```typescript
import { ODAVLInsight } from '@odavl-studio/sdk/insight';
const insight = new ODAVLInsight();
const results = await insight.analyzeWorkspace('./project');
```

**Full Guide:** [SDK Integration](./SDK_INTEGRATION.md)

### Use Case 4: Automated Code Healing

**Goal:** Let Autopilot automatically fix errors

**Quick Start:**
```bash
odavl autopilot run --max-files 5
cat .odavl/ledger/latest.json  # Review changes
odavl autopilot undo           # Rollback if needed
```

**Full Guide:** [Autopilot Workflow Video](./videos/AUTOPILOT_WORKFLOW.md)

### Use Case 5: Pre-Deploy Quality Gates

**Goal:** Block deployment if quality thresholds not met

**Quick Start:**
```bash
odavl guardian test https://staging.example.com \
  --accessibility-threshold 90 \
  --performance-threshold 80 \
  --security-threshold 95
```

**Full Guide:** [Guardian Testing Video](./videos/GUARDIAN_TESTING.md)

## 📊 Documentation Statistics

### Total Coverage

- **Total Words**: ~86,000 words
- **Documentation Files**: 15 files
- **Code Examples**: 200+ examples
- **Video Scripts**: 4 tutorials (~40 min total)
- **API Interfaces**: 19 documented
- **Methods/Functions**: 40+ documented

### By Category

| Category | Files | Word Count |
|----------|-------|------------|
| CLI Documentation | 2 | 21,000 |
| SDK Documentation | 2 | 25,500 |
| Getting Started | 1 | 6,000 |
| Video Scripts | 4 | 15,000 |
| Architecture | 2 | 5,000 |
| Standards | 2 | 7,300 |
| Community | 2 | 6,000 |

### Coverage Checklist

- ✅ Installation & Setup
- ✅ CLI Commands (all products)
- ✅ SDK APIs (all products)
- ✅ Architecture & Design
- ✅ Security & Best Practices
- ✅ Community & Contributing
- ✅ Video Tutorials
- ✅ Integration Guides

## 🎓 Learning Paths

### Beginner Path (2-3 hours)

1. Watch [ODAVL Studio Introduction](./videos/ODAVL_STUDIO_INTRO.md) (5 min)
2. Read [Getting Started](./GETTING_STARTED.md) (15 min)
3. Watch [Insight Quick Start](./videos/INSIGHT_QUICK_START.md) (10 min)
4. Practice: Install and run first analysis (30 min)
5. Read [CLI Reference](./CLI_REFERENCE.md) basics (20 min)

### Intermediate Path (4-6 hours)

1. Complete Beginner Path
2. Watch [Autopilot Workflow](./videos/AUTOPILOT_WORKFLOW.md) (15 min)
3. Watch [Guardian Testing](./videos/GUARDIAN_TESTING.md) (10 min)
4. Read [CLI Integration Guide](./CLI_INTEGRATION.md) (30 min)
5. Read [SDK Integration Guide](./SDK_INTEGRATION.md) (45 min)
6. Practice: Integrate with CI/CD (2 hours)

### Advanced Path (8-12 hours)

1. Complete Intermediate Path
2. Read [Architecture Complete](./ARCHITECTURE_COMPLETE.md) (1 hour)
3. Read [Design Patterns](./DESIGN_PATTERNS.md) (45 min)
4. Read [Security Guide](./SECURITY_GUIDE.md) (45 min)
5. Read [Contributing Guide](./CONTRIBUTING.md) (1 hour)
6. Practice: Build custom detector (4 hours)

## 🔍 Search Index

### By Technology

- **TypeScript**: [CLI Ref](./CLI_REFERENCE.md) • [SDK Ref](./SDK_REFERENCE.md) • [Best Practices](./BEST_PRACTICES.md)
- **Next.js**: [SDK Integration - Next.js](./SDK_INTEGRATION.md#nextjs-integration)
- **Express**: [SDK Integration - Express](./SDK_INTEGRATION.md#express-integration)
- **GitHub Actions**: [CLI Integration - GitHub](./CLI_INTEGRATION.md#github-actions)
- **Docker**: [CLI Integration - Docker](./CLI_INTEGRATION.md#docker-containers)

### By Error Type

- **Type Errors**: [Insight Video](./videos/INSIGHT_QUICK_START.md) • [TypeScript Detector](./CLI_REFERENCE.md#insight-commands)
- **Security Issues**: [Security Guide](./SECURITY_GUIDE.md) • [Security Detector](./CLI_REFERENCE.md#insight-commands)
- **Performance**: [Performance Detector](./CLI_REFERENCE.md#insight-commands) • [Best Practices - Perf](./BEST_PRACTICES.md#performance)
- **Build Failures**: [Build Detector](./CLI_REFERENCE.md#insight-commands) • [CLI Integration](./CLI_INTEGRATION.md)

### By Task

- **Setup**: [Getting Started](./GETTING_STARTED.md)
- **CI/CD**: [CLI Integration](./CLI_INTEGRATION.md)
- **Build App**: [SDK Integration](./SDK_INTEGRATION.md)
- **Contribute**: [Contributing](./CONTRIBUTING.md)
- **Deploy**: [Architecture](./ARCHITECTURE_COMPLETE.md#deployment)
- **Train ML**: [Contributing - ML](./CONTRIBUTING.md#training-ml-models)

## 📞 Getting Help

### Documentation Issues

Found an error? Have a suggestion?

1. Check [GitHub Issues](https://github.com/odavl/odavl/issues)
2. Create issue with label `documentation`

### Technical Support

- **GitHub Discussions**: https://github.com/odavl/odavl/discussions
- **Discord**: [invite link]
- **Email**: support@odavl.com

### Contributing

Want to improve the docs?

1. Read [Contributing Guide](./CONTRIBUTING.md)
2. Fork repository
3. Make changes
4. Submit PR with label `documentation`

## 📝 Documentation Metadata

**Version:** v2.0 (matches ODAVL Studio v2.0)  
**Last Updated:** January 9, 2025  
**Status:** ✅ Complete (Phase 1 Week 4)

**Changelog:**
- **v2.0** (Jan 2025): Complete rewrite, added videos, 86K words
- **v1.2** (Dec 2024): Added SDK Integration
- **v1.1** (Nov 2024): Added CLI Integration
- **v1.0** (Oct 2024): Initial release

---

**Happy coding with ODAVL Studio!** 🚀

Latest updates: [odavl.com](https://odavl.com) • [@odavl_studio](https://twitter.com/odavl_studio)
