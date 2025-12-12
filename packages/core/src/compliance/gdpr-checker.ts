/**
 * GDPR Checker - Detect GDPR compliance issues in code
 * 
 * Purpose: Verify GDPR (General Data Protection Regulation) compliance
 * Week 28: Compliance Checks (File 1/3)
 * 
 * GDPR Requirements Checked:
 * - Article 6: Lawful basis for processing (consent tracking)
 * - Article 7: Conditions for consent (explicit consent mechanisms)
 * - Article 13-14: Information to data subjects (privacy notices)
 * - Article 15: Right to access (data export APIs)
 * - Article 16: Right to rectification (data update mechanisms)
 * - Article 17: Right to erasure ("right to be forgotten")
 * - Article 18: Right to restriction of processing
 * - Article 20: Right to data portability (data export formats)
 * - Article 25: Data protection by design and default
 * - Article 32: Security of processing (encryption, pseudonymization)
 * - Article 33-34: Breach notification (logging, alerts)
 * - Article 44-50: International data transfers (safeguards)
 * 
 * @module @odavl-studio/core/compliance/gdpr-checker
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import { glob } from 'glob';

/**
 * GDPR compliance severity
 */
export enum GDPRSeverity {
  CRITICAL = 'critical', // Immediate action required (potential fine up to €20M)
  HIGH = 'high',         // High risk (potential fine up to €10M)
  MEDIUM = 'medium',     // Moderate risk
  LOW = 'low'            // Best practice recommendation
}

/**
 * GDPR article references
 */
export enum GDPRArticle {
  ART_6_LAWFUL_BASIS = 'Article 6: Lawful Basis',
  ART_7_CONSENT = 'Article 7: Consent Conditions',
  ART_13_14_TRANSPARENCY = 'Article 13-14: Transparency',
  ART_15_ACCESS = 'Article 15: Right to Access',
  ART_16_RECTIFICATION = 'Article 16: Right to Rectification',
  ART_17_ERASURE = 'Article 17: Right to Erasure',
  ART_18_RESTRICTION = 'Article 18: Restriction of Processing',
  ART_20_PORTABILITY = 'Article 20: Data Portability',
  ART_25_PRIVACY_BY_DESIGN = 'Article 25: Privacy by Design',
  ART_32_SECURITY = 'Article 32: Security of Processing',
  ART_33_34_BREACH = 'Article 33-34: Breach Notification',
  ART_44_50_TRANSFERS = 'Article 44-50: International Transfers'
}

/**
 * GDPR compliance finding
 */
export interface GDPRFinding {
  id: string;
  title: string;
  description: string;
  severity: GDPRSeverity;
  article: GDPRArticle;
  file: string;
  line?: number;
  code?: string;
  recommendation: string;
  estimatedFine?: string; // Potential fine range
  remediation: string[];  // Step-by-step fix
  references: string[];
}

/**
 * GDPR checker configuration
 */
export interface GDPRCheckerConfig {
  rootPath: string;
  includePatterns?: string[];
  excludePatterns?: string[];
  checkDatabaseSchemas?: boolean;
  checkAPIRoutes?: boolean;
  checkConsentMechanisms?: boolean;
  checkDataRetention?: boolean;
  checkEncryption?: boolean;
  customChecks?: GDPRCustomCheck[];
}

/**
 * Custom GDPR compliance check
 */
export interface GDPRCustomCheck {
  name: string;
  article: GDPRArticle;
  severity: GDPRSeverity;
  pattern: RegExp;
  description: string;
  recommendation: string;
}

/**
 * GDPR compliance scan result
 */
export interface GDPRScanResult {
  findings: GDPRFinding[];
  summary: {
    total: number;
    bySeverity: Record<GDPRSeverity, number>;
    byArticle: Record<GDPRArticle, number>;
    filesScanned: number;
    duration: number;
    complianceScore: number; // 0-100
  };
  recommendations: {
    immediate: string[];    // CRITICAL actions
    shortTerm: string[];    // HIGH priority (1-4 weeks)
    longTerm: string[];     // MEDIUM/LOW (1-6 months)
  };
  metadata: {
    scanDate: Date;
    checkerVersion: string;
    configUsed: Partial<GDPRCheckerConfig>;
  };
}

/**
 * Built-in GDPR compliance patterns
 */
const GDPR_PATTERNS = {
  // Article 6: Lawful basis
  missingLawfulBasis: {
    article: GDPRArticle.ART_6_LAWFUL_BASIS,
    severity: GDPRSeverity.CRITICAL,
    patterns: [
      /(?:user|customer|person|profile).*(?:create|insert|save|store).*(?:email|name|phone|address)/gi,
      /(?:collect|gather|obtain).*(?:personal|user).*data/gi
    ],
    description: 'Personal data collection without documented lawful basis',
    recommendation: 'Document lawful basis (consent, contract, legal obligation, etc.) in code comments and privacy policy.',
    estimatedFine: '€10M - €20M or 2-4% of annual global turnover'
  },

  // Article 7: Consent
  implicitConsent: {
    article: GDPRArticle.ART_7_CONSENT,
    severity: GDPRSeverity.HIGH,
    patterns: [
      /consent\s*[=:]\s*true/gi,
      /(?:assumed|implicit|default).*consent/gi,
      /opt[_-]?out/gi // Opt-out instead of opt-in
    ],
    description: 'Implicit or assumed consent (GDPR requires explicit opt-in)',
    recommendation: 'Implement explicit consent with checkboxes. Pre-checked boxes are not compliant.',
    estimatedFine: '€10M or 2% of annual global turnover'
  },

  // Article 13-14: Transparency
  missingPrivacyNotice: {
    article: GDPRArticle.ART_13_14_TRANSPARENCY,
    severity: GDPRSeverity.HIGH,
    patterns: [
      /(?:signup|register|create[_-]?account).*(?!privacy.*notice)/gi
    ],
    description: 'Data collection without privacy notice',
    recommendation: 'Display privacy notice before collecting data. Include: purpose, lawful basis, retention period, rights.',
    estimatedFine: '€10M or 2% of annual global turnover'
  },

  // Article 15: Right to access
  missingDataExport: {
    article: GDPRArticle.ART_15_ACCESS,
    severity: GDPRSeverity.HIGH,
    patterns: [
      /user.*(?:model|schema|table).*(?!export|download)/gi
    ],
    description: 'No data export functionality (Right to Access)',
    recommendation: 'Implement API endpoint for users to download their data in machine-readable format (JSON, CSV).',
    estimatedFine: '€10M or 2% of annual global turnover'
  },

  // Article 17: Right to erasure
  missingDeletion: {
    article: GDPRArticle.ART_17_ERASURE,
    severity: GDPRSeverity.CRITICAL,
    patterns: [
      /user.*(?:model|schema|table).*(?!delete|remove|erase)/gi,
      /soft[_-]?delete/gi // Soft delete may not be compliant
    ],
    description: 'No complete data deletion (Right to Erasure / "Right to be Forgotten")',
    recommendation: 'Implement hard delete functionality. Soft deletes must be justified (e.g., legal requirement).',
    estimatedFine: '€20M or 4% of annual global turnover'
  },

  // Article 20: Data portability
  missingDataPortability: {
    article: GDPRArticle.ART_20_PORTABILITY,
    severity: GDPRSeverity.MEDIUM,
    patterns: [
      /export.*(?:user|customer|profile).*(?!json|csv|xml)/gi
    ],
    description: 'Data export not in structured, machine-readable format',
    recommendation: 'Provide data in JSON, CSV, or XML format. Include all user data.',
    estimatedFine: '€10M or 2% of annual global turnover'
  },

  // Article 25: Privacy by design
  noPrivacyByDesign: {
    article: GDPRArticle.ART_25_PRIVACY_BY_DESIGN,
    severity: GDPRSeverity.MEDIUM,
    patterns: [
      /(?:data.*collection|user.*tracking).*(?!privacy|consent)/gi,
      /(?:all|full).*(?:user|customer).*data/gi // Collecting more than necessary
    ],
    description: 'Collecting unnecessary personal data (violates data minimization)',
    recommendation: 'Only collect data that is necessary. Implement privacy by default (opt-in, not opt-out).',
    estimatedFine: '€10M or 2% of annual global turnover'
  },

  // Article 32: Security
  unencryptedPersonalData: {
    article: GDPRArticle.ART_32_SECURITY,
    severity: GDPRSeverity.CRITICAL,
    patterns: [
      /(?:email|phone|ssn|passport|credit[_-]?card).*(?:varchar|text|string).*(?!encrypt)/gi,
      /store.*password.*(?!hash|bcrypt|argon)/gi,
      /(?:http|ftp):\/\/.*(?:user|customer|personal)/gi // Unencrypted transmission
    ],
    description: 'Personal data not encrypted at rest or in transit',
    recommendation: 'Encrypt sensitive data (AES-256). Use bcrypt/Argon2 for passwords. Use HTTPS for all transmissions.',
    estimatedFine: '€10M or 2% of annual global turnover'
  },

  // Article 33: Breach notification
  missingBreachLogging: {
    article: GDPRArticle.ART_33_34_BREACH,
    severity: GDPRSeverity.HIGH,
    patterns: [
      /(?:login|auth|access).*(?!log|audit)/gi,
      /(?:data|user).*breach.*(?!notify|alert|log)/gi
    ],
    description: 'Insufficient breach detection and logging',
    recommendation: 'Implement comprehensive logging. Must notify DPA within 72 hours of breach detection.',
    estimatedFine: '€10M or 2% of annual global turnover'
  },

  // Article 44-50: International transfers
  unsafeDataTransfer: {
    article: GDPRArticle.ART_44_50_TRANSFERS,
    severity: GDPRSeverity.HIGH,
    patterns: [
      /(?:send|transfer|export).*(?:user|customer|personal).*(?:china|russia|us)/gi,
      /(?:s3|storage|bucket).*(?:us-|cn-|ru-)/gi // Non-EEA regions
    ],
    description: 'Personal data transferred to countries without adequate safeguards',
    recommendation: 'Use Standard Contractual Clauses (SCCs) or ensure adequacy decision. Document transfers.',
    estimatedFine: '€20M or 4% of annual global turnover'
  }
};

/**
 * Database schema patterns to check
 */
const DATABASE_SCHEMA_PATTERNS = {
  // Personal data without encryption
  unencryptedPII: {
    article: GDPRArticle.ART_32_SECURITY,
    severity: GDPRSeverity.CRITICAL,
    patterns: [
      /(?:email|phone|ssn|passport|national[_-]?id|credit[_-]?card|address).*(?:varchar|text|string)/gi
    ],
    description: 'Personal data stored without encryption declaration',
    recommendation: 'Use encrypted columns or encrypt before storage. Document encryption method.'
  },

  // Missing retention period
  noRetentionPolicy: {
    article: GDPRArticle.ART_25_PRIVACY_BY_DESIGN,
    severity: GDPRSeverity.MEDIUM,
    patterns: [
      /(?:user|customer|profile).*table.*(?!retention|expiry|delete[_-]?after)/gi
    ],
    description: 'No data retention policy defined',
    recommendation: 'Define retention periods. Implement automatic deletion after retention expires.'
  }
};

/**
 * GDPR Checker - Verify GDPR compliance in code
 */
export class GDPRChecker {
  private config: Required<GDPRCheckerConfig>;
  private findings: GDPRFinding[] = [];

  constructor(config: GDPRCheckerConfig) {
    this.config = {
      rootPath: config.rootPath,
      includePatterns: config.includePatterns ?? ['**/*.{ts,js,py,java,cs,sql,prisma}'],
      excludePatterns: config.excludePatterns ?? ['**/node_modules/**', '**/dist/**', '**/build/**'],
      checkDatabaseSchemas: config.checkDatabaseSchemas ?? true,
      checkAPIRoutes: config.checkAPIRoutes ?? true,
      checkConsentMechanisms: config.checkConsentMechanisms ?? true,
      checkDataRetention: config.checkDataRetention ?? true,
      checkEncryption: config.checkEncryption ?? true,
      customChecks: config.customChecks ?? []
    };
  }

  /**
   * Run GDPR compliance scan
   */
  async scan(): Promise<GDPRScanResult> {
    const startTime = Date.now();
    this.findings = [];

    console.log('🇪🇺 Scanning for GDPR compliance issues...');

    // Find all files to scan
    const files = await this.findFiles();
    console.log(`📂 Scanning ${files.length} files...`);

    // Scan each file
    let filesScanned = 0;
    for (const file of files) {
      try {
        await this.scanFile(file);
        filesScanned++;
      } catch (error) {
        console.warn(`⚠️  Failed to scan ${file}:`, error instanceof Error ? error.message : error);
      }
    }

    // Generate summary
    const duration = Date.now() - startTime;
    const summary = this.generateSummary(filesScanned, duration);

    // Generate recommendations
    const recommendations = this.generateRecommendations();

    return {
      findings: this.findings,
      summary,
      recommendations,
      metadata: {
        scanDate: new Date(),
        checkerVersion: '1.0.0',
        configUsed: this.config
      }
    };
  }

  /**
   * Find all files matching the include/exclude patterns
   */
  private async findFiles(): Promise<string[]> {
    const allFiles: string[] = [];

    for (const pattern of this.config.includePatterns) {
      const files = await glob(pattern, {
        cwd: this.config.rootPath,
        ignore: this.config.excludePatterns,
        absolute: true,
        nodir: true
      });
      allFiles.push(...files);
    }

    return [...new Set(allFiles)];
  }

  /**
   * Scan a single file for GDPR issues
   */
  private async scanFile(filePath: string): Promise<void> {
    const content = await fs.readFile(filePath, 'utf-8');
    const lines = content.split('\n');
    const fileType = this.detectFileType(filePath);

    // Scan with built-in patterns
    for (const [checkName, check] of Object.entries(GDPR_PATTERNS)) {
      for (const pattern of Array.isArray(check.patterns) ? check.patterns : [check.patterns]) {
        const matches = Array.from(content.matchAll(pattern));
        for (const match of matches) {
          const finding = this.createFinding(
            checkName,
            check,
            filePath,
            content,
            match
          );
          this.findings.push(finding);
        }
      }
    }

    // Database schema specific checks
    if (fileType === 'schema' && this.config.checkDatabaseSchemas) {
      for (const [checkName, check] of Object.entries(DATABASE_SCHEMA_PATTERNS)) {
        for (const pattern of Array.isArray(check.patterns) ? check.patterns : [check.patterns]) {
          const matches = Array.from(content.matchAll(pattern));
          for (const match of matches) {
            const finding = this.createFinding(
              checkName,
              check as any,
              filePath,
              content,
              match
            );
            this.findings.push(finding);
          }
        }
      }
    }

    // Custom checks
    for (const customCheck of this.config.customChecks) {
      const matches = Array.from(content.matchAll(customCheck.pattern));
      for (const match of matches) {
        const finding: GDPRFinding = {
          id: `custom-${customCheck.name}-${this.findings.length}`,
          title: customCheck.name,
          description: customCheck.description,
          severity: customCheck.severity,
          article: customCheck.article,
          file: path.relative(this.config.rootPath, filePath),
          line: this.getLineNumber(content, match.index!),
          code: match[0],
          recommendation: customCheck.recommendation,
          estimatedFine: this.getEstimatedFine(customCheck.severity),
          remediation: [customCheck.recommendation],
          references: [
            'https://gdpr.eu/',
            'https://ico.org.uk/for-organisations/guide-to-data-protection/'
          ]
        };
        this.findings.push(finding);
      }
    }
  }

  /**
   * Create a finding from a pattern match
   */
  private createFinding(
    checkName: string,
    check: typeof GDPR_PATTERNS.missingLawfulBasis,
    filePath: string,
    content: string,
    match: RegExpMatchArray
  ): GDPRFinding {
    const lineNumber = this.getLineNumber(content, match.index!);

    return {
      id: `${checkName}-${this.findings.length}`,
      title: check.description,
      description: `${check.description} (${check.article})`,
      severity: check.severity,
      article: check.article,
      file: path.relative(this.config.rootPath, filePath),
      line: lineNumber,
      code: match[0],
      recommendation: check.recommendation,
      estimatedFine: check.estimatedFine,
      remediation: this.getRemediationSteps(check.article),
      references: [
        `https://gdpr.eu/article-${this.getArticleNumber(check.article)}/`,
        'https://ico.org.uk/for-organisations/guide-to-data-protection/'
      ]
    };
  }

  /**
   * Get line number from string index
   */
  private getLineNumber(content: string, index: number): number {
    return content.substring(0, index).split('\n').length;
  }

  /**
   * Detect file type
   */
  private detectFileType(filePath: string): string {
    const ext = path.extname(filePath).toLowerCase();
    if (['.sql', '.prisma'].includes(ext)) return 'schema';
    if (['.ts', '.js', '.py', '.java', '.cs'].includes(ext)) return 'code';
    return 'unknown';
  }

  /**
   * Get estimated fine range
   */
  private getEstimatedFine(severity: GDPRSeverity): string {
    const fines: Record<GDPRSeverity, string> = {
      [GDPRSeverity.CRITICAL]: '€20M or 4% of annual global turnover (whichever is higher)',
      [GDPRSeverity.HIGH]: '€10M or 2% of annual global turnover (whichever is higher)',
      [GDPRSeverity.MEDIUM]: 'Warning or reprimand (first offense)',
      [GDPRSeverity.LOW]: 'No fine (best practice recommendation)'
    };
    return fines[severity];
  }

  /**
   * Get article number from enum
   */
  private getArticleNumber(article: GDPRArticle): string {
    const mapping: Record<GDPRArticle, string> = {
      [GDPRArticle.ART_6_LAWFUL_BASIS]: '6',
      [GDPRArticle.ART_7_CONSENT]: '7',
      [GDPRArticle.ART_13_14_TRANSPARENCY]: '13',
      [GDPRArticle.ART_15_ACCESS]: '15',
      [GDPRArticle.ART_16_RECTIFICATION]: '16',
      [GDPRArticle.ART_17_ERASURE]: '17',
      [GDPRArticle.ART_18_RESTRICTION]: '18',
      [GDPRArticle.ART_20_PORTABILITY]: '20',
      [GDPRArticle.ART_25_PRIVACY_BY_DESIGN]: '25',
      [GDPRArticle.ART_32_SECURITY]: '32',
      [GDPRArticle.ART_33_34_BREACH]: '33',
      [GDPRArticle.ART_44_50_TRANSFERS]: '44'
    };
    return mapping[article];
  }

  /**
   * Get remediation steps for an article
   */
  private getRemediationSteps(article: GDPRArticle): string[] {
    const steps: Record<GDPRArticle, string[]> = {
      [GDPRArticle.ART_6_LAWFUL_BASIS]: [
        'Document lawful basis for processing in privacy policy',
        'Add code comments explaining lawful basis',
        'Consider: consent, contract, legal obligation, vital interests, public task, or legitimate interests'
      ],
      [GDPRArticle.ART_7_CONSENT]: [
        'Implement explicit opt-in (not opt-out)',
        'Use unchecked checkboxes',
        'Store consent timestamp and version',
        'Allow consent withdrawal'
      ],
      [GDPRArticle.ART_13_14_TRANSPARENCY]: [
        'Display privacy notice before data collection',
        'Include: controller identity, purpose, lawful basis, retention, rights',
        'Use clear, plain language'
      ],
      [GDPRArticle.ART_15_ACCESS]: [
        'Create API endpoint: GET /users/{id}/data',
        'Return all user data in JSON/CSV format',
        'Include: purposes, categories, recipients, retention',
        'Respond within 1 month'
      ],
      [GDPRArticle.ART_16_RECTIFICATION]: [
        'Implement update/edit functionality',
        'Allow users to correct inaccuracies',
        'Update data across all systems'
      ],
      [GDPRArticle.ART_17_ERASURE]: [
        'Create DELETE /users/{id} endpoint',
        'Implement hard delete (not soft delete)',
        'Delete from all systems and backups',
        'Exceptions: legal requirements, freedom of expression'
      ],
      [GDPRArticle.ART_18_RESTRICTION]: [
        'Implement "pause processing" flag',
        'Stop all processing except storage',
        'Notify user before resuming'
      ],
      [GDPRArticle.ART_20_PORTABILITY]: [
        'Provide data in structured, machine-readable format',
        'Support JSON, CSV, or XML',
        'Allow direct transfer to another controller'
      ],
      [GDPRArticle.ART_25_PRIVACY_BY_DESIGN]: [
        'Data minimization: only collect necessary data',
        'Privacy by default: opt-in, not opt-out',
        'Pseudonymization where possible',
        'Regular privacy impact assessments'
      ],
      [GDPRArticle.ART_32_SECURITY]: [
        'Encrypt personal data at rest (AES-256)',
        'Encrypt data in transit (TLS 1.3)',
        'Hash passwords (bcrypt, Argon2)',
        'Implement access controls and logging'
      ],
      [GDPRArticle.ART_33_34_BREACH]: [
        'Implement breach detection systems',
        'Create incident response plan',
        'Notify DPA within 72 hours',
        'Notify affected users if high risk'
      ],
      [GDPRArticle.ART_44_50_TRANSFERS]: [
        'Use Standard Contractual Clauses (SCCs)',
        'Check adequacy decisions',
        'Document all transfers',
        'Implement additional safeguards'
      ]
    };
    return steps[article] ?? ['See GDPR guidance for remediation'];
  }

  /**
   * Generate summary statistics
   */
  private generateSummary(filesScanned: number, duration: number): GDPRScanResult['summary'] {
    const bySeverity: Record<GDPRSeverity, number> = {
      [GDPRSeverity.CRITICAL]: 0,
      [GDPRSeverity.HIGH]: 0,
      [GDPRSeverity.MEDIUM]: 0,
      [GDPRSeverity.LOW]: 0
    };

    const byArticle: Record<GDPRArticle, number> = {
      [GDPRArticle.ART_6_LAWFUL_BASIS]: 0,
      [GDPRArticle.ART_7_CONSENT]: 0,
      [GDPRArticle.ART_13_14_TRANSPARENCY]: 0,
      [GDPRArticle.ART_15_ACCESS]: 0,
      [GDPRArticle.ART_16_RECTIFICATION]: 0,
      [GDPRArticle.ART_17_ERASURE]: 0,
      [GDPRArticle.ART_18_RESTRICTION]: 0,
      [GDPRArticle.ART_20_PORTABILITY]: 0,
      [GDPRArticle.ART_25_PRIVACY_BY_DESIGN]: 0,
      [GDPRArticle.ART_32_SECURITY]: 0,
      [GDPRArticle.ART_33_34_BREACH]: 0,
      [GDPRArticle.ART_44_50_TRANSFERS]: 0
    };

    for (const finding of this.findings) {
      bySeverity[finding.severity]++;
      byArticle[finding.article]++;
    }

    // Calculate compliance score (100 - weighted by severity)
    const weights = {
      [GDPRSeverity.CRITICAL]: 10,
      [GDPRSeverity.HIGH]: 5,
      [GDPRSeverity.MEDIUM]: 2,
      [GDPRSeverity.LOW]: 1
    };
    const totalPenalty = this.findings.reduce((sum, f) => sum + weights[f.severity], 0);
    const complianceScore = Math.max(0, 100 - totalPenalty);

    return {
      total: this.findings.length,
      bySeverity,
      byArticle,
      filesScanned,
      duration,
      complianceScore
    };
  }

  /**
   * Generate prioritized recommendations
   */
  private generateRecommendations(): GDPRScanResult['recommendations'] {
    const immediate = this.findings
      .filter(f => f.severity === GDPRSeverity.CRITICAL)
      .map(f => `${f.title}: ${f.recommendation}`);

    const shortTerm = this.findings
      .filter(f => f.severity === GDPRSeverity.HIGH)
      .map(f => `${f.title}: ${f.recommendation}`);

    const longTerm = this.findings
      .filter(f => f.severity === GDPRSeverity.MEDIUM || f.severity === GDPRSeverity.LOW)
      .map(f => `${f.title}: ${f.recommendation}`);

    return {
      immediate: [...new Set(immediate)],
      shortTerm: [...new Set(shortTerm)],
      longTerm: [...new Set(longTerm)]
    };
  }

  /**
   * Export findings to JSON
   */
  exportToJSON(): string {
    return JSON.stringify({
      findings: this.findings,
      summary: this.generateSummary(0, 0),
      recommendations: this.generateRecommendations(),
      metadata: {
        scanDate: new Date().toISOString(),
        checkerVersion: '1.0.0'
      }
    }, null, 2);
  }
}

/**
 * Convenience function to run GDPR scan
 */
export async function runGDPRScan(config: GDPRCheckerConfig): Promise<GDPRScanResult> {
  const checker = new GDPRChecker(config);
  return checker.scan();
}

/**
 * Quick GDPR check for CI/CD
 */
export async function quickGDPRCheck(rootPath: string): Promise<{ hasCritical: boolean; score: number }> {
  const checker = new GDPRChecker({ rootPath });
  const result = await checker.scan();
  
  return {
    hasCritical: result.summary.bySeverity[GDPRSeverity.CRITICAL] > 0,
    score: result.summary.complianceScore
  };
}
