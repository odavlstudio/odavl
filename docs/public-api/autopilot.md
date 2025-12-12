# Autopilot API

**Trigger self-healing O-D-A-V-L cycles.**

## POST /v1/autopilot/run
Start Autopilot cycle.

**Request:**
```json
{
  "projectId": "proj-123",
  "maxFiles": 10,
  "maxLoc": 40
}
```

**Response:**
```json
{
  "runId": "autopilot-1234567890",
  "projectId": "proj-123",
  "maxFiles": 10,
  "maxLoc": 40,
  "status": "queued"
}
```

## GET /v1/autopilot/run/:runId
Get cycle results.

**Response:**
```json
{
  "runId": "autopilot-1234567890",
  "status": "completed",
  "filesModified": 3,
  "linesChanged": 25,
  "attestation": "sha256:abc123...",
  "phases": {
    "observe": "completed",
    "decide": "completed",
    "act": "completed",
    "verify": "completed",
    "learn": "completed"
  }
}
```
