/**
 * @fileoverview Detects security vulnerabilities in PHP code
 * OWASP Top 10 coverage: SQL injection, XSS, CSRF, etc.
 */

import { PhpBaseDetector, type PhpDetectorOptions, type PhpIssue } from './php-base-detector';
import type { DetectorResult } from '../../types';

export class SecurityDetector extends PhpBaseDetector {
  constructor(options: PhpDetectorOptions = {}) {
    super(options);
  }

  async detect(filePath: string, content: string): Promise<DetectorResult> {
    if (!this.isPhpFile(filePath)) {
      return { issues: [], duration: 0, detectorName: 'security' };
    }

    const issues: PhpIssue[] = [];
    const lines = content.split('\n');

    // SQL Injection detection
    this.detectSqlInjection(lines, filePath, issues);

    // XSS detection
    this.detectXss(lines, filePath, issues);

    // CSRF detection
    this.detectCsrf(lines, filePath, issues);

    // File inclusion vulnerabilities
    this.detectFileInclusion(lines, filePath, issues);

    // Command injection
    this.detectCommandInjection(lines, filePath, issues);

    // Insecure cryptography
    this.detectInsecureCrypto(lines, filePath, issues);

    return {
      issues,
      duration: 0,
      detectorName: 'security',
    };
  }

  /**
   * Detect SQL injection vulnerabilities
   */
  private detectSqlInjection(
    lines: string[],
    filePath: string,
    issues: PhpIssue[]
  ): void {
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // Pattern: Direct variable in SQL query
      if (
        /(?:mysql_query|mysqli_query|query)\s*\([^)]*\$_(?:GET|POST|REQUEST|COOKIE)/i.test(line) ||
        /(?:SELECT|INSERT|UPDATE|DELETE).*\$_(?:GET|POST|REQUEST)/i.test(line)
      ) {
        issues.push(
          this.createIssue(
            'security',
            'SQL Injection: User input directly in query - use prepared statements',
            filePath,
            i + 1,
            line.search(/\$_(?:GET|POST|REQUEST|COOKIE)/), 'critical' ,
            'security-detector',
            undefined,
            'Use PDO prepared statements: $stmt = $pdo->prepare("..."); $stmt->execute([$param]);'
          )
        );
      }

      // Pattern: String concatenation in query
      if (/(?:SELECT|INSERT|UPDATE|DELETE).*\..*\$/.test(line)) {
        issues.push(
          this.createIssue(
            'security',
            'SQL Injection risk: String concatenation in query',
            filePath,
            i + 1,
            line.indexOf('$'), 'high' ,
            'security-detector',
            undefined,
            'Use parameterized queries instead of concatenation'
          )
        );
      }
    }
  }

  /**
   * Detect Cross-Site Scripting (XSS) vulnerabilities
   */
  private detectXss(
    lines: string[],
    filePath: string,
    issues: PhpIssue[]
  ): void {
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // Pattern: Unescaped echo of user input
      if (/echo\s+\$_(?:GET|POST|REQUEST|COOKIE)/.test(line) && !/htmlspecialchars|htmlentities/.test(line)) {
        issues.push(
          this.createIssue(
            'security',
            'XSS: Unescaped user input echoed directly',
            filePath,
            i + 1,
            line.indexOf('echo'), 'critical' ,
            'security-detector',
            undefined,
            'Use htmlspecialchars($_GET[...], ENT_QUOTES, "UTF-8")'
          )
        );
      }

      // Pattern: innerHTML-like operations
      if (/innerHTML|outerHTML/.test(line) && /\$/.test(line)) {
        issues.push(
          this.createIssue(
            'security',
            'XSS: Dynamic HTML content - sanitize user input',
            filePath,
            i + 1,
            line.indexOf('innerHTML'), 'high' ,
            'security-detector',
            undefined,
            'Sanitize with htmlspecialchars() or use textContent'
          )
        );
      }
    }
  }

  /**
   * Detect CSRF vulnerabilities
   */
  private detectCsrf(
    lines: string[],
    filePath: string,
    issues: PhpIssue[]
  ): void {
    let hasFormPost = false;
    let hasCsrfToken = false;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // Check for POST forms
      if (/<form[^>]*method\s*=\s*["']post["']/i.test(line)) {
        hasFormPost = true;
      }

      // Check for CSRF token
      if (/csrf|token|_token/.test(line)) {
        hasCsrfToken = true;
      }
    }

    if (hasFormPost && !hasCsrfToken) {
      issues.push(
        this.createIssue(
          'security',
          'CSRF: POST form without CSRF token protection',
          filePath,
          1,
          0, 'critical' ,
          'security-detector',
          undefined,
          'Add CSRF token: <input type="hidden" name="csrf_token" value="<?= $_SESSION[\'csrf_token\'] ?>">'
        )
      );
    }
  }

  /**
   * Detect file inclusion vulnerabilities
   */
  private detectFileInclusion(
    lines: string[],
    filePath: string,
    issues: PhpIssue[]
  ): void {
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // Pattern: include/require with user input
      if (
        /(?:include|require)(?:_once)?\s*\([^)]*\$_(?:GET|POST|REQUEST)/i.test(line)
      ) {
        issues.push(
          this.createIssue(
            'security',
            'File Inclusion: User input in include/require - Remote Code Execution risk',
            filePath,
            i + 1,
            line.search(/include|require/i), 'critical' ,
            'security-detector',
            undefined,
            'Whitelist allowed files or validate against absolute path'
          )
        );
      }
    }
  }

  /**
   * Detect command injection vulnerabilities
   */
  private detectCommandInjection(
    lines: string[],
    filePath: string,
    issues: PhpIssue[]
  ): void {
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // Pattern: shell_exec, exec, system with user input
      if (
        /(?:shell_exec|exec|system|passthru|popen|proc_open)\s*\([^)]*\$_(?:GET|POST|REQUEST)/i.test(line)
      ) {
        issues.push(
          this.createIssue(
            'security',
            'Command Injection: User input in shell command',
            filePath,
            i + 1,
            line.search(/shell_exec|exec|system/i), 'critical' ,
            'security-detector',
            undefined,
            'Use escapeshellarg() or escapeshellcmd(), better: avoid shell commands'
          )
        );
      }

      // Pattern: Backticks (shell execution)
      if (/`[^`]*\$_(?:GET|POST|REQUEST)/.test(line)) {
        issues.push(
          this.createIssue(
            'security',
            'Command Injection: User input in backtick execution',
            filePath,
            i + 1,
            line.indexOf('`'), 'critical' ,
            'security-detector',
            undefined,
            'Never use backticks with user input'
          )
        );
      }
    }
  }

  /**
   * Detect insecure cryptography
   */
  private detectInsecureCrypto(
    lines: string[],
    filePath: string,
    issues: PhpIssue[]
  ): void {
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // Pattern: md5/sha1 for passwords
      if (/(md5|sha1)\s*\([^)]*password/i.test(line)) {
        issues.push(
          this.createIssue(
            'security',
            'Insecure Cryptography: md5/sha1 not suitable for passwords',
            filePath,
            i + 1,
            line.search(/md5|sha1/i), 'critical' ,
            'security-detector',
            undefined,
            'Use password_hash() with PASSWORD_ARGON2ID or PASSWORD_BCRYPT'
          )
        );
      }

      // Pattern: Weak random
      if (/rand\(|mt_rand\(/i.test(line) && /token|session|csrf/i.test(line)) {
        issues.push(
          this.createIssue(
            'security',
            'Weak Random: rand()/mt_rand() not cryptographically secure',
            filePath,
            i + 1,
            line.search(/rand|mt_rand/i), 'high' ,
            'security-detector',
            undefined,
            'Use random_bytes() or random_int() for security tokens'
          )
        );
      }

      // Pattern: Hardcoded secrets
      if (/(?:password|secret|key|token)\s*=\s*["'][^"']{8,}["']/i.test(line)) {
        issues.push(
          this.createIssue(
            'security',
            'Hardcoded Secret: Sensitive data in source code',
            filePath,
            i + 1,
            line.search(/password|secret|key/i), 'critical' ,
            'security-detector',
            undefined,
            'Move to environment variables or secrets manager'
          )
        );
      }
    }
  }
}
