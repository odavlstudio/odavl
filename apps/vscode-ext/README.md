
# ODAVL Doctor VS Code Extension

This extension provides a live monitoring panel for ODAVL (Observe-Decide-Act-Verify-Learn) autonomous code quality cycles.

## 📸 Visual Overview

> **Note**: Complete visual documentation available at [odavl.org/docs](https://odavl.org/docs)

- **Activity Bar Integration**: ODAVL icon with instant access to Dashboard, Recipes, Activity, Configuration, Control, and Intelligence views
- **Real-time Monitoring**: Live cycle visualization with color-coded phase indicators
- **Enterprise Dashboard**: Quality metrics, performance insights, and audit trails
- **Configuration Hub**: Visual management of safety gates and risk policies

---

## 🚀 Key Features

- **Live Cycle Monitoring**: Watch ODAVL cycles in real-time with color-coded phase indicators
- **Interactive Panel**: Click to run ODAVL cycles and view detailed logs
- **Structured Output**: Parse and display machine-readable ODAVL logs
- **Dashboard View**: Real-time system status, quality metrics, and performance insights
- **Recipes Library**: Curated automation patterns with trust scoring and success rates
- **Activity Monitor**: Complete audit trail of all autonomous improvements with timestamps
- **Configuration Hub**: Visual management of safety gates, risk policies, and system settings
- **Doctor Panel**: Live cycle monitoring with color-coded phase indicators and detailed logs
- **Zero-Risk Operations**: Configurable safety gates prevent any dangerous changes
- **Cryptographic Attestation**: Every improvement is digitally signed and verified
- **Shadow Testing**: All changes validated in isolated environments before deployment
- **Instant Rollback**: One-click undo system with complete state restoration
- **Policy Enforcement**: Customizable risk boundaries and protected file patterns
- **Trust-Based Decision Making**: Historical success rates guide autonomous choices
- **Pattern Recognition**: Learns from your codebase to suggest relevant improvements
- **Quality Trend Analysis**: Long-term metrics tracking with predictive insights
- **Custom Recipe Development**: Train the system with your team's coding standards
- **Live Cycle Visualization**: Watch Observe-Decide-Act-Verify-Learn phases in real-time
- **Interactive Controls**: Start, pause, and configure cycles with one-click convenience
- **Rich Notifications**: Desktop alerts for cycle completions and quality milestones
- **Performance Metrics**: Detailed timing, throughput, and improvement statistics

## 📖 Quick Start

### Installation

1. Install the ODAVL extension from the VS Code Marketplace
2. Open any workspace containing a `.odavl/` configuration directory
3. The ODAVL icon will appear in your Activity Bar automatically

### First Run

1. Click the **ODAVL icon** in the Activity Bar
2. Navigate to the **Dashboard** view to see system status
3. Open the **Doctor** panel and click **"Run ODAVL Cycle"**
4. Watch your code quality improve autonomously with full transparency

### Usage

1. Open Command Palette (`Ctrl+Shift+P` or `Cmd+Shift+P`)
2. Run command: `Open ODAVL Doctor Panel`
3. Click "Run ODAVL Cycle" to start monitoring
4. View live updates as ODAVL processes your code

### Configuration

Access the **Configuration** view in the Activity Bar to customize:

- **Safety Gates**: Set quality thresholds and error tolerance levels
- **Risk Policy**: Define change limits and protected file patterns
- **Trust Settings**: Configure machine learning parameters and recipe preferences
- **Notification Preferences**: Control alerts and update frequencies

## 🎯 Use Cases

### For Development Teams

- **Continuous Integration**: Automated quality gates that never sleep
- **Code Review Acceleration**: Pre-validated changes with confidence scores
- **Technical Debt Reduction**: Systematic elimination of quality issues
- **Standards Enforcement**: Consistent application of team coding standards

### For Engineering Leaders

- **Quality Metrics Dashboard**: Real-time visibility into codebase health
- **Trend Analysis**: Long-term quality trajectory with actionable insights
- **Risk Management**: Controlled automation with comprehensive audit trails
- **ROI Tracking**: Quantified developer productivity improvements

### For Enterprise Organizations

- **Compliance Automation**: Automated adherence to security and quality standards
- **Scale Management**: Quality maintenance across hundreds of repositories
- **Security Integration**: Continuous vulnerability detection and remediation
- **Audit Preparation**: Complete documentation of all code modifications

## 🛠️ System Requirements

- **VS Code**: Version 1.85.0 or higher
- **Node.js**: Version 18.x or higher
- **ODAVL CLI**: Installed and configured in your project
- **Operating System**: Windows, macOS, or Linux

## 🔧 Advanced Configuration

### Safety Gates Configuration (`.odavl/gates.yml`)

```yaml
quality_gates:
  typescript_errors: 0        # Zero tolerance for type errors
  eslint_warnings: unlimited  # Allow ESLint warnings
  test_coverage: 80           # Minimum 80% coverage requirement
  performance_budget: 5000ms  # Maximum build time threshold
```

### Risk Policy (`.odavl/policy.yml`)

```yaml
risk_limits:
  max_files_per_change: 10   # Maximum files modified per cycle
  max_lines_per_change: 40   # Maximum lines changed per cycle
  protected_patterns:        # Files that cannot be modified
    - "package.json"
    - "tsconfig.json"
    - "*.config.*"
```

## 📊 Performance & Analytics

ODAVL provides comprehensive metrics and analytics:

- **Quality Trend Analysis**: Track improvements over time with detailed charts
- **Productivity Metrics**: Measure developer time saved through automation
- **Risk Assessment**: Real-time evaluation of change safety and impact
- **Success Rate Tracking**: Historical performance of autonomous improvements
- **Custom KPIs**: Define and track metrics specific to your organization

## 🤝 Support & Community

- **Documentation**: [https://odavl.org/docs](https://odavl.org/docs)
- **GitHub Repository**: [https://github.com/odavl-org/odavl_studio](https://github.com/odavl-org/odavl_studio)
- **Issue Tracker**: [Report bugs and request features](https://github.com/odavl-org/odavl_studio/issues)
- **Community Forum**: [Join discussions and get help](https://github.com/odavl-org/odavl_studio/discussions)

## 📄 License

Licensed under the MIT License. See [LICENSE](LICENSE) for full details.

---

**Ready to transform your development workflow?** Install ODAVL today and experience the future of autonomous code quality management.
    - "*.config.*"
