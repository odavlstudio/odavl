# ODAVL Extensions - Screenshot Capture Guide

## Required Screenshots (1280x720, 4 per extension)

### ODAVL Insight Extension

**1. Main Dashboard** (`01-dashboard.png`)
- Open Insight Panel (Ctrl+Shift+P → "ODAVL: Open Insight Panel")
- Show overview with error statistics
- Display recent detections (5-7 items)
- Capture: Full webview panel

**2. Problems Panel Integration** (`02-problems-panel.png`)
- Open Problems Panel (Ctrl+Shift+M)
- Show ODAVL diagnostics with errors/warnings
- Include file path, line number, severity
- Highlight click-to-navigate feature
- Capture: Problems Panel + code editor side-by-side

**3. Settings Configuration** (`03-settings.png`)
- Open Settings (Ctrl+,)
- Search: "ODAVL"
- Show key settings:
  - odavl.enablePerfMetrics
  - odavl.autoOpenLedger
  - odavl.insight.detectors (checkboxes)
- Capture: Settings UI with ODAVL section

**4. Analysis Results** (`04-analysis-results.png`)
- Run analysis on sample project
- Show results in Output panel ("ODAVL Studio" channel)
- Display: Detectors run, issues found, time taken
- Include Problems Panel with new issues highlighted
- Capture: Output + Problems Panel split view

---

### ODAVL Autopilot Extension

**1. Dashboard View** (`01-dashboard.png`)
- Open Autopilot Panel (Ctrl+Shift+P → "ODAVL: Open Autopilot Dashboard")
- Show: Current cycle status, recipes loaded, trust scores
- Display recent runs (3-4 entries)
- Capture: Full webview dashboard

**2. Ledger Auto-Open** (`02-ledger-view.png`)
- Show auto-opened ledger file (run-*.json)
- Highlight edited files section with diffs
- Display phase execution (Observe → Decide → Act → Verify → Learn)
- Capture: Ledger JSON with syntax highlighting

**3. Configuration Panel** (`03-config.png`)
- Show .odavl/gates.yml in editor
- Highlight: max_auto_changes, forbidden_paths
- Display: Risk budget, thresholds
- Capture: gates.yml with clear formatting

**4. Activity Monitor** (`04-activity.png`)
- Open Activity view (sidebar tree view)
- Show: Recent runs, success/failure indicators
- Display recipes with trust scores
- Highlight: Click to open ledger
- Capture: Sidebar activity view + editor

---

### ODAVL Guardian Extension

**1. Quality Dashboard** (`01-dashboard.png`)
- Open Guardian Panel
- Show: Quality gates status (pass/fail)
- Display metrics: Accessibility, Performance, Security
- Show recent test runs
- Capture: Full dashboard

**2. Test Results** (`02-test-results.png`)
- Show detailed test results
- Display: Failed tests highlighted, pass rate
- Include: Performance scores, accessibility violations
- Capture: Results panel with details expanded

**3. Settings Configuration** (`03-settings.png`)
- Open Guardian settings
- Show: Quality gate thresholds
- Display: Test types enabled/disabled
- Capture: Settings UI

**4. Pre-Deploy Check** (`04-predeploy.png`)
- Show pre-deploy gate enforcement
- Display: All checks passing (green checkmarks)
- Include: Deployment ready indicator
- Capture: Pre-deploy checklist view

---

## Capture Instructions

1. **Resolution**: 1280x720 (16:9 aspect ratio)
2. **Format**: PNG (lossless)
3. **VS Code Theme**: Use Dark+ (default dark) for consistency
4. **Font Size**: Zoom to 110% for readability
5. **Sample Project**: Use `examples/sample-ts-project` in workspace
6. **Annotations**: Use red rectangles to highlight key features (optional)

## Tools for Capture

**Windows:**
- Win + Shift + S (Snipping Tool)
- ShareX (advanced)

**VS Code Extensions:**
- Polacode (for code snippets with theme)
- CodeSnap (for styled code screenshots)

## File Naming Convention

```
[extension-name]/screenshots/
  01-dashboard.png
  02-problems-panel.png (or feature-specific)
  03-settings.png
  04-results.png (or feature-specific)
```

---

## Post-Capture Checklist

- [ ] All 12 screenshots captured (4 × 3 extensions)
- [ ] Resolution verified: 1280x720
- [ ] File sizes reasonable (<500KB per PNG)
- [ ] No sensitive data visible (API keys, tokens)
- [ ] Clear, legible text at marketplace size
- [ ] Consistent VS Code theme across all screenshots

---

**Note**: Since we don't have the extensions running yet, create placeholder screenshots with mockups or use similar VS Code panels with ODAVL branding overlays. Real screenshots can be captured after Task 1.7 (local testing).

**Estimated Time**: 30 minutes per extension = 1.5 hours total
