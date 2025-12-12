# Changelog

All notable changes to the ODAVL Studio CLI will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2025-12-12

### Added

#### Core Commands
- **`odavl insight analyze`**: Run code analysis with 16 specialized detectors
  - Local mode (offline, FREE plan)
  - Cloud mode (online, PRO/TEAM/ENTERPRISE plans)
  - Detector selection (`--detectors typescript,security`)
  - Output formats (json, markdown, html, sarif)
  - Report export to file or dashboard
- **`odavl autopilot run`**: Execute self-healing O-D-A-V-L cycle
  - Automatic code improvements with safety constraints
  - Undo/rollback support
  - Recipe trust scoring
  - Dry-run mode for preview
- **`odavl guardian test`**: Pre-deploy testing and quality gates
  - Accessibility, performance, security testing
  - Multi-environment support
  - Quality gate enforcement
- **`odavl auth login/logout/signup`**: Authentication management
  - GitHub/Google OAuth integration
  - API key management
  - Session persistence
- **`odavl plan`**: View/upgrade subscription plans
  - Current plan details
  - Usage and quota information
  - Upgrade workflow
- **`odavl config`**: Configuration management
  - Set API endpoint, token, telemetry preferences
  - Local config file management (`.odavl/config.json`)
  - Environment variable support

#### Insight Commands
- `odavl insight analyze` - Main analysis command
- `odavl insight detectors` - List available detectors
- `odavl insight history` - View analysis history (cloud mode)
- `odavl insight projects` - Manage projects (cloud mode)
- `odavl insight export` - Export results to various formats

#### Autopilot Commands
- `odavl autopilot run` - Execute O-D-A-V-L cycle
- `odavl autopilot observe` - Run observe phase only
- `odavl autopilot decide` - Run decide phase only
- `odavl autopilot act` - Run act phase only
- `odavl autopilot verify` - Run verify phase only
- `odavl autopilot learn` - Run learn phase only
- `odavl autopilot undo` - Rollback last changes
- `odavl autopilot recipes` - Manage improvement recipes

#### Guardian Commands
- `odavl guardian test` - Run all tests
- `odavl guardian accessibility` - Run accessibility tests
- `odavl guardian performance` - Run performance tests
- `odavl guardian security` - Run security tests
- `odavl guardian report` - Generate test report

#### Global Flags
- `--version` / `-v` - Show CLI version
- `--help` / `-h` - Show help for any command
- `--json` - Output in JSON format
- `--verbose` - Enable verbose logging
- `--no-color` - Disable colored output
- `--config <path>` - Use custom config file

### Features

#### Multi-Language Support
- **TypeScript/JavaScript**: ESLint, TypeScript compiler, import cycles
- **Python**: mypy, flake8, bandit security scanner
- **Java**: Compilation errors, stream API, exception patterns
- **Ruby**: RuboCop, Rails patterns, security (in progress)
- **PHP**: PHPStan, security, performance (in progress)
- **Swift**: SwiftLint, memory management (in progress)
- **Kotlin**: Detekt, coroutines, patterns (in progress)
- **Go**: vet, staticcheck (planned)
- **Rust**: clippy, ownership (planned)

#### 16 Specialized Detectors
1. **TypeScript** - Type errors, strict mode violations, never types
2. **ESLint** - Code quality, style, best practices
3. **Security** - Hardcoded secrets, SQL injection, XSS, insecure deps
4. **Performance** - N+1 queries, inefficient algorithms, memory leaks
5. **Complexity** - Cyclomatic, cognitive complexity
6. **Circular** - Import cycle detection
7. **Import** - Unused imports, missing dependencies
8. **Package** - Outdated deps, security vulnerabilities
9. **Runtime** - Uncaught exceptions, promise rejections
10. **Build** - Compilation errors, missing assets
11. **Network** - Slow API calls, failed requests
12. **Isolation** - Side effects in tests, global state
13. **Database** - Schema issues, query performance (PRO+)
14. **Infrastructure** - Config errors, resource limits (TEAM+)
15. **CI/CD** - Pipeline failures, flaky tests (TEAM+)
16. **Next.js** - SSR errors, image optimization (planned)

#### Cloud Integration (PRO+)
- **Project History**: View past analysis runs in dashboard
- **Team Collaboration**: Share issues, comments, assignments
- **Trend Analysis**: Track metrics over time (error rates, complexity)
- **Custom Detectors**: Upload organization-specific rules
- **Priority Inbox**: ML-ranked issues by impact
- **Slack/Email Alerts**: Get notified of critical issues

#### Telemetry & Privacy
- **Privacy-First**: No source code transmitted (only metadata)
- **Opt-Out**: `odavl config set telemetry.enabled false`
- **Anonymous Usage Stats**: Detector usage, analysis duration
- **GDPR Compliant**: Data retention policies, right to delete

#### CI/CD Integration
- **GitHub Actions**: Pre-built workflow templates
- **GitLab CI**: Pipeline examples
- **CircleCI**: Orb available
- **Jenkins**: Plugin (in progress)
- **Exit Codes**: Non-zero exit on errors (for CI failure)

### Examples

#### Quick Start
```bash
# Install CLI
npm install -g @odavl/cli

# Run local analysis
odavl insight analyze

# Sign up for cloud features
odavl auth signup

# Run cloud analysis
odavl insight analyze --cloud
```

#### GitHub Actions
```yaml
name: Code Quality
on: [push, pull_request]
jobs:
  analyze:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm install -g @odavl/cli
      - run: odavl auth login --api-key ${{ secrets.ODAVL_API_KEY }}
      - run: odavl insight analyze --cloud --fail-on-critical
```

#### Pre-Commit Hook
```bash
#!/bin/bash
# .git/hooks/pre-commit
odavl insight analyze --detectors typescript,security
if [ $? -ne 0 ]; then
  echo "❌ ODAVL Insight found critical issues. Fix before committing."
  exit 1
fi
```

### Performance
- **Local Analysis**: <5 seconds for 100 files
- **Cloud Analysis**: <30 seconds for 1000 files
- **Memory Usage**: <200MB for typical projects
- **Startup Time**: <500ms (optimized with lazy loading)

### Dependencies
- `@odavl-studio/insight-core@1.0.0` - Analysis engine
- `@odavl-studio/autopilot-engine@1.0.0` - Self-healing engine
- `@odavl-studio/guardian-core@1.0.0` - Testing engine
- `commander@^11.0.0` - CLI framework
- `chalk@^5.0.0` - Terminal colors
- `ora@^6.0.0` - Spinners and progress
- `inquirer@^9.0.0` - Interactive prompts

### Breaking Changes
- N/A (first release)

### Known Issues
- Python detector may have false positives (experimental)
- Large monorepos (>10K files) require `--chunk-size` flag
- Windows PowerShell 5.x not fully supported (use PowerShell 7+)
- WSL2 file watching may be slow (use native Windows)

### Migration Guide
- N/A (first release)

---

## [Unreleased]

### Planned for v1.1
- [ ] `odavl doctor` - Diagnose CLI/environment issues
- [ ] `odavl init` - Interactive project setup wizard
- [ ] `odavl diff` - Compare two analysis runs
- [ ] `odavl fix` - AI-powered auto-fix suggestions
- [ ] WebAssembly detectors for 10x faster analysis
- [ ] Custom detector authoring via `odavl create-detector`

---

## Version History

- **1.0.0** (2025-12-12) - Initial production release

---

For more details, see the [full documentation](https://docs.odavl.studio/cli).
