/**
 * ODAVL Autopilot Standalone Service
 * 
 * Pure Node.js/Express service for autonomous code fixes
 * Runs independently from Next.js on port 3004
 * 
 * Phase 3C Round 4 - Server Startup Fix
 */

console.log('🟢 [STARTUP] Step 1: Starting server initialization...');

console.log('🟢 [IMPORT] Importing express...');
import express from 'express';
console.log('✅ [IMPORT] express imported successfully');

console.log('🟢 [IMPORT] Importing cors...');
import cors from 'cors';
console.log('✅ [IMPORT] cors imported successfully');

// ============================================================================
// OPLayer Protocol Initialization (MUST BE BEFORE ROUTE IMPORTS)
// ============================================================================

console.log('🟢 [INIT] Initializing OPLayer protocols...');
import { AnalysisProtocol } from '@odavl/oplayer/protocols';
// **Round 10**: Re-enable InsightCoreAnalysisAdapter after fixing ESM bundling
import { InsightCoreAnalysisAdapter } from '@odavl/oplayer';

// Register AnalysisProtocol adapter (required for autopilot observe phase)
// **Round 10**: Added async initialization to workaround tsup ESM polyfills
// **Round 11**: Using global registry - adapter shared across all modules
// **Round 12**: Proper initialize() method call (now in interface, but optional)
try {
  const adapter = new InsightCoreAnalysisAdapter();
  // Initialize detector loading - optional method in interface
  if ('initialize' in adapter && typeof adapter.initialize === 'function') {
    await adapter.initialize();
  }
  AnalysisProtocol.registerAdapter(adapter);
  console.log('✅ [INIT] AnalysisProtocol adapter registered via AdapterRegistry (InsightCoreAnalysisAdapter - REAL)');
} catch (error) {
  console.error('❌ [INIT] Failed to register InsightCoreAnalysisAdapter:', error);
  console.error('Stack:', (error as Error).stack);
  
  // Fallback to mock adapter if initialization fails
  const mockAdapter: any = {
    async analyze() {
      console.warn('[ADAPTER] Using fallback mock adapter - InsightCore unavailable');
      return {
        issues: [],
        metrics: {},
        tookMs: 0,
        detectorStats: {},
      };
    },
  };
  
  AnalysisProtocol.registerAdapter(mockAdapter);
  console.log('⚠️ [INIT] Fallback to mock adapter due to initialization error');
}

// ============================================================================
// Route Imports (AFTER Protocol Registration)
// ============================================================================

console.log('🟢 [IMPORT] Importing route handlers...');
import { fixRouter } from './routes/fix.js';
console.log('✅ [IMPORT] fixRouter imported');
import { quickFixRouter } from './routes/fix-quick.js';
console.log('✅ [IMPORT] quickFixRouter imported');
import { healthRouter } from './routes/health.js';
console.log('✅ [IMPORT] healthRouter imported');
import { observeRouter } from './routes/observe.js';
console.log('✅ [IMPORT] observeRouter imported');
import { decideRouter } from './routes/decide.js';
console.log('✅ [IMPORT] decideRouter imported');
import { testAdapterRouter } from './routes/test-adapter.js';
console.log('✅ [IMPORT] testAdapterRouter imported');

console.log('🟢 [STARTUP] Step 2: Creating Express app...');
const app: express.Express = express();
const PORT = process.env.PORT || 3004;
console.log(`✅ [STARTUP] Express app created, PORT: ${PORT}`);

// ============================================================================
// Process Event Handlers (Keep Server Alive)
// ============================================================================

console.log('🟢 [STARTUP] Step 3: Setting up process event handlers...');

process.on('uncaughtException', (err) => {
  console.error('❌ [FATAL] Uncaught Exception:', err);
  console.error('Stack:', err.stack);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ [FATAL] Unhandled Rejection at:', promise);
  console.error('Reason:', reason);
});

process.on('SIGINT', () => {
  console.log('\n⚠️  [SHUTDOWN] Received SIGINT, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n⚠️  [SHUTDOWN] Received SIGTERM, shutting down gracefully...');
  process.exit(0);
});

// Keep process alive
process.stdin.resume();

console.log('✅ [STARTUP] Process event handlers configured');

// ============================================================================
// Middleware
// ============================================================================

console.log('🟢 [STARTUP] Step 4: Configuring middleware...');

app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:3002'],
  credentials: true,
}));
console.log('✅ [MIDDLEWARE] CORS configured');

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
console.log('✅ [MIDDLEWARE] JSON and URL-encoded parsers configured');

// ============================================================================
// Request Logging
// ============================================================================

console.log('🟢 [STARTUP] Step 5: Setting up request logger...');
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.path}`);
  next();
});
console.log('✅ [MIDDLEWARE] Request logger configured');

// ============================================================================
// Routes
// ============================================================================

console.log('🟢 [STARTUP] Step 6: Registering routes...');
app.use('/api/health', healthRouter);
console.log('✅ [ROUTE] /api/health registered');
app.use('/api/test-adapter', testAdapterRouter);
console.log('✅ [ROUTE] /api/test-adapter registered');
app.use('/api/fix/quick', quickFixRouter);
console.log('✅ [ROUTE] /api/fix/quick registered');
app.use('/api/fix', fixRouter);
console.log('✅ [ROUTE] /api/fix registered');
app.use('/api/observe', observeRouter);
console.log('✅ [ROUTE] /api/observe registered');
app.use('/api/decide', decideRouter);
console.log('✅ [ROUTE] /api/decide registered');

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    service: 'ODAVL Autopilot Service',
    version: '2.0.0',
    status: 'running',
    endpoints: [
      'GET  /api/health',
      'POST /api/fix',
      'POST /api/observe',
      'POST /api/decide',
    ],
  });
});

// ============================================================================
// Error Handling
// ============================================================================

console.log('🟢 [STARTUP] Step 7: Setting up error handler...');
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('❌ [ERROR] Express error handler caught:', err.message);
  console.error('Stack:', err.stack);
  
  res.status(500).json({
    error: 'Internal Server Error',
    message: err.message,
    service: 'autopilot-service',
  });
});
console.log('✅ [MIDDLEWARE] Error handler configured');

// ============================================================================
// Server Startup
// ============================================================================

console.log('🟢 [STARTUP] Step 8: Starting HTTP server...');
console.log(`🟢 [STARTUP] Attempting to bind to port ${PORT}...`);

const server = app.listen(PORT, () => {
  console.log('\n════════════════════════════════════════════════════════════════');
  console.log('🤖 ODAVL AUTOPILOT SERVICE - STANDALONE MODE');
  console.log('════════════════════════════════════════════════════════════════');
  console.log(`✅ Server running on: http://localhost:${PORT}`);
  console.log(`✅ Health check:      http://localhost:${PORT}/api/health`);
  console.log(`✅ Fix endpoint:      http://localhost:${PORT}/api/fix`);
  console.log('════════════════════════════════════════════════════════════════\n');
  console.log('🟢 [SERVER] HTTP server is now listening for connections');
  console.log('🟢 [SERVER] Server object:', typeof server);
  console.log('🟢 [SERVER] Server address:', server.address());
});

server.on('error', (err: NodeJS.ErrnoException) => {
  console.error('❌ [FATAL] Server error:', err.message);
  if (err.code === 'EADDRINUSE') {
    console.error(`❌ [FATAL] Port ${PORT} is already in use`);
  }
  process.exit(1);
});

server.on('listening', () => {
  console.log('🎉 [SERVER] Server "listening" event fired - ready to accept connections');
});

console.log('🟢 [STARTUP] Step 9: Server initialization complete');
console.log('🟢 [STARTUP] Waiting for connections...');

export default app;
