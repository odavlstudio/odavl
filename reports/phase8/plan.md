# Phase 8: KPIs & Measurement - Implementation Plan

**Date:** October 9, 2025  
**Branch:** `odavl/kpi-phase8-20251009`  
**Role:** Co-founder Mode (Privacy-first, local-only, opt-in telemetry)

## Executive Summary

Phase 8 establishes a lightweight, privacy-first KPI measurement system for ODAVL Studio. The system defaults to local-only operation with explicit opt-in for any data sharing. It reuses existing pilot scripts and CLI infrastructure to track Product-Led Growth (PLG), Quality, Sales, and Net Promoter Score (NPS) metrics.

## Current State Audit

### ✅ Existing Assets to Reuse

**Quality Metrics Collection (Phase 5):**
- `scripts/pilot/collect-baseline.ps1` - ESLint & TypeScript metrics
- `scripts/pilot/collect-after.ps1` - Delta calculations
- `scripts/pilot/collect-baseline.sh` - Cross-platform bash version
- `scripts/pilot/collect-after.sh` - Cross-platform delta analysis

**CLI Infrastructure:**
- `apps/cli/src/index.ts` - ODAVL cycle with metrics tracking
- `reports/` directory - Existing JSON report storage
- `.odavl/history.json` - Run history with success tracking

**VS Code Extension:**
- `apps/vscode-ext/` - Doctor mode with phase monitoring
- Installation tracking capabilities via VSIX

### 🔄 Reusable Patterns

**Metrics Schema:**
- ESLint warnings/errors (already parsed from JSON)
- TypeScript errors (already counted via tsc)
- Delta calculations (before → after comparisons)
- Timestamp formatting (ISO 8601 consistent)
- JSON structure (summary + detailed breakdown)

**Command Execution:**
- Cross-platform PowerShell + Bash scripts
- Error handling and fallbacks
- Directory management and file safety

## KPIs to Track

### Product-Led Growth (PLG)
- `extension_installed` - Manual marker or local event detection
- `first_doctor_run` - VS Code extension first activation
- `first_pr_merged` - Git integration tracking (local only)

### Quality Metrics (Weekly Deltas)
- `eslint_warnings_delta_pct` - % change in ESLint warnings
- `ts_errors_delta_pct` - % change in TypeScript errors  
- `pr_fix_time_minutes` - Median time from issue to PR merge (optional)

### Sales Funnel
- `pilots_started` - Manual tracking of pilot program starts
- `pilots_converted_pro` - Pilot → Pro tier conversions
- `pilots_converted_enterprise` - Pilot → Enterprise conversions

### Net Promoter Score (NPS)
- `nps_score` - 0-10 rating collected after 2 weeks per pilot
- `nps_feedback` - Optional text feedback
- Automatic categorization: detractors (0-6), passives (7-8), promoters (9-10)

## Planned File Structure

```
reports/kpi/
├── events.ndjson                    # Newline-delimited JSON events
├── SCHEMA.md                        # Events schema documentation
├── weekly/                          # Auto-generated weekly summaries
│   ├── 2025-42.json                # Week 42 2025 JSON data
│   └── 2025-42.md                  # Week 42 2025 markdown report
└── templates/
    ├── weekly-template.md           # Template for weekly reports
    └── nps-form.md                  # NPS collection form

scripts/kpi/
├── record-event.sh                  # Bash event recording
├── record-event.ps1                 # PowerShell event recording
├── collect-quality.sh               # Bash quality metrics
├── collect-quality.ps1              # PowerShell quality metrics
├── aggregate-weekly.sh              # Bash weekly aggregation
└── aggregate-weekly.ps1             # PowerShell weekly aggregation

legal/
└── TELEMETRY_OPT_IN.md             # Opt-in documentation

.github/workflows/
└── kpi-weekly.yml                   # Optional CI (guarded by opt-in)

reports/phase8/
├── plan.md                          # This implementation plan
└── changes.md                       # Implementation summary
```

## Events Schema Design

### Core Event Structure
```json
{
  "timestamp": "2025-10-09T14:30:00.000Z",
  "actor": "cli|vscode|manual",
  "type": "extension_installed|first_doctor_run|first_pr_merged|pilot_started|pilot_converted_pro|pilot_converted_enterprise|nps_response|quality_snapshot",
  "repo": "path/to/repo",
  "notes": "optional human-readable context",
  "metrics": {
    // Event-specific data
  }
}
```

### Event Type Examples
```json
// PLG Events
{"timestamp": "2025-10-09T14:30:00.000Z", "actor": "manual", "type": "extension_installed", "repo": "/dev/myproject", "notes": "VS Code extension first install"}
{"timestamp": "2025-10-09T14:35:00.000Z", "actor": "vscode", "type": "first_doctor_run", "repo": "/dev/myproject"}
{"timestamp": "2025-10-09T15:00:00.000Z", "actor": "manual", "type": "first_pr_merged", "repo": "/dev/myproject", "notes": "PR #123 merged"}

// Quality Events  
{"timestamp": "2025-10-09T14:30:00.000Z", "actor": "cli", "type": "quality_snapshot", "repo": "/dev/myproject", "metrics": {"eslint_total": 15, "ts_errors_total": 3}}

// Sales Events
{"timestamp": "2025-10-09T09:00:00.000Z", "actor": "manual", "type": "pilot_started", "repo": "/dev/client-repo", "notes": "Acme Corp pilot begins"}
{"timestamp": "2025-10-23T16:00:00.000Z", "actor": "manual", "type": "pilot_converted_pro", "repo": "/dev/client-repo", "notes": "Acme Corp upgrades to Pro"}

// NPS Events
{"timestamp": "2025-10-23T10:00:00.000Z", "actor": "manual", "type": "nps_response", "repo": "/dev/client-repo", "metrics": {"score": 9, "feedback": "Great tool, saved us hours!"}}
```

## Implementation Steps

### STEP A: Audit & Plan ✅
- [x] Audit existing pilot scripts and CLI infrastructure
- [x] Create `reports/phase8/plan.md` with schema and micro-commit strategy
- [x] Identify reusable patterns from Phase 5 evidence collection

### STEP B: Data Schema & Templates (~180 lines, 3 files)
1. `reports/kpi/SCHEMA.md` (~80 lines) - Detailed events schema
2. `reports/kpi/templates/weekly-template.md` (~60 lines) - Weekly report template
3. `reports/kpi/templates/nps-form.md` (~40 lines) - NPS collection form

**Safety:** Documentation and templates only, no executable code

### STEP C: Event Recording Scripts (~120 lines, 2 files)
1. `scripts/kpi/record-event.sh` (~60 lines) - Bash event recording
2. `scripts/kpi/record-event.ps1` (~60 lines) - PowerShell event recording

**Reuse Pattern:** Similar to pilot script structure with validation and JSON appending

### STEP D: Quality Collection (~140 lines, 2 files)
1. `scripts/kpi/collect-quality.sh` (~70 lines) - Bash quality metrics
2. `scripts/kpi/collect-quality.ps1` (~70 lines) - PowerShell quality metrics

**Reuse Pattern:** Leverage existing `collect-baseline` logic for ESLint/TypeScript parsing

### STEP E: Weekly Aggregation (~180 lines, 2 files)
1. `scripts/kpi/aggregate-weekly.sh` (~90 lines) - Bash weekly aggregation
2. `scripts/kpi/aggregate-weekly.ps1` (~90 lines) - PowerShell weekly aggregation

**Complex Logic:** JSON parsing, date range filtering, delta calculations, NPS scoring

### STEP F: Telemetry Opt-in & Optional CI (~110 lines, 2 files)
1. `legal/TELEMETRY_OPT_IN.md` (~60 lines) - Privacy documentation
2. `.github/workflows/kpi-weekly.yml` (~50 lines) - Optional CI workflow

**Safety:** Default OFF, explicit opt-in required, no external data transmission

### STEP G: QA & Summary (~60 lines, 1 file)
1. `reports/phase8/changes.md` (~60 lines) - Implementation summary and testing results

## Micro-Commit Strategy

### Commit 1: Plan Documentation
- **Files:** `reports/phase8/plan.md`  
- **Lines:** ~180 lines
- **Safety:** Planning document only

### Commit 2: Data Schema & Templates
- **Files:** `reports/kpi/SCHEMA.md`, `reports/kpi/templates/weekly-template.md`, `reports/kpi/templates/nps-form.md`
- **Lines:** ~180 lines across 3 files
- **Safety:** Documentation and templates only

### Commit 3: Event Recording Scripts
- **Files:** `scripts/kpi/record-event.sh`, `scripts/kpi/record-event.ps1`
- **Lines:** ~120 lines across 2 files
- **Safety:** Local file operations only, no network calls

### Commit 4: Quality Collection Scripts
- **Files:** `scripts/kip/collect-quality.sh`, `scripts/kpi/collect-quality.ps1`
- **Lines:** ~140 lines across 2 files
- **Safety:** Reuse existing quality collection patterns

### Commit 5: Weekly Aggregation Scripts
- **Files:** `scripts/kpi/aggregate-weekly.sh`, `scripts/kpi/aggregate-weekly.ps1`
- **Lines:** ~180 lines across 2 files
- **Safety:** Local data processing only

### Commit 6: Telemetry Opt-in & CI
- **Files:** `legal/TELEMETRY_OPT_IN.md`, `.github/workflows/kpi-weekly.yml`
- **Lines:** ~110 lines across 2 files
- **Safety:** Default OFF, guarded by explicit opt-in

### Commit 7: QA & Summary
- **Files:** `reports/phase8/changes.md`
- **Lines:** ~60 lines
- **Safety:** Summary documentation only

**Total Estimated:** ~970 lines across 12 files in 7 micro-commits

## Privacy & Security Principles

### Default Configuration
- **Local-Only:** All data stored in `reports/kpi/` directory
- **No Network Calls:** Scripts operate on local filesystem only
- **Opt-In Required:** External sharing requires explicit `KPI_OPT_IN=true`
- **No Secrets:** All data is non-sensitive metrics and feedback

### Opt-In Mechanisms
1. **Environment Variable:** `KPI_OPT_IN=true` in `.env.local`
2. **Repository Variable:** GitHub repository variable for CI
3. **Manual Export:** User-initiated data export for sharing

### Data Retention
- **Events:** Indefinite local retention in `events.ndjson`
- **Weekly Reports:** Generated on-demand, stored locally
- **External Sharing:** Manual only, user-controlled

## Manual Stop Points

### Required Approvals
1. **GitHub Action Enablement** - Requires explicit `KPI_OPT_IN` repository variable
2. **External Analytics Integration** - Disallowed by default, requires approval
3. **Private Repository Parsing** - Skip credentials-required operations

### User Consent Points
1. **First Event Recording** - Display privacy notice
2. **Weekly Aggregation** - Confirm local-only operation
3. **CI Workflow** - Require explicit opt-in configuration

## Success Criteria

### Functional Requirements
- [x] Cross-platform script compatibility (Bash + PowerShell)
- [ ] Event recording with validation and error handling
- [ ] Quality metrics collection reusing Phase 5 infrastructure
- [ ] Weekly aggregation with delta calculations and NPS scoring
- [ ] Privacy-first design with explicit opt-in controls

### Quality Gates
- **No Network Calls:** Scripts operate entirely on local filesystem
- **No Secrets Exposure:** All data is non-sensitive metrics
- **Governance Compliance:** ≤40 lines & ≤10 files per commit
- **Cross-Platform Testing:** Validate on Windows PowerShell and Unix Bash

### Documentation Standards
- **Privacy Documentation:** Clear opt-in procedures and data handling
- **Usage Examples:** Command-line usage for each script
- **Integration Guide:** How to integrate with existing ODAVL workflows

Phase 8 Ready to Begin: STEP B - Data Schema & Templates