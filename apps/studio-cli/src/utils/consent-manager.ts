/**
 * ODAVL Insight Cloud - Consent Management
 * Phase 1 - Beta Onboarding (Low-Friction)
 * 
 * Manages user consent for cloud uploads.
 * 
 * Consent is required for:
 * - First cloud upload
 * - After privacy policy updates
 * - After ZCC specification changes
 * 
 * Consent is stored in: ~/.odavl/consent.json
 */

import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import * as os from 'node:os';
import * as readline from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';
import chalk from 'chalk';

/**
 * Consent record
 */
export interface ConsentRecord {
  version: string;           // Consent version (e.g., "1.0.0")
  agreedAt: string;          // ISO 8601 timestamp
  features: {
    cloudUpload: boolean;    // Allow cloud snapshot uploads
    telemetry: boolean;      // Allow anonymous telemetry (if enabled)
  };
  zccSpecVersion: string;    // ZCC specification version agreed to
}

/**
 * Consent manager for cloud features
 */
export class ConsentManager {
  private consentDir: string;
  private consentFile: string;
  
  // Current versions
  private static readonly CURRENT_CONSENT_VERSION = '1.0.0';
  private static readonly CURRENT_ZCC_SPEC_VERSION = '1.0.0';
  
  constructor() {
    this.consentDir = path.join(os.homedir(), '.odavl');
    this.consentFile = path.join(this.consentDir, 'consent.json');
  }
  
  /**
   * Check if user has given consent for cloud uploads
   * @returns true if consent is valid, false otherwise
   */
  async hasCloudUploadConsent(): Promise<boolean> {
    try {
      const consent = await this.loadConsent();
      if (!consent) return false;
      
      // Check if consent is still valid (same version)
      if (consent.version !== ConsentManager.CURRENT_CONSENT_VERSION) {
        return false;
      }
      
      // Check if ZCC spec version matches
      if (consent.zccSpecVersion !== ConsentManager.CURRENT_ZCC_SPEC_VERSION) {
        return false;
      }
      
      // Check if cloud upload is enabled
      return consent.features.cloudUpload === true;
    } catch {
      return false;
    }
  }
  
  /**
   * Request consent from user (interactive prompt)
   * @param silent - If true, skip prompt and return false
   * @returns true if consent granted, false otherwise
   */
  async requestCloudUploadConsent(silent: boolean = false): Promise<boolean> {
    // If silent mode, don't prompt
    if (silent) {
      return false;
    }
    
    // Check if already consented
    if (await this.hasCloudUploadConsent()) {
      return true;
    }
    
    // Display consent information
    console.log(chalk.cyan.bold('\n📊 Insight Cloud - First Upload\n'));
    console.log(chalk.white('ODAVL Insight can send analysis snapshots to the cloud for:'));
    console.log(chalk.white('  • Historical tracking'));
    console.log(chalk.white('  • Team collaboration'));
    console.log(chalk.white('  • Trend analysis\n'));
    
    console.log(chalk.cyan.bold('Privacy Guarantee (ZCC - Zero Code Cloud):\n'));
    console.log(chalk.white('We send ONLY metadata:'));
    console.log(chalk.green('  ✓ Issue counts by severity'));
    console.log(chalk.green('  ✓ Detector names used'));
    console.log(chalk.green('  ✓ Risk scores (calculated)'));
    console.log(chalk.green('  ✓ Analysis timing\n'));
    
    console.log(chalk.white('We NEVER send:'));
    console.log(chalk.red('  ✗ Source code'));
    console.log(chalk.red('  ✗ File paths'));
    console.log(chalk.red('  ✗ Error messages'));
    console.log(chalk.red('  ✗ Variable names'));
    console.log(chalk.red('  ✗ Any identifiable information\n'));
    
    console.log(chalk.gray('Full ZCC specification: https://docs.odavl.com/zcc\n'));
    
    // Opt-out instructions
    console.log(chalk.cyan.bold('How to Opt-Out:\n'));
    console.log(chalk.white('  • Don\'t use the --upload flag'));
    console.log(chalk.white('  • Run: odavl insight auth logout'));
    console.log(chalk.white('  • Set: ODAVL_NO_CLOUD=true (environment variable)\n'));
    
    // Ask for consent
    const rl = readline.createInterface({ input, output });
    const answer = await rl.question(chalk.yellow.bold('Allow cloud uploads? (y/N): '));
    rl.close();
    
    const consented = answer.toLowerCase() === 'y';
    
    if (consented) {
      // Save consent
      await this.saveConsent({
        version: ConsentManager.CURRENT_CONSENT_VERSION,
        agreedAt: new Date().toISOString(),
        features: {
          cloudUpload: true,
          telemetry: false, // Separate consent
        },
        zccSpecVersion: ConsentManager.CURRENT_ZCC_SPEC_VERSION,
      });
      
      console.log(chalk.green('\n✓ Consent saved. Cloud uploads enabled.\n'));
      console.log(chalk.gray('Run `odavl insight auth logout` to revoke.\n'));
      
      return true;
    } else {
      console.log(chalk.yellow('\n✗ Cloud uploads disabled.\n'));
      console.log(chalk.gray('Run `odavl insight analyze` without --upload for local-only analysis.\n'));
      
      return false;
    }
  }
  
  /**
   * Revoke consent (called on logout)
   */
  async revokeConsent(): Promise<void> {
    try {
      await fs.unlink(this.consentFile);
    } catch {
      // File doesn't exist - already revoked
    }
  }
  
  /**
   * Load consent record
   */
  private async loadConsent(): Promise<ConsentRecord | null> {
    try {
      const content = await fs.readFile(this.consentFile, 'utf-8');
      return JSON.parse(content) as ConsentRecord;
    } catch {
      return null;
    }
  }
  
  /**
   * Save consent record
   */
  private async saveConsent(consent: ConsentRecord): Promise<void> {
    await fs.mkdir(this.consentDir, { recursive: true });
    await fs.writeFile(this.consentFile, JSON.stringify(consent, null, 2), 'utf-8');
  }
  
  /**
   * Check if cloud uploads are disabled via environment variable
   */
  static isCloudDisabledByEnv(): boolean {
    return process.env.ODAVL_NO_CLOUD === 'true' || 
           process.env.ODAVL_NO_CLOUD === '1';
  }
}
