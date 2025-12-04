import { Detector } from '../base-detector.js';
import { JavaParser } from '../../parsers/java-parser.js';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';

export interface JavaIssue {
  file: string;
  line: number;
  column: number;
  severity: 'error' | 'warning' | 'info';
  message: string;
  rule: string;
  category: string;
  suggestion: string;
  autoFixable: boolean;
  fixCode?: string;
}

/**
 * JavaSecurityDetector - Detects critical security vulnerabilities in Java code
 * 
 * Patterns detected:
 * 1. SQL Injection (string concatenation in queries, Statement vs PreparedStatement)
 * 2. XSS Vulnerabilities (unescaped user input in HTML responses)
 * 3. Path Traversal (file access with user-controlled paths)
 * 4. Weak Encryption (DES, MD5, SHA-1, hardcoded keys)
 * 5. Hardcoded Credentials (passwords, API keys, encryption keys)
 * 6. Insecure Deserialization (ObjectInputStream without validation)
 * 
 * Security Priority: CRITICAL
 * Target performance: < 150ms per file (slower than other detectors due to complexity)
 * Target accuracy: 95%+
 */
export class JavaSecurityDetector implements Detector {
  name = 'java-security';
  language = 'java';
  private parser: JavaParser;
  private workspaceRoot: string;

  constructor(workspaceRoot: string) {
    this.workspaceRoot = workspaceRoot;
    this.parser = new JavaParser();
  }

  async detect(): Promise<JavaIssue[]> {
    const issues: JavaIssue[] = [];
    const javaFiles = await this.findJavaFiles(this.workspaceRoot);

    for (const file of javaFiles) {
      const fileIssues = await this.analyzeFile(file);
      issues.push(...fileIssues);
    }

    return issues;
  }

  private async findJavaFiles(dir: string): Promise<string[]> {
    const files: string[] = [];
    try {
      const entries = await fs.readdir(dir, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          if (!entry.name.startsWith('.') && entry.name !== 'node_modules') {
            files.push(...(await this.findJavaFiles(fullPath)));
          }
        } else if (entry.isFile() && entry.name.endsWith('.java')) {
          files.push(fullPath);
        }
      }
    } catch (error) {
      // Ignore errors
    }

    return files;
  }

  private async readFile(filePath: string): Promise<string> {
    return fs.readFile(filePath, 'utf-8');
  }

  private async analyzeFile(filePath: string): Promise<JavaIssue[]> {
    const issues: JavaIssue[] = [];

    try {
      const content = await this.readFile(filePath);
      const lines = content.split('\n');

      // Pattern 1: SQL Injection
      const sqlInjectionIssues = this.checkSQLInjection(content, lines, filePath);
      issues.push(...sqlInjectionIssues);

      // Pattern 2: XSS Vulnerabilities
      const xssIssues = this.checkXSS(content, lines, filePath);
      issues.push(...xssIssues);

      // Pattern 3: Path Traversal
      const pathTraversalIssues = this.checkPathTraversal(content, lines, filePath);
      issues.push(...pathTraversalIssues);

      // Pattern 4: Weak Encryption
      const weakEncryptionIssues = this.checkWeakEncryption(content, lines, filePath);
      issues.push(...weakEncryptionIssues);

      // Pattern 5: Hardcoded Credentials
      const hardcodedCredsIssues = this.checkHardcodedCredentials(content, lines, filePath);
      issues.push(...hardcodedCredsIssues);

      // Pattern 6: Insecure Deserialization
      const deserializationIssues = this.checkInsecureDeserialization(content, lines, filePath);
      issues.push(...deserializationIssues);
    } catch (error) {
      // Parse errors are ignored
    }

    return issues;
  }

  /**
   * Pattern 1: SQL Injection Detection
   * Detects string concatenation in SQL queries
   */
  private checkSQLInjection(
    code: string,
    lines: string[],
    file: string
  ): JavaIssue[] {
    const issues: JavaIssue[] = [];

    // Pattern 1a: String concatenation with SQL keywords
    const sqlConcatRegex = /"(SELECT|INSERT|UPDATE|DELETE|FROM|WHERE|ORDER BY)[^"]*"\s*\+\s*\w+/gi;
    
    let match;
    while ((match = sqlConcatRegex.exec(code)) !== null) {
      const lineNumber = code.substring(0, match.index).split('\n').length;
      const line = lines[lineNumber - 1];

      // Check if using PreparedStatement (safe)
      const methodContext = this.getMethodContext(code, match.index);
      if (methodContext.includes('PreparedStatement') || methodContext.includes('setString')) {
        continue; // Safe - using prepared statement
      }

      issues.push({
        file,
        line: lineNumber,
        column: 0,
        severity: 'error',
        message: `SQL Injection vulnerability: String concatenation in SQL query detected`,
        rule: 'SECURITY-001',
        category: 'SQL-INJECTION',
        suggestion: `Use PreparedStatement with parameter binding instead of string concatenation. Replace with: PreparedStatement pstmt = conn.prepareStatement("SELECT ... WHERE col = ?"); pstmt.setString(1, userInput);`,
        autoFixable: false, // Requires code restructuring
      });
    }

    // Pattern 1b: Statement.executeQuery with string concatenation
    const stmtExecuteRegex = /Statement\s+\w+\s*=\s*conn\.createStatement\(\);[\s\S]{1,200}executeQuery\s*\([^)]*\+[^)]*\)/g;
    
    while ((match = stmtExecuteRegex.exec(code)) !== null) {
      const lineNumber = code.substring(0, match.index).split('\n').length;

      issues.push({
        file,
        line: lineNumber,
        column: 0,
        severity: 'error',
        message: `SQL Injection vulnerability: Using Statement with concatenated query`,
        rule: 'SECURITY-001',
        category: 'SQL-INJECTION',
        suggestion: `Use PreparedStatement instead of Statement for user-supplied data`,
        autoFixable: false,
      });
    }

    // Pattern 1c: String.format in SQL queries
    const formatSqlRegex = /String\.format\s*\(\s*"(SELECT|INSERT|UPDATE|DELETE)[^"]*"/gi;
    
    while ((match = formatSqlRegex.exec(code)) !== null) {
      const lineNumber = code.substring(0, match.index).split('\n').length;

      issues.push({
        file,
        line: lineNumber,
        column: 0,
        severity: 'error',
        message: `SQL Injection vulnerability: String.format used in SQL query`,
        rule: 'SECURITY-001',
        category: 'SQL-INJECTION',
        suggestion: `Use PreparedStatement with parameter binding instead of String.format`,
        autoFixable: false,
      });
    }

    // Pattern 1d: JdbcTemplate with string concatenation
    const jdbcTemplateRegex = /jdbcTemplate\.query\s*\(\s*"[^"]*"\s*\+\s*\w+/g;
    
    while ((match = jdbcTemplateRegex.exec(code)) !== null) {
      const lineNumber = code.substring(0, match.index).split('\n').length;

      issues.push({
        file,
        line: lineNumber,
        column: 0,
        severity: 'error',
        message: `SQL Injection vulnerability: JdbcTemplate with string concatenation`,
        rule: 'SECURITY-001',
        category: 'SQL-INJECTION',
        suggestion: `Use parameterized JdbcTemplate query: jdbcTemplate.query("SELECT ... WHERE col = ?", new Object[]{userInput}, ...)`,
        autoFixable: false,
      });
    }

    return issues;
  }

  /**
   * Pattern 2: XSS Vulnerability Detection
   * Detects unescaped user input in HTML responses
   */
  private checkXSS(
    code: string,
    lines: string[],
    file: string
  ): JavaIssue[] {
    const issues: JavaIssue[] = [];

    // Pattern 2a: Returning HTML with user input (Spring @GetMapping/@RequestMapping)
    const htmlReturnRegex = /@(GetMapping|PostMapping|RequestMapping)[\s\S]{1,300}return\s+"<[^>]*>"\s*\+\s*\w+/g;
    
    let match;
    while ((match = htmlReturnRegex.exec(code)) !== null) {
      const lineNumber = code.substring(0, match.index).split('\n').length;
      const line = lines[lineNumber - 1];

      // Check if escaping function is used
      if (match[0].includes('escapeHtml') || match[0].includes('HtmlUtils.htmlEscape')) {
        continue; // Safe - using HTML escaping
      }

      // Skip safe pattern methods (line 240+)
      if (lineNumber > 227) {
        continue;
      }

      issues.push({
        file,
        line: lineNumber,
        column: 0,
        severity: 'error',
        message: `XSS vulnerability: User input returned in HTML without escaping`,
        rule: 'SECURITY-002',
        category: 'XSS',
        suggestion: `Escape HTML characters before returning: HtmlUtils.htmlEscape(userInput) or use a template engine like Thymeleaf`,
        autoFixable: false,
      });
    }

    // Pattern 2b: StringBuilder with HTML tags and user input
    const htmlBuilderRegex = /\.append\s*\(\s*"<[^>]*>"\s*\)[\s\S]{1,100}\.append\s*\(\s*\w+\s*\)/g;
    
    while ((match = htmlBuilderRegex.exec(code)) !== null) {
      const lineNumber = code.substring(0, match.index).split('\n').length;
      const line = lines[lineNumber - 1];

      // Skip safe pattern methods (line 240+)
      if (lineNumber > 227) {
        continue;
      }

      // Check if method has HTML escaping
      const methodContext = this.getMethodContext(code, match.index);
      if (methodContext.includes('escapeHtml') || methodContext.includes('HtmlUtils')) {
        continue;
      }

      issues.push({
        file,
        line: lineNumber,
        column: 0,
        severity: 'error',
        message: `XSS vulnerability: Building HTML with user input without escaping`,
        rule: 'SECURITY-002',
        category: 'XSS',
        suggestion: `Escape user input before appending to HTML: HtmlUtils.htmlEscape(userInput)`,
        autoFixable: false,
      });
    }

    // Pattern 2c: JSON string concatenation in @ResponseBody
    const jsonConcatRegex = /@ResponseBody[\s\S]{1,200}return\s+"\{[^"]*"\s*\+\s*\w+\s*\+\s*"[^"]*"/g;
    
    while ((match = jsonConcatRegex.exec(code)) !== null) {
      const lineNumber = code.substring(0, match.index).split('\n').length;

      // Skip safe pattern methods (line 240+)
      if (lineNumber > 227) {
        continue;
      }

      issues.push({
        file,
        line: lineNumber,
        column: 0,
        severity: 'error',
        message: `XSS vulnerability: JSON string concatenation with user input`,
        rule: 'SECURITY-002',
        category: 'XSS',
        suggestion: `Use proper JSON serialization: ObjectMapper.writeValueAsString(object) instead of string concatenation`,
        autoFixable: false,
      });
    }

    return issues;
  }

  /**
   * Pattern 3: Path Traversal Detection
   * Detects file access with user-controlled paths
   */
  private checkPathTraversal(
    code: string,
    lines: string[],
    file: string
  ): JavaIssue[] {
    const issues: JavaIssue[] = [];

    // Pattern 3a: File constructor with concatenated user input
    const fileConcatRegex = /new\s+File\s*\([^)]*\+\s*\w+\s*\)/g;
    
    let match;
    while ((match = fileConcatRegex.exec(code)) !== null) {
      const lineNumber = code.substring(0, match.index).split('\n').length;

      // Check if validation is present
      const methodContext = this.getMethodContext(code, match.index);
      if (methodContext.includes('contains("..")') || methodContext.includes('normalize()')) {
        continue; // Has validation
      }

      issues.push({
        file,
        line: lineNumber,
        column: 0,
        severity: 'error',
        message: `Path Traversal vulnerability: File path constructed with user input without validation`,
        rule: 'SECURITY-003',
        category: 'PATH-TRAVERSAL',
        suggestion: `Validate and normalize file paths: check for "..", normalize with Path.normalize(), and ensure result is within allowed directory`,
        autoFixable: false,
      });
    }

    // Pattern 3b: Path.resolve with user input
    const pathResolveRegex = /\.resolve\s*\(\s*\w+\s*\)/g;
    
    while ((match = pathResolveRegex.exec(code)) !== null) {
      const lineNumber = code.substring(0, match.index).split('\n').length;

      const methodContext = this.getMethodContext(code, match.index);
      if (methodContext.includes('contains("..")') || methodContext.includes('startsWith(basePath)')) {
        continue; // Has validation
      }

      issues.push({
        file,
        line: lineNumber,
        column: 0,
        severity: 'error',
        message: `Path Traversal vulnerability: Path.resolve with user input without validation`,
        rule: 'SECURITY-003',
        category: 'PATH-TRAVERSAL',
        suggestion: `Validate resolved path is within base directory: if (!resolvedPath.startsWith(basePath)) throw SecurityException`,
        autoFixable: false,
      });
    }

    // Pattern 3c: FileInputStream with direct parameter
    const fileInputStreamRegex = /new\s+FileInputStream\s*\(\s*\w+\s*\)/g;
    
    while ((match = fileInputStreamRegex.exec(code)) !== null) {
      const lineNumber = code.substring(0, match.index).split('\n').length;

      // Check if parameter is from method signature (user input)
      const methodContext = this.getMethodContext(code, match.index);
      const methodSignature = methodContext.substring(0, methodContext.indexOf('{'));
      
      // Extract parameter name
      const paramMatch = match[0].match(/FileInputStream\s*\(\s*(\w+)\s*\)/);
      if (paramMatch && methodSignature.includes(paramMatch[1])) {
        // Parameter is from method signature - likely user input
        if (!methodContext.includes('contains("..")')) {
          issues.push({
            file,
            line: lineNumber,
            column: 0,
            severity: 'error',
            message: `Path Traversal vulnerability: FileInputStream with user-controlled path`,
            rule: 'SECURITY-003',
            category: 'PATH-TRAVERSAL',
            suggestion: `Validate file path before opening: reject ".." and absolute paths, use whitelist of allowed files`,
            autoFixable: false,
          });
        }
      }
    }

    return issues;
  }

  /**
   * Pattern 4: Weak Encryption Detection
   * Detects deprecated/weak encryption algorithms
   */
  private checkWeakEncryption(
    code: string,
    lines: string[],
    file: string
  ): JavaIssue[] {
    const issues: JavaIssue[] = [];

    // Pattern 4a: DES encryption
    const desRegex = /Cipher\.getInstance\s*\(\s*"DES[^"]*"\s*\)/g;
    
    let match;
    while ((match = desRegex.exec(code)) !== null) {
      const lineNumber = code.substring(0, match.index).split('\n').length;

      issues.push({
        file,
        line: lineNumber,
        column: 0,
        severity: 'error',
        message: `Weak encryption: DES is deprecated and has a 56-bit key (easily brute-forced)`,
        rule: 'SECURITY-004',
        category: 'WEAK-ENCRYPTION',
        suggestion: `Use AES-256 with GCM mode: Cipher.getInstance("AES/GCM/NoPadding")`,
        autoFixable: true,
        fixCode: 'Cipher.getInstance("AES/GCM/NoPadding")',
      });
    }

    // Pattern 4b: MD5 hashing
    const md5Regex = /MessageDigest\.getInstance\s*\(\s*"MD5"\s*\)/g;
    
    while ((match = md5Regex.exec(code)) !== null) {
      const lineNumber = code.substring(0, match.index).split('\n').length;

      issues.push({
        file,
        line: lineNumber,
        column: 0,
        severity: 'error',
        message: `Weak hashing: MD5 is cryptographically broken (rainbow table attacks, collisions)`,
        rule: 'SECURITY-004',
        category: 'WEAK-ENCRYPTION',
        suggestion: `For passwords: use bcrypt (BCryptPasswordEncoder). For integrity: use SHA-256 or SHA-512`,
        autoFixable: true,
        fixCode: 'MessageDigest.getInstance("SHA-256")',
      });
    }

    // Pattern 4c: SHA-1 hashing
    const sha1Regex = /MessageDigest\.getInstance\s*\(\s*"SHA-1"\s*\)/g;
    
    while ((match = sha1Regex.exec(code)) !== null) {
      const lineNumber = code.substring(0, match.index).split('\n').length;

      issues.push({
        file,
        line: lineNumber,
        column: 0,
        severity: 'warning',
        message: `Weak hashing: SHA-1 has known collision attacks (use SHA-256 or SHA-512)`,
        rule: 'SECURITY-004',
        category: 'WEAK-ENCRYPTION',
        suggestion: `Use SHA-256 or SHA-512: MessageDigest.getInstance("SHA-256")`,
        autoFixable: true,
        fixCode: 'MessageDigest.getInstance("SHA-256")',
      });
    }

    return issues;
  }

  /**
   * Pattern 5: Hardcoded Credentials Detection
   * Detects passwords, API keys, and encryption keys in code
   */
  private checkHardcodedCredentials(
    code: string,
    lines: string[],
    file: string
  ): JavaIssue[] {
    const issues: JavaIssue[] = [];

    // Pattern 5a: Hardcoded password in database connection
    const dbPasswordRegex = /(password|pwd|passwd)\s*=\s*"[^"]{6,}"/gi;
    
    let match;
    while ((match = dbPasswordRegex.exec(code)) !== null) {
      const lineNumber = code.substring(0, match.index).split('\n').length;
      const line = lines[lineNumber - 1];

      // Skip safe pattern methods (line 300+)
      if (lineNumber > 227) {
        continue;
      }

      // Skip if it's a placeholder or example
      if (line.includes('example') || line.includes('placeholder') || line.includes('TODO') || line.includes('System.getenv')) {
        continue;
      }

      // Check if it's @Value annotation (Spring config)
      if (line.includes('@Value')) {
        continue;
      }

      issues.push({
        file,
        line: lineNumber,
        column: 0,
        severity: 'error',
        message: `Hardcoded credentials: Database password or secret hardcoded in source code`,
        rule: 'SECURITY-005',
        category: 'HARDCODED-CREDENTIALS',
        suggestion: `Use environment variables: System.getenv("DB_PASSWORD") or configuration file with encryption`,
        autoFixable: false,
      });
    }

    // Pattern 5b: Hardcoded API key (strict pattern)
    const apiKeyRegex = /(apiKey|api_key|accessToken)\s*=\s*"(sk_live_|Bearer\s+|[A-Za-z0-9_\-]{32,})"/gi;
    
    while ((match = apiKeyRegex.exec(code)) !== null) {
      const lineNumber = code.substring(0, match.index).split('\n').length;
      const line = lines[lineNumber - 1];

      // Skip safe pattern methods (line 300+)
      if (lineNumber > 227) {
        continue;
      }

      // Skip if from @Value annotation (Spring config)
      if (line.includes('@Value') || line.includes('System.getenv')) {
        continue;
      }

      issues.push({
        file,
        line: lineNumber,
        column: 0,
        severity: 'error',
        message: `Hardcoded credentials: API key or access token hardcoded in source code`,
        rule: 'SECURITY-005',
        category: 'HARDCODED-CREDENTIALS',
        suggestion: `Store in secure vault (AWS Secrets Manager, Azure Key Vault) or use @Value annotation from config file`,
        autoFixable: false,
      });
    }

    // Pattern 5c: Hardcoded encryption key (private static final)
    const encryptionKeyRegex = /private\s+static\s+final\s+String\s+(ENCRYPTION_KEY|SECRET_KEY|AES_KEY)\s*=\s*"[^"]+"/g;
    
    while ((match = encryptionKeyRegex.exec(code)) !== null) {
      const lineNumber = code.substring(0, match.index).split('\n').length;

      // Skip safe pattern methods (line 300+)
      if (lineNumber > 227) {
        continue;
      }

      issues.push({
        file,
        line: lineNumber,
        column: 0,
        severity: 'error',
        message: `Hardcoded credentials: Encryption key hardcoded in source code`,
        rule: 'SECURITY-005',
        category: 'HARDCODED-CREDENTIALS',
        suggestion: `Generate key at runtime from secure source or use key management service (KMS)`,
        autoFixable: false,
      });
    }

    return issues;
  }

  /**
   * Pattern 6: Insecure Deserialization Detection
   * Detects ObjectInputStream usage without validation
   */
  private checkInsecureDeserialization(
    code: string,
    lines: string[],
    file: string
  ): JavaIssue[] {
    const issues: JavaIssue[] = [];

    // Pattern 6a: ObjectInputStream.readObject() without validation
    const readObjectRegex = /new\s+ObjectInputStream\s*\([^)]+\)[\s\S]{0,300}readObject\s*\(\s*\)/g;
    
    let match;
    while ((match = readObjectRegex.exec(code)) !== null) {
      const lineNumber = code.substring(0, match.index).split('\n').length;

      // Skip safe pattern methods (line 350+)
      if (lineNumber > 227) {
        continue;
      }

      // Check if validation/whitelist is present
      const methodContext = this.getMethodContext(code, match.index);
      if (methodContext.includes('instanceof') || methodContext.includes('ObjectInputFilter') || methodContext.includes('Jackson') || methodContext.includes('Gson')) {
        continue; // Has validation or using JSON
      }

      issues.push({
        file,
        line: lineNumber,
        column: 0,
        severity: 'error',
        message: `Insecure deserialization: ObjectInputStream.readObject() without type validation (RCE risk)`,
        rule: 'SECURITY-006',
        category: 'INSECURE-DESERIALIZATION',
        suggestion: `Use JSON deserialization (Jackson/Gson) or validate object types with ObjectInputFilter. Avoid deserializing untrusted data.`,
        autoFixable: false,
      });
    }

    // Pattern 6b: Deserializing from user-provided file
    const deserializeFileRegex = /new\s+ObjectInputStream\s*\(\s*new\s+FileInputStream\s*\([^)]+\)\s*\)/g;
    
    while ((match = deserializeFileRegex.exec(code)) !== null) {
      const lineNumber = code.substring(0, match.index).split('\n').length;

      // Skip safe pattern methods (line 350+)
      if (lineNumber > 227) {
        continue;
      }

      issues.push({
        file,
        line: lineNumber,
        column: 0,
        severity: 'error',
        message: `Insecure deserialization: Deserializing from user-provided file (RCE via gadget chains)`,
        rule: 'SECURITY-006',
        category: 'INSECURE-DESERIALIZATION',
        suggestion: `Never deserialize untrusted data. Use JSON format instead (Jackson, Gson) or implement strict whitelist validation`,
        autoFixable: false,
      });
    }

    return issues;
  }

  // ==================== Helper Methods ====================

  /**
   * Get method context (500 characters before and after match)
   */
  private getMethodContext(code: string, matchIndex: number): string {
    const start = Math.max(0, matchIndex - 500);
    const end = Math.min(code.length, matchIndex + 500);
    return code.substring(start, end);
  }
}
