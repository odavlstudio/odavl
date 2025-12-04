# ODAVL Guardian - Architectural Boundaries

**Critical**: Guardian v4.0 does NOT execute fixes automatically.  
Each ODAVL product has ONE job:

---

## 🛡️ Product Boundaries

### Guardian - Detect + Suggest (NEVER Fix)

**Job**: Quality gates and pre-deployment validation

✅ **Allowed:**
- Detect runtime errors (Playwright testing)
- AI visual inspection (screenshot analysis)
- Generate fix suggestions (AI-powered diagnostics)
- Multi-platform testing (GitHub Actions)
- Block bad deployments (quality gates)

❌ **Forbidden:**
- Execute file modifications
- Apply fixes automatically
- Refactor code
- Update dependencies

**Integration**: Guardian generates fix suggestions → hands off to Autopilot

---

### Insight - Analyze + Explain (NEVER Fix)

**Job**: Error detection and learning

✅ **Allowed:**
- Detect 12 types of errors (TypeScript, security, complexity, etc.)
- Explain errors with context
- Suggest improvements
- Track error patterns

❌ **Forbidden:**
- Auto-fix errors
- Modify files
- Execute commands

**Integration**: Insight analyzes errors → educates developers → hands off complex fixes to Autopilot

---

### Autopilot - Execute Fixes (ONLY Product That Fixes)

**Job**: Safe execution of code changes

✅ **Allowed:**
- Execute file modifications
- Apply refactorings
- Update dependencies
- Run O-D-A-V-L cycle (Observe, Decide, Act, Verify, Learn)
- Create undo snapshots
- Rollback on failure

❌ **Forbidden:**
- Deep error analysis (use Insight)
- Pre-deployment validation (use Guardian)

**Integration**: Consumes suggestions from Guardian and Insight → executes safely with O-D-A-V-L cycle

---

## 🔄 Integration Flow

### Guardian → Autopilot Handoff

1. **Guardian detects runtime error**
   ```bash
   guardian launch:ai ./my-extension
   ```

2. **Guardian analyzes with AI**
   - Root cause analysis
   - Platform-specific detection
   - Generate fix suggestions

3. **Guardian saves handoff file**
   ```
   .odavl/guardian/handoff-to-autopilot.json
   ```

4. **User reviews suggestions**
   - Inspect suggested changes
   - Understand root cause
   - Decide if fix is appropriate

5. **Autopilot executes fixes**
   ```bash
   odavl autopilot run
   ```
   - Reads handoff file
   - Applies fixes with O-D-A-V-L cycle
   - Creates undo snapshots
   - Verifies changes

---

## 📦 Handoff File Format

```json
{
  "source": "odavl-guardian",
  "timestamp": "2025-11-30T...",
  "issue": {
    "type": "runtime-error",
    "rootCause": "useContext called outside provider",
    "isPlatformSpecific": false,
    "affectedFiles": ["src/components/Dashboard.tsx"],
    "confidence": 0.95
  },
  "suggestedFix": {
    "files": [
      {
        "path": "src/components/Dashboard.tsx",
        "action": "modify",
        "before": "export default function Dashboard() {",
        "after": "'use client';\n\nexport default function Dashboard() {",
        "explanation": "Add 'use client' directive for Next.js 13+ compatibility"
      }
    ],
    "testPlan": [
      "Restart Next.js dev server",
      "Open /dashboard route",
      "Verify no useContext errors in console"
    ],
    "verificationSteps": [
      "Check browser console for errors",
      "Verify dashboard renders correctly"
    ]
  },
  "reasoning": "Next.js App Router requires 'use client' for hooks",
  "nextSteps": [
    "1. Review suggested fix",
    "2. Run: odavl autopilot run",
    "3. Autopilot will safely apply fixes with O-D-A-V-L cycle",
    "4. Verify with test plan"
  ]
}
```

---

## 🚨 Why This Matters

### Before (Wrong)

```bash
# Guardian tries to do everything
guardian launch:fix ./my-extension
# ❌ Guardian executes fixes (violates boundaries)
# ❌ No undo mechanism
# ❌ No verification cycle
# ❌ Confuses users about product roles
```

### After (Correct)

```bash
# Guardian detects and suggests
guardian launch:ai ./my-extension
# ✅ Guardian analyzes runtime errors
# ✅ Guardian generates fix suggestions
# ✅ Guardian saves handoff file

# User reviews suggestions
cat .odavl/guardian/handoff-to-autopilot.json

# Autopilot executes safely
odavl autopilot run
# ✅ Autopilot reads suggestions
# ✅ Autopilot executes with O-D-A-V-L cycle
# ✅ Autopilot creates undo snapshots
# ✅ Autopilot verifies changes
```

---

## 🔧 Developer Guidelines

### When Building Guardian Features

**Ask These Questions:**

1. ✅ Am I detecting an issue?  
   → Guardian is the right place

2. ✅ Am I generating fix suggestions?  
   → Guardian can do this (but NOT execute)

3. ❌ Am I executing file modifications?  
   → Stop! This belongs in Autopilot

4. ❌ Am I running complex error analysis?  
   → Consider if Insight should do this

### Guardian Feature Checklist

- [ ] Does it detect runtime issues? ✅
- [ ] Does it analyze errors with AI? ✅
- [ ] Does it generate fix suggestions? ✅
- [ ] Does it write to files? ❌ (Autopilot only)
- [ ] Does it execute terminal commands? ❌ (Autopilot only)
- [ ] Does it create undo snapshots? ❌ (Autopilot only)

---

## 📚 See Also

- [Guardian v4.0 Quickstart](./GUARDIAN_V4_QUICKSTART.md) - Runtime testing usage
- [Autopilot Documentation](../autopilot/README.md) - Safe fix execution
- [Insight Documentation](../insight/README.md) - Error detection and analysis
- [ODAVL Studio Guide](../../ODAVL_STUDIO_V2_GUIDE.md) - Complete architecture

---

**Last Updated**: November 30, 2025  
**Version**: Guardian v4.0  
**Status**: Boundaries enforced
