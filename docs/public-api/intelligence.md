# Intelligence API

**AI-powered predictions and analytics.**

## GET /v1/intelligence/predictions/:projectId
Get error predictions for project.

**Response:**
```json
{
  "projectId": "proj-123",
  "predictions": [
    {
      "file": "src/UserService.ts",
      "risk": "high",
      "confidence": 0.92,
      "issues": ["High complexity", "Low test coverage"]
    }
  ]
}
```

## GET /v1/intelligence/trends/:projectId
Get quality trends.

**Query Parameters:**
- `period`: Time period (7d, 30d, 90d)

**Response:**
```json
{
  "projectId": "proj-123",
  "period": "30d",
  "trends": {
    "quality": { "change": "+12%", "current": 88 },
    "coverage": { "change": "+5%", "current": 75 },
    "issues": { "change": "-20%", "current": 12 }
  }
}
```

## GET /v1/intelligence/recommendations/:projectId
Get AI recommendations.

**Response:**
```json
{
  "projectId": "proj-123",
  "recommendations": [
    {
      "type": "refactor",
      "file": "src/UserService.ts",
      "reason": "High complexity score: 45",
      "priority": "high"
    }
  ]
}
```
