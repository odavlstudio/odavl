# Quick Start Guide (Python)

**Goal**: Analyze Python codebase in 5 minutes.

---

## Prerequisites

- Python 3.8+ (`python --version`)
- pip or poetry
- Git repository

---

## Step 1: Install CLI (30 seconds)

```bash
# Using pip
pip install odavl-cli

# Using pipx (isolated environment, recommended)
pipx install odavl-cli

# Verify installation
odavl --version
```

**Expected output**: `odavl v2.0.0`

---

## Step 2: Initialize Workspace (1 minute)

```bash
cd /path/to/your/python/project
odavl init --language python
```

**Interactive prompts**:
1. **Python version**: Select detected version or specify (3.8, 3.9, 3.10, 3.11, 3.12)
2. **Detectors**: Choose "All" (type hints, security, complexity, imports)
3. **Virtual environment**: Use existing? → Path to `.venv` or create new

**What this creates**:
- `.odavl/` directory
- `.odavl/config.yml` with Python-specific settings
- Integration with existing tools (mypy, flake8, bandit)

---

## Step 3: Run First Scan (2 minutes)

```bash
odavl insight analyze
```

**What happens**:
1. Detects all `.py` files
2. Runs Python-specific detectors:
   - Type hints (mypy integration)
   - PEP 8 compliance (flake8)
   - Security (bandit)
   - Complexity (radon)
   - Import cycles
3. Generates report

**Example output**:
```
✓ Python Type Detector: 45 missing type hints
✓ Python Security Detector: 3 critical (SQL injection, secrets)
✓ Python Complexity Detector: 12 functions exceeding complexity 10
✓ Import Detector: 2 circular dependencies

Total: 62 issues detected
Report: .odavl/reports/insight-2025-03-15.json
```

---

## Step 4: Review Issues (1 minute)

**Severity Levels**:
- **Critical**: Hardcoded secrets, SQL injection, RCE
- **High**: Missing type hints on public APIs, N+1 queries
- **Medium**: PEP 8 violations, complexity warnings
- **Low**: Style suggestions, minor optimizations

**View by severity**:
```bash
odavl insight report --severity critical,high
```

**View specific detector**:
```bash
odavl insight report --detector security
```

---

## Step 5: Fix Issues

### Path 1: Manual Fix

```python
# Before (issue detected: missing type hint)
def calculate_total(items):
    return sum(item.price for item in items)

# After (fixed)
from typing import List
def calculate_total(items: List[Item]) -> float:
    return sum(item.price for item in items)
```

### Path 2: AI-Assisted Fix

```bash
odavl insight fix --issue PY001 --file src/utils.py
```

ODAVL shows suggested fix with explanation:
```
Issue: Missing return type hint on public function
Suggestion: Add -> float

def calculate_total(items: List[Item]) -> float:
                                        ^^^^^^^^

Apply fix? [y/N]:
```

### Path 3: Autopilot (Batch Fixes)

```bash
odavl autopilot run --detectors type-hints --max-files 10
```

---

## Python-Specific Features

### Type Hint Analysis

**Enable strict checking**:
```yaml
# .odavl/config.yml
detectors:
  python-type:
    strict: true
    ignore_missing:
      - tests/**
      - __init__.py
```

**Incremental adoption**:
```bash
# Only check modified files
odavl insight analyze --changed
```

### Security Scanning

**Built-in checks**:
- Hardcoded passwords/API keys
- SQL injection patterns
- Shell command injection
- Insecure deserialization
- XML external entity (XXE)

**Example detection**:
```python
# Detected: Hardcoded secret
API_KEY = "sk_live_abc123..."  # ❌ CRITICAL

# Fixed: Environment variable
import os
API_KEY = os.getenv("API_KEY")  # ✅
```

### Import Cycle Detection

```bash
odavl insight analyze --detector imports --visualize
```

Generates dependency graph: `.odavl/reports/import-graph.svg`

---

## Integration with Existing Tools

### mypy Configuration

ODAVL respects your `mypy.ini`:
```ini
[mypy]
python_version = 3.11
warn_return_any = True
warn_unused_configs = True
```

### pytest Integration

Run ODAVL in test suite:
```python
# tests/test_quality.py
import subprocess

def test_code_quality():
    result = subprocess.run(
        ["odavl", "insight", "analyze", "--fail-on", "critical"],
        capture_output=True
    )
    assert result.returncode == 0, "Quality check failed"
```

---

## CI/CD Example

### GitHub Actions

```yaml
# .github/workflows/quality.yml
name: ODAVL Quality Check

on: [push, pull_request]

jobs:
  quality:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Python
        uses: actions/setup-python@v4
        with:
          python-version: '3.11'
      
      - name: Install ODAVL
        run: pip install odavl-cli
      
      - name: Run Quality Checks
        run: |
          odavl insight analyze --fail-on critical,high
      
      - name: Upload Report
        uses: actions/upload-artifact@v3
        with:
          name: odavl-report
          path: .odavl/reports/
```

---

## Troubleshooting

### "mypy not found"

**Fix**: Install type checking dependencies
```bash
pip install mypy types-requests types-setuptools
```

### "Virtual environment not activated"

**Fix**: ODAVL auto-detects venv. Force specific one:
```bash
odavl config set python.venv_path .venv
```

### "False positives on type hints"

**Fix**: Ignore specific patterns
```yaml
# .odavl/config.yml
detectors:
  python-type:
    ignore_patterns:
      - "*_test.py"
      - "migrations/**"
```

---

## Resources

- **Python Best Practices**: odavl.com/docs/python
- **Type Hinting Guide**: odavl.com/docs/type-hints
- **Security Patterns**: odavl.com/docs/security-python
- **Discord #python Channel**: discord.gg/odavl
