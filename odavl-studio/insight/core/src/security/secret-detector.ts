/**
 * Secret Detector - Find exposed secrets and credentials in code
 * 
 * Purpose: Detect hardcoded secrets, API keys, passwords, tokens
 * Week 27: Security Analysis (File 2/3)
 * 
 * Features:
 * - API key detection (AWS, GitHub, Stripe, etc.)
 * - Password pattern detection
 * - Private key detection (RSA, SSH, PGP)
 * - OAuth token detection
 * - Database connection strings
 * - JWT token detection
 * - Entropy analysis for high-entropy strings
 * - Git history scanning
 * 
 * @module @odavl-studio/core/security/secret-detector
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import { glob } from 'glob';
import * as crypto from 'crypto';

/**
 * Secret types that can be detected
 */
export enum SecretType {
  API_KEY = 'api-key',
  PASSWORD = 'password',
  PRIVATE_KEY = 'private-key',
  OAUTH_TOKEN = 'oauth-token',
  DATABASE_URL = 'database-url',
  JWT_TOKEN = 'jwt-token',
  AWS_CREDENTIALS = 'aws-credentials',
  GITHUB_TOKEN = 'github-token',
  STRIPE_KEY = 'stripe-key',
  GENERIC_SECRET = 'generic-secret'
}

/**
 * Confidence level for secret detection
 */
export enum SecretConfidence {
  HIGH = 'high',     // Definite secret (e.g., known API key pattern)
  MEDIUM = 'medium', // Likely secret (entropy + keyword match)
  LOW = 'low'        // Possible secret (entropy only)
}

/**
 * Detected secret finding
 */
export interface SecretFinding {
  id: string;
  type: SecretType;
  description: string;
  file: string;
  line: number;
  column?: number;
  secret: string;        // Redacted version (first 4 + last 4 chars)
  fullSecret?: string;   // Full secret (only if explicitly requested)
  confidence: SecretConfidence;
  entropy: number;       // Shannon entropy (0-8)
  pattern: string;       // Pattern name that matched
  recommendation: string;
  references: string[];
}

/**
 * Secret detector configuration
 */
export interface SecretDetectorConfig {
  rootPath: string;
  includePatterns?: string[];
  excludePatterns?: string[];
  minEntropy?: number;          // Minimum entropy (0-8, default: 4.5)
  checkGitHistory?: boolean;    // Scan git history for secrets
  includeTests?: boolean;       // Include test files (usually false)
  customPatterns?: SecretPattern[];
  redactSecrets?: boolean;      // Redact secrets in output (default: true)
}

/**
 * Custom secret pattern
 */
export interface SecretPattern {
  name: string;
  type: SecretType;
  pattern: RegExp;
  confidence: SecretConfidence;
  description: string;
}

/**
 * Secret scan result
 */
export interface SecretScanResult {
  findings: SecretFinding[];
  summary: {
    total: number;
    byType: Record<SecretType, number>;
    byConfidence: Record<SecretConfidence, number>;
    filesScanned: number;
    highRiskCount: number; // HIGH confidence findings
    duration: number;
  };
  metadata: {
    scanDate: Date;
    detectorVersion: string;
    configUsed: Partial<SecretDetectorConfig>;
  };
}

/**
 * Built-in secret patterns (high precision, low false positives)
 */
const SECRET_PATTERNS: SecretPattern[] = [
  // AWS
  {
    name: 'AWS Access Key ID',
    type: SecretType.AWS_CREDENTIALS,
    pattern: /AKIA[0-9A-Z]{16}/g,
    confidence: SecretConfidence.HIGH,
    description: 'AWS Access Key ID detected'
  },
  {
    name: 'AWS Secret Access Key',
    type: SecretType.AWS_CREDENTIALS,
    pattern: /aws[_-]?secret[_-]?access[_-]?key\s*[=:]\s*["']([A-Za-z0-9/+=]{40})["']/gi,
    confidence: SecretConfidence.HIGH,
    description: 'AWS Secret Access Key detected'
  },

  // GitHub
  {
    name: 'GitHub Personal Access Token',
    type: SecretType.GITHUB_TOKEN,
    pattern: /ghp_[A-Za-z0-9_]{36}/g,
    confidence: SecretConfidence.HIGH,
    description: 'GitHub Personal Access Token detected'
  },
  {
    name: 'GitHub OAuth Token',
    type: SecretType.GITHUB_TOKEN,
    pattern: /gho_[A-Za-z0-9_]{36}/g,
    confidence: SecretConfidence.HIGH,
    description: 'GitHub OAuth Token detected'
  },
  {
    name: 'GitHub App Token',
    type: SecretType.GITHUB_TOKEN,
    pattern: /(?:ghu|ghs)_[A-Za-z0-9_]{36}/g,
    confidence: SecretConfidence.HIGH,
    description: 'GitHub App/Refresh Token detected'
  },

  // Stripe
  {
    name: 'Stripe Secret Key',
    type: SecretType.STRIPE_KEY,
    pattern: /sk_live_[0-9a-zA-Z]{24}/g,
    confidence: SecretConfidence.HIGH,
    description: 'Stripe Live Secret Key detected'
  },
  {
    name: 'Stripe Restricted Key',
    type: SecretType.STRIPE_KEY,
    pattern: /rk_live_[0-9a-zA-Z]{24}/g,
    confidence: SecretConfidence.HIGH,
    description: 'Stripe Restricted Key detected'
  },

  // Generic API Keys
  {
    name: 'Generic API Key',
    type: SecretType.API_KEY,
    pattern: /(?:api[_-]?key|apikey|access[_-]?key)\s*[=:]\s*["']([A-Za-z0-9_-]{20,})["']/gi,
    confidence: SecretConfidence.MEDIUM,
    description: 'Generic API key detected'
  },

  // Private Keys
  {
    name: 'RSA Private Key',
    type: SecretType.PRIVATE_KEY,
    pattern: /-----BEGIN RSA PRIVATE KEY-----/g,
    confidence: SecretConfidence.HIGH,
    description: 'RSA private key detected'
  },
  {
    name: 'SSH Private Key',
    type: SecretType.PRIVATE_KEY,
    pattern: /-----BEGIN (?:OPENSSH|DSA|EC) PRIVATE KEY-----/g,
    confidence: SecretConfidence.HIGH,
    description: 'SSH private key detected'
  },
  {
    name: 'PGP Private Key',
    type: SecretType.PRIVATE_KEY,
    pattern: /-----BEGIN PGP PRIVATE KEY BLOCK-----/g,
    confidence: SecretConfidence.HIGH,
    description: 'PGP private key detected'
  },

  // OAuth
  {
    name: 'OAuth 2.0 Token',
    type: SecretType.OAUTH_TOKEN,
    pattern: /(?:access[_-]?token|bearer[_-]?token)\s*[=:]\s*["']([A-Za-z0-9_-]{40,})["']/gi,
    confidence: SecretConfidence.MEDIUM,
    description: 'OAuth 2.0 access token detected'
  },

  // Database URLs
  {
    name: 'Database Connection String',
    type: SecretType.DATABASE_URL,
    pattern: /(?:postgres|mysql|mongodb|redis):\/\/[^:]+:[^@]+@[^/]+/gi,
    confidence: SecretConfidence.HIGH,
    description: 'Database connection string with credentials detected'
  },

  // JWT
  {
    name: 'JWT Token',
    type: SecretType.JWT_TOKEN,
    pattern: /eyJ[A-Za-z0-9_-]+\.eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/g,
    confidence: SecretConfidence.MEDIUM,
    description: 'JWT token detected'
  },

  // Passwords
  {
    name: 'Password in Code',
    type: SecretType.PASSWORD,
    pattern: /(?:password|passwd|pwd)\s*[=:]\s*["']([^"'\n]{8,})["']/gi,
    confidence: SecretConfidence.MEDIUM,
    description: 'Hardcoded password detected'
  },

  // Generic Secrets
  {
    name: 'Generic Secret',
    type: SecretType.GENERIC_SECRET,
    pattern: /(?:secret|token|auth)\s*[=:]\s*["']([A-Za-z0-9_-]{32,})["']/gi,
    confidence: SecretConfidence.MEDIUM,
    description: 'Generic secret detected'
  }
];

/**
 * Keywords that indicate secrets (for entropy analysis)
 */
const SECRET_KEYWORDS = [
  'password', 'passwd', 'pwd', 'secret', 'token', 'api', 'key',
  'auth', 'credential', 'access', 'private', 'bearer'
];

/**
 * Secret Detector - Find exposed secrets in code
 */
export class SecretDetector {
  private config: Required<SecretDetectorConfig>;
  private findings: SecretFinding[] = [];

  constructor(config: SecretDetectorConfig) {
    this.config = {
      rootPath: config.rootPath,
      includePatterns: config.includePatterns ?? ['**/*'],
      excludePatterns: config.excludePatterns ?? [
        '**/node_modules/**',
        '**/dist/**',
        '**/build/**',
        '**/*.min.js',
        '**/*.test.*',
        '**/*.spec.*',
        '**/test/**',
        '**/tests/**'
      ],
      minEntropy: config.minEntropy ?? 4.5,
      checkGitHistory: config.checkGitHistory ?? false,
      includeTests: config.includeTests ?? false,
      customPatterns: config.customPatterns ?? [],
      redactSecrets: config.redactSecrets ?? true
    };
  }

  /**
   * Run secret detection scan
   */
  async scan(): Promise<SecretScanResult> {
    const startTime = Date.now();
    this.findings = [];

    // Find all files to scan
    const files = await this.findFiles();
    console.log(`🔍 Scanning ${files.length} files for exposed secrets...`);

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

    // Scan git history if enabled
    if (this.config.checkGitHistory) {
      console.log('📜 Scanning git history for secrets...');
      await this.scanGitHistory();
    }

    // Remove duplicates
    this.deduplicateFindings();

    // Generate summary
    const duration = Date.now() - startTime;
    const summary = this.generateSummary(filesScanned, duration);

    return {
      findings: this.findings,
      summary,
      metadata: {
        scanDate: new Date(),
        detectorVersion: '1.0.0',
        configUsed: this.config
      }
    };
  }

  /**
   * Find all files matching the include/exclude patterns
   */
  private async findFiles(): Promise<string[]> {
    const excludePatterns = this.config.includeTests
      ? this.config.excludePatterns.filter(p => !p.includes('test'))
      : this.config.excludePatterns;

    const allFiles: string[] = [];
    for (const pattern of this.config.includePatterns) {
      const files = await glob(pattern, {
        cwd: this.config.rootPath,
        ignore: excludePatterns,
        absolute: true,
        nodir: true,
        dot: true // Include dotfiles (e.g., .env)
      });
      allFiles.push(...files);
    }

    return [...new Set(allFiles)];
  }

  /**
   * Scan a single file for secrets
   */
  private async scanFile(filePath: string): Promise<void> {
    const content = await fs.readFile(filePath, 'utf-8');
    const lines = content.split('\n');

    // Scan with built-in patterns
    for (const pattern of SECRET_PATTERNS) {
      const matches = Array.from(content.matchAll(pattern.pattern));
      for (const match of matches) {
        const secret = match[1] ?? match[0]; // Use capture group if available
        const finding = this.createFinding(
          pattern,
          filePath,
          content,
          match,
          secret
        );
        this.findings.push(finding);
      }
    }

    // Scan with custom patterns
    for (const pattern of this.config.customPatterns) {
      const matches = Array.from(content.matchAll(pattern.pattern));
      for (const match of matches) {
        const secret = match[1] ?? match[0];
        const finding = this.createFinding(
          pattern,
          filePath,
          content,
          match,
          secret
        );
        this.findings.push(finding);
      }
    }

    // Entropy-based detection (find high-entropy strings)
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const highEntropyStrings = this.findHighEntropyStrings(line);
      
      for (const { value, entropy, index } of highEntropyStrings) {
        // Check if near a secret keyword
        const hasKeyword = SECRET_KEYWORDS.some(keyword => 
          line.toLowerCase().includes(keyword)
        );

        if (hasKeyword || entropy > 5.5) {
          const finding: SecretFinding = {
            id: `entropy-${this.findings.length}`,
            type: SecretType.GENERIC_SECRET,
            description: `High-entropy string detected (entropy: ${entropy.toFixed(2)})`,
            file: path.relative(this.config.rootPath, filePath),
            line: i + 1,
            column: index,
            secret: this.redactSecret(value),
            fullSecret: this.config.redactSecrets ? undefined : value,
            confidence: hasKeyword ? SecretConfidence.MEDIUM : SecretConfidence.LOW,
            entropy,
            pattern: 'entropy-analysis',
            recommendation: 'Verify if this is a secret. If so, move to environment variables or secure vault.',
            references: [
              'https://owasp.org/www-community/vulnerabilities/Use_of_hard-coded_password'
            ]
          };
          this.findings.push(finding);
        }
      }
    }
  }

  /**
   * Create a finding from a pattern match
   */
  private createFinding(
    pattern: SecretPattern,
    filePath: string,
    content: string,
    match: RegExpMatchArray,
    secret: string
  ): SecretFinding {
    const lineNumber = this.getLineNumber(content, match.index!);
    const entropy = this.calculateEntropy(secret);

    return {
      id: `${pattern.name.toLowerCase().replace(/\s+/g, '-')}-${this.findings.length}`,
      type: pattern.type,
      description: pattern.description,
      file: path.relative(this.config.rootPath, filePath),
      line: lineNumber,
      secret: this.redactSecret(secret),
      fullSecret: this.config.redactSecrets ? undefined : secret,
      confidence: pattern.confidence,
      entropy,
      pattern: pattern.name,
      recommendation: this.getRecommendation(pattern.type),
      references: [
        'https://owasp.org/www-community/vulnerabilities/Use_of_hard-coded_password',
        'https://cheatsheetseries.owasp.org/cheatsheets/Secrets_Management_Cheat_Sheet.html'
      ]
    };
  }

  /**
   * Redact secret (show first 4 and last 4 chars only)
   */
  private redactSecret(secret: string): string {
    if (!this.config.redactSecrets) {
      return secret;
    }

    if (secret.length <= 8) {
      return '***REDACTED***';
    }

    return `${secret.slice(0, 4)}***${secret.slice(-4)}`;
  }

  /**
   * Calculate Shannon entropy of a string
   * Returns value between 0 (no entropy) and 8 (maximum entropy for byte strings)
   */
  private calculateEntropy(str: string): number {
    if (str.length === 0) return 0;

    const freq: Record<string, number> = {};
    for (const char of str) {
      freq[char] = (freq[char] || 0) + 1;
    }

    let entropy = 0;
    const len = str.length;
    for (const count of Object.values(freq)) {
      const p = count / len;
      entropy -= p * Math.log2(p);
    }

    return entropy;
  }

  /**
   * Find high-entropy strings in a line
   */
  private findHighEntropyStrings(line: string): Array<{ value: string; entropy: number; index: number }> {
    const results: Array<{ value: string; entropy: number; index: number }> = [];
    
    // Match strings in quotes or after = : signs
    const stringPatterns = [
      /["']([A-Za-z0-9_\-+=\/]{20,})["']/g,
      /[=:]\s*([A-Za-z0-9_\-+=\/]{20,})\s*[,;\n]/g
    ];

    for (const pattern of stringPatterns) {
      const matches = Array.from(line.matchAll(pattern));
      for (const match of matches) {
        const value = match[1];
        const entropy = this.calculateEntropy(value);
        
        if (entropy >= this.config.minEntropy) {
          results.push({
            value,
            entropy,
            index: match.index! + line.indexOf(value, match.index!)
          });
        }
      }
    }

    return results;
  }

  /**
   * Get line number from string index
   */
  private getLineNumber(content: string, index: number): number {
    return content.substring(0, index).split('\n').length;
  }

  /**
   * Get recommendation based on secret type
   */
  private getRecommendation(type: SecretType): string {
    const recommendations: Record<SecretType, string> = {
      [SecretType.API_KEY]: 'Store API keys in environment variables (e.g., .env file) and use a secrets manager in production.',
      [SecretType.PASSWORD]: 'Never hardcode passwords. Use environment variables and secure password managers.',
      [SecretType.PRIVATE_KEY]: 'Private keys must NEVER be committed. Use SSH agents, key management services, or encrypted storage.',
      [SecretType.OAUTH_TOKEN]: 'Store OAuth tokens securely. Use token encryption and rotate regularly.',
      [SecretType.DATABASE_URL]: 'Use environment variables for database URLs. Never commit credentials to source control.',
      [SecretType.JWT_TOKEN]: 'JWT tokens should be stored securely (e.g., httpOnly cookies). Never expose in source code.',
      [SecretType.AWS_CREDENTIALS]: 'Use AWS IAM roles, not hardcoded credentials. Rotate keys immediately if exposed.',
      [SecretType.GITHUB_TOKEN]: 'Revoke this token immediately at github.com/settings/tokens. Use environment variables.',
      [SecretType.STRIPE_KEY]: 'Revoke this key immediately in Stripe dashboard. Use environment variables and test mode for development.',
      [SecretType.GENERIC_SECRET]: 'If this is a secret, move to environment variables or a secrets manager like HashiCorp Vault.'
    };
    return recommendations[type];
  }

  /**
   * Scan git history for secrets (requires git installed)
   */
  private async scanGitHistory(): Promise<void> {
    try {
      const { execSync } = await import('child_process');
      
      // Get all commits
      const commits = execSync('git log --all --format=%H', {
        cwd: this.config.rootPath,
        encoding: 'utf-8'
      }).trim().split('\n').slice(0, 100); // Limit to last 100 commits

      // Scan each commit
      for (const commit of commits) {
        try {
          // Get diff for commit
          const diff = execSync(`git show ${commit}`, {
            cwd: this.config.rootPath,
            encoding: 'utf-8'
          });

          // Scan diff content
          for (const pattern of SECRET_PATTERNS) {
            const matches = Array.from(diff.matchAll(pattern.pattern));
            for (const match of matches) {
              const secret = match[1] ?? match[0];
              const finding: SecretFinding = {
                id: `git-${commit.slice(0, 7)}-${this.findings.length}`,
                type: pattern.type,
                description: `${pattern.description} (found in git history)`,
                file: `git:${commit.slice(0, 7)}`,
                line: 0,
                secret: this.redactSecret(secret),
                fullSecret: this.config.redactSecrets ? undefined : secret,
                confidence: pattern.confidence,
                entropy: this.calculateEntropy(secret),
                pattern: pattern.name,
                recommendation: `${this.getRecommendation(pattern.type)} NOTE: This was found in git history - consider rewriting history with git-filter-repo.`,
                references: [
                  'https://github.com/newren/git-filter-repo',
                  'https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/removing-sensitive-data-from-a-repository'
                ]
              };
              this.findings.push(finding);
            }
          }
        } catch (error) {
          // Skip problematic commits
          continue;
        }
      }
    } catch (error) {
      console.warn('⚠️  Git history scan failed:', error instanceof Error ? error.message : error);
    }
  }

  /**
   * Remove duplicate findings (same secret in multiple places)
   */
  private deduplicateFindings(): void {
    const seen = new Set<string>();
    this.findings = this.findings.filter(finding => {
      const key = `${finding.type}-${finding.secret}`;
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
  }

  /**
   * Generate summary statistics
   */
  private generateSummary(filesScanned: number, duration: number): SecretScanResult['summary'] {
    const byType: Record<SecretType, number> = {
      [SecretType.API_KEY]: 0,
      [SecretType.PASSWORD]: 0,
      [SecretType.PRIVATE_KEY]: 0,
      [SecretType.OAUTH_TOKEN]: 0,
      [SecretType.DATABASE_URL]: 0,
      [SecretType.JWT_TOKEN]: 0,
      [SecretType.AWS_CREDENTIALS]: 0,
      [SecretType.GITHUB_TOKEN]: 0,
      [SecretType.STRIPE_KEY]: 0,
      [SecretType.GENERIC_SECRET]: 0
    };

    const byConfidence: Record<SecretConfidence, number> = {
      [SecretConfidence.HIGH]: 0,
      [SecretConfidence.MEDIUM]: 0,
      [SecretConfidence.LOW]: 0
    };

    let highRiskCount = 0;

    for (const finding of this.findings) {
      byType[finding.type]++;
      byConfidence[finding.confidence]++;
      
      if (finding.confidence === SecretConfidence.HIGH) {
        highRiskCount++;
      }
    }

    return {
      total: this.findings.length,
      byType,
      byConfidence,
      filesScanned,
      highRiskCount,
      duration
    };
  }

  /**
   * Export findings to JSON format
   */
  exportToJSON(): string {
    return JSON.stringify({
      findings: this.findings,
      summary: this.generateSummary(0, 0),
      metadata: {
        scanDate: new Date().toISOString(),
        detectorVersion: '1.0.0'
      }
    }, null, 2);
  }

  /**
   * Export findings to CSV format
   */
  exportToCSV(): string {
    const headers = ['Type', 'Confidence', 'File', 'Line', 'Description', 'Recommendation'];
    const rows = this.findings.map(f => [
      f.type,
      f.confidence,
      f.file,
      f.line.toString(),
      f.description,
      f.recommendation.replace(/,/g, ';') // Escape commas
    ]);

    return [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');
  }
}

/**
 * Convenience function to run a secret scan
 */
export async function runSecretScan(config: SecretDetectorConfig): Promise<SecretScanResult> {
  const detector = new SecretDetector(config);
  return detector.scan();
}

/**
 * Quick scan function for CI/CD environments
 */
export async function quickSecretScan(rootPath: string): Promise<boolean> {
  const detector = new SecretDetector({
    rootPath,
    minEntropy: 5.0, // Higher threshold for CI
    checkGitHistory: false // Skip git history for speed
  });

  const result = await detector.scan();
  
  // Return true if any HIGH confidence secrets found
  return result.summary.highRiskCount > 0;
}
