# Git Release Instructions - ODAVL Studio v2.0.0

**Quick Guide for Creating GitHub Release**

## Prerequisites

Ensure you have:
- [x] All changes committed
- [x] Working directory clean
- [x] All 3 .vsix files present
- [x] Documentation complete

## Step-by-Step Release Process

### 1. Verify Files Exist

```powershell
# Check .vsix files
Test-Path odavl-studio/insight/extension/odavl-insight-vscode-2.0.0.vsix
Test-Path odavl-studio/autopilot/extension/odavl-autopilot-vscode-2.0.0.vsix
Test-Path odavl-studio/guardian/extension/odavl-guardian-vscode-2.0.0.vsix

# Should all return: True
```

### 2. Commit Final Changes

```bash
git status
git add .
git commit -m "chore: prepare v2.0.0 release

- Update LICENSE copyright to 2024-2025
- Add v2.0.0 to CHANGELOG.md
- Create CONTRIBUTING.md
- Create QUICK_START_GUIDE.md
- Create RELEASE_NOTES_V2.0.0.md
- Update package.json to v2.0.0
- Enhance extension READMEs
- Add GitHub Marketplace checklist
- Complete Week 1-2 milestones"
```

### 3. Create and Push Tag

```bash
# Create annotated tag
git tag -a v2.0.0 -m "ODAVL Studio v2.0.0 - Complete Platform Release

Three products, one platform:
- ODAVL Insight (ML-powered error detection)
- ODAVL Autopilot (Self-healing infrastructure)
- ODAVL Guardian (Pre-deploy testing)

Includes:
- 3 VS Code extensions (15.24 KB total)
- Unified CLI (11.83 KB)
- Public SDK (dual ESM/CJS)
- Comprehensive documentation
- 96% test pass rate
- 80.23% ML accuracy"

# Push tag
git push origin v2.0.0

# Or push all tags
git push --tags
```

### 4. Create GitHub Release

#### Option A: Via GitHub Web Interface (Recommended)

1. Go to: https://github.com/Monawlo812/odavl/releases/new
2. **Tag version**: Select `v2.0.0` (or type if not listed)
3. **Release title**: `ODAVL Studio v2.0.0 - Complete Platform Release`
4. **Description**: Copy content from `RELEASE_NOTES_V2.0.0.md`
5. **Attach binaries**:
   - Upload `odavl-insight-vscode-2.0.0.vsix`
   - Upload `odavl-autopilot-vscode-2.0.0.vsix`
   - Upload `odavl-guardian-vscode-2.0.0.vsix`
6. **Check**: "Set as the latest release"
7. **Click**: "Publish release"

#### Option B: Via GitHub CLI

```bash
# Install GitHub CLI if not present
# https://cli.github.com/

# Create release
gh release create v2.0.0 \
  --title "ODAVL Studio v2.0.0 - Complete Platform Release" \
  --notes-file RELEASE_NOTES_V2.0.0.md \
  odavl-studio/insight/extension/odavl-insight-vscode-2.0.0.vsix \
  odavl-studio/autopilot/extension/odavl-autopilot-vscode-2.0.0.vsix \
  odavl-studio/guardian/extension/odavl-guardian-vscode-2.0.0.vsix

# Verify release
gh release view v2.0.0
```

### 5. Post-Release Actions

```bash
# Update repository description on GitHub
# Settings → General → Description:
"ODAVL Studio - Unified platform for autonomous code quality with ML-powered error detection, self-healing infrastructure, and pre-deploy testing"

# Add topics (Settings → General → Topics):
code-quality, typescript, vscode-extension, ml-powered, 
self-healing, autonomous, developer-tools, devops, testing, 
security, performance, pre-deploy, eslint, static-analysis, 
cicd, quality-gates
```

## Verification Checklist

After creating release, verify:

- [ ] Release appears at: https://github.com/Monawlo812/odavl/releases
- [ ] Tag v2.0.0 is visible
- [ ] All 3 .vsix files are downloadable
- [ ] Release notes display correctly
- [ ] "Latest" badge shows on release
- [ ] Source code archives are available (auto-generated)

## Download URLs

After release, files will be at:

```
https://github.com/Monawlo812/odavl/releases/download/v2.0.0/odavl-insight-vscode-2.0.0.vsix
https://github.com/Monawlo812/odavl/releases/download/v2.0.0/odavl-autopilot-vscode-2.0.0.vsix
https://github.com/Monawlo812/odavl/releases/download/v2.0.0/odavl-guardian-vscode-2.0.0.vsix
```

## Announcement Template

### Twitter/X

```
🎉 ODAVL Studio v2.0.0 is here!

Autonomous code quality with:
🔍 ML-powered error detection (12 detectors)
⚡ Self-healing infrastructure (O-D-A-V-L cycle)
🛡️ Pre-deploy testing (Accessibility, Performance, Security)

3 VS Code extensions, 1 platform

Download: https://github.com/Monawlo812/odavl/releases/tag/v2.0.0

#TypeScript #VSCode #DevTools #CodeQuality
```

### Reddit (r/typescript, r/vscode)

```
Title: [Release] ODAVL Studio v2.0 - Autonomous Code Quality Platform

I'm excited to announce ODAVL Studio v2.0, a complete platform for autonomous code quality!

**Three Products:**
- ODAVL Insight: ML-powered error detection (12 specialized detectors)
- ODAVL Autopilot: Self-healing code infrastructure (O-D-A-V-L cycle)
- ODAVL Guardian: Pre-deploy testing (Accessibility, Performance, Security, SEO)

**Key Features:**
- Real-time error detection in VS Code Problems Panel
- Autonomous improvements with triple-layer safety
- 96% test pass rate, 80.23% ML accuracy
- Extremely lightweight (15 KB for all 3 extensions)

**Download:** https://github.com/Monawlo812/odavl/releases/tag/v2.0.0
**Quick Start:** https://github.com/Monawlo812/odavl/blob/main/QUICK_START_GUIDE.md

Feedback and contributions welcome!
```

### Dev.to Article

```
Title: Introducing ODAVL Studio v2.0 - Autonomous Code Quality for TypeScript

[Draft article using RELEASE_NOTES_V2.0.0.md as template]

1. Introduction
2. Three Products Overview
3. Installation Guide
4. Usage Examples
5. Technical Highlights
6. Roadmap
7. Contributing

Link: https://github.com/Monawlo812/odavl
```

## Troubleshooting

### Tag Already Exists

```bash
# Delete local tag
git tag -d v2.0.0

# Delete remote tag
git push --delete origin v2.0.0

# Recreate
git tag -a v2.0.0 -m "..."
git push origin v2.0.0
```

### Wrong Files Uploaded

1. Edit release on GitHub
2. Delete incorrect files
3. Upload correct files
4. Save changes

### Release Notes Formatting Issues

- Use GitHub markdown preview
- Check for broken links
- Verify code blocks render correctly
- Test download links

## Next Steps After Release

1. **Monitor GitHub**
   - Watch for issues/discussions
   - Respond to questions
   - Acknowledge bug reports

2. **Track Downloads**
   - Check release metrics
   - Monitor extension usage
   - Collect user feedback

3. **Plan Week 2**
   - Demo video (Task #9)
   - Beta recruitment (Task #10)
   - Screenshots for README

4. **Community Engagement**
   - Share on social media
   - Post on forums
   - Engage with early adopters

## Support Channels

After release, users can:

- Report issues: https://github.com/Monawlo812/odavl/issues
- Ask questions: https://github.com/Monawlo812/odavl/discussions
- Read docs: https://github.com/Monawlo812/odavl/tree/main/docs

---

**Ready to release?** Follow steps 1-5 above and announce to the world! 🚀

**Questions?** Check GITHUB_MARKETPLACE_CHECKLIST.md for detailed preparation steps.

**Good luck!** 🎉
