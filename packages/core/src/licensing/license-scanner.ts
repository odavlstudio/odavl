/**
 * License Scanner - Detect and analyze open source licenses
 * 
 * Purpose: Scan dependencies and source code for license information
 * Week 29: License Management (File 1/3)
 * 
 * License Categories:
 * - Permissive: MIT, Apache-2.0, BSD, ISC
 * - Weak Copyleft: LGPL, MPL, EPL
 * - Strong Copyleft: GPL-2.0, GPL-3.0, AGPL-3.0
 * - Proprietary: Commercial, Unlicensed
 * - Public Domain: CC0, Unlicense, WTFPL
 * 
 * SPDX License Identifiers: https://spdx.org/licenses/
 * 
 * @module @odavl-studio/core/licensing/license-scanner
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import { glob } from 'glob';

/**
 * License types based on SPDX and OSI
 */
export enum LicenseType {
  MIT = 'MIT',
  APACHE_2_0 = 'Apache-2.0',
  BSD_2_CLAUSE = 'BSD-2-Clause',
  BSD_3_CLAUSE = 'BSD-3-Clause',
  ISC = 'ISC',
  LGPL_2_1 = 'LGPL-2.1',
  LGPL_3_0 = 'LGPL-3.0',
  MPL_2_0 = 'MPL-2.0',
  EPL_1_0 = 'EPL-1.0',
  EPL_2_0 = 'EPL-2.0',
  GPL_2_0 = 'GPL-2.0',
  GPL_3_0 = 'GPL-3.0',
  AGPL_3_0 = 'AGPL-3.0',
  CC0_1_0 = 'CC0-1.0',
  UNLICENSE = 'Unlicense',
  WTFPL = 'WTFPL',
  PROPRIETARY = 'Proprietary',
  UNLICENSED = 'UNLICENSED',
  UNKNOWN = 'UNKNOWN'
}

/**
 * License category
 */
export enum LicenseCategory {
  PERMISSIVE = 'Permissive',           // MIT, Apache, BSD
  WEAK_COPYLEFT = 'Weak Copyleft',     // LGPL, MPL, EPL
  STRONG_COPYLEFT = 'Strong Copyleft', // GPL, AGPL
  PUBLIC_DOMAIN = 'Public Domain',     // CC0, Unlicense
  PROPRIETARY = 'Proprietary',         // Commercial
  UNKNOWN = 'Unknown'
}

/**
 * License risk level
 */
export enum LicenseRisk {
  LOW = 'low',       // Permissive licenses (MIT, Apache, BSD)
  MEDIUM = 'medium', // Weak copyleft (LGPL, MPL) or public domain
  HIGH = 'high',     // Strong copyleft (GPL, AGPL) - requires source disclosure
  CRITICAL = 'critical' // Proprietary or unknown - legal risk
}

/**
 * License finding
 */
export interface LicenseFinding {
  id: string;
  packageName: string;
  version: string;
  license: LicenseType;
  licenseText?: string;
  category: LicenseCategory;
  risk: LicenseRisk;
  file: string;
  source: 'package.json' | 'LICENSE' | 'README' | 'source-code' | 'npm-registry';
  spdxId?: string; // SPDX identifier
   osiApproved: boolean; // OSI approved license
  copyleft: boolean;
  linking: 'static' | 'dynamic' | 'none';
  obligations: string[]; // Legal obligations (attribution, source disclosure, etc.)
  references: string[];
}

/**
 * License scanner configuration
 */
export interface LicenseScannerConfig {
  rootPath: string;
  includeDevDependencies?: boolean;
  includePeerDependencies?: boolean;
  scanSourceCode?: boolean; // Scan for embedded license headers
  detectUnlicensed?: boolean;
  customLicenses?: CustomLicense[];
  packageManager?: 'npm' | 'yarn' | 'pnpm' | 'auto';
}

/**
 * Custom license definition
 */
export interface CustomLicense {
  name: string;
  spdxId?: string;
  pattern: RegExp;
  category: LicenseCategory;
  risk: LicenseRisk;
  obligations: string[];
}

/**
 * License scan result
 */
export interface LicenseScanResult {
  findings: LicenseFinding[];
  summary: {
    total: number;
    byType: Record<LicenseType, number>;
    byCategory: Record<LicenseCategory, number>;
    byRisk: Record<LicenseRisk, number>;
    osiApprovedCount: number;
    copyleftCount: number;
    proprietaryCount: number;
    unknownCount: number;
    packagesScanned: number;
    duration: number;
  };
  recommendations: string[];
  highRiskPackages: LicenseFinding[];
  metadata: {
    scanDate: Date;
    scannerVersion: string;
    configUsed: Partial<LicenseScannerConfig>;
  };
}

/**
 * License pattern for detection
 */
interface LicensePattern {
  type: LicenseType;
  spdxId: string;
  category: LicenseCategory;
  risk: LicenseRisk;
  patterns: RegExp[];
   osiApproved: boolean;
  copyleft: boolean;
  obligations: string[];
}

/**
 * Built-in license patterns
 */
const LICENSE_PATTERNS: LicensePattern[] = [
  {
    type: LicenseType.MIT,
    spdxId: 'MIT',
    category: LicenseCategory.PERMISSIVE,
    risk: LicenseRisk.LOW,
    patterns: [
      /MIT License/i,
      /\bMIT\b/,
      /Permission is hereby granted, free of charge/i
    ],
     osiApproved: true,
    copyleft: false,
    obligations: ['Include copyright notice', 'Include license text']
  },
  {
    type: LicenseType.APACHE_2_0,
    spdxId: 'Apache-2.0',
    category: LicenseCategory.PERMISSIVE,
    risk: LicenseRisk.LOW,
    patterns: [
      /Apache License.*Version 2\.0/i,
      /Apache-2\.0/i,
      /Licensed under the Apache License/i
    ],
     osiApproved: true,
    copyleft: false,
    obligations: [
      'Include copyright notice',
      'Include license text',
      'State modifications',
      'Include NOTICE file'
    ]
  },
  {
    type: LicenseType.BSD_3_CLAUSE,
    spdxId: 'BSD-3-Clause',
    category: LicenseCategory.PERMISSIVE,
    risk: LicenseRisk.LOW,
    patterns: [
      /BSD 3-Clause/i,
      /Redistribution and use in source and binary forms.*3\./is
    ],
     osiApproved: true,
    copyleft: false,
    obligations: ['Include copyright notice', 'Include license text', 'No endorsement clause']
  },
  {
    type: LicenseType.BSD_2_CLAUSE,
    spdxId: 'BSD-2-Clause',
    category: LicenseCategory.PERMISSIVE,
    risk: LicenseRisk.LOW,
    patterns: [
      /BSD 2-Clause/i,
      /Redistribution and use in source and binary forms.*2\./is
    ],
     osiApproved: true,
    copyleft: false,
    obligations: ['Include copyright notice', 'Include license text']
  },
  {
    type: LicenseType.ISC,
    spdxId: 'ISC',
    category: LicenseCategory.PERMISSIVE,
    risk: LicenseRisk.LOW,
    patterns: [
      /ISC License/i,
      /Permission to use, copy, modify.*ISC/is
    ],
     osiApproved: true,
    copyleft: false,
    obligations: ['Include copyright notice']
  },
  {
    type: LicenseType.LGPL_2_1,
    spdxId: 'LGPL-2.1',
    category: LicenseCategory.WEAK_COPYLEFT,
    risk: LicenseRisk.MEDIUM,
    patterns: [
      /GNU Lesser General Public License.*version 2\.1/i,
      /LGPL-2\.1/i,
      /GNU Library General Public License.*version 2/i
    ],
     osiApproved: true,
    copyleft: true,
    obligations: [
      'Disclose modifications to LGPL components',
      'Include license text',
      'Allow relinking (if static linking)',
      'Provide installation information'
    ]
  },
  {
    type: LicenseType.LGPL_3_0,
    spdxId: 'LGPL-3.0',
    category: LicenseCategory.WEAK_COPYLEFT,
    risk: LicenseRisk.MEDIUM,
    patterns: [
      /GNU Lesser General Public License.*version 3/i,
      /LGPL-3\.0/i,
      /LGPLv3/i
    ],
     osiApproved: true,
    copyleft: true,
    obligations: [
      'Disclose modifications to LGPL components',
      'Include license text',
      'Allow relinking (if static linking)',
      'Provide installation information',
      'Patent grant'
    ]
  },
  {
    type: LicenseType.MPL_2_0,
    spdxId: 'MPL-2.0',
    category: LicenseCategory.WEAK_COPYLEFT,
    risk: LicenseRisk.MEDIUM,
    patterns: [
      /Mozilla Public License.*Version 2\.0/i,
      /MPL-2\.0/i,
      /This Source Code Form is subject to the terms of the Mozilla/i
    ],
     osiApproved: true,
    copyleft: true,
    obligations: [
      'Disclose modifications to MPL files',
      'Include license text',
      'File-level copyleft (not project-level)'
    ]
  },
  {
    type: LicenseType.GPL_2_0,
    spdxId: 'GPL-2.0',
    category: LicenseCategory.STRONG_COPYLEFT,
    risk: LicenseRisk.HIGH,
    patterns: [
      /GNU General Public License.*version 2/i,
      /GPL-2\.0/i,
      /GPLv2/i
    ],
     osiApproved: true,
    copyleft: true,
    obligations: [
      'Disclose entire source code',
      'Include license text',
      'License entire work under GPL',
      'Provide installation information'
    ]
  },
  {
    type: LicenseType.GPL_3_0,
    spdxId: 'GPL-3.0',
    category: LicenseCategory.STRONG_COPYLEFT,
    risk: LicenseRisk.HIGH,
    patterns: [
      /GNU General Public License.*version 3/i,
      /GPL-3\.0/i,
      /GPLv3/i
    ],
     osiApproved: true,
    copyleft: true,
    obligations: [
      'Disclose entire source code',
      'Include license text',
      'License entire work under GPL',
      'Provide installation information',
      'Patent grant',
      'Anti-tivoization'
    ]
  },
  {
    type: LicenseType.AGPL_3_0,
    spdxId: 'AGPL-3.0',
    category: LicenseCategory.STRONG_COPYLEFT,
    risk: LicenseRisk.HIGH,
    patterns: [
      /GNU Affero General Public License.*version 3/i,
      /AGPL-3\.0/i,
      /AGPLv3/i
    ],
     osiApproved: true,
    copyleft: true,
    obligations: [
      'Disclose entire source code',
      'Include license text',
      'License entire work under AGPL',
      'Provide source for network use (SaaS clause)',
      'Patent grant'
    ]
  },
  {
    type: LicenseType.CC0_1_0,
    spdxId: 'CC0-1.0',
    category: LicenseCategory.PUBLIC_DOMAIN,
    risk: LicenseRisk.MEDIUM,
    patterns: [
      /CC0 1\.0 Universal/i,
      /Creative Commons Zero/i,
      /CC0-1\.0/i
    ],
     osiApproved: false,
    copyleft: false,
    obligations: ['No obligations (public domain dedication)']
  },
  {
    type: LicenseType.UNLICENSE,
    spdxId: 'Unlicense',
    category: LicenseCategory.PUBLIC_DOMAIN,
    risk: LicenseRisk.MEDIUM,
    patterns: [
      /This is free and unencumbered software released into the public domain/i,
      /Unlicense/i
    ],
     osiApproved: false,
    copyleft: false,
    obligations: ['No obligations (public domain)']
  },
  {
    type: LicenseType.WTFPL,
    spdxId: 'WTFPL',
    category: LicenseCategory.PUBLIC_DOMAIN,
    risk: LicenseRisk.MEDIUM,
    patterns: [
      /DO WHAT THE FUCK YOU WANT TO PUBLIC LICENSE/i,
      /WTFPL/i
    ],
     osiApproved: false,
    copyleft: false,
    obligations: ['No obligations']
  }
];

/**
 * License Scanner - Detect and analyze licenses
 */
export class LicenseScanner {
  private config: Required<LicenseScannerConfig>;
  private findings: LicenseFinding[] = [];
  private packageManager: 'npm' | 'yarn' | 'pnpm' = 'npm';

  constructor(config: LicenseScannerConfig) {
    this.config = {
      rootPath: config.rootPath,
      includeDevDependencies: config.includeDevDependencies ?? false,
      includePeerDependencies: config.includePeerDependencies ?? false,
      scanSourceCode: config.scanSourceCode ?? true,
      detectUnlicensed: config.detectUnlicensed ?? true,
      customLicenses: config.customLicenses ?? [],
      packageManager: config.packageManager ?? 'auto'
    };
  }

  /**
   * Run license scan
   */
  async scan(): Promise<LicenseScanResult> {
    const startTime = Date.now();
    this.findings = [];

    console.log('📜 Scanning for licenses...');

    // Detect package manager
    if (this.config.packageManager === 'auto') {
      this.packageManager = await this.detectPackageManager();
    } else {
      this.packageManager = this.config.packageManager;
    }
    console.log(`📦 Using ${this.packageManager}`);

    // Scan dependencies
    await this.scanDependencies();

    // Scan source code for embedded licenses
    if (this.config.scanSourceCode) {
      await this.scanSourceCodeLicenses();
    }

    // Generate summary
    const duration = Date.now() - startTime;
    const summary = this.generateSummary(duration);

    // Generate recommendations
    const recommendations = this.generateRecommendations();

    // Identify high-risk packages
    const highRiskPackages = this.findings.filter(
      f => f.risk === LicenseRisk.HIGH || f.risk === LicenseRisk.CRITICAL
    );

    return {
      findings: this.findings,
      summary,
      recommendations,
      highRiskPackages,
      metadata: {
        scanDate: new Date(),
        scannerVersion: '1.0.0',
        configUsed: this.config
      }
    };
  }

  /**
   * Detect package manager
   */
  private async detectPackageManager(): Promise<'npm' | 'yarn' | 'pnpm'> {
    try {
      await fs.access(path.join(this.config.rootPath, 'pnpm-lock.yaml'));
      return 'pnpm';
    } catch {}

    try {
      await fs.access(path.join(this.config.rootPath, 'yarn.lock'));
      return 'yarn';
    } catch {}

    return 'npm';
  }

  /**
   * Scan dependencies for licenses
   */
  private async scanDependencies(): Promise<void> {
    const packageJsonPath = path.join(this.config.rootPath, 'package.json');
    
    try {
      const packageJsonContent = await fs.readFile(packageJsonPath, 'utf-8');
      const packageJson = JSON.parse(packageJsonContent);

      // Scan production dependencies
      if (packageJson.dependencies) {
        await this.scanDependencyGroup(packageJson.dependencies, 'dependencies');
      }

      // Scan dev dependencies
      if (this.config.includeDevDependencies && packageJson.devDependencies) {
        await this.scanDependencyGroup(packageJson.devDependencies, 'devDependencies');
      }

      // Scan peer dependencies
      if (this.config.includePeerDependencies && packageJson.peerDependencies) {
        await this.scanDependencyGroup(packageJson.peerDependencies, 'peerDependencies');
      }

    } catch (error) {
      console.warn('⚠️  Failed to read package.json:', error instanceof Error ? error.message : error);
    }
  }

  /**
   * Scan a group of dependencies
   */
  private async scanDependencyGroup(
    dependencies: Record<string, string>,
    group: string
  ): Promise<void> {
    for (const [packageName, version] of Object.entries(dependencies)) {
      try {
        const finding = await this.scanPackage(packageName, version);
        if (finding) {
          this.findings.push(finding);
        }
      } catch (error) {
        console.warn(`⚠️  Failed to scan ${packageName}:`, error instanceof Error ? error.message : error);
      }
    }
  }

  /**
   * Scan a single package for license
   */
  private async scanPackage(packageName: string, version: string): Promise<LicenseFinding | null> {
    // Try to find package.json in node_modules
    const packagePath = path.join(this.config.rootPath, 'node_modules', packageName);
    
    // Check package.json for license field
    const licenseFromPackageJson = await this.getLicenseFromPackageJson(packagePath);
    if (licenseFromPackageJson) {
      return this.createFinding(
        packageName,
        version,
        licenseFromPackageJson.license,
        licenseFromPackageJson.licenseText,
        'package.json',
        packagePath
      );
    }

    // Check for LICENSE file
    const licenseFromFile = await this.getLicenseFromFile(packagePath);
    if (licenseFromFile) {
      return this.createFinding(
        packageName,
        version,
        licenseFromFile.license,
        licenseFromFile.licenseText,
        'LICENSE',
        packagePath
      );
    }

    // Check README
    const licenseFromReadme = await this.getLicenseFromReadme(packagePath);
    if (licenseFromReadme) {
      return this.createFinding(
        packageName,
        version,
        licenseFromReadme.license,
        licenseFromReadme.licenseText,
        'README',
        packagePath
      );
    }

    // Unknown license
    if (this.config.detectUnlicensed) {
      return this.createFinding(
        packageName,
        version,
        LicenseType.UNKNOWN,
        undefined,
        'package.json',
        packagePath
      );
    }

    return null;
  }

  /**
   * Get license from package.json
   */
  private async getLicenseFromPackageJson(
    packagePath: string
  ): Promise<{ license: LicenseType; licenseText?: string } | null> {
    try {
      const packageJsonPath = path.join(packagePath, 'package.json');
      const content = await fs.readFile(packageJsonPath, 'utf-8');
      const packageJson = JSON.parse(content);

      if (packageJson.license) {
        const license = this.detectLicenseType(packageJson.license);
        return { license };
      }

      // Legacy: licenses array
      if (packageJson.licenses && Array.isArray(packageJson.licenses)) {
        const firstLicense = packageJson.licenses[0];
        const licenseType = typeof firstLicense === 'string' 
          ? firstLicense 
          : firstLicense?.type;
        
        if (licenseType) {
          const license = this.detectLicenseType(licenseType);
          return { license };
        }
      }

    } catch (error) {
      // Package.json not found or not readable
    }

    return null;
  }

  /**
   * Get license from LICENSE file
   */
  private async getLicenseFromFile(
    packagePath: string
  ): Promise<{ license: LicenseType; licenseText: string } | null> {
    const licenseFiles = ['LICENSE', 'LICENSE.md', 'LICENSE.txt', 'LICENCE', 'COPYING'];

    for (const filename of licenseFiles) {
      try {
        const licensePath = path.join(packagePath, filename);
        const licenseText = await fs.readFile(licensePath, 'utf-8');
        const license = this.detectLicenseType(licenseText);
        return { license, licenseText };
      } catch {
        continue;
      }
    }

    return null;
  }

  /**
   * Get license from README
   */
  private async getLicenseFromReadme(
    packagePath: string
  ): Promise<{ license: LicenseType; licenseText?: string } | null> {
    const readmeFiles = ['README.md', 'README.txt', 'README'];

    for (const filename of readmeFiles) {
      try {
        const readmePath = path.join(packagePath, filename);
        const content = await fs.readFile(readmePath, 'utf-8');
        
        // Look for license section
        const licenseMatch = content.match(/##\s*License\s*([\s\S]*?)(?=##|$)/i);
        if (licenseMatch) {
          const license = this.detectLicenseType(licenseMatch[1]);
          return { license, licenseText: licenseMatch[1] };
        }
      } catch {
        continue;
      }
    }

    return null;
  }

  /**
   * Detect license type from text
   */
  private detectLicenseType(text: string): LicenseType {
    // Check built-in patterns
    for (const pattern of LICENSE_PATTERNS) {
      for (const regex of pattern.patterns) {
        if (regex.test(text)) {
          return pattern.type;
        }
      }
    }

    // Check custom licenses
    for (const custom of this.config.customLicenses) {
      if (custom.pattern.test(text)) {
        // Custom licenses return as UNKNOWN with metadata
        return LicenseType.UNKNOWN;
      }
    }

    // Check for proprietary keywords
    if (/proprietary|commercial|all rights reserved/i.test(text)) {
      return LicenseType.PROPRIETARY;
    }

    // Check for UNLICENSED
    if (/UNLICENSED/i.test(text)) {
      return LicenseType.UNLICENSED;
    }

    return LicenseType.UNKNOWN;
  }

  /**
   * Scan source code for embedded license headers
   */
  private async scanSourceCodeLicenses(): Promise<void> {
    const files = await glob('**/*.{ts,js,py,java,cs,cpp,c,h}', {
      cwd: this.config.rootPath,
      ignore: ['**/node_modules/**', '**/dist/**', '**/build/**'],
      absolute: true,
      nodir: true
    });

    for (const file of files) {
      try {
        const content = await fs.readFile(file, 'utf-8');
        
        // Check first 50 lines for license header
        const lines = content.split('\n').slice(0, 50);
        const header = lines.join('\n');

        const license = this.detectLicenseType(header);
        if (license !== LicenseType.UNKNOWN) {
          // Found embedded license
          const finding: LicenseFinding = {
            id: `source-${this.findings.length}`,
            packageName: 'source-code',
            version: '1.0.0',
            license,
            category: this.getLicenseCategory(license),
            risk: this.getLicenseRisk(license),
            file: path.relative(this.config.rootPath, file),
            source: 'source-code',
            spdxId: this.getSPDXId(license),
             osiApproved: this.isOSIApproved(license),
            copyleft: this.isCopyleft(license),
            linking: 'none',
            obligations: this.getObligations(license),
            references: [
              'https://spdx.org/licenses/',
              'https://opensource.org/licenses'
            ]
          };
          this.findings.push(finding);
        }
      } catch (error) {
        // Ignore unreadable files
      }
    }
  }

  /**
   * Create a license finding
   */
  private createFinding(
    packageName: string,
    version: string,
    license: LicenseType,
    licenseText: string | undefined,
    source: LicenseFinding['source'],
    file: string
  ): LicenseFinding {
    return {
      id: `${packageName}-${version}`,
      packageName,
      version,
      license,
      licenseText,
      category: this.getLicenseCategory(license),
      risk: this.getLicenseRisk(license),
      file: path.relative(this.config.rootPath, file),
      source,
      spdxId: this.getSPDXId(license),
       osiApproved: this.isOSIApproved(license),
      copyleft: this.isCopyleft(license),
      linking: 'dynamic', // Most npm packages are dynamically linked
      obligations: this.getObligations(license),
      references: [
        'https://spdx.org/licenses/',
        'https://opensource.org/licenses',
        'https://choosealicense.com/'
      ]
    };
  }

  /**
   * Get license category
   */
  private getLicenseCategory(license: LicenseType): LicenseCategory {
    const pattern = LICENSE_PATTERNS.find(p => p.type === license);
    return pattern?.category ?? LicenseCategory.UNKNOWN;
  }

  /**
   * Get license risk
   */
  private getLicenseRisk(license: LicenseType): LicenseRisk {
    const pattern = LICENSE_PATTERNS.find(p => p.type === license);
    return pattern?.risk ?? LicenseRisk.CRITICAL;
  }

  /**
   * Get SPDX identifier
   */
  private getSPDXId(license: LicenseType): string | undefined {
    const pattern = LICENSE_PATTERNS.find(p => p.type === license);
    return pattern?.spdxId;
  }

  /**
   * Check if OSI approved
   */
  private isOSIApproved(license: LicenseType): boolean {
    const pattern = LICENSE_PATTERNS.find(p => p.type === license);
    return pattern?. osiApproved ?? false;
  }

  /**
   * Check if copyleft
   */
  private isCopyleft(license: LicenseType): boolean {
    const pattern = LICENSE_PATTERNS.find(p => p.type === license);
    return pattern?.copyleft ?? false;
  }

  /**
   * Get license obligations
   */
  private getObligations(license: LicenseType): string[] {
    const pattern = LICENSE_PATTERNS.find(p => p.type === license);
    return pattern?.obligations ?? ['Unknown obligations - consult legal counsel'];
  }

  /**
   * Generate summary statistics
   */
  private generateSummary(duration: number): LicenseScanResult['summary'] {
    const byType: Record<LicenseType, number> = {} as any;
    const byCategory: Record<LicenseCategory, number> = {} as any;
    const byRisk: Record<LicenseRisk, number> = {} as any;

    // Initialize counters
    for (const type of Object.values(LicenseType)) {
      byType[type] = 0;
    }
    for (const category of Object.values(LicenseCategory)) {
      byCategory[category] = 0;
    }
    for (const risk of Object.values(LicenseRisk)) {
      byRisk[risk] = 0;
    }

    let osiApprovedCount = 0;
    let copyleftCount = 0;
    let proprietaryCount = 0;
    let unknownCount = 0;

    for (const finding of this.findings) {
      byType[finding.license]++;
      byCategory[finding.category]++;
      byRisk[finding.risk]++;

      if (finding. osiApproved) osiApprovedCount++;
      if (finding.copyleft) copyleftCount++;
      if (finding.license === LicenseType.PROPRIETARY) proprietaryCount++;
      if (finding.license === LicenseType.UNKNOWN) unknownCount++;
    }

    return {
      total: this.findings.length,
      byType,
      byCategory,
      byRisk,
      osiApprovedCount,
      copyleftCount,
      proprietaryCount,
      unknownCount,
      packagesScanned: this.findings.length,
      duration
    };
  }

  /**
   * Generate recommendations
   */
  private generateRecommendations(): string[] {
    const recommendations: string[] = [];

    // Check for strong copyleft
    const strongCopyleft = this.findings.filter(
      f => f.category === LicenseCategory.STRONG_COPYLEFT
    );
    if (strongCopyleft.length > 0) {
      recommendations.push(
        `⚠️  ${strongCopyleft.length} packages with strong copyleft licenses (GPL, AGPL). ` +
        `These require source disclosure. Consider alternatives or separate from proprietary code.`
      );
    }

    // Check for unknown licenses
    const unknown = this.findings.filter(f => f.license === LicenseType.UNKNOWN);
    if (unknown.length > 0) {
      recommendations.push(
        `❓ ${unknown.length} packages with unknown licenses. ` +
        `Review manually and contact package authors for clarification.`
      );
    }

    // Check for proprietary licenses
    const proprietary = this.findings.filter(f => f.license === LicenseType.PROPRIETARY);
    if (proprietary.length > 0) {
      recommendations.push(
        `🔒 ${proprietary.length} proprietary packages. ` +
        `Verify commercial license agreements are in place.`
      );
    }

    // Check for UNLICENSED
    const unlicensed = this.findings.filter(f => f.license === LicenseType.UNLICENSED);
    if (unlicensed.length > 0) {
      recommendations.push(
        `⛔ ${unlicensed.length} unlicensed packages. ` +
        `These cannot be legally used without explicit permission. Replace immediately.`
      );
    }

    // General recommendations
    if (recommendations.length === 0) {
      recommendations.push('✅ All licenses are permissive or weak copyleft. Low legal risk.');
    } else {
      recommendations.push('📋 Document all license obligations in THIRD_PARTY_LICENSES.md');
      recommendations.push('⚖️  Consult legal counsel for high-risk licenses');
    }

    return recommendations;
  }

  /**
   * Export findings to JSON
   */
  exportToJSON(): string {
    return JSON.stringify({
      findings: this.findings,
      summary: this.generateSummary(0),
      recommendations: this.generateRecommendations(),
      metadata: {
        scanDate: new Date().toISOString(),
        scannerVersion: '1.0.0'
      }
    }, null, 2);
  }

  /**
   * Export findings to CSV
   */
  exportToCSV(): string {
    const headers = [
      'Package',
      'Version',
      'License',
      'SPDX',
      'Category',
      'Risk',
      'OSI Approved',
      'Copyleft',
      'Obligations'
    ];

    const rows = this.findings.map(f => [
      f.packageName,
      f.version,
      f.license,
      f.spdxId ?? 'N/A',
      f.category,
      f.risk,
      f. osiApproved ? 'Yes' : 'No',
      f.copyleft ? 'Yes' : 'No',
      f.obligations.join('; ')
    ]);

    return [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');
  }
}

/**
 * Convenience function to run license scan
 */
export async function runLicenseScan(config: LicenseScannerConfig): Promise<LicenseScanResult> {
  const scanner = new LicenseScanner(config);
  return scanner.scan();
}

/**
 * Quick license risk check for CI/CD
 */
export async function quickLicenseCheck(rootPath: string): Promise<{ hasHighRisk: boolean; count: number }> {
  const scanner = new LicenseScanner({ rootPath });
  const result = await scanner.scan();
  
  const highRisk = result.findings.filter(
    f => f.risk === LicenseRisk.HIGH || f.risk === LicenseRisk.CRITICAL
  );

  return {
    hasHighRisk: highRisk.length > 0,
    count: highRisk.length
  };
}
