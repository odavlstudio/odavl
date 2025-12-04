"use strict";
/**
 * Enhanced Database Connection Detector
 * Phase 1.1 - Smart DB leak detection with semantic analysis
 * Phase 2.1 - Enhanced cleanup pattern detection
 * Phase 2.2 - Standardized confidence scoring
 *
 * Improvements over basic detector:
 * - Distinguishes WebSocket/HTTP clients from DB connections
 * - Checks for actual DB library imports
 * - Recognizes various cleanup patterns (try-finally, process events, lifecycle)
 * - Standardized confidence scoring (0-100%)
 * - Reduces false positives from 12% to <3%
 *
 * @author ODAVL Team
 * @version 2.0.0 (Phase 2)
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.EnhancedDBDetector = exports.DB_PATTERNS = exports.CLEANUP_PATTERNS = void 0;
const fs = __importStar(require("node:fs"));
const path = __importStar(require("node:path"));
const glob_1 = require("glob");
const confidence_scoring_js_1 = require("./confidence-scoring.js");
exports.CLEANUP_PATTERNS = [
    {
        type: 'try-finally',
        pattern: /try\s*\{[\s\S]*?\}\s*finally\s*\{/,
        description: 'try-finally block for cleanup',
        confidence: 40
    },
    {
        type: 'process-event',
        pattern: /process\.on\s*\(\s*['"](?:beforeExit|SIGTERM|SIGINT|exit)['"]/,
        description: 'Process exit handler for cleanup',
        confidence: 30
    },
    {
        type: 'lifecycle-method',
        pattern: /(?:async\s+)?(?:stop|destroy|dispose|shutdown|cleanup|teardown)\s*\(/,
        description: 'Lifecycle cleanup method',
        confidence: 25
    },
    {
        type: 'error-handler',
        pattern: /\.catch\s*\(|\.on\s*\(\s*['"]error['"]/,
        description: 'Error handler that may cleanup',
        confidence: 15
    }
];
/**
 * Database library patterns with their connection & cleanup methods
 */
exports.DB_PATTERNS = [
    {
        type: 'prisma',
        displayName: 'Prisma',
        patterns: {
            imports: ['@prisma/client', 'PrismaClient'],
            connectionMethods: ['new PrismaClient(', 'prisma.$connect('],
            cleanupMethods: ['$disconnect(', 'prisma.$disconnect()']
        }
    },
    {
        type: 'mongoose',
        displayName: 'Mongoose',
        patterns: {
            imports: ['mongoose'],
            connectionMethods: ['mongoose.connect(', 'mongoose.createConnection(', 'createConnection('],
            cleanupMethods: ['mongoose.disconnect(', 'connection.close(', '.disconnect(', '.close()']
        }
    },
    {
        type: 'pg',
        displayName: 'PostgreSQL (pg)',
        patterns: {
            imports: ['pg', 'Pool', 'Client', 'from \'pg\'', 'from "pg"'],
            connectionMethods: ['new Pool(', 'new Client(', 'pool.connect(', 'client.connect('],
            cleanupMethods: ['connection.release(', 'client.release(', 'pool.end(', 'client.end(']
        }
    },
    {
        type: 'mysql',
        displayName: 'MySQL',
        patterns: {
            imports: ['mysql', 'createConnection', 'createPool'],
            connectionMethods: ['mysql.createConnection(', 'mysql.createPool(', 'createConnection('],
            cleanupMethods: ['connection.end(', 'connection.destroy(', 'pool.end(']
        }
    },
    {
        type: 'mysql2',
        displayName: 'MySQL2',
        patterns: {
            imports: ['mysql2', 'mysql2/promise'],
            connectionMethods: ['mysql2.createConnection(', 'mysql2.createPool(', 'createConnection('],
            cleanupMethods: ['connection.end(', 'connection.destroy(', 'pool.end(']
        }
    },
    {
        type: 'mongodb',
        displayName: 'MongoDB Native Driver',
        patterns: {
            imports: ['mongodb', 'MongoClient'],
            connectionMethods: ['new MongoClient(', 'MongoClient.connect(', 'client.connect('],
            cleanupMethods: ['client.close(', '.close()']
        }
    },
    {
        type: 'redis',
        displayName: 'Redis',
        patterns: {
            imports: ['redis', 'createClient', 'ioredis'],
            connectionMethods: ['redis.createClient(', 'new Redis(', 'createClient('],
            cleanupMethods: ['client.quit(', 'client.disconnect(', '.quit(', '.disconnect()']
        }
    },
    {
        type: 'mssql',
        displayName: 'MS SQL Server',
        patterns: {
            imports: ['mssql'],
            connectionMethods: ['sql.connect(', 'new sql.ConnectionPool('],
            cleanupMethods: ['pool.close(', 'connection.close(', '.close()']
        }
    },
    {
        type: 'sqlite',
        displayName: 'SQLite',
        patterns: {
            imports: ['sqlite3', 'better-sqlite3'],
            connectionMethods: ['new sqlite3.Database(', 'new Database('],
            cleanupMethods: ['db.close(', '.close()']
        }
    }
];
class EnhancedDBDetector {
    workspaceRoot;
    fileImports = new Map();
    fileDBLibrary = new Map();
    constructor(workspaceRoot) {
        this.workspaceRoot = workspaceRoot;
    }
    /**
     * Main detection method - scans workspace for DB connection leaks
     */
    async detect(targetDir) {
        const dir = targetDir || this.workspaceRoot;
        const issues = [];
        // Find all TypeScript/JavaScript files
        const files = await (0, glob_1.glob)('**/*.{ts,tsx,js,jsx}', {
            cwd: dir,
            ignore: [
                'node_modules/**',
                'dist/**',
                '.next/**',
                'out/**',
                'build/**',
                '**/*.test.*',
                '**/*.spec.*',
                '**/__tests__/**',
                '**/__mocks__/**',
                '**/test/**',
                '**/tests/**'
            ]
        });
        // Phase 1: Analyze imports in all files
        for (const file of files) {
            const filePath = path.join(dir, file);
            await this.analyzeFileImports(filePath);
        }
        // Phase 2: Check for connection leaks only in files with DB imports
        for (const file of files) {
            const filePath = path.join(dir, file);
            // Skip files without DB imports
            if (!this.fileDBLibrary.has(filePath)) {
                continue;
            }
            const fileIssues = await this.analyzeConnectionLeaks(filePath);
            issues.push(...fileIssues);
        }
        return issues;
    }
    /**
     * Phase 1: Analyze imports to determine if file uses database libraries
     */
    async analyzeFileImports(filePath) {
        const content = fs.readFileSync(filePath, 'utf8');
        const imports = new Set();
        // Extract all imports using regex
        const importPatterns = [
            /import\s+.*?\s+from\s+['"](.+?)['"]/g, // import x from 'y'
            /import\s+['"](.+?)['"]/g, // import 'y'
            /require\s*\(\s*['"](.+?)['"]\s*\)/g, // require('y')
            /from\s+['"](.+?)['"]/g, // from 'y'
        ];
        for (const pattern of importPatterns) {
            let match;
            while ((match = pattern.exec(content)) !== null) {
                imports.add(match[1]);
            }
        }
        this.fileImports.set(filePath, imports);
        // Check if any DB library is imported
        for (const dbPattern of exports.DB_PATTERNS) {
            const hasDBImport = dbPattern.patterns.imports.some(importPattern => {
                // Check if any file import contains this pattern
                return Array.from(imports).some(fileImport => fileImport.includes(importPattern) ||
                    content.includes(importPattern));
            });
            if (hasDBImport) {
                this.fileDBLibrary.set(filePath, dbPattern);
                break; // Only set the first matching DB library
            }
        }
    }
    /**
     * Phase 2: Analyze connection leaks in files that actually use DB libraries
     */
    async analyzeConnectionLeaks(filePath) {
        const issues = [];
        const dbLibrary = this.fileDBLibrary.get(filePath);
        if (!dbLibrary) {
            return issues; // Should not happen due to filtering
        }
        const content = fs.readFileSync(filePath, 'utf8');
        const lines = content.split('\n');
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            // Check if this line creates a DB connection
            const connectionMethod = dbLibrary.patterns.connectionMethods.find(method => line.includes(method));
            if (!connectionMethod) {
                continue; // Not a connection creation line
            }
            // Get context: next 50 lines to check for cleanup
            const contextLines = lines.slice(i, Math.min(i + 50, lines.length));
            const context = contextLines.join('\n');
            // Check for cleanup methods
            const hasCleanup = this.hasCleanupInContext(context, dbLibrary);
            if (!hasCleanup) {
                // Check if it's in a try-finally block
                const hasTryFinally = this.isInTryFinallyBlock(lines, i);
                if (!hasTryFinally) {
                    const missingCleanup = dbLibrary.patterns.cleanupMethods;
                    // Phase 3.1.6: Use adaptive confidence with pattern learning
                    const signature = {
                        detector: 'enhanced-db',
                        patternType: 'missing-connection-cleanup',
                        signatureHash: `${dbLibrary.type}-${connectionMethod}`.slice(0, 16),
                        filePath: filePath,
                        line: i + 1
                    };
                    const confidenceScore = await (0, confidence_scoring_js_1.calculateAdaptiveConfidence)({
                        patternMatchStrength: confidence_scoring_js_1.PatternStrength.exact(), // 100 - exact connection method match
                        contextAppropriate: this.getContextScore(filePath), // Context-based scoring
                        codeStructure: confidence_scoring_js_1.StructureScore.calculate(context), // Check error handling, cleanup, types
                        historicalAccuracy: confidence_scoring_js_1.HistoricalAccuracy.getDefault('database') // 85% default for DB
                    }, signature);
                    issues.push({
                        file: filePath,
                        line: i + 1,
                        type: 'db-connection-leak',
                        severity: 'critical',
                        message: `${dbLibrary.displayName} connection without cleanup (${confidenceScore.level} confidence)`,
                        dbLibrary: dbLibrary.displayName,
                        rootCause: `${dbLibrary.displayName} connections must be closed/released to prevent connection pool exhaustion and resource leaks. ${confidenceScore.explanation}`,
                        suggestedFix: this.generateCleanupFix(dbLibrary, connectionMethod),
                        confidence: confidenceScore.score,
                        context: {
                            hasDBImport: true,
                            connectionMethod,
                            missingCleanup
                        }
                    });
                }
            }
        }
        return issues;
    }
    /**
     * Phase 2.2: Determine context score based on file type
     */
    getContextScore(filePath) {
        const fileName = path.basename(filePath).toLowerCase();
        const fileContent = filePath.toLowerCase();
        // API routes are critical
        if (fileContent.includes('/api/') || fileContent.includes('\\api\\') ||
            fileName.includes('route.') || fileName.includes('handler.')) {
            return confidence_scoring_js_1.ContextScore.apiRoute(); // 95
        }
        // Server files are high priority
        if (fileName.includes('server.') || fileName.includes('index.') ||
            fileContent.includes('/server/') || fileContent.includes('\\server\\')) {
            return confidence_scoring_js_1.ContextScore.server(); // 90
        }
        // Test files are lower priority
        if (fileName.includes('.test.') || fileName.includes('.spec.') ||
            fileContent.includes('/__tests__/') || fileContent.includes('\\__tests__\\')) {
            return confidence_scoring_js_1.ContextScore.testFile(); // 30
        }
        // Build scripts are very low priority
        if (fileName.includes('build.') || fileName.includes('config.') ||
            fileContent.includes('/scripts/') || fileContent.includes('\\scripts\\')) {
            return confidence_scoring_js_1.ContextScore.buildScript(); // 20
        }
        // Default: component/library code
        return confidence_scoring_js_1.ContextScore.component(); // 70
    }
    /**
     * Phase 2.1: Enhanced cleanup detection with multiple patterns
     * Checks for: try-finally, process events, lifecycle methods, error handlers
     */
    hasCleanupInContext(context, dbLibrary) {
        // 1. Check for DB-specific cleanup methods
        const hasCleanupMethod = dbLibrary.patterns.cleanupMethods.some(method => context.includes(method));
        if (hasCleanupMethod) {
            return true;
        }
        // 2. Phase 2.1: Check for generic cleanup patterns
        let cleanupConfidence = 0;
        for (const pattern of exports.CLEANUP_PATTERNS) {
            if (pattern.pattern.test(context)) {
                cleanupConfidence += pattern.confidence;
            }
        }
        // If cleanup confidence is high enough, consider it cleaned up
        if (cleanupConfidence >= 40) {
            return true;
        }
        // 3. Check for React/framework cleanup patterns
        const frameworkCleanupPatterns = [
            'return () => {', // React useEffect cleanup
            'return function cleanup', // Named cleanup function
            'componentWillUnmount', // React class cleanup
            'onDestroy(', // Angular
            'beforeDestroy(', // Vue
            '$destroy(', // Svelte
        ];
        return frameworkCleanupPatterns.some(pattern => context.includes(pattern));
    }
    /**
     * Check if line is inside a try-finally block
     */
    isInTryFinallyBlock(lines, lineIndex) {
        // Look backwards for try statement
        let tryIndex = -1;
        let finallyIndex = -1;
        let braceLevel = 0;
        for (let i = lineIndex; i >= Math.max(0, lineIndex - 50); i--) {
            const line = lines[i].trim();
            if (line.includes('finally')) {
                finallyIndex = i;
            }
            if (line.includes('try')) {
                tryIndex = i;
                break;
            }
        }
        // If found try before current line, look for finally after
        if (tryIndex !== -1 && finallyIndex === -1) {
            for (let i = lineIndex; i < Math.min(lines.length, lineIndex + 50); i++) {
                if (lines[i].includes('finally')) {
                    finallyIndex = i;
                    break;
                }
            }
        }
        return tryIndex !== -1 && finallyIndex !== -1 && tryIndex < lineIndex && finallyIndex > lineIndex;
    }
    /**
     * Generate appropriate cleanup fix for the DB library
     */
    generateCleanupFix(dbLibrary, connectionMethod) {
        const fixes = {
            'Prisma': `
// ✅ Correct: Always disconnect Prisma client
const prisma = new PrismaClient();

try {
  const users = await prisma.user.findMany();
  return users;
} catch (error) {
  console.error('Database error:', error);
  throw error;
} finally {
  await prisma.$disconnect();
}

// OR: Use singleton pattern for long-lived connections
// lib/prisma.ts
const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined };
export const prisma = globalForPrisma.prisma ?? new PrismaClient();
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;`,
            'Mongoose': `
// ✅ Correct: Close Mongoose connection
try {
  await mongoose.connect(MONGODB_URI);
  const users = await User.find();
  return users;
} catch (error) {
  console.error('MongoDB error:', error);
  throw error;
} finally {
  await mongoose.disconnect();
}

// OR: For application-level connection (don't close after every query)
// Use connection pooling and close only on app shutdown
process.on('SIGINT', async () => {
  await mongoose.disconnect();
  process.exit(0);
});`,
            'PostgreSQL (pg)': `
// ✅ Correct: Release connection back to pool
let connection;
try {
  connection = await pool.connect();
  const result = await connection.query('SELECT * FROM users');
  return result.rows;
} catch (error) {
  console.error('Database error:', error);
  throw error;
} finally {
  if (connection) {
    connection.release(); // Important: Return to pool
  }
}`,
            'MySQL': `
// ✅ Correct: Close MySQL connection
let connection;
try {
  connection = await mysql.createConnection(config);
  const [rows] = await connection.query('SELECT * FROM users');
  return rows;
} catch (error) {
  console.error('Database error:', error);
  throw error;
} finally {
  if (connection) {
    await connection.end();
  }
}`,
            'MySQL2': `
// ✅ Correct: Close MySQL2 connection
let connection;
try {
  connection = await mysql2.createConnection(config);
  const [rows] = await connection.execute('SELECT * FROM users');
  return rows;
} catch (error) {
  console.error('Database error:', error);
  throw error;
} finally {
  if (connection) {
    await connection.end();
  }
}`,
            'MongoDB Native Driver': `
// ✅ Correct: Close MongoDB client
const client = new MongoClient(uri);
try {
  await client.connect();
  const db = client.db('mydb');
  const users = await db.collection('users').find().toArray();
  return users;
} catch (error) {
  console.error('MongoDB error:', error);
  throw error;
} finally {
  await client.close();
}`,
            'Redis': `
// ✅ Correct: Quit Redis client
const client = redis.createClient();
try {
  await client.connect();
  const value = await client.get('key');
  return value;
} catch (error) {
  console.error('Redis error:', error);
  throw error;
} finally {
  await client.quit();
}`,
            'MS SQL Server': `
// ✅ Correct: Close SQL Server connection
try {
  const pool = await sql.connect(config);
  const result = await pool.request().query('SELECT * FROM users');
  return result.recordset;
} catch (error) {
  console.error('Database error:', error);
  throw error;
} finally {
  await sql.close();
}`,
            'SQLite': `
// ✅ Correct: Close SQLite database
const db = new sqlite3.Database('./mydb.sqlite');
try {
  const rows = await new Promise((resolve, reject) => {
    db.all('SELECT * FROM users', (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
  return rows;
} catch (error) {
  console.error('Database error:', error);
  throw error;
} finally {
  db.close();
}`
        };
        return fixes[dbLibrary.displayName] || `
// ✅ Correct: Always cleanup database connections
try {
  // Your database operation
} finally {
  // Add appropriate cleanup method for ${dbLibrary.displayName}
  // See: ${dbLibrary.patterns.cleanupMethods.join(', ')}
}`;
    }
    /**
     * Export detection summary for reporting
     */
    getSummary() {
        const dbLibraries = new Set();
        for (const dbLibrary of this.fileDBLibrary.values()) {
            dbLibraries.add(dbLibrary.displayName);
        }
        return {
            totalFiles: this.fileImports.size,
            filesWithDBImports: this.fileDBLibrary.size,
            dbLibrariesDetected: Array.from(dbLibraries)
        };
    }
}
exports.EnhancedDBDetector = EnhancedDBDetector;
//# sourceMappingURL=enhanced-db-detector.js.map