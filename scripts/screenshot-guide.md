# 📸 ODAVL Studio - Screenshot Capture Guide
**Quick Manual Capture (10 minutes)**

## ✅ Prerequisites
- ✅ Insight Cloud running on http://localhost:3001
- ✅ Demo data seeded (184 error instances, 8 Guardian tests)
- ✅ Output directory: `sales/screenshots/`

## 🎯 10 Screenshot Checklist

### Screenshot 1: Hero Dashboard
**File**: `01-hero-dashboard.png`
**URL**: http://localhost:3001/global-insight
**Instructions**:
1. Open URL in Chrome (F11 for fullscreen)
2. Wait for data to load (2-3 seconds)
3. Press `Win + Shift + S` (Windows Snipping Tool)
4. Select entire screen
5. Save as `sales/screenshots/01-hero-dashboard.png`

**What to show**:
- Global metrics at top (Total Projects, Error Signatures, etc.)
- 12 detector cards in grid layout
- Color-coded severity badges (Critical, High, Medium, Low)

---

### Screenshot 2: Detector Grid Close-Up
**File**: `02-detector-grid.png`
**URL**: http://localhost:3001/global-insight
**Instructions**:
1. Same URL as Screenshot 1
2. Scroll down ~400px to focus on detector cards
3. Press `Win + Shift + S`
4. Capture just the 12 detector cards (TypeScript, ESLint, Security, etc.)
5. Save as `sales/screenshots/02-detector-grid.png`

**What to show**:
- All 12 detector cards with icons
- Error counts for each detector
- Severity distribution (Critical/High/Medium/Low)

---

### Screenshot 3: Error Details Page
**File**: `03-error-details.png`
**URL**: http://localhost:3001/errors (or click any error from dashboard)
**Instructions**:
1. Navigate to URL or click "View Details" on any error
2. Wait for fix recommendations to load
3. Press `Win + Shift + S`
4. Capture full error details page
5. Save as `sales/screenshots/03-error-details.png`

**What to show**:
- Error signature with full message
- File path and line number
- Fix recommendations with confidence scores (0.75-0.99)
- "Apply Fix" button

---

### Screenshot 4: Guardian Results Table
**File**: `04-guardian-results.png`
**URL**: http://localhost:3001/guardian
**Instructions**:
1. Navigate to Guardian page
2. Wait for test results table to load (8 rows)
3. Press `Win + Shift + S`
4. Capture the full results table
5. Save as `sales/screenshots/04-guardian-results.png`

**What to show**:
- Table with 8 Guardian test results
- Color-coded scores (green > 80, yellow 60-80, red < 60)
- Overall score, accessibility, performance, security columns
- Pass/Fail status

---

### Screenshot 5: Guardian Summary Cards
**File**: `05-guardian-summary.png`
**URL**: http://localhost:3001/guardian
**Instructions**:
1. Same URL as Screenshot 4
2. Scroll to top to show summary cards
3. Press `Win + Shift + S`
4. Capture the 4 summary metric cards
5. Save as `sales/screenshots/05-guardian-summary.png`

**What to show**:
- 4 cards: Total Tests, Average Score, Pass Rate, Average Performance
- Large numbers with icons
- Color-coded trend indicators

---

### Screenshot 6: Beta Signup Page
**File**: `06-beta-signup.png`
**URL**: http://localhost:3001/beta
**Instructions**:
1. Navigate to beta signup page
2. Wait for page to load
3. Press `Win + Shift + S`
4. Capture full page with form and feature cards
5. Save as `sales/screenshots/06-beta-signup.png`

**What to show**:
- Hero headline: "Join ODAVL Studio Beta"
- Email signup form
- 3 product feature cards (Insight, Autopilot, Guardian)
- "Get Early Access" CTA button

---

### Screenshot 7: Dark Mode Comparison
**File**: `07-dark-mode.png`
**URL**: http://localhost:3001/global-insight
**Instructions**:
1. Capture light mode (default)
2. Click theme toggle button (top right)
3. Capture dark mode
4. Use image editor to create side-by-side comparison
5. Save as `sales/screenshots/07-dark-mode.png`

**What to show**:
- Split screen: Light mode (left) vs Dark mode (right)
- Same dashboard view in both themes
- Theme toggle button highlighted

---

### Screenshot 8: Export Options Dropdown
**File**: `08-export-options.png`
**URL**: http://localhost:3001/global-insight
**Instructions**:
1. Navigate to dashboard
2. Click "Export" button (if available, or use inspector to add dropdown)
3. Press `Win + Shift + S`
4. Capture dropdown menu
5. Save as `sales/screenshots/08-export-options.png`

**What to show** (if export feature exists):
- Export button highlighted
- Dropdown with PDF/CSV options
- File format icons

**Fallback**: Screenshot the data table with "Export" placeholder

---

### Screenshot 9: VS Code Extension (Problems Panel)
**File**: `09-vscode-problems-panel.png`
**URL**: Open VS Code with ODAVL extension active
**Instructions**:
1. Open VS Code in ODAVL workspace
2. Open a TypeScript file with errors
3. Show Problems Panel (Ctrl+Shift+M)
4. ODAVL errors should be visible with "ODAVL/security" source
5. Press `Win + Shift + S`
6. Capture Problems Panel
7. Save as `sales/screenshots/09-vscode-problems-panel.png`

**What to show**:
- VS Code Problems Panel with ODAVL diagnostics
- Error messages with file paths
- Click-to-navigate functionality
- ODAVL icon/branding

---

### Screenshot 10: CLI Output (Terminal)
**File**: `10-cli-output.png`
**URL**: Terminal running ODAVL CLI
**Instructions**:
1. Open PowerShell in ODAVL directory
2. Run: `pnpm odavl:insight` or `odavl guardian test https://example.com`
3. Wait for output (colored terminal output)
4. Press `Win + Shift + S`
5. Capture terminal with full output
6. Save as `sales/screenshots/10-cli-output.png`

**What to show**:
- Terminal prompt with ODAVL command
- Colored output (green ✓, red ✗, yellow warnings)
- Progress indicators or summary table
- "ODAVL Studio" branding in output

---

## 🚀 Quick Capture Workflow

### Total Time: 10-15 minutes

1. **Setup (1 min)**:
   - Open Chrome at 1920x1080 (F11 fullscreen)
   - Open Windows Snipping Tool (`Win + Shift + S`)
   - Navigate to http://localhost:3001/global-insight

2. **Capture Loop (8-10 min)**:
   ```
   For each screenshot (1-6):
     1. Navigate to URL
     2. Wait 2 seconds for load
     3. Win + Shift + S → capture
     4. Save to sales/screenshots/
     5. Next screenshot
   ```

3. **Special Screenshots (3-4 min)**:
   - Screenshot 7: Toggle theme, capture both, merge in editor
   - Screenshot 9: Open VS Code, show Problems Panel
   - Screenshot 10: Run CLI command, capture terminal

4. **Verification (1 min)**:
   - Check all 10 files exist in `sales/screenshots/`
   - File sizes < 500KB (compress with TinyPNG if needed)
   - Quality check: Clear text, good contrast, no blurriness

---

## 🎨 Image Quality Standards

- **Resolution**: 1920x1080 (Full HD)
- **Format**: PNG (lossless)
- **File Size**: < 500KB per image (use TinyPNG to compress)
- **Aspect Ratio**: 16:9
- **Content**: Focus on UI clarity, readable text, realistic data

---

## 📦 Compression

After capturing all screenshots:

```powershell
# Check file sizes
Get-ChildItem sales\screenshots\*.png | Select-Object Name, @{Name="Size(KB)";Expression={[math]::Round($_.Length/1KB, 2)}} | Format-Table

# Compress large files (> 500KB)
# Option 1: TinyPNG website (https://tinypng.com)
# Option 2: ImageMagick
# Option 3: Windows built-in compression (right-click → Send to → Compressed folder)
```

---

## ✅ Final Checklist

- [ ] All 10 screenshots captured
- [ ] Files saved to `sales/screenshots/`
- [ ] All files < 500KB (compressed if needed)
- [ ] Quality verified (clear text, good contrast)
- [ ] Naming convention: `01-hero-dashboard.png` to `10-cli-output.png`
- [ ] Ready for Product Hunt upload

---

## 🎬 Next Step: Demo Video

After screenshots complete, record 60-second demo video:

```powershell
# Use OBS Studio or Windows Game Bar (Win+G)
# Script: 5 scenes × 10-12 seconds
# Export: MP4, 1080p, 30 FPS, < 50MB
```

See `docs/VISUAL_ASSETS_QUICK_START.md` for video storyboard.
