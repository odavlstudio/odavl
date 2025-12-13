# @odavl/insight-cli

Standalone command-line interface for ODAVL Insight code quality and security analysis.

## Installation

```bash
# Install globally
npm install -g @odavl/insight-cli

# Or use locally in a project
npm install --save-dev @odavl/insight-cli
```

## Usage

```bash
# Analyze current directory
odavl-insight analyze

# Analyze specific path
odavl-insight analyze ./src

# Analyze with JSON output
odavl-insight analyze --format json

# Analyze only changed files (git)
odavl-insight analyze --changed-only

# CI mode (deterministic, sequential execution)
odavl-insight analyze --ci --format json --fail-level high
```

## Command Reference

### `analyze [path]`

Analyze code for quality and security issues.

**Arguments:**
- `path` - Path to analyze (default: current directory)

**Options:**

- `-f, --format <format>` - Output format: `human`, `json`, `sarif` (default: `human`)
- `--fail-level <level>` - Minimum severity to fail with exit code 1: `critical`, `high`, `medium`, `low`, `info` (default: `high`)
- `--detectors <detectors>` - Comma-separated list of detectors to run (e.g., `typescript,security,performance`)
- `--changed-only` - Only analyze files changed in git
- `--ci` - CI mode: deterministic, sequential execution

**Exit Codes:**
- `0` - Success (no issues at or above fail-level)
- `1` - Issues found at or above fail-level
- `2` - Internal error (analysis failed)

## Examples

### GitHub Actions

```yaml
- name: Run ODAVL Insight
  run: |
    npx @odavl/insight-cli analyze \
      --format sarif \
      --fail-level high \
      --ci \
      > insight-results.sarif

- name: Upload SARIF
  uses: github/codeql-action/upload-sarif@v2
  with:
    sarif_file: insight-results.sarif
```

### GitLab CI

```yaml
insight:
  script:
    - npx @odavl/insight-cli analyze --format json --fail-level high --ci
  artifacts:
    reports:
      codequality: insight-results.json
```

### Pre-commit Hook

```bash
#!/bin/bash
# .git/hooks/pre-commit

odavl-insight analyze --changed-only --fail-level medium
```

## Output Formats

### Human (Default)

Pretty-printed, colored output for terminal viewing:

```
🔍 ODAVL Insight Analysis
═══════════════════════════════════════════════════════════

Summary:
  Files analyzed:    45
  Duration:          2341ms
  Total issues:      12

Issues by Severity:
  High:      3
  Medium:    6
  Low:       3

Top Issues:
  src/utils/auth.ts
    HIGH      12:5       Hardcoded API key detected
    MEDIUM    45:8       Unsafe regex pattern
```

### JSON

Machine-readable JSON for programmatic consumption:

```json
{
  "issues": [
    {
      "file": "src/utils/auth.ts",
      "line": 12,
      "column": 5,
      "severity": "high",
      "message": "Hardcoded API key detected",
      "detector": "security",
      "ruleId": "SEC001"
    }
  ],
  "summary": {
    "critical": 0,
    "high": 3,
    "medium": 6,
    "low": 3,
    "info": 0,
    "total": 12
  },
  "metadata": {
    "analyzedFiles": 45,
    "duration": 2341,
    "detectors": ["typescript", "security", "performance"]
  }
}
```

### SARIF

GitHub Code Scanning compatible format:

```json
{
  "version": "2.1.0",
  "$schema": "https://raw.githubusercontent.com/oasis-tcs/sarif-spec/master/Schemata/sarif-schema-2.1.0.json",
  "runs": [
    {
      "tool": {
        "driver": {
          "name": "ODAVL Insight",
          "version": "1.0.0"
        }
      },
      "results": [...]
    }
  ]
}
```

## Available Detectors

By default, all detectors run. Use `--detectors` to specify a subset:

- `typescript` - TypeScript type checking and best practices
- `security` - Security vulnerabilities and hardcoded secrets
- `performance` - Performance anti-patterns
- `complexity` - Cyclomatic and cognitive complexity
- `circular` - Circular dependency detection
- `import` - Import/export issues
- `package` - Package.json validation
- `runtime` - Runtime error patterns
- `build` - Build configuration issues
- `network` - Network and API call patterns
- `isolation` - Test isolation issues

## Development

```bash
# Install dependencies
pnpm install

# Build
pnpm build

# Run tests
pnpm test

# Run in dev mode
pnpm dev analyze ./src
```

## License

MIT License - see LICENSE file for details

## Related Packages

- [@odavl-studio/insight-core](../core) - Core analysis engine
- [@odavl-studio/cli](../../../apps/studio-cli) - Unified ODAVL CLI
- [@odavl/sdk](../../../packages/sdk) - TypeScript SDK

## Support

- Documentation: https://odavl.dev/docs
- Issues: https://github.com/ODAVL/odavl/issues
- Discord: https://discord.gg/odavl
