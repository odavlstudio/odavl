/**
 * SOC 2 Auditor - Detect SOC 2 compliance issues
 * 
 * Purpose: Verify SOC 2 (Service Organization Control 2) compliance
 * Week 28: Compliance Checks (File 3/3)
 * 
 * SOC 2 Trust Services Criteria (TSC):
 * - CC (Common Criteria): Apply to all SOC 2 reports
 *   - CC1: Control Environment
 *   - CC2: Communication and Information
 *   - CC3: Risk Assessment
 *   - CC4: Monitoring Activities
 *   - CC5: Control Activities
 *   - CC6: Logical and Physical Access Controls
 *   - CC7: System Operations
 *   - CC8: Change Management
 *   - CC9: Risk Mitigation
 * 
 * - Additional Criteria (Type II):
 *   - A: Availability (99.9%+ uptime)
 *   - C: Confidentiality (data encryption, access controls)
 *   - P: Processing Integrity (accurate, complete, timely)
 *   - PI: Privacy (AICPA/CICA Privacy Framework)
 * 
 * @module @odavl-studio/core/compliance/soc2-auditor
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import { glob } from 'glob';

/**
 * SOC 2 compliance severity
 */
export enum SOC2Severity {
  CRITICAL = 'critical', // Control deficiency (Type II failure)
  HIGH = 'high',         // Significant deficiency
  MEDIUM = 'medium',     // Observation
  LOW = 'low'            // Advisory
}

/**
 * SOC 2 Trust Services Criteria
 */
export enum SOC2Criteria {
  CC1_CONTROL_ENVIRONMENT = 'CC1: Control Environment',
  CC2_COMMUNICATION = 'CC2: Communication and Information',
  CC3_RISK_ASSESSMENT = 'CC3: Risk Assessment',
  CC4_MONITORING = 'CC4: Monitoring Activities',
  CC5_CONTROL_ACTIVITIES = 'CC5: Control Activities',
  CC6_ACCESS_CONTROLS = 'CC6: Logical and Physical Access Controls',
  CC7_SYSTEM_OPERATIONS = 'CC7: System Operations',
  CC8_CHANGE_MANAGEMENT = 'CC8: Change Management',
  CC9_RISK_MITIGATION = 'CC9: Risk Mitigation',
  A_AVAILABILITY = 'A: Availability',
  C_CONFIDENTIALITY = 'C: Confidentiality',
  P_PROCESSING_INTEGRITY = 'P: Processing Integrity',
  PI_PRIVACY = 'PI: Privacy'
}

/**
 * SOC 2 compliance finding
 */
export interface SOC2Finding {
  id: string;
  title: string;
  description: string;
  severity: SOC2Severity;
  criteria: SOC2Criteria;
  controlId: string;      // e.g., CC6.1, CC7.2
  file: string;
  line?: number;
  code?: string;
  recommendation: string;
  evidenceRequired: string[]; // Documentation auditor will request
  remediation: string[];
  references: string[];
}

/**
 * SOC 2 auditor configuration
 */
export interface SOC2AuditorConfig {
  rootPath: string;
  includePatterns?: string[];
  excludePatterns?: string[];
  checkAccessControls?: boolean;
  checkEncryption?: boolean;
  checkLogging?: boolean;
  checkBackups?: boolean;
  checkIncidentResponse?: boolean;
  checkChangeManagement?: boolean;
  customChecks?: SOC2CustomCheck[];
  reportType?: 'Type I' | 'Type II'; // Type I: design, Type II: operating effectiveness
}

/**
 * Custom SOC 2 check
 */
export interface SOC2CustomCheck {
  name: string;
  criteria: SOC2Criteria;
  severity: SOC2Severity;
  pattern: RegExp;
  description: string;
  recommendation: string;
}

/**
 * SOC 2 compliance scan result
 */
export interface SOC2ScanResult {
  findings: SOC2Finding[];
  summary: {
    total: number;
    bySeverity: Record<SOC2Severity, number>;
    byCriteria: Record<SOC2Criteria, number>;
    controlDeficiencies: number;  // CRITICAL findings
    filesScanned: number;
    duration: number;
    readinessScore: number; // 0-100
  };
  recommendations: {
    immediate: string[];      // CRITICAL fixes
    shortTerm: string[];      // HIGH priority (before audit)
    longTerm: string[];       // MEDIUM/LOW (continuous improvement)
  };
  evidenceGaps: {
    criteria: SOC2Criteria;
    missing: string[];
  }[];
  metadata: {
    scanDate: Date;
    auditorVersion: string;
    reportType: 'Type I' | 'Type II';
    configUsed: Partial<SOC2AuditorConfig>;
  };
}

/**
 * Built-in SOC 2 compliance patterns
 */
const SOC2_PATTERNS = {
  // CC6.1: Logical and Physical Access Controls - Authentication
  weakAuthentication: {
    criteria: SOC2Criteria.CC6_ACCESS_CONTROLS,
    controlId: 'CC6.1',
    severity: SOC2Severity.CRITICAL,
    patterns: [
      /password[_-]?min[_-]?length\s*[=:]\s*[1-7]\D/gi,
      /(?:no|without|skip)[_-]?(?:auth|authentication)/gi,
      /(?:auth|authentication)\s*[=:]\s*false/gi
    ],
    description: 'Weak authentication controls (passwords <8 chars or auth disabled)',
    recommendation: 'Enforce strong passwords (12+ chars, complexity). Implement MFA. Use industry-standard auth (OAuth2, SAML).',
    evidenceRequired: [
      'Password policy documentation',
      'MFA configuration screenshots',
      'User access review logs'
    ]
  },

  // CC6.2: Prior to Issuing System Credentials
  noAccessReview: {
    criteria: SOC2Criteria.CC6_ACCESS_CONTROLS,
    controlId: 'CC6.2',
    severity: SOC2Severity.HIGH,
    patterns: [
      /(?:create|add|new)[_-]?user.*(?!approval|review|authorize)/gi,
      /(?:grant|assign)[_-]?access.*(?!approval|review)/gi
    ],
    description: 'User access granted without approval/review process',
    recommendation: 'Implement access request and approval workflow. Document in access control policy.',
    evidenceRequired: [
      'Access request tickets',
      'Approval workflow documentation',
      'Manager approval records'
    ]
  },

  // CC6.6: Removal or Modification of Access
  noAccessRevocation: {
    criteria: SOC2Criteria.CC6_ACCESS_CONTROLS,
    controlId: 'CC6.6',
    severity: SOC2Severity.CRITICAL,
    patterns: [
      /(?:termination|offboarding|exit).*(?!revoke|disable|remove[_-]?access)/gi,
      /(?:user|employee)[_-]?status.*inactive.*(?!disable[_-]?access)/gi
    ],
    description: 'No automatic access revocation on termination',
    recommendation: 'Implement automated access revocation on employee termination. Immediate for critical systems.',
    evidenceRequired: [
      'Offboarding checklist',
      'Access revocation logs',
      'HR-IT integration documentation'
    ]
  },

  // CC7.2: System Monitoring - Logging
  insufficientLogging: {
    criteria: SOC2Criteria.CC7_SYSTEM_OPERATIONS,
    controlId: 'CC7.2',
    severity: SOC2Severity.HIGH,
    patterns: [
      /(?:login|auth|access|create|update|delete).*(?!log|audit|track)/gi,
      /(?:security|critical)[_-]?event.*(?!log|monitor)/gi
    ],
    description: 'Insufficient logging of security events',
    recommendation: 'Log all security-relevant events (auth, access, changes). Retain logs for 1+ year. Centralized logging.',
    evidenceRequired: [
      'Log retention policy',
      'SIEM/log aggregation setup',
      'Sample log entries'
    ]
  },

  // CC7.3: Detection of Anomalies
  noAnomalyDetection: {
    criteria: SOC2Criteria.CC7_SYSTEM_OPERATIONS,
    controlId: 'CC7.3',
    severity: SOC2Severity.HIGH,
    patterns: [
      /log.*(?!alert|monitor|analyze|siem)/gi,
      /failed[_-]?login.*(?!alert|notify|block)/gi
    ],
    description: 'No anomaly detection or alerting on logs',
    recommendation: 'Implement SIEM or log monitoring. Alert on suspicious activity (failed logins, unusual access patterns).',
    evidenceRequired: [
      'SIEM configuration',
      'Alert rules documentation',
      'Sample alert tickets'
    ]
  },

  // CC8.1: Change Management
  noChangeControl: {
    criteria: SOC2Criteria.CC8_CHANGE_MANAGEMENT,
    controlId: 'CC8.1',
    severity: SOC2Severity.CRITICAL,
    patterns: [
      /(?:deploy|push|release).*(?:production|prod).*(?!approval|review|ticket)/gi,
      /(?:git|svn)[_-]?(?:push|commit).*(?:main|master|prod).*(?!review|pr)/gi
    ],
    description: 'Changes deployed to production without approval/review',
    recommendation: 'Implement change approval process. Require pull request reviews. Separate dev/staging/prod environments.',
    evidenceRequired: [
      'Change management policy',
      'Pull request approval logs',
      'Change tickets/RFCs'
    ]
  },

  // CC9.1: Risk Identification and Assessment
  noRiskAssessment: {
    criteria: SOC2Criteria.CC9_RISK_MITIGATION,
    controlId: 'CC9.1',
    severity: SOC2Severity.MEDIUM,
    patterns: [
      /(?:new|add|install)[_-]?(?:dependency|package|library).*(?!security|vuln|scan)/gi
    ],
    description: 'Dependencies added without security assessment',
    recommendation: 'Scan dependencies for vulnerabilities. Document risk assessment. Use tools like Snyk, Dependabot.',
    evidenceRequired: [
      'Dependency scanning reports',
      'Vulnerability management process',
      'Risk acceptance documentation'
    ]
  },

  // C1.1: Confidentiality - Encryption at Rest
  unencryptedData: {
    criteria: SOC2Criteria.C_CONFIDENTIALITY,
    controlId: 'C1.1',
    severity: SOC2Severity.CRITICAL,
    patterns: [
      /(?:store|save|persist).*(?:password|secret|api[_-]?key|token).*(?!encrypt|hash)/gi,
      /(?:customer|user|personal)[_-]?data.*(?!encrypt|cipher)/gi
    ],
    description: 'Sensitive data stored without encryption',
    recommendation: 'Encrypt all sensitive data at rest (AES-256). Use database encryption or application-level encryption.',
    evidenceRequired: [
      'Encryption configuration',
      'Key management documentation',
      'Encryption audit logs'
    ]
  },

  // C1.2: Confidentiality - Encryption in Transit
  unencryptedTransmission: {
    criteria: SOC2Criteria.C_CONFIDENTIALITY,
    controlId: 'C1.2',
    severity: SOC2Severity.CRITICAL,
    patterns: [
      /(?:http|ftp):\/\/.*(?:api|data|customer)/gi,
      /ssl[_-]?verify\s*[=:]\s*false/gi,
      /tls[_-]?version\s*[=:]\s*["'](?:1\.0|1\.1)["']/gi
    ],
    description: 'Data transmitted without encryption or weak TLS',
    recommendation: 'Use TLS 1.2+ for all data transmission. Disable TLS 1.0/1.1. Enforce HTTPS.',
    evidenceRequired: [
      'SSL/TLS configuration',
      'Certificate management process',
      'SSL Labs scan results'
    ]
  },

  // A1.1: Availability - Backup and Recovery
  noBackupStrategy: {
    criteria: SOC2Criteria.A_AVAILABILITY,
    controlId: 'A1.1',
    severity: SOC2Severity.HIGH,
    patterns: [
      /database.*(?!backup|snapshot|replication)/gi,
      /(?:critical|production)[_-]?data.*(?!backup)/gi
    ],
    description: 'No backup and recovery strategy',
    recommendation: 'Implement automated backups (daily for production). Test restoration quarterly. Document RTO/RPO.',
    evidenceRequired: [
      'Backup policy documentation',
      'Backup configuration',
      'Restoration test results'
    ]
  },

  // A1.2: Availability - Monitoring and Alerting
  noUptimeMonitoring: {
    criteria: SOC2Criteria.A_AVAILABILITY,
    controlId: 'A1.2',
    severity: SOC2Severity.HIGH,
    patterns: [
      /(?:api|service|application).*(?!health[_-]?check|monitor|uptime)/gi,
      /(?:production|critical)[_-]?system.*(?!monitor|alert)/gi
    ],
    description: 'No uptime monitoring or health checks',
    recommendation: 'Implement uptime monitoring (Pingdom, UptimeRobot). Alert on downtime. Target 99.9%+ uptime.',
    evidenceRequired: [
      'Monitoring configuration',
      'Uptime reports',
      'Incident response logs'
    ]
  },

  // P1.1: Processing Integrity - Input Validation
  noInputValidation: {
    criteria: SOC2Criteria.P_PROCESSING_INTEGRITY,
    controlId: 'P1.1',
    severity: SOC2Severity.HIGH,
    patterns: [
      /(?:req\.body|request\.input|params).*(?!validate|sanitize|check)/gi,
      /(?:user|customer)[_-]?input.*(?:insert|query|execute).*(?!validate)/gi
    ],
    description: 'User input not validated (integrity and security risk)',
    recommendation: 'Validate all user input. Use schema validation (Joi, Yup). Sanitize to prevent injection.',
    evidenceRequired: [
      'Input validation code',
      'Schema definitions',
      'Security testing results'
    ]
  },

  // P1.2: Processing Integrity - Error Handling
  poorErrorHandling: {
    criteria: SOC2Criteria.P_PROCESSING_INTEGRITY,
    controlId: 'P1.2',
    severity: SOC2Severity.MEDIUM,
    patterns: [
      /catch\s*\([^)]*\)\s*\{\s*\}/gi,
      /(?:error|exception).*(?!log|track|monitor)/gi
    ],
    description: 'Poor error handling (silent failures)',
    recommendation: 'Log all errors. Track error rates. Alert on critical errors. Never expose stack traces to users.',
    evidenceRequired: [
      'Error handling code',
      'Error monitoring dashboards',
      'Sample error logs'
    ]
  },

  // CC5.2: Control Activities - Segregation of Duties
  noSegregationOfDuties: {
    criteria: SOC2Criteria.CC5_CONTROL_ACTIVITIES,
    controlId: 'CC5.2',
    severity: SOC2Severity.HIGH,
    patterns: [
      /(?:developer|engineer).*(?:admin|root|superuser)[_-]?access.*production/gi,
      /(?:single|one)[_-]?person.*(?:deploy|approve|review)/gi
    ],
    description: 'Insufficient segregation of duties (same person codes and deploys)',
    recommendation: 'Separate roles: developer, approver, deployer. Require peer review. No direct prod access for devs.',
    evidenceRequired: [
      'Role definitions',
      'Access control matrix',
      'Approval workflow'
    ]
  },

  // CC4.1: Monitoring Activities
  noSecurityMetrics: {
    criteria: SOC2Criteria.CC4_MONITORING,
    controlId: 'CC4.1',
    severity: SOC2Severity.MEDIUM,
    patterns: [
      /(?:security|compliance).*(?!metrics|dashboard|kpi|report)/gi
    ],
    description: 'No security metrics or KPIs tracked',
    recommendation: 'Track security KPIs: uptime, failed logins, vulnerabilities, incidents. Monthly reporting to management.',
    evidenceRequired: [
      'Security dashboard screenshots',
      'Monthly security reports',
      'KPI definitions'
    ]
  },

  // PI1.1: Privacy - Data Retention
  noRetentionPolicy: {
    criteria: SOC2Criteria.PI_PRIVACY,
    controlId: 'PI1.1',
    severity: SOC2Severity.MEDIUM,
    patterns: [
      /(?:user|customer|personal)[_-]?data.*(?!retention|expiry|delete[_-]?after)/gi
    ],
    description: 'No data retention policy (privacy risk)',
    recommendation: 'Define retention periods. Implement automatic deletion. Document in privacy policy.',
    evidenceRequired: [
      'Data retention policy',
      'Automated deletion configuration',
      'Sample deletion logs'
    ]
  }
};

/**
 * SOC 2 Auditor - Verify SOC 2 compliance
 */
export class SOC2Auditor {
  private config: Required<SOC2AuditorConfig>;
  private findings: SOC2Finding[] = [];

  constructor(config: SOC2AuditorConfig) {
    this.config = {
      rootPath: config.rootPath,
      includePatterns: config.includePatterns ?? ['**/*.{ts,js,py,java,cs,yml,yaml,json}'],
      excludePatterns: config.excludePatterns ?? ['**/node_modules/**', '**/dist/**', '**/build/**'],
      checkAccessControls: config.checkAccessControls ?? true,
      checkEncryption: config.checkEncryption ?? true,
      checkLogging: config.checkLogging ?? true,
      checkBackups: config.checkBackups ?? true,
      checkIncidentResponse: config.checkIncidentResponse ?? true,
      checkChangeManagement: config.checkChangeManagement ?? true,
      customChecks: config.customChecks ?? [],
      reportType: config.reportType ?? 'Type II'
    };
  }

  /**
   * Run SOC 2 compliance scan
   */
  async scan(): Promise<SOC2ScanResult> {
    const startTime = Date.now();
    this.findings = [];

    console.log('🔐 Scanning for SOC 2 compliance issues...');

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

    // Identify evidence gaps
    const evidenceGaps = this.identifyEvidenceGaps();

    return {
      findings: this.findings,
      summary,
      recommendations,
      evidenceGaps,
      metadata: {
        scanDate: new Date(),
        auditorVersion: '1.0.0',
        reportType: this.config.reportType,
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
   * Scan a single file for SOC 2 issues
   */
  private async scanFile(filePath: string): Promise<void> {
    const content = await fs.readFile(filePath, 'utf-8');

    // Scan with built-in patterns
    for (const [checkName, check] of Object.entries(SOC2_PATTERNS)) {
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
        const finding: SOC2Finding = {
          id: `custom-${customCheck.name}-${this.findings.length}`,
          title: customCheck.name,
          description: customCheck.description,
          severity: customCheck.severity,
          criteria: customCheck.criteria,
          controlId: 'Custom',
          file: path.relative(this.config.rootPath, filePath),
          line: this.getLineNumber(content, match.index!),
          code: match[0],
          recommendation: customCheck.recommendation,
          evidenceRequired: ['Custom check evidence'],
          remediation: [customCheck.recommendation],
          references: [
            'https://www.aicpa.org/interestareas/frc/assuranceadvisoryservices/aicpasoc2report.html',
            'https://www.cpajournal.com/2020/02/26/understanding-soc-2-reports/'
          ]
        };
        this.findings.push(finding);
      }
    }
  }

  /**
   * Check if a check should run based on config
   */
  private shouldRunCheck(check: typeof SOC2_PATTERNS.weakAuthentication): boolean {
    if (!this.config.checkAccessControls && check.controlId.startsWith('CC6')) {
      return false;
    }
    if (!this.config.checkEncryption && (check.controlId === 'C1.1' || check.controlId === 'C1.2')) {
      return false;
    }
    if (!this.config.checkLogging && (check.controlId === 'CC7.2' || check.controlId === 'CC7.3')) {
      return false;
    }
    if (!this.config.checkBackups && check.controlId === 'A1.1') {
      return false;
    }
    if (!this.config.checkChangeManagement && check.controlId === 'CC8.1') {
      return false;
    }
    return true;
  }

  /**
   * Create a finding from a pattern match
   */
  private createFinding(
    checkName: string,
    check: typeof SOC2_PATTERNS.weakAuthentication,
    filePath: string,
    content: string,
    match: RegExpMatchArray
  ): SOC2Finding {
    const lineNumber = this.getLineNumber(content, match.index!);

    return {
      id: `${checkName}-${this.findings.length}`,
      title: check.description,
      description: `${check.description} (${check.controlId})`,
      severity: check.severity,
      criteria: check.criteria,
      controlId: check.controlId,
      file: path.relative(this.config.rootPath, filePath),
      line: lineNumber,
      code: match[0],
      recommendation: check.recommendation,
      evidenceRequired: check.evidenceRequired,
      remediation: this.getRemediationSteps(check.controlId),
      references: [
        'https://www.aicpa.org/interestareas/frc/assuranceadvisoryservices/aicpasoc2report.html',
        'https://soc2.com/'
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
   * Get remediation steps for a control
   */
  private getRemediationSteps(controlId: string): string[] {
    const steps: Record<string, string[]> = {
      'CC6.1': [
        'Implement strong password policy (12+ chars, complexity)',
        'Enable multi-factor authentication (MFA)',
        'Use OAuth2/SAML for authentication',
        'Regular password rotation (90 days)'
      ],
      'CC6.2': [
        'Create access request workflow',
        'Require manager approval for access',
        'Document access justification',
        'Quarterly access reviews'
      ],
      'CC6.6': [
        'Automated access revocation on termination',
        'HR-IT system integration',
        'Offboarding checklist',
        'Immediate revocation for critical systems'
      ],
      'CC7.2': [
        'Log all security events (auth, access, changes)',
        'Centralized logging (SIEM)',
        'Retain logs for 1+ year',
        'Tamper-proof log storage'
      ],
      'CC7.3': [
        'Implement SIEM or log monitoring',
        'Alert rules for anomalies',
        'Failed login alerts (3+ failures)',
        'Unusual access pattern detection'
      ],
      'CC8.1': [
        'Change approval process',
        'Require pull request reviews',
        'Separate environments (dev/staging/prod)',
        'Change tickets/RFCs'
      ],
      'CC9.1': [
        'Dependency vulnerability scanning',
        'Regular security assessments',
        'Risk acceptance documentation',
        'Vulnerability management process'
      ],
      'C1.1': [
        'Encrypt data at rest (AES-256)',
        'Database encryption or app-level encryption',
        'Secure key management (HSM/KMS)',
        'Regular encryption audits'
      ],
      'C1.2': [
        'Use TLS 1.2+ for all transmissions',
        'Disable TLS 1.0/1.1',
        'Strong cipher suites only',
        'Certificate management process'
      ],
      'A1.1': [
        'Automated daily backups',
        'Offsite backup storage',
        'Quarterly restoration tests',
        'Document RTO/RPO targets'
      ],
      'A1.2': [
        'Uptime monitoring (99.9%+ target)',
        'Health check endpoints',
        'Alert on downtime',
        'Incident response playbooks'
      ],
      'P1.1': [
        'Input validation on all user input',
        'Schema validation (Joi, Yup)',
        'Sanitization to prevent injection',
        'Regular security testing'
      ],
      'P1.2': [
        'Comprehensive error logging',
        'Error monitoring and alerting',
        'Never expose stack traces to users',
        'Error rate tracking'
      ],
      'CC5.2': [
        'Separate roles: developer, approver, deployer',
        'Require peer review',
        'No direct prod access for developers',
        'Role-based access control (RBAC)'
      ],
      'CC4.1': [
        'Security metrics dashboard',
        'Monthly security reports to management',
        'KPI tracking (uptime, vulnerabilities, incidents)',
        'Regular management review'
      ],
      'PI1.1': [
        'Define data retention periods',
        'Automated data deletion',
        'Document in privacy policy',
        'Audit deletion logs'
      ]
    };
    return steps[controlId] ?? ['See SOC 2 guidance for remediation'];
  }

  /**
   * Generate summary statistics
   */
  private generateSummary(filesScanned: number, duration: number): SOC2ScanResult['summary'] {
    const bySeverity: Record<SOC2Severity, number> = {
      [SOC2Severity.CRITICAL]: 0,
      [SOC2Severity.HIGH]: 0,
      [SOC2Severity.MEDIUM]: 0,
      [SOC2Severity.LOW]: 0
    };

    const byCriteria: Record<SOC2Criteria, number> = {
      [SOC2Criteria.CC1_CONTROL_ENVIRONMENT]: 0,
      [SOC2Criteria.CC2_COMMUNICATION]: 0,
      [SOC2Criteria.CC3_RISK_ASSESSMENT]: 0,
      [SOC2Criteria.CC4_MONITORING]: 0,
      [SOC2Criteria.CC5_CONTROL_ACTIVITIES]: 0,
      [SOC2Criteria.CC6_ACCESS_CONTROLS]: 0,
      [SOC2Criteria.CC7_SYSTEM_OPERATIONS]: 0,
      [SOC2Criteria.CC8_CHANGE_MANAGEMENT]: 0,
      [SOC2Criteria.CC9_RISK_MITIGATION]: 0,
      [SOC2Criteria.A_AVAILABILITY]: 0,
      [SOC2Criteria.C_CONFIDENTIALITY]: 0,
      [SOC2Criteria.P_PROCESSING_INTEGRITY]: 0,
      [SOC2Criteria.PI_PRIVACY]: 0
    };

    let controlDeficiencies = 0;

    for (const finding of this.findings) {
      bySeverity[finding.severity]++;
      byCriteria[finding.criteria]++;
      
      if (finding.severity === SOC2Severity.CRITICAL) {
        controlDeficiencies++;
      }
    }

    // Calculate readiness score (100 - weighted by severity)
    const weights = {
      [SOC2Severity.CRITICAL]: 20, // Control deficiencies are weighted heavily
      [SOC2Severity.HIGH]: 10,
      [SOC2Severity.MEDIUM]: 4,
      [SOC2Severity.LOW]: 1
    };
    const totalPenalty = this.findings.reduce((sum, f) => sum + weights[f.severity], 0);
    const readinessScore = Math.max(0, 100 - totalPenalty);

    return {
      total: this.findings.length,
      bySeverity,
      byCriteria,
      controlDeficiencies,
      filesScanned,
      duration,
      readinessScore
    };
  }

  /**
   * Generate prioritized recommendations
   */
  private generateRecommendations(): SOC2ScanResult['recommendations'] {
    const immediate = this.findings
      .filter(f => f.severity === SOC2Severity.CRITICAL)
      .map(f => `${f.controlId} - ${f.title}: ${f.recommendation}`);

    const shortTerm = this.findings
      .filter(f => f.severity === SOC2Severity.HIGH)
      .map(f => `${f.controlId} - ${f.title}: ${f.recommendation}`);

    const longTerm = this.findings
      .filter(f => f.severity === SOC2Severity.MEDIUM || f.severity === SOC2Severity.LOW)
      .map(f => `${f.controlId} - ${f.title}: ${f.recommendation}`);

    return {
      immediate: [...new Set(immediate)],
      shortTerm: [...new Set(shortTerm)],
      longTerm: [...new Set(longTerm)]
    };
  }

  /**
   * Identify evidence gaps (documentation auditor will request)
   */
  private identifyEvidenceGaps(): SOC2ScanResult['evidenceGaps'] {
    const gapsByCriteria = new Map<SOC2Criteria, Set<string>>();

    for (const finding of this.findings) {
      if (!gapsByCriteria.has(finding.criteria)) {
        gapsByCriteria.set(finding.criteria, new Set());
      }
      for (const evidence of finding.evidenceRequired) {
        gapsByCriteria.get(finding.criteria)!.add(evidence);
      }
    }

    return Array.from(gapsByCriteria.entries()).map(([criteria, missing]) => ({
      criteria,
      missing: Array.from(missing)
    }));
  }

  /**
   * Export findings to JSON
   */
  exportToJSON(): string {
    return JSON.stringify({
      findings: this.findings,
      summary: this.generateSummary(0, 0),
      recommendations: this.generateRecommendations(),
      evidenceGaps: this.identifyEvidenceGaps(),
      metadata: {
        scanDate: new Date().toISOString(),
        auditorVersion: '1.0.0',
        reportType: this.config.reportType
      }
    }, null, 2);
  }
}

/**
 * Convenience function to run SOC 2 scan
 */
export async function runSOC2Scan(config: SOC2AuditorConfig): Promise<SOC2ScanResult> {
  const auditor = new SOC2Auditor(config);
  return auditor.scan();
}

/**
 * Quick SOC 2 readiness check for CI/CD
 */
export async function quickSOC2Check(rootPath: string): Promise<{ hasDeficiencies: boolean; score: number }> {
  const auditor = new SOC2Auditor({ rootPath });
  const result = await auditor.scan();
  
  return {
    hasDeficiencies: result.summary.controlDeficiencies > 0,
    score: result.summary.readinessScore
  };
}
