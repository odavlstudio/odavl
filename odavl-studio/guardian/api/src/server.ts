import express, { type Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { config } from 'dotenv';
import { GuardianScheduler } from '@odavl-studio/guardian-workers';
import { authenticate } from './auth.js';
import { createTestRoutes } from './routes/tests.js';
import { createAlertRoutes } from './routes/alerts.js';
import { createWebhookRoutes } from './routes/webhooks.js';
import { errorHandler, notFoundHandler } from './middleware/error-handler.js';

config();

const PORT = process.env.PORT || 3003;
const DB_PATH = process.env.DB_PATH || './guardian-data.db';

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per window
  standardHeaders: true,
  legacyHeaders: false,
});

export function createApp(): Application {
  const app = express();

  // Initialize Guardian scheduler
  const scheduler = new GuardianScheduler(DB_PATH, {
    slack: {
      webhookUrl: process.env.SLACK_WEBHOOK_URL,
    },
    email: {
      from: process.env.EMAIL_FROM || 'guardian@odavl.studio',
      to: process.env.EMAIL_TO?.split(',') || [],
      smtp: {
        host: process.env.SMTP_HOST || 'localhost',
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
          user: process.env.SMTP_USER || '',
          pass: process.env.SMTP_PASS || '',
        },
      },
    },
    discord: {
      webhookUrl: process.env.DISCORD_WEBHOOK_URL,
    },
  });

  // Start scheduler
  scheduler.start();

  // Middleware
  app.use(helmet());
  app.use(cors());
  app.use(express.json());
  app.use(limiter);

  // Health check (no auth)
  app.get('/health', (req, res) => {
    res.json({
      success: true,
      status: 'healthy',
      timestamp: new Date().toISOString(),
    });
  });

  // API info (no auth)
  app.get('/api', (req, res) => {
    res.json({
      success: true,
      name: 'Guardian API',
      version: '2.0.0',
      documentation: '/api/docs',
    });
  });

  // Protected routes
  app.use('/api/tests', authenticate, createTestRoutes(scheduler));
  app.use('/api/alerts', authenticate, createAlertRoutes(scheduler));
  app.use('/api/webhooks', authenticate, createWebhookRoutes(scheduler));

  // Error handling
  app.use(notFoundHandler);
  app.use(errorHandler);

  // Graceful shutdown
  process.on('SIGTERM', () => {
    console.log('SIGTERM received, shutting down gracefully...');
    scheduler.stop();
    scheduler.close();
    process.exit(0);
  });

  return app;
}

export function startServer(): void {
  const app = createApp();

  app.listen(PORT, () => {
    console.log(`🚀 Guardian API server running on http://localhost:${PORT}`);
    console.log(`📊 Health check: http://localhost:${PORT}/health`);
    console.log(`📖 API documentation: http://localhost:${PORT}/api/docs`);
  });
}

// Start server if run directly
startServer();
