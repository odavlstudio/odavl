import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { ProjectScanner } from './ProjectScanner';
import { FixApplier } from './FixApplier';
import { AutoFixLedger } from './AutoFixLedger';
import { logger } from '../../utils/logger';

interface Suggestion {
    file: string;
    errorType: string;
    suggestion: string;
    confidence: number;
    fixType?: string;
    fixData?: Record<string, unknown>;
}

interface AutoFixOptions {
    detector?: string;
    limit?: number;
    severity?: string;
    category?: string;
}

export class AutoFixEngine {
    private readonly scanner = new ProjectScanner();
    private readonly applier = new FixApplier();
    private readonly ledger = new AutoFixLedger();

    async run(root: string, options: AutoFixOptions = {}): Promise<{ applied: number; avgConfidence: number }> {
        const suggestions = await this.loadSuggestions(root);
        logger.info(`📋 Loaded ${suggestions.length} suggestions`);

        // Filter by detector/category if specified
        let filtered = suggestions;
        if (options.detector || options.category) {
            const targetType = options.detector || options.category;
            filtered = suggestions.filter(s =>
                s.errorType.toLowerCase().includes(targetType!.toLowerCase())
            );
            logger.info(`🔍 Filtered to ${filtered.length} suggestions for ${targetType}`);
        }

        // Filter by severity if specified
        if (options.severity) {
            // High confidence = high severity fixes
            const minConfidence = options.severity === 'critical' ? 0.9 :
                options.severity === 'high' ? 0.8 : 0.7;
            filtered = filtered.filter(s => s.confidence >= minConfidence);
            logger.info(`⚠️  Filtered to ${filtered.length} suggestions with ${options.severity} severity`);
        }

        // Apply limit if specified
        if (options.limit && options.limit > 0) {
            filtered = filtered.slice(0, options.limit);
            logger.info(`📊 Limited to ${filtered.length} files (max: ${options.limit})`);
        }

        let applied = 0;
        let totalConf = 0;

        for (const s of filtered.filter(x => x.confidence >= 0.85)) {
            logger.info(`\n🔍 Processing: ${s.file} (confidence: ${s.confidence})`);
            const proj = this.scanner.detectProject(s.file);
            logger.debug(`   Project type: ${proj.type}`);

            if (!this.scanner.isFixable(proj.type)) {
                logger.debug('   ⏭️  Skipped (not fixable)');
                continue;
            }

            const fullPath = join(root, s.file);
            logger.debug(`   📁 Full path: ${fullPath}`);
            const res = await this.applier.applyFix(fullPath, s.fixType || 'add-import', s.fixData || {});

            if (res.success) {
                logger.success(`   ✅ Applied successfully`);
                await this.ledger.record({
                    file: s.file,
                    fix: s.suggestion,
                    confidence: s.confidence,
                    status: 'applied',
                    timestamp: new Date().toISOString(),
                });
                applied++;
                totalConf += s.confidence;
            } else {
                logger.error(`   ❌ Failed: ${res.error}`);
            }
        }

        return { applied, avgConfidence: applied > 0 ? totalConf / applied : 0 };
    }

    private async loadSuggestions(root: string): Promise<Suggestion[]> {
        try {
            const data = await readFile(join(root, '.odavl/insight/fixes/suggestions.json'), 'utf-8');
            return JSON.parse(data);
        } catch {
            // No suggestions file yet - return empty array
            // In future, could generate suggestions from latest metrics
            logger.info('ℹ️  No suggestions file found - generating from latest metrics...');
            return this.generateSuggestionsFromMetrics(root);
        }
    }

    private async generateSuggestionsFromMetrics(root: string): Promise<Suggestion[]> {
        // Fallback: Load latest metrics and generate basic suggestions
        try {
            const metricsFiles = await readFile(join(root, '.odavl/metrics'), 'utf-8')
                .then(() => true)
                .catch(() => false);

            if (!metricsFiles) {
                logger.warn('⚠️  No metrics found - run OBSERVE phase first');
                return [];
            }

            // For now, return empty - proper implementation would parse metrics
            // and generate actionable suggestions
            logger.info('✨ Auto-fix requires manual suggestions for now');
            return [];
        } catch {
            return [];
        }
    }
}
