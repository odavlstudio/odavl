# Guardian API

**Trigger website testing and quality gates.**

## POST /v1/guardian/test
Start website test.

**Request:**
```json
{
  "url": "https://example.com",
  "suites": ["accessibility", "performance", "security"]
}
```

**Response:**
```json
{
  "testId": "guardian-1234567890",
  "url": "https://example.com",
  "suites": ["accessibility", "performance", "security"],
  "status": "queued"
}
```

## GET /v1/guardian/test/:testId
Get test results.

**Response:**
```json
{
  "testId": "guardian-1234567890",
  "status": "completed",
  "results": {
    "accessibility": {
      "score": 95,
      "issues": []
    },
    "performance": {
      "score": 88,
      "lcp": 1200,
      "fid": 50,
      "cls": 0.05
    },
    "security": {
      "score": 100,
      "vulnerabilities": []
    }
  }
}
```
