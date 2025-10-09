# Phase 9: KPI Kickoff Runbook

## Overview

This runbook enables the first 2-3 pilot programs to begin collecting KPI data using the Phase 8 measurement system. All data is processed locally with opt-in external sharing.

## KPI System Components

### Phase 8 Scripts Available
- ✅ `scripts/kpi/record-event.sh` / `.ps1` - Manual event recording
- ✅ `scripts/kpi/collect-quality.sh` / `.ps1` - Code quality snapshots  
- ✅ `scripts/kpi/aggregate-weekly.sh` / `.ps1` - Weekly report generation

### Data Storage Structure
```
reports/kpi/
├── events.ndjson              # All events (append-only)
├── weekly/                    # Weekly aggregated reports  
│   ├── 2025-41.json          # Week 41 2025 (JSON data)
│   └── 2025-41.md            # Week 41 2025 (Markdown report)
└── templates/                 # Report templates
    ├── weekly-template.md
    └── nps-form.md
```

## PLG Event Recording

### Manual Event Recording

**Extension Installation** (when pilot participant installs):
```bash
# Bash
./scripts/kpi/record-event.sh extension_installed

# PowerShell  
.\scripts\kpi\record-event.ps1 extension_installed
```

**First Doctor Run** (when pilot runs ODAVL for first time):
```bash
# Bash
./scripts/kpi/record-event.sh first_doctor_run

# PowerShell
.\scripts\kpi\record-event.ps1 first_doctor_run
```

**First PR Merged** (when pilot merges first ODAVL-improved PR):
```bash
# Bash
./scripts/kpi/record-event.sh first_pr_merged

# PowerShell
.\scripts\kpi\record-event.ps1 first_pr_merged
```

### Automated Integration Points

**VS Code Extension** (future integration):
```typescript
// In extension activation
recordEvent('extension_installed');

// In doctor command execution
recordEvent('first_doctor_run');
```

**CLI Integration** (future enhancement):
```javascript
// In successful ODAVL run
if (isFirstRun()) {
  recordEvent('first_doctor_run');
}
```

## Quality Snapshot Collection

### Before/After Pilot Snapshots

**Initial Baseline** (Day 0 of pilot):
```bash
# Bash
./scripts/kpi/collect-quality.sh

# PowerShell
.\scripts\kpi\collect-quality.ps1
```

**Mid-Pilot Check** (Day 7 of pilot):
```bash
# Same commands, automatically timestamped
./scripts/kpi/collect-quality.sh
```

**Final Assessment** (Day 14 of pilot):
```bash
# Final quality snapshot
./scripts/kpi/collect-quality.sh
```

### Quality Metrics Captured
- ESLint warnings count
- TypeScript errors count
- Timestamp for trend analysis
- Repository context (if available)

### Expected Quality Progression
```
Day 0:  {"eslintWarnings": 50, "typeErrors": 0}
Day 7:  {"eslintWarnings": 28, "typeErrors": 0} 
Day 14: {"eslintWarnings": 12, "typeErrors": 0}
```

## Sales Funnel Tracking

### Pilot Program Events

**Pilot Started** (when pilot officially begins):
```bash
# Bash
./scripts/kpi/record-event.sh pilot_started

# PowerShell
.\scripts\kpi\record-event.ps1 pilot_started
```

**Pilot Conversions** (when pilot converts to paid):
```bash
# Pro tier conversion
./scripts/kpi/record-event.sh pilot_converted_pro

# Enterprise tier conversion  
./scripts/kpi/record-event.sh pilot_converted_enterprise
```

### Manual Tracking Points
- Demo calls scheduled (track in CRM, not KPI system)
- Pilot setup meetings (business metric, not product metric)
- Contract negotiations (sales process, not product usage)

## NPS Collection

### Post-Pilot Survey (Day 16-17)

**NPS Response Recording**:
```bash
# Bash (score from 0-10)
./scripts/kpi/record-event.sh nps_response 8

# PowerShell (score from 0-10)
.\scripts\kpi\record-event.ps1 nps_response 8
```

### NPS Survey Process
1. Send survey using `reports/kpi/templates/nps-form.md`
2. Collect responses via email/form
3. Record scores manually using scripts above
4. Include in weekly aggregation

### NPS Scoring
- **Promoters**: 9-10 (likely to recommend)
- **Passives**: 7-8 (satisfied but not enthusiastic)  
- **Detractors**: 0-6 (unlikely to recommend)

## Weekly Aggregation

### Generate Weekly Reports

**Current Week**:
```bash
# Bash
./scripts/kpi/aggregate-weekly.sh

# PowerShell
.\scripts\kpi\aggregate-weekly.ps1
```

**Previous Week**:
```bash
# Bash (-week-offset 1 = last week)
./scripts/kpi/aggregate-weekly.sh -week-offset 1

# PowerShell (-WeekOffset 1 = last week)
.\scripts\kpi\aggregate-weekly.ps1 -WeekOffset 1
```

### Report Outputs
- **JSON**: Machine-readable data in `reports/kpi/weekly/`
- **Markdown**: Human-readable reports using template
- **Console**: Summary displayed during generation

## Privacy & Opt-in Configuration

### Local-Only Operation (Default)
```bash
# No KPI_OPT_IN variable = local only
./scripts/kpi/record-event.sh extension_installed
# Output: "Privacy: Local-only processing"
```

### Telemetry Opt-in (if desired)
```bash
# Enable telemetry sharing
export KPI_OPT_IN=true
./scripts/kpi/record-event.sh extension_installed
# Output: "Privacy: Telemetry enabled - data may be shared"

# PowerShell
$env:KPI_OPT_IN = "true"
.\scripts\kpi\record-event.ps1 extension_installed
```

### Data Sovereignty
- All processing local by default
- User controls external sharing
- No PII collected in any mode
- Events are anonymous metrics only

## Pilot 1 Dry-Run Execution

### Sample Events Creation

Let me create sample events for testing:

**Extension Install + First Run**:
```bash
# Record extension installation
./scripts/kpi/record-event.sh extension_installed

# Record first doctor run  
./scripts/kpi/record-event.sh first_doctor_run

# Take initial quality snapshot
./scripts/kpi/collect-quality.sh
```

### Expected Events File Content
```json
{"type":"extension_installed","timestamp":"2025-10-09T19:45:12.123Z","source":"manual","metrics":{}}
{"type":"first_doctor_run","timestamp":"2025-10-09T19:46:15.456Z","source":"manual","metrics":{}}  
{"type":"quality_snapshot","timestamp":"2025-10-09T19:47:18.789Z","source":"collect-quality","metrics":{"eslintWarnings":0,"typeErrors":0}}
```

## Environment Setup Checklist

### Prerequisites
- [ ] All Phase 8 KPI scripts executable
- [ ] `reports/kpi/` directory structure exists
- [ ] Terminal access (Bash or PowerShell)
- [ ] ODAVL CLI available for quality collection

### First Pilot Setup
- [ ] Pilot company onboarded
- [ ] Extension installation confirmed
- [ ] Baseline quality snapshot taken
- [ ] Events recording initiated
- [ ] Weekly aggregation scheduled

### Ongoing Operations
- [ ] Daily: Check for new events to record
- [ ] Weekly: Generate and review aggregation reports
- [ ] Bi-weekly: Collect NPS from completed pilots
- [ ] Monthly: Analyze trends and optimization opportunities

## Success Metrics for Phase 9

### PLG Funnel (Target for 3 pilots)
- **Extension Installs**: 3 events
- **First Doctor Runs**: 3 events  
- **First PR Merges**: 2-3 events
- **Activation Rate**: 100% (all pilots should activate)
- **Conversion Rate**: 67-100% (pilots to first PR)

### Quality Improvements (Expected per pilot)
- **ESLint Warning Reduction**: 40%+ over 14 days
- **Zero TypeScript Errors**: Maintained throughout pilot
- **Measurable Improvement**: Clear before/after metrics

### NPS Collection (After pilots complete)
- **Response Rate**: 100% from pilots (direct relationship)
- **Target NPS**: 8+ average (highly satisfied)
- **Promoter Rate**: 67%+ (2+ promoters from 3 pilots)

## Troubleshooting

### Script Execution Issues
```bash
# Make scripts executable
chmod +x scripts/kpi/*.sh

# Check PowerShell execution policy
Get-ExecutionPolicy
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### Missing Dependencies
```bash
# Install jq for Bash JSON processing
# Windows: choco install jq
# macOS: brew install jq
# Linux: apt-get install jq
```

### Event File Issues
```bash
# Check events file exists and is writable
ls -la reports/kpi/events.ndjson

# Verify file format (each line should be valid JSON)
cat reports/kpi/events.ndjson | jq '.'
```

## Manual Steps Summary

### Daily Pilot Operations
1. **Monitor Pilot Progress**: Check with participants
2. **Record Events**: Log milestones as they occur
3. **Quality Snapshots**: Take snapshots at key intervals
4. **Issue Resolution**: Address technical problems promptly

### Weekly Reporting
1. **Generate Reports**: Run aggregation scripts
2. **Review Metrics**: Analyze trends and success indicators  
3. **Share Results**: Provide updates to stakeholders
4. **Plan Adjustments**: Optimize based on early results

**Next Step**: Execute dry-run with sample events and generate first weekly report.