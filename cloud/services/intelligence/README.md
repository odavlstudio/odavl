# ODAVL Intelligence Service

**AI-enhanced analytics and predictive insights for ODAVL Cloud Platform.**

## Architecture

```
intelligence/
├── index.ts              # Express service (port 8084)
├── analytics.ts          # Analytics engine
├── predictors/           # Predictive models
│   ├── risk-predictor.ts
│   ├── hotspot-detector.ts
│   ├── stability-score.ts
│   └── timeline-analyzer.ts
├── graph/                # Knowledge graph
│   ├── knowledge-graph.ts
│   └── schema.ts
└── stream/               # Telemetry processing
    ├── consumer.ts
    ├── parser.ts
    └── dispatcher.ts
```

## API Endpoints

### GET /intelligence/summary
Returns overall project health summary.

**Response:**
```json
{
  "projectHealth": 85,
  "trend": "improving",
  "categories": {
    "codeQuality": 90,
    "testCoverage": 75,
    "buildHealth": 88,
    "deploymentStability": 87
  }
}
```

### GET /intelligence/predictions
Returns risk predictions for files.

### GET /intelligence/hotspots
Returns frequently modified files.

## Stream Processing

1. Consumer reads from `.odavl/cloud-telemetry/events.jsonl`
2. Parser extracts intelligence signals
3. Dispatcher routes to predictors/graph
4. Results written to `.odavl/cloud-intelligence/stream.jsonl`

## Knowledge Graph Schema

**Entities**: File, Detector, Issue, Fix, Service, Event  
**Relationships**: FILE_HAS_ISSUE, ISSUE_DETECTED_BY, FIX_MODIFIES_FILE, EVENT_FROM_SERVICE
