/**
 * ODAVL I18n Synchronization System
 * Automatically syncs translation keys across all locales using EN as source of truth
 */

import { readFileSync, writeFileSync, readdirSync, statSync } from 'fs';
import { join } from 'path';

interface SyncReport {
  timestamp: string;
  sourceLocale: string;
  targetLocales: string[];
  keysAdded: Record<string, string[]>;
  keysPreserved: Record<string, number>;
  summary: {
    totalKeys: number;
    localesUpdated: number;
    keysAdded: number;
  };
}

export class I18nSync {
  private basePath: string;
  private messagesPath: string;
  private sourceLocale: string;

  constructor(basePath: string = process.cwd(), sourceLocale: string = 'en') {
    this.basePath = basePath;
    this.messagesPath = join(basePath, 'messages');
    this.sourceLocale = sourceLocale;
  }

  async syncAllLocales(): Promise<SyncReport> {
    console.log('🌍 Starting I18n synchronization...');
    
    const report: SyncReport = {
      timestamp: new Date().toISOString(),
      sourceLocale: this.sourceLocale,
      targetLocales: [],
      keysAdded: {},
      keysPreserved: {},
      summary: {
        totalKeys: 0,
        localesUpdated: 0,
        keysAdded: 0
      }
    };

    // Read source locale
    const sourcePath = join(this.messagesPath, `${this.sourceLocale}.json`);
    if (!statSync(sourcePath).isFile()) {
      throw new Error(`Source locale file not found: ${sourcePath}`);
    }

    const sourceMessages = JSON.parse(readFileSync(sourcePath, 'utf-8'));
    const sourceKeys = this.extractAllKeysWithValues(sourceMessages);
    report.summary.totalKeys = Object.keys(sourceKeys).length;

    // Get all target locale files
    const localeFiles = readdirSync(this.messagesPath)
      .filter(file => file.endsWith('.json') && file !== `${this.sourceLocale}.json`)
      .filter(file => !file.includes('.backup') && !file.includes('.current'));

    console.log(`📁 Found ${localeFiles.length} target locales to sync`);

    for (const file of localeFiles) {
      const locale = file.replace('.json', '');
      const targetPath = join(this.messagesPath, file);
      
      console.log(`🔄 Syncing ${locale}...`);
      
      // Read target locale
      let targetMessages = {};
      try {
        targetMessages = JSON.parse(readFileSync(targetPath, 'utf-8'));
      } catch {
        console.log(`  ⚠️  Creating new locale file for ${locale}`);
      }

      // Sync messages
      const { updatedMessages, addedKeys, preservedCount } = this.syncMessages(
        sourceMessages, 
        targetMessages, 
        locale
      );

      // Write updated target locale
      writeFileSync(targetPath, JSON.stringify(updatedMessages, null, 2) + '\n');

      // Update report
      report.targetLocales.push(locale);
      report.keysAdded[locale] = addedKeys;
      report.keysPreserved[locale] = preservedCount;
      report.summary.localesUpdated++;
      report.summary.keysAdded += addedKeys.length;

      console.log(`  ✅ ${locale}: +${addedKeys.length} keys, ~${preservedCount} preserved`);
    }

    // Save sync report
    this.saveSyncReport(report);

    console.log('🎉 I18n synchronization complete!');
    return report;
  }

  private syncMessages(source: Record<string, unknown>, target: Record<string, unknown>, locale: string): {
    updatedMessages: Record<string, unknown>;
    addedKeys: string[];
    preservedCount: number;
  } {
    const addedKeys: string[] = [];
    let preservedCount = 0;

    const syncRecursive = (srcObj: Record<string, unknown>, tgtObj: Record<string, unknown>, keyPath: string = ''): Record<string, unknown> => {
      const result = { ...tgtObj };

      for (const [key, value] of Object.entries(srcObj)) {
        const currentPath = keyPath ? `${keyPath}.${key}` : key;

        if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
          // Recursive case: nested object
          if (!result[key] || typeof result[key] !== 'object') {
            result[key] = {};
          }
          result[key] = syncRecursive(
            value as Record<string, unknown>, 
            (result[key] || {}) as Record<string, unknown>, 
            currentPath
          );
        } else if (result[key] !== undefined) {
          // Key exists, preserve existing translation
          preservedCount++;
        } else {
          // Key missing, add with placeholder
          result[key] = this.createTranslationPlaceholder(value as string, locale, currentPath);
          addedKeys.push(currentPath);
        }
      }

      return result;
    };

    const updatedMessages = syncRecursive(source, target);
    
    return {
      updatedMessages,
      addedKeys,
      preservedCount
    };
  }

  private createTranslationPlaceholder(sourceValue: string, locale: string, keyPath: string): string {
    // For development/staging, use clear placeholders
    if (process.env.NODE_ENV !== 'production') {
      return `[Needs Translation: ${keyPath}]`;
    }

    // For production, use the English value as fallback with a flag
    return `${sourceValue} [${locale.toUpperCase()}]`;
  }

  private extractAllKeysWithValues(obj: Record<string, unknown>, prefix = ''): Record<string, unknown> {
    let keys: Record<string, unknown> = {};
    
    for (const [key, value] of Object.entries(obj)) {
      const fullKey = prefix ? `${prefix}.${key}` : key;
      
      if (typeof value === 'object' && value !== null) {
        keys = { ...keys, ...this.extractAllKeysWithValues(value as Record<string, unknown>, fullKey) };
      } else {
        keys[fullKey] = value;
      }
    }
    
    return keys;
  }

  private saveSyncReport(report: SyncReport): void {
    const reportsDir = join(this.basePath, 'reports', 'guardian');
    const reportPath = join(reportsDir, 'i18n-sync-report.json');
    
    writeFileSync(reportPath, JSON.stringify(report, null, 2));
    
    // Also save timestamped version
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const timestampedPath = join(reportsDir, `i18n-sync-${timestamp}.json`);
    writeFileSync(timestampedPath, JSON.stringify(report, null, 2));
    
    console.log(`📊 I18n sync report saved to: ${reportPath}`);
  }

  // Validation method to check sync completeness
  async validateSync(): Promise<boolean> {
    console.log('🔍 Validating I18n sync completeness...');
    
    const sourcePath = join(this.messagesPath, `${this.sourceLocale}.json`);
    const sourceMessages = JSON.parse(readFileSync(sourcePath, 'utf-8'));
    const sourceKeys = this.extractAllKeysWithValues(sourceMessages);
    
    const localeFiles = readdirSync(this.messagesPath)
      .filter(file => file.endsWith('.json') && file !== `${this.sourceLocale}.json`)
      .filter(file => !file.includes('.backup') && !file.includes('.current'));

    let allValid = true;

    for (const file of localeFiles) {
      const locale = file.replace('.json', '');
      const targetPath = join(this.messagesPath, file);
      const targetMessages = JSON.parse(readFileSync(targetPath, 'utf-8'));
      const targetKeys = this.extractAllKeysWithValues(targetMessages);

      const missingKeys = Object.keys(sourceKeys).filter(key => !(key in targetKeys));
      
      if (missingKeys.length > 0) {
        console.log(`❌ ${locale} missing ${missingKeys.length} keys:`, missingKeys.slice(0, 5));
        allValid = false;
      } else {
        console.log(`✅ ${locale} is complete`);
      }
    }

    return allValid;
  }

  // Static method for CLI usage
  static async run(basePath?: string): Promise<void> {
    const syncer = new I18nSync(basePath);
    
    try {
      const report = await syncer.syncAllLocales();
      
      console.log('\n🌍 I18N SYNC REPORT SUMMARY');
      console.log('============================');
      console.log(`Source Locale: ${report.sourceLocale}`);
      console.log(`Total Keys: ${report.summary.totalKeys}`);
      console.log(`Locales Updated: ${report.summary.localesUpdated}`);
      console.log(`Keys Added: ${report.summary.keysAdded}`);
      
      // Validate completeness
      const isComplete = await syncer.validateSync();
      if (!isComplete) {
        console.log('\n⚠️  Some locales still have missing keys');
        process.exit(1);
      } else {
        console.log('\n✅ All locales are synchronized');
      }
      
    } catch (error) {
      console.error('❌ I18n sync failed:', error);
      process.exit(1);
    }
  }
}

// CLI execution
if (require.main === module) {
  I18nSync.run().catch(console.error);
}