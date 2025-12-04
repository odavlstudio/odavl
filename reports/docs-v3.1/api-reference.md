# 🔌 API Reference

Complete REST API and WebSocket documentation for ODAVL Insight v3.1.

## Base URL

```
https://api.odavl.studio/v3
```

## Authentication

All API requests require authentication via JWT token:

```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  https://api.odavl.studio/v3/detect
```

## REST Endpoints

### 1. Detect Issues

**POST** `/detect`

Analyze code and detect issues.

**Request**:
```json
{
  "language": "typescript",
  "code": "const x: any = 42;",
  "detectors": ["type-safety", "complexity"]
}
```

**Response**:
```json
{
  "success": true,
  "issues": [
    {
      "detector": "type-safety",
      "severity": "warning",
      "message": "Avoid using 'any' type",
      "line": 1,
      "column": 7
    }
  ],
  "stats": {
    "totalIssues": 1,
    "detectionTime": 450
  }
}
```

### 2. List Languages

**GET** `/languages`

Get all supported languages.

**Response**:
```json
{
  "languages": [
    {
      "id": "typescript",
      "name": "TypeScript/JavaScript",
      "detectors": 6,
      "accuracy": 94.2
    }
  ]
}
```

### 3. Get Detectors

**GET** `/detectors/:language`

Get available detectors for a language.

**Response**:
```json
{
  "language": "typescript",
  "detectors": [
    "type-safety",
    "unused-imports",
    "complexity",
    "security",
    "performance",
    "best-practices"
  ]
}
```

## WebSocket API

### Connection

```javascript
const ws = new WebSocket('wss://api.odavl.studio/v3/ws');

ws.onopen = () => {
  ws.send(JSON.stringify({
    type: 'subscribe',
    channel: 'detections'
  }));
};

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  console.log('Detection update:', data);
};
```

### Events

#### `detection.new`
New issue detected

#### `detection.resolved`
Issue fixed

#### `stats.update`
Statistics updated

## Rate Limiting

- **Free Tier**: 100 requests/hour
- **Pro Tier**: 1,000 requests/hour
- **Enterprise**: Unlimited

## Error Handling

All errors follow this format:

```json
{
  "success": false,
  "error": {
    "code": "INVALID_LANGUAGE",
    "message": "Language 'xyz' is not supported",
    "details": {}
  }
}
```

## Status Codes

- `200` - Success
- `400` - Bad Request
- `401` - Unauthorized
- `429` - Rate Limit Exceeded
- `500` - Internal Server Error
