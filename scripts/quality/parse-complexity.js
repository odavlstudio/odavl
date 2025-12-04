#!/usr/bin/env node
/**
 * Parse Complexity Report
 * Parses ESLint complexity report and identifies refactoring candidates
 */

import { promises as fs } from 'node:fs';
import path from 'node:path';

async function main() {
    const workspaceRoot = process.cwd();
    const reportPath = path.join(workspaceRoot, '.odavl', 'quality', 'complexity-report.json');

    console.log('🔍 Parsing complexity report...\n');

    try {
        const reportContent = await fs.readFile(reportPath, 'utf8');
        const eslintResults = JSON.parse(reportContent);

        const complexFunctions = [];

        for (const result of eslintResults) {
            if (!result.messages || result.messages.length === 0) continue;

            for (const message of result.messages) {
                if (message.ruleId === 'complexity') {
                    const match = message.message.match(/complexity of (\d+)/);
                    const complexity = match ? parseInt(match[1], 10) : 0;

                    complexFunctions.push({
                        file: result.filePath,
                        line: message.line,
                        column: message.column,
                        complexity,
                        message: message.message
                    });
                }
            }
        }

        complexFunctions.sort((a, b) => b.complexity - a.complexity);

        console.log('📊 Complexity Analysis:\n');
        console.log(`High Complexity Functions: ${complexFunctions.length}\n`);

        if (complexFunctions.length > 0) {
            console.log('🚨 Top Complex Functions:\n');
            for (const func of complexFunctions.slice(0, 10)) {
                console.log(`  Complexity ${func.complexity} - ${path.basename(func.file)}:${func.line}`);
            }

            if (complexFunctions.length > 10) {
                console.log(`  ... and ${complexFunctions.length - 10} more\n`);
            }
        } else {
            console.log('✅ No high complexity functions found!\n');
        }

        // Save analysis
        const analysisPath = path.join(workspaceRoot, '.odavl', 'quality', 'complexity-analysis.json');
        await fs.writeFile(analysisPath, JSON.stringify({
            timestamp: new Date().toISOString(),
            summary: {
                count: complexFunctions.length,
                avgComplexity: complexFunctions.length > 0
                    ? (complexFunctions.reduce((sum, f) => sum + f.complexity, 0) / complexFunctions.length).toFixed(2)
                    : 0,
                maxComplexity: complexFunctions.length > 0 ? complexFunctions[0].complexity : 0
            },
            functions: complexFunctions
        }, null, 2));

        console.log(`📝 Analysis saved to: ${analysisPath}\n`);

        if (complexFunctions.length > 0) {
            console.log('💡 Recommendations:');
            console.log('  - Extract complex logic into smaller functions');
            console.log('  - Use early returns to reduce nesting');
            console.log('  - Consider strategy pattern for complex conditionals');
            console.log('  - Break down functions with complexity > 20\n');
        }

    } catch (error) {
        if (error.code === 'ENOENT') {
            console.error('❌ Error: complexity-report.json not found.');
            process.exit(1);
        }
        throw error;
    }
}

await main();
