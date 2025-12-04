# Python Support Implementation Plan

**Timeline:** Month 7 (Jan 2026)  
**Goal:** Launch Python detector with 75%+ auto-fix rate  
**Team:** 3 engineers × 4 weeks

---

## Week 1: Core Infrastructure

### Python AST Parser Integration

**File:** `odavl-studio/insight/core/src/parsers/python-parser.ts`

```typescript
import * as spawn from 'cross-spawn';

export class PythonParser {
  parseToAST(code: string): PythonAST {
    // Use Python's built-in ast module via subprocess
    const result = spawn.sync('python3', [
      '-c',
      `import ast, json; tree = ast.parse('''${code}'''); print(json.dumps(ast.dump(tree)))`
    ]);
    return JSON.parse(result.stdout.toString());
  }

  getImports(ast: PythonAST): Import[] {
    // Extract import statements
  }

  getFunctions(ast: PythonAST): Function[] {
    // Extract function definitions
  }

  getClasses(ast: PythonAST): Class[] {
    // Extract class definitions
  }
}
```

### Language Detection Update

**File:** `odavl-studio/insight/core/src/detector/language-detector.ts`

```typescript
export function detectLanguage(filePath: string): Language {
  const ext = path.extname(filePath);
  switch (ext) {
    case '.py': return 'python';
    case '.ts': return 'typescript';
    case '.js': return 'javascript';
    default: return 'unknown';
  }
}
```

---

## Week 2: Python-Specific Detectors (12 total)

### 1. Type Hints Detector

**Purpose:** Detect missing type hints, suggest additions

```python
# Before
def calculate_total(items):
    return sum(item.price for item in items)

# After (ODAVL fix)
def calculate_total(items: list[Item]) -> float:
    return sum(item.price for item in items)
```

**Implementation:** Check function signatures, add hints based on usage patterns

---

### 2. Import Optimizer

**Purpose:** Remove unused imports, sort imports (PEP 8)

```python
# Before
import os
import sys
from typing import List, Dict
from datetime import datetime

# After (ODAVL fix)
from datetime import datetime
from typing import Dict, List
```

**Implementation:** AST analysis for used names, isort-compatible sorting

---

### 3. f-String Converter

**Purpose:** Convert old-style formatting to f-strings (Python 3.6+)

```python
# Before
message = "Hello, %s! You have %d messages." % (name, count)

# After (ODAVL fix)
message = f"Hello, {name}! You have {count} messages."
```

**Implementation:** Regex + AST, handle edge cases (%, {}, escaping)

---

### 4. List Comprehension Optimizer

**Purpose:** Convert loops to comprehensions (more Pythonic)

```python
# Before
result = []
for item in items:
    if item.active:
        result.append(item.name)

# After (ODAVL fix)
result = [item.name for item in items if item.active]
```

**Implementation:** Pattern matching for simple accumulation loops

---

### 5. Exception Handling Improver

**Purpose:** Catch specific exceptions, avoid bare except

```python
# Before
try:
    data = json.loads(text)
except:
    data = {}

# After (ODAVL fix)
try:
    data = json.loads(text)
except json.JSONDecodeError:
    data = {}
```

**Implementation:** Analyze try block, suggest specific exceptions

---

### 6. Pathlib Modernizer

**Purpose:** Convert os.path to pathlib (Python 3.4+)

```python
# Before
import os
file_path = os.path.join(base_dir, 'data', 'file.txt')
if os.path.exists(file_path):
    with open(file_path, 'r') as f:
        content = f.read()

# After (ODAVL fix)
from pathlib import Path
file_path = Path(base_dir) / 'data' / 'file.txt'
if file_path.exists():
    content = file_path.read_text()
```

**Implementation:** Replace os.path calls with Path methods

---

### 7. Security Scanner (Python-specific)

**Purpose:** Detect SQL injection, eval(), pickle usage

```python
# Before (DANGEROUS)
query = f"SELECT * FROM users WHERE id = {user_id}"
cursor.execute(query)

# After (ODAVL fix)
query = "SELECT * FROM users WHERE id = %s"
cursor.execute(query, (user_id,))
```

**Implementation:** Pattern matching for dangerous functions, suggest safe alternatives

---

### 8. Dataclass Converter

**Purpose:** Convert classes to dataclasses (Python 3.7+)

```python
# Before
class User:
    def __init__(self, name: str, email: str):
        self.name = name
        self.email = email
    
    def __repr__(self):
        return f"User(name={self.name}, email={self.email})"

# After (ODAVL fix)
from dataclasses import dataclass

@dataclass
class User:
    name: str
    email: str
```

**Implementation:** Detect simple data classes, generate @dataclass version

---

### 9. Async/Await Detector

**Purpose:** Suggest async/await for I/O-bound operations

```python
# Before
def fetch_user(user_id):
    response = requests.get(f'/api/users/{user_id}')
    return response.json()

# After (ODAVL suggestion)
async def fetch_user(user_id):
    async with aiohttp.ClientSession() as session:
        async with session.get(f'/api/users/{user_id}') as response:
            return await response.json()
```

**Implementation:** Detect blocking I/O (requests, urllib), suggest async alternatives

---

### 10. Docstring Generator

**Purpose:** Add missing docstrings (PEP 257)

```python
# Before
def calculate_discount(price, percentage):
    return price * (1 - percentage / 100)

# After (ODAVL fix)
def calculate_discount(price: float, percentage: float) -> float:
    """Calculate discounted price.
    
    Args:
        price: Original price
        percentage: Discount percentage (0-100)
    
    Returns:
        Discounted price
    """
    return price * (1 - percentage / 100)
```

**Implementation:** Generate docstring from function signature + return type

---

### 11. Performance Optimizer

**Purpose:** Suggest performance improvements

```python
# Before
if key in dict.keys():  # Inefficient
    value = dict[key]

# After (ODAVL fix)
if key in dict:  # Direct membership test
    value = dict[key]
```

**Implementation:** Pattern matching for common anti-patterns

---

### 12. Code Complexity Detector

**Purpose:** Detect high cyclomatic complexity, suggest refactoring

```python
# Before (complexity 15)
def process_order(order):
    if order.status == 'pending':
        if order.payment_method == 'credit_card':
            if order.amount > 1000:
                # ... 20 more lines with nested ifs

# After (ODAVL suggestion)
# Refactor: Extract payment validation, amount validation into separate functions
```

**Implementation:** Radon library integration, suggest Extract Method refactoring

---

## Week 3: ML Model Training

### Training Data Collection

**Sources:**
- **GitHub:** 100K Python repos (popular projects: Django, Flask, requests)
- **Internal:** ODAVL codebase (dogfooding)
- **Community:** Beta user feedback on fix quality

**Data Format:**
```json
{
  "code_before": "def foo(x):\n    return x * 2",
  "issue_type": "missing_type_hints",
  "code_after": "def foo(x: int) -> int:\n    return x * 2",
  "success": true,
  "trust_score": 0.95
}
```

### Model Architecture

**Same as TypeScript model:**
- Random Forest (scikit-learn)
- 47 features: code metrics (LOC, complexity), issue type, context
- Training: 80% train, 20% validation
- Target: 92%+ accuracy (match TypeScript)

**Python-specific features:**
- Python version (3.8, 3.9, 3.10, 3.11, 3.12)
- Framework (Django, Flask, FastAPI, None)
- Use of type hints (0-100% coverage)

---

## Week 4: Beta Testing & Launch

### Beta Program

**Recruitment:**
- 50 Python developers from waitlist (Python = 40% of signups)
- Mix of frameworks: 20 Django, 15 Flask, 10 FastAPI, 5 vanilla

**Testing Metrics:**
- Fix rate target: 75%+ (Python simpler than TypeScript)
- False positive rate: <5%
- Analysis time: <3 seconds for 5K LOC

**Feedback Collection:**
- Daily surveys (what worked, what didn't)
- Discord channel (#python-beta)
- Bug bounty ($500 for critical issues)

### Public Launch

**Announcement Channels:**
1. **Blog Post** - "ODAVL Now Supports Python: 75% Auto-Fix Rate"
2. **Product Hunt** - "Show PH: Python support added to ODAVL"
3. **Reddit r/Python** - Community announcement (15K upvotes target)
4. **Hacker News** - "Show HN: Auto-fix Python code with ML"
5. **Dev.to** - Technical deep-dive article
6. **Twitter** - Thread with demo video
7. **Email** - 500 waitlist signups (Python-specific)

**Launch Assets:**
- Demo video (60 sec, Python examples)
- Before/After screenshots (10 examples)
- Documentation (15 pages)
- GitHub examples (3 popular repos fixed)

---

## Technical Specifications

### Supported Python Versions
- **3.8+** (f-strings, walrus operator, type hints)
- **3.10+** (match/case, optional)
- **3.12** (latest stable)

### Framework Support
- **Django** (ORM queries, templates)
- **Flask** (routes, blueprints)
- **FastAPI** (async routes, Pydantic models)
- **Vanilla** (standard library only)

### Detector Performance Targets
| Detector | Target Fix Rate | Analysis Time |
|----------|----------------|---------------|
| Type Hints | 85% | 0.5s |
| Import Optimizer | 95% | 0.2s |
| f-String Converter | 90% | 0.3s |
| List Comprehension | 70% | 0.4s |
| Exception Handling | 80% | 0.3s |
| Pathlib Modernizer | 85% | 0.4s |
| Security Scanner | 75% | 0.6s |
| Dataclass Converter | 65% | 0.5s |
| Async/Await | 50% | 0.7s |
| Docstring Generator | 80% | 0.4s |
| Performance Optimizer | 70% | 0.5s |
| Complexity Detector | 60% | 0.6s |

**Overall Target:** 75% auto-fix rate (weighted average)

---

## Success Metrics

**Product:**
- ✅ 75%+ auto-fix rate (validated on 100K examples)
- ✅ <3s analysis time for 5K LOC
- ✅ <5% false positive rate
- ✅ 50 beta users satisfied (4.5/5 rating)

**Business:**
- ✅ 500 Python users in Month 7 (20% of new signups)
- ✅ $10K MRR from Python users
- ✅ 10% conversion (free → paid)

**Marketing:**
- ✅ 10K Reddit upvotes (r/Python post)
- ✅ 5K GitHub stars (from 1.2K)
- ✅ 100 blog post comments
- ✅ 50 conference talk submissions (PyCon, PyData)

---

**Status:** Ready to execute (Month 7 start)  
**Team:** 2 Backend Engineers + 1 ML Engineer  
**Budget:** $135K (3 × $45K/month salaries)
