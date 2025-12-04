# ODAVL Insight - Screenshots

> **Note**: These are text-based mockups. For actual launch, capture real screenshots from VS Code.

---

## Screenshot 1: Problems Panel Integration

**File**: `src/api/users.ts`

```
PROBLEMS (5)

├── ODAVL/security (2)
│   ├── ❌ Hardcoded API key detected
│   │   src/api/users.ts:12:5
│   │   const API_KEY = "sk-1234567890abcdef";
│   │   
│   │   🔍 Root Cause: Credentials in source code
│   │   💡 Fix: Use environment variables
│   │
│   └── ⚠️  SQL injection vulnerability
│       src/api/users.ts:45:20
│       const query = `SELECT * FROM users WHERE id = ${userId}`;
│       
│       🔍 Root Cause: Unsafe string concatenation
│       💡 Fix: Use parameterized queries
│
├── ODAVL/performance (2)
│   ├── ⚠️  Blocking operation in async context
│   │   src/utils/file.ts:8:10
│   │   const data = fs.readFileSync(path);
│   │   
│   │   🔍 Root Cause: Sync I/O blocks event loop
│   │   💡 Fix: Use fs.promises.readFile()
│   │
│   └── ⚠️  N+1 query detected
│       src/api/posts.ts:23:15
│       for (const user of users) {
│         await prisma.posts.findMany({ where: { userId: user.id } });
│       }
│       
│       🔍 Root Cause: Multiple queries in loop
│       💡 Fix: Use prisma.posts.findMany with 'in' operator
│
└── ODAVL/typescript (1)
    └── ❌ Type 'string' is not assignable to type 'number'
        src/models/user.ts:15:5
        const age: number = "25";
        
        🔍 Root Cause: Type mismatch
        💡 Fix: Change to const age: number = 25;
```

**Caption**: Real-time error detection in VS Code Problems Panel with 12 specialized detectors

---

## Screenshot 2: Auto-Fix in Action (Pro Feature)

**Before:**
```typescript
// src/api/database.ts
export async function getUsers() {
    const users = await db.query('SELECT * FROM users');
    
    for (const user of users) {
        const posts = await db.query(`SELECT * FROM posts WHERE user_id = ${user.id}`);
        user.posts = posts;
    }
    
    return users;
}
```

**ODAVL Insight Detection:**
```
⚠️  N+1 Query Detected (Line 5)
🔍 Root Cause: Multiple queries in loop (performance impact: ~500ms per user)
💡 Auto-Fix Available (Pro)
```

**After (One-Click Fix):**
```typescript
// src/api/database.ts
export async function getUsers() {
    const users = await db.query('SELECT * FROM users');
    
    // ODAVL: Optimized batch query (82% faster)
    const userIds = users.map(u => u.id);
    const posts = await db.query(`
        SELECT * FROM posts 
        WHERE user_id IN (${userIds.join(',')})
    `);
    
    // ODAVL: Group posts by user
    const postsByUser = posts.reduce((acc, post) => {
        (acc[post.user_id] ||= []).push(post);
        return acc;
    }, {});
    
    users.forEach(user => {
        user.posts = postsByUser[user.id] || [];
    });
    
    return users;
}
```

**Result:**
- ✅ N+1 query eliminated
- ⚡ Performance: 12 queries → 2 queries
- 🚀 Speed improvement: 82% faster
- 📊 Estimated time saved: 500ms per request

**Caption**: AI-powered auto-fix suggestions with one-click apply (Pro tier)

---

## Screenshot 3: ML Training Dashboard (Pro Feature)

**ML Trust Predictor - Training Results**

```
════════════════════════════════════════════════════════════════
                    ODAVL ML TRAINING RESULTS
════════════════════════════════════════════════════════════════

Model: Trust Predictor v2.0
Training Date: 2025-12-03
Framework: TensorFlow.js

────────────────────────────────────────────────────────────────
DATASET
────────────────────────────────────────────────────────────────
Training Samples:     1,247 error patterns
Validation Samples:     312 error patterns
Test Samples:           156 error patterns

────────────────────────────────────────────────────────────────
MODEL ARCHITECTURE
────────────────────────────────────────────────────────────────
Input Layer:          64 features (complexity, severity, file type)
Hidden Layer 1:       128 neurons (ReLU activation)
Dropout:              30% (prevent overfitting)
Hidden Layer 2:       64 neurons (ReLU activation)
Output Layer:         1 neuron (Sigmoid activation)
Loss Function:        Binary Crossentropy
Optimizer:            Adam (lr=0.001)

────────────────────────────────────────────────────────────────
TRAINING METRICS
────────────────────────────────────────────────────────────────
Epochs:               50 (early stopping at epoch 42)
Training Accuracy:    87.3%
Validation Accuracy:  82.1%
Test Accuracy:        80.4%
Loss (final):         0.274

────────────────────────────────────────────────────────────────
FALSE POSITIVE REDUCTION
────────────────────────────────────────────────────────────────
Before ML:            1,441 false positives (security detector)
After ML:             259 false positives
Reduction:            82% ✅

────────────────────────────────────────────────────────────────
REAL-WORLD PERFORMANCE
────────────────────────────────────────────────────────────────
Projects Analyzed:    127 (TypeScript, Python, Java)
Total Errors Found:   8,234
True Positives:       7,891 (95.8%)
False Positives:      343 (4.2%)
False Negatives:      52 (0.6%)

Precision:            95.8%
Recall:               99.3%
F1 Score:             97.5%

────────────────────────────────────────────────────────────────
TOP LEARNED PATTERNS
────────────────────────────────────────────────────────────────
1. Enum type names (VALID_STATES, ERROR_CODES) → NOT secrets (98% confidence)
2. Dynamic generation (nanoid, uuid) → NOT hardcoded (96% confidence)
3. Template literals with only variables → NOT suspicious (94% confidence)
4. JSON-LD structured data → NOT XSS risk (92% confidence)
5. Wrapper functions (http.get) → NOT direct network calls (89% confidence)

────────────────────────────────────────────────────────────────
MODEL SAVINGS
────────────────────────────────────────────────────────────────
Location: .odavl/ml-models/trust-predictor-v2/
Size:     1.2 MB (model.json + weights)
Format:   TensorFlow.js (portable, runs in browser/Node)

════════════════════════════════════════════════════════════════
```

**Caption**: ML-powered false positive elimination with 82% reduction and 80% accuracy

---

## How to Capture Real Screenshots (For Launch Day)

### Screenshot 1: Problems Panel
1. Open VS Code with Insight extension installed
2. Open a sample project with intentional errors
3. Run "ODAVL: Analyze Workspace"
4. Capture Problems Panel (View → Problems)
5. Tools: Snagit, ShareX, or Windows Snipping Tool

### Screenshot 2: Auto-Fix
1. Trigger auto-fix on N+1 query detection
2. Capture before/after comparison
3. Use split-screen or two screenshots side-by-side
4. Highlight performance metrics

### Screenshot 3: ML Training
1. Run `pnpm ml:train` command
2. Capture terminal output during training
3. Run `pnpm ml:model-info` for final metrics
4. Create clean dashboard visualization

---

**Status**: Text mockups ready ✅  
**Next Step**: Capture real screenshots on launch day (5 minutes)  
**Tools Needed**: VS Code + Insight extension + sample project  
