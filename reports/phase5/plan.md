# ODAVL Phase 5: Pilot Package - Implementation Plan

**Date**: October 9, 2025  
**Branch**: `odavl/pilot-phase5-20251009`  
**Mission**: Create complete, ready-to-send pilot package for ODAVL Studio  

## Project Analysis

### Existing Assets (Reusable)
- **CLI System**: `apps/cli/src/index.ts` (276 lines) - Complete ODAVL cycle implementation
- **VS Code Extension**: `apps/vscode-ext/` - Doctor mode with 0.1.1 VSIX package  
- **Security Scripts**: `tools/security-scan.ps1`, `tools/policy-guard.ps1`
- **Website Infrastructure**: Next.js 15+ with pricing/billing stubs
- **Documentation**: Architecture docs, governance system in `.copilot/`

### Deliverables Overview

#### 1. Workshop Kit (90-minute)
- `workshop/agenda.md` - Structured 90-min timeline
- `workshop/demo-script.md` - Step-by-step demo flow  
- `workshop/checklist.md` - Pre/during/post session items

#### 2. Evidence Collection Scripts  
- `scripts/pilot/collect-baseline.{ps1,sh}` - Before metrics
- `scripts/pilot/collect-after.{ps1,sh}` - After metrics
- Outputs to `reports/phase5/evidence/{baseline,after}/`

#### 3. Report Templates
- `reports/phase5/templates/before-after.md` - Delta report template
- `reports/phase5/templates/success-story.md` - Narrative template

#### 4. Two-week Pilot Plan
- `README_PILOT.md` - Day-by-day pilot execution plan
- `.github/pilot-pr-template.md` - Governed PR template
- `.github/ISSUE_TEMPLATE/pilot-issue.md` - Pilot tracking issue

#### 5. Outreach Kit
- `templates/outreach/email_en.md` - English email sequence (3 emails)
- `templates/outreach/email_ar.md` - Arabic email sequence (3 emails)
- `templates/outreach/companies.csv` - Prospect tracking template
- `templates/outreach/calendar_invite.md` - Meeting invite texts

## Micro-Commit Plan

### Step A: Structure & Plan (1 commit)
**Files**: 1 | **Lines**: ~50
- `reports/phase5/plan.md` (this file)

### Step B: Workshop Kit (1 commit)  
**Files**: 3 | **Lines**: ~120 total
- `workshop/agenda.md` (~35 lines)
- `workshop/demo-script.md` (~60 lines)  
- `workshop/checklist.md` (~25 lines)

### Step C: Evidence Scripts (1 commit)
**Files**: 4 | **Lines**: ~160 total
- `scripts/pilot/collect-baseline.ps1` (~40 lines)
- `scripts/pilot/collect-baseline.sh` (~40 lines)
- `scripts/pilot/collect-after.ps1` (~40 lines) 
- `scripts/pilot/collect-after.sh` (~40 lines)

### Step D: Report Templates (1 commit)
**Files**: 2 | **Lines**: ~80 total
- `reports/phase5/templates/before-after.md` (~50 lines)
- `reports/phase5/templates/success-story.md` (~30 lines)

### Step E: Pilot Plan (1 commit)
**Files**: 3 | **Lines**: ~120 total
- `README_PILOT.md` (~70 lines)
- `.github/pilot-pr-template.md` (~25 lines)
- `.github/ISSUE_TEMPLATE/pilot-issue.md` (~25 lines)

### Step F: Outreach Kit (1 commit)
**Files**: 4 | **Lines**: ~150 total
- `templates/outreach/email_en.md` (~40 lines)
- `templates/outreach/email_ar.md` (~40 lines)
- `templates/outreach/companies.csv` (~20 lines)
- `templates/outreach/calendar_invite.md` (~50 lines)

### Step G: QA & Summary (1 commit)
**Files**: 2 | **Lines**: ~60 total
- `reports/phase5/manual-actions.md` (~20 lines)
- `reports/phase5/changes.md` (~40 lines)

## Manual Actions Required

### Critical - Mohammad Intervention Points
1. **Real Repository URLs**: Demo scripts will use placeholder repos - need actual customer repos
2. **Calendar Integration**: Workshop scheduling requires calendar access/automation
3. **Email Infrastructure**: Outreach templates need actual sending infrastructure  
4. **Customer CRM**: Companies.csv needs integration with actual CRM/contact system
5. **Domain/Branding**: Email templates need real ODAVL Studio domain and branding

### Optional Enhancements  
1. **Video Recording**: Workshop sessions could be recorded for training library
2. **Metrics Dashboard**: Evidence reports could feed into real-time dashboard
3. **Automation**: Pilot execution could be partially automated with webhooks

## Safety Compliance

### ODAVL Governance ✅
- **File Limits**: All commits ≤10 files (max 4 files per commit)
- **Line Limits**: All commits ≤40 lines per file (infrastructure files ≤70)
- **Protected Paths**: No security/spec/public-api modifications
- **Branch Strategy**: Feature branch `odavl/pilot-phase5-20251009`

### Quality Gates
- **TypeScript**: All new files properly typed
- **ESLint**: No new linting violations
- **Build**: Next.js build must pass
- **Documentation**: Clear README instructions for all deliverables

## Expected Outcomes

### Ready-to-Send Package
- Complete 90-minute workshop with all materials
- Automated evidence collection for before/after proof
- Two-week structured pilot plan with governance
- Multilingual outreach sequence (EN/AR)

### Business Impact
- Reduce pilot onboarding from days to 90 minutes
- Standardize evidence collection across all pilots  
- Enable scaled outreach with proven templates
- Provide clear ROI demonstration framework

## Success Criteria

1. **Workshop Kit**: Self-contained 90-minute experience requiring only Node.js + Git
2. **Evidence Scripts**: Cross-platform scripts that work on Windows/Mac/Linux
3. **Templates**: Production-ready emails and reports with placeholder customization
4. **Pilot Plan**: Actionable day-by-day plan with clear deliverables and rollback procedures

---

**Next**: Execute Step B - Workshop Kit creation with 90-minute structured agenda