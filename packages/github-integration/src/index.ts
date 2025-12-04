/**
 * GitHub Integration Package - Main Entry Point
 * 
 * Exports GitHub App service and webhooks handler.
 */

export { GitHubAppService } from './app.js';
export type { GitHubInstallation, CheckRunAnnotation, CommitFile } from './app.js';

export { GitHubWebhooksService } from './webhooks.js';
export type { WebhookConfig, AnalysisResult } from './webhooks.js';
