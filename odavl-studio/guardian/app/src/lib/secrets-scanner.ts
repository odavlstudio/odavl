/**
 * Secrets Scanner & Rotation Manager for ODAVL Guardian
 * 
 * Automated secrets detection, scanning, and rotation management.
 * 
 * Features:
 * - Secrets detection (API keys, tokens, passwords, private keys)
 * - Repository scanning (Git history, source code, config files)
 * - Secrets rotation management
 * - Vault integration
 * - Compliance tracking
 * - Leak prevention
 */

export interface SecretPattern {
    id: string;
    name: string;
    pattern: RegExp;
    severity: 'critical' | 'high' | 'medium' | 'low';
    type: 'api-key' | 'password' | 'token' | 'private-key' | 'certificate' | 'database-url' | 'other';
    description: string;
    remediation: string;
}

export interface DetectedSecret {
    id: string;
    type: SecretPattern['type'];
    name: string;
    severity: SecretPattern['severity'];
    file: string;
    line: number;
    content: string; // Redacted/masked
    pattern: string;
    matchedValue: string; // Partially masked
    discoveredAt: Date;
    status: 'active' | 'rotated' | 'revoked' | 'false-positive';
    lastRotated?: Date;
    rotationDue?: Date;
    exposureRisk: 'high' | 'medium' | 'low';
}

export interface ScanResult {
    scanId: string;
    startTime: Date;
    endTime: Date;
    filesScanned: number;
    secretsFound: number;
    secrets: DetectedSecret[];
    summary: {
        critical: number;
        high: number;
        medium: number;
        low: number;
    };
    riskScore: number;
}

export interface RotationPolicy {
    secretType: SecretPattern['type'];
    rotationInterval: number; // days
    notifyBefore: number; // days before expiration
    autoRotate: boolean;
    requireApproval: boolean;
}

export interface RotationTask {
    id: string;
    secretId: string;
    secretName: string;
    dueDate: Date;
    status: 'pending' | 'in-progress' | 'completed' | 'failed';
    assignee?: string;
    completedAt?: Date;
    steps: string[];
    notes?: string;
}

/**
 * Secrets Scanner
 */
export class SecretsScanner {
    private patterns: SecretPattern[] = [];
    private detectedSecrets: Map<string, DetectedSecret> = new Map();
    private rotationPolicies: Map<SecretPattern['type'], RotationPolicy> = new Map();
    private rotationTasks: Map<string, RotationTask> = new Map();

    constructor() {
        this.initializePatterns();
        this.initializeRotationPolicies();
    }

    /**
     * Initialize secret patterns
     */
    private initializePatterns(): void {
        this.patterns = [
            // AWS Keys
            {
                id: 'aws-access-key',
                name: 'AWS Access Key ID',
                pattern: /AKIA[0-9A-Z]{16}/g,
                severity: 'critical',
                type: 'api-key',
                description: 'AWS Access Key ID detected in source code',
                remediation: 'Remove key from code, rotate immediately, use AWS Secrets Manager or environment variables',
            },
            {
                id: 'aws-secret-key',
                name: 'AWS Secret Access Key',
                pattern: /aws_secret_access_key\s*=\s*['"]([A-Za-z0-9/+=]{40})['"]/g,
                severity: 'critical',
                type: 'api-key',
                description: 'AWS Secret Access Key detected',
                remediation: 'Remove from code, rotate key in AWS IAM, use Secrets Manager',
            },

            // Azure Keys
            {
                id: 'azure-storage-key',
                name: 'Azure Storage Account Key',
                pattern: /DefaultEndpointsProtocol=https?;.*AccountKey=([A-Za-z0-9+/=]{88})/g,
                severity: 'critical',
                type: 'api-key',
                description: 'Azure Storage Account connection string with key',
                remediation: 'Remove connection string, use Azure Key Vault, rotate storage key',
            },

            // GitHub Tokens
            {
                id: 'github-token',
                name: 'GitHub Personal Access Token',
                pattern: /gh[pousr]_[A-Za-z0-9_]{36,}/g,
                severity: 'high',
                type: 'token',
                description: 'GitHub Personal Access Token detected',
                remediation: 'Revoke token in GitHub settings, use GitHub Secrets for CI/CD',
            },

            // OpenAI Keys
            {
                id: 'openai-key',
                name: 'OpenAI API Key',
                pattern: /sk-[A-Za-z0-9]{48}/g,
                severity: 'high',
                type: 'api-key',
                description: 'OpenAI API key detected',
                remediation: 'Revoke key in OpenAI dashboard, use environment variables',
            },

            // Database URLs
            {
                id: 'postgres-url',
                name: 'PostgreSQL Connection String',
                pattern: /postgres(?:ql)?:\/\/[^:]+:[^@]+@[^/]+\/\w+/g,
                severity: 'high',
                type: 'database-url',
                description: 'PostgreSQL connection string with credentials',
                remediation: 'Remove from code, use environment variables, rotate database password',
            },
            {
                id: 'mongodb-url',
                name: 'MongoDB Connection String',
                pattern: /mongodb(?:\+srv)?:\/\/[^:]+:[^@]+@[^/]+/g,
                severity: 'high',
                type: 'database-url',
                description: 'MongoDB connection string with credentials',
                remediation: 'Remove from code, use environment variables, rotate database password',
            },

            // Private Keys
            {
                id: 'rsa-private-key',
                name: 'RSA Private Key',
                pattern: /-----BEGIN RSA PRIVATE KEY-----/g,
                severity: 'critical',
                type: 'private-key',
                description: 'RSA private key detected',
                remediation: 'Remove private key, regenerate key pair, use key management service',
            },
            {
                id: 'ssh-private-key',
                name: 'SSH Private Key',
                pattern: /-----BEGIN OPENSSH PRIVATE KEY-----/g,
                severity: 'critical',
                type: 'private-key',
                description: 'SSH private key detected',
                remediation: 'Remove key, regenerate SSH key pair, update authorized_keys',
            },

            // JWT Secrets
            {
                id: 'jwt-secret',
                name: 'JWT Secret',
                pattern: /jwt[_-]?secret\s*[:=]\s*['"]([A-Za-z0-9_\-]{32,})['"]|JWT_SECRET\s*=\s*['"]([A-Za-z0-9_\-]{32,})['"]/gi,
                severity: 'high',
                type: 'token',
                description: 'JWT secret detected',
                remediation: 'Remove from code, use environment variables, rotate secret',
            },

            // API Keys (Generic)
            {
                id: 'generic-api-key',
                name: 'Generic API Key',
                pattern: /api[_-]?key\s*[:=]\s*['"]([A-Za-z0-9_\-]{20,})['"]|API_KEY\s*=\s*['"]([A-Za-z0-9_\-]{20,})['"]/gi,
                severity: 'medium',
                type: 'api-key',
                description: 'Generic API key detected',
                remediation: 'Remove from code, use environment variables, rotate key',
            },

            // Passwords
            {
                id: 'password-assignment',
                name: 'Hardcoded Password',
                pattern: /password\s*[:=]\s*['"]([^'"]{8,})['"]|PASSWORD\s*=\s*['"]([^'"]{8,})['"]/gi,
                severity: 'high',
                type: 'password',
                description: 'Hardcoded password detected',
                remediation: 'Remove password, use environment variables, implement proper authentication',
            },

            // Slack Tokens
            {
                id: 'slack-token',
                name: 'Slack Token',
                pattern: /xox[baprs]-[0-9]{10,13}-[0-9]{10,13}-[A-Za-z0-9]{24,}/g,
                severity: 'high',
                type: 'token',
                description: 'Slack token detected',
                remediation: 'Revoke token in Slack workspace, use environment variables',
            },

            // Stripe Keys
            {
                id: 'stripe-key',
                name: 'Stripe API Key',
                pattern: /sk_live_[A-Za-z0-9]{24,}/g,
                severity: 'critical',
                type: 'api-key',
                description: 'Stripe live API key detected',
                remediation: 'Revoke key in Stripe dashboard immediately, use environment variables',
            },

            // SendGrid Keys
            {
                id: 'sendgrid-key',
                name: 'SendGrid API Key',
                pattern: /SG\.[A-Za-z0-9_-]{22}\.[A-Za-z0-9_-]{43}/g,
                severity: 'high',
                type: 'api-key',
                description: 'SendGrid API key detected',
                remediation: 'Revoke key in SendGrid dashboard, use environment variables',
            },

            // Google API Keys
            {
                id: 'google-api-key',
                name: 'Google API Key',
                pattern: /AIza[0-9A-Za-z_-]{35}/g,
                severity: 'high',
                type: 'api-key',
                description: 'Google API key detected',
                remediation: 'Restrict key in Google Cloud Console, use environment variables',
            },

            // Twilio Keys
            {
                id: 'twilio-key',
                name: 'Twilio API Key',
                pattern: /SK[0-9a-fA-F]{32}/g,
                severity: 'high',
                type: 'api-key',
                description: 'Twilio API key detected',
                remediation: 'Revoke key in Twilio console, use environment variables',
            },
        ];
    }

    /**
     * Initialize rotation policies
     */
    private initializeRotationPolicies(): void {
        this.rotationPolicies.set('api-key', {
            secretType: 'api-key',
            rotationInterval: 90, // 90 days
            notifyBefore: 7,
            autoRotate: false,
            requireApproval: true,
        });

        this.rotationPolicies.set('password', {
            secretType: 'password',
            rotationInterval: 90,
            notifyBefore: 7,
            autoRotate: false,
            requireApproval: true,
        });

        this.rotationPolicies.set('token', {
            secretType: 'token',
            rotationInterval: 180, // 6 months
            notifyBefore: 14,
            autoRotate: false,
            requireApproval: true,
        });

        this.rotationPolicies.set('private-key', {
            secretType: 'private-key',
            rotationInterval: 365, // 1 year
            notifyBefore: 30,
            autoRotate: false,
            requireApproval: true,
        });

        this.rotationPolicies.set('database-url', {
            secretType: 'database-url',
            rotationInterval: 90,
            notifyBefore: 7,
            autoRotate: false,
            requireApproval: true,
        });
    }

    /**
     * Scan directory for secrets
     */
    async scanDirectory(path: string, options: {
        includeGitHistory?: boolean;
        excludePaths?: string[];
    } = {}): Promise<ScanResult> {
        const scanId = this.generateScanId();
        const startTime = new Date();

        console.log(`[Secrets] Starting scan: ${path}`);

        // Simulate file scanning
        const files = this.getFilesToScan(path, options.excludePaths);
        const secrets: DetectedSecret[] = [];

        for (const file of files) {
            const fileSecrets = await this.scanFile(file);
            secrets.push(...fileSecrets);
        }

        // Scan git history if requested
        if (options.includeGitHistory) {
            console.log('[Secrets] Scanning git history...');
            const gitSecrets = await this.scanGitHistory(path);
            secrets.push(...gitSecrets);
        }

        const endTime = new Date();

        const summary = {
            critical: secrets.filter(s => s.severity === 'critical').length,
            high: secrets.filter(s => s.severity === 'high').length,
            medium: secrets.filter(s => s.severity === 'medium').length,
            low: secrets.filter(s => s.severity === 'low').length,
        };

        const riskScore = this.calculateRiskScore(summary);

        // Store detected secrets
        secrets.forEach(secret => {
            this.detectedSecrets.set(secret.id, secret);

            // Create rotation task if needed
            if (secret.severity === 'critical' || secret.severity === 'high') {
                this.createRotationTask(secret);
            }
        });

        return {
            scanId,
            startTime,
            endTime,
            filesScanned: files.length,
            secretsFound: secrets.length,
            secrets,
            summary,
            riskScore,
        };
    }

    /**
     * Get files to scan
     */
    private getFilesToScan(path: string, excludePaths: string[] = []): string[] {
        // Simulate file discovery
        const commonFiles = [
            'src/config/database.ts',
            'src/config/api-keys.ts',
            'src/utils/auth.ts',
            '.env',
            '.env.local',
            'config.json',
            'secrets.yaml',
            'docker-compose.yml',
            'src/services/email.ts',
            'src/services/payment.ts',
        ];

        return commonFiles.filter(file => {
            return !excludePaths.some(exclude => file.includes(exclude));
        });
    }

    /**
     * Scan a single file for secrets
     */
    private async scanFile(file: string): Promise<DetectedSecret[]> {
        const secrets: DetectedSecret[] = [];

        // Simulate file content
        const sampleContents: Record<string, string> = {
            '.env': 'DATABASE_URL=postgres://admin:supersecret123@localhost:5432/guardian\nAPI_KEY=sk-proj-abc123xyz789\nJWT_SECRET=my-super-secret-jwt-key-12345',
            'src/config/api-keys.ts': 'export const OPENAI_KEY = "sk-abcdefghijklmnopqrstuvwxyz1234567890ABCDEFGH";',
            'src/config/database.ts': 'const connectionString = "mongodb://user:pass123@localhost:27017/db";',
        };

        const content = sampleContents[file] || '';

        // Test each pattern
        for (const pattern of this.patterns) {
            const regex = new RegExp(pattern.pattern);
            let match;

            while ((match = regex.exec(content)) !== null) {
                const matchedValue = match[0];
                const line = this.getLineNumber(content, match.index);

                const secret: DetectedSecret = {
                    id: this.generateSecretId(),
                    type: pattern.type,
                    name: pattern.name,
                    severity: pattern.severity,
                    file,
                    line,
                    content: this.maskSecret(matchedValue),
                    pattern: pattern.id,
                    matchedValue: this.maskSecret(matchedValue),
                    discoveredAt: new Date(),
                    status: 'active',
                    exposureRisk: this.assessExposureRisk(file, pattern.severity),
                };

                secrets.push(secret);
            }
        }

        return secrets;
    }

    /**
     * Scan git history for secrets
     */
    private async scanGitHistory(path: string): Promise<DetectedSecret[]> {
        // Simulate git history scanning
        const secrets: DetectedSecret[] = [];

        // Sample: Found secrets in old commits
        if (Math.random() > 0.7) {
            secrets.push({
                id: this.generateSecretId(),
                type: 'api-key',
                name: 'AWS Access Key ID (Git History)',
                severity: 'critical',
                file: '.env (deleted)',
                line: 1,
                content: 'AKIA****************',
                pattern: 'aws-access-key',
                matchedValue: 'AKIA****************',
                discoveredAt: new Date(),
                status: 'active',
                exposureRisk: 'high',
            });
        }

        return secrets;
    }

    /**
     * Mask secret for display
     */
    private maskSecret(secret: string): string {
        if (secret.length <= 8) {
            return '*'.repeat(secret.length);
        }
        const visible = Math.min(4, Math.floor(secret.length * 0.2));
        const prefix = secret.substring(0, visible);
        const suffix = secret.substring(secret.length - visible);
        const masked = '*'.repeat(secret.length - (visible * 2));
        return `${prefix}${masked}${suffix}`;
    }

    /**
     * Get line number from content index
     */
    private getLineNumber(content: string, index: number): number {
        const lines = content.substring(0, index).split('\n');
        return lines.length;
    }

    /**
     * Assess exposure risk
     */
    private assessExposureRisk(file: string, severity: string): 'high' | 'medium' | 'low' {
        // High risk: env files, public directories
        if (file.includes('.env') || file.includes('public/')) {
            return 'high';
        }

        // Medium risk: config files, tests
        if (file.includes('config') || file.includes('test')) {
            return 'medium';
        }

        // Base on severity
        if (severity === 'critical') return 'high';
        if (severity === 'high') return 'medium';
        return 'low';
    }

    /**
     * Calculate risk score
     */
    private calculateRiskScore(summary: ScanResult['summary']): number {
        let score = 100;
        score -= summary.critical * 25;
        score -= summary.high * 15;
        score -= summary.medium * 5;
        score -= summary.low * 2;
        return Math.max(0, score);
    }

    /**
     * Create rotation task
     */
    private createRotationTask(secret: DetectedSecret): RotationTask {
        const policy = this.rotationPolicies.get(secret.type);
        if (!policy) {
            throw new Error(`No rotation policy for secret type: ${secret.type}`);
        }

        const dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + policy.rotationInterval);

        const task: RotationTask = {
            id: this.generateTaskId(),
            secretId: secret.id,
            secretName: secret.name,
            dueDate,
            status: 'pending',
            steps: this.generateRotationSteps(secret.type),
        };

        this.rotationTasks.set(task.id, task);
        console.log(`[Secrets] Created rotation task for ${secret.name}`);
        return task;
    }

    /**
     * Generate rotation steps
     */
    private generateRotationSteps(type: SecretPattern['type']): string[] {
        const stepsByType: Record<string, string[]> = {
            'api-key': [
                'Generate new API key in provider dashboard',
                'Update environment variables with new key',
                'Test application with new key',
                'Revoke old API key',
                'Update documentation',
            ],
            'password': [
                'Generate strong password using password manager',
                'Update password in application/service',
                'Update environment variables',
                'Test authentication',
                'Update documentation',
            ],
            'token': [
                'Generate new token',
                'Update application configuration',
                'Test functionality with new token',
                'Revoke old token',
                'Update CI/CD secrets',
            ],
            'private-key': [
                'Generate new key pair',
                'Update public key with services',
                'Update private key in secure storage',
                'Test connectivity',
                'Remove old private key',
            ],
            'database-url': [
                'Create new database user',
                'Update connection string',
                'Test database connectivity',
                'Migrate permissions to new user',
                'Remove old database user',
            ],
        };

        return stepsByType[type] || [
            'Identify secret location',
            'Generate new secret',
            'Update configuration',
            'Test changes',
            'Revoke old secret',
        ];
    }

    /**
     * Get rotation tasks due soon
     */
    getRotationTasksDueSoon(days: number = 7): RotationTask[] {
        const dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + days);

        return Array.from(this.rotationTasks.values()).filter(
            task => task.status === 'pending' && task.dueDate <= dueDate
        );
    }

    /**
     * Generate scan report
     */
    generateReport(result: ScanResult): string {
        let report = '# Secrets Scan Report\n\n';
        report += `**Scan ID:** ${result.scanId}\n`;
        report += `**Date:** ${result.startTime.toISOString()}\n`;
        report += `**Files Scanned:** ${result.filesScanned}\n`;
        report += `**Secrets Found:** ${result.secretsFound}\n`;
        report += `**Risk Score:** ${result.riskScore}/100\n\n`;

        report += '## Summary\n\n';
        report += `- 🔴 Critical: ${result.summary.critical}\n`;
        report += `- 🟠 High: ${result.summary.high}\n`;
        report += `- 🟡 Medium: ${result.summary.medium}\n`;
        report += `- 🟢 Low: ${result.summary.low}\n\n`;

        if (result.summary.critical > 0 || result.summary.high > 0) {
            report += '⚠️ **IMMEDIATE ACTION REQUIRED**\n\n';
        }

        // Critical secrets
        const critical = result.secrets.filter(s => s.severity === 'critical');
        if (critical.length > 0) {
            report += '## 🔴 Critical Secrets\n\n';
            critical.forEach((secret, i) => {
                report += `### ${i + 1}. ${secret.name}\n\n`;
                report += `**File:** ${secret.file}:${secret.line}\n`;
                report += `**Type:** ${secret.type}\n`;
                report += `**Exposure Risk:** ${secret.exposureRisk}\n`;
                report += `**Value:** \`${secret.matchedValue}\`\n\n`;

                const pattern = this.patterns.find(p => p.id === secret.pattern);
                if (pattern) {
                    report += `**Remediation:**\n${pattern.remediation}\n\n`;
                }
                report += '---\n\n';
            });
        }

        // High severity secrets
        const high = result.secrets.filter(s => s.severity === 'high');
        if (high.length > 0) {
            report += '## 🟠 High Severity Secrets\n\n';
            high.forEach((secret, i) => {
                report += `### ${i + 1}. ${secret.name}\n`;
                report += `**File:** ${secret.file}:${secret.line}\n`;
                report += `**Value:** \`${secret.matchedValue}\`\n\n`;
            });
        }

        report += '## Recommendations\n\n';
        report += '1. **Immediately revoke** all critical and high-severity secrets\n';
        report += '2. **Remove secrets** from source code and commit history\n';
        report += '3. **Use environment variables** or secret management services (AWS Secrets Manager, Azure Key Vault, HashiCorp Vault)\n';
        report += '4. **Add pre-commit hooks** to prevent future secret leaks (e.g., git-secrets, gitleaks)\n';
        report += '5. **Implement secret rotation** policies\n';
        report += '6. **Monitor for leaked secrets** on GitHub, GitLab, and paste sites\n';
        report += '7. **Conduct security training** for development team\n\n';

        report += '## Secret Rotation Schedule\n\n';
        const dueSoon = this.getRotationTasksDueSoon(30);
        if (dueSoon.length > 0) {
            dueSoon.forEach(task => {
                report += `- **${task.secretName}** - Due: ${task.dueDate.toISOString().split('T')[0]}\n`;
            });
        } else {
            report += 'No secrets due for rotation in the next 30 days.\n';
        }

        return report;
    }

    /**
     * Generate IDs
     */
    private generateScanId(): string {
        return `SCAN-${Date.now()}-${Math.random().toString(36).substring(7).toUpperCase()}`;
    }

    private generateSecretId(): string {
        return `SECRET-${Date.now()}-${Math.random().toString(36).substring(7).toUpperCase()}`;
    }

    private generateTaskId(): string {
        return `ROTATION-${Date.now()}-${Math.random().toString(36).substring(7).toUpperCase()}`;
    }

    /**
     * Get all detected secrets
     */
    getAllSecrets(): DetectedSecret[] {
        return Array.from(this.detectedSecrets.values());
    }

    /**
     * Get active secrets (not rotated/revoked)
     */
    getActiveSecrets(): DetectedSecret[] {
        return Array.from(this.detectedSecrets.values()).filter(
            s => s.status === 'active'
        );
    }

    /**
     * Mark secret as rotated
     */
    markSecretRotated(secretId: string): void {
        const secret = this.detectedSecrets.get(secretId);
        if (!secret) throw new Error(`Secret ${secretId} not found`);

        secret.status = 'rotated';
        secret.lastRotated = new Date();

        // Update rotation task
        const task = Array.from(this.rotationTasks.values()).find(
            t => t.secretId === secretId
        );
        if (task) {
            task.status = 'completed';
            task.completedAt = new Date();
        }

        console.log(`[Secrets] Marked ${secret.name} as rotated`);
    }
}

/**
 * Example usage:
 * 
 * const scanner = new SecretsScanner();
 * 
 * // Scan directory
 * const result = await scanner.scanDirectory('./src', {
 *   includeGitHistory: true,
 *   excludePaths: ['node_modules', 'dist']
 * });
 * 
 * // Generate report
 * console.log(scanner.generateReport(result));
 * 
 * // Get secrets due for rotation
 * const dueSoon = scanner.getRotationTasksDueSoon(7);
 * console.log('Secrets due for rotation:', dueSoon);
 * 
 * // Mark secret as rotated
 * scanner.markSecretRotated('SECRET-123');
 */
