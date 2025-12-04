#!/bin/bash
# ODAVL KPI - Weekly Aggregation Script (Bash)
# Generates weekly KPI reports from events.ndjson with privacy-first defaults

set -euo pipefail

# Configuration
EVENTS_FILE="reports/kpi/events.ndjson"
WEEKLY_DIR="reports/kpi/weekly"
TEMPLATE_FILE="reports/kpi/templates/weekly-template.md"

# Default parameters
WEEK_OFFSET="${1:-0}"  # 0 = current week, 1 = last week, etc.
OUTPUT_FORMAT="${2:-both}"  # json, md, or both

# Calculate week dates
CURRENT_DATE=$(date -u +"%Y-%m-%d")
WEEK_START_DATE=$(date -u -d "$CURRENT_DATE - $(($(date -u -d "$CURRENT_DATE" +%u) - 1 + 7 * WEEK_OFFSET)) days" +"%Y-%m-%d")
WEEK_END_DATE=$(date -u -d "$WEEK_START_DATE + 6 days" +"%Y-%m-%d")
WEEK_NUMBER=$(date -u -d "$WEEK_START_DATE" +"%V")
YEAR=$(date -u -d "$WEEK_START_DATE" +"%Y")

echo "📊 ODAVL Weekly KPI Aggregation"
echo "📅 Week $WEEK_NUMBER $YEAR ($WEEK_START_DATE to $WEEK_END_DATE)"

# Ensure directories exist
mkdir -p "$WEEKLY_DIR"

# Check if events file exists
if [[ ! -f "$EVENTS_FILE" ]]; then
    echo "⚠️ No events file found: $EVENTS_FILE"
    echo "Run some KPI scripts first to generate events"
    exit 1
fi

# Filter events for the target week
WEEK_EVENTS=$(mktemp)
jq -r --arg start "$WEEK_START_DATE" --arg end "$WEEK_END_DATE" \
    'select(.timestamp >= $start and .timestamp <= ($end + "T23:59:59.999Z"))' \
    "$EVENTS_FILE" > "$WEEK_EVENTS"

TOTAL_EVENTS=$(wc -l < "$WEEK_EVENTS")
echo "📝 Found $TOTAL_EVENTS events for this week"

# Initialize metrics
PLG_EXTENSION_INSTALLS=0
PLG_FIRST_DOCTOR_RUNS=0
PLG_FIRST_PR_MERGES=0
QUALITY_SNAPSHOTS=0
PILOTS_STARTED=0
PILOTS_CONVERTED_PRO=0
PILOTS_CONVERTED_ENTERPRISE=0
NPS_RESPONSES=0
NPS_TOTAL_SCORE=0

# Count events by type
while IFS= read -r event; do
    if [[ -n "$event" ]]; then
        EVENT_TYPE=$(echo "$event" | jq -r '.type')
        case "$EVENT_TYPE" in
            "extension_installed")
                PLG_EXTENSION_INSTALLS=$((PLG_EXTENSION_INSTALLS + 1))
                ;;
            "first_doctor_run")
                PLG_FIRST_DOCTOR_RUNS=$((PLG_FIRST_DOCTOR_RUNS + 1))
                ;;
            "first_pr_merged")
                PLG_FIRST_PR_MERGES=$((PLG_FIRST_PR_MERGES + 1))
                ;;
            "quality_snapshot")
                QUALITY_SNAPSHOTS=$((QUALITY_SNAPSHOTS + 1))
                ;;
            "pilot_started")
                PILOTS_STARTED=$((PILOTS_STARTED + 1))
                ;;
            "pilot_converted_pro")
                PILOTS_CONVERTED_PRO=$((PILOTS_CONVERTED_PRO + 1))
                ;;
            "pilot_converted_enterprise")
                PILOTS_CONVERTED_ENTERPRISE=$((PILOTS_CONVERTED_ENTERPRISE + 1))
                ;;
            "nps_response")
                NPS_RESPONSES=$((NPS_RESPONSES + 1))
                SCORE=$(echo "$event" | jq -r '.metrics.score // 0')
                NPS_TOTAL_SCORE=$((NPS_TOTAL_SCORE + SCORE))
                ;;
        esac
    fi
done < "$WEEK_EVENTS"

# Calculate derived metrics
ACTIVATION_RATE=0
CONVERSION_RATE=0
if [[ $PLG_EXTENSION_INSTALLS -gt 0 ]]; then
    ACTIVATION_RATE=$(echo "scale=1; $PLG_FIRST_DOCTOR_RUNS * 100 / $PLG_EXTENSION_INSTALLS" | bc -l)
fi
if [[ $PLG_FIRST_DOCTOR_RUNS -gt 0 ]]; then
    CONVERSION_RATE=$(echo "scale=1; $PLG_FIRST_PR_MERGES * 100 / $PLG_FIRST_DOCTOR_RUNS" | bc -l)
fi

# Calculate NPS
NPS_AVERAGE=0
NPS_PROMOTERS=0
NPS_PASSIVES=0
NPS_DETRACTORS=0
NPS_SCORE=0

if [[ $NPS_RESPONSES -gt 0 ]]; then
    NPS_AVERAGE=$(echo "scale=1; $NPS_TOTAL_SCORE / $NPS_RESPONSES" | bc -l)
    
    # Count NPS categories
    while IFS= read -r event; do
        if [[ -n "$event" ]] && [[ $(echo "$event" | jq -r '.type') == "nps_response" ]]; then
            SCORE=$(echo "$event" | jq -r '.metrics.score // 0')
            if [[ $SCORE -ge 9 ]]; then
                NPS_PROMOTERS=$((NPS_PROMOTERS + 1))
            elif [[ $SCORE -ge 7 ]]; then
                NPS_PASSIVES=$((NPS_PASSIVES + 1))
            else
                NPS_DETRACTORS=$((NPS_DETRACTORS + 1))
            fi
        fi
    done < "$WEEK_EVENTS"
    
    # Calculate NPS score (% promoters - % detractors)
    PROMOTERS_PCT=$(echo "scale=1; $NPS_PROMOTERS * 100 / $NPS_RESPONSES" | bc -l)
    DETRACTORS_PCT=$(echo "scale=1; $NPS_DETRACTORS * 100 / $NPS_RESPONSES" | bc -l)
    NPS_SCORE=$(echo "scale=0; $PROMOTERS_PCT - $DETRACTORS_PCT" | bc -l)
fi

# Build JSON report
JSON_REPORT=$(jq -n \
    --arg week_number "$WEEK_NUMBER" \
    --arg year "$YEAR" \
    --arg start_date "$WEEK_START_DATE" \
    --arg end_date "$WEEK_END_DATE" \
    --arg generation_time "$(date -u +"%Y-%m-%dT%H:%M:%S.%3NZ")" \
    --arg total_events "$TOTAL_EVENTS" \
    --arg extension_installs "$PLG_EXTENSION_INSTALLS" \
    --arg first_doctor_runs "$PLG_FIRST_DOCTOR_RUNS" \
    --arg first_pr_merges "$PLG_FIRST_PR_MERGES" \
    --arg activation_rate "$ACTIVATION_RATE" \
    --arg conversion_rate "$CONVERSION_RATE" \
    --arg quality_snapshots "$QUALITY_SNAPSHOTS" \
    --arg pilots_started "$PILOTS_STARTED" \
    --arg pilots_converted_pro "$PILOTS_CONVERTED_PRO" \
    --arg pilots_converted_enterprise "$PILOTS_CONVERTED_ENTERPRISE" \
    --arg nps_responses "$NPS_RESPONSES" \
    --arg nps_average "$NPS_AVERAGE" \
    --arg nps_score "$NPS_SCORE" \
    --arg nps_promoters "$NPS_PROMOTERS" \
    --arg nps_passives "$NPS_PASSIVES" \
    --arg nps_detractors "$NPS_DETRACTORS" \
    '{
        week: {
            number: ($week_number | tonumber),
            year: ($year | tonumber),
            start_date: $start_date,
            end_date: $end_date
        },
        generation: {
            timestamp: $generation_time,
            total_events: ($total_events | tonumber)
        },
        plg: {
            extension_installs: ($extension_installs | tonumber),
            first_doctor_runs: ($first_doctor_runs | tonumber),
            first_pr_merges: ($first_pr_merges | tonumber),
            activation_rate_pct: ($activation_rate | tonumber),
            conversion_rate_pct: ($conversion_rate | tonumber)
        },
        quality: {
            snapshots_count: ($quality_snapshots | tonumber)
        },
        sales: {
            pilots_started: ($pilots_started | tonumber),
            pilots_converted_pro: ($pilots_converted_pro | tonumber),
            pilots_converted_enterprise: ($pilots_converted_enterprise | tonumber)
        },
        nps: {
            responses: ($nps_responses | tonumber),
            average_score: ($nps_average | tonumber),
            nps_score: ($nps_score | tonumber),
            promoters: ($nps_promoters | tonumber),
            passives: ($nps_passives | tonumber),
            detractors: ($nps_detractors | tonumber)
        }
    }')

# Output files
JSON_FILE="$WEEKLY_DIR/${YEAR}-${WEEK_NUMBER}.json"
MD_FILE="$WEEKLY_DIR/${YEAR}-${WEEK_NUMBER}.md"

# Save JSON report
if [[ "$OUTPUT_FORMAT" == "json" || "$OUTPUT_FORMAT" == "both" ]]; then
    echo "$JSON_REPORT" > "$JSON_FILE"
    echo "📄 JSON report saved: $JSON_FILE"
fi

# Generate Markdown report if template exists
if [[ "$OUTPUT_FORMAT" == "md" || "$OUTPUT_FORMAT" == "both" ]]; then
    if [[ -f "$TEMPLATE_FILE" ]]; then
        # Simple template substitution
        sed \
            -e "s/{WEEK_NUMBER}/$WEEK_NUMBER/g" \
            -e "s/{YEAR}/$YEAR/g" \
            -e "s/{START_DATE}/$WEEK_START_DATE/g" \
            -e "s/{END_DATE}/$WEEK_END_DATE/g" \
            -e "s/{GENERATION_TIMESTAMP}/$(date -u)/g" \
            -e "s/{EXTENSION_INSTALLS}/$PLG_EXTENSION_INSTALLS/g" \
            -e "s/{FIRST_DOCTOR_RUNS}/$PLG_FIRST_DOCTOR_RUNS/g" \
            -e "s/{FIRST_PR_MERGES}/$PLG_FIRST_PR_MERGES/g" \
            -e "s/{ACTIVATION_RATE_PCT}/$ACTIVATION_RATE/g" \
            -e "s/{CONVERSION_RATE_PCT}/$CONVERSION_RATE/g" \
            -e "s/{PILOTS_STARTED}/$PILOTS_STARTED/g" \
            -e "s/{PILOTS_CONVERTED_PRO}/$PILOTS_CONVERTED_PRO/g" \
            -e "s/{PILOTS_CONVERTED_ENTERPRISE}/$PILOTS_CONVERTED_ENTERPRISE/g" \
            -e "s/{NPS_RESPONSES}/$NPS_RESPONSES/g" \
            -e "s/{NPS_AVERAGE}/$NPS_AVERAGE/g" \
            -e "s/{NPS_SCORE}/$NPS_SCORE/g" \
            -e "s/{NPS_PROMOTERS}/$NPS_PROMOTERS/g" \
            -e "s/{NPS_PASSIVES}/$NPS_PASSIVES/g" \
            -e "s/{NPS_DETRACTORS}/$NPS_DETRACTORS/g" \
            "$TEMPLATE_FILE" > "$MD_FILE"
        echo "📄 Markdown report saved: $MD_FILE"
    else
        echo "⚠️ Template file not found: $TEMPLATE_FILE"
    fi
fi

# Display summary
echo ""
echo "📈 Week $WEEK_NUMBER $YEAR Summary:"
echo "  PLG: $PLG_EXTENSION_INSTALLS installs → $PLG_FIRST_DOCTOR_RUNS runs → $PLG_FIRST_PR_MERGES PRs"
echo "  Quality: $QUALITY_SNAPSHOTS snapshots"
echo "  Sales: $PILOTS_STARTED pilots, $PILOTS_CONVERTED_PRO Pro, $PILOTS_CONVERTED_ENTERPRISE Enterprise"
echo "  NPS: $NPS_AVERAGE avg ($NPS_RESPONSES responses)"

# Clean up
rm -f "$WEEK_EVENTS"

echo ""
echo "✅ Weekly aggregation complete"