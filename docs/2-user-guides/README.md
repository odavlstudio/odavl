# 📖 User Guides

**Comprehensive guides** for using ODAVL Studio products effectively.

---

## 🔍 ODAVL Insight - Error Detection

### [Insight User Guide](./insight-user-guide.md)
Complete guide to using ML-powered error detection:
- **12 Specialized Detectors**: TypeScript, ESLint, Import, Package, Runtime, Build, Security, Circular, Network, Performance, Complexity, Isolation
- **VS Code Integration**: Real-time analysis in Problems Panel
- **Cloud Dashboard**: Visualize error trends
- **CLI Usage**: Interactive and automated analysis

**Quick Start:**
```bash
# Interactive mode
pnpm odavl:insight

# Specific detectors
odavl insight analyze --detectors typescript,security
```

---

## 🤖 ODAVL Autopilot - Self-Healing

### Autopilot User Guide (Coming Soon)
Learn how to use autonomous code improvement:
- **O-D-A-V-L Cycle**: Observe → Decide → Act → Verify → Learn
- **Risk Budget**: Safe automated changes
- **Undo System**: Restore any change
- **Recipe Management**: Custom improvement recipes
- **Trust Scores**: ML-based recipe selection

**Quick Start:**
```bash
# Run full cycle
odavl autopilot run --max-files 10

# Check governance
cat .odavl/gates.yml
```

---

## 🛡️ ODAVL Guardian - Pre-Deploy Testing

### Guardian User Guide (Coming Soon)
Quality gates before deployment:
- **Accessibility Testing**: WCAG compliance
- **Performance Testing**: Lighthouse scores
- **Security Scanning**: Vulnerability detection
- **Compliance Checking**: Policy enforcement

**Quick Start:**
```bash
# Run pre-deploy tests
odavl guardian test https://example.com
```

---

## 🎮 CLI Reference

### [Command-Line Interface](./cli-reference.md)
Complete CLI documentation:

```bash
# Unified CLI
odavl <product> <command> [options]

# Examples:
odavl insight analyze --detectors all
odavl autopilot run --max-files 10
odavl guardian test https://app.example.com
```

**Global Options:**
- `--help` - Show help
- `--version` - Show version
- `--verbose` - Enable debug logging
- `--json` - JSON output format

---

## 🔌 VS Code Extension Guide

### Extension Features

**ODAVL Insight Extension:**
- ✅ Real-time error detection on file save
- ✅ Problems Panel integration
- ✅ Click-to-navigate to errors
- ✅ Export diagnostics to `.odavl/problems-panel-export.json`

**ODAVL Autopilot Extension:**
- ✅ Auto-opens run ledgers
- ✅ FileSystemWatcher on `.odavl/ledger/run-*.json`
- ✅ Governance panel
- ✅ Recipe management

**ODAVL Guardian Extension:**
- ✅ Quality gates monitoring
- ✅ Test result visualization
- ✅ Pre-deploy checklist

### Installation

1. Open VS Code
2. Extensions (Ctrl+Shift+X)
3. Search "ODAVL"
4. Install desired extensions

### Configuration

```json
{
  "odavl.enablePerfMetrics": true,
  "odavl.autoOpenLedger": true,
  "odavl.maxAutoChanges": 10
}
```

---

## 📊 Common Workflows

### Workflow 1: Daily Code Quality Check

```bash
# Morning routine
odavl insight analyze --detectors all
pnpm test
pnpm forensic:all
```

### Workflow 2: Automated Improvement

```bash
# Let Autopilot improve code
odavl autopilot run --max-files 10

# Review changes
cat .odavl/ledger/latest.json

# Undo if needed
odavl autopilot undo
```

### Workflow 3: Pre-Deploy Checklist

```bash
# Run full test suite
pnpm test:all

# Security scan
odavl insight analyze --detectors security

# Performance check
odavl guardian test https://staging.example.com

# Deploy!
pnpm deploy
```

---

## 🎯 Best Practices

### Error Detection
1. **Run on file save** - Enable auto-analysis in VS Code
2. **Focus on critical** - Start with security, then TypeScript, then ESLint
3. **Export to JSON** - Use `.odavl/problems-panel-export.json` for CI
4. **Review trends** - Check Insight Cloud dashboard weekly

### Autopilot Usage
1. **Start small** - Use `--max-files 3` initially
2. **Review changes** - Check ledger before committing
3. **Update recipes** - Add custom improvement patterns
4. **Monitor trust scores** - Remove failing recipes

### Guardian Integration
1. **Pre-deploy** - Always run before production deployment
2. **Automate** - Add to CI/CD pipeline
3. **Track metrics** - Monitor performance over time
4. **Set gates** - Enforce minimum scores

---

## 🔗 Related Resources

- **[Getting Started](../1-getting-started/)** - Installation guide
- **[Developer Guides](../3-developer-guides/)** - Architecture and contributing
- **[Language Support](../4-language-support/)** - TypeScript, Python, Java
- **[Deployment](../5-deployment/)** - Production deployment

---

## ❓ Need Help?

- 📖 Read specific product guides above
- 💬 Join [Discord Community](https://discord.gg/odavl)
- 🐛 Report [GitHub Issues](https://github.com/your-org/odavl/issues)
- 📧 Email support@odavl.io

---

**Last Updated:** November 24, 2025
