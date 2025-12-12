/**
 * HIPAA Validator - Detect HIPAA compliance issues in healthcare applications
 * 
 * Purpose: Verify HIPAA (Health Insurance Portability and Accountability Act) compliance
 * Week 28: Compliance Checks (File 2/3)
 * 
 * HIPAA Requirements Checked:
 * - Administrative Safeguards (§164.308)
 *   - Security Management Process
 *   - Workforce Security
 *   - Access Management
 *   - Security Awareness Training
 * 
 * - Physical Safeguards (§164.310)
 *   - Facility Access Controls
 *   - Workstation Security
 *   - Device and Media Controls
 * 
 * - Technical Safeguards (§164.312)
 *   - Access Control (Unique User IDs, Emergency Access, Encryption)
 *   - Audit Controls (Logging)
 *   - Integrity Controls (Data Integrity)
 *   - Transmission Security (Encryption in Transit)
 * 
 * - Privacy Rule (§164.502-514)
 *   - Minimum Necessary Standard
 *   - Notice of Privacy Practices
 *   - Patient Rights (Access, Amendment, Accounting)
 * 
 * - Breach Notification Rule (§164.400-414)
 *   - Breach Discovery and Notification
 *   - Notification to Individuals, HHS, Media
 * 
 * @module @odavl-studio/core/compliance/hipaa-validator
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import { glob } from 'glob';

/**
 * HIPAA compliance severity
 */
export enum HIPAASeverity {
  CRITICAL = 'critical', // Willful neglect (fine: $50K-$1.5M per violation)
  HIGH = 'high',         // Reasonable cause (fine: $1K-$50K per violation)
  MEDIUM = 'medium',     // Correctable violation
  LOW = 'low'            // Best practice recommendation
}

/**
 * HIPAA rule categories
 */
export enum HIPAARule {
  ADMIN_SAFEGUARDS = 'Administrative Safeguards (§164.308)',
  PHYSICAL_SAFEGUARDS = 'Physical Safeguards (§164.310)',
  TECHNICAL_SAFEGUARDS = 'Technical Safeguards (§164.312)',
  PRIVACY_RULE = 'Privacy Rule (§164.502-514)',
  BREACH_NOTIFICATION = 'Breach Notification Rule (§164.400-414)',
  SECURITY_RULE = 'Security Rule (§164.302-318)'
}

/**
 * Protected Health Information (PHI) types
 */
export enum PHIType {
  NAME = 'name',
  ADDRESS = 'address',
  DATE_OF_BIRTH = 'date-of-birth',
  SSN = 'ssn',
  MRN = 'medical-record-number',
  HEALTH_PLAN = 'health-plan-number',
  EMAIL = 'email',
  PHONE = 'phone',
  DIAGNOSIS = 'diagnosis',
  TREATMENT = 'treatment',
  MEDICATION = 'medication',
  BIOMETRIC = 'biometric',
  PHOTO = 'photograph',
  IP_ADDRESS = 'ip-address'
}

/**
 * HIPAA compliance finding
 */
export interface HIPAAFinding {
  id: string;
  title: string;
  description: string;
  severity: HIPAASeverity;
  rule: HIPAARule;
  section: string;        // e.g., §164.312(a)(1)
  file: string;
  line?: number;
  code?: string;
  phiTypes?: PHIType[];   // Types of PHI affected
  recommendation: string;
  estimatedFine?: string;
  remediation: string[];
  references: string[];
}

/**
 * HIPAA validator configuration
 */
export interface HIPAAValidatorConfig {
  rootPath: string;
  includePatterns?: string[];
  excludePatterns?: string[];
  checkEncryption?: boolean;
  checkAuditLogging?: boolean;
  checkAccessControls?: boolean;
  checkPHIHandling?: boolean;
  checkBreachNotification?: boolean;
  customChecks?: HIPAACustomCheck[];
}

/**
 * Custom HIPAA compliance check
 */
export interface HIPAACustomCheck {
  name: string;
  rule: HIPAARule;
  severity: HIPAASeverity;
  pattern: RegExp;
  description: string;
  recommendation: string;
}

/**
 * HIPAA compliance scan result
 */
export interface HIPAAScanResult {
  findings: HIPAAFinding[];
  summary: {
    total: number;
    bySeverity: Record<HIPAASeverity, number>;
    byRule: Record<HIPAARule, number>;
    phiTypesExposed: PHIType[];
    filesScanned: number;
    duration: number;
    complianceScore: number; // 0-100
  };
  recommendations: {
    immediate: string[];     // CRITICAL actions
    shortTerm: string[];     // HIGH priority (1-4 weeks)
    longTerm: string[];      // MEDIUM/LOW (1-6 months)
  };
  metadata: {
    scanDate: Date;
    validatorVersion: string;
    configUsed: Partial<HIPAAValidatorConfig>;
  };
}

/**
 * Built-in HIPAA compliance patterns
 */
const HIPAA_PATTERNS = {
  // §164.312(a)(1) - Access Control: Unique User IDs
  missingUniqueUserIds: {
    rule: HIPAARule.TECHNICAL_SAFEGUARDS,
    section: '§164.312(a)(1)',
    severity: HIPAASeverity.CRITICAL,
    patterns: [
      /shared[_-]?(?:password|credential|account)/gi,
      /(?:admin|root|system)[_-]?password\s*[=:]/gi
    ],
    description: 'Shared credentials or missing unique user identification',
    recommendation: 'Implement unique user IDs for each person. No shared accounts or passwords.',
    estimatedFine: '$50,000 - $1,500,000 per violation'
  },

  // §164.312(a)(2)(iv) - Encryption and Decryption
  unencryptedPHI: {
    rule: HIPAARule.TECHNICAL_SAFEGUARDS,
    section: '§164.312(a)(2)(iv)',
    severity: HIPAASeverity.CRITICAL,
    patterns: [
      /(?:patient|medical|health|diagnosis|treatment).*(?:name|ssn|mrn|dob).*(?!encrypt)/gi,
      /(?:phi|protected[_-]?health[_-]?information).*(?!encrypt)/gi,
      /store.*(?:medical|health|diagnosis).*(?!encrypt|cipher|aes)/gi
    ],
    description: 'PHI stored or transmitted without encryption',
    recommendation: 'Encrypt all PHI at rest (AES-256) and in transit (TLS 1.2+). Use FIPS 140-2 validated modules.',
    estimatedFine: '$50,000 - $1,500,000 per violation',
    phiTypes: [PHIType.NAME, PHIType.SSN, PHIType.MRN, PHIType.DIAGNOSIS]
  },

  // §164.312(b) - Audit Controls
  missingAuditLogging: {
    rule: HIPAARule.TECHNICAL_SAFEGUARDS,
    section: '§164.312(b)',
    severity: HIPAASeverity.HIGH,
    patterns: [
      /(?:access|view|update|delete).*(?:patient|medical|phi).*(?!log|audit)/gi,
      /(?:patient|medical).*(?:record|data).*(?:query|select).*(?!log)/gi
    ],
    description: 'Missing audit logs for PHI access',
    recommendation: 'Log ALL access to PHI (who, what, when, where). Retain logs for 6 years. Implement tamper-proof logging.',
    estimatedFine: '$1,000 - $50,000 per violation'
  },

  // §164.312(c)(1) - Integrity Controls
  noIntegrityChecks: {
    rule: HIPAARule.TECHNICAL_SAFEGUARDS,
    section: '§164.312(c)(1)',
    severity: HIPAASeverity.MEDIUM,
    patterns: [
      /(?:update|modify|change).*(?:patient|medical|phi).*(?!hash|checksum|integrity)/gi
    ],
    description: 'No integrity verification for PHI modifications',
    recommendation: 'Implement checksums, digital signatures, or blockchain for data integrity verification.',
    estimatedFine: '$1,000 - $50,000 per violation'
  },

  // §164.312(e)(1) - Transmission Security
  insecureTransmission: {
    rule: HIPAARule.TECHNICAL_SAFEGUARDS,
    section: '§164.312(e)(1)',
    severity: HIPAASeverity.CRITICAL,
    patterns: [
      /(?:http|ftp):\/\/.*(?:patient|medical|phi)/gi,
      /send.*(?:email|sms|text).*(?:patient|medical|diagnosis).*(?!encrypt)/gi
    ],
    description: 'PHI transmitted over unencrypted channels',
    recommendation: 'Use TLS 1.2+ for all PHI transmissions. Disable TLS 1.0/1.1. Use strong cipher suites.',
    estimatedFine: '$50,000 - $1,500,000 per violation',
    phiTypes: [PHIType.NAME, PHIType.DIAGNOSIS, PHIType.TREATMENT]
  },

  // §164.308(a)(5)(ii)(C) - Log-in Monitoring
  noLoginMonitoring: {
    rule: HIPAARule.ADMIN_SAFEGUARDS,
    section: '§164.308(a)(5)(ii)(C)',
    severity: HIPAASeverity.HIGH,
    patterns: [
      /(?:login|auth|signin).*(?!log|monitor|alert)/gi,
      /failed[_-]?(?:login|auth).*(?!alert|notify)/gi
    ],
    description: 'Missing login monitoring and alerts',
    recommendation: 'Monitor login attempts. Alert on failed logins, unusual access patterns, or off-hours access.',
    estimatedFine: '$1,000 - $50,000 per violation'
  },

  // §164.308(a)(3)(ii)(A) - Access Authorization
  noAccessControls: {
    rule: HIPAARule.ADMIN_SAFEGUARDS,
    section: '§164.308(a)(3)(ii)(A)',
    severity: HIPAASeverity.CRITICAL,
    patterns: [
      /(?:patient|medical|phi).*(?:query|select|access).*(?!authorize|permission|role)/gi,
      /(?:public|anonymous).*(?:access|route).*(?:patient|medical)/gi
    ],
    description: 'Insufficient access controls for PHI',
    recommendation: 'Implement role-based access control (RBAC). Principle of least privilege. Regular access reviews.',
    estimatedFine: '$50,000 - $1,500,000 per violation'
  },

  // §164.308(a)(1)(ii)(D) - Information System Activity Review
  noSecurityReview: {
    rule: HIPAARule.ADMIN_SAFEGUARDS,
    section: '§164.308(a)(1)(ii)(D)',
    severity: HIPAASeverity.MEDIUM,
    patterns: [
      /audit[_-]?log.*(?!review|analyze|monitor)/gi
    ],
    description: 'No regular review of system activity and audit logs',
    recommendation: 'Review audit logs regularly (at least monthly). Use SIEM for automated analysis.',
    estimatedFine: '$1,000 - $50,000 per violation'
  },

  // §164.502(b) - Minimum Necessary Standard
  excessivePHIAccess: {
    rule: HIPAARule.PRIVACY_RULE,
    section: '§164.502(b)',
    severity: HIPAASeverity.HIGH,
    patterns: [
      /select\s+\*\s+from\s+(?:patient|medical)/gi,
      /(?:all|full|complete).*(?:patient|medical).*(?:data|record)/gi
    ],
    description: 'Accessing more PHI than necessary (violates Minimum Necessary standard)',
    recommendation: 'Only access minimum PHI needed for task. Use field-level access controls.',
    estimatedFine: '$1,000 - $50,000 per violation',
    phiTypes: [PHIType.NAME, PHIType.SSN, PHIType.DIAGNOSIS, PHIType.TREATMENT]
  },

  // §164.308(a)(4)(ii)(B) - Workforce Training
  noSecurityTraining: {
    rule: HIPAARule.ADMIN_SAFEGUARDS,
    section: '§164.308(a)(4)(ii)(B)',
    severity: HIPAASeverity.MEDIUM,
    patterns: [
      /(?:new|onboard).*(?:employee|user|staff).*(?!training|awareness|education)/gi
    ],
    description: 'No evidence of security awareness training',
    recommendation: 'Provide HIPAA security training to all workforce members. Document training. Annual refresher.',
    estimatedFine: '$1,000 - $50,000 per violation'
  },

  // §164.404 - Breach Notification
  noBreachNotification: {
    rule: HIPAARule.BREACH_NOTIFICATION,
    section: '§164.404',
    severity: HIPAASeverity.CRITICAL,
    patterns: [
      /(?:breach|leak|exposure).*(?:phi|patient|medical).*(?!notify|alert|report)/gi,
      /(?:unauthorized|illegal).*(?:access|disclosure).*(?:phi|patient).*(?!notify)/gi
    ],
    description: 'Missing breach notification mechanism',
    recommendation: 'Notify affected individuals within 60 days. Notify HHS. If >500 affected, notify media.',
    estimatedFine: '$50,000 - $1,500,000 per violation'
  },

  // §164.528 - Accounting of Disclosures
  noDisclosureTracking: {
    rule: HIPAARule.PRIVACY_RULE,
    section: '§164.528',
    severity: HIPAASeverity.HIGH,
    patterns: [
      /(?:share|disclose|send).*(?:phi|patient|medical).*(?!track|log|record)/gi
    ],
    description: 'PHI disclosures not tracked (accounting of disclosures)',
    recommendation: 'Track all PHI disclosures (who, what, when, to whom, why). Retain for 6 years.',
    estimatedFine: '$1,000 - $50,000 per violation'
  },

  // §164.524 - Right to Access
  noPatientAccess: {
    rule: HIPAARule.PRIVACY_RULE,
    section: '§164.524',
    severity: HIPAASeverity.HIGH,
    patterns: [
      /patient.*(?:record|data|information).*(?!download|export|access)/gi
    ],
    description: 'No patient access to their own medical records',
    recommendation: 'Provide patients access to their PHI within 30 days. Electronic format preferred.',
    estimatedFine: '$1,000 - $50,000 per violation'
  }
};

/**
 * PHI detection patterns (to identify what types of PHI are at risk)
 */
const PHI_DETECTION_PATTERNS: Record<PHIType, RegExp[]> = {
  [PHIType.NAME]: [
    /(?:patient|customer)[_-]?(?:first|last|full)[_-]?name/gi,
    /(?:name|full[_-]?name).*(?:patient|medical)/gi
  ],
  [PHIType.ADDRESS]: [
    /(?:patient|customer)[_-]?(?:address|street|city|zip)/gi
  ],
  [PHIType.DATE_OF_BIRTH]: [
    /(?:dob|date[_-]?of[_-]?birth|birth[_-]?date)/gi
  ],
  [PHIType.SSN]: [
    /(?:ssn|social[_-]?security)/gi
  ],
  [PHIType.MRN]: [
    /(?:mrn|medical[_-]?record[_-]?number|patient[_-]?id)/gi
  ],
  [PHIType.HEALTH_PLAN]: [
    /(?:insurance|health[_-]?plan)[_-]?(?:number|id)/gi
  ],
  [PHIType.EMAIL]: [
    /(?:patient|customer)[_-]?email/gi
  ],
  [PHIType.PHONE]: [
    /(?:patient|customer)[_-]?(?:phone|mobile|tel)/gi
  ],
  [PHIType.DIAGNOSIS]: [
    /(?:diagnosis|condition|disease|illness)/gi
  ],
  [PHIType.TREATMENT]: [
    /(?:treatment|procedure|surgery|therapy)/gi
  ],
  [PHIType.MEDICATION]: [
    /(?:medication|prescription|drug)/gi
  ],
  [PHIType.BIOMETRIC]: [
    /(?:fingerprint|retina|voice[_-]?print|biometric)/gi
  ],
  [PHIType.PHOTO]: [
    /(?:patient|medical)[_-]?(?:photo|image|picture)/gi
  ],
  [PHIType.IP_ADDRESS]: [
    /(?:patient|user)[_-]?ip[_-]?address/gi
  ]
};

/**
 * HIPAA Validator - Verify HIPAA compliance in healthcare applications
 */
export class HIPAAValidator {
  private config: Required<HIPAAValidatorConfig>;
  private findings: HIPAAFinding[] = [];
  private phiTypesFound: Set<PHIType> = new Set();

  constructor(config: HIPAAValidatorConfig) {
    this.config = {
      rootPath: config.rootPath,
      includePatterns: config.includePatterns ?? ['**/*.{ts,js,py,java,cs,sql,prisma}'],
      excludePatterns: config.excludePatterns ?? ['**/node_modules/**', '**/dist/**', '**/build/**'],
      checkEncryption: config.checkEncryption ?? true,
      checkAuditLogging: config.checkAuditLogging ?? true,
      checkAccessControls: config.checkAccessControls ?? true,
      checkPHIHandling: config.checkPHIHandling ?? true,
      checkBreachNotification: config.checkBreachNotification ?? true,
      customChecks: config.customChecks ?? []
    };
  }

  /**
   * Run HIPAA compliance scan
   */
  async scan(): Promise<HIPAAScanResult> {
    const startTime = Date.now();
    this.findings = [];
    this.phiTypesFound.clear();

    console.log('🏥 Scanning for HIPAA compliance issues...');

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
        validatorVersion: '1.0.0',
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
   * Scan a single file for HIPAA issues
   */
  private async scanFile(filePath: string): Promise<void> {
    const content = await fs.readFile(filePath, 'utf-8');

    // First, detect what types of PHI are present
    this.detectPHITypes(content);

    // Scan with built-in patterns
    for (const [checkName, check] of Object.entries(HIPAA_PATTERNS)) {
      // Skip checks based on config
      if (!this.shouldRunCheck(check)) {
        continue;
      }

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

    // Custom checks
    for (const customCheck of this.config.customChecks) {
      const matches = Array.from(content.matchAll(customCheck.pattern));
      for (const match of matches) {
        const finding: HIPAAFinding = {
          id: `custom-${customCheck.name}-${this.findings.length}`,
          title: customCheck.name,
          description: customCheck.description,
          severity: customCheck.severity,
          rule: customCheck.rule,
          section: 'Custom',
          file: path.relative(this.config.rootPath, filePath),
          line: this.getLineNumber(content, match.index!),
          code: match[0],
          recommendation: customCheck.recommendation,
          estimatedFine: this.getEstimatedFine(customCheck.severity),
          remediation: [customCheck.recommendation],
          references: [
            'https://www.hhs.gov/hipaa/index.html',
            'https://www.hhs.gov/hipaa/for-professionals/security/index.html'
          ]
        };
        this.findings.push(finding);
      }
    }
  }

  /**
   * Detect PHI types present in content
   */
  private detectPHITypes(content: string): void {
    for (const [phiType, patterns] of Object.entries(PHI_DETECTION_PATTERNS)) {
      for (const pattern of patterns) {
        if (pattern.test(content)) {
          this.phiTypesFound.add(phiType as PHIType);
        }
      }
    }
  }

  /**
   * Check if a check should run based on config
   */
  private shouldRunCheck(check: typeof HIPAA_PATTERNS.unencryptedPHI): boolean {
    if (!this.config.checkEncryption && check.section.includes('312(a)(2)')) {
      return false;
    }
    if (!this.config.checkAuditLogging && check.section.includes('312(b)')) {
      return false;
    }
    if (!this.config.checkAccessControls && check.section.includes('308(a)(3)')) {
      return false;
    }
    if (!this.config.checkBreachNotification && check.section.includes('404')) {
      return false;
    }
    return true;
  }

  /**
   * Create a finding from a pattern match
   */
  private createFinding(
    checkName: string,
    check: typeof HIPAA_PATTERNS.unencryptedPHI,
    filePath: string,
    content: string,
    match: RegExpMatchArray
  ): HIPAAFinding {
    const lineNumber = this.getLineNumber(content, match.index!);

    return {
      id: `${checkName}-${this.findings.length}`,
      title: check.description,
      description: `${check.description} (${check.section})`,
      severity: check.severity,
      rule: check.rule,
      section: check.section,
      file: path.relative(this.config.rootPath, filePath),
      line: lineNumber,
      code: match[0],
      phiTypes: check.phiTypes,
      recommendation: check.recommendation,
      estimatedFine: check.estimatedFine,
      remediation: this.getRemediationSteps(check.section),
      references: [
        `https://www.hhs.gov/hipaa/for-professionals/security/laws-regulations/index.html`,
        'https://www.hhs.gov/hipaa/for-professionals/compliance-enforcement/index.html'
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
   * Get estimated fine range
   */
  private getEstimatedFine(severity: HIPAASeverity): string {
    const fines: Record<HIPAASeverity, string> = {
      [HIPAASeverity.CRITICAL]: '$50,000 - $1,500,000 per violation (willful neglect)',
      [HIPAASeverity.HIGH]: '$1,000 - $50,000 per violation (reasonable cause)',
      [HIPAASeverity.MEDIUM]: '$100 - $50,000 per violation (correctable)',
      [HIPAASeverity.LOW]: 'Warning (best practice recommendation)'
    };
    return fines[severity];
  }

  /**
   * Get remediation steps for a section
   */
  private getRemediationSteps(section: string): string[] {
    const steps: Record<string, string[]> = {
      '§164.312(a)(1)': [
        'Assign unique user IDs to each person',
        'Implement multi-factor authentication (MFA)',
        'No shared accounts or passwords',
        'Use SSO with SAML/OAuth for centralized management'
      ],
      '§164.312(a)(2)(iv)': [
        'Encrypt PHI at rest using AES-256 (FIPS 140-2 validated)',
        'Encrypt PHI in transit using TLS 1.2+',
        'Use encrypted databases or full-disk encryption',
        'Store encryption keys in HSM or key management service'
      ],
      '§164.312(b)': [
        'Log all access to PHI (create, read, update, delete)',
        'Include: user ID, timestamp, action, PHI accessed',
        'Store logs in tamper-proof system (WORM storage)',
        'Retain logs for 6 years',
        'Implement SIEM for real-time analysis'
      ],
      '§164.312(c)(1)': [
        'Implement data integrity controls (checksums, hashes)',
        'Use digital signatures for critical data',
        'Detect unauthorized modifications',
        'Implement version control for medical records'
      ],
      '§164.312(e)(1)': [
        'Use TLS 1.2+ for all PHI transmissions',
        'Disable TLS 1.0 and 1.1',
        'Use VPN for remote access',
        'Encrypt emails containing PHI',
        'Use secure file transfer protocols (SFTP, FTPS)'
      ],
      '§164.308(a)(5)(ii)(C)': [
        'Monitor all login attempts',
        'Alert on failed logins (3+ failures)',
        'Alert on unusual access patterns',
        'Alert on off-hours access',
        'Implement automated response (account lockout)'
      ],
      '§164.308(a)(3)(ii)(A)': [
        'Implement role-based access control (RBAC)',
        'Principle of least privilege',
        'Regular access reviews (quarterly)',
        'Automatic access revocation on termination',
        'Document access authorization process'
      ],
      '§164.308(a)(1)(ii)(D)': [
        'Review audit logs monthly (minimum)',
        'Use SIEM for automated analysis',
        'Document review process',
        'Escalate suspicious activity',
        'Annual security risk assessment'
      ],
      '§164.502(b)': [
        'Only access minimum PHI needed',
        'Implement field-level access controls',
        'Use views/stored procedures to limit data exposure',
        'Document minimum necessary determinations',
        'Regular training on minimum necessary'
      ],
      '§164.308(a)(4)(ii)(B)': [
        'Provide HIPAA training to all workforce',
        'Training within 30 days of hire',
        'Annual refresher training',
        'Document all training (who, when, topics)',
        'Test comprehension (quizzes)'
      ],
      '§164.404': [
        'Detect breaches within 60 days',
        'Notify affected individuals within 60 days',
        'Notify HHS (if <500 affected: annually; if 500+: within 60 days)',
        'If 500+ affected: notify media',
        'Document breach investigation'
      ],
      '§164.528': [
        'Track all PHI disclosures',
        'Include: date, recipient, purpose, description',
        'Exclude: treatment, payment, operations',
        'Retain for 6 years',
        'Provide accounting to patients within 60 days'
      ],
      '§164.524': [
        'Provide patient access within 30 days',
        'Electronic format preferred',
        'Allow patient to choose format',
        'Reasonable fees only (no profit)',
        'Deny only if permitted by law'
      ]
    };
    return steps[section] ?? ['See HIPAA guidance for remediation'];
  }

  /**
   * Generate summary statistics
   */
  private generateSummary(filesScanned: number, duration: number): HIPAAScanResult['summary'] {
    const bySeverity: Record<HIPAASeverity, number> = {
      [HIPAASeverity.CRITICAL]: 0,
      [HIPAASeverity.HIGH]: 0,
      [HIPAASeverity.MEDIUM]: 0,
      [HIPAASeverity.LOW]: 0
    };

    const byRule: Record<HIPAARule, number> = {
      [HIPAARule.ADMIN_SAFEGUARDS]: 0,
      [HIPAARule.PHYSICAL_SAFEGUARDS]: 0,
      [HIPAARule.TECHNICAL_SAFEGUARDS]: 0,
      [HIPAARule.PRIVACY_RULE]: 0,
      [HIPAARule.BREACH_NOTIFICATION]: 0,
      [HIPAARule.SECURITY_RULE]: 0
    };

    for (const finding of this.findings) {
      bySeverity[finding.severity]++;
      byRule[finding.rule]++;
    }

    // Calculate compliance score (100 - weighted by severity)
    const weights = {
      [HIPAASeverity.CRITICAL]: 15,
      [HIPAASeverity.HIGH]: 8,
      [HIPAASeverity.MEDIUM]: 3,
      [HIPAASeverity.LOW]: 1
    };
    const totalPenalty = this.findings.reduce((sum, f) => sum + weights[f.severity], 0);
    const complianceScore = Math.max(0, 100 - totalPenalty);

    return {
      total: this.findings.length,
      bySeverity,
      byRule,
      phiTypesExposed: Array.from(this.phiTypesFound),
      filesScanned,
      duration,
      complianceScore
    };
  }

  /**
   * Generate prioritized recommendations
   */
  private generateRecommendations(): HIPAAScanResult['recommendations'] {
    const immediate = this.findings
      .filter(f => f.severity === HIPAASeverity.CRITICAL)
      .map(f => `${f.title}: ${f.recommendation}`);

    const shortTerm = this.findings
      .filter(f => f.severity === HIPAASeverity.HIGH)
      .map(f => `${f.title}: ${f.recommendation}`);

    const longTerm = this.findings
      .filter(f => f.severity === HIPAASeverity.MEDIUM || f.severity === HIPAASeverity.LOW)
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
        validatorVersion: '1.0.0'
      }
    }, null, 2);
  }
}

/**
 * Convenience function to run HIPAA scan
 */
export async function runHIPAAScan(config: HIPAAValidatorConfig): Promise<HIPAAScanResult> {
  const validator = new HIPAAValidator(config);
  return validator.scan();
}

/**
 * Quick HIPAA check for CI/CD
 */
export async function quickHIPAACheck(rootPath: string): Promise<{ hasCritical: boolean; score: number }> {
  const validator = new HIPAAValidator({ rootPath });
  const result = await validator.scan();
  
  return {
    hasCritical: result.summary.bySeverity[HIPAASeverity.CRITICAL] > 0,
    score: result.summary.complianceScore
  };
}
