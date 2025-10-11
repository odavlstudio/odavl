# ODAVL Weekly KPI Report - Week {WEEK_NUMBER} {YEAR}

**Week Range:** {START_DATE} to {END_DATE}  
**Generated:** {GENERATION_TIMESTAMP}  
**Privacy Mode:** Local-only (opt-in: {OPT_IN_STATUS})

## Executive Summary

- **PLG Highlights:** {PLG_SUMMARY}
- **Quality Progress:** {QUALITY_SUMMARY}
- **Sales Activity:** {SALES_SUMMARY}
- **NPS Score:** {NPS_AVERAGE} ({NPS_RESPONSES} responses)

## Product-Led Growth (PLG) Metrics

### Extension Adoption
- **New Installations:** {EXTENSION_INSTALLS}
- **First Doctor Runs:** {FIRST_DOCTOR_RUNS}
- **First PR Merges:** {FIRST_PR_MERGES}

### Growth Trends
- **Week-over-Week Install Growth:** {INSTALL_GROWTH_PCT}%
- **Activation Rate:** {ACTIVATION_RATE_PCT}% (doctor runs / installs)
- **Conversion Rate:** {CONVERSION_RATE_PCT}% (PR merges / doctor runs)

## Quality Metrics (Weekly Deltas)

### ESLint Improvements
- **Warning Reduction:** {ESLINT_WARNINGS_DELTA} ({ESLINT_WARNINGS_DELTA_PCT}%)
- **Error Reduction:** {ESLINT_ERRORS_DELTA} ({ESLINT_ERRORS_DELTA_PCT}%)
- **Projects Improved:** {PROJECTS_WITH_ESLINT_IMPROVEMENT}

### TypeScript Improvements  
- **Error Reduction:** {TS_ERRORS_DELTA} ({TS_ERRORS_DELTA_PCT}%)
- **Projects Improved:** {PROJECTS_WITH_TS_IMPROVEMENT}

### Quality Snapshot Summary
| Repository | ESLint Δ | TypeScript Δ | Status |
|------------|----------|---------------|---------|
{QUALITY_TABLE_ROWS}

## Sales Funnel Metrics

### Pilot Program Activity
- **New Pilots Started:** {PILOTS_STARTED}
- **Pro Conversions:** {PILOTS_CONVERTED_PRO}
- **Enterprise Conversions:** {PILOTS_CONVERTED_ENTERPRISE}

### Conversion Analysis
- **Pilot → Pro Rate:** {PILOT_TO_PRO_RATE_PCT}%
- **Pilot → Enterprise Rate:** {PILOT_TO_ENTERPRISE_RATE_PCT}%
- **Average Pilot Duration:** {AVERAGE_PILOT_DURATION_DAYS} days

### Pipeline Health
- **Active Pilots:** {ACTIVE_PILOTS}
- **Pilot Success Rate:** {PILOT_SUCCESS_RATE_PCT}%
- **Revenue Impact:** ${REVENUE_IMPACT}

## Net Promoter Score (NPS)

### Overall Score
- **NPS Score:** {NPS_SCORE}
- **Total Responses:** {NPS_TOTAL_RESPONSES}
- **Response Rate:** {NPS_RESPONSE_RATE_PCT}%

### Score Distribution
- **Promoters (9-10):** {NPS_PROMOTERS} ({NPS_PROMOTERS_PCT}%)
- **Passives (7-8):** {NPS_PASSIVES} ({NPS_PASSIVES_PCT}%)
- **Detractors (0-6):** {NPS_DETRACTORS} ({NPS_DETRACTORS_PCT}%)

### Feedback Highlights
**Positive Feedback:**
{POSITIVE_FEEDBACK_QUOTES}

**Areas for Improvement:**
{IMPROVEMENT_FEEDBACK_QUOTES}

## Action Items

### High Priority
- [ ] {HIGH_PRIORITY_ACTION_1}
- [ ] {HIGH_PRIORITY_ACTION_2}

### Medium Priority  
- [ ] {MEDIUM_PRIORITY_ACTION_1}
- [ ] {MEDIUM_PRIORITY_ACTION_2}

### Low Priority
- [ ] {LOW_PRIORITY_ACTION_1}
- [ ] {LOW_PRIORITY_ACTION_2}

## Data Quality Notes

### Collection Status
- **Events Recorded:** {TOTAL_EVENTS_COUNT}
- **Quality Snapshots:** {QUALITY_SNAPSHOTS_COUNT}
- **Manual Events:** {MANUAL_EVENTS_COUNT}
- **CLI Events:** {CLI_EVENTS_COUNT}
- **VS Code Events:** {VSCODE_EVENTS_COUNT}

### Data Completeness
- **Complete Weeks:** {COMPLETE_WEEKS_COUNT}
- **Partial Data:** {PARTIAL_DATA_NOTES}
- **Missing Metrics:** {MISSING_METRICS_NOTES}

## Next Week Targets

### PLG Goals
- **Target Installs:** {TARGET_INSTALLS}
- **Target First Runs:** {TARGET_FIRST_RUNS}

### Quality Goals
- **Target Warning Reduction:** {TARGET_WARNING_REDUCTION}%
- **Target Error Reduction:** {TARGET_ERROR_REDUCTION}%

### Sales Goals
- **Target New Pilots:** {TARGET_NEW_PILOTS}
- **Target Conversions:** {TARGET_CONVERSIONS}

### NPS Goals
- **Target NPS Score:** {TARGET_NPS_SCORE}
- **Target Response Rate:** {TARGET_RESPONSE_RATE}%

---

**Report Details:**
- **Data Source:** `reports/kpi/events.ndjson`
- **Processing:** ODAVL KPI aggregation scripts
- **Privacy:** Local-only processing, no external data transmission
- **Contact:** kpi@odavl.studio for questions about this report