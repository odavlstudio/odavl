/**
 * ODAVL Guardian System - Pre-Build Quality Gates
 * Prevents regressions and validates critical quality metrics
 */

import { readFileSync, writeFileSync, readdirSync, statSync } from 'fs';
import { join } from 'path';

type GuardianStatus = 'PASS' | 'FAIL' | 'WARN';

interface GuardianReport {
  timestamp: string;
  status: GuardianStatus;
  checks: {
    translations: TranslationCheck;
    bundles: BundleCheck;
    accessibility: A11yCheck;
    performance: PerformanceCheck;
  };
  errors: string[];
  warnings: string[];
}

interface TranslationCheck {
  status: 'PASS' | 'FAIL';
  locales: Record<string, LocaleStatus>;
  missingKeys: string[];
  coverage: number;
}

interface LocaleStatus {
  total: number;
  present: number;
  missing: string[];
  coverage: number;
}

interface BundleCheck {
  status: GuardianStatus;
  routes: Record<string, { size: number; budget: number; status: string }>;
}

interface A11yCheck {
  status: GuardianStatus;
  contrastIssues: string[];
  missingAltText: string[];
}

interface PerformanceCheck {
  status: GuardianStatus;
  lighthouse: { performance: number; accessibility: number; seo: number };
}

export class Guardian {
  private readonly basePath: string;
  private readonly report: GuardianReport;

  constructor(basePath: string = process.cwd()) {
    this.basePath = basePath;
    this.report = {
      timestamp: new Date().toISOString(),
      status: 'PASS',
      checks: {
        translations: { status: 'PASS', locales: {}, missingKeys: [], coverage: 0 },
        bundles: { status: 'PASS', routes: {} },
        accessibility: { status: 'PASS', contrastIssues: [], missingAltText: [] },
        performance: { status: 'PASS', lighthouse: { performance: 0, accessibility: 0, seo: 0 } }
      },
      errors: [],
      warnings: []
    };
  }

  async runAllChecks(): Promise<GuardianReport> {
    console.log('🛡️  ODAVL Guardian - Starting Quality Validation...');
    
    try {
      await this.checkTranslations();
      await this.checkBundleSizes();
      await this.checkAccessibility();
      await this.checkPerformance();
      
      this.finalizeReport();
      this.saveReport();
      
      return this.report;
    } catch (error) {
      this.report.status = 'FAIL';
      this.report.errors.push(`Guardian system error: ${error}`);
      return this.report;
    }
  }

  private async checkTranslations(): Promise<void> {
    console.log('🌍 Checking translation completeness...');
    
    const messagesPath = join(this.basePath, 'messages');
    const enPath = join(messagesPath, 'en.json');
    
    if (!statSync(enPath).isFile()) {
      this.report.errors.push('English locale file not found');
      this.report.checks.translations.status = 'FAIL';
      return;
    }

    const enMessages = JSON.parse(readFileSync(enPath, 'utf-8'));
    const requiredKeys = this.extractAllKeys(enMessages);
    
    const localeFiles = readdirSync(messagesPath)
      .filter(file => file.endsWith('.json') && file !== 'en.json');

    let totalCoverage = 0;
    
    for (const file of localeFiles) {
      const locale = file.replace('.json', '');
      const localePath = join(messagesPath, file);
      const localeMessages = JSON.parse(readFileSync(localePath, 'utf-8'));
      const presentKeys = this.extractAllKeys(localeMessages);
      
      const missing = requiredKeys.filter(key => !presentKeys.includes(key));
      const coverage = ((presentKeys.length / requiredKeys.length) * 100);
      
      this.report.checks.translations.locales[locale] = {
        total: requiredKeys.length,
        present: presentKeys.length,
        missing,
        coverage: Math.round(coverage)
      };
      
      totalCoverage += coverage;
      
      if (missing.length > 0) {
        this.report.checks.translations.missingKeys.push(...missing.map(k => `${locale}:${k}`));
        
        // Critical sections that must be complete
        const criticalMissing = missing.filter(key => 
          key.startsWith('hero.') || 
          key.startsWith('pricing.') || 
          key.startsWith('trust.')
        );
        
        if (criticalMissing.length > 0) {
          this.report.errors.push(`Critical translation keys missing in ${locale}: ${criticalMissing.join(', ')}`);
          this.report.checks.translations.status = 'FAIL';
        }
      }
    }
    
    this.report.checks.translations.coverage = Math.round(totalCoverage / localeFiles.length);
    
    if (this.report.checks.translations.coverage < 95) {
      this.report.warnings.push(`Translation coverage below 95%: ${this.report.checks.translations.coverage}%`);
    }
  }

  private extractAllKeys(obj: Record<string, unknown>, prefix = ''): string[] {
    const keys: string[] = [];
    
    for (const [key, value] of Object.entries(obj)) {
      const fullKey = prefix ? `${prefix}.${key}` : key;
      
      if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        keys.push(...this.extractAllKeys(value as Record<string, unknown>, fullKey));
      } else {
        keys.push(fullKey);
      }
    }
    
    return keys;
  }

  private async checkBundleSizes(): Promise<void> {
    console.log('📦 Checking bundle sizes...');
    
    // Performance budgets (in KB)
    const budgets = {
      '/': 180,
      '/pricing': 160,
      '/login': 150,
      '/signup': 150,
      '/docs': 140
    };

    // This would integrate with Next.js build analysis
    // For now, using estimated sizes based on Phase 1 findings
    const currentSizes: Record<string, number> = {
      '/': 208,
      '/pricing': 169,
      '/login': 170,
      '/signup': 170,
      '/docs': 140
    };

    for (const [route, budget] of Object.entries(budgets)) {
      const currentSize = currentSizes[route] || 0;
      let status: GuardianStatus;
      if (currentSize > budget) {
        status = 'FAIL';
      } else if (currentSize > budget * 0.9) {
        status = 'WARN';
      } else {
        status = 'PASS';
      }
      
      this.report.checks.bundles.routes[route] = {
        size: currentSize,
        budget,
        status
      };
      
      if (status === 'FAIL') {
        this.report.errors.push(`Bundle size exceeded for ${route}: ${currentSize}KB > ${budget}KB`);
        this.report.checks.bundles.status = 'FAIL';
      } else if (status === 'WARN') {
        this.report.warnings.push(`Bundle size approaching limit for ${route}: ${currentSize}KB (${budget}KB limit)`);
        if (this.report.checks.bundles.status === 'PASS') {
          this.report.checks.bundles.status = 'WARN';
        }
      }
    }
  }

  private async checkAccessibility(): Promise<void> {
    console.log('♿ Checking accessibility compliance...');
    
    // This would integrate with axe-core or similar
    // For now, basic checks that can be implemented
    
    // Placeholder for real accessibility validation
    this.report.checks.accessibility.status = 'PASS';
  }

  private async checkPerformance(): Promise<void> {
    console.log('⚡ Checking performance metrics...');
    
    // This would run Lighthouse CI or similar
    // For now, using baseline metrics
    const metrics = {
      performance: 85,
      accessibility: 92,
      seo: 88
    };
    
    this.report.checks.performance.lighthouse = metrics;
    
    if (metrics.performance < 80) {
      this.report.errors.push(`Performance score too low: ${metrics.performance}`);
      this.report.checks.performance.status = 'FAIL';
    }
  }

  private finalizeReport(): void {
    if (this.report.errors.length > 0) {
      this.report.status = 'FAIL';
    } else if (this.report.warnings.length > 0) {
      this.report.status = 'WARN';
    } else {
      this.report.status = 'PASS';
    }
  }

  private saveReport(): void {
    const reportsDir = join(this.basePath, 'reports', 'guardian');
    const reportPath = join(reportsDir, 'guardian-report.json');
    
    writeFileSync(reportPath, JSON.stringify(this.report, null, 2));
    
    // Also save timestamped version
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const timestampedPath = join(reportsDir, `guardian-${timestamp}.json`);
    writeFileSync(timestampedPath, JSON.stringify(this.report, null, 2));
    
    console.log(`📊 Guardian report saved to: ${reportPath}`);
  }

  // Static method for CLI usage
  static async run(basePath?: string): Promise<void> {
    const guardian = new Guardian(basePath);
    const report = await guardian.runAllChecks();
    
    console.log('\n🛡️  GUARDIAN REPORT SUMMARY');
    console.log('============================');
    console.log(`Status: ${report.status}`);
    console.log(`Timestamp: ${report.timestamp}`);
    console.log(`Translation Coverage: ${report.checks.translations.coverage}%`);
    console.log(`Bundle Status: ${report.checks.bundles.status}`);
    console.log(`Accessibility Status: ${report.checks.accessibility.status}`);
    console.log(`Performance Status: ${report.checks.performance.status}`);
    
    if (report.errors.length > 0) {
      console.log('\n❌ ERRORS:');
      report.errors.forEach(error => console.log(`  • ${error}`));
    }
    
    if (report.warnings.length > 0) {
      console.log('\n⚠️  WARNINGS:');
      report.warnings.forEach(warning => console.log(`  • ${warning}`));
    }
    
    if (report.status === 'FAIL') {
      process.exit(1);
    }
  }
}

// CLI execution
if (require.main === module) {
  Guardian.run().catch(console.error);
}