/**
 * ODAVL Guardian - Security Worker
 * Week 3 Day 4-6: OWASP + Dependency Scanning
 * 
 * Security auditing with:
 * - OWASP Top 10 scanning
 * - npm audit / Snyk
 * - XSS, CSRF, SQL injection detection
 * - Dependency vulnerability scanning
 */

import { Worker, Job, type JobProgress } from 'bullmq';
import { exec } from 'child_process';
import { promisify } from 'util';
import { RedisConnection } from './redis-connection.js';
import { Logger } from './logger.js';
import * as fs from 'fs/promises';
import * as path from 'path';

const execAsync = promisify(exec);

interface SecurityJobData {
    repoPath: string;
    projectId: string;
    userId: string;
    options?: {
        scanTypes?: ('dependencies' | 'code' | 'secrets' | 'containers')[];
        severity?: ('critical' | 'high' | 'medium' | 'low')[];
    };
}

interface SecurityResult {
    jobId: string;
    timestamp: string;
    summary: {
        critical: number;
        high: number;
        medium: number;
        low: number;
        total: number;
    };
    vulnerabilities: Array<{
        id: string;
        title: string;
        severity: 'critical' | 'high' | 'medium' | 'low';
        category:
            | 'dependency'
            | 'code-injection'
            | 'xss'
            | 'csrf'
            | 'secret-exposure'
            | 'misconfiguration';
        description: string;
        file?: string;
        line?: number;
        recommendation: string;
        cwe?: string;
        cvss?: number;
    }>;
    dependencies: {
        total: number;
        outdated: number;
        vulnerable: number;
        vulnerabilities: Array<{
            name: string;
            version: string;
            severity: string;
            vulnerabilityId: string;
            title: string;
            url: string;
        }>;
    };
    owaspTop10: {
        [key: string]: Array<{
            category: string;
            finding: string;
            severity: string;
            location: string;
        }>;
    };
}

export class SecurityWorker {
    private worker: Worker;
    private logger: Logger;
    private connection: RedisConnection;

    constructor() {
        this.logger = new Logger('SecurityWorker');
        this.connection = new RedisConnection();

        this.worker = new Worker(
            'guardian-security',
            async (job: Job<SecurityJobData>) => {
                return await this.processSecurityJob(job);
            },
            {
                connection: this.connection.getConnection(),
                concurrency: 3, // Run 3 security scans in parallel
                limiter: {
                    max: 20,
                    duration: 60000,
                },
            }
        );

        this.setupEventHandlers();
    }

    private async processSecurityJob(job: Job<SecurityJobData>): Promise<SecurityResult> {
        const { repoPath, projectId, userId, options = {} } = job.data;
        const jobId = job.id || 'unknown';

        this.logger.info(`Starting security audit for ${repoPath} (Job: ${jobId})`);
        await job.updateProgress(5);

        const scanTypes = options.scanTypes || ['dependencies', 'code', 'secrets'];
        const result: SecurityResult = {
            jobId,
            timestamp: new Date().toISOString(),
            summary: { critical: 0, high: 0, medium: 0, low: 0, total: 0 },
            vulnerabilities: [],
            dependencies: {
                total: 0,
                outdated: 0,
                vulnerable: 0,
                vulnerabilities: [],
            },
            owaspTop10: {},
        };

        // Scan dependencies
        if (scanTypes.includes('dependencies')) {
            await job.updateProgress(15);
            const depVulns = await this.scanDependencies(repoPath);
            result.dependencies = depVulns;
            result.vulnerabilities.push(...this.mapDependencyVulnerabilities(depVulns));
        }

        // Scan code for security issues
        if (scanTypes.includes('code')) {
            await job.updateProgress(40);
            const codeVulns = await this.scanCode(repoPath);
            result.vulnerabilities.push(...codeVulns);
            result.owaspTop10 = this.categorizeByOWASP(codeVulns);
        }

        // Scan for secrets
        if (scanTypes.includes('secrets')) {
            await job.updateProgress(70);
            const secrets = await this.scanSecrets(repoPath);
            result.vulnerabilities.push(...secrets);
        }

        // Calculate summary
        result.vulnerabilities.forEach((vuln) => {
            result.summary[vuln.severity]++;
            result.summary.total++;
        });

        await job.updateProgress(90);

        // Store results
        await this.connection.storeResult(
            `security:${projectId}:${userId}:${jobId}`,
            result,
            30 * 24 * 60 * 60 // 30 days
        );

        await job.updateProgress(100);

        this.logger.info(
            `Security audit completed - Found ${result.summary.total} issues (${result.summary.critical} critical)`
        );

        return result;
    }

    private async scanDependencies(repoPath: string): Promise<SecurityResult['dependencies']> {
        const dependencies: SecurityResult['dependencies'] = {
            total: 0,
            outdated: 0,
            vulnerable: 0,
            vulnerabilities: [],
        };

        try {
            // Check if package.json exists
            const packageJsonPath = path.join(repoPath, 'package.json');
            await fs.access(packageJsonPath);

            // Run npm audit
            try {
                const { stdout } = await execAsync('npm audit --json', { cwd: repoPath });
                const auditResult = JSON.parse(stdout);

                dependencies.total = auditResult.metadata?.dependencies || 0;
                dependencies.vulnerable = Object.keys(auditResult.vulnerabilities || {}).length;

                for (const [name, data] of Object.entries(auditResult.vulnerabilities || {})) {
                    const vuln = data as any;
                    dependencies.vulnerabilities.push({
                        name,
                        version: vuln.version || 'unknown',
                        severity: vuln.severity || 'low',
                        vulnerabilityId: vuln.via?.[0]?.source || 'unknown',
                        title: vuln.via?.[0]?.title || 'Vulnerability detected',
                        url: vuln.via?.[0]?.url || '',
                    });
                }
            } catch (auditError) {
                this.logger.warn('npm audit failed, trying yarn audit...');

                try {
                    const { stdout } = await execAsync('yarn audit --json', { cwd: repoPath });
                    const lines = stdout.trim().split('\n');
                    const auditResult = JSON.parse(lines[lines.length - 1]);

                    dependencies.vulnerable = auditResult.data?.vulnerabilities?.length || 0;
                } catch (yarnError) {
                    this.logger.warn('yarn audit also failed');
                }
            }

            // Check for outdated packages
            try {
                const { stdout } = await execAsync('npm outdated --json', { cwd: repoPath });
                const outdated = JSON.parse(stdout || '{}');
                dependencies.outdated = Object.keys(outdated).length;
            } catch {
                // npm outdated exits with code 1 if there are outdated packages
            }
        } catch (error) {
            this.logger.warn('No package.json found or dependency scan failed');
        }

        return dependencies;
    }

    private async scanCode(
        repoPath: string
    ): Promise<Array<SecurityResult['vulnerabilities'][number]>> {
        const vulnerabilities: Array<SecurityResult['vulnerabilities'][number]> = [];

        try {
            // Scan for common security patterns
            const files = await this.getJavaScriptFiles(repoPath);

            for (const file of files) {
                const content = await fs.readFile(file, 'utf-8');
                const relPath = path.relative(repoPath, file);

                // SQL Injection patterns
                if (/\$\{.*\}|[\`\'\"].*\+.*[\`\'\"]/.test(content)) {
                    const lines = content.split('\n');
                    lines.forEach((line, index) => {
                        if (/query|execute|sql/i.test(line) && /[\`\'\"].*\+/.test(line)) {
                            vulnerabilities.push({
                                id: `sql-injection-${vulnerabilities.length}`,
                                title: 'Potential SQL Injection',
                                severity: 'high',
                                category: 'code-injection',
                                description: 'String concatenation in SQL query detected',
                                file: relPath,
                                line: index + 1,
                                recommendation:
                                    'Use parameterized queries or prepared statements',
                                cwe: 'CWE-89',
                            });
                        }
                    });
                }

                // XSS patterns
                if (/innerHTML|dangerouslySetInnerHTML/i.test(content)) {
                    const lines = content.split('\n');
                    lines.forEach((line, index) => {
                        if (/innerHTML|dangerouslySetInnerHTML/.test(line)) {
                            vulnerabilities.push({
                                id: `xss-${vulnerabilities.length}`,
                                title: 'Potential XSS Vulnerability',
                                severity: 'high',
                                category: 'xss',
                                description: 'Direct HTML injection detected',
                                file: relPath,
                                line: index + 1,
                                recommendation: 'Sanitize user input before rendering',
                                cwe: 'CWE-79',
                            });
                        }
                    });
                }

                // Eval usage
                if (/\beval\s*\(/.test(content)) {
                    vulnerabilities.push({
                        id: `eval-${vulnerabilities.length}`,
                        title: 'Use of eval()',
                        severity: 'critical',
                        category: 'code-injection',
                        description: 'eval() can execute arbitrary code',
                        file: relPath,
                        recommendation: 'Avoid eval(), use safer alternatives',
                        cwe: 'CWE-95',
                    });
                }

                // CSRF - Missing CSRF tokens
                if (
                    /method=['"]post/i.test(content) &&
                    !/csrf|_token/i.test(content)
                ) {
                    vulnerabilities.push({
                        id: `csrf-${vulnerabilities.length}`,
                        title: 'Missing CSRF Protection',
                        severity: 'medium',
                        category: 'csrf',
                        description: 'POST form without CSRF token detected',
                        file: relPath,
                        recommendation: 'Implement CSRF tokens for state-changing operations',
                        cwe: 'CWE-352',
                    });
                }

                // Insecure randomness
                if (/Math\.random\(\)/.test(content) && /token|password|secret/i.test(content)) {
                    vulnerabilities.push({
                        id: `weak-random-${vulnerabilities.length}`,
                        title: 'Weak Random Number Generation',
                        severity: 'medium',
                        category: 'misconfiguration',
                        description: 'Math.random() is not cryptographically secure',
                        file: relPath,
                        recommendation: 'Use crypto.randomBytes() for security-sensitive operations',
                        cwe: 'CWE-330',
                    });
                }
            }
        } catch (error) {
            this.logger.error('Code scanning failed:', error);
        }

        return vulnerabilities;
    }

    private async scanSecrets(
        repoPath: string
    ): Promise<Array<SecurityResult['vulnerabilities'][number]>> {
        const vulnerabilities: Array<SecurityResult['vulnerabilities'][number]> = [];

        try {
            const files = await this.getJavaScriptFiles(repoPath);

            const secretPatterns = [
                {
                    name: 'AWS Access Key',
                    regex: /AKIA[0-9A-Z]{16}/g,
                    severity: 'critical' as const,
                },
                {
                    name: 'GitHub Token',
                    regex: /ghp_[a-zA-Z0-9]{36}/g,
                    severity: 'critical' as const,
                },
                {
                    name: 'Private Key',
                    regex: /-----BEGIN (RSA |EC |DSA |OPENSSH )?PRIVATE KEY-----/g,
                    severity: 'critical' as const,
                },
                {
                    name: 'JWT Token',
                    regex: /eyJ[a-zA-Z0-9_-]*\.eyJ[a-zA-Z0-9_-]*\.[a-zA-Z0-9_-]*/g,
                    severity: 'high' as const,
                },
                {
                    name: 'Database Connection String',
                    regex: /(?:mongodb|postgresql|mysql):\/\/[^\s"']+/gi,
                    severity: 'high' as const,
                },
                {
                    name: 'API Key Pattern',
                    regex: /['"]?[aA][pP][iI]_?[kK][eE][yY]['"]?\s*[:=]\s*['"][^'"]+['"]/g,
                    severity: 'high' as const,
                },
            ];

            for (const file of files) {
                const content = await fs.readFile(file, 'utf-8');
                const relPath = path.relative(repoPath, file);

                for (const pattern of secretPatterns) {
                    const matches = content.match(pattern.regex);
                    if (matches) {
                        matches.forEach((match) => {
                            vulnerabilities.push({
                                id: `secret-${vulnerabilities.length}`,
                                title: `Hardcoded ${pattern.name}`,
                                severity: pattern.severity,
                                category: 'secret-exposure',
                                description: `${pattern.name} found in source code`,
                                file: relPath,
                                recommendation:
                                    'Move secrets to environment variables or secure vault',
                                cwe: 'CWE-798',
                            });
                        });
                    }
                }
            }
        } catch (error) {
            this.logger.error('Secret scanning failed:', error);
        }

        return vulnerabilities;
    }

    private async getJavaScriptFiles(repoPath: string): Promise<string[]> {
        const files: string[] = [];

        async function walk(dir: string) {
            const entries = await fs.readdir(dir, { withFileTypes: true });

            for (const entry of entries) {
                const fullPath = path.join(dir, entry.name);

                // Skip node_modules and .git
                if (entry.name === 'node_modules' || entry.name === '.git') {
                    continue;
                }

                if (entry.isDirectory()) {
                    await walk(fullPath);
                } else if (/\.(js|jsx|ts|tsx)$/i.test(entry.name)) {
                    files.push(fullPath);
                }
            }
        }

        await walk(repoPath);
        return files;
    }

    private mapDependencyVulnerabilities(
        deps: SecurityResult['dependencies']
    ): Array<SecurityResult['vulnerabilities'][number]> {
        return deps.vulnerabilities.map((vuln, index) => ({
            id: `dep-${index}`,
            title: vuln.title,
            severity: (vuln.severity as any) || 'medium',
            category: 'dependency' as const,
            description: `${vuln.name}@${vuln.version} has known vulnerability`,
            recommendation: `Update ${vuln.name} to a patched version`,
        }));
    }

    private categorizeByOWASP(
        vulnerabilities: Array<SecurityResult['vulnerabilities'][number]>
    ): SecurityResult['owaspTop10'] {
        const owasp: SecurityResult['owaspTop10'] = {};

        const categoryMap: { [key: string]: string } = {
            'code-injection': 'A03:2021 - Injection',
            xss: 'A03:2021 - Injection',
            csrf: 'A01:2021 - Broken Access Control',
            'secret-exposure': 'A02:2021 - Cryptographic Failures',
            misconfiguration: 'A05:2021 - Security Misconfiguration',
            dependency: 'A06:2021 - Vulnerable and Outdated Components',
        };

        vulnerabilities.forEach((vuln) => {
            const owaspCategory = categoryMap[vuln.category] || 'Other';
            if (!owasp[owaspCategory]) {
                owasp[owaspCategory] = [];
            }
            owasp[owaspCategory].push({
                category: vuln.category,
                finding: vuln.title,
                severity: vuln.severity,
                location: vuln.file || 'N/A',
            });
        });

        return owasp;
    }

    private setupEventHandlers(): void {
        this.worker.on('completed', (job: Job, result: SecurityResult) => {
            this.logger.info(
                `Job ${job.id} completed - Found ${result.summary.total} security issues`
            );
        });

        this.worker.on('failed', (job: Job | undefined, error: Error) => {
            this.logger.error(`Job ${job?.id} failed:`, error.message);
        });

        this.worker.on('progress', (job: Job, progress: JobProgress) => {
            this.logger.debug(`Job ${job.id} progress: ${progress}%`);
        });

        this.worker.on('error', (error: Error) => {
            this.logger.error('Worker error:', error);
        });
    }

    async start(): Promise<void> {
        this.logger.info('Security Worker started - Listening for jobs...');
    }

    async stop(): Promise<void> {
        await this.worker.close();
        await this.connection.disconnect();
        this.logger.info('Security Worker stopped');
    }
}

// Start worker if run directly
if (import.meta.url === `file://${process.argv[1]}`) {
    const worker = new SecurityWorker();
    await worker.start();

    process.on('SIGINT', async () => {
        console.log('Shutting down Security Worker...');
        await worker.stop();
        process.exit(0);
    });
}
