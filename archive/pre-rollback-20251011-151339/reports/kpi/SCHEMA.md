# ODAVL KPI Events Schema

**Version:** 1.0  
**Date:** October 9, 2025  
**Privacy Policy:** Local-only by default, opt-in for external sharing

## Overview

This document defines the schema for ODAVL KPI event tracking. All events are stored as newline-delimited JSON (NDJSON) in `reports/kpi/events.ndjson` with local-only defaults and privacy-first design.

## Core Event Structure

Every event follows this base schema:

```json
{
  "timestamp": "2025-10-09T14:30:00.000Z",
  "actor": "cli|vscode|manual",
  "type": "event_type_name",
  "repo": "path/to/repository",
  "notes": "optional human-readable context",
  "metrics": {
    // Event-specific data object
  }
}
```

### Required Fields

- **timestamp** (string, ISO 8601): UTC timestamp when event occurred
- **actor** (string): Source of the event - "cli", "vscode", or "manual"
- **type** (string): Event type identifier (see Event Types below)
- **repo** (string): Repository path or identifier

### Optional Fields

- **notes** (string): Human-readable context or description
- **metrics** (object): Event-specific data, structure varies by type

## Event Types

### Product-Led Growth (PLG) Events

#### extension_installed
User installs ODAVL VS Code extension for the first time.

```json
{
  "timestamp": "2025-10-09T14:30:00.000Z",
  "actor": "manual",
  "type": "extension_installed",
  "repo": "/dev/myproject",
  "notes": "VS Code extension first install",
  "metrics": {
    "version": "0.1.1",
    "platform": "vscode"
  }
}
```

#### first_doctor_run
First execution of ODAVL Doctor mode in VS Code extension.

```json
{
  "timestamp": "2025-10-09T14:35:00.000Z",
  "actor": "vscode",
  "type": "first_doctor_run",
  "repo": "/dev/myproject",
  "metrics": {
    "initial_warnings": 15,
    "initial_errors": 3
  }
}
```

#### first_pr_merged
First pull request merged after ODAVL improvements.

```json
{
  "timestamp": "2025-10-09T15:00:00.000Z",
  "actor": "manual",
  "type": "first_pr_merged",
  "repo": "/dev/myproject",
  "notes": "PR #123 merged with ODAVL fixes",
  "metrics": {
    "pr_number": 123,
    "fixes_applied": 8
  }
}
```

### Quality Metrics Events

#### quality_snapshot
Periodic snapshot of code quality metrics.

```json
{
  "timestamp": "2025-10-09T14:30:00.000Z",
  "actor": "cli",
  "type": "quality_snapshot",
  "repo": "/dev/myproject",
  "metrics": {
    "eslint_total": 15,
    "ts_errors_total": 3,
    "files_with_issues": 12,
    "total_files": 145
  }
}
```

### Sales Funnel Events

#### pilot_started
Customer begins ODAVL pilot program.

```json
{
  "timestamp": "2025-10-09T09:00:00.000Z",
  "actor": "manual",
  "type": "pilot_started",
  "repo": "/dev/client-repo",
  "notes": "Acme Corp pilot begins - 14-day trial",
  "metrics": {
    "company": "Acme Corp",
    "team_size": 12,
    "pilot_duration_days": 14
  }
}
```

#### pilot_converted_pro
Pilot customer converts to Pro tier.

```json
{
  "timestamp": "2025-10-23T16:00:00.000Z",
  "actor": "manual",
  "type": "pilot_converted_pro",
  "repo": "/dev/client-repo",
  "notes": "Acme Corp upgrades to Pro after successful pilot",
  "metrics": {
    "company": "Acme Corp",
    "pilot_duration_days": 14,
    "conversion_time_hours": 336
  }
}
```

#### pilot_converted_enterprise
Pilot customer converts to Enterprise tier.

```json
{
  "timestamp": "2025-10-23T16:30:00.000Z",
  "actor": "manual",
  "type": "pilot_converted_enterprise",
  "repo": "/dev/enterprise-client",
  "notes": "BigCorp signs Enterprise contract",
  "metrics": {
    "company": "BigCorp",
    "pilot_duration_days": 14,
    "seats": 100,
    "contract_value": 50000
  }
}
```

### Net Promoter Score (NPS) Events

#### nps_response
Customer NPS feedback after pilot completion.

```json
{
  "timestamp": "2025-10-23T10:00:00.000Z",
  "actor": "manual",
  "type": "nps_response",
  "repo": "/dev/client-repo",
  "notes": "Post-pilot NPS survey response",
  "metrics": {
    "score": 9,
    "category": "promoter",
    "feedback": "Great tool, saved us hours of manual cleanup!",
    "pilot_completed": true
  }
}
```

## Data File Format

### events.ndjson
Each line is a complete JSON event object:

```
{"timestamp":"2025-10-09T14:30:00.000Z","actor":"manual","type":"extension_installed","repo":"/dev/myproject","notes":"First install"}
{"timestamp":"2025-10-09T14:35:00.000Z","actor":"vscode","type":"first_doctor_run","repo":"/dev/myproject","metrics":{"initial_warnings":15}}
{"timestamp":"2025-10-09T15:00:00.000Z","actor":"cli","type":"quality_snapshot","repo":"/dev/myproject","metrics":{"eslint_total":8,"ts_errors_total":0}}
```

### Validation Rules

1. **Timestamp:** Must be valid ISO 8601 UTC format
2. **Actor:** Must be one of: "cli", "vscode", "manual"
3. **Type:** Must be a recognized event type
4. **Repo:** Must be non-empty string (path or identifier)
5. **Metrics:** Must be valid JSON object if present

## Privacy & Security

### Local-Only Default
- All events stored in `reports/kpi/events.ndjson`
- No network transmission by default
- User controls all data export and sharing

### Opt-In Mechanisms
- Set `KPI_OPT_IN=true` environment variable
- Configure GitHub repository variable for CI
- Manual export only - no automatic external transmission

### Data Sensitivity
- **Non-Sensitive:** Metrics, timestamps, event types
- **Low Sensitivity:** Repository paths (local development paths)
- **Medium Sensitivity:** Company names in pilot events
- **No Secrets:** No credentials, tokens, or sensitive code content

### Data Retention
- **Local Storage:** Indefinite retention in events.ndjson
- **Weekly Reports:** Generated on-demand, stored locally
- **External Sharing:** Manual user action required

## Usage Examples

### Recording Events

```bash
# Manual PLG event
./scripts/kpi/record-event.sh type=extension_installed repo=/dev/myproject notes="First install"

# CLI quality snapshot
./scripts/kpi/record-event.sh type=quality_snapshot repo=/dev/myproject metrics='{"eslint_total":15,"ts_errors_total":3}'

# NPS response
./scripts/kpi/record-event.sh type=nps_response repo=/dev/client notes="Post-pilot survey" metrics='{"score":9,"feedback":"Excellent tool"}'
```

### Querying Events

```bash
# Count events by type
grep '"type":"quality_snapshot"' reports/kpi/events.ndjson | wc -l

# Extract NPS scores
grep '"type":"nps_response"' reports/kpi/events.ndjson | jq '.metrics.score'

# Weekly quality snapshots
grep '"type":"quality_snapshot"' reports/kpi/events.ndjson | jq -s 'group_by(.repo)'
```

## Schema Versioning

- **Version 1.0:** Initial schema with PLG, Quality, Sales, and NPS events
- **Future Versions:** Schema changes will increment version and maintain backward compatibility
- **Migration:** Automatic migration scripts will handle schema updates

This schema enables comprehensive KPI tracking while maintaining privacy-first principles and local-only defaults.