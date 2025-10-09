# ODAVL Studio - 5-Minute Live Demo Script

## 🎯 Demo Objective
Demonstrate autonomous code quality improvement with enterprise safety in exactly 5 minutes.

## 📋 Prerequisites
- VS Code with ODAVL Doctor extension installed
- Sample repository with 10+ ESLint warnings (fallback: use demo repo)
- Timer visible (stopwatch or phone)
- Screen sharing optimized for visibility

---

## ⏱️ Precise Timing Breakdown

### **00:00 - 00:30: Setup & Context** (30 seconds)
**Script**: *"I'm going to show you ODAVL fixing real code quality issues in this repository. Notice we have 23 ESLint warnings here."*

**Actions**:
- Open VS Code with target repository
- Show ESLint problems panel: `Ctrl+Shift+M`
- Quickly scroll through warnings (unused imports, missing types, etc.)
- Show current eslint warning count in status bar

**Expected Output**: Problems panel showing 10+ ESLint warnings

---

### **00:30 - 01:30: Observe & Decide Phase** (60 seconds)
**Script**: *"Watch ODAVL observe these issues and decide on the safest fixes. This is the AI decision-making in action."*

**Actions**:
- Open Command Palette: `Ctrl+Shift+P`
- Run: `ODAVL: Doctor Mode`
- Wait for observation phase to complete
- Show decision output in ODAVL panel
- Point out "risk budget" and "trust score" for selected recipe

**Expected Output**:
```
[OBSERVE] ESLint warnings: 23, Type errors: 0
[DECIDE] Selected recipe: remove-unused (trust 0.89)
Risk budget: 3 files, 17 lines (within safety limits)
```

---

### **01:30 - 02:30: Act with Shadow Verification** (60 seconds)
**Script**: *"Now ODAVL acts, but first it tests changes in isolation. This is Shadow Verification - ensuring zero risk to your codebase."*

**Actions**:
- Click "Apply Fixes" in ODAVL Doctor panel
- Show shadow verification progress
- **If shadow verify fails**: Point out auto-undo protection
- **If shadow verify passes**: Show "SAFE TO APPLY" confirmation
- Apply changes to working directory

**Expected Output** (Success Path):
```
[ACT] Running eslint --fix on 3 files...
[SHADOW] Testing changes in isolation...
[VERIFY] All quality gates PASSED ✅
[SAFE] Ready to apply to working directory
```

**Expected Output** (Failure Path - if needed):
```
[SHADOW] Quality degradation detected ❌
[AUTO-UNDO] Changes rolled back automatically
[SAFE] Working directory unchanged
```

---

### **02:30 - 03:30: Evidence & Results** (60 seconds)
**Script**: *"Here's your before/after evidence. ODAVL always provides cryptographic proof of improvements."*

**Actions**:
- Show updated ESLint problems: should be reduced (e.g., 23 → 12)
- Open ODAVL evidence report (auto-generated)
- Highlight key metrics: files changed, lines modified, warnings fixed
- Show cryptographic attestation at bottom

**Expected Output**:
```
✅ ODAVL Improvement Evidence
📊 ESLint warnings: 23 → 12 (Δ -11)
📁 Files modified: 3 (within 5-file limit)
📝 Lines changed: 17 (within 40-line limit)
🛡️ Attestation: verified_20251009_16h33m24s
```

---

### **03:30 - 04:30: Governed Pull Request** (60 seconds)  
**Script**: *"ODAVL creates small, governed PRs that pass all your existing CI checks. No more messy bulk changes."*

**Actions**:
- Open Source Control panel: `Ctrl+Shift+G`
- Show staged changes (should be minimal, focused)
- Create commit with ODAVL-generated message
- **Optional**: Show how this integrates with GitHub PR workflow
- Emphasize "small batch" approach (≤5 files, ≤40 lines)

**Expected Output**:
- Clean git diff showing only relevant changes
- Commit message like: `chore: Remove unused imports and fix lint warnings`
- All changes within governance constraints

---

### **04:30 - 05:00: Wrap-up & CTA** (30 seconds)
**Script**: *"That's autonomous code quality improvement. ODAVL does this continuously, safely, while your team focuses on features. Ready to try it on your repository?"*

**Actions**:
- Show final ESLint count (reduced from start)
- Quick recap: "Safe, automatic, governed"
- Display next steps on screen

**Call to Action**:
- "Install the VS Code extension today"
- "Try our 2-week risk-free pilot"
- "Any questions about what you just saw?"

---

## 🚨 Fallback Plans

### If Demo Repository Has No Warnings
**Backup Repository**: Use https://github.com/odavl/demo-eslint-warnings
- Pre-loaded with 15+ common ESLint issues
- Guaranteed to demonstrate ODAVL capabilities
- Known safe changes that won't break functionality

### If ODAVL Extension Fails
**CLI Fallback**:
```bash
npx @odavl/cli run --demo-mode
```
- Shows same observe/decide/act cycle in terminal
- Generates same evidence reports
- Maintains 5-minute timing

### If Shadow Verification Fails (Good Demo!)
**Script**: *"Perfect! You just saw ODAVL's safety system in action. It detected a potential issue and automatically prevented any changes. This is exactly the enterprise safety you need."*

---

## 📊 Success Metrics
- **Timing**: Complete demo in exactly 5:00 (±10 seconds)
- **Engagement**: Audience asks questions about safety or ROI
- **Next Steps**: At least 50% request pilot or installation info
- **Technical**: Demo completes without major technical issues

---

## 🔧 Pre-Demo Checklist
- [ ] VS Code ODAVL extension installed and activated
- [ ] Target repository open with visible ESLint warnings
- [ ] Timer ready and visible
- [ ] Screen sharing optimized (large fonts, clear panels)
- [ ] Backup demo repository URL copied
- [ ] Fallback CLI command tested
- [ ] Next steps slide/info ready to display