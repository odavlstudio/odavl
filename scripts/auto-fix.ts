#!/usr/bin/env node
import { AutoFixEngine } from '../packages/insight-core/src/lib/autofix/AutoFixEngine';
import { writeFile } from 'node:fs/promises';

interface CliArgs {
    detector?: string;
    limit?: number;
    severity?: string;
    category?: string;
}

function parseArgs(): CliArgs {
    const args: CliArgs = {};

    for (let i = 2; i < process.argv.length; i++) {
        const arg = process.argv[i];
        if (arg.startsWith('--detector=')) {
            args.detector = arg.split('=')[1];
        } else if (arg.startsWith('--limit=')) {
            args.limit = parseInt(arg.split('=')[1], 10);
        } else if (arg.startsWith('--severity=')) {
            args.severity = arg.split('=')[1];
        } else if (arg.startsWith('--category=')) {
            args.category = arg.split('=')[1];
        }
    }

    return args;
}

async function main(): Promise<void> {
    const workspaceRoot = process.cwd();
    const args = parseArgs();

    console.log('🔧 ODAVL Insight Auto-Fix Engine');
    console.log('================================\n');

    if (args.detector) {
        console.log(`🎯 Target Detector: ${args.detector}`);
    }
    if (args.limit) {
        console.log(`📊 File Limit: ${args.limit}`);
    }
    if (args.severity) {
        console.log(`⚠️  Severity Filter: ${args.severity}`);
    }
    console.log();

    const engine = new AutoFixEngine();
    const result = await engine.run(workspaceRoot, args);

    console.log(`\n✅ Applied ${result.applied} fixes`);
    console.log(`📊 Average Confidence: ${(result.avgConfidence * 100).toFixed(0)}%\n`);

    const report = `# Auto-Fix Report
Generated: ${new Date().toISOString()}

## Summary
- Detector: ${args.detector || 'all'}
- File Limit: ${args.limit || 'none'}
- Severity: ${args.severity || 'all'}
- Applied: ${result.applied} fixes
- Avg Confidence: ${(result.avgConfidence * 100).toFixed(0)}%

## Details
See \`.odavl/insight/fixes/ledger.json\` for full audit trail.
`;

    const reportPath = `${workspaceRoot}/reports/auto-fix-report.md`;
    await writeFile(reportPath, report, 'utf-8');
    console.log(`📝 Report saved: ${reportPath}`);
}

try {
    await main();
} catch (err) {
    console.error('❌ Auto-fix failed:', err);
    process.exit(1);
}
