# ODAVL CLI - Production-Ready Code Analysis

**Version**: 2.0.0  
**Status**: Production-Ready (Phase 8 Complete)

> Transform your codebase with ML-powered error detection. Analyze locally or in the cloud with plan-based features.

---

## ✨ Features

- 🔍 **16 Detectors**: TypeScript, Security, Performance, Complexity, and more
- ☁️ **Cloud Analysis**: Run analyses in ODAVL Cloud with history and collaboration
- 💻 **Local Mode**: Works offline, no auth required for basic analysis
- 📊 **Plan Awareness**: Clear limits and upgrade paths (FREE → PRO → ENTERPRISE)
- 🚀 **Fast**: File-level parallelism (4-16x speedup)
- 🎨 **Polished UX**: Colors, icons, progress bars, boxed summaries
- 📈 **Status Tracking**: View recent local + cloud analysis history

---

## 🚀 Quick Start

### Installation

```bash
npm install -g @odavl-studio/cli
```

### Basic Usage

```bash
# Local analysis (no auth needed)
odavl insight analyze

# Cloud analysis with history
odavl auth login
odavl insight analyze --cloud

# Fast parallel analysis
odavl insight analyze --file-parallel --max-workers 4

# Check status
odavl insight status

# View plan and limits
odavl insight plan
```

---

## 📚 Commands

### **Insight - Error Detection**

#### `odavl insight analyze`
Analyze workspace with ML-powered detectors

**Options**:
- `--cloud` - Run in ODAVL Cloud with history (requires PRO+)
- `--detectors <list>` - Comma-separated detector names (e.g., `typescript,security`)
- `--severity <min>` - Minimum severity: `info|low|medium|high|critical` (default: `low`)
- `--file-parallel` - Enable file-level parallelism (4-16x speedup)
- `--max-workers <n>` - Number of parallel workers (default: CPU cores / 2)
- `--json` - Output as JSON
- `--html` - Generate HTML report
- `--md` - Generate Markdown report
- `--output <path>` - Output file path
- `--files <glob>` - File patterns to analyze
- `--dir <folder>` - Directory to analyze (default: current)
- `--strict` - Exit with error if issues found
- `--silent` - Minimal output
- `--debug` - Show debug information

**Examples**:
```bash
# Local analysis
odavl insight analyze

# Cloud analysis
odavl insight analyze --cloud

# Specific detectors
odavl insight analyze --detectors typescript,security,performance

# Fast analysis with parallelism
odavl insight analyze --file-parallel --max-workers 8

# JSON output for CI/CD
odavl insight analyze --json --output results.json --strict
```

---

#### `odavl insight status`
Show last analysis status (local + cloud)

**Options**:
- `--json` - Output as JSON
- `--last <n>` - Show last N analyses

**Example Output**:
```
📊 ODAVL Insight Analysis Status

💻 Local Analysis:
   Timestamp: 12/10/2025, 3:45 PM
   Issues:    23
   Critical:  2 CRITICAL

☁️  Cloud Analysis:
   Timestamp: 12/10/2025, 2:30 PM
   Issues:    47
   Critical:  3 CRITICAL
   Dashboard: https://cloud.odavl.studio/insight/analyses/anl_xyz123
```

---

#### `odavl insight plan`
Show current plan and limits

**Options**:
- `--json` - Output as JSON

**Example Output**:
```
Current Plan: INSIGHT_PRO ($49/month)

Limits & Quotas:
  Cloud Analyses: 47 / ∞ this month
  Max Files:      ∞ per analysis
  History:        90 days

Enabled Detectors (16):
  typescript       security         performance
  complexity       circular         import
  package          runtime          build
  network          isolation        python-types
  python-security  python-complex   cve-scanner
  nextjs

Features:
  ✅ Cloud analysis with history
  ✅ All 16 detectors
  ✅ 90-day history retention
  ✅ Priority support
  ✅ Team collaboration

Need more? Run: odavl insight plans
```

---

#### `odavl insight plans`
Compare all available plans

Shows detailed comparison table of FREE, PRO, ENTERPRISE, and CUSTOM plans.

---

#### `odavl insight detectors`
List all available detectors

**Example Output**:
```
Available Detectors (16):

Stable (11):
  • typescript       - TypeScript errors and type issues
  • security         - Security vulnerabilities (XSS, SQL injection)
  • performance      - Performance bottlenecks
  • complexity       - Code complexity metrics
  • circular         - Circular dependencies
  • import           - Import/export issues
  • package          - Package.json issues
  • runtime          - Runtime error patterns
  • build            - Build configuration issues
  • network          - Network request issues
  • isolation        - Module isolation problems

Experimental (3):
  • python-types     - Python type hint validation
  • python-security  - Python security issues
  • python-complex   - Python code complexity

Not Implemented (2):
  • cve-scanner      - CVE vulnerability scanning
  • nextjs           - Next.js specific issues
```

---

### **Auth - Authentication**

#### `odavl auth login`
Sign in to ODAVL Cloud

Opens browser for OAuth authentication (GitHub or Google). Uses device code flow for CLI.

**Example Flow**:
```
$ odavl auth login

Opening browser for authentication...

Visit: https://cloud.odavl.studio/device
Enter code: ABCD-EFGH

Waiting for authorization...

✅ Signed in as john@example.com
✅ Current plan: INSIGHT_PRO
✅ Token expires: 12/17/2025
```

---

#### `odavl auth status`
Show authentication status

**Example Output**:
```
✅ Authenticated

User:     john@example.com
Plan:     INSIGHT_PRO
Expires:  12/17/2025 (7 days remaining)
API Key:  odavl_••••••••••••••••••1234
```

---

#### `odavl auth logout`
Sign out of ODAVL Cloud

Clears stored credentials.

---

## 🎯 Plan Comparison

| Feature | FREE | PRO | ENTERPRISE | CUSTOM |
|---------|------|-----|------------|--------|
| **Price** | $0/mo | $49/mo | $499/mo | Contact |
| **Detectors** | 5 basic | All 16 | All 16 | All + Custom |
| **Cloud Analysis** | ❌ | ✅ | ✅ | ✅ |
| **History Retention** | 7 days | 90 days | Unlimited | Unlimited |
| **Max Files** | 50 | Unlimited | Unlimited | Unlimited |
| **Team Collaboration** | ❌ | ❌ | ✅ | ✅ |
| **API Access** | ❌ | ❌ | ✅ | ✅ |
| **Priority Support** | ❌ | ✅ | ✅ | ✅ |
| **Custom Detectors** | ❌ | ❌ | ❌ | ✅ |
| **SSO** | ❌ | ❌ | ✅ | ✅ |
| **On-Premise** | ❌ | ❌ | ❌ | ✅ |
| **SLA** | ❌ | ❌ | ❌ | ✅ |

**Upgrade**: Visit https://cloud.odavl.studio/pricing

---

## 🔧 Configuration

### Environment Variables

```bash
# Cloud API URL (default: https://cloud.odavl.studio)
export ODAVL_CLOUD_URL="https://cloud.odavl.studio"

# Disable telemetry (optional)
export ODAVL_TELEMETRY_DISABLED=true
```

### Config File

Create `.odavl/config.json` in your project:

```json
{
  "detectors": ["typescript", "security", "performance"],
  "severity": "medium",
  "exclude": ["node_modules", "dist", "build"],
  "maxFiles": 500
}
```

---

## 📊 CI/CD Integration

### GitHub Actions

```yaml
name: ODAVL Analysis

on: [push, pull_request]

jobs:
  analyze:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Install ODAVL CLI
        run: npm install -g @odavl-studio/cli
      
      - name: Run Analysis
        env:
          ODAVL_API_KEY: ${{ secrets.ODAVL_API_KEY }}
        run: |
          odavl insight analyze --cloud --json --output results.json --strict
      
      - name: Upload Results
        uses: actions/upload-artifact@v3
        with:
          name: odavl-results
          path: results.json
```

### GitLab CI

```yaml
odavl-analyze:
  stage: test
  image: node:18
  script:
    - npm install -g @odavl-studio/cli
    - odavl insight analyze --cloud --json --output results.json --strict
  artifacts:
    reports:
      codequality: results.json
```

---

## 🐛 Troubleshooting

### "Not authenticated" error

```bash
# Sign in first
odavl auth login

# Check status
odavl auth status
```

### "Cloud analysis requires PRO plan"

```bash
# Check current plan
odavl insight plan

# View upgrade options
odavl insight plans

# Upgrade via dashboard
open https://cloud.odavl.studio/pricing
```

### "Analysis timeout" error

```bash
# Increase timeout (for large projects)
odavl insight analyze --cloud --timeout 600

# Or use local analysis
odavl insight analyze --file-parallel
```

### Performance issues

```bash
# Enable parallel analysis
odavl insight analyze --file-parallel --max-workers 8

# Reduce scope
odavl insight analyze --files "src/**/*.ts" --severity medium
```

---

## 📖 Documentation

- **CLI Reference**: https://docs.odavl.studio/cli
- **API Documentation**: https://docs.odavl.studio/api
- **VS Code Extension**: https://marketplace.visualstudio.com/items?itemName=odavl.insight
- **SDK**: https://docs.odavl.studio/sdk

---

## 🤝 Support

- **GitHub Issues**: https://github.com/odavlstudio/odavl/issues
- **Discord**: https://discord.gg/odavl
- **Email**: support@odavl.studio
- **Documentation**: https://docs.odavl.studio

---

## 📝 License

MIT License - see [LICENSE](LICENSE) file for details.

---

## 🎉 What's New in v2.0.0

**Phase 8: Global Launch Complete**

- ✨ **Cloud Integration**: Run analyses in ODAVL Cloud with `--cloud` flag
- 📊 **Status Tracking**: New `odavl insight status` command
- 🎨 **Polished UX**: Colors, icons, progress bars, boxed summaries
- 📈 **Plan Awareness**: Clear limits and upgrade prompts
- 🚀 **Fast Analysis**: File-level parallelism (4-16x speedup)
- 📚 **Better Help**: Comprehensive examples in `--help`
- 🔒 **Zero Breaking Changes**: Local analysis works exactly as before

**Previous Phases**:
- Phase 1: Product configuration and entitlements
- Phase 2: Stripe billing integration
- Phase 3: ODAVL ID authentication
- Phase 4: Cloud backend with job queue
- Phase 5: Next.js dashboard
- Phase 6: VS Code extension v2
- Phase 7: TypeScript SDK

See [CHANGELOG.md](CHANGELOG.md) for full release history.

---

**Made with ❤️ by the ODAVL Studio Team**
