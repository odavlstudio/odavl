# Insight API

**Trigger ML-powered error detection.**

## POST /v1/insight/run
Start Insight analysis.

**Request:**
```json
{
  "projectId": "proj-123",
  "detectors": ["typescript", "eslint", "security"]
}
```

**Response:**
```json
{
  "runId": "insight-1234567890",
  "projectId": "proj-123",
  "detectors": ["typescript", "eslint", "security"],
  "status": "queued",
  "estimatedDuration": 60
}
```

## GET /v1/insight/run/:runId
Get analysis results.

**Response:**
```json
{
  "runId": "insight-1234567890",
  "status": "completed",
  "issues": [
    {
      "severity": "error",
      "message": "Unused variable 'x'",
      "file": "src/index.ts",
      "line": 10,
      "detector": "typescript"
    }
  ],
  "summary": {
    "total": 15,
    "errors": 3,
    "warnings": 12
  }
}
```
