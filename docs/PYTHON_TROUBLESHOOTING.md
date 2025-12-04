# Python Troubleshooting Guide

**ODAVL Insight - Python Analysis Troubleshooting**  
**Version:** 2.0  
**Last Updated:** November 23, 2025

---

## Table of Contents

1. [Installation Issues](#installation-issues)
2. [Tool Not Found Errors](#tool-not-found-errors)
3. [Configuration Problems](#configuration-problems)
4. [Performance Issues](#performance-issues)
5. [False Positives](#false-positives)
6. [CLI Issues](#cli-issues)
7. [Integration Issues](#integration-issues)

---

## Installation Issues

### Issue 1: ODAVL CLI Not Found

**Error:**
```bash
$ odavl insight analyze
bash: odavl: command not found
```

**Solutions:**

**Option 1: Install globally**
```bash
npm install -g @odavl-studio/cli

# Verify installation
odavl --version
```

**Option 2: Use npx (no installation)**
```bash
npx @odavl-studio/cli insight analyze --language python
```

**Option 3: Check PATH**
```bash
# Unix/macOS
echo $PATH | grep npm

# Windows
echo %PATH% | findstr npm

# Find npm global directory
npm config get prefix

# Add to PATH if missing
export PATH=$PATH:$(npm config get prefix)/bin
```

---

### Issue 2: Python Tools Not Found

**Error:**
```bash
$ odavl insight analyze -l python
✗ MyPy not found. Install with: pip install mypy
```

**Solution:**
```bash
# Install all required tools
pip install mypy bandit radon isort pylint

# Verify installations
mypy --version
bandit --version
radon --version
isort --version
pylint --version

# If still not found, check PATH
which mypy  # Unix
where mypy  # Windows
```

**Alternative: Install in virtual environment**
```bash
# Create virtual environment
python -m venv .venv

# Activate
source .venv/bin/activate  # Unix
.\.venv\Scripts\activate   # Windows

# Install tools
pip install mypy bandit radon isort pylint

# Run analysis
odavl insight analyze -l python
```

---

### Issue 3: Version Compatibility

**Error:**
```bash
$ odavl insight analyze -l python
✗ MyPy version 0.910 is not supported. Please upgrade to 1.0.0+
```

**Solution:**
```bash
# Check current versions
pip list | grep -E 'mypy|bandit|radon|isort|pylint'

# Upgrade all tools
pip install --upgrade mypy bandit radon isort pylint

# Or upgrade individually
pip install --upgrade mypy
```

**Minimum Versions:**
- MyPy: 1.0.0+
- Bandit: 1.7.0+
- Radon: 5.0.0+
- isort: 5.0.0+
- Pylint: 2.15.0+

---

## Tool Not Found Errors

### Issue 4: Command Not in PATH

**Error:**
```bash
$ odavl insight analyze -l python -d type
✗ Error: Command 'mypy' not found
```

**Diagnosis:**
```bash
# Check if tool is installed
pip show mypy

# Find tool location
pip show mypy | grep Location

# Check if location is in PATH
echo $PATH
```

**Solutions:**

**Option 1: Add pip bin directory to PATH**
```bash
# Find pip bin directory
python -m site --user-base

# Add to PATH (Unix/macOS)
export PATH=$PATH:$(python -m site --user-base)/bin

# Add to PATH (Windows)
set PATH=%PATH%;%APPDATA%\Python\Python311\Scripts
```

**Option 2: Use full paths in config**
```json
// .odavl/python-config.json
{
  "tools": {
    "mypy": "/usr/local/bin/mypy",
    "bandit": "/usr/local/bin/bandit",
    "radon": "/usr/local/bin/radon",
    "isort": "/usr/local/bin/isort",
    "pylint": "/usr/local/bin/pylint"
  }
}
```

---

## Configuration Problems

### Issue 5: Configuration Not Loading

**Error:**
```bash
$ odavl insight analyze -l python
Warning: No configuration found, using defaults
```

**Solution:**

**Create configuration file:**
```bash
mkdir -p .odavl
touch .odavl/python-config.json
```

**Example configuration:**
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
      "severity": "critical"
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
    "migrations/"
  ]
}
```

---

### Issue 6: Invalid Configuration Syntax

**Error:**
```bash
$ odavl insight analyze -l python
✗ Error parsing python-config.json: Unexpected token
```

**Solution:**

**Validate JSON syntax:**
```bash
# Use jq to validate (Unix)
cat .odavl/python-config.json | jq .

# Use Python to validate
python -m json.tool .odavl/python-config.json
```

**Common mistakes:**
- Missing commas between properties
- Trailing commas after last property
- Unquoted keys or values
- Single quotes instead of double quotes

---

### Issue 7: Tool-Specific Config Not Found

**Error:**
```bash
$ odavl insight analyze -l python -d type
Warning: mypy.ini not found, using defaults
```

**Solution:**

**Create mypy.ini:**
```ini
[mypy]
python_version = 3.11
disallow_untyped_defs = True
warn_return_any = True
```

**Create .radon.cfg:**
```ini
[radon]
cc_min = C
show_complexity = True
```

**Create .isort.cfg:**
```ini
[settings]
profile = black
line_length = 79
```

**Create .pylintrc:**
```bash
# Generate default config
pylint --generate-rcfile > .pylintrc

# Edit as needed
```

---

## Performance Issues

### Issue 8: Analysis Too Slow

**Problem:**
```bash
$ odavl insight analyze -l python
⠙ Analyzing workspace... (45s)
```

**Solutions:**

**1. Exclude unnecessary directories:**
```json
// .odavl/python-config.json
{
  "exclude": [
    "venv/",
    ".venv/",
    "node_modules/",
    "dist/",
    "build/",
    "__pycache__/",
    "*.pyc",
    "migrations/",
    "tests/"
  ]
}
```

**2. Use specific detectors:**
```bash
# Instead of all detectors
odavl insight analyze -l python

# Run only critical ones
odavl insight analyze -l python -d type,security
```

**3. Enable caching:**
```bash
odavl insight analyze -l python --cache
```

**4. Analyze changed files only:**
```bash
odavl insight analyze -l python --changed-only
```

**5. Increase MyPy cache:**
```ini
# mypy.ini
[mypy]
cache_dir = .mypy_cache
incremental = True
```

---

### Issue 9: High Memory Usage

**Problem:**
```bash
$ odavl insight analyze -l python
Process killed (OOM - Out of Memory)
```

**Solutions:**

**1. Analyze in batches:**
```bash
# Analyze subdirectories separately
odavl insight analyze -l python src/app
odavl insight analyze -l python src/models
odavl insight analyze -l python src/utils
```

**2. Reduce parallel analysis:**
```json
// .odavl/python-config.json
{
  "performance": {
    "maxParallelTasks": 2
  }
}
```

**3. Exclude large files:**
```json
{
  "exclude": [
    "**/*.min.py",
    "data/*.py"
  ],
  "maxFileSize": 500000
}
```

---

## False Positives

### Issue 10: Too Many False Positives

**Problem:**
```bash
$ odavl insight analyze -l python
Found 152 issues (many false positives)
```

**Solutions:**

**1. Inline suppression:**
```python
# For MyPy
result = some_function()  # type: ignore

# For Pylint
# pylint: disable=line-too-long
very_long_line = "..."

# For Bandit
os.system(command)  # nosec
```

**2. Configuration-based suppression:**
```ini
# mypy.ini
[mypy-thirdparty.*]
ignore_missing_imports = True

# .pylintrc
[MESSAGES CONTROL]
disable = C0111,R0903,W0511
```

**3. Adjust thresholds:**
```json
// .odavl/python-config.json
{
  "detectors": {
    "complexity": {
      "threshold": 10  // Increase from 5
    }
  }
}
```

---

### Issue 11: Missing Real Issues

**Problem:**
```bash
$ odavl insight analyze -l python
Found 5 issues (but I know there are more)
```

**Solutions:**

**1. Enable stricter mode:**
```ini
# mypy.ini
[mypy]
strict = True
disallow_any_expr = True
warn_unreachable = True
```

**2. Run all detectors:**
```bash
# Ensure all detectors are enabled
odavl insight analyze -l python -d type,security,complexity,imports,best-practices
```

**3. Lower severity threshold:**
```bash
# Show all issues (including low severity)
odavl insight analyze -l python -s low
```

---

## CLI Issues

### Issue 12: Command Not Recognized

**Error:**
```bash
$ odavl insight analyze --language python
Error: Unknown language 'python'
```

**Solutions:**

**Check installed version:**
```bash
odavl --version

# Should be 2.0.0+ for Python support
# If older, upgrade:
npm update -g @odavl-studio/cli
```

**Verify language support:**
```bash
odavl insight list-languages

# Should show:
# ✓ python (5 detectors)
```

---

### Issue 13: JSON Output Invalid

**Error:**
```bash
$ odavl insight analyze -l python -f json | jq .
parse error: Invalid numeric literal at line 1, column 10
```

**Solution:**

**Redirect stderr:**
```bash
# Separate output and errors
odavl insight analyze -l python -f json 2>/dev/null | jq .

# Or save to file
odavl insight analyze -l python -f json -o results.json
```

---

## Integration Issues

### Issue 14: CI/CD Pipeline Fails

**Error:**
```yaml
# GitHub Actions
Run odavl insight analyze -l python
Error: Python tools not found
```

**Solution:**

```yaml
name: Python Analysis
on: [push]

jobs:
  analyze:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      # Add Python setup
      - uses: actions/setup-python@v4
        with:
          python-version: '3.11'
      
      # Install Python tools
      - name: Install Python tools
        run: pip install mypy bandit radon isort pylint
      
      # Install Node.js for ODAVL
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install ODAVL CLI
        run: npm install -g @odavl-studio/cli
      
      - name: Run analysis
        run: odavl insight analyze -l python
```

---

### Issue 15: Pre-commit Hook Slow

**Problem:**
```bash
$ git commit
Running ODAVL analysis... (30s)
```

**Solution:**

**Optimize pre-commit hook:**
```bash
#!/bin/bash
# .git/hooks/pre-commit

# Only analyze changed Python files
CHANGED_FILES=$(git diff --cached --name-only --diff-filter=ACM | grep '\.py$')

if [ -z "$CHANGED_FILES" ]; then
  echo "No Python files changed"
  exit 0
fi

# Analyze only changed files
echo "$CHANGED_FILES" | xargs odavl insight analyze \
  --language python \
  --changed-only \
  --detectors type,security \
  --severity high

exit $?
```

---

## Getting Help

### Diagnostic Command

```bash
# Run diagnostic to check setup
odavl insight diagnose --language python

# Output:
✓ Python version: 3.11.5
✓ ODAVL CLI version: 2.0.0
✓ MyPy: 1.7.1 ✓
✓ Bandit: 1.7.5 ✓
✓ Radon: 6.0.1 ✓
✓ isort: 5.12.0 ✓
✓ Pylint: 3.0.2 ✓
✓ Configuration: .odavl/python-config.json
✓ Tools in PATH: All found

All checks passed! Ready to analyze Python code.
```

---

### Enable Debug Logging

```bash
# Enable verbose output
odavl insight analyze -l python -v

# Enable debug logging
export DEBUG=odavl:*
odavl insight analyze -l python

# Save logs to file
odavl insight analyze -l python -v 2>&1 | tee analysis.log
```

---

### Report Issues

If you encounter a bug:

1. **Check existing issues:** [GitHub Issues](https://github.com/odavl/odavl-studio/issues)
2. **Create new issue:** Include:
   - ODAVL CLI version (`odavl --version`)
   - Python version (`python --version`)
   - Tool versions (`pip list | grep -E 'mypy|bandit|radon|isort|pylint'`)
   - Error message
   - Steps to reproduce
3. **Join Discord:** [discord.gg/odavl](https://discord.gg/odavl)

---

## Related Documentation

- [Python Setup Guide](./PYTHON_SETUP_GUIDE.md)
- [Python Detector Reference](./PYTHON_DETECTOR_REFERENCE.md)
- [Python CLI Usage Guide](./PYTHON_CLI_USAGE_GUIDE.md)
- [CI/CD Integration](./CI_CD_INTEGRATION.md)

---

**Still stuck?** Ask in our [Discord community](https://discord.gg/odavl)! 🚀
