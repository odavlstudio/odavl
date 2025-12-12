# Authentication API

**JWT and API key authentication endpoints.**

## Endpoints

### POST /v1/auth/login
Login with email and password.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "secret"
}
```

**Response:**
```json
{
  "token": "jwt-token",
  "refreshToken": "refresh-token",
  "user": { "id": "user-123", "email": "user@example.com" }
}
```

### POST /v1/auth/refresh
Refresh access token using refresh token.

**Request:**
```json
{
  "refreshToken": "refresh-token"
}
```

**Response:**
```json
{
  "token": "new-jwt-token"
}
```

### POST /v1/auth/logout
Invalidate current session.

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true
}
```

### GET /v1/auth/me
Get current user info.

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "id": "user-123",
  "email": "user@example.com",
  "name": "John Doe",
  "organizationId": "org-456"
}
```
