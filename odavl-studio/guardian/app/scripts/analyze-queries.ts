/**
 * Database Query Analyzer
 * 
 * Analyzes slow queries from Prisma logs
 * Identifies N+1 queries and optimization opportunities
 * 
 * Usage:
 *   pnpm analyze:queries
 */

import * as fs from 'fs';
import * as path from 'path';

interface QueryLog {
    timestamp: string;
    duration: number;
    query: string;
    params?: unknown[];
}

interface QueryAnalysis {
    totalQueries: number;
    slowQueries: QueryLog[];
    queryPatterns: Map<string, number>;
    n1Patterns: string[];
    recommendations: string[];
}

/**
 * Parse Prisma query logs
 */
function parseQueryLogs(logContent: string): QueryLog[] {
    const queries: QueryLog[] = [];
    const lines = logContent.split('\n');

    for (const line of lines) {
        // Match Prisma query log format
        const match = line.match(/prisma:query (.+?) \((\d+)ms\)/);
        if (match) {
            queries.push({
                timestamp: new Date().toISOString(),
                query: match[1],
                duration: parseInt(match[2], 10)
            });
        }
    }

    return queries;
}

/**
 * Detect N+1 query patterns
 */
function detectN1Patterns(queries: QueryLog[]): string[] {
    const patterns: string[] = [];
    const querySequence: string[] = [];

    for (const query of queries) {
        const normalized = query.query
            .replace(/WHERE.*?(?=ORDER|LIMIT|$)/gi, 'WHERE ...')
            .replace(/\d+/g, 'N');

        querySequence.push(normalized);

        // Check last 10 queries for repeated patterns
        if (querySequence.length >= 10) {
            const last10 = querySequence.slice(-10);
            const uniqueQueries = new Set(last10);

            // If same query repeated 5+ times, likely N+1
            if (uniqueQueries.size === 1) {
                patterns.push(`N+1 detected: ${normalized}`);
            }

            querySequence.shift(); // Keep window size at 10
        }
    }

    return [...new Set(patterns)]; // Remove duplicates
}

/**
 * Generate optimization recommendations
 */
function generateRecommendations(analysis: QueryAnalysis): string[] {
    const recommendations: string[] = [];

    // Slow queries
    if (analysis.slowQueries.length > 0) {
        recommendations.push(
            `🐌 Found ${analysis.slowQueries.length} slow queries (>100ms)`,
            '   → Add database indexes on frequently queried columns',
            '   → Use SELECT instead of include for unnecessary relations',
            '   → Consider adding Redis caching for repeated queries'
        );
    }

    // N+1 patterns
    if (analysis.n1Patterns.length > 0) {
        recommendations.push(
            `⚠️  Found ${analysis.n1Patterns.length} N+1 query patterns`,
            '   → Use DataLoader for batching related queries',
            '   → Use Prisma include/select to eager load relations',
            '   → Consider denormalizing data if appropriate'
        );
    }

    // Query frequency
    const topQueries = Array.from(analysis.queryPatterns.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5);

    if (topQueries.length > 0) {
        recommendations.push(
            '📊 Most frequent queries:',
            ...topQueries.map(([query, count]) =>
                `   → ${count}x: ${query.substring(0, 80)}...`
            ),
            '   → Consider caching these queries with Redis'
        );
    }

    return recommendations;
}

/**
 * Analyze query logs
 */
function analyzeQueries(queries: QueryLog[]): QueryAnalysis {
    const analysis: QueryAnalysis = {
        totalQueries: queries.length,
        slowQueries: queries.filter(q => q.duration > 100),
        queryPatterns: new Map(),
        n1Patterns: detectN1Patterns(queries),
        recommendations: []
    };

    // Count query patterns
    for (const query of queries) {
        const normalized = query.query
            .replace(/WHERE.*?(?=ORDER|LIMIT|$)/gi, 'WHERE ...')
            .replace(/\d+/g, 'N');

        analysis.queryPatterns.set(
            normalized,
            (analysis.queryPatterns.get(normalized) || 0) + 1
        );
    }

    analysis.recommendations = generateRecommendations(analysis);

    return analysis;
}

/**
 * Print analysis results
 */
function printAnalysis(analysis: QueryAnalysis) {
    console.log('\n╔════════════════════════════════════════════════════════════╗');
    console.log('║          DATABASE QUERY PERFORMANCE ANALYSIS               ║');
    console.log('╚════════════════════════════════════════════════════════════╝\n');

    console.log(`📈 Total Queries: ${analysis.totalQueries}`);
    console.log(`🐌 Slow Queries (>100ms): ${analysis.slowQueries.length}`);
    console.log(`⚠️  N+1 Patterns: ${analysis.n1Patterns.length}`);
    console.log(`🔄 Unique Query Patterns: ${analysis.queryPatterns.size}\n`);

    // Slow queries
    if (analysis.slowQueries.length > 0) {
        console.log('═══ SLOW QUERIES (>100ms) ═══\n');
        for (const query of analysis.slowQueries.slice(0, 10)) {
            console.log(`   ${query.duration}ms: ${query.query.substring(0, 100)}...`);
        }
        console.log('');
    }

    // N+1 patterns
    if (analysis.n1Patterns.length > 0) {
        console.log('═══ N+1 QUERY PATTERNS ═══\n');
        for (const pattern of analysis.n1Patterns) {
            console.log(`   ${pattern}`);
        }
        console.log('');
    }

    // Recommendations
    if (analysis.recommendations.length > 0) {
        console.log('═══ RECOMMENDATIONS ═══\n');
        for (const rec of analysis.recommendations) {
            console.log(rec);
        }
        console.log('');
    }
}

/**
 * Main function
 */
async function main() {
    console.log('\n🔍 Analyzing database queries...\n');

    // In production, read from actual Prisma logs
    // For now, simulate with mock data
    const mockQueries: QueryLog[] = [
        {
            timestamp: new Date().toISOString(),
            duration: 45,
            query: 'SELECT * FROM projects WHERE id = ?'
        },
        {
            timestamp: new Date().toISOString(),
            duration: 120,
            query: 'SELECT * FROM monitors WHERE projectId = ? ORDER BY createdAt DESC'
        },
        {
            timestamp: new Date().toISOString(),
            duration: 85,
            query: 'SELECT * FROM test_runs WHERE projectId = ? ORDER BY createdAt DESC'
        },
        // Simulate N+1 pattern
        ...Array.from({ length: 10 }, (_, i) => ({
            timestamp: new Date().toISOString(),
            duration: 25,
            query: `SELECT * FROM monitors WHERE projectId = ${i}`
        }))
    ];

    const analysis = analyzeQueries(mockQueries);
    printAnalysis(analysis);

    console.log('✅ Analysis complete\n');
}

// Run if executed directly
if (require.main === module) {
    main().catch(console.error);
}

export { analyzeQueries };
export type { QueryAnalysis, QueryLog };
