# 🧠 Step 2 — Decide the Cleanup Strategy

**Mission**: Systematic elimination of 1,184+ problems to achieve 0 errors/0 warnings  
**Approach**: Small, safe patches (≤40 lines / ≤10 files per operation)  
**Governance**: Protect critical documentation, maintain build success  

---

## 🎯 Execution Plan

### **Operation 1: Fix ESLint Script Issues**

**Target**: 11 ESLint problems → 0 problems  
**Risk**: Low (scripts only, no runtime impact)  
**Files**: 4 script files in `/scripts/`  

**Action**: Convert CommonJS require() to ESM imports in utility scripts

- `scripts/accessibility-check.js` - Convert require to import
- `scripts/fix-testimonials.js` - Convert require to import  
- `scripts/generate-assets.js` - Convert require to import + remove unused var
- `scripts/performance-audit.js` - Convert require to import

### **Operation 2: Clean Old JSON Report Files**

**Target**: 40+ JSON files → Keep 3 most recent per type  
**Risk**: Low (logs only, no business logic affected)  
**Files**: `reports/observe-*.json`, `reports/run-*.json`, `reports/verify-*.json`

**Action**: Archive old timestamped files (keep observe/run/verify from last 3 cycles)

### **Operation 3: Fix Markdown Linting Issues**  

**Target**: 1,100+ markdown warnings → 0 warnings
**Risk**: Very Low (formatting only)
**Files**: Core documentation files (README.md, CHANGELOG.md, .copilot/*.md)

**Action**: Auto-fix spacing, headings, code blocks, trailing lines

### **Operation 4: Consolidate Report Structure**

**Target**: Scattered reports → Organized evidence structure  
**Risk**: Medium (verify no critical evidence lost)
**Files**: Various `/reports/` subdirectories

**Action**: Migrate important content, archive redundant directories

---

## 🔧 Detailed Implementation Plans

### **Plan A: ESLint Script Fixes (Immediate)**

#### scripts/accessibility-check.js

```javascript
// BEFORE (CommonJS)
const fs = require('fs');
const path = require('path');

// AFTER (ESM)
import fs from 'fs';
import path from 'path';
```

#### scripts/fix-testimonials.js  

```javascript  
// BEFORE
const fs = require('fs');
const path = require('path');

// AFTER
import fs from 'fs';
import path from 'path';
```

#### scripts/generate-assets.js

```javascript
// BEFORE  
const lighthouse = require('lighthouse');
const fs = require('fs'); // ← UNUSED, remove this
const path = require('path');

// AFTER
import lighthouse from 'lighthouse';
import path from 'path';
```

#### scripts/performance-audit.js

```javascript
// BEFORE
const { chromeLauncher } = require('lighthouse');
const fs = require('fs');
const path = require('path');

// AFTER  
import { chromeLauncher } from 'lighthouse';
import fs from 'fs';
import path from 'path';
```

### **Plan B: JSON Report Cleanup (Safe Archival)**

#### Keep (Last 3 Cycles Only)

```bash
# Most recent files to preserve
reports/observe-1759846796544.json  # Latest
reports/observe-1759848018432.json  # 2nd latest  
reports/observe-1759835410148.json  # 3rd latest

# Corresponding run/verify files
reports/run-1759682004195.json      # Latest run
reports/verify-1759682004194.json   # Latest verify
```

#### Archive (Pre-Oct 7th files)

```bash  
# Delete old files (pre-October 7th timestamps)
reports/observe-175967*.json        # 30+ old files
reports/run-175967*.json            # 10+ old files  
reports/verify-175967*.json         # 10+ old files
```

### **Plan C: Markdown Auto-Fix**

#### Core Documentation Files

```bash
# Apply markdownlint auto-fixes
README.md                    # Fix trailing newline
CHANGELOG.md                 # Fix emphasis headings, list spacing
apps/vscode-ext/README.md    # Fix trailing newline  
.copilot/README.md          # Fix heading spacing, lists
```

#### Auto-Fix Command

```bash
npx markdownlint --fix **/*.md --ignore node_modules --ignore .next
```

---

## 🛡️ Safety Protocols

### **Protected Paths (Never Modified)**

- `/security/` - Security configurations  
- `**/*.spec.*` - Test files
- `/public-api/` - API definitions
- `.copilot/profile.*.md` - Governance profiles
- Recent wave reports (Ω²-W1*, Wave-Ω²-*)

### **Verification After Each Operation**

1. ✅ `npm run build` - Must pass
2. ✅ `npm run lint` - Must show 0 errors  
3. ✅ `npx tsc --noEmit` - Must pass
4. ✅ File count verification - Expected deletions only

### **Rollback Plan**

- Git commit after each operation
- Keep deleted files in `.archive/` temporarily
- Test build success before permanent deletion

---

## 📊 Success Metrics

### **Phase 1 Target (ESLint)**

```text
BEFORE: 11 ESLint problems
AFTER:  0 ESLint problems  
```

### **Phase 2 Target (JSON Cleanup)**

```text
BEFORE: 40+ JSON report files  
AFTER:  9 JSON files (3 observe + 3 run + 3 verify)
```

### **Phase 3 Target (Markdown)**  

```text
BEFORE: 1,100+ markdown warnings
AFTER:  0 markdown warnings
```

### **Final Target (VS Code Problems)**

```
BEFORE: 1,184+ total problems
AFTER:  0 problems in Problems tab
```

---

## ✅ Ready for Step 3: Execute Actions

**Strategy Approved**: Low-risk operations prioritized, critical files protected  
**Implementation Detailed**: Specific file changes and commands defined  
**Safety Verified**: Rollback plans and verification steps established  
**Impact Calculated**: Clear path from 1,184 problems to 0 problems  

**Next Action**: Execute Operation 1 - Fix ESLint Script Issues (4 files, 11 problems → 0)

---

**Generated**: October 8, 2025 | ODAVL Autonomous Agent | Problems Healing Mission
