/**
 * ODAVL Insight - License Manager
 * 
 * Manages license validation and tier enforcement for VS Code Extension
 * 
 * @module LicenseManager
 */

import * as vscode from 'vscode';
import * as fs from 'fs/promises';
import * as path from 'path';

/**
 * Subscription Tiers
 */
export enum SubscriptionTier {
  FREE = 'FREE',
  PRO = 'PRO',
  ENTERPRISE = 'ENTERPRISE'
}

/**
 * License Information
 */
export interface License {
  tier: SubscriptionTier;
  email?: string;
  organizationId?: string;
  features: string[];
  expiresAt?: Date;
  maxProjects?: number;
  maxAnalysesPerMonth?: number;
}

/**
 * License Validation Result
 */
export interface ValidationResult {
  valid: boolean;
  license: License | null;
  error?: string;
}

/**
 * License Manager Class
 * 
 * Handles license key validation, tier determination, and feature access control
 */
export class LicenseManager {
  private context: vscode.ExtensionContext;
  private cachedLicense: License | null = null;
  private lastValidation: number = 0;
  private static readonly CACHE_DURATION_MS = 5 * 60 * 1000; // 5 minutes

  constructor(context: vscode.ExtensionContext) {
    this.context = context;
  }

  /**
   * Check and validate license
   * 
   * Flow:
   * 1. Check cache (5 min TTL)
   * 2. Try local license file (.odavl/license.key)
   * 3. Try VS Code settings (odavl.licenseKey)
   * 4. Try backend API validation (future)
   * 5. Fallback to FREE tier
   * 
   * @returns License information
   */
  async checkLicense(): Promise<License> {
    // Return cached license if still valid
    if (this.cachedLicense && (Date.now() - this.lastValidation) < LicenseManager.CACHE_DURATION_MS) {
      return this.cachedLicense;
    }

    // Try local license file
    const localLicense = await this.readLocalLicense();
    if (localLicense) {
      this.cachedLicense = localLicense;
      this.lastValidation = Date.now();
      return localLicense;
    }

    // Try VS Code settings
    const settingsLicense = await this.readSettingsLicense();
    if (settingsLicense) {
      this.cachedLicense = settingsLicense;
      this.lastValidation = Date.now();
      return settingsLicense;
    }

    // Future: Try backend API
    // const cloudLicense = await this.validateWithBackend(licenseKey);

    // Fallback to FREE tier
    const freeLicense: License = {
      tier: SubscriptionTier.FREE,
      features: this.getFeaturesForTier(SubscriptionTier.FREE),
      maxProjects: 3,
      maxAnalysesPerMonth: 100
    };

    this.cachedLicense = freeLicense;
    this.lastValidation = Date.now();
    
    return freeLicense;
  }

  /**
   * Read license from local file (.odavl/license.key)
   */
  private async readLocalLicense(): Promise<License | null> {
    try {
      const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
      if (!workspaceFolder) {
        return null;
      }

      const licensePath = path.join(workspaceFolder.uri.fsPath, '.odavl', 'license.key');
      const licenseContent = await fs.readFile(licensePath, 'utf8');
      
      return this.parseLicenseKey(licenseContent.trim());
    } catch (error) {
      // File doesn't exist or is invalid - this is normal for FREE users
      return null;
    }
  }

  /**
   * Read license from VS Code settings
   */
  private async readSettingsLicense(): Promise<License | null> {
    const config = vscode.workspace.getConfiguration('odavl');
    const licenseKey = config.get<string>('licenseKey');

    if (!licenseKey) {
      return null;
    }

    return this.parseLicenseKey(licenseKey);
  }

  /**
   * Parse and validate license key
   * 
   * Format: ODAVL-{TIER}-{RANDOM}-{CHECKSUM}
   * Example: ODAVL-PRO-X7K9M2-A8F3
   * 
   * @param licenseKey - Raw license key string
   */
  private async parseLicenseKey(licenseKey: string): Promise<License | null> {
    try {
      // Basic format validation
      if (!licenseKey.startsWith('ODAVL-')) {
        vscode.window.showErrorMessage('ODAVL Insight: Invalid license key format');
        return null;
      }

      // Try to validate with backend API
      const backendUrl = process.env.ODAVL_API_URL || 'https://odavl.studio/api';
      
      try {
        const response = await fetch(`${backendUrl}/license/validate`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            licenseKey,
            extensionVersion: this.context.extension.packageJSON.version,
            machineId: vscode.env.machineId,
          }),
        });

        if (!response.ok) {
          throw new Error(`Backend validation failed: ${response.status}`);
        }

        const result = await response.json();

        if (!result.valid) {
          vscode.window.showErrorMessage(`ODAVL Insight: ${result.error || 'Invalid license key'}`);
          return null;
        }

        // Parse tier from license key (ODAVL-TIER-...)
        const parts = licenseKey.split('-');
        const tierStr = parts[1];

        if (!Object.values(SubscriptionTier).includes(tierStr as SubscriptionTier)) {
          vscode.window.showErrorMessage(`ODAVL Insight: Invalid tier "${tierStr}"`);
          return null;
        }

        const tier = tierStr as SubscriptionTier;

        return {
          tier,
          email: result.email,
          features: result.features || this.getFeaturesForTier(tier),
          expiresAt: result.expiresAt ? new Date(result.expiresAt) : undefined,
          maxProjects: result.maxProjects,
          maxAnalysesPerMonth: result.maxAnalysesPerMonth,
        };

      } catch (backendError) {
        // Backend validation failed - fall back to local validation
        console.warn('⚠️  Backend validation failed, using local validation:', backendError);
        
        const parts = licenseKey.split('-');
        if (parts.length !== 4) {
          vscode.window.showErrorMessage('ODAVL Insight: Invalid license key format');
          return null;
        }

        const [prefix, tierStr, random, checksum] = parts;
        
        if (!Object.values(SubscriptionTier).includes(tierStr as SubscriptionTier)) {
          vscode.window.showErrorMessage(`ODAVL Insight: Invalid tier "${tierStr}"`);
          return null;
        }

        const tier = tierStr as SubscriptionTier;

        // Local validation (basic)
        return {
          tier,
          features: this.getFeaturesForTier(tier),
          ...this.getLimitsForTier(tier)
        };
      }
    } catch (error) {
      vscode.window.showErrorMessage(`ODAVL Insight: Failed to parse license key - ${error}`);
      return null;
    }
  }

  /**
   * Get features available for a tier
   */
  private getFeaturesForTier(tier: SubscriptionTier): string[] {
    const features: Record<SubscriptionTier, string[]> = {
      [SubscriptionTier.FREE]: [
        'typescript-detector',
        'eslint-detector',
        'import-detector'
      ],
      [SubscriptionTier.PRO]: [
        'typescript-detector',
        'eslint-detector',
        'import-detector',
        'security-detector',
        'performance-detector',
        'circular-detector',
        'package-detector',
        'build-detector',
        'ml-predictions',
        'auto-fix'
      ],
      [SubscriptionTier.ENTERPRISE]: [
        'all', // All features
        'custom-rules',
        'sso',
        'priority-support',
        'on-premise',
        'audit-logs'
      ]
    };

    return features[tier];
  }

  /**
   * Get usage limits for a tier
   */
  private getLimitsForTier(tier: SubscriptionTier): Pick<License, 'maxProjects' | 'maxAnalysesPerMonth'> {
    const limits: Record<SubscriptionTier, Pick<License, 'maxProjects' | 'maxAnalysesPerMonth'>> = {
      [SubscriptionTier.FREE]: {
        maxProjects: 3,
        maxAnalysesPerMonth: 100
      },
      [SubscriptionTier.PRO]: {
        maxProjects: 10,
        maxAnalysesPerMonth: 1000
      },
      [SubscriptionTier.ENTERPRISE]: {
        maxProjects: undefined, // Unlimited
        maxAnalysesPerMonth: undefined // Unlimited
      }
    };

    return limits[tier];
  }

  /**
   * Check if feature is available in current license
   */
  async hasFeature(featureName: string): Promise<boolean> {
    const license = await this.checkLicense();
    
    // Enterprise gets everything
    if (license.features.includes('all')) {
      return true;
    }

    return license.features.includes(featureName);
  }

  /**
   * Show upgrade prompt to user
   */
  async showUpgradePrompt(featureName?: string): Promise<void> {
    const message = featureName 
      ? `${featureName} requires ODAVL Insight PRO or ENTERPRISE.`
      : 'Upgrade to ODAVL Insight PRO for advanced features.';

    const action = await vscode.window.showInformationMessage(
      message,
      'Learn More',
      'Upgrade Now',
      'Maybe Later'
    );

    if (action === 'Learn More') {
      vscode.env.openExternal(vscode.Uri.parse('https://odavl.studio/pricing'));
    } else if (action === 'Upgrade Now') {
      vscode.env.openExternal(vscode.Uri.parse('https://odavl.studio/upgrade?from=vscode'));
    }
  }

  /**
   * Save license key to local file
   */
  async saveLicenseKey(licenseKey: string): Promise<void> {
    try {
      const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
      if (!workspaceFolder) {
        throw new Error('No workspace folder open');
      }

      const odavlDir = path.join(workspaceFolder.uri.fsPath, '.odavl');
      const licensePath = path.join(odavlDir, 'license.key');

      // Create .odavl directory if it doesn't exist
      await fs.mkdir(odavlDir, { recursive: true });

      // Write license key
      await fs.writeFile(licensePath, licenseKey, 'utf8');

      // Clear cache to force re-validation
      this.cachedLicense = null;
      this.lastValidation = 0;

      vscode.window.showInformationMessage('ODAVL Insight: License key saved successfully!');
    } catch (error) {
      vscode.window.showErrorMessage(`ODAVL Insight: Failed to save license key - ${error}`);
      throw error;
    }
  }

  /**
   * Clear cached license (force re-validation)
   */
  clearCache(): void {
    this.cachedLicense = null;
    this.lastValidation = 0;
  }
}
