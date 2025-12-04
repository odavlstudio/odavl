/**
 * ODAVL Studio Auth Package - Entry Point
 * Sprint 2: Authentication System
 * Sprint 3: License Keys
 * Phase 2: Production Infrastructure
 */

export * from './jwt.js';
export * from './middleware.js';
export * from './license.js';
export * from './auth-service.js';

// Re-export commonly used types
export type { TokenPayload, TokenPair } from './jwt.js';
export type { User, RegisterInput, LoginInput, AuthResult } from './auth-service.js';
