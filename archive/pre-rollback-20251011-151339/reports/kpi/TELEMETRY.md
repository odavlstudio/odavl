# KPI Telemetry & Privacy Configuration

## Privacy-First Design

ODAVL KPI measurement operates on a **local-only** default with explicit opt-in for any external data sharing.

### Default Behavior (Local-Only)

- All KPI scripts store data locally in `reports/kpi/`
- No external transmission or analytics services
- No personally identifiable information collected
- Events stored as anonymous metrics only

### Opt-In Telemetry

To enable external sharing (for team dashboards, CI reporting, etc.):

```bash
# Enable telemetry sharing
export KPI_OPT_IN=true

# Or in PowerShell
$env:KPI_OPT_IN = "true"
```

When `KPI_OPT_IN=true`:

- Scripts will indicate "telemetry enabled" in output
- Weekly reports include opt-in status
- External sharing tools can safely process KPI data
- Still no PII - only anonymous metrics

## CI/CD Integration

### Optional GitHub Actions Workflow

The KPI system can integrate with CI for automated weekly reporting:

```yaml
# .github/workflows/kpi-weekly.yml (OPTIONAL)
name: Weekly KPI Report

on:
  schedule:
    # Run every Monday at 9 AM UTC
    - cron: '0 9 * * 1'
  workflow_dispatch:

jobs:
  generate-kpi:
    runs-on: ubuntu-latest
    if: vars.ENABLE_KPI_REPORTING == 'true'
    
    steps:
    - uses: actions/checkout@v4
    
    - name: Generate Weekly KPI Report
      env:
        KPI_OPT_IN: ${{ vars.KPI_OPT_IN }}
      run: |
        chmod +x scripts/kpi/aggregate-weekly.sh
        ./scripts/kpi/aggregate-weekly.sh -week-offset 1
    
    - name: Upload KPI Artifact
      if: success()
      uses: actions/upload-artifact@v4
      with:
        name: weekly-kpi-report
        path: reports/kpi/weekly/
        retention-days: 90
```

### Repository Variables Required

Set these in GitHub repo settings → Secrets and Variables → Actions:

- `ENABLE_KPI_REPORTING`: Set to `"true"` to enable automated reporting
- `KPI_OPT_IN`: Set to `"true"` to enable telemetry sharing in CI

### Governance Compliance

The CI workflow is:

- **Opt-in only**: Requires explicit `ENABLE_KPI_REPORTING=true`
- **Guarded execution**: Double-checks telemetry consent
- **Minimal scope**: Only processes existing local data
- **No secrets**: Uses anonymous metrics only
- **Audit trail**: All runs logged in GitHub Actions

## Data Retention

### Local Storage

- Events: Kept indefinitely in `reports/kpi/events.ndjson`
- Weekly reports: Archived in `reports/kpi/weekly/`
- No automatic cleanup (user controlled)

### CI Artifacts

- Retention: 90 days (configurable in workflow)
- Automatic cleanup by GitHub Actions
- Download available for team analysis

## Compliance Notes

- **GDPR**: No personal data collected
- **Privacy**: Anonymous metrics only
- **Transparency**: All processing local and auditable
- **Control**: User maintains full data sovereignty
- **Minimal**: Only essential metrics collected

## Usage Examples

```bash
# Check current opt-in status
echo "KPI opt-in: ${KPI_OPT_IN:-false}"

# Generate report with telemetry disabled (default)
./scripts/kpi/aggregate-weekly.sh

# Generate report with telemetry enabled
KPI_OPT_IN=true ./scripts/kpi/aggregate-weekly.sh

# PowerShell equivalent
$env:KPI_OPT_IN = "true"
.\scripts\kpi\aggregate-weekly.ps1
```

## Support

For privacy questions or data deletion requests:

- Local data: Delete `reports/kpi/` directory
- CI artifacts: Contact repository administrators
- Questions: Open GitHub issue with privacy label
