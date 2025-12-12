# ODAVL Authentication System

**Multi-tenant authentication with JWT, API keys, and role-based access control.**

## Architecture

```
cloud/auth/
├── index.ts           # Auth service entry point
├── jwt.ts             # JWT token generation/verification
├── api-keys.ts        # API key management
├── middleware.ts      # Express authentication middleware
└── models/            # Multi-tenant data models
    ├── user.ts        # User entity
    ├── organization.ts # Organization entity
    ├── team.ts        # Team entity
    ├── project.ts     # Project entity
    ├── permission.ts  # RBAC permissions
    └── invitation.ts  # Invitation system
```

## Authentication Methods

### 1. JWT Authentication
- **Access Token**: 15-minute expiry, used for API requests
- **Refresh Token**: 7-day expiry, used to obtain new access tokens
- **Rotation**: Refresh tokens can be rotated for security

### 2. API Keys
- **Format**: `odavl_<64-char-hex>`
- **Scopes**: Granular permissions (e.g., `insight:read`, `autopilot:write`)
- **Tracking**: Last used timestamp for security auditing

## Multi-Tenancy Model

```
User → Organization → Teams → Projects
  ↓         ↓           ↓        ↓
Roles   Billing    Members  Settings
```

### Entities
- **User**: Individual accounts with email/password
- **Organization**: Top-level tenant (1 per billing account)
- **Team**: Collaboration groups within orgs
- **Project**: Code repositories/workspaces
- **Permission**: Fine-grained RBAC (read/write/delete/admin)

## Usage Example

```typescript
import { requireAuth, JWTService } from '@odavl-studio/auth';

// Protect route with JWT
app.get('/api/projects', requireAuth, (req, res) => {
  const userId = req.user.userId;
  // ... fetch projects
});

// Generate tokens
const jwt = new JWTService();
const token = jwt.generateToken({ userId: 'user-123', email: 'user@example.com' });
```

## Environment Variables

- `JWT_SECRET` - Secret for signing access tokens
- `JWT_REFRESH_SECRET` - Secret for signing refresh tokens
- `AUTH_PORT` - Auth service port (default: 8090)
