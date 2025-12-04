/**
 * Security Detector - ODAVL Insight
 * Detects security vulnerabilities, secrets, and unsafe patterns
 * 
 * Coverage:
 * - CVE scanning (npm audit)
 * - Hardcoded secrets (API keys, passwords, tokens)
 * - Injection vulnerabilities (SQL, Command, XSS)
 * - Insecure cryptography
 * - Path traversal
 * - Dependency vulnerabilities
 */

import { execSync } from 'node:child_process';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { glob } from 'glob';
import { SmartSecurityScanner, SecurityIssue as SmartSecurityIssue } from './smart-security-scanner';

export interface SecurityError {
    file: string;              // File path
    line?: number;             // Line number (if applicable)
    column?: number;           // Column number (if applicable)
    type: SecurityErrorType;   // Type of security issue
    severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
    message: string;           // Human-readable message
    code?: string;             // Vulnerability code (CVE, CWE)
    details?: string;          // Additional details
    suggestedFix?: string;     // How to fix
    affectedPackage?: string;  // For dependency vulnerabilities
    vulnerableVersions?: string; // Version range affected
    patchedVersions?: string;  // Fixed versions
}

export enum SecurityErrorType {
    // Dependency vulnerabilities
    CVE = 'CVE',
    OUTDATED_DEPENDENCY = 'OUTDATED_DEPENDENCY',

    // Secrets & credentials
    HARDCODED_SECRET = 'HARDCODED_SECRET',
    HARDCODED_PASSWORD = 'HARDCODED_PASSWORD',
    API_KEY_EXPOSED = 'API_KEY_EXPOSED',
    JWT_TOKEN_EXPOSED = 'JWT_TOKEN_EXPOSED',
    PRIVATE_KEY_EXPOSED = 'PRIVATE_KEY_EXPOSED',

    // Injection vulnerabilities
    SQL_INJECTION = 'SQL_INJECTION',
    COMMAND_INJECTION = 'COMMAND_INJECTION',
    CODE_INJECTION = 'CODE_INJECTION',
    XSS_VULNERABILITY = 'XSS_VULNERABILITY',
    PATH_TRAVERSAL = 'PATH_TRAVERSAL',

    // Cryptography
    WEAK_CRYPTO = 'WEAK_CRYPTO',
    INSECURE_RANDOM = 'INSECURE_RANDOM',
    WEAK_HASH = 'WEAK_HASH',

    // Misconfigurations
    UNSAFE_EVAL = 'UNSAFE_EVAL',
    INSECURE_DESERIALIZATION = 'INSECURE_DESERIALIZATION',
    MISSING_CSRF_PROTECTION = 'MISSING_CSRF_PROTECTION',
    CORS_MISCONFIGURATION = 'CORS_MISCONFIGURATION',

    // Information disclosure
    SENSITIVE_DATA_EXPOSURE = 'SENSITIVE_DATA_EXPOSURE',
    DEBUG_INFO_LEAK = 'DEBUG_INFO_LEAK',
}

export class SecurityDetector {
    private readonly workspaceRoot: string;
    private readonly ignorePatterns: string[];
    private readonly smartScanner: SmartSecurityScanner;

    constructor(workspaceRoot: string) {
        this.workspaceRoot = workspaceRoot;
        this.smartScanner = new SmartSecurityScanner(workspaceRoot);
        this.ignorePatterns = [
            'node_modules/**',
            'dist/**',
            '.next/**',
            'out/**',
            'build/**',
            '**/*.test.*',
            '**/*.spec.*',
            '**/*.example.*',
            '**/*.mock.*',
            '**/__tests__/**',
            '**/__mocks__/**',
            // Lock files (generated, not source code)
            '**/package-lock.json',
            '**/pnpm-lock.yaml',
            '**/yarn.lock',
            // Config files (often have long strings that aren't secrets)
            '**/tsconfig*.json',
            '**/jest.config.*',
            '**/vite.config.*',
            // Report & verification files (JSON outputs from tools)
            '**/reports/**',
            '**/verification-report.json',
            '**/playwright_results*.json',
            '**/*-observations.json',
            '**/attestation/**',
            '**/.odavl/**',
            // Middleware & config files (HTTP headers contain "Security" keywords)
            '**/middleware.ts',
            '**/vercel.json',
            '**/next.config.*',
        ];
    }

    /**
     * Run all security checks
     */
    async detect(targetDir?: string): Promise<SecurityError[]> {
        const dir = targetDir || this.workspaceRoot;
        const errors: SecurityError[] = [];

        // 1. Check for CVEs in dependencies
        const cveErrors = await this.detectCVEs(dir);
        errors.push(...cveErrors);

        // 2. Scan for hardcoded secrets
        const secretErrors = await this.detectHardcodedSecrets(dir);
        errors.push(...secretErrors);

        // 3. Use smart scanner for sensitive console.log detection
        const sensitiveLogging = await this.detectSensitiveLogging(dir);
        errors.push(...sensitiveLogging);

        // 3. Check for injection vulnerabilities
        const injectionErrors = await this.detectInjectionVulnerabilities(dir);
        errors.push(...injectionErrors);

        // 4. Check for weak cryptography
        const cryptoErrors = await this.detectWeakCryptography(dir);
        errors.push(...cryptoErrors);

        // 5. Check for unsafe patterns
        const unsafeErrors = await this.detectUnsafePatterns(dir);
        errors.push(...unsafeErrors);

        return errors;
    }

    /**
     * Detect sensitive data in console.log using smart scanner
     * Phase 1 Enhancement - replaces basic regex detection
     */
    private async detectSensitiveLogging(targetDir?: string): Promise<SecurityError[]> {
        try {
            const securityIssues = await this.smartScanner.detect(targetDir);

            // Convert SmartSecurityIssue to SecurityError format
            return securityIssues.map((issue: SmartSecurityIssue) => ({
                file: issue.file,
                line: issue.line,
                column: issue.column,
                type: SecurityErrorType.DEBUG_INFO_LEAK,
                severity: issue.severity,
                message: issue.message,
                details: `Category: ${issue.category}, Variable: ${issue.sensitiveVariable}, Confidence: ${issue.confidence}%`,
                suggestedFix: issue.suggestedFix
            }));
        } catch (error) {
            console.error('[SecurityDetector] Smart scanner error:', error);
            return [];
        }
    }

    /**
     * Detect CVEs in dependencies using npm audit
     */
    private async detectCVEs(dir: string): Promise<SecurityError[]> {
        const errors: SecurityError[] = [];

        try {
            const packageJsonPath = path.join(dir, 'package.json');
            if (!fs.existsSync(packageJsonPath)) {
                return errors;
            }

            // Run npm audit with JSON output
            const auditOutput = execSync('npm audit --json', {
                cwd: dir,
                encoding: 'utf8',
                stdio: 'pipe',
            });

            const auditData = JSON.parse(auditOutput);

            // Parse vulnerabilities
            if (auditData.vulnerabilities) {
                for (const [pkgName, vuln] of Object.entries(auditData.vulnerabilities as Record<string, unknown>)) {
                    const v = vuln as { severity: string; via?: Array<{ title?: string; cve?: string; cwe?: string[]; url?: string }>; range?: string; fixAvailable?: { version?: string } | boolean };
                    const severity = this.mapNpmSeverity(v.severity);

                    errors.push({
                        file: packageJsonPath,
                        type: SecurityErrorType.CVE,
                        severity,
                        message: `${pkgName}: ${v.via?.[0]?.title || 'Security vulnerability detected'}`,
                        code: v.via?.[0]?.cve || v.via?.[0]?.cwe?.[0],
                        details: v.via?.[0]?.url,
                        affectedPackage: pkgName,
                        vulnerableVersions: v.range,
                        patchedVersions: v.fixAvailable ? 'Available' : 'None',
                        suggestedFix: v.fixAvailable
                            ? `Run: npm audit fix or update to ${typeof v.fixAvailable === 'object' && v.fixAvailable.version ? v.fixAvailable.version : 'latest version'}`
                            : 'No automated fix available. Check package documentation.',
                    });
                };
            }

        } catch (error: unknown) {
            // npm audit returns non-zero exit code when vulnerabilities found
            const err = error as { stdout?: string };
            if (err.stdout) {
                try {
                    const auditData = JSON.parse(err.stdout);
                    if (auditData.vulnerabilities) {
                        return this.detectCVEs(dir); // Recursive call to parse
                    }
                } catch {
                    // Failed to parse, continue
                }
            }
        }

        return errors;
    }

    /**
     * Detect hardcoded secrets in source files
     */
    private async detectHardcodedSecrets(dir: string): Promise<SecurityError[]> {
        const errors: SecurityError[] = [];

        // File patterns to scan
        const files = await glob('**/*.{ts,tsx,js,jsx,mjs,cjs,json,yaml,yml,env}', {
            cwd: dir,
            absolute: true,
            ignore: this.ignorePatterns,
            nodir: true,  // FIX: Exclude directories, only return files
        });

        // Secret patterns
        const secretPatterns = [
            // API Keys - IMPROVED: More specific pattern, must have key-like prefix
            {
                regex: /(?:api[_-]?key|apikey|access[_-]?key|secret[_-]?key)[\s]*[=:]['"`]([A-Za-z0-9_-]{32,})['"` ]/gi,
                type: SecurityErrorType.API_KEY_EXPOSED,
                name: 'Potential API Key',
                severity: 'high' as const,
            },
            // AWS Keys
            {
                regex: /AKIA[0-9A-Z]{16}/g,
                type: SecurityErrorType.HARDCODED_SECRET,
                name: 'AWS Access Key',
                severity: 'critical' as const,
            },
            // GitHub Tokens
            {
                regex: /ghp_[0-9a-zA-Z]{36}/g,
                type: SecurityErrorType.API_KEY_EXPOSED,
                name: 'GitHub Personal Access Token',
                severity: 'critical' as const,
            },
            // Generic secrets in variable names
            {
                regex: /(password|passwd|pwd|secret|token|apikey|api_key)\s*[=:]\s*['"`]([^'"`\s]{8,})['"`]/gi,
                type: SecurityErrorType.HARDCODED_PASSWORD,
                name: 'Hardcoded Credential',
                severity: 'critical' as const,
            },
            // JWT tokens
            {
                regex: /eyJ[A-Za-z0-9_-]+\.eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/g,
                type: SecurityErrorType.JWT_TOKEN_EXPOSED,
                name: 'JWT Token',
                severity: 'high' as const,
            },
            // Private keys
            {
                regex: /-----BEGIN (RSA |EC )?PRIVATE KEY-----/g,
                type: SecurityErrorType.PRIVATE_KEY_EXPOSED,
                name: 'Private Key',
                severity: 'critical' as const,
            },
            // Database connection strings
            {
                regex: /(mongodb|postgres|mysql):\/\/[^\s]+:[^\s]+@/gi,
                type: SecurityErrorType.HARDCODED_PASSWORD,
                name: 'Database Connection String with Credentials',
                severity: 'critical' as const,
            },
        ];

        for (const file of files) {
            // FIX: Skip directories (glob nodir doesn't always work)
            try {
                const stats = fs.statSync(file);
                if (stats.isDirectory()) {
                    continue;
                }
            } catch {
                continue; // File doesn't exist or not accessible
            }
            
            // Skip .env.example files
            if (file.includes('.example') || file.includes('.sample')) {
                continue;
            }

            // Read file with direct try-catch (tsup MUST keep this!)
            let content: string;
            try {
                // Check if directory first
                const fileStats = fs.statSync(file);
                if (fileStats.isDirectory()) {
                    continue; // Skip directories
                }
                // Read file content
                content = fs.readFileSync(file, 'utf8');
            } catch (readError: any) {
                // Handle EISDIR, EACCES, ENOENT errors
                if (readError.code === 'EISDIR' || readError.code === 'EACCES' || readError.code === 'ENOENT') {
                    continue; // Skip files we can't read
                }
                throw readError; // Re-throw unexpected errors
            }
            
            const lines = content.split('\n');

            for (const pattern of secretPatterns) {
                for (let index = 0; index < lines.length; index++) {
                    const line = lines[index];

                    // Skip comments
                    if (line.trim().startsWith('//') || line.trim().startsWith('#') || line.trim().startsWith('*')) {
                        continue;
                    }

                    const matches = line.matchAll(pattern.regex);
                    for (const match of matches) {
                        // Exclude common false positives
                        if (this.isLikelyFalsePositive(match[0])) {
                            continue;
                        }

                        errors.push({
                            file: path.relative(this.workspaceRoot, file),
                            line: index + 1,
                            column: match.index,
                            type: pattern.type,
                            severity: pattern.severity,
                            message: `${pattern.name} detected: ${match[0].substring(0, 30)}...`,
                            suggestedFix: 'Move sensitive data to environment variables (.env) and use process.env',
                        });
                    }
                }
            }
        }

        return errors;
    }

    /**
     * Detect injection vulnerabilities (SQL, Command, XSS)
     */
    private async detectInjectionVulnerabilities(dir: string): Promise<SecurityError[]> {
        const errors: SecurityError[] = [];

        const files = await glob('**/*.{ts,tsx,js,jsx}', {
            cwd: dir,
            absolute: true,
            ignore: this.ignorePatterns,
            nodir: true,
        });

        for (const file of files) {
            // Skip directories and handle errors
            try {
                const stats = fs.statSync(file);
                if (stats.isDirectory()) continue;
            } catch { continue; }
            
            // Read file with direct try-catch
            let content: string;
            try {
                const fileStats = fs.statSync(file);
                if (fileStats.isDirectory()) continue;
                content = fs.readFileSync(file, 'utf8');
            } catch (readError: any) {
                if (readError.code === 'EISDIR' || readError.code === 'EACCES' || readError.code === 'ENOENT') continue;
                throw readError;
            }
            
            const lines = content.split('\n');

            for (let index = 0; index < lines.length; index++) {
                const line = lines[index];

                // SQL Injection
                if (/execute\s*\(\s*['"`][^'"`]*\$\{|query\s*\(\s*['"`][^'"`]*\$\{/gi.test(line)) {
                    errors.push({
                        file: path.relative(this.workspaceRoot, file),
                        line: index + 1,
                        type: SecurityErrorType.SQL_INJECTION,
                        severity: 'critical',
                        message: 'Potential SQL injection: String interpolation in SQL query',
                        suggestedFix: 'Use parameterized queries or prepared statements',
                    });
                }

                // Command Injection
                if (/(exec|spawn|execSync|spawnSync)\s*\([^)]*\$\{/gi.test(line)) {
                    errors.push({
                        file: path.relative(this.workspaceRoot, file),
                        line: index + 1,
                        type: SecurityErrorType.COMMAND_INJECTION,
                        severity: 'critical',
                        message: 'Potential command injection: Unsanitized input in command execution',
                        suggestedFix: 'Sanitize inputs and use command arrays instead of string interpolation',
                    });
                }

                // XSS - dangerouslySetInnerHTML
                if (/dangerouslySetInnerHTML\s*=\s*\{\{/gi.test(line)) {
                    errors.push({
                        file: path.relative(this.workspaceRoot, file),
                        line: index + 1,
                        type: SecurityErrorType.XSS_VULNERABILITY,
                        severity: 'high',
                        message: 'Potential XSS: Using dangerouslySetInnerHTML',
                        suggestedFix: 'Sanitize HTML content using DOMPurify or avoid dangerouslySetInnerHTML',
                    });
                }

                // Path Traversal - Only flag if file operation has unsanitized input AND no path.join/resolve
                const hasFileOp = /readFile.*\$\{|writeFile.*\$\{|unlink.*\$\{/gi.test(line);
                const hasPathSanitization = /path\.join|path\.resolve/gi.test(line);
                const hasPrevLineSanitization = index > 0 && /path\.join|path\.resolve/gi.test(lines[index - 1]);

                if (hasFileOp && !hasPathSanitization && !hasPrevLineSanitization) {
                    errors.push({
                        file: path.relative(this.workspaceRoot, file),
                        line: index + 1,
                        type: SecurityErrorType.PATH_TRAVERSAL,
                        severity: 'high',
                        message: 'Potential path traversal: Unsanitized file path',
                        suggestedFix: 'Use path.join() or path.resolve() and validate paths',
                    });
                }
            }
        }

        return errors;
    }

    /**
     * Detect weak cryptography
     */
    private async detectWeakCryptography(dir: string): Promise<SecurityError[]> {
        const errors: SecurityError[] = [];

        const files = await glob('**/*.{ts,tsx,js,jsx}', {
            cwd: dir,
            absolute: true,
            ignore: this.ignorePatterns,
            nodir: true,
        });

        for (const file of files) {
            // Skip directories and handle errors
            try {
                const stats = fs.statSync(file);
                if (stats.isDirectory()) continue;
            } catch { continue; }
            
            // Read file with direct try-catch
            let content: string;
            try {
                const fileStats = fs.statSync(file);
                if (fileStats.isDirectory()) continue;
                content = fs.readFileSync(file, 'utf8');
            } catch (readError: any) {
                if (readError.code === 'EISDIR' || readError.code === 'EACCES' || readError.code === 'ENOENT') continue;
                throw readError;
            }
            
            const lines = content.split('\n');

            for (let index = 0; index < lines.length; index++) {
                const line = lines[index];

                // Weak hash algorithms
                if (/\b(md5|sha1)\b/i.test(line)) {
                    errors.push({
                        file: path.relative(this.workspaceRoot, file),
                        line: index + 1,
                        type: SecurityErrorType.WEAK_HASH,
                        severity: 'medium',
                        message: 'Weak hash algorithm detected (MD5/SHA1)',
                        suggestedFix: 'Use SHA-256 or stronger: crypto.createHash("sha256")',
                    });
                }

                // Math.random() for security
                if (/Math\.random\(\)/.test(line) && /(token|secret|key|password|salt)/gi.test(line)) {
                    errors.push({
                        file: path.relative(this.workspaceRoot, file),
                        line: index + 1,
                        type: SecurityErrorType.INSECURE_RANDOM,
                        severity: 'high',
                        message: 'Insecure random number generation for security-sensitive operation',
                        suggestedFix: 'Use crypto.randomBytes() for cryptographic purposes',
                    });
                }

                // Weak encryption algorithms
                if (/(DES|RC4|Blowfish)/.test(line)) {
                    errors.push({
                        file: path.relative(this.workspaceRoot, file),
                        line: index + 1,
                        type: SecurityErrorType.WEAK_CRYPTO,
                        severity: 'high',
                        message: 'Weak encryption algorithm detected',
                        suggestedFix: 'Use AES-256-GCM or ChaCha20-Poly1305',
                    });
                }
            }
        }

        return errors;
    }

    /**
     * Detect unsafe patterns
     */
    private async detectUnsafePatterns(dir: string): Promise<SecurityError[]> {
        const errors: SecurityError[] = [];

        const files = await glob('**/*.{ts,tsx,js,jsx}', {
            cwd: dir,
            absolute: true,
            ignore: this.ignorePatterns,
            nodir: true,
        });

        for (const file of files) {
            // Skip directories and handle errors
            try {
                const stats = fs.statSync(file);
                if (stats.isDirectory()) continue;
            } catch { continue; }
            
            // Read file with direct try-catch
            let content: string;
            try {
                const fileStats = fs.statSync(file);
                if (fileStats.isDirectory()) continue;
                content = fs.readFileSync(file, 'utf8');
            } catch (readError: any) {
                if (readError.code === 'EISDIR' || readError.code === 'EACCES' || readError.code === 'ENOENT') continue;
                throw readError;
            }
            
            const lines = content.split('\n');

            for (let index = 0; index < lines.length; index++) {
                const line = lines[index];

                // eval() usage
                if (/\beval\s*\(/i.test(line)) {
                    errors.push({
                        file: path.relative(this.workspaceRoot, file),
                        line: index + 1,
                        type: SecurityErrorType.UNSAFE_EVAL,
                        severity: 'critical',
                        message: 'Unsafe eval() usage detected',
                        suggestedFix: 'Avoid eval(). Use safer alternatives like JSON.parse() or Function()',
                    });
                }

                // Insecure deserialization
                if (/JSON\.parse\s*\([^)]*req\.|JSON\.parse\s*\([^)]*request\./gi.test(line)) {
                    errors.push({
                        file: path.relative(this.workspaceRoot, file),
                        line: index + 1,
                        type: SecurityErrorType.INSECURE_DESERIALIZATION,
                        severity: 'medium',
                        message: 'Potential insecure deserialization of user input',
                        suggestedFix: 'Validate and sanitize input before parsing JSON',
                    });
                }

                // CORS wildcard
                if (/cors\s*\(\s*\{\s*origin\s*:\s*['"`]\*['"`]/gi.test(line)) {
                    errors.push({
                        file: path.relative(this.workspaceRoot, file),
                        line: index + 1,
                        type: SecurityErrorType.CORS_MISCONFIGURATION,
                        severity: 'medium',
                        message: 'CORS configured with wildcard (*) origin',
                        suggestedFix: 'Specify allowed origins explicitly instead of using wildcard',
                    });
                }

                // Debug info in production - use smart scanner
                // Handled by smartScanner in detectSensitiveLogging() method
            }
        }

        return errors;
    }

    /**
     * Check if a match is likely a false positive
     * Enhanced to reduce false positives in config files and library names
     */
    private isLikelyFalsePositive(text: string): boolean {
        // Remove quotes/backticks from start and end for matching (e.g., "Content-Security-Policy" → Content-Security-Policy)
        const cleanText = text.replace(/^['"`]/, '').replace(/['"`]$/, '').trim();

        const falsePositives = [
            'example',
            'test',
            'demo',
            'sample',
            'placeholder',
            'your-api-key',
            'your_api_key',
            'YOUR_API_KEY',
            'xxx',
            '***',
            '...',
            'undefined',
            'null',
            'process.env',
            // Package-lock.json common fields
            'peerDependenciesMeta',
            'optionalDependencies',
            'peerDependencies',
            'devDependencies',
            'dependencies',
            // TypeScript config fields
            'noFallthroughCasesInSwitch',
            'noImplicitReturns',
            'noUnusedLocals',
            'noUnusedParameters',
            // Common npm package names (lowercase matches)
            'package-json',
            'is-fullwidth',
            'ts-interface',
            'fix-dts-default',
            'babel-plugin',
            'openapi-generator',
            '@openapi-tools',
            'remove-unused-imports',
            // ESLint rule names (frequently flagged as "API keys")
            'max-lines-per-function',
            'max-nested-callbacks',
            'no-duplicate-imports',
            'no-unused-vars',
            'no-console',
            'complexity',
            '@typescript-eslint',
            // HTTP Security Headers (NOT secrets!)
            'Content-Security-Policy',
            'Strict-Transport-Security',
            'X-Frame-Options',
            'X-Content-Type-Options',
            'X-XSS-Protection',
            'X-DNS-Prefetch-Control',
            'Referrer-Policy',
            'Permissions-Policy',
            'upgrade-insecure-requests',
            'strict-origin-when-cross-origin',
            'securityAndSEOValidation',
            'securityReport',
            'securityHeaders',
            'csp-header',
            'security-headers',
            'security-audit',
            'security-middleware',
            // Common config/variable names
            'configurationSchema',
            'packageManagerSchema',
            'workspaceConfiguration',
            // Prisma field names
            'remove-unused-imports',
            'babel-plugin-react-compiler',
        ];

        // Check if text contains any false positive pattern
        const lowerText = cleanText.toLowerCase();
        if (falsePositives.some(fp => lowerText.includes(fp.toLowerCase()))) {
            return true;
        }

        // Additional heuristics:
        // 1. If it's a hyphenated library name pattern (e.g., "some-package-name")
        if (/^[a-z0-9]+(-[a-z0-9]+){2,}$/.test(lowerText)) {
            return true;
        }

        // 2. If it's an @-scoped package name (e.g., "@typescript-eslint/parser")
        if (/^@[a-z0-9-]+\/[a-z0-9-]+/.test(lowerText)) {
            return true;
        }

        // 3. If it's in quotes in package.json context (dependency names)
        if (cleanText.includes('/') && cleanText.split('/').length >= 2) {
            return true; // Likely a package/path
        }

        return false;
    }

    /**
     * Map npm audit severity to our severity levels
     */
    private mapNpmSeverity(npmSeverity: string): SecurityError['severity'] {
        switch (npmSeverity.toLowerCase()) {
            case 'critical': return 'critical';
            case 'high': return 'high';
            case 'moderate': return 'medium';
            case 'low': return 'low';
            default: return 'info';
        }
    }

    /**
     * Get statistics about security issues
     */
    getStatistics(errors: SecurityError[]): {
        total: number;
        bySeverity: Record<string, number>;
        byType: Record<string, number>;
    } {
        const stats = {
            total: errors.length,
            bySeverity: {} as Record<string, number>,
            byType: {} as Record<string, number>,
        };

        for (const error of errors) {
            stats.bySeverity[error.severity] = (stats.bySeverity[error.severity] || 0) + 1;
            stats.byType[error.type] = (stats.byType[error.type] || 0) + 1;
        }

        return stats;
    }
}
