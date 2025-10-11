# ODAVL System Rollback Archive Manifest
**Archive Created**: 2025-10-11 15:13:39  
**Purpose**: Safety backup before Wave 8 final state restoration  
**Archive Location**: `archive/pre-rollback-20251011-151339/`

## Current System State at Archive Time

### Modified Files (M)
- `.github/copilot-instructions.md` - Updated instructions
- `.odavl/attestation/latest.json` - Latest attestation
- `.odavl/history.json` - System history  
- `.odavl/recipes-trust.json` - Recipe trust scores
- `.odavl/shadow/verify.log` - Shadow verification
- `.odavl/undo/latest.json` - Undo capability
- `README.md` - Project documentation
- `apps/cli/package.json` - CLI package configuration
- `apps/cli/src/index.ts` - Main CLI implementation
- `apps/vscode-ext/README.md` - Extension documentation
- `apps/vscode-ext/odavl-0.1.1.vsix` - Extension package
- `apps/vscode-ext/package.json` - Extension configuration
- `apps/vscode-ext/src/extension.test.ts` - Extension tests
- `apps/vscode-ext/src/extension.ts` - Extension implementation
- `odavl-website/config/marketing/blog.config.ts` - Blog configuration
- `odavl-website/config/marketing/brand.identity.json` - Brand identity
- `odavl-website/public/logo.png` - Logo asset
- `package.json` - Root package configuration
- `pnpm-lock.yaml` - Package lock file
- Multiple forensic and performance reports
- Sales and workshop documentation

### Deleted Files (D)
- Multiple cleanup and audit files
- Phase reports (phase5-9, waveA-C)
- Various configuration and documentation files

### New Untracked Files (??)
- `.copilot/` - Copilot integration files
- `.husky/` - Git hooks
- `.odavl/analytics/` - Analytics configuration
- `.odavl/attestation/` - Multiple attestation files
- `.odavl/shadow-learning/` - Shadow learning data
- `.odavl/undo/` - Multiple undo files
- `.prettierrc.json` - Code formatting
- `.test/` - Test configuration
- `.vscode/extensions.json` - VS Code extensions
- `apps/cli/src/analytics/` - CLI analytics
- `apps/cli/src/autonomous/` - Autonomous features
- `apps/cli/src/enterprise/` - Enterprise features
- `apps/cli/src/evidence/` - Evidence system
- `apps/cli/src/learning/` - Learning system
- `apps/cli/src/recipes/` - Recipe system
- `apps/cli/src/security/` - Security features
- `apps/cli/src/ui/` - UI components
- `apps/vscode-ext-enhanced/` - Enhanced extension
- `apps/vscode-ext/` - Additional extension files
- `docs/WAVE4_CONTINUOUS_AUTONOMY.md` - Wave 4 documentation
- `evidence/` - Complete evidence system
- `logo/` - Logo assets
- `odavl-website-enhanced/` - Enhanced website
- `odavl.code-workspace` - VS Code workspace
- Multiple forensic reports and archives
- `scripts/init-workspace.ts` - Workspace initialization
- `test-decision-data/` - Test data
- `test-evidence/` - Test evidence
- `tools/test-advanced-decisions.ps1` - Testing tools

## Enhanced Components to be Removed

### Primary Enhanced Directories
1. `odavl-website-enhanced/` - Enterprise-grade website enhancement
2. `apps/vscode-ext-enhanced/` - Enhanced VS Code extension

### Supporting Enhancement Files
- Enhanced configurations
- Additional analytics and evidence systems
- Autonomous decision-making components
- Enterprise security and learning features

## Rollback Target State

The rollback aims to restore the system to Wave 8 final state, which represents:
- Clean core ODAVL functionality
- Stable CLI and VS Code extension
- Original website without enterprise enhancements
- Baseline configuration and policies
- Core evidence and reporting system

## Recovery Procedures

If rollback needs to be reversed:
1. Restore from this archive: `archive/pre-rollback-20251011-151339/`
2. Copy enhanced directories back to root
3. Restore configurations and evidence files
4. Reinstall enhanced dependencies
5. Verify enhanced system functionality

## Archive Contents

### Directories Archived
- `odavl-website-enhanced/` → Complete enhanced website
- `apps/vscode-ext-enhanced/` → Enhanced extension
- `evidence/` → Complete evidence system
- `reports/` → All reports and forensic data
- `.odavl/` → All ODAVL configurations

### Files Archived
- `package.json` → Root package configuration
- `pnpm-lock.yaml` → Package lock state

## Verification Checksums
- Archive creation completed: 2025-10-11 15:13:39
- Total archived size: Multiple GB of enhanced components
- Critical files preserved: Configuration, evidence, reports
- Enhanced features backed up: Website, extension, enterprise components

---
**Archive Status**: ✅ Complete  
**Next Step**: Proceed with enhanced directory removal  
**Safety**: Full restoration capability maintained