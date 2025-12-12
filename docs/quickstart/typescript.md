# Quick Start Guide (TypeScript/JavaScript)

**Goal**: Get from install to first scan in 5 minutes.

---

## Prerequisites

- Node.js 18+ (`node --version`)
- npm/pnpm/yarn
- Git repository

---

## Step 1: Install CLI (30 seconds)

```bash
# Using npm
npm install -g @odavl-studio/cli

# Using pnpm (recommended)
pnpm add -g @odavl-studio/cli

# Verify installation
odavl --version
```

**Expected output**: `odavl v2.0.0`

---

## Step 2: Initialize Workspace (1 minute)

```bash
cd /path/to/your/project
odavl init
```

**Interactive prompts**:
1. **Language**: Select "TypeScript" (arrow keys + Enter)
2. **Detectors**: Choose "All" (recommended for first run)
3. **Autopilot**: Enable? → "No" (for now, we'll do manual first)
4. **Cloud sync**: Link account? → "Skip" (optional, can add later)

**What this creates**:
- `.odavl/` directory (config, history, snapshots)
- `.odavl/gates.yml` (governance rules)
- `.odavl/config.yml` (detector settings)

---

## Step 3: Run First Scan (2 minutes)

```bash
odavl insight analyze
```

**What happens**:
1. Scans all `.ts` and `.tsx` files
2. Runs 16 detectors (TypeScript, security, performance, etc.)
3. Generates report in terminal + `.odavl/reports/`

**Example output**:
```
✓ TypeScript Detector: 23 issues found
✓ Security Detector: 5 critical, 12 high
✓ Performance Detector: 8 warnings
✓ Complexity Detector: 15 files exceeding threshold

Total: 87 issues detected
Report: .odavl/reports/insight-2025-03-15.json
```

---

## Step 4: Review Issues (1 minute)

**Option A: Terminal View**
```bash
odavl insight report --severity critical
```

**Option B: VS Code Extension**
1. Install: "ODAVL Studio" from marketplace
2. Open Problems Panel (Ctrl+Shift+M)
3. Filter: ODAVL issues

**Option C: Web Dashboard**
```bash
odavl dashboard
```
Opens localhost:3001 with interactive report

---

## Step 5: Fix Issues (Choose Your Path)

### Path 1: Manual Fix (Recommended for First Time)

1. Open file with issue
2. Read detector explanation
3. Fix manually
4. Re-run: `odavl insight analyze`

### Path 2: AI-Assisted Fix

```bash
odavl insight fix --file src/index.ts --issue TS001
```

ODAVL suggests fix, you approve/reject.

### Path 3: Autonomous (Autopilot)

```bash
odavl autopilot run --max-files 5
```

⚠️ Only after you trust the tool. Start small.

---

## Next Steps

**Enable Pre-Commit Hook** (prevents bad commits):
```bash
odavl hooks install
```

**Add to CI/CD**:
```yaml
# .github/workflows/odavl.yml
- name: ODAVL Quality Check
  run: |
    npm install -g @odavl-studio/cli
    odavl insight analyze --fail-on critical
```

**Explore Features**:
- `odavl autopilot --help` (autonomous fixes)
- `odavl guardian --help` (pre-deploy validation)
- `odavl --docs` (open full documentation)

---

## Troubleshooting

### "Command not found: odavl"

**Fix**: Add npm global bin to PATH
```bash
# Find global bin path
npm config get prefix

# Add to ~/.bashrc or ~/.zshrc
export PATH=$PATH:$(npm config get prefix)/bin
```

### "No issues detected" (but you know there are)

**Fix**: Verify language detected correctly
```bash
cat .odavl/config.yml | grep language
# Should show: language: typescript
```

### "Permission denied" errors

**Fix**: Run with correct permissions
```bash
# Linux/Mac
sudo npm install -g @odavl-studio/cli

# Windows (run as Administrator)
npm install -g @odavl-studio/cli
```

---

## Common Questions

**Q: Does ODAVL modify my code without asking?**  
A: No. Manual mode (`odavl insight`) only detects. Autopilot requires explicit `odavl autopilot run` command. Every change is reversible with `odavl autopilot undo`.

**Q: Can I use ODAVL with existing tools (ESLint, Prettier)?**  
A: Yes. ODAVL complements them. It runs your existing tools + adds ML-powered analysis.

**Q: Is my code sent to your servers?**  
A: No. CLI runs locally. Cloud dashboard (optional) stores only metadata (file paths, issue counts), never code content.

**Q: How do I customize detector rules?**  
A: Edit `.odavl/config.yml` or use interactive config:
```bash
odavl config set detectors.typescript.strict true
```

---

## Resources

- **Full Documentation**: odavl.com/docs
- **Video Walkthrough**: odavl.com/demo
- **Discord Community**: discord.gg/odavl
- **GitHub Issues**: github.com/odavlstudio/odavl/issues
