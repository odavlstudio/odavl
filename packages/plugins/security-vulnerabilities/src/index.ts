/**
 * ODAVL Insight - Security Vulnerabilities Plugin
 * Official plugin for detecting common security vulnerabilities (OWASP Top 10)
 */

import {
  DetectorPlugin,
  Issue,
  PluginHelpers,
  type PluginMetadata,
} from '@odavl-studio/sdk/plugin';

export class SecurityVulnerabilitiesPlugin extends DetectorPlugin {
  constructor() {
    const metadata: Omit<PluginMetadata, 'type'> = {
      id: 'odavl-security-vulnerabilities',
      name: 'Security Vulnerabilities',
      version: '1.0.0',
      description: 'Detect OWASP Top 10 security vulnerabilities',
      author: {
        name: 'ODAVL Team',
        email: 'security@odavl.studio',
        url: 'https://odavl.studio',
      },
      homepage: 'https://plugins.odavl.studio/security-vulnerabilities',
      repository: 'https://github.com/odavl/plugins/tree/main/security-vulnerabilities',
      license: 'MIT',
      keywords: ['security', 'owasp', 'vulnerabilities', 'injection'],
      engines: {
        odavl: '>=4.0.0',
        node: '>=18.0.0',
      },
    };
    
    super(metadata);
  }
  
  async detect(code: string, filePath: string): Promise<Issue[]> {
    const issues: Issue[] = [];
    
    // OWASP A01: Broken Access Control
    issues.push(...this.detectBrokenAccessControl(code));
    
    // OWASP A02: Cryptographic Failures
    issues.push(...this.detectCryptographicFailures(code));
    
    // OWASP A03: Injection
    issues.push(...this.detectInjection(code));
    
    // OWASP A05: Security Misconfiguration
    issues.push(...this.detectSecurityMisconfiguration(code));
    
    // OWASP A06: Vulnerable Components
    issues.push(...this.detectVulnerableComponents(code));
    
    // OWASP A07: Authentication Failures
    issues.push(...this.detectAuthenticationFailures(code));
    
    // OWASP A08: Data Integrity Failures
    issues.push(...this.detectDataIntegrityFailures(code));
    
    return issues;
  }
  
  private detectBrokenAccessControl(code: string): Issue[] {
    const issues: Issue[] = [];
    
    // Pattern: Missing authorization checks
    const patterns = [
      { pattern: /app\.(get|post|put|delete)\(['"][^'"]+['"],\s*(?!.*auth).*\(/g, message: 'Route missing authorization middleware' },
      { pattern: /router\.(get|post|put|delete)\(['"][^'"]+['"],\s*(?!.*auth).*\(/g, message: 'Router endpoint missing authorization' },
    ];
    
    for (const { pattern, message } of patterns) {
      const matches = PluginHelpers.matchPattern(code, pattern);
      for (const match of matches) {
        issues.push({
          type: 'security',
          severity: 'critical',
          message,
          line: match.line,
          column: match.column,
          code: 'OWASP-A01',
          suggestion: 'Add authorization middleware (e.g., requireAuth)',
          documentation: 'https://owasp.org/Top10/A01_2021-Broken_Access_Control/',
          fixable: false,
          tags: ['security', 'owasp', 'authorization'],
        });
      }
    }
    
    return issues;
  }
  
  private detectCryptographicFailures(code: string): Issue[] {
    const issues: Issue[] = [];
    
    // Pattern 1: Hardcoded secrets
    const secretPatterns = [
      /(?:api[_-]?key|apikey)\s*[=:]\s*['"][^'"]+['"]/gi,
      /(?:password|passwd|pwd)\s*[=:]\s*['"][^'"]+['"]/gi,
      /(?:secret|token)\s*[=:]\s*['"][^'"]+['"]/gi,
      /(?:private[_-]?key)\s*[=:]\s*['"][^'"]+['"]/gi,
    ];
    
    for (const pattern of secretPatterns) {
      const matches = PluginHelpers.matchPattern(code, pattern);
      for (const match of matches) {
        // Skip if it's a placeholder
        if (match.match.toLowerCase().includes('test') ||
            match.match.toLowerCase().includes('example') ||
            match.match.toLowerCase().includes('placeholder')) {
          continue;
        }
        
        issues.push({
          type: 'security',
          severity: 'critical',
          message: 'Hardcoded secret detected. Use environment variables instead.',
          line: match.line,
          column: match.column,
          code: 'OWASP-A02',
          suggestion: 'Move to environment variables: process.env.API_KEY',
          documentation: 'https://owasp.org/Top10/A02_2021-Cryptographic_Failures/',
          fixable: true,
          tags: ['security', 'owasp', 'credentials'],
        });
      }
    }
    
    // Pattern 2: Weak encryption
    const weakCryptoPatterns = [
      { pattern: /crypto\s*\.\s*createCipher\(/g, message: 'Weak cipher detected. Use createCipheriv instead.' },
      { pattern: /crypto\s*\.\s*pbkdf2\([^,]+,\s*[^,]+,\s*([0-9]+)/g, message: 'PBKDF2 iterations too low (min 10000)' },
      { pattern: /md5|sha1/gi, message: 'Weak hash algorithm (MD5/SHA1). Use SHA-256 or bcrypt.' },
    ];
    
    for (const { pattern, message } of weakCryptoPatterns) {
      const matches = PluginHelpers.matchPattern(code, pattern);
      for (const match of matches) {
        issues.push({
          type: 'security',
          severity: 'high',
          message,
          line: match.line,
          column: match.column,
          code: 'OWASP-A02',
          suggestion: 'Use modern, secure cryptographic algorithms',
          documentation: 'https://owasp.org/Top10/A02_2021-Cryptographic_Failures/',
          fixable: false,
          tags: ['security', 'owasp', 'cryptography'],
        });
      }
    }
    
    return issues;
  }
  
  private detectInjection(code: string): Issue[] {
    const issues: Issue[] = [];
    
    // SQL Injection
    const sqlInjectionPatterns = [
      /query\s*\(\s*['"`].*\$\{[^}]+\}.*['"`]\s*\)/g,
      /query\s*\(\s*['"`].*\+\s*[a-zA-Z_$][a-zA-Z0-9_$]*.*['"`]\s*\)/g,
      /execute\s*\(\s*['"`].*\$\{[^}]+\}.*['"`]\s*\)/g,
    ];
    
    for (const pattern of sqlInjectionPatterns) {
      const matches = PluginHelpers.matchPattern(code, pattern);
      for (const match of matches) {
        issues.push({
          type: 'security',
          severity: 'critical',
          message: 'SQL Injection vulnerability detected. Use parameterized queries.',
          line: match.line,
          column: match.column,
          code: 'OWASP-A03',
          suggestion: 'Use parameterized queries: query("SELECT * FROM users WHERE id = ?", [userId])',
          documentation: 'https://owasp.org/Top10/A03_2021-Injection/',
          fixable: false,
          tags: ['security', 'owasp', 'sql-injection'],
        });
      }
    }
    
    // Command Injection
    const commandInjectionPatterns = [
      /exec\s*\(\s*['"`].*\$\{[^}]+\}.*['"`]\s*\)/g,
      /spawn\s*\(\s*['"`].*\$\{[^}]+\}.*['"`]\s*\)/g,
      /eval\s*\(/g,
    ];
    
    for (const pattern of commandInjectionPatterns) {
      const matches = PluginHelpers.matchPattern(code, pattern);
      for (const match of matches) {
        issues.push({
          type: 'security',
          severity: 'critical',
          message: 'Command Injection vulnerability detected. Avoid eval() and user input in exec().',
          line: match.line,
          column: match.column,
          code: 'OWASP-A03',
          suggestion: 'Sanitize input or use safe alternatives (spawn with args array)',
          documentation: 'https://owasp.org/Top10/A03_2021-Injection/',
          fixable: false,
          tags: ['security', 'owasp', 'command-injection'],
        });
      }
    }
    
    // XSS (Cross-Site Scripting)
    const xssPatterns = [
      /innerHTML\s*=\s*[^;]+/g,
      /dangerouslySetInnerHTML/g,
      /document\.write\s*\(/g,
    ];
    
    for (const pattern of xssPatterns) {
      const matches = PluginHelpers.matchPattern(code, pattern);
      for (const match of matches) {
        issues.push({
          type: 'security',
          severity: 'high',
          message: 'XSS vulnerability detected. Avoid innerHTML and dangerouslySetInnerHTML.',
          line: match.line,
          column: match.column,
          code: 'OWASP-A03',
          suggestion: 'Sanitize HTML with DOMPurify or use textContent instead',
          documentation: 'https://owasp.org/Top10/A03_2021-Injection/',
          fixable: false,
          tags: ['security', 'owasp', 'xss'],
        });
      }
    }
    
    return issues;
  }
  
  private detectSecurityMisconfiguration(code: string): Issue[] {
    const issues: Issue[] = [];
    
    // Pattern: CORS misconfiguration
    const corsPattern = /cors\s*\(\s*\{\s*origin\s*:\s*['"]?\*['"]?\s*\}/g;
    const matches = PluginHelpers.matchPattern(code, corsPattern);
    
    for (const match of matches) {
      issues.push({
        type: 'security',
        severity: 'high',
        message: 'CORS misconfiguration: Allow all origins (*) is insecure.',
        line: match.line,
        column: match.column,
        code: 'OWASP-A05',
        suggestion: 'Restrict CORS to specific trusted origins',
        documentation: 'https://owasp.org/Top10/A05_2021-Security_Misconfiguration/',
        fixable: false,
        tags: ['security', 'owasp', 'cors'],
      });
    }
    
    return issues;
  }
  
  private detectVulnerableComponents(code: string): Issue[] {
    const issues: Issue[] = [];
    
    // Check for known vulnerable packages (simplified)
    const vulnerablePackages = [
      'lodash@<4.17.21',
      'axios@<0.21.1',
      'moment@*', // Deprecated
    ];
    
    for (const pkg of vulnerablePackages) {
      const [name] = pkg.split('@');
      const pattern = new RegExp(`require\\s*\\(\\s*['"\`]${name}['"\`]\\s*\\)|from\\s+['"\`]${name}['"\`]`, 'g');
      const matches = PluginHelpers.matchPattern(code, pattern);
      
      for (const match of matches) {
        issues.push({
          type: 'security',
          severity: 'medium',
          message: `Potentially vulnerable dependency: ${name}. Check package.json for latest version.`,
          line: match.line,
          column: match.column,
          code: 'OWASP-A06',
          suggestion: `Update to latest secure version of ${name}`,
          documentation: 'https://owasp.org/Top10/A06_2021-Vulnerable_and_Outdated_Components/',
          fixable: false,
          tags: ['security', 'owasp', 'dependencies'],
        });
      }
    }
    
    return issues;
  }
  
  private detectAuthenticationFailures(code: string): Issue[] {
    const issues: Issue[] = [];
    
    // Pattern: Weak password validation
    const weakPasswordPattern = /password\.length\s*[<>=]+\s*[1-7]\b/g;
    const matches = PluginHelpers.matchPattern(code, weakPasswordPattern);
    
    for (const match of matches) {
      issues.push({
        type: 'security',
        severity: 'high',
        message: 'Weak password policy detected. Minimum length should be 8+ characters.',
        line: match.line,
        column: match.column,
        code: 'OWASP-A07',
        suggestion: 'Enforce minimum 8 characters with complexity requirements',
        documentation: 'https://owasp.org/Top10/A07_2021-Identification_and_Authentication_Failures/',
        fixable: false,
        tags: ['security', 'owasp', 'authentication'],
      });
    }
    
    return issues;
  }
  
  private detectDataIntegrityFailures(code: string): Issue[] {
    const issues: Issue[] = [];
    
    // Pattern: Insecure deserialization
    const deserializationPattern = /JSON\.parse\([^)]*\)|unserialize\(/g;
    const matches = PluginHelpers.matchPattern(code, deserializationPattern);
    
    for (const match of matches) {
      // Only flag if it's from user input (heuristic: contains 'req', 'body', 'query')
      const line = code.split('\n')[match.line - 1];
      if (line.includes('req.') || line.includes('body') || line.includes('query')) {
        issues.push({
          type: 'security',
          severity: 'high',
          message: 'Insecure deserialization of user input detected.',
          line: match.line,
          column: match.column,
          code: 'OWASP-A08',
          suggestion: 'Validate and sanitize input before deserialization',
          documentation: 'https://owasp.org/Top10/A08_2021-Software_and_Data_Integrity_Failures/',
          fixable: false,
          tags: ['security', 'owasp', 'deserialization'],
        });
      }
    }
    
    return issues;
  }
}

export default SecurityVulnerabilitiesPlugin;
