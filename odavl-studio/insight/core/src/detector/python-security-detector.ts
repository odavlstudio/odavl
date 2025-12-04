/**
 * Python Security Detector (Bandit Patterns)
 * Detects common security vulnerabilities in Python code
 * 
 * Checks based on Bandit security linter:
 * - SQL injection
 * - Command injection
 * - Hardcoded secrets
 * - Weak cryptography
 * - Path traversal
 * - Insecure deserialization
 */

import { PythonParser } from '../python/python-parser.js';
import * as fs from 'node:fs/promises';

export interface PythonSecurityIssue {
  type: 'python-security';
  severity: 'critical' | 'high' | 'medium' | 'low';
  message: string;
  file: string;
  line: number;
  col: number;
  category: 'injection' | 'crypto' | 'secrets' | 'deserialization' | 'path-traversal' | 'other';
  cwe?: string;
  owasp?: string;
  recommendation: string;
}

export class PythonSecurityDetector {
  private workspaceRoot: string;
  private parser: PythonParser;

  // Security patterns (simplified Bandit rules)
  private readonly securityPatterns = [
    {
      pattern: /exec\s*\(/,
      severity: 'high' as const,
      category: 'injection' as const,
      message: 'Use of exec() is dangerous (arbitrary code execution)',
      cwe: 'CWE-78',
      recommendation: 'Avoid exec(). Use safer alternatives or validate input strictly',
    },
    {
      pattern: /eval\s*\(/,
      severity: 'high' as const,
      category: 'injection' as const,
      message: 'Use of eval() is dangerous (arbitrary code execution)',
      cwe: 'CWE-95',
      recommendation: 'Avoid eval(). Use ast.literal_eval() for safe evaluation',
    },
    {
      pattern: /pickle\.loads?\s*\(/,
      severity: 'high' as const,
      category: 'deserialization' as const,
      message: 'Insecure deserialization with pickle',
      cwe: 'CWE-502',
      owasp: 'A8:2017',
      recommendation: 'Use JSON or other safe serialization formats',
    },
    {
      pattern: /os\.system\s*\(/,
      severity: 'high' as const,
      category: 'injection' as const,
      message: 'Command injection via os.system()',
      cwe: 'CWE-78',
      recommendation: 'Use subprocess with shell=False and validate inputs',
    },
    {
      pattern: /subprocess\.(call|run|Popen).*shell\s*=\s*True/,
      severity: 'high' as const,
      category: 'injection' as const,
      message: 'Command injection via subprocess with shell=True',
      cwe: 'CWE-78',
      recommendation: 'Set shell=False and pass command as list',
    },
    {
      pattern: /password\s*=\s*['"][^'"]+['"]/,
      severity: 'critical' as const,
      category: 'secrets' as const,
      message: 'Hardcoded password detected',
      cwe: 'CWE-259',
      owasp: 'A3:2017',
      recommendation: 'Use environment variables or secret management service',
    },
    {
      pattern: /api[_-]?key\s*=\s*['"][^'"]+['"]/,
      severity: 'critical' as const,
      category: 'secrets' as const,
      message: 'Hardcoded API key detected',
      cwe: 'CWE-798',
      owasp: 'A3:2017',
      recommendation: 'Use environment variables or secret management service',
    },
    {
      pattern: /secret[_-]?key\s*=\s*['"][^'"]+['"]/,
      severity: 'critical' as const,
      category: 'secrets' as const,
      message: 'Hardcoded secret key detected',
      cwe: 'CWE-798',
      recommendation: 'Use environment variables or secret management service',
    },
    {
      pattern: /SELECT\s+.*\s+FROM\s+.*\+/,
      severity: 'critical' as const,
      category: 'injection' as const,
      message: 'Potential SQL injection (string concatenation)',
      cwe: 'CWE-89',
      owasp: 'A1:2017',
      recommendation: 'Use parameterized queries or ORM',
    },
    {
      pattern: /execute\s*\(\s*["'].*%s/,
      severity: 'critical' as const,
      category: 'injection' as const,
      message: 'SQL injection via string formatting',
      cwe: 'CWE-89',
      owasp: 'A1:2017',
      recommendation: 'Use parameterized queries with placeholders',
    },
    {
      pattern: /md5\s*\(|hashlib\.md5/,
      severity: 'medium' as const,
      category: 'crypto' as const,
      message: 'Weak cryptographic hash (MD5)',
      cwe: 'CWE-327',
      recommendation: 'Use SHA-256 or stronger algorithm',
    },
    {
      pattern: /sha1\s*\(|hashlib\.sha1/,
      severity: 'medium' as const,
      category: 'crypto' as const,
      message: 'Weak cryptographic hash (SHA-1)',
      cwe: 'CWE-327',
      recommendation: 'Use SHA-256 or stronger algorithm',
    },
    {
      pattern: /random\.random|random\.randint/,
      severity: 'medium' as const,
      category: 'crypto' as const,
      message: 'Weak random number generator (not cryptographically secure)',
      cwe: 'CWE-330',
      recommendation: 'Use secrets module for security-sensitive operations',
    },
    {
      pattern: /open\s*\(.*\+/,
      severity: 'medium' as const,
      category: 'path-traversal' as const,
      message: 'Potential path traversal (string concatenation in file path)',
      cwe: 'CWE-22',
      owasp: 'A5:2017',
      recommendation: 'Use os.path.join() and validate paths',
    },
    {
      pattern: /assert\s+/,
      severity: 'low' as const,
      category: 'other' as const,
      message: 'Use of assert for data validation (assertions can be disabled)',
      cwe: 'CWE-703',
      recommendation: 'Use explicit if statements and raise exceptions',
    },
    {
      pattern: /try:\s*$.*except\s*:/s,
      severity: 'low' as const,
      category: 'other' as const,
      message: 'Bare except clause (catches all exceptions)',
      cwe: 'CWE-755',
      recommendation: 'Catch specific exceptions or use Exception',
    },
    {
      pattern: /tempfile\.mktemp\s*\(/,
      severity: 'medium' as const,
      category: 'other' as const,
      message: 'Insecure temporary file creation',
      cwe: 'CWE-377',
      recommendation: 'Use tempfile.mkstemp() instead',
    },
    {
      pattern: /yaml\.load\s*\(/,
      severity: 'high' as const,
      category: 'deserialization' as const,
      message: 'Insecure YAML deserialization',
      cwe: 'CWE-502',
      recommendation: 'Use yaml.safe_load() instead',
    },
    {
      pattern: /requests\.(get|post).*verify\s*=\s*False/,
      severity: 'high' as const,
      category: 'crypto' as const,
      message: 'SSL certificate verification disabled',
      cwe: 'CWE-295',
      recommendation: 'Enable SSL verification (remove verify=False)',
    },
  ];

  constructor(workspaceRoot: string) {
    this.workspaceRoot = workspaceRoot;
    this.parser = new PythonParser(workspaceRoot);
  }

  /**
   * Detect security issues in Python files
   */
  async detect(targetPath?: string): Promise<PythonSecurityIssue[]> {
    const issues: PythonSecurityIssue[] = [];

    try {
      const pythonFiles = await this.parser.findPythonFiles();

      for (const file of pythonFiles.slice(0, 50)) {
        const fileIssues = await this.analyzeFile(file);
        issues.push(...fileIssues);
      }
    } catch (error) {
      // Silent fail
    }

    return issues;
  }

  /**
   * Analyze single Python file
   */
  private async analyzeFile(filePath: string): Promise<PythonSecurityIssue[]> {
    const issues: PythonSecurityIssue[] = [];

    try {
      const content = await fs.readFile(filePath, 'utf8');
      const lines = content.split('\n');

      // Check each line against security patterns
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const lineNumber = i + 1;

        for (const rule of this.securityPatterns) {
          if (rule.pattern.test(line)) {
            // Skip if it's in a comment
            if (line.trim().startsWith('#')) {
              continue;
            }

            issues.push({
              type: 'python-security',
              severity: rule.severity,
              message: rule.message,
              file: filePath,
              line: lineNumber,
              col: line.search(rule.pattern),
              category: rule.category,
              cwe: rule.cwe,
              owasp: rule.owasp,
              recommendation: rule.recommendation,
            });
          }
        }

        // Additional context-aware checks
        this.checkSQLInjection(line, lineNumber, filePath, issues);
        this.checkXSS(line, lineNumber, filePath, issues);
      }
    } catch (error) {
      // Silent fail
    }

    return issues;
  }

  /**
   * Check for SQL injection patterns
   */
  private checkSQLInjection(
    line: string,
    lineNumber: number,
    filePath: string,
    issues: PythonSecurityIssue[]
  ): void {
    // String formatting in SQL queries
    if (line.includes('cursor.execute') || line.includes('.execute(')) {
      if (line.includes('.format(') || line.includes('f"') || line.includes("f'")) {
        issues.push({
          type: 'python-security',
          severity: 'critical',
          message: 'SQL injection via string formatting',
          file: filePath,
          line: lineNumber,
          col: 0,
          category: 'injection',
          cwe: 'CWE-89',
          owasp: 'A1:2017',
          recommendation: 'Use parameterized queries: cursor.execute("SELECT * FROM users WHERE id = ?", (user_id,))',
        });
      }
    }
  }

  /**
   * Check for XSS vulnerabilities
   */
  private checkXSS(
    line: string,
    lineNumber: number,
    filePath: string,
    issues: PythonSecurityIssue[]
  ): void {
    // Direct HTML rendering without escaping
    if ((line.includes('render_template') || line.includes('Markup')) && 
        (line.includes('+') || line.includes('.format('))) {
      issues.push({
        type: 'python-security',
        severity: 'high',
        message: 'Potential XSS vulnerability (unescaped user input in template)',
        file: filePath,
        line: lineNumber,
        col: 0,
        category: 'injection',
        cwe: 'CWE-79',
        owasp: 'A7:2017',
        recommendation: 'Use Jinja2 autoescaping or explicitly escape user input',
      });
    }
  }
}
