/**
 * ODAVL Insight - Infrastructure Detector v1.0
 * 
 * Detects infrastructure and deployment issues:
 * - Docker/Container issues (Dockerfile best practices, multi-stage, layer optimization)
 * - Kubernetes misconfigurations (resource limits, health checks, security contexts)
 * - CI/CD pipeline problems (GitHub Actions, GitLab CI, Jenkins patterns)
 * - Infrastructure as Code issues (Terraform, CloudFormation, ARM templates)
 * - Deployment anti-patterns (hardcoded secrets, missing rollback, zero-downtime)
 * 
 * Target: Detect 95%+ infrastructure issues before production
 */

import * as fs from 'node:fs/promises';
import * as path from 'node:path';

export interface InfrastructureIssue {
  type: 'docker' | 'kubernetes' | 'cicd' | 'iac' | 'deployment';
  severity: 'critical' | 'high' | 'medium' | 'low';
  file: string;
  line?: number;
  column?: number;
  message: string;
  suggestion?: string;
  category?: string;
  details?: {
    pattern?: string;
    resource?: string;
    tool?: string; // docker, kubectl, terraform, etc.
    expectedValue?: string;
    actualValue?: string;
    securityImpact?: 'high' | 'medium' | 'low';
    performanceImpact?: 'high' | 'medium' | 'low';
  };
}

export interface InfrastructureMetrics {
  totalFiles: number;
  dockerfiles: number;
  k8sManifests: number;
  cicdPipelines: number;
  iacFiles: number;
  dockerIssues: number;
  k8sIssues: number;
  cicdIssues: number;
  iacIssues: number;
  deploymentIssues: number;
  infrastructureScore: number; // 0-100
}

export interface InfrastructureAnalysisResult {
  issues: InfrastructureIssue[];
  metrics: InfrastructureMetrics;
  timestamp: string;
  tools?: {
    docker?: string; // version
    kubernetes?: string;
    terraform?: string;
    cloudProvider?: string; // AWS, Azure, GCP
  };
}

export interface InfrastructureConfig {
  dockerDir?: string; // Directory with Dockerfiles
  k8sDir?: string; // Kubernetes manifests directory
  cicdDir?: string; // CI/CD config directory (.github/workflows, .gitlab-ci.yml)
  iacDir?: string; // Terraform/IaC directory
  excludePatterns?: string[];
  checkDocker?: boolean;
  checkKubernetes?: boolean;
  checkCICD?: boolean;
  checkIaC?: boolean;
  checkDeployment?: boolean;
}

/**
 * InfrastructureDetector - Analyzes infrastructure code for misconfigurations
 */
export class InfrastructureDetector {
  private config: InfrastructureConfig;
  private issuesCache: Map<string, InfrastructureIssue[]>;

  constructor(config: InfrastructureConfig = {}) {
    this.config = {
      dockerDir: config.dockerDir || '.',
      k8sDir: config.k8sDir || 'k8s',
      cicdDir: config.cicdDir || '.github/workflows',
      iacDir: config.iacDir || 'terraform',
      excludePatterns: config.excludePatterns ?? ['**/node_modules/**', '**/dist/**', '**/build/**', '**/.terraform/**'],
      checkDocker: config.checkDocker ?? true,
      checkKubernetes: config.checkKubernetes ?? true,
      checkCICD: config.checkCICD ?? true,
      checkIaC: config.checkIaC ?? true,
      checkDeployment: config.checkDeployment ?? true,
    };
    this.issuesCache = new Map();
  }

  /**
   * Main analysis entry point
   */
  async analyze(workspaceRoot: string): Promise<InfrastructureAnalysisResult> {
    console.log('🏗️  Starting infrastructure analysis...');
    const startTime = performance.now();

    try {
      const issues: InfrastructureIssue[] = [];

      // Detect infrastructure tools and versions
      const tools = await this.detectInfrastructureTools(workspaceRoot);

      // Find all infrastructure files
      const files = await this.findInfrastructureFiles(workspaceRoot);
      console.log(`📄 Found ${files.length} infrastructure files to analyze`);

      // Run detection for each category
      if (this.config.checkDocker) {
        const dockerIssues = await this.detectDockerIssues(workspaceRoot, files);
        issues.push(...dockerIssues);
        console.log(`🐳 Docker: Found ${dockerIssues.length} issues`);
      }

      if (this.config.checkKubernetes) {
        const k8sIssues = await this.detectKubernetesIssues(workspaceRoot, files);
        issues.push(...k8sIssues);
        console.log(`☸️  Kubernetes: Found ${k8sIssues.length} issues`);
      }

      if (this.config.checkCICD) {
        const cicdIssues = await this.detectCICDIssues(workspaceRoot, files);
        issues.push(...cicdIssues);
        console.log(`🔄 CI/CD: Found ${cicdIssues.length} issues`);
      }

      if (this.config.checkIaC) {
        const iacIssues = await this.detectIaCIssues(workspaceRoot, files);
        issues.push(...iacIssues);
        console.log(`📋 IaC: Found ${iacIssues.length} issues`);
      }

      if (this.config.checkDeployment) {
        const deploymentIssues = await this.detectDeploymentIssues(workspaceRoot, files);
        issues.push(...deploymentIssues);
        console.log(`🚀 Deployment: Found ${deploymentIssues.length} issues`);
      }

      // Calculate metrics
      const metrics = this.calculateMetrics(issues, files);

      const duration = ((performance.now() - startTime) / 1000).toFixed(2);
      console.log(`✅ Infrastructure analysis complete in ${duration}s`);
      console.log(`📊 Score: ${metrics.infrastructureScore}/100`);

      return {
        issues,
        metrics,
        timestamp: new Date().toISOString(),
        tools,
      };
    } catch (error: any) {
      console.error('❌ Infrastructure analysis failed:', error.message);
      throw error;
    }
  }

  /**
   * Detect infrastructure tools and versions
   */
  private async detectInfrastructureTools(workspaceRoot: string): Promise<{
    docker?: string;
    kubernetes?: string;
    terraform?: string;
    cloudProvider?: string;
  }> {
    const tools: any = {};

    try {
      // Check for Dockerfile
      const dockerfilePath = path.join(workspaceRoot, 'Dockerfile');
      if (await this.fileExists(dockerfilePath)) {
        tools.docker = 'detected';
      }

      // Check for Kubernetes manifests
      const k8sPath = path.join(workspaceRoot, this.config.k8sDir || 'k8s');
      if (await this.directoryExists(k8sPath)) {
        tools.kubernetes = 'detected';
      }

      // Check for Terraform
      const tfPath = path.join(workspaceRoot, this.config.iacDir || 'terraform');
      if (await this.directoryExists(tfPath)) {
        const tfFiles = await this.findFiles(tfPath, ['.tf']);
        if (tfFiles.length > 0) {
          tools.terraform = 'detected';
        }
      }

      // Detect cloud provider from files
      const allFiles = await this.findInfrastructureFiles(workspaceRoot);
      for (const file of allFiles) {
        const content = await fs.readFile(file, 'utf-8');
        if (content.includes('AWS::') || content.includes('aws_')) {
          tools.cloudProvider = 'AWS';
          break;
        } else if (content.includes('azurerm_') || content.includes('Microsoft.')) {
          tools.cloudProvider = 'Azure';
          break;
        } else if (content.includes('google_') || content.includes('gcp')) {
          tools.cloudProvider = 'GCP';
          break;
        }
      }
    } catch (error: any) {
      console.warn('⚠️  Failed to detect infrastructure tools:', error.message);
    }

    return tools;
  }

  /**
   * Find all infrastructure files
   */
  private async findInfrastructureFiles(workspaceRoot: string): Promise<string[]> {
    const files: string[] = [];

    try {
      // Docker files
      const dockerFiles = await this.findFiles(workspaceRoot, ['Dockerfile', '.dockerignore', 'docker-compose.yml', 'docker-compose.yaml']);
      files.push(...dockerFiles);

      // Kubernetes manifests
      const k8sPath = path.join(workspaceRoot, this.config.k8sDir || 'k8s');
      if (await this.directoryExists(k8sPath)) {
        const k8sFiles = await this.findFiles(k8sPath, ['.yaml', '.yml']);
        files.push(...k8sFiles);
      }

      // CI/CD configs
      const cicdPath = path.join(workspaceRoot, this.config.cicdDir || '.github/workflows');
      if (await this.directoryExists(cicdPath)) {
        const cicdFiles = await this.findFiles(cicdPath, ['.yml', '.yaml']);
        files.push(...cicdFiles);
      }

      // GitLab CI
      const gitlabCIPath = path.join(workspaceRoot, '.gitlab-ci.yml');
      if (await this.fileExists(gitlabCIPath)) {
        files.push(gitlabCIPath);
      }

      // Terraform files
      const iacPath = path.join(workspaceRoot, this.config.iacDir || 'terraform');
      if (await this.directoryExists(iacPath)) {
        const iacFiles = await this.findFiles(iacPath, ['.tf', '.tfvars']);
        files.push(...iacFiles);
      }

      // CloudFormation templates
      const cfFiles = await this.findFiles(workspaceRoot, ['.template.json', '.template.yaml', '.template.yml']);
      files.push(...cfFiles);

      // Filter excluded patterns
      return files.filter(file => !this.isExcluded(file));
    } catch (error: any) {
      console.warn('⚠️  Failed to find infrastructure files:', error.message);
      return [];
    }
  }

  /**
   * Category 1: Docker/Container Issues
   */
  private async detectDockerIssues(workspaceRoot: string, files: string[]): Promise<InfrastructureIssue[]> {
    const issues: InfrastructureIssue[] = [];
    const dockerFiles = files.filter(f => f.includes('Dockerfile') || f.includes('docker-compose'));

    for (const file of dockerFiles) {
      try {
        const content = await fs.readFile(file, 'utf-8');
        const lines = content.split('\n');

        // Issue 1: Using latest tag
        if (content.match(/FROM\s+[a-zA-Z0-9_/-]+:latest/i)) {
          const line = lines.findIndex(l => l.match(/FROM\s+[a-zA-Z0-9_/-]+:latest/i)) + 1;
          issues.push({
            type: 'docker',
            severity: 'high',
            file,
            line,
            message: 'Avoid using ":latest" tag in FROM instruction',
            suggestion: 'Use specific version tags (e.g., FROM node:20.10-alpine) for reproducible builds',
            category: 'docker-tags',
            details: {
              pattern: ':latest',
              tool: 'docker',
              securityImpact: 'medium',
              performanceImpact: 'low',
            },
          });
        }

        // Issue 2: Running as root
        if (!content.includes('USER ') && content.includes('FROM ')) {
          issues.push({
            type: 'docker',
            severity: 'critical',
            file,
            line: 1,
            message: 'Container runs as root user',
            suggestion: 'Add USER instruction to run as non-root: USER node',
            category: 'docker-security',
            details: {
              pattern: 'missing USER instruction',
              tool: 'docker',
              securityImpact: 'high',
              performanceImpact: 'low',
            },
          });
        }

        // Issue 3: No multi-stage build
        const fromCount = (content.match(/FROM /gi) || []).length;
        if (fromCount === 1 && content.includes('npm install')) {
          issues.push({
            type: 'docker',
            severity: 'medium',
            file,
            line: 1,
            message: 'Missing multi-stage build for Node.js application',
            suggestion: 'Use multi-stage build to reduce image size: FROM node:20 AS builder',
            category: 'docker-optimization',
            details: {
              pattern: 'single-stage build',
              tool: 'docker',
              securityImpact: 'low',
              performanceImpact: 'high',
            },
          });
        }

        // Issue 4: COPY . . (copying everything)
        if (content.match(/COPY\s+\.\s+\./)) {
          const line = lines.findIndex(l => l.match(/COPY\s+\.\s+\./)) + 1;
          issues.push({
            type: 'docker',
            severity: 'medium',
            file,
            line,
            message: 'Copying entire directory with COPY . .',
            suggestion: 'Copy only necessary files or use .dockerignore to exclude unnecessary files',
            category: 'docker-optimization',
            details: {
              pattern: 'COPY . .',
              tool: 'docker',
              securityImpact: 'low',
              performanceImpact: 'medium',
            },
          });
        }

        // Issue 5: No .dockerignore
        if (file.includes('Dockerfile')) {
          const dockerignorePath = path.join(path.dirname(file), '.dockerignore');
          if (!await this.fileExists(dockerignorePath)) {
            issues.push({
              type: 'docker',
              severity: 'medium',
              file,
              line: 1,
              message: 'Missing .dockerignore file',
              suggestion: 'Create .dockerignore to exclude node_modules, .git, tests, etc.',
              category: 'docker-optimization',
              details: {
                pattern: 'missing .dockerignore',
                tool: 'docker',
                securityImpact: 'low',
                performanceImpact: 'medium',
              },
            });
          }
        }

        // Issue 6: Not using layer caching effectively
        const copyPackageJsonIndex = lines.findIndex(l => l.includes('COPY') && l.includes('package.json'));
        const npmInstallIndex = lines.findIndex(l => l.includes('npm install') || l.includes('yarn install') || l.includes('pnpm install'));
        const copyAllIndex = lines.findIndex(l => l.match(/COPY\s+\.\s+\./) || (l.includes('COPY') && !l.includes('package.json')));

        if (npmInstallIndex > -1 && copyAllIndex > -1 && copyAllIndex < npmInstallIndex) {
          issues.push({
            type: 'docker',
            severity: 'medium',
            file,
            line: copyAllIndex + 1,
            message: 'Inefficient layer caching: copying all files before npm install',
            suggestion: 'Copy package.json first, run npm install, then copy application files',
            category: 'docker-optimization',
            details: {
              pattern: 'inefficient layer order',
              tool: 'docker',
              securityImpact: 'low',
              performanceImpact: 'high',
            },
          });
        }

        // Issue 7: Hardcoded secrets
        if (content.match(/ENV\s+[A-Z_]+\s*=\s*['"][^'"]+['"]/)) {
          const secretPatterns = ['PASSWORD', 'SECRET', 'KEY', 'TOKEN', 'API_KEY', 'DATABASE_URL'];
          for (const pattern of secretPatterns) {
            const regex = new RegExp(`ENV\\s+${pattern}\\s*=\\s*['"][^'"]+['"]`, 'i');
            if (content.match(regex)) {
              const line = lines.findIndex(l => l.match(regex)) + 1;
              issues.push({
                type: 'docker',
                severity: 'critical',
                file,
                line,
                message: `Hardcoded secret in ENV instruction: ${pattern}`,
                suggestion: 'Use Docker secrets or environment variables passed at runtime: docker run -e PASSWORD=$PASSWORD',
                category: 'docker-security',
                details: {
                  pattern: `ENV ${pattern}`,
                  tool: 'docker',
                  securityImpact: 'high',
                  performanceImpact: 'low',
                },
              });
            }
          }
        }

        // Issue 8: Missing HEALTHCHECK
        if (!content.includes('HEALTHCHECK') && content.includes('EXPOSE')) {
          issues.push({
            type: 'docker',
            severity: 'medium',
            file,
            line: 1,
            message: 'Missing HEALTHCHECK instruction',
            suggestion: 'Add HEALTHCHECK instruction: HEALTHCHECK CMD curl -f http://localhost:3000/health || exit 1',
            category: 'docker-monitoring',
            details: {
              pattern: 'missing HEALTHCHECK',
              tool: 'docker',
              securityImpact: 'low',
              performanceImpact: 'medium',
            },
          });
        }

        // Issue 9: Exposed ports without security
        const exposedPorts = content.match(/EXPOSE\s+(\d+)/gi);
        if (exposedPorts && exposedPorts.length > 3) {
          issues.push({
            type: 'docker',
            severity: 'high',
            file,
            line: 1,
            message: `Multiple ports exposed (${exposedPorts.length}), increasing attack surface`,
            suggestion: 'Only expose necessary ports and use reverse proxy for internal services',
            category: 'docker-security',
            details: {
              pattern: 'multiple EXPOSE',
              tool: 'docker',
              securityImpact: 'medium',
              performanceImpact: 'low',
            },
          });
        }

        // Issue 10: Using apt-get without cleanup
        if (content.includes('apt-get install') && !content.includes('rm -rf /var/lib/apt/lists/*')) {
          const line = lines.findIndex(l => l.includes('apt-get install')) + 1;
          issues.push({
            type: 'docker',
            severity: 'low',
            file,
            line,
            message: 'apt-get install without cleanup increases image size',
            suggestion: 'Add cleanup: RUN apt-get update && apt-get install -y <packages> && rm -rf /var/lib/apt/lists/*',
            category: 'docker-optimization',
            details: {
              pattern: 'apt-get without cleanup',
              tool: 'docker',
              securityImpact: 'low',
              performanceImpact: 'medium',
            },
          });
        }
      } catch (error: any) {
        console.warn(`⚠️  Failed to analyze Docker file ${file}:`, error.message);
      }
    }

    return issues;
  }

  /**
   * Category 2: Kubernetes Issues
   */
  private async detectKubernetesIssues(workspaceRoot: string, files: string[]): Promise<InfrastructureIssue[]> {
    const issues: InfrastructureIssue[] = [];
    const normalizedFiles = files.map(f => ({ original: f, normalized: f.replace(/\\/g, '/') }));
    const k8sFiles = normalizedFiles
      .filter(f => 
        (f.normalized.includes('/k8s/') || f.normalized.includes('/kubernetes/')) && 
        (f.normalized.endsWith('.yaml') || f.normalized.endsWith('.yml'))
      )
      .map(f => f.original);

    for (const file of k8sFiles) {
      try {
        const content = await fs.readFile(file, 'utf-8');
        const lines = content.split('\n');

        // Issue 1: Missing resource limits
        if (content.includes('kind: Deployment') && !content.match(/resources:[\s\S]*?limits:/)) {
          issues.push({
            type: 'kubernetes',
            severity: 'high',
            file,
            line: 1,
            message: 'Deployment missing resource limits',
            suggestion: 'Add resources: limits: memory: "512Mi", cpu: "500m"',
            category: 'k8s-resources',
            details: {
              pattern: 'missing resources',
              tool: 'kubectl',
              securityImpact: 'low',
              performanceImpact: 'high',
            },
          });
        }

        // Issue 2: No liveness/readiness probes
        if (content.includes('kind: Deployment') && !content.includes('livenessProbe:')) {
          issues.push({
            type: 'kubernetes',
            severity: 'high',
            file,
            line: 1,
            message: 'Deployment missing liveness probe',
            suggestion: 'Add livenessProbe: httpGet: path: /health, port: 8080',
            category: 'k8s-health',
            details: {
              pattern: 'missing livenessProbe',
              tool: 'kubectl',
              securityImpact: 'low',
              performanceImpact: 'high',
            },
          });
        }

        if (content.includes('kind: Deployment') && !content.includes('readinessProbe:')) {
          issues.push({
            type: 'kubernetes',
            severity: 'high',
            file,
            line: 1,
            message: 'Deployment missing readiness probe',
            suggestion: 'Add readinessProbe: httpGet: path: /ready, port: 8080',
            category: 'k8s-health',
            details: {
              pattern: 'missing readinessProbe',
              tool: 'kubectl',
              securityImpact: 'low',
              performanceImpact: 'high',
            },
          });
        }

        // Issue 3: Running as root (no securityContext)
        if (content.includes('kind: Deployment') && !content.includes('securityContext:')) {
          issues.push({
            type: 'kubernetes',
            severity: 'critical',
            file,
            line: 1,
            message: 'Pod running as root user',
            suggestion: 'Add securityContext: runAsNonRoot: true, runAsUser: 1000',
            category: 'k8s-security',
            details: {
              pattern: 'missing securityContext',
              tool: 'kubectl',
              securityImpact: 'high',
              performanceImpact: 'low',
            },
          });
        }

        // Issue 4: Privileged containers
        if (content.includes('privileged: true')) {
          const line = lines.findIndex(l => l.includes('privileged: true')) + 1;
          issues.push({
            type: 'kubernetes',
            severity: 'critical',
            file,
            line,
            message: 'Container running in privileged mode',
            suggestion: 'Avoid privileged: true unless absolutely necessary. Use capabilities instead.',
            category: 'k8s-security',
            details: {
              pattern: 'privileged: true',
              tool: 'kubectl',
              securityImpact: 'high',
              performanceImpact: 'low',
            },
          });
        }

        // Issue 5: Using latest image tag
        if (content.match(/image:\s*[a-zA-Z0-9_/-]+:latest/)) {
          const line = lines.findIndex(l => l.match(/image:\s*[a-zA-Z0-9_/-]+:latest/)) + 1;
          issues.push({
            type: 'kubernetes',
            severity: 'high',
            file,
            line,
            message: 'Using :latest image tag',
            suggestion: 'Use specific version tags for reproducible deployments: image: myapp:1.2.3',
            category: 'k8s-versioning',
            details: {
              pattern: ':latest',
              tool: 'kubectl',
              securityImpact: 'medium',
              performanceImpact: 'low',
            },
          });
        }

        // Issue 6: No replica count or replicas: 1
        const replicasMatch = content.match(/replicas:\s*(\d+)/);
        if (content.includes('kind: Deployment') && (!replicasMatch || replicasMatch[1] === '1')) {
          issues.push({
            type: 'kubernetes',
            severity: 'medium',
            file,
            line: replicasMatch ? lines.findIndex(l => l.includes('replicas:')) + 1 : 1,
            message: 'Single replica deployment (no high availability)',
            suggestion: 'Set replicas: 3 or use HorizontalPodAutoscaler for production',
            category: 'k8s-availability',
            details: {
              pattern: 'replicas: 1',
              tool: 'kubectl',
              securityImpact: 'low',
              performanceImpact: 'high',
            },
          });
        }

        // Issue 7: Missing pod disruption budget
        if (content.includes('kind: Deployment') && !files.some(f => f.includes('PodDisruptionBudget'))) {
          issues.push({
            type: 'kubernetes',
            severity: 'medium',
            file,
            line: 1,
            message: 'Missing PodDisruptionBudget for deployment',
            suggestion: 'Create PodDisruptionBudget to prevent all pods being evicted during maintenance',
            category: 'k8s-availability',
            details: {
              pattern: 'missing PodDisruptionBudget',
              tool: 'kubectl',
              securityImpact: 'low',
              performanceImpact: 'medium',
            },
          });
        }

        // Issue 8: Hardcoded secrets in manifests
        // Match both field patterns (password: value:) and env var names (DB_PASSWORD)
        const secretPatterns = ['password', 'secret', 'api-key', 'api_key', 'token'];
        for (const pattern of secretPatterns) {
          // Match both: "- name: DB_PASSWORD\n  value:" and "password: value:"
          const envVarRegex = new RegExp(`-\\s*name:\\s*\\w*${pattern}\\w*\\s*value:\\s*["']`, 'i');
          const fieldRegex = new RegExp(`${pattern}:\\s*value:\\s*["']`, 'i');
          
          if ((content.match(envVarRegex) || content.match(fieldRegex)) && !content.includes('secretKeyRef:')) {
            const line = lines.findIndex(l => l.match(envVarRegex) || l.match(fieldRegex)) + 1;
            issues.push({
              type: 'kubernetes',
              severity: 'critical',
              file,
              line,
              message: `Hardcoded secret in manifest: ${pattern}`,
              suggestion: 'Use Kubernetes Secrets with secretKeyRef or external secrets manager',
              category: 'k8s-security',
              details: {
                pattern,
                tool: 'kubectl',
                securityImpact: 'high',
                performanceImpact: 'low',
              },
            });
          }
        }

        // Issue 9: No namespace specified
        if ((content.includes('kind: Deployment') || content.includes('kind: Service')) && 
            !content.includes('namespace:')) {
          issues.push({
            type: 'kubernetes',
            severity: 'low',
            file,
            line: 1,
            message: 'No namespace specified (will use default)',
            suggestion: 'Specify namespace: metadata: namespace: production',
            category: 'k8s-organization',
            details: {
              pattern: 'missing namespace',
              tool: 'kubectl',
              securityImpact: 'low',
              performanceImpact: 'low',
            },
          });
        }

        // Issue 10: hostNetwork: true
        if (content.includes('hostNetwork: true')) {
          const line = lines.findIndex(l => l.includes('hostNetwork: true')) + 1;
          issues.push({
            type: 'kubernetes',
            severity: 'high',
            file,
            line,
            message: 'Pod using host network namespace',
            suggestion: 'Avoid hostNetwork: true, use proper Service networking',
            category: 'k8s-security',
            details: {
              pattern: 'hostNetwork: true',
              tool: 'kubectl',
              securityImpact: 'high',
              performanceImpact: 'low',
            },
          });
        }
      } catch (error: any) {
        console.warn(`⚠️  Failed to analyze Kubernetes file ${file}:`, error.message);
      }
    }

    return issues;
  }

  /**
   * Category 3: CI/CD Pipeline Issues
   */
  private async detectCICDIssues(workspaceRoot: string, files: string[]): Promise<InfrastructureIssue[]> {
    const issues: InfrastructureIssue[] = [];
    const normalizedFiles = files.map(f => ({ original: f, normalized: f.replace(/\\/g, '/') }));
    const cicdFiles = normalizedFiles
      .filter(f => 
        f.normalized.includes('.github/workflows/') || 
        f.normalized.includes('.gitlab-ci.yml') || 
        f.normalized.includes('Jenkinsfile')
      )
      .map(f => f.original);

    for (const file of cicdFiles) {
      try {
        const content = await fs.readFile(file, 'utf-8');
        const lines = content.split('\n');

        // Issue 1: Hardcoded secrets in workflow
        const secretPatterns = ['password:', 'token:', 'api_key', 'secret:', 'GITHUB_TOKEN'];
        for (const pattern of secretPatterns) {
          const regex = new RegExp(`${pattern}\\s*[=:]\\s*['"][^'"]+['"]`, 'i');
          if (content.match(regex) && !content.includes('secrets.')) {
            const line = lines.findIndex(l => l.match(regex)) + 1;
            issues.push({
              type: 'cicd',
              severity: 'critical',
              file,
              line,
              message: `Hardcoded secret in CI/CD pipeline: ${pattern}`,
              suggestion: 'Use secrets: ${{ secrets.API_KEY }} or environment variables',
              category: 'cicd-security',
              details: {
                pattern,
                tool: file.includes('github') ? 'github-actions' : 'gitlab-ci',
                securityImpact: 'high',
                performanceImpact: 'low',
              },
            });
          }
        }

        // Issue 2: No pull_request trigger
        const normalizedFile = file.replace(/\\/g, '/');
        if (normalizedFile.includes('.github/workflows/') && content.includes('on:') && !content.includes('pull_request')) {
          issues.push({
            type: 'cicd',
            severity: 'medium',
            file,
            line: 1,
            message: 'Workflow not triggered on pull_request',
            suggestion: 'Add pull_request trigger to run CI on PRs: on: [push, pull_request]',
            category: 'cicd-triggers',
            details: {
              pattern: 'missing pull_request trigger',
              tool: 'github-actions',
              securityImpact: 'low',
              performanceImpact: 'medium',
            },
          });
        }

        // Issue 3: Running tests on push to main/master (no protection)
        if (content.match(/on:\s*push:\s*branches:\s*-\s*(main|master)/)) {
          issues.push({
            type: 'cicd',
            severity: 'high',
            file,
            line: 1,
            message: 'Tests run after push to main/master (too late)',
            suggestion: 'Use branch protection rules to require tests on PRs before merging',
            category: 'cicd-workflow',
            details: {
              pattern: 'on: push: branches: main',
              tool: 'github-actions',
              securityImpact: 'medium',
              performanceImpact: 'low',
            },
          });
        }

        // Issue 4: No timeout specified
        if (normalizedFile.includes('.github/workflows/') && !content.includes('timeout-minutes:')) {
          issues.push({
            type: 'cicd',
            severity: 'medium',
            file,
            line: 1,
            message: 'No timeout specified for workflow',
            suggestion: 'Add timeout-minutes: 30 to prevent hanging jobs',
            category: 'cicd-reliability',
            details: {
              pattern: 'missing timeout-minutes',
              tool: 'github-actions',
              securityImpact: 'low',
              performanceImpact: 'medium',
            },
          });
        }

        // Issue 5: Using ubuntu-latest without pinned version
        if (content.includes('runs-on: ubuntu-latest')) {
          const line = lines.findIndex(l => l.includes('runs-on: ubuntu-latest')) + 1;
          issues.push({
            type: 'cicd',
            severity: 'low',
            file,
            line,
            message: 'Using ubuntu-latest without pinned version',
            suggestion: 'Pin runner version for reproducibility: runs-on: ubuntu-22.04',
            category: 'cicd-reproducibility',
            details: {
              pattern: 'ubuntu-latest',
              tool: 'github-actions',
              securityImpact: 'low',
              performanceImpact: 'low',
            },
          });
        }

        // Issue 6: No caching for dependencies
        if ((content.includes('npm install') || content.includes('yarn install') || content.includes('pnpm install')) &&
            !content.includes('actions/cache')) {
          issues.push({
            type: 'cicd',
            severity: 'medium',
            file,
            line: 1,
            message: 'No dependency caching configured',
            suggestion: 'Add actions/cache to cache node_modules and speed up builds',
            category: 'cicd-performance',
            details: {
              pattern: 'missing actions/cache',
              tool: 'github-actions',
              securityImpact: 'low',
              performanceImpact: 'high',
            },
          });
        }

        // Issue 7: Deploying without tests
        if ((content.includes('deploy') || content.includes('kubectl apply')) && 
            !content.includes('npm test') && !content.includes('yarn test') && !content.includes('pnpm test')) {
          issues.push({
            type: 'cicd',
            severity: 'critical',
            file,
            line: 1,
            message: 'Deployment without running tests',
            suggestion: 'Add test step before deployment: run: pnpm test',
            category: 'cicd-workflow',
            details: {
              pattern: 'deploy without tests',
              tool: file.includes('github') ? 'github-actions' : 'gitlab-ci',
              securityImpact: 'medium',
              performanceImpact: 'low',
            },
          });
        }

        // Issue 8: No artifact retention policy
        if (normalizedFile.includes('.github/workflows/') && content.includes('actions/upload-artifact') && 
            !content.match(/with:[\s\S]*?retention-days:/)) {
          issues.push({
            type: 'cicd',
            severity: 'low',
            file,
            line: 1,
            message: 'No artifact retention policy specified',
            suggestion: 'Add retention-days: 7 to artifacts to save storage',
            category: 'cicd-storage',
            details: {
              pattern: 'missing retention-days',
              tool: 'github-actions',
              securityImpact: 'low',
              performanceImpact: 'low',
            },
          });
        }

        // Issue 9: sudo usage in CI
        if (content.includes('sudo ')) {
          const line = lines.findIndex(l => l.includes('sudo ')) + 1;
          issues.push({
            type: 'cicd',
            severity: 'high',
            file,
            line,
            message: 'Using sudo in CI pipeline',
            suggestion: 'Avoid sudo - use pre-configured runners or Docker',
            category: 'cicd-security',
            details: {
              pattern: 'sudo',
              tool: file.includes('github') ? 'github-actions' : 'gitlab-ci',
              securityImpact: 'high',
              performanceImpact: 'low',
            },
          });
        }

        // Issue 10: No matrix testing
        if (normalizedFile.includes('.github/workflows/') && 
            (content.includes('node-version:') || content.includes('python-version:')) &&
            !content.includes('matrix:')) {
          issues.push({
            type: 'cicd',
            severity: 'low',
            file,
            line: 1,
            message: 'No matrix testing - testing single version only',
            suggestion: 'Use matrix strategy to test multiple versions: strategy: matrix: node-version: [18, 20, 22]',
            category: 'cicd-testing',
            details: {
              pattern: 'missing matrix',
              tool: 'github-actions',
              securityImpact: 'low',
              performanceImpact: 'low',
            },
          });
        }
      } catch (error: any) {
        console.warn(`⚠️  Failed to analyze CI/CD file ${file}:`, error.message);
      }
    }

    return issues;
  }

  /**
   * Category 4: Infrastructure as Code (IaC) Issues
   */
  private async detectIaCIssues(workspaceRoot: string, files: string[]): Promise<InfrastructureIssue[]> {
    const issues: InfrastructureIssue[] = [];
    const iacFiles = files.filter(f => 
      f.endsWith('.tf') || 
      f.endsWith('.tfvars') ||
      f.includes('.template.json') ||
      f.includes('.template.yaml')
    );

    for (const file of iacFiles) {
      try {
        const content = await fs.readFile(file, 'utf-8');
        const lines = content.split('\n');

        // Terraform-specific checks
        if (file.endsWith('.tf')) {
          // Issue 1: Hardcoded credentials
          const credPatterns = ['access_key =', 'secret_key =', 'password =', 'token ='];
          for (const pattern of credPatterns) {
            if (content.includes(pattern) && !content.includes('var.')) {
              const line = lines.findIndex(l => l.includes(pattern)) + 1;
              issues.push({
                type: 'iac',
                severity: 'critical',
                file,
                line,
                message: `Hardcoded credential in Terraform: ${pattern}`,
                suggestion: 'Use variables: var.access_key or environment variables',
                category: 'iac-security',
                details: {
                  pattern,
                  tool: 'terraform',
                  securityImpact: 'high',
                  performanceImpact: 'low',
                },
              });
            }
          }

          // Issue 2: No backend configuration
          if (!content.includes('backend "s3"') && !content.includes('backend "azurerm"') && 
              !content.includes('backend "gcs"')) {
            issues.push({
              type: 'iac',
              severity: 'high',
              file,
              line: 1,
              message: 'No remote backend configured for Terraform state',
              suggestion: 'Configure remote backend: terraform { backend "s3" { ... } }',
              category: 'iac-state',
              details: {
                pattern: 'missing backend',
                tool: 'terraform',
                securityImpact: 'medium',
                performanceImpact: 'low',
              },
            });
          }

          // Issue 3: No required_version constraint
          if (!content.includes('required_version =')) {
            issues.push({
              type: 'iac',
              severity: 'medium',
              file,
              line: 1,
              message: 'No Terraform version constraint',
              suggestion: 'Add required_version = ">= 1.5.0" to terraform block',
              category: 'iac-versioning',
              details: {
                pattern: 'missing required_version',
                tool: 'terraform',
                securityImpact: 'low',
                performanceImpact: 'medium',
              },
            });
          }

          // Issue 4: Public S3 bucket
          if (content.includes('resource "aws_s3_bucket"') && 
              (content.match(/acl\s*=\s*"public-read/) || content.match(/acl\s*=\s*"public-read-write/))) {
            const line = lines.findIndex(l => l.match(/acl\s*=\s*"public-read/)) + 1;
            issues.push({
              type: 'iac',
              severity: 'critical',
              file,
              line,
              message: 'S3 bucket with public access',
              suggestion: 'Use private buckets: acl = "private" and configure bucket policies',
              category: 'iac-security',
              details: {
                pattern: 'acl = "public-read"',
                tool: 'terraform',
                resource: 'aws_s3_bucket',
                securityImpact: 'high',
                performanceImpact: 'low',
              },
            });
          }

          // Issue 5: Security group with 0.0.0.0/0
          if (content.includes('cidr_blocks = ["0.0.0.0/0"]')) {
            const line = lines.findIndex(l => l.includes('cidr_blocks = ["0.0.0.0/0"]')) + 1;
            issues.push({
              type: 'iac',
              severity: 'high',
              file,
              line,
              message: 'Security group open to the world (0.0.0.0/0)',
              suggestion: 'Restrict to specific IPs or use security groups',
              category: 'iac-security',
              details: {
                pattern: '0.0.0.0/0',
                tool: 'terraform',
                resource: 'aws_security_group',
                securityImpact: 'high',
                performanceImpact: 'low',
              },
            });
          }

          // Issue 6: No tags
          if (content.match(/resource "aws_[a-z_]+" "[a-z_]+" {/) && !content.includes('tags = {')) {
            issues.push({
              type: 'iac',
              severity: 'low',
              file,
              line: 1,
              message: 'AWS resource without tags',
              suggestion: 'Add tags for cost tracking and organization: tags = { Environment = "production", Project = "myapp" }',
              category: 'iac-organization',
              details: {
                pattern: 'missing tags',
                tool: 'terraform',
                securityImpact: 'low',
                performanceImpact: 'low',
              },
            });
          }

          // Issue 7: Database without encryption
          if ((content.includes('resource "aws_db_instance"') || content.includes('resource "aws_rds_cluster"')) &&
              !content.includes('storage_encrypted = true')) {
            issues.push({
              type: 'iac',
              severity: 'critical',
              file,
              line: 1,
              message: 'Database without encryption at rest',
              suggestion: 'Enable encryption: storage_encrypted = true',
              category: 'iac-security',
              details: {
                pattern: 'missing storage_encrypted',
                tool: 'terraform',
                resource: 'aws_db_instance',
                securityImpact: 'high',
                performanceImpact: 'low',
              },
            });
          }

          // Issue 8: No lifecycle policy
          if (content.includes('resource ') && !content.includes('lifecycle {')) {
            issues.push({
              type: 'iac',
              severity: 'low',
              file,
              line: 1,
              message: 'No lifecycle policy for resource',
              suggestion: 'Add lifecycle { prevent_destroy = true } for critical resources',
              category: 'iac-safety',
              details: {
                pattern: 'missing lifecycle',
                tool: 'terraform',
                securityImpact: 'low',
                performanceImpact: 'low',
              },
            });
          }
        }

        // CloudFormation-specific checks
        if (file.includes('.template.')) {
          // Issue 9: Hardcoded parameters
          if (content.includes('"Properties"') && content.match(/"[A-Za-z]+Password":\s*"[^"]+"/)) {
            issues.push({
              type: 'iac',
              severity: 'critical',
              file,
              line: 1,
              message: 'Hardcoded password in CloudFormation template',
              suggestion: 'Use Parameters and NoEcho: true',
              category: 'iac-security',
              details: {
                pattern: 'hardcoded password',
                tool: 'cloudformation',
                securityImpact: 'high',
                performanceImpact: 'low',
              },
            });
          }

          // Issue 10: No DeletionPolicy
          if (content.includes('"Type": "AWS::') && !content.includes('"DeletionPolicy"')) {
            issues.push({
              type: 'iac',
              severity: 'medium',
              file,
              line: 1,
              message: 'No DeletionPolicy specified',
              suggestion: 'Add DeletionPolicy: Retain for important resources',
              category: 'iac-safety',
              details: {
                pattern: 'missing DeletionPolicy',
                tool: 'cloudformation',
                securityImpact: 'low',
                performanceImpact: 'low',
              },
            });
          }
        }
      } catch (error: any) {
        console.warn(`⚠️  Failed to analyze IaC file ${file}:`, error.message);
      }
    }

    return issues;
  }

  /**
   * Category 5: Deployment Anti-patterns
   */
  private async detectDeploymentIssues(workspaceRoot: string, files: string[]): Promise<InfrastructureIssue[]> {
    const issues: InfrastructureIssue[] = [];

    // Check across all infrastructure files for deployment patterns
    for (const file of files) {
      try {
        const content = await fs.readFile(file, 'utf-8');

        // Issue 1: No health checks before deployment
        if ((content.includes('kubectl apply') || content.includes('docker deploy')) &&
            !content.includes('health') && !content.includes('readiness')) {
          issues.push({
            type: 'deployment',
            severity: 'high',
            file,
            line: 1,
            message: 'Deployment without health checks',
            suggestion: 'Add health checks and wait for readiness before proceeding',
            category: 'deployment-reliability',
            details: {
              pattern: 'missing health checks',
              tool: 'deployment',
              securityImpact: 'low',
              performanceImpact: 'high',
            },
          });
        }

        // Issue 2: No rollback strategy
        if (content.includes('deploy') && !content.includes('rollback') && !content.includes('revision')) {
          issues.push({
            type: 'deployment',
            severity: 'high',
            file,
            line: 1,
            message: 'No rollback strategy configured',
            suggestion: 'Add rollback mechanism: kubectl rollout undo or preserve previous version',
            category: 'deployment-safety',
            details: {
              pattern: 'missing rollback',
              tool: 'deployment',
              securityImpact: 'low',
              performanceImpact: 'high',
            },
          });
        }

        // Issue 3: Direct production deployment
        if ((content.includes('production') || content.includes('prod')) && 
            !content.includes('staging') && !content.includes('canary')) {
          issues.push({
            type: 'deployment',
            severity: 'medium',
            file,
            line: 1,
            message: 'Direct production deployment without staging',
            suggestion: 'Deploy to staging first, then promote to production after validation',
            category: 'deployment-workflow',
            details: {
              pattern: 'no staging environment',
              tool: 'deployment',
              securityImpact: 'medium',
              performanceImpact: 'medium',
            },
          });
        }

        // Issue 4: No blue-green or canary deployment
        if (content.includes('replicas:') && !content.includes('strategy:')) {
          issues.push({
            type: 'deployment',
            severity: 'medium',
            file,
            line: 1,
            message: 'No deployment strategy specified',
            suggestion: 'Use rolling update strategy or blue-green deployment for zero downtime',
            category: 'deployment-strategy',
            details: {
              pattern: 'missing strategy',
              tool: 'kubernetes',
              securityImpact: 'low',
              performanceImpact: 'high',
            },
          });
        }

        // Issue 5: No smoke tests after deployment
        if (content.includes('deploy') && !content.includes('curl') && !content.includes('test')) {
          issues.push({
            type: 'deployment',
            severity: 'high',
            file,
            line: 1,
            message: 'No smoke tests after deployment',
            suggestion: 'Add smoke tests to verify deployment: curl -f https://api.example.com/health',
            category: 'deployment-validation',
            details: {
              pattern: 'missing smoke tests',
              tool: 'deployment',
              securityImpact: 'low',
              performanceImpact: 'high',
            },
          });
        }
      } catch (error: any) {
        console.warn(`⚠️  Failed to analyze deployment file ${file}:`, error.message);
      }
    }

    return issues;
  }

  /**
   * Calculate infrastructure metrics
   */
  private calculateMetrics(issues: InfrastructureIssue[], files: string[]): InfrastructureMetrics {
    const dockerfiles = files.filter(f => f.includes('Dockerfile')).length;
    const normalizedFiles = files.map(f => f.replace(/\\/g, '/'));
    const k8sManifests = normalizedFiles.filter(f => (f.includes('/k8s/') || f.includes('/kubernetes/')) && (f.endsWith('.yaml') || f.endsWith('.yml'))).length;
    const cicdPipelines = files.filter(f => 
      f.includes('.github/workflows/') || f.includes('.gitlab-ci.yml')
    ).length;
    const iacFiles = files.filter(f => f.endsWith('.tf') || f.includes('.template.')).length;

    const dockerIssues = issues.filter(i => i.type === 'docker').length;
    const k8sIssues = issues.filter(i => i.type === 'kubernetes').length;
    const cicdIssues = issues.filter(i => i.type === 'cicd').length;
    const iacIssues = issues.filter(i => i.type === 'iac').length;
    const deploymentIssues = issues.filter(i => i.type === 'deployment').length;

    // Calculate score (0-100)
    let score = 100;
    
    // Deduct points based on severity
    for (const issue of issues) {
      switch (issue.severity) {
        case 'critical':
          score -= 15;
          break;
        case 'high':
          score -= 10;
          break;
        case 'medium':
          score -= 5;
          break;
        case 'low':
          score -= 2;
          break;
      }
    }

    return {
      totalFiles: files.length,
      dockerfiles,
      k8sManifests,
      cicdPipelines,
      iacFiles,
      dockerIssues,
      k8sIssues,
      cicdIssues,
      iacIssues,
      deploymentIssues,
      infrastructureScore: Math.max(0, Math.min(100, score)),
    };
  }

  /**
   * Helper: Find files by patterns
   */
  private async findFiles(dir: string, patterns: string[]): Promise<string[]> {
    const files: string[] = [];

    try {
      const entries = await fs.readdir(dir, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);

        if (entry.isDirectory()) {
          if (!this.isExcluded(fullPath)) {
            const subFiles = await this.findFiles(fullPath, patterns);
            files.push(...subFiles);
          }
        } else {
          // Check if file matches any pattern
          const matches = patterns.some(pattern => {
            if (pattern.startsWith('.') && !pattern.includes('/')) {
              // Extension pattern
              return entry.name.endsWith(pattern);
            } else {
              // Filename pattern
              return entry.name === pattern || entry.name.includes(pattern);
            }
          });

          if (matches && !this.isExcluded(fullPath)) {
            files.push(fullPath);
          }
        }
      }
    } catch (error: any) {
      // Ignore errors for non-existent directories
    }

    return files;
  }

  /**
   * Helper: Check if file exists
   */
  private async fileExists(filePath: string): Promise<boolean> {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Helper: Check if directory exists
   */
  private async directoryExists(dirPath: string): Promise<boolean> {
    try {
      const stat = await fs.stat(dirPath);
      return stat.isDirectory();
    } catch {
      return false;
    }
  }

  /**
   * Helper: Check if path should be excluded
   */
  private isExcluded(filePath: string): boolean {
    const normalizedPath = filePath.replace(/\\/g, '/');
    return (this.config.excludePatterns || []).some(pattern => {
      const normalizedPattern = pattern.replace(/\*\*/g, '.*').replace(/\*/g, '[^/]*');
      return new RegExp(normalizedPattern).test(normalizedPath);
    });
  }
}

/**
 * Convenience function for quick infrastructure analysis
 */
export async function analyzeInfrastructure(
  workspaceRoot: string,
  config?: InfrastructureConfig
): Promise<InfrastructureAnalysisResult> {
  const detector = new InfrastructureDetector(config);
  return detector.analyze(workspaceRoot);
}
