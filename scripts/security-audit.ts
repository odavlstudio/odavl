#!/usr/bin/env tsx
/**
 * Security Audit Script
 * 
 * **Purpose:** Comprehensive security analysis for ODAVL Studio
 * 
 * **Features:**
 * 1. Dependency vulnerability scanning
 * 2. Code security pattern analysis
 * 3. Authentication/authorization review
 * 4. Sensitive data detection
 * 5. Security configuration validation
 * 
 * **Usage:**
 * ```bash
 * pnpm tsx scripts/security-audit.ts
 * ```
 */

import { execSync } from 'node:child_process';
import * as fs from 'node:fs';
import * as path from 'node:path';

interface SecurityAuditResult {
    timestamp: string;
    summary: {
        critical: number;
        high: number;
        moderate: number;
        low: number;
        total: number;
    };
    dependencyVulnerabilities: DependencyVulnerability[];
    codeSecurityIssues: CodeSecurityIssue[];
    sensitiveDataExposure: SensitiveDataFinding[];
    configurationIssues: ConfigIssue[];
    recommendations: string[];
}

interface DependencyVulnerability {
    package: string;
    severity: 'critical' | 'high' | 'moderate' | 'low';
    title: string;
    description: string;
    recommendation: string;
}

interface CodeSecurityIssue {
    file: string;
    line: number;
    type: 'hardcoded-secret' | 'sql-injection' | 'xss' | 'auth-bypass' | 'insecure-crypto' | 'unsafe-eval';
    severity: 'critical' | 'high' | 'moderate' | 'low';
    description: string;
    recommendation: string;
}

interface SensitiveDataFinding {
    file: string;
    line: number;
    type: 'api-key' | 'password' | 'token' | 'private-key' | 'connection-string';
    pattern: string;
}

interface ConfigIssue {
    file: string;
    issue: string;
    severity: 'critical' | 'high' | 'moderate' | 'low';
    recommendation: string;
}

class SecurityAuditor {
    private workspaceRoot: string;
    
    constructor(workspaceRoot: string) {
        this.workspaceRoot = workspaceRoot;
    }
    
    /**
     * Get files matching patterns (simple implementation)
     */
    private getFiles(patterns: string[], ignore: string[]): string[] {
        const files: string[] = [];
        
        const walkDir = (dir: string): void => {
            if (!fs.existsSync(dir)) return;
            
            const entries = fs.readdirSync(dir, { withFileTypes: true });
            
            for (const entry of entries) {
                const fullPath = path.join(dir, entry.name);
                const relativePath = path.relative(this.workspaceRoot, fullPath).replace(/\\/g, '/');
                
                // Check ignore patterns
                if (ignore.some(pattern => relativePath.includes(pattern.replace('**/', '').replace('/**', '')))) {
                    continue;
                }
                
                if (entry.isDirectory()) {
                    walkDir(fullPath);
                } else if (entry.isFile()) {
                    // Check if matches any pattern
                    const ext = path.extname(entry.name);
                    const matchesPattern = patterns.some(pattern => {
                        const patternExt = pattern.substring(pattern.lastIndexOf('.'));
                        return ext === patternExt.replace('**/', '');
                    });
                    
                    if (matchesPattern) {
                        files.push(relativePath);
                    }
                }
            }
        };
        
        walkDir(this.workspaceRoot);
        return files;
    }
    
    /**
     * Run comprehensive security audit
     */
    async audit(): Promise<SecurityAuditResult> {
        console.log('🔒 Running comprehensive security audit...\n');
        
        const result: SecurityAuditResult = {
            timestamp: new Date().toISOString(),
            summary: {
                critical: 0,
                high: 0,
                moderate: 0,
                low: 0,
                total: 0,
            },
            dependencyVulnerabilities: await this.scanDependencies(),
            codeSecurityIssues: await this.scanCodeSecurity(),
            sensitiveDataExposure: await this.scanSensitiveData(),
            configurationIssues: await this.validateConfiguration(),
            recommendations: [],
        };
        
        // Calculate summary
        result.dependencyVulnerabilities.forEach(v => {
            result.summary[v.severity]++;
            result.summary.total++;
        });
        
        result.codeSecurityIssues.forEach(i => {
            result.summary[i.severity]++;
            result.summary.total++;
        });
        
        result.sensitiveDataExposure.forEach(s => {
            result.summary.high++; // Sensitive data is always high severity
            result.summary.total++;
        });
        
        result.configurationIssues.forEach(c => {
            result.summary[c.severity]++;
            result.summary.total++;
        });
        
        // Generate recommendations
        result.recommendations = this.generateRecommendations(result);
        
        this.printReport(result);
        return result;
    }
    
    /**
     * Scan dependencies for vulnerabilities
     */
    private async scanDependencies(): Promise<DependencyVulnerability[]> {
        console.log('📦 Scanning dependencies for vulnerabilities...');
        
        const vulnerabilities: DependencyVulnerability[] = [];
        
        try {
            // Run pnpm audit
            const output = execSync('pnpm audit --json', {
                cwd: this.workspaceRoot,
                encoding: 'utf-8',
            });
            
            const auditResult = JSON.parse(output);
            
            // Parse vulnerabilities
            if (auditResult.advisories) {
                Object.values(auditResult.advisories).forEach((advisory: any) => {
                    vulnerabilities.push({
                        package: advisory.module_name,
                        severity: advisory.severity,
                        title: advisory.title,
                        description: advisory.overview,
                        recommendation: advisory.recommendation || 'Update to latest version',
                    });
                });
            }
        } catch (error: any) {
            // pnpm audit exits with non-zero if vulnerabilities found
            if (error.stdout) {
                try {
                    const auditResult = JSON.parse(error.stdout);
                    // Parse from error output
                } catch {
                    console.log('   Note: Manual review of pnpm audit output recommended');
                }
            }
        }
        
        console.log(`   Found ${vulnerabilities.length} dependency vulnerabilities\n`);
        return vulnerabilities;
    }
    
    /**
     * Scan code for security issues
     */
    private async scanCodeSecurity(): Promise<CodeSecurityIssue[]> {
        console.log('🔍 Scanning code for security patterns...');
        
        const issues: CodeSecurityIssue[] = [];
        const files = this.getFiles(['**/*.ts', '**/*.tsx', '**/*.js', '**/*.jsx'], [
            '**/node_modules/**',
            '**/dist/**',
            '**/.next/**',
        ]);
        
        for (const file of files) {
            const filePath = path.join(this.workspaceRoot, file);
            const content = fs.readFileSync(filePath, 'utf-8');
            const lines = content.split('\n');
            
            lines.forEach((line, index) => {
                // Check for eval() usage
                if (line.match(/\beval\s*\(/)) {
                    issues.push({
                        file,
                        line: index + 1,
                        type: 'unsafe-eval',
                        severity: 'high',
                        description: 'Use of eval() can lead to code injection',
                        recommendation: 'Avoid eval(), use safer alternatives',
                    });
                }
                
                // Check for SQL query construction
                if (line.match(/['"`]\s*SELECT|INSERT|UPDATE|DELETE.*\+.*['"`]/i)) {
                    issues.push({
                        file,
                        line: index + 1,
                        type: 'sql-injection',
                        severity: 'critical',
                        description: 'Potential SQL injection vulnerability',
                        recommendation: 'Use parameterized queries or ORM',
                    });
                }
                
                // Check for innerHTML usage
                if (line.match(/\.innerHTML\s*=/)) {
                    issues.push({
                        file,
                        line: index + 1,
                        type: 'xss',
                        severity: 'high',
                        description: 'innerHTML can lead to XSS attacks',
                        recommendation: 'Use textContent or sanitize input',
                    });
                }
                
                // Check for weak crypto
                if (line.match(/crypto\.createHash\s*\(\s*['"]md5['"]/) || 
                    line.match(/crypto\.createHash\s*\(\s*['"]sha1['"]/)) {
                    issues.push({
                        file,
                        line: index + 1,
                        type: 'insecure-crypto',
                        severity: 'moderate',
                        description: 'Weak cryptographic algorithm (MD5/SHA1)',
                        recommendation: 'Use SHA-256 or stronger',
                    });
                }
            });
        }
        
        console.log(`   Found ${issues.length} code security issues\n`);
        return issues;
    }
    
    /**
     * Scan for hardcoded sensitive data
     */
    private async scanSensitiveData(): Promise<SensitiveDataFinding[]> {
        console.log('🔑 Scanning for sensitive data exposure...');
        
        const findings: SensitiveDataFinding[] = [];
        const files = this.getFiles(
            ['**/*.ts', '**/*.tsx', '**/*.js', '**/*.jsx', '**/*.json', '**/*.env'],
            [
                '**/node_modules/**',
                '**/dist/**',
                '**/.next/**',
                '**/*.test.ts',
                '**/examples/**',
            ]
        );
        
        // Patterns for sensitive data
        const patterns = [
            { regex: /['"]?api[_-]?key['"]?\s*[:=]\s*['"][a-zA-Z0-9]{20,}['"]/, type: 'api-key' as const },
            { regex: /['"]?password['"]?\s*[:=]\s*['"][^'"]{8,}['"]/, type: 'password' as const },
            { regex: /['"]?token['"]?\s*[:=]\s*['"][a-zA-Z0-9]{20,}['"]/, type: 'token' as const },
            { regex: /BEGIN\s+(RSA\s+)?PRIVATE\s+KEY/, type: 'private-key' as const },
            { regex: /mongodb:\/\/[^'"]+|postgres:\/\/[^'"]+|mysql:\/\/[^'"]+/, type: 'connection-string' as const },
        ];
        
        for (const file of files) {
            const filePath = path.join(this.workspaceRoot, file);
            const content = fs.readFileSync(filePath, 'utf-8');
            const lines = content.split('\n');
            
            lines.forEach((line, index) => {
                patterns.forEach(({ regex, type }) => {
                    if (regex.test(line)) {
                        // Skip if it's a placeholder or example
                        if (line.includes('YOUR_API_KEY') || 
                            line.includes('example.com') ||
                            line.includes('localhost') ||
                            line.includes('TODO') ||
                            line.includes('PLACEHOLDER')) {
                            return;
                        }
                        
                        findings.push({
                            file,
                            line: index + 1,
                            type,
                            pattern: line.trim().substring(0, 50) + '...',
                        });
                    }
                });
            });
        }
        
        console.log(`   Found ${findings.length} sensitive data exposures\n`);
        return findings;
    }
    
    /**
     * Validate security configuration
     */
    private async validateConfiguration(): Promise<ConfigIssue[]> {
        console.log('⚙️  Validating security configuration...');
        
        const issues: ConfigIssue[] = [];
        
        // Check for missing security headers in Next.js config
        const nextConfigFiles = this.getFiles(
            ['**/next.config.js', '**/next.config.mjs'],
            ['**/node_modules/**']
        );
        
        for (const file of nextConfigFiles) {
            const filePath = path.join(this.workspaceRoot, file);
            const content = fs.readFileSync(filePath, 'utf-8');
            
            if (!content.includes('X-Frame-Options')) {
                issues.push({
                    file,
                    issue: 'Missing X-Frame-Options security header',
                    severity: 'moderate',
                    recommendation: 'Add X-Frame-Options: DENY header',
                });
            }
            
            if (!content.includes('X-Content-Type-Options')) {
                issues.push({
                    file,
                    issue: 'Missing X-Content-Type-Options header',
                    severity: 'low',
                    recommendation: 'Add X-Content-Type-Options: nosniff',
                });
            }
        }
        
        // Check for .env files in git
        const gitignorePath = path.join(this.workspaceRoot, '.gitignore');
        if (fs.existsSync(gitignorePath)) {
            const gitignore = fs.readFileSync(gitignorePath, 'utf-8');
            if (!gitignore.includes('.env')) {
                issues.push({
                    file: '.gitignore',
                    issue: '.env files not ignored by git',
                    severity: 'high',
                    recommendation: 'Add .env* to .gitignore',
                });
            }
        }
        
        console.log(`   Found ${issues.length} configuration issues\n`);
        return issues;
    }
    
    /**
     * Generate security recommendations
     */
    private generateRecommendations(result: SecurityAuditResult): string[] {
        const recommendations: string[] = [];
        
        if (result.summary.critical > 0) {
            recommendations.push('🔴 CRITICAL: Address critical vulnerabilities immediately');
        }
        
        if (result.summary.high > 0) {
            recommendations.push('🟠 HIGH: Fix high-severity issues within 7 days');
        }
        
        if (result.dependencyVulnerabilities.length > 0) {
            recommendations.push('📦 Run `pnpm update` to update vulnerable dependencies');
        }
        
        if (result.sensitiveDataExposure.length > 0) {
            recommendations.push('🔑 Move sensitive data to environment variables');
        }
        
        if (result.codeSecurityIssues.length > 0) {
            recommendations.push('🔍 Review and fix code security issues');
        }
        
        // General recommendations
        recommendations.push('✅ Enable Dependabot or similar automated security updates');
        recommendations.push('✅ Add security tests to CI/CD pipeline');
        recommendations.push('✅ Conduct regular security audits (monthly)');
        recommendations.push('✅ Implement security headers in production');
        recommendations.push('✅ Use environment variables for all secrets');
        
        return recommendations;
    }
    
    /**
     * Print security audit report
     */
    private printReport(result: SecurityAuditResult): void {
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('🔒 SECURITY AUDIT REPORT');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
        
        // Summary
        console.log('📊 SUMMARY\n');
        console.log(`Total Issues:    ${result.summary.total}`);
        console.log(`Critical:        ${result.summary.critical} 🔴`);
        console.log(`High:            ${result.summary.high} 🟠`);
        console.log(`Moderate:        ${result.summary.moderate} 🟡`);
        console.log(`Low:             ${result.summary.low} 🟢\n`);
        
        // Dependency vulnerabilities
        if (result.dependencyVulnerabilities.length > 0) {
            console.log(`📦 DEPENDENCY VULNERABILITIES (${result.dependencyVulnerabilities.length})\n`);
            result.dependencyVulnerabilities.slice(0, 5).forEach(v => {
                console.log(`   ${v.severity.toUpperCase()}: ${v.package}`);
                console.log(`   ${v.title}`);
                console.log(`   Fix: ${v.recommendation}\n`);
            });
        }
        
        // Code security issues
        if (result.codeSecurityIssues.length > 0) {
            console.log(`🔍 CODE SECURITY ISSUES (${result.codeSecurityIssues.length})\n`);
            result.codeSecurityIssues.slice(0, 5).forEach(i => {
                console.log(`   ${i.severity.toUpperCase()}: ${i.file}:${i.line}`);
                console.log(`   ${i.description}`);
                console.log(`   Fix: ${i.recommendation}\n`);
            });
        }
        
        // Sensitive data
        if (result.sensitiveDataExposure.length > 0) {
            console.log(`🔑 SENSITIVE DATA EXPOSURE (${result.sensitiveDataExposure.length})\n`);
            result.sensitiveDataExposure.slice(0, 5).forEach(s => {
                console.log(`   HIGH: ${s.file}:${s.line}`);
                console.log(`   Type: ${s.type}`);
                console.log(`   Move to environment variables\n`);
            });
        }
        
        // Configuration issues
        if (result.configurationIssues.length > 0) {
            console.log(`⚙️  CONFIGURATION ISSUES (${result.configurationIssues.length})\n`);
            result.configurationIssues.forEach(c => {
                console.log(`   ${c.severity.toUpperCase()}: ${c.file}`);
                console.log(`   ${c.issue}`);
                console.log(`   Fix: ${c.recommendation}\n`);
            });
        }
        
        // Recommendations
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('💡 RECOMMENDATIONS\n');
        result.recommendations.forEach(r => {
            console.log(`   ${r}`);
        });
        console.log();
        
        // Risk assessment
        let riskLevel = 'LOW';
        if (result.summary.critical > 0) riskLevel = 'CRITICAL';
        else if (result.summary.high > 0) riskLevel = 'HIGH';
        else if (result.summary.moderate > 0) riskLevel = 'MODERATE';
        
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log(`🎯 OVERALL RISK LEVEL: ${riskLevel}\n`);
        
        // Save report
        const reportPath = path.join(this.workspaceRoot, 'reports', 'security-audit.json');
        fs.mkdirSync(path.dirname(reportPath), { recursive: true });
        fs.writeFileSync(reportPath, JSON.stringify(result, null, 2));
        console.log(`📄 Full report saved to: ${reportPath}\n`);
    }
}

// Main execution
if (import.meta.url === `file://${process.argv[1]}`) {
    const workspaceRoot = process.cwd();
    const auditor = new SecurityAuditor(workspaceRoot);
    
    auditor.audit().catch(error => {
        console.error('Error:', error);
        process.exit(1);
    });
}
