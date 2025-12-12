/**
 * ODAVL Authentication Service
 * JWT + API Key authentication for SaaS platform
 */

import express from 'express';
import { JWTService } from './jwt.js';
import { ApiKeyService } from './api-keys.js';
import { requireAuth, requireApiKey } from './middleware.js';

const app = express();
const PORT = process.env.AUTH_PORT ? parseInt(process.env.AUTH_PORT, 10) : 8090;

app.use(express.json());

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'auth', timestamp: new Date().toISOString() });
});

// JWT endpoints
app.post('/auth/login', async (req, res) => {
  const { email, password } = req.body;
  // Skeleton: Would validate credentials here
  const jwt = new JWTService();
  const token = jwt.generateToken({ userId: 'user-123', email });
  res.json({ token, refreshToken: jwt.generateRefreshToken({ userId: 'user-123' }) });
});

app.post('/auth/refresh', async (req, res) => {
  const { refreshToken } = req.body;
  const jwt = new JWTService();
  const payload = jwt.verifyToken(refreshToken);
  if (!payload) return res.status(401).json({ error: 'Invalid refresh token' });
  
  const token = jwt.generateToken(payload);
  res.json({ token });
});

// API Key endpoints
app.post('/auth/api-keys', requireAuth, async (req, res) => {
  const { name, scopes } = req.body;
  const apiKeyService = new ApiKeyService();
  const apiKey = apiKeyService.createApiKey({ userId: req.user.userId, name, scopes });
  res.json({ apiKey });
});

// Start server
if (import.meta.url === `file://${process.argv[1]}`) {
  app.listen(PORT, () => console.log(`Auth service running on port ${PORT}`));
}

export { app, JWTService, ApiKeyService, requireAuth, requireApiKey };
