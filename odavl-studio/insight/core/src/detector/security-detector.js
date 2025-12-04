"use strict";
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
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.SecurityDetector = exports.SecurityErrorType = void 0;
const node_child_process_1 = require("node:child_process");
const fs = __importStar(require("node:fs"));
const path = __importStar(require("node:path"));
const glob_1 = require("glob");
const smart_security_scanner_1 = require("./smart-security-scanner");
var SecurityErrorType;
(function (SecurityErrorType) {
    // Dependency vulnerabilities
    SecurityErrorType["CVE"] = "CVE";
    SecurityErrorType["OUTDATED_DEPENDENCY"] = "OUTDATED_DEPENDENCY";
    // Secrets & credentials
    SecurityErrorType["HARDCODED_SECRET"] = "HARDCODED_SECRET";
    SecurityErrorType["HARDCODED_PASSWORD"] = "HARDCODED_PASSWORD";
    SecurityErrorType["API_KEY_EXPOSED"] = "API_KEY_EXPOSED";
    SecurityErrorType["JWT_TOKEN_EXPOSED"] = "JWT_TOKEN_EXPOSED";
    SecurityErrorType["PRIVATE_KEY_EXPOSED"] = "PRIVATE_KEY_EXPOSED";
    // Injection vulnerabilities
    SecurityErrorType["SQL_INJECTION"] = "SQL_INJECTION";
    SecurityErrorType["COMMAND_INJECTION"] = "COMMAND_INJECTION";
    SecurityErrorType["CODE_INJECTION"] = "CODE_INJECTION";
    SecurityErrorType["XSS_VULNERABILITY"] = "XSS_VULNERABILITY";
    SecurityErrorType["PATH_TRAVERSAL"] = "PATH_TRAVERSAL";
    // Cryptography
    SecurityErrorType["WEAK_CRYPTO"] = "WEAK_CRYPTO";
    SecurityErrorType["INSECURE_RANDOM"] = "INSECURE_RANDOM";
    SecurityErrorType["WEAK_HASH"] = "WEAK_HASH";
    // Misconfigurations
    SecurityErrorType["UNSAFE_EVAL"] = "UNSAFE_EVAL";
    SecurityErrorType["INSECURE_DESERIALIZATION"] = "INSECURE_DESERIALIZATION";
    SecurityErrorType["MISSING_CSRF_PROTECTION"] = "MISSING_CSRF_PROTECTION";
    SecurityErrorType["CORS_MISCONFIGURATION"] = "CORS_MISCONFIGURATION";
    // Information disclosure
    SecurityErrorType["SENSITIVE_DATA_EXPOSURE"] = "SENSITIVE_DATA_EXPOSURE";
    SecurityErrorType["DEBUG_INFO_LEAK"] = "DEBUG_INFO_LEAK";
})(SecurityErrorType || (exports.SecurityErrorType = SecurityErrorType = {}));
class SecurityDetector {
    workspaceRoot;
    ignorePatterns;
    smartScanner;
    constructor(workspaceRoot) {
        this.workspaceRoot = workspaceRoot;
        this.smartScanner = new smart_security_scanner_1.SmartSecurityScanner(workspaceRoot);
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
    async detect(targetDir) {
        const dir = targetDir || this.workspaceRoot;
        const errors = [];
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
    async detectSensitiveLogging(targetDir) {
        try {
            const securityIssues = await this.smartScanner.detect(targetDir);
            // Convert SmartSecurityIssue to SecurityError format
            return securityIssues.map((issue) => ({
                file: issue.file,
                line: issue.line,
                column: issue.column,
                type: SecurityErrorType.DEBUG_INFO_LEAK,
                severity: issue.severity,
                message: issue.message,
                details: `Category: ${issue.category}, Variable: ${issue.sensitiveVariable}, Confidence: ${issue.confidence}%`,
                suggestedFix: issue.suggestedFix
            }));
        }
        catch (error) {
            console.error('[SecurityDetector] Smart scanner error:', error);
            return [];
        }
    }
    /**
     * Detect CVEs in dependencies using npm audit
     */
    async detectCVEs(dir) {
        const errors = [];
        try {
            const packageJsonPath = path.join(dir, 'package.json');
            if (!fs.existsSync(packageJsonPath)) {
                return errors;
            }
            // Run npm audit with JSON output
            const auditOutput = (0, node_child_process_1.execSync)('npm audit --json', {
                cwd: dir,
                encoding: 'utf8',
                stdio: 'pipe',
            });
            const auditData = JSON.parse(auditOutput);
            // Parse vulnerabilities
            if (auditData.vulnerabilities) {
                for (const [pkgName, vuln] of Object.entries(auditData.vulnerabilities)) {
                    const v = vuln; // Type assertion for npm audit output
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
                            ? `Run: npm audit fix or update to ${v.fixAvailable.version || 'latest version'}`
                            : 'No automated fix available. Check package documentation.',
                    });
                }
            }
        }
        catch (error) {
            // npm audit returns non-zero exit code when vulnerabilities found
            if (error.stdout) {
                try {
                    const auditData = JSON.parse(error.stdout);
                    if (auditData.vulnerabilities) {
                        return this.detectCVEs(dir); // Recursive call to parse
                    }
                }
                catch {
                    // Failed to parse, continue
                }
            }
        }
        return errors;
    }
    /**
     * Detect hardcoded secrets in source files
     */
    async detectHardcodedSecrets(dir) {
        const errors = [];
        // File patterns to scan
        const files = await (0, glob_1.glob)('**/*.{ts,tsx,js,jsx,mjs,cjs,json,yaml,yml,env}', {
            cwd: dir,
            absolute: true,
            ignore: this.ignorePatterns,
        });
        // Secret patterns
        const secretPatterns = [
            // API Keys
            {
                regex: /['"`]([A-Za-z0-9_-]{20,})['"` ]/g,
                type: SecurityErrorType.API_KEY_EXPOSED,
                name: 'Potential API Key',
                severity: 'high',
            },
            // AWS Keys
            {
                regex: /AKIA[0-9A-Z]{16}/g,
                type: SecurityErrorType.HARDCODED_SECRET,
                name: 'AWS Access Key',
                severity: 'critical',
            },
            // GitHub Tokens
            {
                regex: /ghp_[0-9a-zA-Z]{36}/g,
                type: SecurityErrorType.API_KEY_EXPOSED,
                name: 'GitHub Personal Access Token',
                severity: 'critical',
            },
            // Generic secrets in variable names
            {
                regex: /(password|passwd|pwd|secret|token|apikey|api_key)\s*[=:]\s*['"`]([^'"`\s]{8,})['"`]/gi,
                type: SecurityErrorType.HARDCODED_PASSWORD,
                name: 'Hardcoded Credential',
                severity: 'critical',
            },
            // JWT tokens
            {
                regex: /eyJ[A-Za-z0-9_-]+\.eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/g,
                type: SecurityErrorType.JWT_TOKEN_EXPOSED,
                name: 'JWT Token',
                severity: 'high',
            },
            // Private keys
            {
                regex: /-----BEGIN (RSA |EC )?PRIVATE KEY-----/g,
                type: SecurityErrorType.PRIVATE_KEY_EXPOSED,
                name: 'Private Key',
                severity: 'critical',
            },
            // Database connection strings
            {
                regex: /(mongodb|postgres|mysql):\/\/[^\s]+:[^\s]+@/gi,
                type: SecurityErrorType.HARDCODED_PASSWORD,
                name: 'Database Connection String with Credentials',
                severity: 'critical',
            },
        ];
        for (const file of files) {
            // Skip .env.example files
            if (file.includes('.example') || file.includes('.sample')) {
                continue;
            }
            const content = fs.readFileSync(file, 'utf8');
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
     * Detect injection vulnerabilities
     */
    async detectInjectionVulnerabilities(dir) {
        const errors = [];
        const files = await (0, glob_1.glob)('**/*.{ts,tsx,js,jsx}', {
            cwd: dir,
            absolute: true,
            ignore: this.ignorePatterns,
        });
        for (const file of files) {
            const content = fs.readFileSync(file, 'utf8');
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
    async detectWeakCryptography(dir) {
        const errors = [];
        const files = await (0, glob_1.glob)('**/*.{ts,tsx,js,jsx}', {
            cwd: dir,
            absolute: true,
            ignore: this.ignorePatterns,
        });
        for (const file of files) {
            const content = fs.readFileSync(file, 'utf8');
            const lines = content.split('\n');
            for (let index = 0; index < lines.length; index++) {
                const line = lines[index];
                // Weak hash algorithms
                if (/createHash\s*\(\s*['"`](md5|sha1)['"`]\)/gi.test(line)) {
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
    async detectUnsafePatterns(dir) {
        const errors = [];
        const files = await (0, glob_1.glob)('**/*.{ts,tsx,js,jsx}', {
            cwd: dir,
            absolute: true,
            ignore: this.ignorePatterns,
        });
        for (const file of files) {
            const content = fs.readFileSync(file, 'utf8');
            const lines = content.split('\n');
            for (let index = 0; index < lines.length; index++) {
                const line = lines[index];
                // eval() usage
                if (/\beval\s*\(/gi.test(line)) {
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
     */
    isLikelyFalsePositive(text) {
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
            // HTTP Security Headers (NOT secrets!)
            'Content-Security-Policy',
            'Strict-Transport-Security',
            'X-Frame-Options',
            'X-Content-Type-Options',
            'X-XSS-Protection',
            'Referrer-Policy',
            'Permissions-Policy',
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
        ];
        // Check if text contains any false positive pattern
        const lowerText = cleanText.toLowerCase();
        return falsePositives.some(fp => lowerText.includes(fp.toLowerCase()));
    }
    /**
     * Map npm audit severity to our severity levels
     */
    mapNpmSeverity(npmSeverity) {
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
    getStatistics(errors) {
        const stats = {
            total: errors.length,
            bySeverity: {},
            byType: {},
        };
        for (const error of errors) {
            stats.bySeverity[error.severity] = (stats.bySeverity[error.severity] || 0) + 1;
            stats.byType[error.type] = (stats.byType[error.type] || 0) + 1;
        }
        return stats;
    }
}
exports.SecurityDetector = SecurityDetector;
//# sourceMappingURL=security-detector.js.map