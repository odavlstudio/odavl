/**
 * @fileoverview Detects Ruby security vulnerabilities
 * OWASP Top 10 coverage for Ruby/Rails applications
 */

import { RubyBaseDetector, type RubyDetectorOptions, type RubyIssue } from './ruby-base-detector';
import type { DetectorResult } from '../../types';

export class SecurityDetector extends RubyBaseDetector {
  constructor(options: RubyDetectorOptions = {}) {
    super(options);
  }

  async detect(filePath: string, content: string): Promise<DetectorResult> {
    if (!this.isRubyFile(filePath)) {
      return { issues: [], duration: 0, detectorName: 'security' };
    }

    const issues: RubyIssue[] = [];
    const lines = content.split('\n');

    // Command injection
    this.detectCommandInjection(lines, filePath, issues);

    // File operations vulnerabilities
    this.detectFileOperations(lines, filePath, issues);

    // Unsafe eval
    this.detectUnsafeEval(lines, filePath, issues);

    // Insecure randomness
    this.detectInsecureRandom(lines, filePath, issues);

    // Hardcoded secrets
    this.detectHardcodedSecrets(lines, filePath, issues);

    return {
      issues,
      duration: 0,
      detectorName: 'security',
    };
  }

  /**
   * Detect command injection vulnerabilities
   */
  private detectCommandInjection(
    lines: string[],
    filePath: string,
    issues: RubyIssue[]
  ): void {
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // Pattern: system/exec/` with user input
      if (
        /(?:system|exec|`)\s*\(?.*(params|request|ARGV)/.test(line) ||
        /`.*#\{(?:params|request|ARGV)/.test(line)
      ) {
        issues.push(
          this.createIssue(
            'security',
            'Command Injection: User input in shell command',
            filePath,
            i + 1,
            line.search(/system|exec|`/), 'critical' ,
            'security-detector',
            'Security/CommandInjection',
            'Use Shellwords.escape() or avoid shell commands entirely'
          )
        );
      }

      // Pattern: Open3 with interpolation
      if (/Open3\.\w+\(.*#\{/.test(line)) {
        issues.push(
          this.createIssue(
            'security',
            'Command Injection: Interpolation in Open3 command',
            filePath,
            i + 1,
            line.indexOf('Open3'), 'critical' ,
            'security-detector',
            'Security/CommandInjection',
            'Pass command as array: Open3.capture3(["cmd", arg1, arg2])'
          )
        );
      }
    }
  }

  /**
   * Detect file operation vulnerabilities
   */
  private detectFileOperations(
    lines: string[],
    filePath: string,
    issues: RubyIssue[]
  ): void {
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // Pattern: File operations with user input
      if (
        /File\.(?:read|open|delete|unlink)\s*\(.*(?:params|request)/.test(line)
      ) {
        issues.push(
          this.createIssue(
            'security',
            'Path Traversal: User input in file path - validate/sanitize',
            filePath,
            i + 1,
            line.indexOf('File.'), 'critical' ,
            'security-detector',
            'Security/PathTraversal',
            'Validate path: File.expand_path(path).start_with?(safe_dir)'
          )
        );
      }

      // Pattern: send_file with user input
      if (/send_file.*(?:params|request)/.test(line)) {
        issues.push(
          this.createIssue(
            'security',
            'Path Traversal: User-controlled send_file path',
            filePath,
            i + 1,
            line.indexOf('send_file'), 'critical' ,
            'security-detector',
            'Security/PathTraversal',
            'Whitelist allowed files or validate path against safe directory'
          )
        );
      }
    }
  }

  /**
   * Detect unsafe eval usage
   */
  private detectUnsafeEval(
    lines: string[],
    filePath: string,
    issues: RubyIssue[]
  ): void {
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // Pattern: eval with any input
      if (/\beval\s*\(/.test(line)) {
        issues.push(
          this.createIssue(
            'security',
            'Code Injection: eval() is extremely dangerous - avoid entirely',
            filePath,
            i + 1,
            line.indexOf('eval'), 'critical' ,
            'security-detector',
            'Security/Eval',
            'Refactor to use safe alternatives (case/when, hash lookup)'
          )
        );
      }

      // Pattern: instance_eval/class_eval with user input
      if (/(?:instance_eval|class_eval)\s*\(.*(?:params|request)/.test(line)) {
        issues.push(
          this.createIssue(
            'security',
            'Code Injection: instance_eval/class_eval with user input',
            filePath,
            i + 1,
            line.search(/instance_eval|class_eval/), 'critical' ,
            'security-detector',
            'Security/Eval',
            'Never use eval variants with user-controlled strings'
          )
        );
      }

      // Pattern: constantize with user input
      if (/\.constantize/.test(line) && /(?:params|request)/.test(line)) {
        issues.push(
          this.createIssue(
            'security',
            'Code Injection: constantize with user input - whitelist classes',
            filePath,
            i + 1,
            line.indexOf('constantize'), 'critical' ,
            'security-detector',
            'Security/Constantize',
            'Whitelist: ALLOWED_MODELS.include?(class_name) ? class_name.constantize : nil'
          )
        );
      }
    }
  }

  /**
   * Detect insecure random number generation
   */
  private detectInsecureRandom(
    lines: string[],
    filePath: string,
    issues: RubyIssue[]
  ): void {
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // Pattern: rand/srand for security tokens
      if (
        /\brand\(/.test(line) &&
        /token|session|csrf|secret/.test(line.toLowerCase())
      ) {
        issues.push(
          this.createIssue(
            'security',
            'Weak Random: rand() not cryptographically secure',
            filePath,
            i + 1,
            line.indexOf('rand'), 'critical' ,
            'security-detector',
            'Security/WeakRandom',
            'Use SecureRandom.hex or SecureRandom.base64 for tokens'
          )
        );
      }
    }
  }

  /**
   * Detect hardcoded secrets
   */
  private detectHardcodedSecrets(
    lines: string[],
    filePath: string,
    issues: RubyIssue[]
  ): void {
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // Pattern: Hardcoded API keys/passwords
      if (
        /(?:password|secret|api_key|token)\s*=\s*["'][^"']{10,}["']/.test(line.toLowerCase())
      ) {
        issues.push(
          this.createIssue(
            'security',
            'Hardcoded Secret: Sensitive data in source code',
            filePath,
            i + 1,
            line.search(/password|secret|api_key/i), 'critical' ,
            'security-detector',
            'Security/HardcodedSecret',
            'Move to ENV variables or Rails credentials'
          )
        );
      }
    }
  }
}
