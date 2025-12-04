/**
 * Enhanced Report Formatter for ODAVL Insight v2.1
 * 
 * Improvements:
 * - Context-aware insights (why this matters)
 * - Confidence scoring display
 * - False positive indicators
 * - Actionable recommendations
 * - Impact visualization
 * 
 * @version 2.1.0
 */

export interface EnhancedIssue {
    file: string;
    line: number;
    type: string;
    severity: 'critical' | 'high' | 'medium' | 'low';
    message: string;
    confidence?: number; // 0-100
    isFalsePositive?: boolean;
    falsePositiveReason?: string;
    suggestedFix: string;
    details?: string;
    impact?: {
        performance?: number; // 1-10
        maintainability?: number; // 1-10
        security?: number; // 1-10
    };
    codeSnippet?: string;
}

/**
 * Generate contextual insight for issue
 */
export function generateContextualInsight(issue: EnhancedIssue): string {
    const { type, severity, confidence } = issue;

    // False positive warning
    if (issue.isFalsePositive) {
        return `⚠️ Possible false positive: ${issue.falsePositiveReason}`;
    }

    // Low confidence warning
    if (confidence && confidence < 60) {
        return `⚠️ Low confidence (${confidence}%) - please review manually`;
    }

    // Context-specific insights
    if (type.includes('NESTED_LOOP') || type.includes('O_N_SQUARED')) {
        if (severity === 'medium') {
            return `ℹ️ Loops iterate over different arrays (O(n*m)) - may be acceptable for small datasets`;
        }
        return `⚠️ Nested loops on SAME array - performance degrades quadratically with data size`;
    }

    if (type.includes('NESTING_DEPTH')) {
        return `💡 Deep nesting makes code hard to test and maintain - consider extracting functions`;
    }

    if (type.includes('N_PLUS_ONE')) {
        return `🔥 Database query in loop - this can cause severe performance issues in production`;
    }

    if (type.includes('SYNC_FILE')) {
        return `⚡ Synchronous file operations block event loop - use async versions`;
    }

    return '';
}

/**
 * Format issue with enhanced display
 */
export function formatEnhancedIssue(issue: EnhancedIssue, index: number): string {
    const { file, line, severity, message, confidence, suggestedFix, details, impact } = issue;

    // Severity icon
    const severityIcon = {
        critical: '🔴',
        high: '🟠',
        medium: '🟡',
        low: '🟢',
    }[severity];

    // Confidence indicator
    const confidenceText = confidence 
        ? confidence >= 80 ? `✓ ${confidence}%` 
          : confidence >= 60 ? `~ ${confidence}%` 
          : `? ${confidence}%`
        : '';

    // Format file path (relative, shortened)
    const shortFile = file.length > 60 ? `...${file.slice(-57)}` : file;

    // Build output
    let output = `\n${index}. ${severityIcon} ${message}`;
    
    if (confidenceText) {
        output += ` [${confidenceText} confident]`;
    }

    output += `\n   📄 ${shortFile}:${line}`;

    // Add contextual insight
    const insight = generateContextualInsight(issue);
    if (insight) {
        output += `\n   ${insight}`;
    }

    // Add impact scores
    if (impact) {
        const scores = [];
        if (impact.performance) scores.push(`Performance: ${impact.performance}/10`);
        if (impact.maintainability) scores.push(`Maintainability: ${impact.maintainability}/10`);
        if (impact.security) scores.push(`Security: ${impact.security}/10`);
        
        if (scores.length > 0) {
            output += `\n   📊 Impact: ${scores.join(' • ')}`;
        }
    }

    // Add suggested fix
    output += `\n   💡 Fix: ${suggestedFix}`;

    // Add details if available
    if (details) {
        output += `\n   🔍 ${details}`;
    }

    return output;
}

/**
 * Generate summary with accuracy metrics
 */
export function generateAccuracySummary(issues: EnhancedIssue[]): string {
    const total = issues.length;
    const highConfidence = issues.filter(i => (i.confidence ?? 100) >= 80).length;
    const mediumConfidence = issues.filter(i => (i.confidence ?? 100) >= 60 && (i.confidence ?? 100) < 80).length;
    const lowConfidence = issues.filter(i => (i.confidence ?? 100) < 60).length;
    const possibleFalsePositives = issues.filter(i => i.isFalsePositive).length;

    const accuracy = total > 0 ? Math.round((highConfidence / total) * 100) : 0;

    let output = `\n📊 Detection Accuracy Summary\n`;
    output += `${'═'.repeat(60)}\n`;
    output += `Total Issues: ${total}\n`;
    output += `├─ ✓ High Confidence (≥80%): ${highConfidence} (${Math.round(highConfidence/total*100)}%)\n`;
    output += `├─ ~ Medium Confidence (60-79%): ${mediumConfidence} (${Math.round(mediumConfidence/total*100)}%)\n`;
    output += `├─ ? Low Confidence (<60%): ${lowConfidence} (${Math.round(lowConfidence/total*100)}%)\n`;
    output += `└─ ⚠️  Possible False Positives: ${possibleFalsePositives} (${Math.round(possibleFalsePositives/total*100)}%)\n\n`;
    output += `Overall Accuracy: ${accuracy}% `;
    
    if (accuracy >= 90) output += `🌟 Excellent\n`;
    else if (accuracy >= 75) output += `✅ Good\n`;
    else if (accuracy >= 60) output += `⚠️  Fair - review low confidence issues\n`;
    else output += `❌ Poor - many false positives detected\n`;

    return output;
}

/**
 * Group issues by confidence level
 */
export function groupByConfidence(issues: EnhancedIssue[]): {
    highConfidence: EnhancedIssue[];
    mediumConfidence: EnhancedIssue[];
    lowConfidence: EnhancedIssue[];
    falsePositives: EnhancedIssue[];
} {
    return {
        highConfidence: issues.filter(i => !i.isFalsePositive && (i.confidence ?? 100) >= 80),
        mediumConfidence: issues.filter(i => !i.isFalsePositive && (i.confidence ?? 100) >= 60 && (i.confidence ?? 100) < 80),
        lowConfidence: issues.filter(i => !i.isFalsePositive && (i.confidence ?? 100) < 60),
        falsePositives: issues.filter(i => i.isFalsePositive),
    };
}

/**
 * Generate recommendations based on issue patterns
 */
export function generateRecommendations(issues: EnhancedIssue[]): string[] {
    const recommendations: string[] = [];

    // Count issue types
    const nestedLoops = issues.filter(i => i.type.includes('NESTED_LOOP')).length;
    const nPlusOne = issues.filter(i => i.type.includes('N_PLUS_ONE')).length;
    const deepNesting = issues.filter(i => i.type.includes('NESTING_DEPTH')).length;
    const syncOps = issues.filter(i => i.type.includes('SYNC_')).length;

    if (nestedLoops > 5) {
        recommendations.push('🔍 Multiple nested loops detected - consider algorithmic optimization (Map/Set lookups)');
    }

    if (nPlusOne > 3) {
        recommendations.push('🔥 Database queries in loops (N+1 problem) - use batch operations (findMany, createMany)');
    }

    if (deepNesting > 5) {
        recommendations.push('💡 Excessive nesting depth - refactor using early returns and extract helper functions');
    }

    if (syncOps > 3) {
        recommendations.push('⚡ Synchronous operations detected - switch to async/await for better performance');
    }

    // Confidence-based recommendations
    const lowConfCount = issues.filter(i => (i.confidence ?? 100) < 60).length;
    if (lowConfCount > issues.length * 0.3) {
        recommendations.push('⚠️  High false positive rate - review low confidence issues manually');
    }

    return recommendations;
}
