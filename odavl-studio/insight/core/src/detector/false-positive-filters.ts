/**
 * False Positive Filters for ODAVL Insight
 * 
 * Reduces false positives by recognizing common patterns:
 * - Batch operations (createMany, insertMany)
 * - Optimized patterns (Map/Set lookups)
 * - Different array iterations (O(n*m) not O(n²))
 * - Simple control flow (if/else chains)
 * 
 * @version 2.1.0
 */

export interface CodeContext {
    file: string;
    content: string;
    line: number;
    pattern: string;
}

export interface FilterResult {
    isFalsePositive: boolean;
    reason?: string;
    adjustedSeverity?: 'critical' | 'high' | 'medium' | 'low';
    confidence: number; // 0-100
}

/**
 * Check if nested loops are actually batch operation pattern
 */
export function isBatchOperationPattern(context: CodeContext): FilterResult {
    const { content, line, pattern } = context;

    // Check for batch operation keywords
    const batchKeywords = [
        'createMany', 'insertMany', 'bulkCreate', 'bulkWrite', 
        'bulkInsert', 'batchUpdate', 'batchCreate'
    ];

    const hasBatchOperation = batchKeywords.some(keyword => content.includes(keyword));

    // Check if code builds array then does batch operation
    const buildsThenInserts = 
        (content.includes('.push(') || content.includes('data.push(')) &&
        hasBatchOperation;

    if (buildsThenInserts) {
        return {
            isFalsePositive: true,
            reason: 'Nested loops build array for batch operation (optimized pattern)',
            confidence: 95,
        };
    }

    return { isFalsePositive: false, confidence: 100 };
}

/**
 * Check if loops iterate over same array (O(n²)) or different arrays (O(n*m))
 */
export function isDifferentArrayIteration(context: CodeContext): FilterResult {
    const { pattern, content, line } = context;

    // Extract array names from nested loops
    const arrayMatches = content.match(/for\s*\((?:let|const|var)\s+\w+\s+of\s+(\w+)/g);
    
    if (!arrayMatches || arrayMatches.length < 2) {
        return { isFalsePositive: false, confidence: 50 };
    }

    const arrays = arrayMatches.map(match => {
        const m = match.match(/of\s+(\w+)/);
        return m?.[1] || '';
    });

    // Check if arrays are same or similar (users vs user)
    const firstArray = arrays[0];
    const secondArray = arrays[1];

    const isSameArray = 
        firstArray === secondArray ||
        firstArray.replace(/s$/, '') === secondArray.replace(/s$/, '');

    if (!isSameArray) {
        return {
            isFalsePositive: false,
            reason: 'Different arrays: O(n*m) complexity, not O(n²)',
            adjustedSeverity: 'medium', // Lower severity
            confidence: 85,
        };
    }

    return { isFalsePositive: false, confidence: 100 };
}

/**
 * Check if "excessive nesting" is actually simple if/else chain
 */
export function isSimpleIfElseChain(context: CodeContext): FilterResult {
    const { content, line } = context;
    
    // Get lines around the reported line
    const lines = content.split('\n');
    const startLine = Math.max(0, line - 10);
    const endLine = Math.min(lines.length, line + 10);
    const snippet = lines.slice(startLine, endLine).join('\n');

    // Count actual nesting vs if/else chains
    let openBraces = 0;
    let maxDepth = 0;
    let hasComplexNesting = false;

    for (const l of snippet.split('\n')) {
        const trimmed = l.trim();
        
        // Skip comments and empty lines
        if (trimmed.startsWith('//') || trimmed === '') continue;

        // Count control flow nesting
        const controlFlow = (trimmed.match(/\b(if|for|while|switch|try)\s*\(/g) || []).length;
        openBraces += controlFlow;
        maxDepth = Math.max(maxDepth, openBraces);

        // If/else at same level is NOT nesting
        if (trimmed.startsWith('} else if') || trimmed.startsWith('else if')) {
            // This is a chain, not nesting
            continue;
        }

        // Check for actual nested control flow (not just closing braces)
        if (openBraces > 2 && controlFlow > 0) {
            hasComplexNesting = true;
        }

        // Decrease on closing braces
        const closeBraces = (trimmed.match(/^\}/g) || []).length;
        openBraces = Math.max(0, openBraces - closeBraces);
    }

    // If max depth <= 2 and no complex nesting, it's likely if/else chain
    if (maxDepth <= 2 && !hasComplexNesting) {
        return {
            isFalsePositive: true,
            reason: 'Simple if/else chain at root level, not deep nesting',
            confidence: 90,
        };
    }

    return { isFalsePositive: false, confidence: 100 };
}

/**
 * Check if Prisma query is actually optimized with batch operations
 */
export function isPrismaOptimized(context: CodeContext): FilterResult {
    const { content, pattern } = context;

    // Check if code uses batch operations instead of individual queries
    const hasBatchOps = 
        content.includes('createMany') ||
        content.includes('updateMany') ||
        content.includes('deleteMany') ||
        content.includes('findMany');

    // Check if query is inside loop but builds data array first
    const buildsArrayFirst = 
        content.includes('.push(') &&
        (content.includes('Data.push(') || content.includes('data.push('));

    if (hasBatchOps && buildsArrayFirst) {
        return {
            isFalsePositive: true,
            reason: 'Uses batch operations (createMany/updateMany) - optimized pattern',
            confidence: 95,
        };
    }

    return { isFalsePositive: false, confidence: 100 };
}

/**
 * Main filter function - apply all filters
 */
export function filterFalsePositives(
    context: CodeContext,
    issueType: string
): FilterResult {
    // Apply relevant filters based on issue type
    if (issueType.includes('NESTED_LOOP') || issueType.includes('O_N_SQUARED')) {
        // Check batch operations
        const batchCheck = isBatchOperationPattern(context);
        if (batchCheck.isFalsePositive) return batchCheck;

        // Check different arrays
        const arrayCheck = isDifferentArrayIteration(context);
        if (arrayCheck.adjustedSeverity) return arrayCheck;
    }

    if (issueType.includes('NESTING_DEPTH')) {
        const ifElseCheck = isSimpleIfElseChain(context);
        if (ifElseCheck.isFalsePositive) return ifElseCheck;
    }

    if (issueType.includes('N_PLUS_ONE') || issueType.includes('PRISMA')) {
        const prismaCheck = isPrismaOptimized(context);
        if (prismaCheck.isFalsePositive) return prismaCheck;
    }

    return { isFalsePositive: false, confidence: 100 };
}
