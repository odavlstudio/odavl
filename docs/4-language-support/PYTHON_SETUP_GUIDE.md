# Python Analysis Setup Guide

**ODAVL Insight - Python Language Support**  
**Version:** 2.0  
**Last Updated:** November 23, 2025

---

## Table of Contents

1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Installation](#installation)
4. [Configuration](#configuration)
5. [Usage](#usage)
6. [Detectors Reference](#detectors-reference)
7. [Troubleshooting](#troubleshooting)
8. [Best Practices](#best-practices)

---

## Overview

ODAVL Insight provides comprehensive Python code analysis through 5 specialized detectors:

- **Type Detector** - Type safety via MyPy
- **Security Detector** - Vulnerability detection via Bandit
- **Complexity Detector** - Code complexity via Radon
- **Imports Detector** - Import organization via isort
- **Best Practices Detector** - PEP 8 compliance via Pylint

### Key Features

✅ **111 issues detected** across test files  
✅ **<2 second analysis time** (60% faster than target)  
✅ **Cross-platform** (Windows, macOS, Linux)  
✅ **CLI & VS Code integration**  
✅ **Auto-fix recommendations** for all issues

---

## Prerequisites

### System Requirements

- **Python:** 3.8 or higher (3.11 recommended)
- **pip:** Latest version
- **Node.js:** 18+ (for ODAVL CLI)
- **OS:** Windows 10+, macOS 11+, Ubuntu 20.04+

### Check Versions

```bash
python --version   # Should be 3.8+
pip --version      # Should be 20.0+
node --version     # Should be 18+
```

---

## Installation

### Step 1: Install ODAVL CLI

```bash
# Via npm (recommended)
npm install -g @odavl-studio/cli

# Or via pnpm
pnpm add -g @odavl-studio/cli

# Verify installation
odavl --version
```

### Step 2: Install Python Analysis Tools

All 5 detectors require their respective Python tools:

```bash
# Install all tools at once (recommended)
pip install mypy bandit radon isort pylint

# Or install individually:
pip install mypy      # Type checking
pip install bandit    # Security scanning
pip install radon     # Complexity analysis
pip install isort     # Import sorting
pip install pylint    # Best practices
```

### Step 3: Verify Tool Installation

```bash
mypy --version      # Should be 1.0.0+
bandit --version    # Should be 1.7.0+
radon --version     # Should be 5.0.0+
isort --version     # Should be 5.0.0+
pylint --version    # Should be 2.15.0+
```

---

## Configuration

### Global Configuration

Create configuration files in your project root:

#### 1. `mypy.ini` - Type Checking Configuration

```ini
[mypy]
python_version = 3.11
warn_return_any = True
warn_unused_configs = True
warn_redundant_casts = True
disallow_untyped_defs = True
disallow_incomplete_defs = True
check_untyped_defs = True
show_error_context = True
show_column_numbers = True
pretty = True

# Ignore missing imports for third-party libraries
ignore_missing_imports = True

# Strict optional checking
strict_optional = True
```

#### 2. `.radon.cfg` - Complexity Thresholds

```ini
[radon]
# Report complexity >= 5 (moderate)
cc_min = C

# Error on complexity >= 25 (very high)
cc_max = F

# Show detailed analysis
show_complexity = True
show_closures = True

# Exclude test files
exclude = tests/*,*_test.py
```

#### 3. `.isort.cfg` - Import Organization

```ini
[settings]
# Follow Black formatting
profile = black

# Line length to match PEP 8
line_length = 79

# Import sections
sections = FUTURE,STDLIB,THIRDPARTY,FIRSTPARTY,LOCALFOLDER

# Force alphabetical sorting
force_alphabetical_sort_within_sections = True

# Use hanging indent
multi_line_output = 3
include_trailing_comma = True
```

#### 4. `.pylintrc` - Best Practices Configuration

```ini
[MASTER]
jobs = 0
suggestion-mode = yes

[MESSAGES CONTROL]
# Disable specific checks (optional)
disable = C0111,  # missing-docstring
          R0903,  # too-few-public-methods
          W0511   # fixme

[FORMAT]
max-line-length = 79
indent-string = '    '

[BASIC]
# Naming conventions
good-names = i,j,k,ex,_
bad-names = foo,bar,baz

[DESIGN]
# Complexity thresholds
max-args = 5
max-locals = 15
max-branches = 12
max-statements = 50
```

### Project-Specific Configuration

For monorepos or specific projects, create `.odavl/` directory:

```bash
mkdir .odavl
cd .odavl
```

Create `python-config.json`:

```json
{
  "detectors": {
    "type": {
      "enabled": true,
      "config": "mypy.ini",
      "severity": "error"
    },
    "security": {
      "enabled": true,
      "severity": "error"
    },
    "complexity": {
      "enabled": true,
      "threshold": 5,
      "severity": "warning"
    },
    "imports": {
      "enabled": true,
      "config": ".isort.cfg",
      "severity": "warning"
    },
    "best-practices": {
      "enabled": true,
      "config": ".pylintrc",
      "severity": "info"
    }
  },
  "exclude": [
    "venv/",
    ".venv/",
    "__pycache__/",
    "*.pyc",
    "migrations/",
    "tests/"
  ]
}
```

---

## Usage

### Command Line Interface (CLI)

#### Basic Analysis

```bash
# Analyze current directory with all detectors
odavl insight analyze --language python

# Analyze specific directory
odavl insight analyze --language python /path/to/project

# Analyze with specific detectors only
odavl insight analyze --language python --detectors type,security
```

#### Detector-Specific Analysis

```bash
# Type checking only
odavl insight analyze --language python --detectors type

# Security scanning only
odavl insight analyze --language python --detectors security

# Multiple detectors
odavl insight analyze --language python --detectors type,security,complexity
```

#### Output Formats

```bash
# Default: Console output with colors
odavl insight analyze --language python

# JSON output for CI/CD
odavl insight analyze --language python --format json > results.json

# Export to file
odavl insight analyze --language python --output report.txt
```

### Example Output

```bash
$ odavl insight analyze --language python

⠙ Analyzing workspace...
✔ 🐍 Python Type: 35 issues found
✔ 🐍 Python Security: 10 issues found
✔ 🐍 Python Complexity: 2 issues found
✔ 🐍 Python Imports: 12 issues found
✔ 🐍 Python Best Practices: 52 issues found

Analysis Summary:
  Critical: 3
  High: 33
  Medium: 18
  Low: 56
  Total: 111 issues

Performance:
  Duration: 1.85s
  Files Analyzed: 5
  Lines of Code: 5,570

Top Issues:
  1. SQL injection in get_user() [test_security.py:8] - CRITICAL
  2. Missing type hints [test_types.py:4] - HIGH
  3. Function too complex (CC=10) [test_complexity.py:23] - MEDIUM

Run 'odavl insight fix --language python' to apply auto-fixes.
```

---

## Detectors Reference

### 1. Type Detector (MyPy)

**What it detects:**
- Missing type hints on functions/methods
- Type mismatches in assignments
- Incorrect return types
- Invalid type annotations

**Example Issue:**

```python
# ❌ Before (no type hints)
def process_data(items):
    return len(items)

# ✅ After (ODAVL fix)
def process_data(items: list) -> int:
    return len(items)
```

**Configuration:** `mypy.ini`  
**Severity:** Error  
**Performance:** ~700ms per test

### 2. Security Detector (Bandit)

**What it detects:**
- SQL injection vulnerabilities
- Command injection (shell=True)
- Hardcoded passwords/secrets
- Pickle deserialization
- Insecure random number generation

**Example Issue:**

```python
# ❌ Before (SQL injection risk)
def get_user(user_id):
    query = f"SELECT * FROM users WHERE id = {user_id}"
    return db.execute(query)

# ✅ After (ODAVL fix)
def get_user(user_id):
    query = "SELECT * FROM users WHERE id = ?"
    return db.execute(query, (user_id,))
```

**Configuration:** Built-in  
**Severity:** Critical/Error  
**Performance:** ~620ms per test

### 3. Complexity Detector (Radon)

**What it detects:**
- High cyclomatic complexity (>5)
- Difficult to maintain functions
- Nested control structures
- Long functions

**Example Issue:**

```python
# ❌ Before (complexity = 10)
def validate_input(data):
    if not data:
        return False
    if len(data) < 10:
        return False
    if not data.isalnum():
        return False
    # ... 7 more conditions
    return True

# ✅ After (ODAVL suggestion - split into smaller functions)
def validate_input(data):
    return (
        validate_not_empty(data) and
        validate_length(data) and
        validate_alphanumeric(data)
    )
```

**Configuration:** `.radon.cfg`  
**Severity:** Info (5-10), Warning (11-20), Error (21+)  
**Performance:** ~2300ms per test

### 4. Imports Detector (isort)

**What it detects:**
- Unsorted imports
- Incorrect import sections (stdlib, third-party, local)
- Unused imports
- Import organization violations

**Example Issue:**

```python
# ❌ Before (unsorted imports)
import random
from datetime import datetime
import os
import sys

# ✅ After (ODAVL fix)
import os
import random
import sys
from datetime import datetime
```

**Configuration:** `.isort.cfg`  
**Severity:** Warning  
**Performance:** ~660ms per test

### 5. Best Practices Detector (Pylint)

**What it detects:**
- PEP 8 violations
- Naming convention issues
- Line too long (>79 chars)
- Missing docstrings
- Unused variables
- Broad exception catching

**Example Issue:**

```python
# ❌ Before (PEP 8 violations)
def CalculateTotal(item_list):
    total=0
    for item in item_list:
        total+=item.price
    return total

# ✅ After (ODAVL fix)
def calculate_total(item_list):
    """Calculate total price of items in list."""
    total = 0
    for item in item_list:
        total += item.price
    return total
```

**Configuration:** `.pylintrc`  
**Severity:** Error, Warning, Info (depends on issue)  
**Performance:** ~2100ms per test

---

## Troubleshooting

### Common Issues

#### Issue 1: "Command 'mypy' not found"

**Solution:**
```bash
# Verify pip installation
pip list | grep mypy

# Reinstall if missing
pip install --upgrade mypy

# Check PATH
which mypy  # Unix
where mypy  # Windows
```

#### Issue 2: "No Python files found"

**Solution:**
- Check you're in correct directory
- Verify `.py` files exist
- Check exclude patterns in config

```bash
# Test manually
find . -name "*.py" | head -10
```

#### Issue 3: "Too many issues detected"

**Solution:**
```bash
# Focus on critical issues first
odavl insight analyze --language python --detectors security

# Increase thresholds in config
# Edit .radon.cfg: cc_min = D (complexity > 10)
# Edit .pylintrc: disable some checks
```

#### Issue 4: "Analysis too slow"

**Solution:**
```bash
# Exclude test files and migrations
# Add to python-config.json:
"exclude": ["tests/", "migrations/", "venv/"]

# Run detectors sequentially
odavl insight analyze --language python --detectors type
odavl insight analyze --language python --detectors security
```

#### Issue 5: "False positives"

**Solution:**
```python
# Disable specific checks inline
# For mypy:
result = some_function()  # type: ignore

# For pylint:
# pylint: disable=line-too-long
long_string = "very long string..."

# For bandit:
# nosec - this is safe
os.system(command)  # nosec
```

---

## Best Practices

### 1. Start Small
```bash
# Begin with type checking only
odavl insight analyze --language python --detectors type

# Gradually add more detectors
odavl insight analyze --language python --detectors type,security
```

### 2. Configure for Your Project
- Use strict mypy config for new projects
- Use lenient config for legacy code
- Customize thresholds based on team preferences

### 3. Integrate with CI/CD
```yaml
# .github/workflows/python-analysis.yml
name: Python Analysis
on: [push, pull_request]

jobs:
  analyze:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-python@v4
        with:
          python-version: '3.11'
      
      - name: Install tools
        run: pip install mypy bandit radon isort pylint
      
      - name: Run ODAVL analysis
        run: |
          npm install -g @odavl-studio/cli
          odavl insight analyze --language python --format json > results.json
      
      - name: Fail on critical issues
        run: |
          CRITICAL=$(jq '.summary.critical' results.json)
          if [ "$CRITICAL" -gt 0 ]; then exit 1; fi
```

### 4. Team Workflow
1. **Developer:** Runs analysis locally before commit
2. **CI/CD:** Validates on push/PR
3. **Code Review:** Reviews ODAVL report
4. **Fix:** Apply auto-fixes or manual corrections
5. **Verify:** Re-run analysis to confirm

### 5. Performance Optimization
```bash
# Cache analysis results
odavl insight analyze --language python --cache

# Analyze only changed files (Git integration)
odavl insight analyze --language python --changed-only

# Parallel analysis (future feature)
odavl insight analyze --language python --parallel
```

---

## Next Steps

1. ✅ Install tools and configure project
2. ✅ Run first analysis
3. ✅ Review issues and prioritize fixes
4. 📖 Read [Python Detector Reference](./PYTHON_DETECTOR_REFERENCE.md)
5. 🔧 Learn [Auto-fix patterns](./PYTHON_AUTO_FIX_GUIDE.md)
6. 🚀 Integrate with [CI/CD](./CI_CD_INTEGRATION.md)

---

## Additional Resources

- **GitHub:** [github.com/odavl/odavl-studio](https://github.com/odavl/odavl-studio)
- **Documentation:** [docs.odavl.com/python](https://docs.odavl.com/python)
- **Discord:** [discord.gg/odavl](https://discord.gg/odavl)
- **Issues:** [github.com/odavl/odavl-studio/issues](https://github.com/odavl/odavl-studio/issues)

---

**Need help?** Open an issue or join our Discord community! 🚀
