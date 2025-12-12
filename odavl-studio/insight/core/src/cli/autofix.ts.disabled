#!/usr/bin/env node
import { AutoFixEngine } from '../lib/autofix/AutoFixEngine';
import { resolve } from 'node:path';
import { writeFile } from 'node:fs/promises';
import { logger } from '../utils/logger';

async function main() {
    const root = resolve(process.cwd());
    logger.info('🛠️  ODAVL Insight Auto-Fix Engine');
    logger.info('─'.repeat(50));

    const engine = new AutoFixEngine();
    const result = await engine.run(root);

    logger.info(`✅ Applied: ${result.applied} fixes`);
    logger.info(`📊 Avg Confidence: ${result.avgConfidence.toFixed(2)}`);

    // Log execution results
    const logPath = resolve(root, '.odavl/insight/tests/autofix.log');
    const logEntry = `[${new Date().toISOString()}] Auto-Fix executed | Applied: ${result.applied} | Avg Confidence: ${result.avgConfidence.toFixed(2)}\n`;
    await writeFile(logPath, logEntry, { flag: 'a' });

    if (result.applied === 0) {
        logger.info('ℹ️  No high-confidence fixes available (threshold: 0.85)');
        process.exit(0);
    }

    logger.success('\n✅ Ledger updated: .odavl/insight/fixes/ledger.json');
}

main().catch(err => {
    logger.error('❌ Auto-Fix failed:', err.message);
    process.exit(1);
});
