# ODAVL Insight VS Code Extension - Publishing Checklist

**Extension**: odavl-insight-vscode  
**Version**: 1.0.0  
**Publisher**: odavl  
**Date**: December 13, 2025

---

## ✅ Pre-Publishing Verification (COMPLETED)

### 1. Package Metadata ✅
- [x] **Name**: `odavl-insight-vscode` (lowercase, hyphenated)
- [x] **Display Name**: "ODAVL Insight" (user-friendly)
- [x] **Description**: Clear, concise (160 chars)
- [x] **Version**: 1.0.0 (semver compliant)
- [x] **Publisher**: `odavl` (registered on marketplace)
- [x] **Icon**: icon.png (128x128, 5.13 KB) ✅
- [x] **Repository**: GitHub link configured
- [x] **Homepage**: https://odavl.studio
- [x] **License**: MIT (LICENSE file present)

### 2. Engine & Activation ✅
- [x] **engines.vscode**: "^1.80.0" (compatible with VS Code 1.80+)
- [x] **activationEvents**: ["onStartupFinished"] (efficient lazy loading)
- [x] **main**: "./dist/extension-v2.js" (98.2 KB, minified)

### 3. Categories & Keywords ✅
- [x] **Categories**: Linters, Programming Languages, Testing, Other
- [x] **Keywords**: error-detection, code-quality, ai, ml, typescript, python, java, multi-language, diagnostics, odavl, automation, cloud, collaboration

### 4. Commands & Contributions ✅
- [x] **9 commands** registered (signIn, signOut, analyzeWorkspace, etc.)
- [x] **Menus**: Command palette integration
- [x] **Configuration**: 8 settings (autoAnalyzeOnSave, enabledDetectors, etc.)

### 5. Documentation ✅
- [x] **README.md**: 446 lines, comprehensive (features, installation, usage)
- [x] **CHANGELOG.md**: 257 lines, detailed v1.0.0 release notes
- [x] **Screenshots**: mockup-dashboard.html available
- [x] **License**: MIT license included

### 6. Build & Package ✅
- [x] **Compilation**: esbuild bundling successful (37ms)
- [x] **Bundle size**: 98.2 KB (minified, sourcemap 383.7 KB)
- [x] **Dependencies**: External (@odavl-studio/insight-core, @odavl-studio/auth)
- [x] **VSIX generation**: 5.07 MB total (17 files)
- [x] **Local installation**: ✅ Successfully installed and tested

### 7. .vscodeignore ✅
- [x] Excludes: src/**, tests/**, node_modules/**, .vscode/**, *.log
- [x] Includes: README.md, CHANGELOG.md, LICENSE, icon.png, dist/

---

## 🚀 Publishing Commands

### Option 1: Publish to VS Code Marketplace (Requires Personal Access Token)

#### Step 1: Get Personal Access Token (PAT)
1. Go to: https://dev.azure.com/odavlstudio/_usersSettings/tokens
2. Create new token with:
   - **Organization**: All accessible organizations
   - **Scopes**: Marketplace → Manage
   - **Expiration**: 90 days (or custom)
3. Copy the token (shown only once)

#### Step 2: Login with vsce
```bash
cd C:\Users\sabou\dev\odavl\odavl-studio\insight\extension
pnpm vsce login odavl
# Paste your PAT when prompted
```

#### Step 3: Publish Extension
```bash
# Publish to marketplace (uses existing VSIX)
pnpm vsce publish --packagePath odavl-insight-vscode-1.0.0.vsix

# OR package + publish in one command
pnpm vsce publish --no-dependencies

# Verify publish
pnpm vsce show odavl.odavl-insight-vscode
```

### Option 2: Manual Upload (No PAT Required)

1. Go to: https://marketplace.visualstudio.com/manage/publishers/odavl
2. Click "New extension" → "Visual Studio Code"
3. Upload: `odavl-insight-vscode-1.0.0.vsix`
4. Fill metadata (auto-populated from package.json)
5. Click "Upload"

---

## 🔍 Post-Publishing Verification

### 1. Marketplace Listing ⏳
- [ ] Visit: https://marketplace.visualstudio.com/items?itemName=odavl.odavl-insight-vscode
- [ ] Check: Icon displays correctly (128x128)
- [ ] Check: Description, README, and screenshots render properly
- [ ] Check: Version shows "1.0.0"
- [ ] Check: Install button works

### 2. Install from Marketplace ⏳
```bash
# From VS Code Extensions view
code --install-extension odavl.odavl-insight-vscode

# Verify installed version
code --list-extensions --show-versions | Select-String "odavl"
```

### 3. Functional Testing ⏳
- [ ] **Extension activates**: Check "ODAVL Insight" in Extensions list
- [ ] **Commands available**: Ctrl+Shift+P → search "ODAVL"
- [ ] **Status bar icon**: Should show in bottom bar
- [ ] **Analyze workspace**: Run command, verify diagnostics appear
- [ ] **Problems panel**: Issues show up correctly
- [ ] **Configuration**: Settings work (odavl-insight.*)

### 4. Analytics & Monitoring ⏳
- [ ] Check install count after 24 hours
- [ ] Monitor error reports (if telemetry enabled)
- [ ] Review marketplace ratings/feedback

---

## 📊 Current Package Stats

| Metric | Value |
|--------|-------|
| **VSIX File** | odavl-insight-vscode-1.0.0.vsix |
| **Total Size** | 5.07 MB |
| **Bundle Size** | 98.2 KB (minified) |
| **Files Included** | 17 files |
| **Compilation Time** | 37ms |
| **Local Install** | ✅ Successful |

---

## ⚠️ Known Issues to Monitor

1. **Bundle Size**: 5.07 MB total (dist/extension.js is 4.27 MB legacy file)
   - **Action**: Consider cleaning up old extension.js if not needed
   - **Impact**: Faster downloads, smaller install footprint

2. **vsce Version**: Using v2.32.0 (latest is v3.7.1)
   - **Action**: Update vsce: `pnpm add -D @vscode/vsce@latest`
   - **Impact**: Better publishing features, bug fixes

3. **Dependencies**: Workspace dependencies (@odavl-studio/*)
   - **Action**: Ensure insight-core and auth are published to npm
   - **Impact**: Extension won't work if dependencies unavailable

---

## 🎯 Success Criteria

- [x] VSIX builds without errors
- [x] Extension installs locally
- [ ] Extension published to marketplace
- [ ] Installable via VS Code Extensions view
- [ ] All commands execute without errors
- [ ] Diagnostics appear in Problems panel
- [ ] Marketplace listing complete with icon, README, changelog

---

## 📝 Rollback Plan

If issues arise after publishing:

1. **Unpublish specific version**:
   ```bash
   pnpm vsce unpublish odavl.odavl-insight-vscode@1.0.0
   ```

2. **Unpublish entire extension** (nuclear option):
   ```bash
   pnpm vsce unpublish odavl.odavl-insight-vscode
   ```

3. **Republish fixed version**:
   ```bash
   # Bump version in package.json to 1.0.1
   pnpm vsce publish --no-dependencies
   ```

---

## 📞 Support Contacts

- **Publisher Portal**: https://marketplace.visualstudio.com/manage/publishers/odavl
- **VS Code Docs**: https://code.visualstudio.com/api/working-with-extensions/publishing-extension
- **ODAVL Studio**: https://odavl.studio/support

---

**Ready to Publish**: ✅ YES  
**Blockers**: None (PAT required for CLI publishing, or use manual upload)  
**Estimated Publishing Time**: 5-10 minutes  
**Marketplace Approval**: Typically 5-30 minutes

---

**Next Step**: Choose publishing method (CLI with PAT or manual upload) and execute.
