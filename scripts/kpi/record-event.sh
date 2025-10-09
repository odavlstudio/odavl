#!/bin/bash
# ODAVL KPI - Event Recording Script (Bash)
# Records KPI events to local NDJSON file with privacy-first defaults

set -euo pipefail

# Configuration
EVENTS_FILE="reports/kpi/events.ndjson"
SCRIPT_VERSION="1.0"

# Parse command line arguments
TYPE=""
REPO=""
NOTES=""
METRICS=""

# Function to display usage
usage() {
    echo "ODAVL KPI Event Recording - Privacy-First Local Tracking"
    echo ""
    echo "Usage: $0 type=EVENT_TYPE repo=REPO_PATH [notes=NOTES] [metrics=JSON]"
    echo ""
    echo "Required Parameters:"
    echo "  type=TYPE     Event type (extension_installed, first_doctor_run, etc.)"
    echo "  repo=REPO     Repository path or identifier"
    echo ""
    echo "Optional Parameters:"
    echo "  notes=TEXT    Human-readable context or description"
    echo "  metrics=JSON  Event-specific data as JSON object"
    echo ""
    echo "Examples:"
    echo "  $0 type=extension_installed repo=/dev/myproject notes=\"First install\""
    echo "  $0 type=quality_snapshot repo=/dev/myproject metrics='{\"eslint_total\":15,\"ts_errors_total\":3}'"
    echo "  $0 type=nps_response repo=/dev/client notes=\"Survey\" metrics='{\"score\":9,\"feedback\":\"Great tool!\"}'"
    echo ""
    echo "Privacy: All data stored locally in $EVENTS_FILE"
    echo "Opt-in: Set KPI_OPT_IN=true to enable optional external sharing"
    exit 1
}

# Parse arguments
for arg in "$@"; do
    case $arg in
        type=*)
            TYPE="${arg#*=}"
            ;;
        repo=*)
            REPO="${arg#*=}"
            ;;
        notes=*)
            NOTES="${arg#*=}"
            ;;
        metrics=*)
            METRICS="${arg#*=}"
            ;;
        --help|-h)
            usage
            ;;
        *)
            echo "❌ Unknown argument: $arg"
            usage
            ;;
    esac
done

# Validate required parameters
if [[ -z "$TYPE" ]]; then
    echo "❌ Error: type parameter is required"
    usage
fi

if [[ -z "$REPO" ]]; then
    echo "❌ Error: repo parameter is required"
    usage
fi

# Validate event type
VALID_TYPES=(
    "extension_installed"
    "first_doctor_run" 
    "first_pr_merged"
    "quality_snapshot"
    "pilot_started"
    "pilot_converted_pro"
    "pilot_converted_enterprise"
    "nps_response"
)

TYPE_VALID=false
for valid_type in "${VALID_TYPES[@]}"; do
    if [[ "$TYPE" == "$valid_type" ]]; then
        TYPE_VALID=true
        break
    fi
done

if [[ "$TYPE_VALID" == "false" ]]; then
    echo "❌ Error: Invalid event type '$TYPE'"
    echo "Valid types: ${VALID_TYPES[*]}"
    exit 1
fi

# Validate metrics JSON if provided
if [[ -n "$METRICS" ]]; then
    if ! echo "$METRICS" | jq . > /dev/null 2>&1; then
        echo "❌ Error: Invalid JSON in metrics parameter"
        echo "Provided: $METRICS"
        exit 1
    fi
fi

# Ensure events directory exists
EVENTS_DIR=$(dirname "$EVENTS_FILE")
mkdir -p "$EVENTS_DIR"

# Generate timestamp
TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%S.%3NZ")

# Build event JSON
EVENT_JSON=$(jq -n \
    --arg timestamp "$TIMESTAMP" \
    --arg actor "manual" \
    --arg type "$TYPE" \
    --arg repo "$REPO" \
    --arg notes "$NOTES" \
    --argjson metrics "${METRICS:-null}" \
    '{
        timestamp: $timestamp,
        actor: $actor,
        type: $type,
        repo: $repo
    } + (if $notes != "" then {notes: $notes} else {} end) + (if $metrics != null then {metrics: $metrics} else {} end)')

# Append to events file
echo "$EVENT_JSON" >> "$EVENTS_FILE"

# Display confirmation
echo "✅ Event recorded successfully"
echo "📝 Type: $TYPE"
echo "📁 Repo: $REPO"
if [[ -n "$NOTES" ]]; then
    echo "💬 Notes: $NOTES"
fi
if [[ -n "$METRICS" ]]; then
    echo "📊 Metrics: $METRICS"
fi
echo "🕐 Timestamp: $TIMESTAMP"
echo "📄 Stored in: $EVENTS_FILE"

# Privacy reminder
if [[ "${KPI_OPT_IN:-false}" != "true" ]]; then
    echo ""
    echo "🔒 Privacy: Data stored locally only"
    echo "   Set KPI_OPT_IN=true to enable optional external sharing"
fi