/**
 * License Compatibility Checker - Verify license compatibility
 * 
 * Purpose: Check if licenses can be combined in the same project
 * Week 29: License Management (File 2/3)
 * 
 * License Compatibility Rules:
 * - Permissive → Permissive: ✅ Compatible
 * - Permissive → Weak Copyleft: ✅ Compatible
 * - Permissive → Strong Copyleft: ⚠️  Risky (GPL infects entire project)
 * - Weak Copyleft → Weak Copyleft: ✅ Compatible (same license family)
 * - Weak Copyleft → Strong Copyleft: ⚠️  Check specific terms
 * - Strong Copyleft → Strong Copyleft: ❌ Incompatible (GPL-2.0 vs GPL-3.0)
 * - Any → Proprietary: ❌ Check commercial terms
 * 
 * Key Compatibility Issues:
 * - GPL-2.0 vs GPL-3.0: Incompatible
 * - Apache-2.0 vs GPL-2.0: Incompatible (patent clause conflict)
 * - LGPL can link with proprietary (if dynamic linking)
 * - AGPL requires source disclosure for network use (SaaS)
 * 
 * @module @odavl-studio/core/licensing/license-compatibility
 */

import { LicenseType, LicenseCategory, LicenseRisk, LicenseFinding } from './license-scanner';

/**
 * Compatibility status
 */
export enum CompatibilityStatus {
  COMPATIBLE = 'compatible',           // No known conflicts
  CONDITIONALLY_COMPATIBLE = 'conditionally-compatible', // Compatible under certain conditions
  INCOMPATIBLE = 'incompatible',       // Known conflicts
  UNKNOWN = 'unknown'                  // Insufficient information
}

/**
 * Compatibility issue severity
 */
export enum CompatibilitySeverity {
  CRITICAL = 'critical', // Legal risk - cannot ship
  HIGH = 'high',         // Significant risk - needs legal review
  MEDIUM = 'medium',     // Minor risk - consider alternatives
  LOW = 'low',           // Advisory - best practice
  INFO = 'info'          // Informational
}

/**
 * Compatibility conflict
 */
export interface CompatibilityConflict {
  id: string;
  license1: LicenseType;
  license2: LicenseType;
  package1: string;
  package2: string;
  status: CompatibilityStatus;
  severity: CompatibilitySeverity;
  reason: string;
  explanation: string;
  resolution: string[];
  references: string[];
}

/**
 * Compatibility check configuration
 */
export interface CompatibilityCheckConfig {
  findings: LicenseFinding[];
  allowWeakCopyleft?: boolean;      // Allow LGPL, MPL (default: true)
  allowStrongCopyleft?: boolean;    // Allow GPL, AGPL (default: false)
  allowProprietary?: boolean;       // Allow proprietary licenses (default: true)
  dynamicLinkingOnly?: boolean;     // If true, weak copyleft is OK (LGPL allows dynamic linking)
  distributionType?: 'binary' | 'source' | 'saas'; // How software is distributed
  projectLicense?: LicenseType;     // License of your project
}

/**
 * Compatibility check result
 */
export interface CompatibilityCheckResult {
  conflicts: CompatibilityConflict[];
  summary: {
    total: number;
    bySeverity: Record<CompatibilitySeverity, number>;
    byStatus: Record<CompatibilityStatus, number>;
    criticalCount: number;
    compatibleCount: number;
    incompatibleCount: number;
  };
  recommendations: string[];
  overallStatus: CompatibilityStatus;
  canShip: boolean; // Can project be shipped without legal risk?
  metadata: {
    checkDate: Date;
    checkerVersion: string;
    configUsed: Partial<CompatibilityCheckConfig>;
  };
}

/**
 * Known incompatibilities (static rules)
 */
const KNOWN_INCOMPATIBILITIES: Array<{
  license1: LicenseType;
  license2: LicenseType;
  status: CompatibilityStatus;
  severity: CompatibilitySeverity;
  reason: string;
  resolution: string[];
}> = [
  // GPL-2.0 vs GPL-3.0
  {
    license1: LicenseType.GPL_2_0,
    license2: LicenseType.GPL_3_0,
    status: CompatibilityStatus.INCOMPATIBLE,
    severity: CompatibilitySeverity.CRITICAL,
    reason: 'GPL-2.0 "only" vs GPL-3.0: Version conflict',
    resolution: [
      'Use GPL-2.0-or-later instead of GPL-2.0-only',
      'Or replace GPL-3.0 dependency with GPL-2.0 compatible alternative',
      'Or obtain dual-license from GPL-3.0 package author'
    ]
  },

  // Apache-2.0 vs GPL-2.0 (patent clause conflict)
  {
    license1: LicenseType.APACHE_2_0,
    license2: LicenseType.GPL_2_0,
    status: CompatibilityStatus.INCOMPATIBLE,
    severity: CompatibilitySeverity.HIGH,
    reason: 'Apache-2.0 patent clause incompatible with GPL-2.0',
    resolution: [
      'Use GPL-3.0 instead (compatible with Apache-2.0)',
      'Or replace Apache-2.0 dependency with MIT/BSD alternative',
      'Or use Apache-2.0 code in separate process (not linked)'
    ]
  },

  // GPL vs Proprietary
  {
    license1: LicenseType.GPL_2_0,
    license2: LicenseType.PROPRIETARY,
    status: CompatibilityStatus.INCOMPATIBLE,
    severity: CompatibilitySeverity.CRITICAL,
    reason: 'GPL requires entire work to be open source',
    resolution: [
      'Replace GPL dependency with permissive alternative (MIT, Apache, BSD)',
      'Or separate GPL code into standalone service (network boundary)',
      'Or obtain commercial license from GPL package author'
    ]
  },
  {
    license1: LicenseType.GPL_3_0,
    license2: LicenseType.PROPRIETARY,
    status: CompatibilityStatus.INCOMPATIBLE,
    severity: CompatibilitySeverity.CRITICAL,
    reason: 'GPL-3.0 requires entire work to be open source',
    resolution: [
      'Replace GPL-3.0 dependency with permissive alternative',
      'Or separate GPL code into standalone service',
      'Or obtain commercial license'
    ]
  },

  // AGPL vs Proprietary (even stricter)
  {
    license1: LicenseType.AGPL_3_0,
    license2: LicenseType.PROPRIETARY,
    status: CompatibilityStatus.INCOMPATIBLE,
    severity: CompatibilitySeverity.CRITICAL,
    reason: 'AGPL requires source disclosure even for network use (SaaS)',
    resolution: [
      'Replace AGPL dependency immediately',
      'AGPL is incompatible with proprietary SaaS/web apps',
      'Or obtain commercial license'
    ]
  },

  // MPL vs GPL-2.0 (some compatibility issues)
  {
    license1: LicenseType.MPL_2_0,
    license2: LicenseType.GPL_2_0,
    status: CompatibilityStatus.CONDITIONALLY_COMPATIBLE,
    severity: CompatibilitySeverity.MEDIUM,
    reason: 'MPL-2.0 explicitly allows GPL linking, but check specific terms',
    resolution: [
      'MPL-2.0 is generally compatible with GPL-2.0',
      'Ensure MPL files remain separate and identifiable',
      'Include MPL license notices'
    ]
  }
];

/**
 * License Compatibility Checker
 */
export class LicenseCompatibilityChecker {
  private config: Required<CompatibilityCheckConfig>;
  private conflicts: CompatibilityConflict[] = [];

  constructor(config: CompatibilityCheckConfig) {
    this.config = {
      findings: config.findings,
      allowWeakCopyleft: config.allowWeakCopyleft ?? true,
      allowStrongCopyleft: config.allowStrongCopyleft ?? false,
      allowProprietary: config.allowProprietary ?? true,
      dynamicLinkingOnly: config.dynamicLinkingOnly ?? false,
      distributionType: config.distributionType ?? 'binary',
      projectLicense: config.projectLicense ?? LicenseType.MIT
    };
  }

  /**
   * Run compatibility check
   */
  async check(): Promise<CompatibilityCheckResult> {
    console.log('🔍 Checking license compatibility...');

    this.conflicts = [];

    // Check pairwise compatibility
    for (let i = 0; i < this.config.findings.length; i++) {
      for (let j = i + 1; j < this.config.findings.length; j++) {
        const finding1 = this.config.findings[i];
        const finding2 = this.config.findings[j];

        const conflict = this.checkPairCompatibility(finding1, finding2);
        if (conflict) {
          this.conflicts.push(conflict);
        }
      }
    }

    // Check against project license
    if (this.config.projectLicense) {
      this.checkProjectLicenseCompatibility();
    }

    // Check policy compliance
    this.checkPolicyCompliance();

    // Generate summary
    const summary = this.generateSummary();

    // Generate recommendations
    const recommendations = this.generateRecommendations();

    // Determine overall status
    const overallStatus = this.determineOverallStatus();
    const canShip = this.canShip();

    return {
      conflicts: this.conflicts,
      summary,
      recommendations,
      overallStatus,
      canShip,
      metadata: {
        checkDate: new Date(),
        checkerVersion: '1.0.0',
        configUsed: this.config
      }
    };
  }

  /**
   * Check compatibility between two licenses
   */
  private checkPairCompatibility(
    finding1: LicenseFinding,
    finding2: LicenseFinding
  ): CompatibilityConflict | null {
    // Skip same package
    if (finding1.packageName === finding2.packageName) {
      return null;
    }

    // Check known incompatibilities (bidirectional)
    const knownConflict = KNOWN_INCOMPATIBILITIES.find(
      rule =>
        (rule.license1 === finding1.license && rule.license2 === finding2.license) ||
        (rule.license1 === finding2.license && rule.license2 === finding1.license)
    );

    if (knownConflict) {
      return {
        id: `${finding1.packageName}-${finding2.packageName}`,
        license1: finding1.license,
        license2: finding2.license,
        package1: finding1.packageName,
        package2: finding2.packageName,
        status: knownConflict.status,
        severity: knownConflict.severity,
        reason: knownConflict.reason,
        explanation: this.getConflictExplanation(finding1, finding2, knownConflict.reason),
        resolution: knownConflict.resolution,
        references: [
          'https://www.gnu.org/licenses/gpl-faq.html',
          'https://opensource.org/licenses/category',
          'https://fossa.com/blog/open-source-software-licenses-101-gpl-compatible-licenses/'
        ]
      };
    }

    // Check category-based compatibility
    return this.checkCategoryCompatibility(finding1, finding2);
  }

  /**
   * Check compatibility based on license categories
   */
  private checkCategoryCompatibility(
    finding1: LicenseFinding,
    finding2: LicenseFinding
  ): CompatibilityConflict | null {
    const cat1 = finding1.category;
    const cat2 = finding2.category;

    // Permissive + Permissive: Always compatible
    if (cat1 === LicenseCategory.PERMISSIVE && cat2 === LicenseCategory.PERMISSIVE) {
      return null;
    }

    // Permissive + Weak Copyleft: Compatible
    if (
      (cat1 === LicenseCategory.PERMISSIVE && cat2 === LicenseCategory.WEAK_COPYLEFT) ||
      (cat1 === LicenseCategory.WEAK_COPYLEFT && cat2 === LicenseCategory.PERMISSIVE)
    ) {
      return null;
    }

    // Weak Copyleft + Weak Copyleft (same license): Compatible
    if (cat1 === LicenseCategory.WEAK_COPYLEFT && cat2 === LicenseCategory.WEAK_COPYLEFT) {
      if (finding1.license === finding2.license) {
        return null; // Same LGPL version
      }
      // Different weak copyleft: conditionally compatible
      return {
        id: `${finding1.packageName}-${finding2.packageName}`,
        license1: finding1.license,
        license2: finding2.license,
        package1: finding1.packageName,
        package2: finding2.packageName,
        status: CompatibilityStatus.CONDITIONALLY_COMPATIBLE,
        severity: CompatibilitySeverity.MEDIUM,
        reason: 'Different weak copyleft licenses - check specific terms',
        explanation: `${finding1.license} and ${finding2.license} may have different requirements`,
        resolution: [
          'Review license texts for specific compatibility',
          'Consult legal counsel',
          'Consider standardizing on one weak copyleft license'
        ],
        references: ['https://www.gnu.org/licenses/license-list.html']
      };
    }

    // Permissive + Strong Copyleft: Risky
    if (
      (cat1 === LicenseCategory.PERMISSIVE && cat2 === LicenseCategory.STRONG_COPYLEFT) ||
      (cat1 === LicenseCategory.STRONG_COPYLEFT && cat2 === LicenseCategory.PERMISSIVE)
    ) {
      const strongCopyleft = cat1 === LicenseCategory.STRONG_COPYLEFT ? finding1 : finding2;
      return {
        id: `${finding1.packageName}-${finding2.packageName}`,
        license1: finding1.license,
        license2: finding2.license,
        package1: finding1.packageName,
        package2: finding2.packageName,
        status: CompatibilityStatus.CONDITIONALLY_COMPATIBLE,
        severity: CompatibilitySeverity.HIGH,
        reason: 'Strong copyleft license may infect entire project',
        explanation: `${strongCopyleft.license} requires entire combined work to be licensed under ${strongCopyleft.license}`,
        resolution: [
          'Replace strong copyleft dependency with permissive alternative',
          'Or license entire project under compatible license',
          'Or separate GPL code via network boundary (microservices)'
        ],
        references: ['https://www.gnu.org/licenses/gpl-faq.html#IfLibraryIsGPL']
      };
    }

    // Strong Copyleft + Strong Copyleft: Check version compatibility
    if (cat1 === LicenseCategory.STRONG_COPYLEFT && cat2 === LicenseCategory.STRONG_COPYLEFT) {
      if (finding1.license === finding2.license) {
        return null; // Same GPL version
      }
      return {
        id: `${finding1.packageName}-${finding2.packageName}`,
        license1: finding1.license,
        license2: finding2.license,
        package1: finding1.packageName,
        package2: finding2.packageName,
        status: CompatibilityStatus.INCOMPATIBLE,
        severity: CompatibilitySeverity.CRITICAL,
        reason: 'Different GPL versions are incompatible',
        explanation: `${finding1.license} and ${finding2.license} have different terms and cannot be combined`,
        resolution: [
          'Use GPL-2.0-or-later to allow GPL-3.0 compatibility',
          'Or replace one dependency with compatible version',
          'Or obtain dual-license from package author'
        ],
        references: ['https://www.gnu.org/licenses/gpl-faq.html#AllCompatibility']
      };
    }

    // Anything + Unknown: Unknown compatibility
    if (cat1 === LicenseCategory.UNKNOWN || cat2 === LicenseCategory.UNKNOWN) {
      const unknown = cat1 === LicenseCategory.UNKNOWN ? finding1 : finding2;
      return {
        id: `${finding1.packageName}-${finding2.packageName}`,
        license1: finding1.license,
        license2: finding2.license,
        package1: finding1.packageName,
        package2: finding2.packageName,
        status: CompatibilityStatus.UNKNOWN,
        severity: CompatibilitySeverity.HIGH,
        reason: 'Unknown license - cannot determine compatibility',
        explanation: `${unknown.packageName} has unknown license - legal risk`,
        resolution: [
          'Contact package author for license clarification',
          'Replace with package with clear license',
          'Obtain legal review'
        ],
        references: ['https://choosealicense.com/no-permission/']
      };
    }

    // Anything + Proprietary: Check commercial terms
    if (cat1 === LicenseCategory.PROPRIETARY || cat2 === LicenseCategory.PROPRIETARY) {
      const proprietary = cat1 === LicenseCategory.PROPRIETARY ? finding1 : finding2;
      return {
        id: `${finding1.packageName}-${finding2.packageName}`,
        license1: finding1.license,
        license2: finding2.license,
        package1: finding1.packageName,
        package2: finding2.packageName,
        status: CompatibilityStatus.UNKNOWN,
        severity: CompatibilitySeverity.HIGH,
        reason: 'Proprietary license - check commercial terms',
        explanation: `${proprietary.packageName} is proprietary - verify license agreement allows distribution`,
        resolution: [
          'Review commercial license agreement',
          'Verify redistribution rights',
          'Contact vendor for clarification'
        ],
        references: ['Commercial license documentation']
      };
    }

    return null;
  }

  /**
   * Check compatibility with project license
   */
  private checkProjectLicenseCompatibility(): void {
    for (const finding of this.config.findings) {
      // Skip if same as project license
      if (finding.license === this.config.projectLicense) {
        continue;
      }

      // Check if dependency license is compatible with project license
      const isCompatible = this.isCompatibleWithProjectLicense(finding);
      
      if (!isCompatible) {
        this.conflicts.push({
          id: `project-${finding.packageName}`,
          license1: this.config.projectLicense!,
          license2: finding.license,
          package1: 'Your Project',
          package2: finding.packageName,
          status: CompatibilityStatus.INCOMPATIBLE,
          severity: CompatibilitySeverity.CRITICAL,
          reason: `${finding.license} dependency incompatible with project license ${this.config.projectLicense}`,
          explanation: this.getProjectLicenseConflictExplanation(finding),
          resolution: [
            `Replace ${finding.packageName} with ${this.config.projectLicense}-compatible alternative`,
            `Or change project license to accommodate ${finding.license}`,
            'Or obtain dual-license from dependency author'
          ],
          references: ['https://choosealicense.com/appendix/']
        });
      }
    }
  }

  /**
   * Check if license is compatible with project license
   */
  private isCompatibleWithProjectLicense(finding: LicenseFinding): boolean {
    const projectLicense = this.config.projectLicense!;

    // Permissive project license: Most dependencies are OK
    if ([LicenseType.MIT, LicenseType.APACHE_2_0, LicenseType.BSD_3_CLAUSE].includes(projectLicense)) {
      // Strong copyleft would infect the project
      if (finding.category === LicenseCategory.STRONG_COPYLEFT) {
        return false;
      }
      return true;
    }

    // GPL project license: Must be GPL-compatible
    if (projectLicense === LicenseType.GPL_2_0) {
      // Apache-2.0 is incompatible with GPL-2.0
      if (finding.license === LicenseType.APACHE_2_0) {
        return false;
      }
      // GPL-3.0 is incompatible with GPL-2.0
      if (finding.license === LicenseType.GPL_3_0) {
        return false;
      }
      return true;
    }

    if (projectLicense === LicenseType.GPL_3_0) {
      // GPL-2.0-only is incompatible with GPL-3.0
      if (finding.license === LicenseType.GPL_2_0) {
        return false;
      }
      return true;
    }

    // Unknown compatibility
    return true;
  }

  /**
   * Check policy compliance (strong copyleft, proprietary, etc.)
   */
  private checkPolicyCompliance(): void {
    for (const finding of this.config.findings) {
      // Check strong copyleft policy
      if (!this.config.allowStrongCopyleft && finding.category === LicenseCategory.STRONG_COPYLEFT) {
        this.conflicts.push({
          id: `policy-${finding.packageName}`,
          license1: finding.license,
          license2: LicenseType.UNKNOWN,
          package1: finding.packageName,
          package2: 'Policy',
          status: CompatibilityStatus.INCOMPATIBLE,
          severity: CompatibilitySeverity.CRITICAL,
          reason: 'Strong copyleft licenses not allowed by policy',
          explanation: `${finding.packageName} uses ${finding.license} which is prohibited`,
          resolution: [
            'Replace with permissive license alternative',
            'Or update company policy',
            'Or obtain exception approval'
          ],
          references: ['Company open source policy']
        });
      }

      // Check weak copyleft policy
      if (!this.config.allowWeakCopyleft && finding.category === LicenseCategory.WEAK_COPYLEFT) {
        // Exception: If dynamic linking only, LGPL is OK
        if (this.config.dynamicLinkingOnly && finding.linking === 'dynamic') {
          continue;
        }

        this.conflicts.push({
          id: `policy-${finding.packageName}`,
          license1: finding.license,
          license2: LicenseType.UNKNOWN,
          package1: finding.packageName,
          package2: 'Policy',
          status: CompatibilityStatus.INCOMPATIBLE,
          severity: CompatibilitySeverity.HIGH,
          reason: 'Weak copyleft licenses not allowed by policy',
          explanation: `${finding.packageName} uses ${finding.license} which requires specific conditions`,
          resolution: [
            'Replace with permissive license alternative',
            'Or ensure dynamic linking only',
            'Or update policy'
          ],
          references: ['Company open source policy']
        });
      }

      // Check proprietary policy
      if (!this.config.allowProprietary && finding.license === LicenseType.PROPRIETARY) {
        this.conflicts.push({
          id: `policy-${finding.packageName}`,
          license1: finding.license,
          license2: LicenseType.UNKNOWN,
          package1: finding.packageName,
          package2: 'Policy',
          status: CompatibilityStatus.INCOMPATIBLE,
          severity: CompatibilitySeverity.CRITICAL,
          reason: 'Proprietary licenses not allowed by policy',
          explanation: `${finding.packageName} is proprietary - verify license agreement`,
          resolution: [
            'Replace with open source alternative',
            'Or obtain commercial license approval',
            'Or update policy'
          ],
          references: ['Company procurement policy']
        });
      }
    }
  }

  /**
   * Get conflict explanation
   */
  private getConflictExplanation(
    finding1: LicenseFinding,
    finding2: LicenseFinding,
    reason: string
  ): string {
    return `${finding1.packageName} (${finding1.license}) and ${finding2.packageName} (${finding2.license}): ${reason}`;
  }

  /**
   * Get project license conflict explanation
   */
  private getProjectLicenseConflictExplanation(finding: LicenseFinding): string {
    const projectLicense = this.config.projectLicense!;

    if (finding.category === LicenseCategory.STRONG_COPYLEFT) {
      return `${finding.license} requires entire project to be ${finding.license}, but project is ${projectLicense}`;
    }

    if (finding.license === LicenseType.APACHE_2_0 && projectLicense === LicenseType.GPL_2_0) {
      return 'Apache-2.0 patent clause is incompatible with GPL-2.0';
    }

    return `${finding.license} is incompatible with project license ${projectLicense}`;
  }

  /**
   * Generate summary statistics
   */
  private generateSummary(): CompatibilityCheckResult['summary'] {
    const bySeverity: Record<CompatibilitySeverity, number> = {
      [CompatibilitySeverity.CRITICAL]: 0,
      [CompatibilitySeverity.HIGH]: 0,
      [CompatibilitySeverity.MEDIUM]: 0,
      [CompatibilitySeverity.LOW]: 0,
      [CompatibilitySeverity.INFO]: 0
    };

    const byStatus: Record<CompatibilityStatus, number> = {
      [CompatibilityStatus.COMPATIBLE]: 0,
      [CompatibilityStatus.CONDITIONALLY_COMPATIBLE]: 0,
      [CompatibilityStatus.INCOMPATIBLE]: 0,
      [CompatibilityStatus.UNKNOWN]: 0
    };

    let criticalCount = 0;
    let compatibleCount = 0;
    let incompatibleCount = 0;

    for (const conflict of this.conflicts) {
      bySeverity[conflict.severity]++;
      byStatus[conflict.status]++;

      if (conflict.severity === CompatibilitySeverity.CRITICAL) {
        criticalCount++;
      }
      if (conflict.status === CompatibilityStatus.COMPATIBLE) {
        compatibleCount++;
      }
      if (conflict.status === CompatibilityStatus.INCOMPATIBLE) {
        incompatibleCount++;
      }
    }

    return {
      total: this.conflicts.length,
      bySeverity,
      byStatus,
      criticalCount,
      compatibleCount,
      incompatibleCount
    };
  }

  /**
   * Generate recommendations
   */
  private generateRecommendations(): string[] {
    const recommendations: string[] = [];

    const critical = this.conflicts.filter(c => c.severity === CompatibilitySeverity.CRITICAL);
    if (critical.length > 0) {
      recommendations.push(
        `🚨 ${critical.length} critical license conflicts - cannot ship without resolution`
      );
    }

    const high = this.conflicts.filter(c => c.severity === CompatibilitySeverity.HIGH);
    if (high.length > 0) {
      recommendations.push(
        `⚠️  ${high.length} high-severity conflicts - requires legal review`
      );
    }

    const strongCopyleft = this.config.findings.filter(
      f => f.category === LicenseCategory.STRONG_COPYLEFT
    );
    if (strongCopyleft.length > 0) {
      recommendations.push(
        `🔴 ${strongCopyleft.length} strong copyleft licenses (GPL/AGPL) - consider alternatives`
      );
    }

    if (this.conflicts.length === 0) {
      recommendations.push('✅ No license conflicts detected');
    } else {
      recommendations.push('📋 Document license obligations in THIRD_PARTY_LICENSES.md');
      recommendations.push('⚖️  Consult legal counsel before shipping');
    }

    return recommendations;
  }

  /**
   * Determine overall compatibility status
   */
  private determineOverallStatus(): CompatibilityStatus {
    if (this.conflicts.length === 0) {
      return CompatibilityStatus.COMPATIBLE;
    }

    const hasIncompatible = this.conflicts.some(
      c => c.status === CompatibilityStatus.INCOMPATIBLE
    );
    if (hasIncompatible) {
      return CompatibilityStatus.INCOMPATIBLE;
    }

    const hasUnknown = this.conflicts.some(
      c => c.status === CompatibilityStatus.UNKNOWN
    );
    if (hasUnknown) {
      return CompatibilityStatus.UNKNOWN;
    }

    return CompatibilityStatus.CONDITIONALLY_COMPATIBLE;
  }

  /**
   * Check if project can be shipped
   */
  private canShip(): boolean {
    // Cannot ship if there are critical conflicts
    const hasCritical = this.conflicts.some(
      c => c.severity === CompatibilitySeverity.CRITICAL
    );
    if (hasCritical) {
      return false;
    }

    // Cannot ship if incompatible
    const hasIncompatible = this.conflicts.some(
      c => c.status === CompatibilityStatus.INCOMPATIBLE
    );
    if (hasIncompatible) {
      return false;
    }

    return true;
  }

  /**
   * Export conflicts to JSON
   */
  exportToJSON(): string {
    return JSON.stringify({
      conflicts: this.conflicts,
      summary: this.generateSummary(),
      recommendations: this.generateRecommendations(),
      overallStatus: this.determineOverallStatus(),
      canShip: this.canShip(),
      metadata: {
        checkDate: new Date().toISOString(),
        checkerVersion: '1.0.0'
      }
    }, null, 2);
  }
}

/**
 * Convenience function to check license compatibility
 */
export async function checkLicenseCompatibility(
  config: CompatibilityCheckConfig
): Promise<CompatibilityCheckResult> {
  const checker = new LicenseCompatibilityChecker(config);
  return checker.check();
}

/**
 * Quick compatibility check for CI/CD
 */
export async function quickCompatibilityCheck(
  findings: LicenseFinding[]
): Promise<{ canShip: boolean; conflicts: number }> {
  const checker = new LicenseCompatibilityChecker({ findings });
  const result = await checker.check();

  return {
    canShip: result.canShip,
    conflicts: result.summary.incompatibleCount
  };
}
