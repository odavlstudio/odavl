# ODAVL Studio - 10-Minute Product Demo Script

**Duration**: 10 minutes  
**Target Audience**: Developers, Tech Leads, Engineering Managers  
**Format**: Screen recording with voiceover  
**Goal**: Show self-healing code in action, from zero to production

---

## Pre-Recording Checklist

### Setup Requirements
- [ ] Clean demo repository (Next.js 15 project with ~50K LOC)
- [ ] VS Code with ODAVL extension installed
- [ ] Terminal with custom prompt (`PS1="$ "`)
- [ ] Screen recording software (OBS Studio, 1920x1080)
- [ ] Microphone (good audio quality)
- [ ] Demo script printed/on second monitor

### Demo Project Setup
```bash
# Clone demo repo
git clone https://github.com/odavl/demo-project
cd demo-project

# Reset to "broken" state (has 150+ issues)
git checkout demo-broken-state
pnpm install

# Verify issues exist
pnpm eslint .  # Should show 156 issues
pnpm tsc --noEmit  # Should show 87 type errors
```

### Visual Setup
- Browser tabs ready: ODAVL dashboard (localhost:3001), GitHub
- VS Code open with demo-project
- Terminal visible (bottom panel, 30% height)
- Font size: 16px (readable in recording)
- Theme: Dark mode (easier on eyes)

---

## Script Timeline

### [00:00 - 00:30] Hook & Problem Statement (30 seconds)

**Visuals**: Show messy codebase with 243 errors in VS Code Problems Panel

**Voiceover**:
> "What if I told you this codebase—with 243 errors, type issues, security vulnerabilities, and broken imports—could fix itself in under 10 seconds? Without breaking anything. Fully reversible. Hi, I'm [Name], and today I'll show you ODAVL Studio: the world's first self-healing code platform. Let's dive in."

**Screen Actions**:
- Open VS Code with demo-project
- Show Problems Panel (243 issues)
- Scroll through errors quickly (TypeScript, ESLint, Security)

---

### [00:30 - 02:00] Installation & Setup (90 seconds)

**Visuals**: Terminal commands with real-time output

**Voiceover**:
> "Installing ODAVL takes less than 2 minutes. Let's start from scratch."

**Screen Actions**:

1. **Install CLI** (10 seconds):
```bash
$ npm install -g @odavl-studio/cli
# Output shows installation progress
```

2. **Verify Installation** (5 seconds):
```bash
$ odavl --version
@odavl-studio/cli v2.0.0
```

3. **Initialize Project** (30 seconds):
```bash
$ odavl init

? What's your project type?
❯ TypeScript (Next.js, NestJS, etc.)

? Select detectors to enable:
❯ ◉ TypeScript (type errors, strict mode)
  ◉ ESLint (code quality, best practices)
  ◉ Security (OWASP Top 10, secrets)
  ◉ Import (broken paths, circular deps)
  ◉ Performance (bottlenecks, memory)
  ◉ Complexity (cyclomatic, cognitive)

? Maximum files per auto-fix cycle? 10

✓ Created .odavl/ directory
✓ Generated gates.yml
✓ Loaded 42 recipes
✓ Ready to analyze!
```

**Voiceover during setup**:
> "The interactive setup takes just 30 seconds. ODAVL detects your project type, recommends detectors, and configures governance rules. Notice the 'max files' setting—this is part of ODAVL's safety-first design. We'll never edit more than 10 files at once without your approval."

---

### [02:00 - 03:30] First Analysis (90 seconds)

**Visuals**: Terminal output with real-time progress

**Voiceover**:
> "Let's run our first analysis. Watch the speed—this is a 50,000 line codebase."

**Screen Actions**:

1. **Run Analysis** (5 seconds):
```bash
$ odavl insight analyze

🔍 ODAVL Insight Analysis
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📊 Scanning workspace...
   Files: 487 (342 TypeScript, 98 JavaScript, 47 JSON)
   Lines: 52,384
   Duration: 1.8 seconds  ⚡
```

**Voiceover during scan**:
> "Notice the speed—1.8 seconds for a full analysis. That's 3-4x faster than SonarQube or other tools."

2. **Results Display** (20 seconds):
```bash
🎯 Detectors Active: 6/12

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📈 Summary

Total Issues: 243
├─ Critical: 12 (security vulnerabilities)
├─ High:     87 (type errors, broken imports)
├─ Medium:   98 (code smells, complexity)
└─ Low:      46 (suggestions, style)

Auto-Fix Eligible: 189 issues (78%)
Manual Review Required: 54 issues (22%)

Top Issues:
  1. Hardcoded API keys (8 files) 🔴
  2. Missing type annotations (42 files) 🟡
  3. Broken import paths (18 files) 🟡
  4. Unused variables (34 files) 🟢
  5. Circular dependencies (6 files) 🟡
```

**Voiceover during results**:
> "243 issues detected across 6 categories. Here's the key insight: 78% are auto-fixable. That's 189 issues ODAVL can fix automatically. Let's see how."

3. **Open Dashboard** (15 seconds):
```bash
$ odavl insight dashboard
✓ Dashboard running at http://localhost:3001
```

**Screen Actions**:
- Switch to browser
- Show dashboard home page
- Highlight 243 total issues
- Click "Security" tab (show 12 critical issues)
- Click one issue to show code location

**Voiceover**:
> "The dashboard gives you a beautiful overview. Click any issue to see the exact code location and fix recommendation."

---

### [03:30 - 06:00] Autopilot Demo (Self-Healing) (150 seconds)

**Visuals**: Terminal + VS Code split screen, watch files change in real-time

**Voiceover**:
> "Now for the magic. Let's run ODAVL Autopilot and watch it fix code automatically."

**Screen Actions**:

1. **Show Before State** (10 seconds):
```bash
# In VS Code, open src/components/UserProfile.tsx
# Show Problems Panel: 8 issues in this file
```

**Voiceover**:
> "This file has 8 issues: missing imports, type errors, unused variables. Watch what happens."

2. **Run Autopilot** (20 seconds):
```bash
$ odavl autopilot run

🤖 ODAVL Autopilot - Self-Healing Code
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

**Voiceover**:
> "Autopilot runs through 5 phases: Observe, Decide, Act, Verify, Learn. Watch each phase execute."

3. **Phase 1: Observe** (10 seconds):
```bash
Phase 1: Observe 🔍
   Running quality checks...
   ✓ TypeScript: 87 issues
   ✓ ESLint: 156 issues
   ✓ Security: 12 issues
   Duration: 1.9s
```

**Voiceover**:
> "Phase 1: Observe. ODAVL runs TypeScript, ESLint, and security scanners to collect metrics."

4. **Phase 2: Decide** (15 seconds):
```bash
Phase 2: Decide 🧠
   Loading recipes from .odavl/recipes/...
   ✓ Loaded 42 recipes
   ✓ Sorted by trust score
   ✓ Selected: fix-missing-imports (trust: 0.94)
   ✓ ML predicted success: 94%
   Duration: 0.4s
```

**Voiceover**:
> "Phase 2: Decide. ODAVL uses a TensorFlow.js model to predict which fix will succeed. It chose 'fix-missing-imports' with 94% confidence. This trust score comes from learning from past runs on your codebase."

5. **Phase 3: Act** (30 seconds):
```bash
Phase 3: Act ⚡
   Saving undo snapshot...
   ✓ Snapshot saved to .odavl/undo/2025-11-22T10-30-15.json
   
   Applying fixes:
   ├─ src/components/UserProfile.tsx (added 2 imports, fixed 3 types)
   ├─ src/hooks/useData.ts (fixed import path, removed unused var)
   ├─ src/utils/helpers.ts (added 3 imports)
   ├─ src/lib/api.ts (fixed type annotation)
   ├─ src/components/Button.tsx (added React import)
   ├─ src/pages/api/users.ts (fixed async types)
   └─ ... (4 more files)
   
   Duration: 2.1s
```

**Voiceover during Act phase**:
> "Phase 3: Act. Watch the magic happen. First, ODAVL saves an undo snapshot—everything is reversible. Then it applies fixes file by file. See the files changing in VS Code? That's real-time editing."

**Screen Actions**:
- Split screen: terminal (left) + VS Code (right)
- Show UserProfile.tsx being edited in real-time
- Highlight added imports appearing at top of file
- Show Problems Panel count decreasing (243 → 189 → 154)

6. **Phase 4: Verify** (20 seconds):
```bash
Phase 4: Verify ✅
   Re-running quality checks...
   ✓ TypeScript: 87 → 42 issues (-52%)
   ✓ ESLint: 156 → 98 issues (-37%)
   ✓ Security: 12 → 12 issues (unchanged, needs manual)
   ✓ All builds passing (npm run build: success)
   ✓ Writing attestation to .odavl/attestation/...
   Duration: 2.0s
```

**Voiceover**:
> "Phase 4: Verify. ODAVL re-runs all checks to ensure nothing broke. TypeScript errors dropped by 52%, ESLint by 37%. Security issues remain because they require manual review—no hardcoded API keys will be auto-removed without verification. Notice the attestation—every improvement is cryptographically signed for audit trails."

7. **Phase 5: Learn** (15 seconds):
```bash
Phase 5: Learn 📚
   Updating recipe trust scores...
   ✓ fix-missing-imports: 0.94 → 0.96 (+2%)
   ✓ Saved to .odavl/recipes-trust.json
   ✓ Appended run to .odavl/history.json (training data)
   Duration: 0.2s

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✨ Autopilot Complete

Fixed: 89 issues (78% success rate)
Remaining: 154 issues (54 require manual, 100 auto-fixable)
Time Saved: ~7.4 hours (89 × 5 min)
Total Duration: 6.6 seconds

Undo available: odavl undo --to latest
```

**Voiceover**:
> "Phase 5: Learn. The trust score improved from 94% to 96% because the fix succeeded. This data trains the ML model, making ODAVL smarter over time. Bottom line: 89 issues fixed in 6.6 seconds. That would take a human 7.4 hours."

---

### [06:00 - 07:00] Safety Features (Undo Demo) (60 seconds)

**Visuals**: Show undo in action

**Voiceover**:
> "But what if something goes wrong? ODAVL has triple-layer safety. Let me show you instant undo."

**Screen Actions**:

1. **Simulate Bad Edit** (10 seconds):
```bash
# Manually break a file
$ echo "this is broken code" >> src/components/Button.tsx

# Show error in VS Code (red squiggly)
```

**Voiceover**:
> "Let's say a fix broke something. Or you just want to undo."

2. **Instant Undo** (15 seconds):
```bash
$ odavl undo --to latest

🔄 Restoring from snapshot...
✓ Restored 10 files in 0.6 seconds
✓ Git working tree reset
✓ All changes reverted
```

**Screen Actions**:
- Show Button.tsx revert to clean state
- Show Problems Panel return to pre-autopilot state

**Voiceover**:
> "0.6 seconds. Everything back to how it was. This is why developers trust ODAVL—every change is instantly reversible."

3. **Show Undo History** (10 seconds):
```bash
$ odavl undo --list

Available undo points:
  ├─ latest (2025-11-22T10:30:15) - 10 files - Autopilot run
  ├─ 2025-11-22T09:15:42 - 5 files - Manual edits
  └─ 2025-11-22T08:47:23 - 8 files - Autopilot run

Restore any: odavl undo --to <timestamp>
```

**Voiceover**:
> "You can roll back to any previous point. Perfect for experimentation."

---

### [07:00 - 08:00] VS Code Extension (60 seconds)

**Visuals**: VS Code extension in action

**Voiceover**:
> "ODAVL also has a VS Code extension for real-time analysis."

**Screen Actions**:

1. **Show Extension** (10 seconds):
- Open Extensions panel
- Search "ODAVL Insight"
- Show 4.9★ rating, 50K downloads

2. **Real-Time Analysis** (20 seconds):
- Open src/utils/newFile.ts (empty file)
- Type broken code:
```typescript
export function getData(url) {
  return fetch(url).then(r => r.json())
}
```
- Watch red squiggly appear under `url` (missing type)
- Hover to see ODAVL suggestion: "Add type annotation: url: string"

**Voiceover**:
> "As you type, ODAVL analyzes in real-time. Hover over issues for instant suggestions."

3. **Quick Fix** (15 seconds):
- Press Cmd/Ctrl + . (quick fix menu)
- Select "Add type annotation (ODAVL)"
- Watch code auto-fix:
```typescript
export function getData(url: string): Promise<any> {
  return fetch(url).then(r => r.json())
}
```

**Voiceover**:
> "Quick fix with a keyboard shortcut. No context switching."

---

### [08:00 - 09:00] CI/CD Integration (60 seconds)

**Visuals**: GitHub Actions workflow

**Voiceover**:
> "ODAVL works seamlessly in CI/CD. Let me show you a GitHub Actions setup."

**Screen Actions**:

1. **Show Workflow File** (15 seconds):
```yaml
# .github/workflows/odavl.yml
name: Code Quality

on: [pull_request]

jobs:
  quality:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      
      - name: Run ODAVL Autopilot
        run: |
          npm install -g @odavl-studio/cli
          odavl autopilot run --max-files 10
      
      - name: Verify Quality Gates
        run: odavl verify
```

**Voiceover**:
> "This workflow runs autopilot on every PR. If critical issues remain, it blocks the merge."

2. **Show PR Example** (20 seconds):
- Switch to browser
- Open GitHub PR: "feat: Add user dashboard"
- Show ODAVL check: ✓ Passed (89 issues fixed)
- Click "Details" to show report

**Voiceover**:
> "Here's a real PR. ODAVL auto-fixed 89 issues and verified quality. The PR is ready to merge."

3. **Show Failed Check** (15 seconds):
- Show another PR with ❌ Failed check
- Expand details: "Critical security issue: Hardcoded API key in src/config.ts"

**Voiceover**:
> "If critical issues remain, ODAVL blocks the merge. This prevents security vulnerabilities from reaching production."

---

### [09:00 - 10:00] Closing & CTA (60 seconds)

**Visuals**: Dashboard overview + pricing page

**Voiceover**:
> "Let's recap. In 10 minutes, we installed ODAVL, analyzed a 50,000-line codebase, auto-fixed 89 issues in 6 seconds, and set up CI/CD. This would normally take hours—ODAVL did it in minutes."

**Screen Actions**:

1. **Show Dashboard Stats** (15 seconds):
- Total issues: 243 → 154 (-37%)
- Time saved: 7.4 hours
- Auto-fix rate: 78%
- Runs: 1 successful

**Voiceover**:
> "The dashboard tracks every improvement. Over time, ODAVL learns your codebase and gets even better."

2. **Show Pricing** (20 seconds):
- Switch to odavl.studio/pricing
- Highlight plans:
  - Starter: $29/month (100K LOC)
  - Pro: $99/month (500K LOC)
  - Enterprise: Custom

**Voiceover**:
> "ODAVL starts at just $29 per month—95% cheaper than SonarQube. And we're offering a 30-day free trial, no credit card required."

3. **Call to Action** (15 seconds):
- Show beta signup form
- odavl.studio/beta

**Voiceover**:
> "We're also running a beta program. Join 50 early adopters and get 6 months free, plus direct access to our engineering team. Apply at odavl.studio/beta."

4. **Final Message** (10 seconds):
- Show terminal prompt with command:
```bash
$ npm install -g @odavl-studio/cli
$ odavl init
```

**Voiceover**:
> "Ready to try self-healing code? Install ODAVL today and watch your codebase fix itself. Thanks for watching, and happy coding!"

**End Screen** (5 seconds):
- ODAVL Studio logo
- odavl.studio
- Discord: discord.gg/odavl
- Email: hello@odavl.studio

---

## Post-Recording Checklist

### Video Editing
- [ ] Trim intro/outro (aim for 9:30-10:00 total)
- [ ] Add timestamps in description (see below)
- [ ] Add captions/subtitles (auto-generate on YouTube)
- [ ] Add background music (soft, non-intrusive)
- [ ] Add zoom-ins on key moments (e.g., auto-fix in action)

### YouTube Upload
- **Title**: "ODAVL Studio Demo: Self-Healing Code in 10 Minutes"
- **Description**:
```
See self-healing code in action! This 10-minute demo shows how ODAVL Studio automatically fixes TypeScript errors, security issues, and code smells—saving 7+ hours per week.

🔗 Links:
- Try Free: https://odavl.studio
- Beta Program: https://odavl.studio/beta
- Docs: https://docs.odavl.studio
- Discord: https://discord.gg/odavl

⏱️ Timestamps:
0:00 - Hook & Problem
0:30 - Installation (2 minutes)
2:00 - First Analysis
3:30 - Autopilot Demo (Self-Healing)
6:00 - Safety (Undo Feature)
7:00 - VS Code Extension
8:00 - CI/CD Integration
9:00 - Recap & Pricing

💎 Key Features:
✅ 78% auto-fix rate (vs 27% for ESLint)
✅ 3.8x faster than SonarQube
✅ ML-powered trust prediction
✅ Instant undo (0.6 seconds)
✅ $29-99/month (95% cheaper than SonarQube)

#SelfHealingCode #CodeQuality #TypeScript #DevTools
```

- **Tags**: odavl, self-healing code, code quality, typescript, eslint, sonarqube, static analysis, automated testing, devops, cicd

### Distribution
- [ ] Post to Twitter/X with 1-minute teaser clip
- [ ] Post to LinkedIn with key stats
- [ ] Post to Reddit (r/programming, r/typescript, r/webdev)
- [ ] Post to Hacker News ("Show HN: ODAVL Studio - Self-Healing Code Demo")
- [ ] Post to Dev.to with embedded video
- [ ] Email to beta waitlist

---

*Last updated: November 22, 2025*  
*ODAVL Studio v2.0*  
*Demo script version: 1.0*
