/**
 * SAST Engine - Static Application Security Testing
 * 
 * Purpose: Detect security vulnerabilities in source code
 * Week 27: Security Analysis (File 1/3)
 * 
 * Features:
 * - SQL Injection detection
 * - XSS (Cross-Site Scripting) detection
 * - Command Injection detection
 * - Path Traversal detection
 * - Insecure Deserialization detection
 * - Hardcoded Credentials detection
 * - Weak Cryptography detection
 * - OWASP Top 10 coverage
 * 
 * @module @odavl-studio/core/security/sast-engine
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import { glob } from 'glob';

/**
 * Severity levels for security vulnerabilities
 */
export enum SecuritySeverity {
  CRITICAL = 'critical',
  HIGH = 'high',
  MEDIUM = 'medium',
  LOW = 'low',
  INFO = 'info'
}

/**
 * OWASP Top 10 vulnerability categories
 */
export enum OWASPCategory {
  A01_BROKEN_ACCESS_CONTROL = 'A01:2021-Broken Access Control',
  A02_CRYPTOGRAPHIC_FAILURES = 'A02:2021-Cryptographic Failures',
  A03_INJECTION = 'A03:2021-Injection',
  A04_INSECURE_DESIGN = 'A04:2021-Insecure Design',
  A05_SECURITY_MISCONFIGURATION = 'A05:2021-Security Misconfiguration',
  A06_VULNERABLE_COMPONENTS = 'A06:2021-Vulnerable and Outdated Components',
  A07_AUTH_FAILURES = 'A07:2021-Identification and Authentication Failures',
  A08_DATA_INTEGRITY = 'A08:2021-Software and Data Integrity Failures',
  A09_LOGGING_FAILURES = 'A09:2021-Security Logging and Monitoring Failures',
  A10_SSRF = 'A10:2021-Server-Side Request Forgery'
}

/**
 * Security vulnerability finding
 */
export interface SecurityFinding {
  id: string;
  title: string;
  description: string;
  severity: SecuritySeverity;
  category: OWASPCategory;
  file: string;
  line: number;
  column?: number;
  code: string;
  recommendation: string;
  cwe?: string; // CWE ID (e.g., CWE-89 for SQL Injection)
  confidence: 'high' | 'medium' | 'low';
  references: string[];
}

/**
 * SAST scan configuration
 */
export interface SASTConfig {
  rootPath: string;
  includePatterns?: string[];
  excludePatterns?: string[];
  enabledCategories?: OWASPCategory[];
  minSeverity?: SecuritySeverity;
  maxFindings?: number;
  customRules?: SecurityRule[];
}

/**
 * Custom security rule definition
 */
export interface SecurityRule {
  id: string;
  name: string;
  description: string;
  severity: SecuritySeverity;
  category: OWASPCategory;
  pattern: RegExp;
  languages: string[];
  recommendation: string;
  cwe?: string;
}

/**
 * SAST scan result
 */
export interface SASTResult {
  findings: SecurityFinding[];
  summary: {
    total: number;
    bySeverity: Record<SecuritySeverity, number>;
    byCategory: Record<OWASPCategory, number>;
    filesScanned: number;
    duration: number;
  };
  metadata: {
    scanDate: Date;
    engineVersion: string;
    configUsed: Partial<SASTConfig>;
  };
}

/**
 * Built-in security patterns for different vulnerability types
 */
const SECURITY_PATTERNS = {
  // A03: SQL Injection
  sqlInjection: [
    {
      id: 'sql-injection-concatenation',
      pattern: /(?:execute|query|select|insert|update|delete)\s*\(\s*["'`][^"'`]*\+[^"'`]*["'`]/gi,
      languages: ['javascript', 'typescript', 'python', 'java', 'csharp'],
      cwe: 'CWE-89',
      confidence: 'high' as const
    },
    {
      id: 'sql-injection-template',
      pattern: /(?:execute|query|select|insert|update|delete)\s*\(\s*`[^`]*\$\{[^}]+\}[^`]*`/gi,
      languages: ['javascript', 'typescript'],
      cwe: 'CWE-89',
      confidence: 'medium' as const
    },
    {
      id: 'sql-injection-format',
      pattern: /(?:execute|query|select|insert|update|delete)\s*\(\s*(?:String\.format|f["'])[^)]*%[sd]/gi,
      languages: ['python', 'java', 'csharp'],
      cwe: 'CWE-89',
      confidence: 'high' as const
    }
  ],

  // A03: XSS (Cross-Site Scripting)
  xss: [
    {
      id: 'xss-innerhtml',
      pattern: /\.innerHTML\s*=\s*(?!["'`])[^;]+/gi,
      languages: ['javascript', 'typescript'],
      cwe: 'CWE-79',
      confidence: 'high' as const
    },
    {
      id: 'xss-dangerouslysetinnerhtml',
      pattern: /dangerouslySetInnerHTML\s*=\s*\{\s*__html:\s*[^}]+\}/gi,
      languages: ['javascript', 'typescript'],
      cwe: 'CWE-79',
      confidence: 'medium' as const
    },
    {
      id: 'xss-eval',
      pattern: /\beval\s*\([^)]*(?:req\.|request\.|params\.|query\.|body\.)[^)]*\)/gi,
      languages: ['javascript', 'typescript', 'python'],
      cwe: 'CWE-95',
      confidence: 'high' as const
    }
  ],

  // A03: Command Injection
  commandInjection: [
    {
      id: 'command-injection-exec',
      pattern: /(?:exec|spawn|execSync|spawnSync|execFile)\s*\([^)]*(?:req\.|request\.|params\.|query\.|body\.)[^)]*\)/gi,
      languages: ['javascript', 'typescript'],
      cwe: 'CWE-78',
      confidence: 'high' as const
    },
    {
      id: 'command-injection-system',
      pattern: /(?:os\.system|subprocess\.call|subprocess\.run)\s*\([^)]*(?:request\.|args\.|input\()[^)]*\)/gi,
      languages: ['python'],
      cwe: 'CWE-78',
      confidence: 'high' as const
    },
    {
      id: 'command-injection-runtime',
      pattern: /Runtime\.getRuntime\(\)\.exec\s*\([^)]*(?:request\.|getParameter\()[^)]*\)/gi,
      languages: ['java'],
      cwe: 'CWE-78',
      confidence: 'high' as const
    }
  ],

  // A01: Path Traversal
  pathTraversal: [
    {
      id: 'path-traversal-file-access',
      pattern: /(?:readFile|writeFile|createReadStream|createWriteStream)\s*\([^)]*(?:req\.|request\.|params\.|query\.)[^)]*\)/gi,
      languages: ['javascript', 'typescript'],
      cwe: 'CWE-22',
      confidence: 'high' as const
    },
    {
      id: 'path-traversal-concatenation',
      pattern: /(?:__dirname|process\.cwd\(\))\s*\+\s*(?:req\.|request\.|params\.|query\.)/gi,
      languages: ['javascript', 'typescript'],
      cwe: 'CWE-22',
      confidence: 'medium' as const
    }
  ],

  // A08: Insecure Deserialization
  insecureDeserialization: [
    {
      id: 'insecure-deserialization-pickle',
      pattern: /pickle\.loads?\s*\([^)]*(?:request\.|input\()[^)]*\)/gi,
      languages: ['python'],
      cwe: 'CWE-502',
      confidence: 'high' as const
    },
    {
      id: 'insecure-deserialization-yaml',
      pattern: /yaml\.load\s*\([^)]*(?:request\.|input\()[^)]*\)/gi,
      languages: ['python', 'javascript', 'typescript'],
      cwe: 'CWE-502',
      confidence: 'high' as const
    },
    {
      id: 'insecure-deserialization-objectinputstream',
      pattern: /ObjectInputStream\s*\([^)]*\)\.readObject\(\)/gi,
      languages: ['java'],
      cwe: 'CWE-502',
      confidence: 'medium' as const
    }
  ],

  // A07: Hardcoded Credentials
  hardcodedCredentials: [
    {
      id: 'hardcoded-password',
      pattern: /(?:password|passwd|pwd)\s*[=:]\s*["'][^"']{8,}["']/gi,
      languages: ['javascript', 'typescript', 'python', 'java', 'csharp'],
      cwe: 'CWE-798',
      confidence: 'medium' as const
    },
    {
      id: 'hardcoded-api-key',
      pattern: /(?:api[_-]?key|apikey|access[_-]?key)\s*[=:]\s*["'][A-Za-z0-9_-]{20,}["']/gi,
      languages: ['javascript', 'typescript', 'python', 'java', 'csharp'],
      cwe: 'CWE-798',
      confidence: 'high' as const
    },
    {
      id: 'hardcoded-secret',
      pattern: /(?:secret|token|auth)\s*[=:]\s*["'][A-Za-z0-9_-]{32,}["']/gi,
      languages: ['javascript', 'typescript', 'python', 'java', 'csharp'],
      cwe: 'CWE-798',
      confidence: 'medium' as const
    }
  ],

  // A02: Weak Cryptography
  weakCryptography: [
    {
      id: 'weak-crypto-md5',
      pattern: /(?:createHash|hashlib\.md5|MessageDigest\.getInstance)\s*\(\s*["']md5["']\s*\)/gi,
      languages: ['javascript', 'typescript', 'python', 'java'],
      cwe: 'CWE-327',
      confidence: 'high' as const
    },
    {
      id: 'weak-crypto-sha1',
      pattern: /(?:createHash|hashlib\.sha1|MessageDigest\.getInstance)\s*\(\s*["']sha1["']\s*\)/gi,
      languages: ['javascript', 'typescript', 'python', 'java'],
      cwe: 'CWE-327',
      confidence: 'high' as const
    },
    {
      id: 'weak-crypto-des',
      pattern: /(?:createCipher|Cipher\.getInstance)\s*\(\s*["'](?:DES|3DES)["']/gi,
      languages: ['javascript', 'typescript', 'java'],
      cwe: 'CWE-327',
      confidence: 'high' as const
    }
  ],

  // A05: Security Misconfiguration
  securityMisconfiguration: [
    {
      id: 'debug-mode-enabled',
      pattern: /(?:DEBUG|debug)\s*[=:]\s*(?:true|True|1)/gi,
      languages: ['javascript', 'typescript', 'python', 'java', 'csharp'],
      cwe: 'CWE-489',
      confidence: 'low' as const
    },
    {
      id: 'cors-wildcard',
      pattern: /(?:Access-Control-Allow-Origin|allowedOrigins)\s*[=:]\s*["']\*["']/gi,
      languages: ['javascript', 'typescript', 'python', 'java', 'csharp'],
      cwe: 'CWE-942',
      confidence: 'medium' as const
    },
    {
      id: 'insecure-cookie',
      pattern: /(?:res\.cookie|response\.set_cookie)\s*\([^)]*secure\s*[=:]\s*false/gi,
      languages: ['javascript', 'typescript', 'python'],
      cwe: 'CWE-614',
      confidence: 'medium' as const
    }
  ],

  // A09: Insufficient Logging
  insufficientLogging: [
    {
      id: 'missing-error-logging',
      pattern: /catch\s*\([^)]*\)\s*\{[^}]*\}/gi,
      languages: ['javascript', 'typescript', 'python', 'java', 'csharp'],
      cwe: 'CWE-778',
      confidence: 'low' as const
    }
  ],

  // A10: SSRF (Server-Side Request Forgery)
  ssrf: [
    {
      id: 'ssrf-fetch-user-input',
      pattern: /(?:fetch|axios\.get|requests\.get|http\.get)\s*\([^)]*(?:req\.|request\.|params\.|query\.)[^)]*\)/gi,
      languages: ['javascript', 'typescript', 'python'],
      cwe: 'CWE-918',
      confidence: 'high' as const
    }
  ]
};

/**
 * Mapping of vulnerability types to OWASP categories and severity
 */
const VULNERABILITY_METADATA = {
  sqlInjection: {
    category: OWASPCategory.A03_INJECTION,
    severity: SecuritySeverity.CRITICAL,
    title: 'SQL Injection Vulnerability',
    recommendation: 'Use parameterized queries or prepared statements. Never concatenate user input directly into SQL queries.'
  },
  xss: {
    category: OWASPCategory.A03_INJECTION,
    severity: SecuritySeverity.HIGH,
    title: 'Cross-Site Scripting (XSS) Vulnerability',
    recommendation: 'Sanitize user input before rendering. Use a templating engine that escapes HTML by default.'
  },
  commandInjection: {
    category: OWASPCategory.A03_INJECTION,
    severity: SecuritySeverity.CRITICAL,
    title: 'Command Injection Vulnerability',
    recommendation: 'Avoid executing shell commands with user input. Use safer alternatives or strict input validation.'
  },
  pathTraversal: {
    category: OWASPCategory.A01_BROKEN_ACCESS_CONTROL,
    severity: SecuritySeverity.HIGH,
    title: 'Path Traversal Vulnerability',
    recommendation: 'Validate and sanitize file paths. Use allowlists and check for directory traversal sequences (..).'
  },
  insecureDeserialization: {
    category: OWASPCategory.A08_DATA_INTEGRITY,
    severity: SecuritySeverity.HIGH,
    title: 'Insecure Deserialization',
    recommendation: 'Use safe deserialization methods. Validate input before deserialization. Use JSON instead of pickle/YAML.'
  },
  hardcodedCredentials: {
    category: OWASPCategory.A07_AUTH_FAILURES,
    severity: SecuritySeverity.CRITICAL,
    title: 'Hardcoded Credentials',
    recommendation: 'Use environment variables or secure vaults for secrets. Never commit credentials to version control.'
  },
  weakCryptography: {
    category: OWASPCategory.A02_CRYPTOGRAPHIC_FAILURES,
    severity: SecuritySeverity.HIGH,
    title: 'Weak Cryptographic Algorithm',
    recommendation: 'Use modern algorithms: SHA-256/SHA-3 for hashing, AES-256 for encryption. Avoid MD5, SHA-1, DES.'
  },
  securityMisconfiguration: {
    category: OWASPCategory.A05_SECURITY_MISCONFIGURATION,
    severity: SecuritySeverity.MEDIUM,
    title: 'Security Misconfiguration',
    recommendation: 'Follow security best practices. Disable debug mode in production. Use secure cookie flags.'
  },
  insufficientLogging: {
    category: OWASPCategory.A09_LOGGING_FAILURES,
    severity: SecuritySeverity.LOW,
    title: 'Insufficient Logging',
    recommendation: 'Log security-relevant events. Include error details for debugging while protecting sensitive data.'
  },
  ssrf: {
    category: OWASPCategory.A10_SSRF,
    severity: SecuritySeverity.HIGH,
    title: 'Server-Side Request Forgery (SSRF)',
    recommendation: 'Validate and sanitize URLs. Use allowlists for allowed hosts. Disable redirects for external requests.'
  }
};

/**
 * SAST Engine - Static Application Security Testing
 */
export class SASTEngine {
  private config: Required<SASTConfig>;
  private findings: SecurityFinding[] = [];

  constructor(config: SASTConfig) {
    this.config = {
      rootPath: config.rootPath,
      includePatterns: config.includePatterns ?? ['**/*.{ts,js,py,java,cs,go,rs}'],
      excludePatterns: config.excludePatterns ?? ['**/node_modules/**', '**/dist/**', '**/build/**', '**/*.test.*', '**/*.spec.*'],
      enabledCategories: config.enabledCategories ?? Object.values(OWASPCategory),
      minSeverity: config.minSeverity ?? SecuritySeverity.LOW,
      maxFindings: config.maxFindings ?? 1000,
      customRules: config.customRules ?? []
    };
  }

  /**
   * Run SAST scan on the configured codebase
   */
  async scan(): Promise<SASTResult> {
    const startTime = Date.now();
    this.findings = [];

    // Find all files to scan
    const files = await this.findFiles();
    console.log(`📂 Scanning ${files.length} files for security vulnerabilities...`);

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

    // Apply filters
    this.applyFilters();

    // Generate summary
    const duration = Date.now() - startTime;
    const summary = this.generateSummary(filesScanned, duration);

    return {
      findings: this.findings,
      summary,
      metadata: {
        scanDate: new Date(),
        engineVersion: '1.0.0',
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

    // Remove duplicates
    return [...new Set(allFiles)];
  }

  /**
   * Scan a single file for security vulnerabilities
   */
  private async scanFile(filePath: string): Promise<void> {
    const content = await fs.readFile(filePath, 'utf-8');
    const language = this.detectLanguage(filePath);

    // Scan with built-in patterns
    for (const [vulnerabilityType, patterns] of Object.entries(SECURITY_PATTERNS)) {
      for (const pattern of patterns) {
        // Skip if language doesn't match
        if (!pattern.languages.includes(language)) {
          continue;
        }

        // Find matches
        const matches = Array.from(content.matchAll(pattern.pattern));
        for (const match of matches) {
          const finding = this.createFinding(
            vulnerabilityType,
            pattern,
            filePath,
            content,
            match
          );
          this.findings.push(finding);
        }
      }
    }

    // Scan with custom rules
    for (const rule of this.config.customRules) {
      if (!rule.languages.includes(language)) {
        continue;
      }

      const matches = Array.from(content.matchAll(rule.pattern));
      for (const match of matches) {
        const finding: SecurityFinding = {
          id: `custom-${rule.id}-${this.findings.length}`,
          title: rule.name,
          description: rule.description,
          severity: rule.severity,
          category: rule.category,
          file: path.relative(this.config.rootPath, filePath),
          line: this.getLineNumber(content, match.index!),
          code: match[0],
          recommendation: rule.recommendation,
          cwe: rule.cwe,
          confidence: 'medium',
          references: []
        };
        this.findings.push(finding);
      }
    }
  }

  /**
   * Create a finding from a pattern match
   */
  private createFinding(
    vulnerabilityType: string,
    pattern: typeof SECURITY_PATTERNS.sqlInjection[0],
    filePath: string,
    content: string,
    match: RegExpMatchArray
  ): SecurityFinding {
    const metadata = VULNERABILITY_METADATA[vulnerabilityType as keyof typeof VULNERABILITY_METADATA];
    const lineNumber = this.getLineNumber(content, match.index!);

    return {
      id: `${pattern.id}-${this.findings.length}`,
      title: metadata.title,
      description: `${metadata.title} detected at line ${lineNumber}`,
      severity: metadata.severity,
      category: metadata.category,
      file: path.relative(this.config.rootPath, filePath),
      line: lineNumber,
      code: match[0],
      recommendation: metadata.recommendation,
      cwe: pattern.cwe,
      confidence: pattern.confidence,
      references: [
        `https://owasp.org/Top10/`,
        `https://cwe.mitre.org/data/definitions/${pattern.cwe?.replace('CWE-', '')}.html`
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
   * Detect programming language from file extension
   */
  private detectLanguage(filePath: string): string {
    const ext = path.extname(filePath).toLowerCase();
    const languageMap: Record<string, string> = {
      '.ts': 'typescript',
      '.tsx': 'typescript',
      '.js': 'javascript',
      '.jsx': 'javascript',
      '.py': 'python',
      '.java': 'java',
      '.cs': 'csharp',
      '.go': 'go',
      '.rs': 'rust'
    };
    return languageMap[ext] ?? 'unknown';
  }

  /**
   * Apply severity and category filters
   */
  private applyFilters(): void {
    const severityOrder = [
      SecuritySeverity.CRITICAL,
      SecuritySeverity.HIGH,
      SecuritySeverity.MEDIUM,
      SecuritySeverity.LOW,
      SecuritySeverity.INFO
    ];
    const minSeverityIndex = severityOrder.indexOf(this.config.minSeverity);

    this.findings = this.findings.filter(finding => {
      // Filter by severity
      const findingSeverityIndex = severityOrder.indexOf(finding.severity);
      if (findingSeverityIndex > minSeverityIndex) {
        return false;
      }

      // Filter by category
      if (!this.config.enabledCategories.includes(finding.category)) {
        return false;
      }

      return true;
    });

    // Limit findings
    if (this.findings.length > this.config.maxFindings) {
      this.findings = this.findings.slice(0, this.config.maxFindings);
    }
  }

  /**
   * Generate summary statistics
   */
  private generateSummary(filesScanned: number, duration: number): SASTResult['summary'] {
    const bySeverity: Record<SecuritySeverity, number> = {
      [SecuritySeverity.CRITICAL]: 0,
      [SecuritySeverity.HIGH]: 0,
      [SecuritySeverity.MEDIUM]: 0,
      [SecuritySeverity.LOW]: 0,
      [SecuritySeverity.INFO]: 0
    };

    const byCategory: Record<OWASPCategory, number> = {
      [OWASPCategory.A01_BROKEN_ACCESS_CONTROL]: 0,
      [OWASPCategory.A02_CRYPTOGRAPHIC_FAILURES]: 0,
      [OWASPCategory.A03_INJECTION]: 0,
      [OWASPCategory.A04_INSECURE_DESIGN]: 0,
      [OWASPCategory.A05_SECURITY_MISCONFIGURATION]: 0,
      [OWASPCategory.A06_VULNERABLE_COMPONENTS]: 0,
      [OWASPCategory.A07_AUTH_FAILURES]: 0,
      [OWASPCategory.A08_DATA_INTEGRITY]: 0,
      [OWASPCategory.A09_LOGGING_FAILURES]: 0,
      [OWASPCategory.A10_SSRF]: 0
    };

    for (const finding of this.findings) {
      bySeverity[finding.severity]++;
      byCategory[finding.category]++;
    }

    return {
      total: this.findings.length,
      bySeverity,
      byCategory,
      filesScanned,
      duration
    };
  }

  /**
   * Export findings to SARIF format (Static Analysis Results Interchange Format)
   */
  exportToSARIF(): object {
    return {
      version: '2.1.0',
      $schema: 'https://raw.githubusercontent.com/oasis-tcs/sarif-spec/master/Schemata/sarif-schema-2.1.0.json',
      runs: [
        {
          tool: {
            driver: {
              name: 'ODAVL SAST Engine',
              version: '1.0.0',
              informationUri: 'https://odavl.dev',
              rules: this.generateSARIFRules()
            }
          },
          results: this.findings.map(finding => ({
            ruleId: finding.id,
            level: this.severityToSARIFLevel(finding.severity),
            message: {
              text: finding.description
            },
            locations: [
              {
                physicalLocation: {
                  artifactLocation: {
                    uri: finding.file
                  },
                  region: {
                    startLine: finding.line,
                    startColumn: finding.column
                  }
                }
              }
            ],
            properties: {
              category: finding.category,
              cwe: finding.cwe,
              confidence: finding.confidence
            }
          }))
        }
      ]
    };
  }

  /**
   * Generate SARIF rules from findings
   */
  private generateSARIFRules(): object[] {
    const uniqueRules = new Map<string, SecurityFinding>();
    for (const finding of this.findings) {
      if (!uniqueRules.has(finding.id)) {
        uniqueRules.set(finding.id, finding);
      }
    }

    return Array.from(uniqueRules.values()).map(finding => ({
      id: finding.id,
      name: finding.title,
      shortDescription: {
        text: finding.description
      },
      fullDescription: {
        text: `${finding.description}\n\nRecommendation: ${finding.recommendation}`
      },
      help: {
        text: finding.recommendation,
        markdown: `## ${finding.title}\n\n${finding.recommendation}\n\n**References:**\n${finding.references.map(r => `- ${r}`).join('\n')}`
      },
      properties: {
        category: finding.category,
        severity: finding.severity,
        cwe: finding.cwe
      }
    }));
  }

  /**
   * Convert ODAVL severity to SARIF level
   */
  private severityToSARIFLevel(severity: SecuritySeverity): string {
    const mapping: Record<SecuritySeverity, string> = {
      [SecuritySeverity.CRITICAL]: 'error',
      [SecuritySeverity.HIGH]: 'error',
      [SecuritySeverity.MEDIUM]: 'warning',
      [SecuritySeverity.LOW]: 'note',
      [SecuritySeverity.INFO]: 'note'
    };
    return mapping[severity];
  }
}

/**
 * Convenience function to run a SAST scan
 */
export async function runSASTScan(config: SASTConfig): Promise<SASTResult> {
  const engine = new SASTEngine(config);
  return engine.scan();
}
