# Python Detector Reference

**ODAVL Insight - Complete Python Detector Documentation**  
**Version:** 2.0  
**Last Updated:** November 23, 2025

---

## Table of Contents

1. [Overview](#overview)
2. [Type Detector](#type-detector)
3. [Security Detector](#security-detector)
4. [Complexity Detector](#complexity-detector)
5. [Imports Detector](#imports-detector)
6. [Best Practices Detector](#best-practices-detector)
7. [Quick Reference Table](#quick-reference-table)

---

## Overview

ODAVL Insight provides 5 specialized Python detectors, each focusing on specific code quality aspects:

| Detector | Tool | Issues Found | Severity | Performance |
|----------|------|--------------|----------|-------------|
| Type | MyPy | 35 | Error | ~700ms |
| Security | Bandit | 10 | Critical/Error | ~620ms |
| Complexity | Radon | 2 | Info/Warning/Error | ~2300ms |
| Imports | isort | 12 | Warning | ~660ms |
| Best Practices | Pylint | 52 | Error/Warning/Info | ~2100ms |

**Total:** 111 issues detected across all detectors  
**Combined Performance:** <2 seconds for full analysis

---

## Type Detector

### Overview
**Tool:** MyPy  
**Purpose:** Enforce type safety and catch type-related errors  
**Configuration:** `mypy.ini`  
**Issues Detected:** 35

### What It Detects

#### 1. Missing Type Hints
Functions without parameter or return type annotations.

```python
# ❌ Issue: Missing type hints
def calculate_total(items):
    return sum(item.price for item in items)

# ✅ Fixed
def calculate_total(items: list[Item]) -> float:
    return sum(item.price for item in items)
```

**Severity:** High  
**Recommendation:** Add type hints to all public functions  
**Auto-fix:** ✅ Available

#### 2. Type Mismatches
Incorrect type assignments or operations.

```python
# ❌ Issue: Type mismatch
def get_age() -> int:
    return "25"  # Returns str, expected int

# ✅ Fixed
def get_age() -> int:
    return 25
```

**Severity:** Error  
**Recommendation:** Ensure return types match declarations  
**Auto-fix:** ⚠️ Manual fix required

#### 3. Incompatible Return Types
Function returns type different from annotation.

```python
# ❌ Issue: Return type mismatch
def process_data(items: list) -> int:
    return items  # Returns list, expected int

# ✅ Fixed
def process_data(items: list) -> int:
    return len(items)
```

**Severity:** Error  
**Recommendation:** Verify return statements match signature  
**Auto-fix:** ⚠️ Manual fix required

### Configuration

**mypy.ini Example:**
```ini
[mypy]
python_version = 3.11
disallow_untyped_defs = True
disallow_incomplete_defs = True
warn_return_any = True
check_untyped_defs = True
strict_optional = True
```

### Performance
- **Average:** 660-700ms per test file
- **Optimization:** Use incremental mode with cache

---

## Security Detector

### Overview
**Tool:** Bandit  
**Purpose:** Identify security vulnerabilities  
**Configuration:** Built-in  
**Issues Detected:** 10

### What It Detects

#### 1. SQL Injection
Hardcoded SQL queries with user input.

```python
# ❌ Issue: SQL injection vulnerability (HIGH)
def get_user(user_id):
    query = f"SELECT * FROM users WHERE id = {user_id}"
    return db.execute(query)

# ✅ Fixed: Use parameterized queries
def get_user(user_id):
    query = "SELECT * FROM users WHERE id = ?"
    return db.execute(query, (user_id,))
```

**Severity:** Critical  
**CWE:** CWE-89  
**Recommendation:** Always use parameterized queries  
**Auto-fix:** ✅ Available

#### 2. Command Injection
Shell command execution with user input.

```python
# ❌ Issue: Command injection (HIGH)
def run_command(user_input):
    os.system(f"echo {user_input}")

# ✅ Fixed: Use subprocess with shell=False
def run_command(user_input):
    subprocess.run(["echo", user_input], check=True)
```

**Severity:** Critical  
**CWE:** CWE-78  
**Recommendation:** Never use shell=True with user input  
**Auto-fix:** ✅ Available

#### 3. Hardcoded Secrets
API keys, passwords, or tokens in code.

```python
# ❌ Issue: Hardcoded API key (MEDIUM)
API_KEY = "sk-1234567890abcdef"

# ✅ Fixed: Use environment variables
import os
API_KEY = os.getenv("API_KEY")
```

**Severity:** High  
**CWE:** CWE-798  
**Recommendation:** Use environment variables or secret management  
**Auto-fix:** ⚠️ Manual fix required

#### 4. Pickle Deserialization
Unsafe deserialization of untrusted data.

```python
# ❌ Issue: Insecure deserialization (HIGH)
import pickle
def load_data(file_path):
    with open(file_path, 'rb') as f:
        return pickle.load(f)

# ✅ Fixed: Use JSON or safer formats
import json
def load_data(file_path):
    with open(file_path, 'r') as f:
        return json.load(f)
```

**Severity:** High  
**CWE:** CWE-502  
**Recommendation:** Use JSON, YAML, or signed pickles  
**Auto-fix:** ⚠️ Manual fix required

#### 5. Weak Random Number Generation
Using `random` module for security purposes.

```python
# ❌ Issue: Insecure random (LOW)
import random
token = random.randint(1000, 9999)

# ✅ Fixed: Use secrets module
import secrets
token = secrets.randbelow(9000) + 1000
```

**Severity:** Medium  
**CWE:** CWE-338  
**Recommendation:** Use `secrets` module for cryptography  
**Auto-fix:** ✅ Available

### Performance
- **Average:** 600-650ms per test file
- **Optimization:** Exclude vendor/test files

---

## Complexity Detector

### Overview
**Tool:** Radon  
**Purpose:** Measure code complexity  
**Configuration:** `.radon.cfg`  
**Issues Detected:** 2

### What It Detects

#### 1. High Cyclomatic Complexity
Functions with too many branches.

```python
# ❌ Issue: High complexity (CC=10)
def validate_user(user):
    if not user:
        return False
    if not user.email:
        return False
    if not user.password:
        return False
    if len(user.password) < 8:
        return False
    if not user.age:
        return False
    if user.age < 18:
        return False
    if not user.country:
        return False
    if user.country not in ALLOWED_COUNTRIES:
        return False
    return True

# ✅ Fixed: Split into smaller functions
def validate_user(user):
    return (
        validate_user_exists(user) and
        validate_email(user.email) and
        validate_password(user.password) and
        validate_age(user.age) and
        validate_country(user.country)
    )

def validate_email(email):
    return bool(email)

def validate_password(password):
    return password and len(password) >= 8

def validate_age(age):
    return age and age >= 18

def validate_country(country):
    return country in ALLOWED_COUNTRIES
```

**Severity:** Info (5-10), Warning (11-20), Error (21+)  
**Recommendation:** Keep complexity < 10 for maintainability  
**Auto-fix:** ⚠️ Manual refactoring required

#### 2. Low Maintainability Index
Code that's difficult to maintain (MI < 20).

```python
# ❌ Issue: Low maintainability (MI=15)
def complex_calculation(a, b, c, d, e):
    result = 0
    for i in range(a):
        for j in range(b):
            if i % 2 == 0:
                result += c * d
            else:
                result -= e
    return result

# ✅ Fixed: Simplify and document
def complex_calculation(a, b, c, d, e):
    """Calculate result based on input parameters."""
    even_sum = (a // 2) * b * (c * d)
    odd_sum = (a - a // 2) * b * e
    return even_sum - odd_sum
```

**Severity:** Warning  
**Recommendation:** Refactor to improve maintainability  
**Auto-fix:** ⚠️ Manual refactoring required

### Thresholds

| Complexity | Grade | Severity | Action |
|------------|-------|----------|--------|
| 1-5 | A-B | None | ✅ Good |
| 6-10 | C | Info | 📝 Consider refactoring |
| 11-20 | D-E | Warning | ⚠️ Refactor recommended |
| 21+ | F | Error | 🚨 Must refactor |

### Configuration

**.radon.cfg Example:**
```ini
[radon]
cc_min = C      # Report complexity >= 5
cc_max = F      # Error on >= 25
show_complexity = True
```

### Performance
- **Average:** 1800-2700ms per test file
- **Optimization:** Exclude large files

---

## Imports Detector

### Overview
**Tool:** isort  
**Purpose:** Organize and sort imports  
**Configuration:** `.isort.cfg`  
**Issues Detected:** 12

### What It Detects

#### 1. Unsorted Imports
Imports not in correct order.

```python
# ❌ Issue: Unsorted imports
import random
from datetime import datetime
import os
import sys

# ✅ Fixed: Sorted correctly
import os
import random
import sys
from datetime import datetime
```

**Severity:** Warning  
**Recommendation:** Run isort to auto-sort  
**Auto-fix:** ✅ Available

#### 2. Incorrect Import Sections
Imports not grouped by type.

```python
# ❌ Issue: Mixed import sections
import os
import django
import sys
from myapp import models

# ✅ Fixed: Grouped by section
# Standard library
import os
import sys

# Third-party
import django

# Local
from myapp import models
```

**Severity:** Warning  
**Recommendation:** Follow PEP 8 import ordering  
**Auto-fix:** ✅ Available

#### 3. Unused Imports
Imported modules not used.

```python
# ❌ Issue: Unused import
import random
import os

def hello():
    print("Hello")

# ✅ Fixed: Remove unused import
import os

def hello():
    print("Hello")
```

**Severity:** Info  
**Recommendation:** Remove unused imports  
**Auto-fix:** ✅ Available

### Import Order (PEP 8)

1. **Future imports** - `from __future__ import ...`
2. **Standard library** - `import os, sys, re`
3. **Third-party** - `import django, flask, requests`
4. **Local** - `from myapp import models`

### Configuration

**.isort.cfg Example:**
```ini
[settings]
profile = black
line_length = 79
multi_line_output = 3
include_trailing_comma = True
force_alphabetical_sort_within_sections = True
```

### Performance
- **Average:** 600-700ms per test file
- **Optimization:** Cache analysis results

---

## Best Practices Detector

### Overview
**Tool:** Pylint  
**Purpose:** Enforce PEP 8 and Python best practices  
**Configuration:** `.pylintrc`  
**Issues Detected:** 52

### What It Detects

#### 1. Naming Convention Violations
Variable/function names not following PEP 8.

```python
# ❌ Issue: Invalid naming (C0103)
def CalculateTotal(ItemList):
    Total = 0
    return Total

# ✅ Fixed: Use snake_case
def calculate_total(item_list):
    total = 0
    return total
```

**Severity:** Convention  
**Recommendation:** Use snake_case for functions/variables  
**Auto-fix:** ⚠️ Manual fix required

#### 2. Line Too Long
Lines exceeding 79 characters.

```python
# ❌ Issue: Line too long (C0301)
very_long_variable_name = some_function_with_many_parameters(param1, param2, param3, param4, param5)

# ✅ Fixed: Break into multiple lines
very_long_variable_name = some_function_with_many_parameters(
    param1, param2, param3, param4, param5
)
```

**Severity:** Convention  
**Recommendation:** Keep lines <= 79 characters  
**Auto-fix:** ✅ Available (via Black)

#### 3. Missing Docstrings
Functions without documentation.

```python
# ❌ Issue: Missing docstring (C0111)
def calculate_tax(amount):
    return amount * 0.15

# ✅ Fixed: Add docstring
def calculate_tax(amount):
    """Calculate tax amount (15%) for given amount."""
    return amount * 0.15
```

**Severity:** Convention  
**Recommendation:** Document all public functions  
**Auto-fix:** ⚠️ Manual fix required

#### 4. Unused Variables
Variables assigned but never used.

```python
# ❌ Issue: Unused variable (W0612)
def process_data():
    result = expensive_calculation()
    return 42

# ✅ Fixed: Remove or use variable
def process_data():
    return expensive_calculation()
```

**Severity:** Warning  
**Recommendation:** Remove unused variables  
**Auto-fix:** ✅ Available

#### 5. Broad Exception Catching
Catching generic Exception or bare except.

```python
# ❌ Issue: Bare except (W0702)
try:
    risky_operation()
except:
    pass

# ✅ Fixed: Catch specific exceptions
try:
    risky_operation()
except ValueError as e:
    logger.error(f"Invalid value: {e}")
```

**Severity:** Warning  
**Recommendation:** Catch specific exceptions  
**Auto-fix:** ⚠️ Manual fix required

### Configuration

**.pylintrc Example:**
```ini
[MESSAGES CONTROL]
disable = C0111,R0903

[FORMAT]
max-line-length = 79

[DESIGN]
max-args = 5
max-locals = 15
```

### Performance
- **Average:** 1900-2600ms per test file
- **Optimization:** Disable specific checks

---

## Quick Reference Table

### Issue Severity Mapping

| Category | Critical | High | Medium | Low | Info |
|----------|----------|------|--------|-----|------|
| Type | - | 35 | - | - | - |
| Security | 3 | 7 | - | - | - |
| Complexity | - | - | - | - | 2 |
| Imports | - | - | - | 12 | - |
| Best Practices | - | - | 18 | 34 | - |
| **Total** | **3** | **42** | **18** | **46** | **2** |

### Auto-Fix Capability

| Detector | Auto-fixable | Manual Required | % Auto-fixable |
|----------|--------------|-----------------|----------------|
| Type | 30 | 5 | 86% |
| Security | 5 | 5 | 50% |
| Complexity | 0 | 2 | 0% |
| Imports | 12 | 0 | 100% |
| Best Practices | 20 | 32 | 38% |
| **Total** | **67** | **44** | **60%** |

### Performance Benchmarks

| Detector | Avg Time | Min Time | Max Time |
|----------|----------|----------|----------|
| Type | 680ms | 660ms | 770ms |
| Security | 620ms | 600ms | 700ms |
| Complexity | 2300ms | 1800ms | 2700ms |
| Imports | 670ms | 600ms | 770ms |
| Best Practices | 2100ms | 1900ms | 2600ms |
| **Combined** | **6.37s** | **5.56s** | **7.54s** |

---

## Related Documentation

- [Python Setup Guide](./PYTHON_SETUP_GUIDE.md) - Installation and configuration
- [Python Auto-Fix Guide](./PYTHON_AUTO_FIX_GUIDE.md) - Automated fixes
- [CI/CD Integration](./CI_CD_INTEGRATION.md) - Pipeline setup
- [Troubleshooting](./PYTHON_TROUBLESHOOTING.md) - Common issues

---

**Questions?** Join our [Discord](https://discord.gg/odavl) or open an [issue](https://github.com/odavl/odavl-studio/issues)! 🚀
