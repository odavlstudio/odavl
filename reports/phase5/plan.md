# ODAVL Phase 5: Pilot Package - Implementation Plan

## Phase Overview
Create a complete "ready-to-send today" pilot package for ODAVL Studio including workshop materials, evidence collection scripts, pilot plans, and outreach templates.

## Existing Assets Analysis
**Reusable Components:**
- ✅ CLI System: `apps/cli/src/index.ts` - Full ODAVL cycle implementation
- ✅ VS Code Extension: `apps/vscode-ext/` - Doctor mode with real-time monitoring  
- ✅ Security Scanner: `tools/security-scan.ps1` - CVE and license compliance
- ✅ Governance Tools: `tools/policy-guard.ps1` - Safety constraint validation
- ✅ Website & Billing: Complete marketing + pricing infrastructure

## Deliverables by Step

### Step B - Workshop Kit (90-minute)
**Files to Create:**
- `workshop/agenda.md` (~40 lines)
- `workshop/demo-script.md` (~120 lines) 
- `workshop/checklist.md` (~60 lines)

### Step C - Evidence Scripts  
**Files to Create:**
- `scripts/pilot/collect-baseline.ps1` (~80 lines)
- `scripts/pilot/collect-baseline.sh` (~80 lines)
- `scripts/pilot/collect-after.ps1` (~60 lines)
- `scripts/pilot/collect-after.sh` (~60 lines)

### Step D - Report Templates
**Files to Create:**
- `reports/phase5/templates/before-after.md` (~100 lines)
- `reports/phase5/templates/success-story.md` (~80 lines)

### Step E - Two-week Pilot Plan
**Files to Create:**
- `README_PILOT.md` (update existing ~50 lines added)
- `.github/pilot-pr-template.md` (~40 lines)
- `.github/ISSUE_TEMPLATE/pilot-issue.md` (~50 lines)

### Step F - Outreach Kit
**Files to Create:**
- `templates/outreach/email_en.md` (~150 lines - 3 emails)
- `templates/outreach/email_ar.md` (~150 lines - 3 emails) 
- `templates/outreach/companies.csv` (~20 lines with headers)
- `templates/outreach/calendar_invite.md` (~60 lines - 2 invites)

## Micro-Commit Strategy

### Commit 1: Plan Documentation
- Files: `reports/phase5/plan.md`
- Estimated: 80 lines
- Safety: Read-only planning document

### Commit 2: Workshop Materials  
- Files: `workshop/agenda.md`, `workshop/demo-script.md`, `workshop/checklist.md`
- Estimated: 220 lines across 3 files
- Safety: Documentation only, no code changes

### Commit 3: Evidence Collection (PowerShell)
- Files: `scripts/pilot/collect-baseline.ps1`, `scripts/pilot/collect-after.ps1`
- Estimated: 140 lines across 2 files  
- Safety: Read-only scripts, reuse existing security-scan.ps1

### Commit 4: Evidence Collection (Bash)
- Files: `scripts/pilot/collect-baseline.sh`, `scripts/pilot/collect-after.sh`
- Estimated: 140 lines across 2 files
- Safety: Bash variants of PowerShell scripts

### Commit 5: Report Templates
- Files: `reports/phase5/templates/before-after.md`, `reports/phase5/templates/success-story.md`
- Estimated: 180 lines across 2 files
- Safety: Template files only

### Commit 6: Pilot Plan Updates
- Files: `README_PILOT.md`, `.github/pilot-pr-template.md`, `.github/ISSUE_TEMPLATE/pilot-issue.md`
- Estimated: 140 lines across 3 files
- Safety: Process documentation and templates

### Commit 7: Outreach Kit
- Files: `templates/outreach/email_en.md`, `templates/outreach/email_ar.md`, `templates/outreach/companies.csv`, `templates/outreach/calendar_invite.md`
- Estimated: 380 lines across 4 files
- Safety: Email templates and sample data

## Manual Action Items (Will Pause For)

### Calendar Integration
- [ ] Mohammad to set up Calendly/Teams integration for workshop booking
- [ ] Add real meeting links to calendar invite templates

### Customer Data
- [ ] Real company contact list (replace template CSV)
- [ ] Email domain setup for outreach campaigns
- [ ] CRM integration for lead tracking

### Demo Repository
- [ ] Select or create sample repository for workshop demos
- [ ] Ensure demo repo has ESLint warnings for live fixing
- [ ] Set up branch protection rules for governed PR demo

### Production Deployment
- [ ] Domain email setup (workshop@odavl.studio)
- [ ] Analytics integration for workshop effectiveness
- [ ] Customer feedback collection system

## Safety & Governance Compliance

**Protected Paths (Will Not Modify):**
- `**/security/**` - Security configurations
- `**/*.spec.*` - Test specifications  
- `**/public-api/**` - API contracts

**Constraint Adherence:**
- ✅ All commits ≤40 lines changed
- ✅ All commits ≤10 files modified
- ✅ No secrets or credentials in code
- ✅ `.env.example` pattern for configuration
- ✅ Branch: `odavl/pilot-phase5-20251009`

## Success Criteria
- [ ] Complete 90-minute workshop runnable without external dependencies
- [ ] Evidence collection works on sample TypeScript repos
- [ ] Before/After reports generate with real data
- [ ] Outreach templates ready for immediate deployment
- [ ] All governance constraints satisfied
- [ ] Build/test passes after each commit

Ready to proceed with implementation.