# Python CLI Usage Guide

**ODAVL Insight - Python Command-Line Interface**  
**Version:** 2.0  
**Last Updated:** November 23, 2025

---

## Table of Contents

1. [Quick Start](#quick-start)
2. [Command Reference](#command-reference)
3. [Usage Examples](#usage-examples)
4. [Output Formats](#output-formats)
5. [Advanced Usage](#advanced-usage)
6. [Integration Examples](#integration-examples)

---

## Quick Start

### Basic Commands

```bash
# Analyze current directory with all Python detectors
odavl insight analyze --language python

# Analyze specific directory
odavl insight analyze --language python /path/to/project

# Analyze with specific detectors
odavl insight analyze --language python --detectors type,security

# Show supported languages
odavl insight list-languages

# Get help
odavl insight --help
```

---

## Command Reference

### `odavl insight analyze`

Analyze Python code for issues and vulnerabilities.

**Syntax:**
```bash
odavl insight analyze [options]
```

**Options:**

| Option | Short | Type | Description | Default |
|--------|-------|------|-------------|---------|
| `--language` | `-l` | string | Language to analyze | `typescript` |
| `--detectors` | `-d` | string | Comma-separated detector list | `all` |
| `--format` | `-f` | string | Output format (console, json, xml) | `console` |
| `--output` | `-o` | string | Output file path | `stdout` |
| `--severity` | `-s` | string | Minimum severity (critical, high, medium, low) | `low` |
| `--fix` | | boolean | Apply auto-fixes | `false` |
| `--cache` | | boolean | Use cached results | `false` |
| `--changed-only` | | boolean | Analyze only changed files (Git) | `false` |
| `--verbose` | `-v` | boolean | Verbose output | `false` |

**Examples:**

```bash
# All detectors, console output
odavl insight analyze --language python

# Specific detectors
odavl insight analyze -l python -d type,security

# JSON output to file
odavl insight analyze -l python -f json -o results.json

# Only critical/high severity
odavl insight analyze -l python -s high

# With auto-fixes
odavl insight analyze -l python --fix

# Verbose mode
odavl insight analyze -l python -v
```

---

### `odavl insight list-languages`

List supported programming languages.

**Syntax:**
```bash
odavl insight list-languages
```

**Output:**
```
Supported Languages:
  ✓ typescript (12 detectors)
  ✓ python (5 detectors)
  ✗ java (coming soon)
  ✗ go (planned)
```

---

### `odavl insight list-detectors`

List available detectors for a language.

**Syntax:**
```bash
odavl insight list-detectors --language <lang>
```

**Example:**
```bash
$ odavl insight list-detectors --language python

Python Detectors:
  type              MyPy type checking
  security          Bandit security scanning
  complexity        Radon complexity analysis
  imports           isort import organization
  best-practices    Pylint PEP 8 compliance
```

---

## Usage Examples

### Example 1: First-Time Analysis

```bash
# Step 1: Navigate to your Python project
cd ~/projects/my-python-app

# Step 2: Run analysis
odavl insight analyze --language python

# Output:
⠙ Analyzing workspace...
✔ 🐍 Python Type: 15 issues found
✔ 🐍 Python Security: 3 issues found
✔ 🐍 Python Complexity: 1 issue found
✔ 🐍 Python Imports: 8 issues found
✔ 🐍 Python Best Practices: 24 issues found

Analysis Summary:
  Critical: 1
  High: 10
  Medium: 8
  Low: 32
  Total: 51 issues

Top Issues:
  1. SQL injection in get_user() [app.py:42] - CRITICAL
  2. Missing type hints [utils.py:15] - HIGH
  3. Function too complex (CC=12) [validator.py:78] - MEDIUM
```

---

### Example 2: Security-Focused Analysis

```bash
# Focus on security vulnerabilities only
odavl insight analyze -l python -d security -s high

# Output:
✔ 🐍 Python Security: 3 issues found

Critical Issues (1):
  1. SQL injection vulnerability [app.py:42]
     Query: f"SELECT * FROM users WHERE id = {user_id}"
     Fix: Use parameterized queries

High Issues (2):
  2. Command injection risk [utils.py:58]
     Code: os.system(f"echo {user_input}")
     Fix: Use subprocess with shell=False
  
  3. Hardcoded API key [config.py:12]
     Code: API_KEY = "sk-1234..."
     Fix: Use environment variables
```

---

### Example 3: Type Checking Only

```bash
# Analyze type safety
odavl insight analyze -l python -d type

# Output:
✔ 🐍 Python Type: 15 issues found

Missing Type Hints (10):
  1. def process_data(items): [utils.py:10]
  2. def calculate_total(amounts): [calculator.py:25]
  3. def validate_email(email): [validator.py:42]
  ...

Type Mismatches (5):
  1. Expected int, got str [app.py:78]
  2. Expected list, got None [parser.py:103]
  ...

Run 'odavl insight analyze -l python -d type --fix' to auto-fix.
```

---

### Example 4: Full Analysis with Auto-Fix

```bash
# Analyze and apply fixes automatically
odavl insight analyze -l python --fix

# Output:
⠙ Analyzing workspace...
✔ Analysis complete: 51 issues found

⠙ Applying auto-fixes...
✔ Fixed 30 issues (59%)
⚠ 21 issues require manual review

Fixed Issues:
  ✓ Added type hints (15 files)
  ✓ Sorted imports (8 files)
  ✓ Fixed line length (12 files)
  ✓ Removed unused imports (5 files)

Manual Review Required:
  ⚠ 1 SQL injection (critical)
  ⚠ 2 command injection (high)
  ⚠ 1 high complexity function (medium)
  ⚠ 17 other issues

Files Modified: 23
Total Fixes Applied: 30

Review changes with: git diff
```

---

## Output Formats

### Console Output (Default)

```bash
odavl insight analyze -l python
```

**Features:**
- ✅ Color-coded severity
- ✅ Progress indicators
- ✅ Summary table
- ✅ Top issues highlighted
- ✅ Performance metrics

---

### JSON Output

```bash
odavl insight analyze -l python -f json -o results.json
```

**Structure:**
```json
{
  "timestamp": "2025-11-23T10:30:00Z",
  "language": "python",
  "summary": {
    "total": 51,
    "critical": 1,
    "high": 10,
    "medium": 8,
    "low": 32
  },
  "issues": [
    {
      "detector": "security",
      "category": "sql-injection",
      "severity": "critical",
      "file": "app.py",
      "line": 42,
      "column": 12,
      "message": "SQL injection vulnerability detected",
      "code": "query = f\"SELECT * FROM users WHERE id = {user_id}\"",
      "recommendation": "Use parameterized queries",
      "cwe": "CWE-89",
      "autoFixable": true
    }
  ],
  "performance": {
    "duration": 1850,
    "filesAnalyzed": 42,
    "linesOfCode": 5570
  }
}
```

**Use Cases:**
- CI/CD pipelines
- Automated reporting
- Integration with other tools
- Custom dashboards

---

### XML Output

```bash
odavl insight analyze -l python -f xml -o results.xml
```

**Structure:**
```xml
<?xml version="1.0" encoding="UTF-8"?>
<analysis>
  <timestamp>2025-11-23T10:30:00Z</timestamp>
  <language>python</language>
  <summary>
    <total>51</total>
    <critical>1</critical>
    <high>10</high>
    <medium>8</medium>
    <low>32</low>
  </summary>
  <issues>
    <issue>
      <detector>security</detector>
      <category>sql-injection</category>
      <severity>critical</severity>
      <file>app.py</file>
      <line>42</line>
      <message>SQL injection vulnerability detected</message>
    </issue>
  </issues>
</analysis>
```

---

## Advanced Usage

### 1. Analyze Only Changed Files (Git Integration)

```bash
# Analyze only files changed in current branch
odavl insight analyze -l python --changed-only

# Output:
Changed files detected: 3
  app.py
  utils.py
  models.py

Analyzing changed files only...
✔ Found 8 issues in 3 files
```

---

### 2. Custom Severity Filtering

```bash
# Only show critical and high severity issues
odavl insight analyze -l python -s high

# Only show critical issues
odavl insight analyze -l python -s critical
```

---

### 3. Combine Multiple Detectors

```bash
# Type checking + Security scanning
odavl insight analyze -l python -d type,security

# Everything except best practices
odavl insight analyze -l python -d type,security,complexity,imports
```

---

### 4. Cache Results for Performance

```bash
# First run: Analyze and cache
odavl insight analyze -l python --cache

# Subsequent runs: Use cache (much faster)
odavl insight analyze -l python --cache

# Clear cache
odavl insight cache clear
```

---

### 5. Verbose Mode for Debugging

```bash
# Enable verbose output
odavl insight analyze -l python -v

# Output:
[DEBUG] Loading configuration from .odavl/python-config.json
[DEBUG] Detected Python version: 3.11.5
[DEBUG] Running MyPy detector...
[DEBUG] MyPy found 15 issues in 870ms
[DEBUG] Running Bandit detector...
[DEBUG] Bandit found 3 issues in 620ms
...
```

---

## Integration Examples

### CI/CD Pipeline (GitHub Actions)

```yaml
name: Python Analysis
on: [push, pull_request]

jobs:
  analyze:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Python
        uses: actions/setup-python@v4
        with:
          python-version: '3.11'
      
      - name: Install Python tools
        run: pip install mypy bandit radon isort pylint
      
      - name: Install ODAVL CLI
        run: npm install -g @odavl-studio/cli
      
      - name: Run analysis
        run: |
          odavl insight analyze \
            --language python \
            --format json \
            --output results.json
      
      - name: Check for critical issues
        run: |
          CRITICAL=$(jq '.summary.critical' results.json)
          if [ "$CRITICAL" -gt 0 ]; then
            echo "❌ Critical issues found!"
            exit 1
          fi
      
      - name: Upload results
        uses: actions/upload-artifact@v3
        with:
          name: analysis-results
          path: results.json
```

---

### Pre-commit Hook

```bash
# .git/hooks/pre-commit
#!/bin/bash

echo "Running ODAVL Python analysis..."

# Analyze changed Python files only
odavl insight analyze \
  --language python \
  --changed-only \
  --severity high

if [ $? -ne 0 ]; then
  echo "❌ Analysis failed! Fix issues before committing."
  exit 1
fi

echo "✅ Analysis passed!"
```

---

### Docker Integration

```dockerfile
# Dockerfile
FROM python:3.11-slim

# Install Node.js for ODAVL CLI
RUN apt-get update && apt-get install -y nodejs npm

# Install Python analysis tools
RUN pip install mypy bandit radon isort pylint

# Install ODAVL CLI
RUN npm install -g @odavl-studio/cli

# Copy project
COPY . /app
WORKDIR /app

# Run analysis
CMD ["odavl", "insight", "analyze", "--language", "python"]
```

**Usage:**
```bash
docker build -t my-python-analyzer .
docker run my-python-analyzer
```

---

### VS Code Task

```json
// .vscode/tasks.json
{
  "version": "2.0.0",
  "tasks": [
    {
      "label": "ODAVL: Analyze Python",
      "type": "shell",
      "command": "odavl",
      "args": [
        "insight",
        "analyze",
        "--language",
        "python"
      ],
      "group": {
        "kind": "build",
        "isDefault": true
      },
      "presentation": {
        "reveal": "always",
        "panel": "new"
      }
    }
  ]
}
```

**Run:** `Ctrl+Shift+B` → "ODAVL: Analyze Python"

---

## Performance Tips

### 1. Use Specific Detectors
```bash
# Faster: Only run what you need
odavl insight analyze -l python -d type,security

# Slower: All detectors
odavl insight analyze -l python
```

### 2. Enable Caching
```bash
# First run: 6.37s
odavl insight analyze -l python --cache

# Cached run: 0.85s (87% faster)
odavl insight analyze -l python --cache
```

### 3. Exclude Large Files
```json
// .odavl/python-config.json
{
  "exclude": [
    "venv/",
    ".venv/",
    "migrations/",
    "node_modules/"
  ]
}
```

### 4. Analyze Changed Files Only
```bash
# Full analysis: 6.37s (42 files)
odavl insight analyze -l python

# Changed only: 1.2s (3 files)
odavl insight analyze -l python --changed-only
```

---

## Related Documentation

- [Python Setup Guide](./PYTHON_SETUP_GUIDE.md) - Installation and configuration
- [Python Detector Reference](./PYTHON_DETECTOR_REFERENCE.md) - Detector details
- [Troubleshooting](./PYTHON_TROUBLESHOOTING.md) - Common issues
- [CI/CD Integration](./CI_CD_INTEGRATION.md) - Pipeline setup

---

**Need help?** Run `odavl insight --help` or join our [Discord](https://discord.gg/odavl)! 🚀
