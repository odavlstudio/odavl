#!/usr/bin/env node

import { GuardianScheduler } from './scheduler.js';
import { logger } from './logger.js';

const scheduler = new GuardianScheduler('./guardian-data.db');

// Graceful shutdown
process.on('SIGINT', () => {
  logger.info('Received SIGINT, shutting down...');
  scheduler.close();
  process.exit(0);
});

process.on('SIGTERM', () => {
  logger.info('Received SIGTERM, shutting down...');
  scheduler.close();
  process.exit(0);
});

// Start scheduler
logger.info('Starting Guardian Scheduler...');
scheduler.start();

logger.info('Guardian Scheduler is running');
logger.info('Press Ctrl+C to stop');
