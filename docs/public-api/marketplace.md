# Marketplace API

**Browse and install extensions.**

## GET /v1/marketplace/packages
List all packages.

**Query Parameters:**
- `type`: Filter by type (detector, recipe, rule, model)
- `limit`: Max results (default: 50)
- `offset`: Pagination offset

**Response:**
```json
{
  "packages": [
    {
      "id": "pkg-123",
      "name": "Python Security Scanner",
      "type": "detector",
      "version": "1.2.0",
      "downloads": 1240
    }
  ],
  "total": 150
}
```

## GET /v1/marketplace/package/:id
Get package details.

**Response:**
```json
{
  "id": "pkg-123",
  "name": "Python Security Scanner",
  "type": "detector",
  "version": "1.2.0",
  "author": "ODAVL Team",
  "description": "Detects security issues in Python code",
  "downloads": 1240
}
```

## POST /v1/marketplace/install
Install package.

**Request:**
```json
{
  "packageId": "pkg-123",
  "version": "1.2.0"
}
```

**Response:**
```json
{
  "success": true,
  "installedVersion": "1.2.0"
}
```
