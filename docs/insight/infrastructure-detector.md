# Infrastructure Detector

**Status**: ✅ Complete (Week 7-8)  
**Version**: 2.0.0  
**Test Coverage**: 46/46 tests passing (100%)  
**Detection Patterns**: 45 patterns across 5 categories

## Overview

The Infrastructure Detector analyzes Docker, Kubernetes, CI/CD pipelines, Infrastructure as Code (IaC), and deployment configurations to identify security risks, performance bottlenecks, and best practice violations.

## Key Features

- **🐳 Docker Analysis**: Detects insecure Dockerfiles, inefficient builds, and missing optimizations
- **☸️ Kubernetes Analysis**: Identifies security misconfigurations, missing resource limits, and high availability issues
- **🔄 CI/CD Analysis**: Checks GitHub Actions, GitLab CI, Jenkins pipelines for security and performance issues
- **🏗️ IaC Analysis**: Validates Terraform and CloudFormation templates for security and best practices
- **🚀 Deployment Analysis**: Ensures safe deployment practices with health checks and rollback strategies

## Detection Categories

### 1. Docker Issues (10 Patterns)

| Pattern | Severity | Description |
|---------|----------|-------------|
| `:latest` tag usage | High | Using unpinned latest tags causes unpredictable builds |
| Missing USER instruction | Critical | Running as root is a security risk |
| No multi-stage builds | Medium | Larger image sizes, slower deployments |
| `COPY . .` usage | Medium | Copying unnecessary files (node_modules, .git, tests) |
| Missing `.dockerignore` | Medium | Image bloat from temporary files |
| Inefficient layer caching | Medium | Slow builds due to cache invalidation |
| Hardcoded secrets in ENV | Critical | API keys, passwords exposed in image |
| Missing HEALTHCHECK | Medium | No container health monitoring |
| Multiple EXPOSE ports | Low | Unclear service boundaries |
| apt-get without cleanup | Medium | Larger image sizes |

**Example Detection**:
```dockerfile
# ❌ BAD: Multiple issues detected
FROM node:latest
COPY . .
RUN npm install
ENV API_KEY=sk-1234567890
CMD ["node", "index.js"]

# ✅ GOOD: Best practices
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY src ./src
USER node
HEALTHCHECK CMD wget -O- http://localhost:3000/health || exit 1
CMD ["node", "index.js"]
```

### 2. Kubernetes Issues (10 Patterns)

| Pattern | Severity | Description |
|---------|----------|-------------|
| Missing resource limits | High | Pods can consume unlimited resources |
| No liveness/readiness probes | High | No automatic restart on failures |
| Missing securityContext | Critical | Running as root in container |
| Privileged containers | High | Full host access is dangerous |
| `:latest` image tags | High | Unpredictable deployments |
| Single replica | Medium | No high availability |
| Missing PodDisruptionBudget | Medium | All pods can be evicted during maintenance |
| Hardcoded secrets | Critical | Passwords in plain text |
| Missing namespace | Low | Default namespace clutter |
| hostNetwork: true | Critical | Direct host network access |

**Example Detection**:
```yaml
# ❌ BAD: Security and reliability issues
apiVersion: apps/v1
kind: Deployment
metadata:
  name: myapp
spec:
  replicas: 1
  template:
    spec:
      containers:
      - name: myapp
        image: myapp:latest
        env:
        - name: DB_PASSWORD
          value: "mypassword123"

# ✅ GOOD: Production-ready
apiVersion: apps/v1
kind: Deployment
metadata:
  name: myapp
  namespace: production
spec:
  replicas: 3
  template:
    spec:
      securityContext:
        runAsNonRoot: true
        runAsUser: 1000
      containers:
      - name: myapp
        image: myapp:1.2.3
        resources:
          limits:
            memory: "512Mi"
            cpu: "500m"
          requests:
            memory: "256Mi"
            cpu: "250m"
        livenessProbe:
          httpGet:
            path: /health
            port: 3000
        readinessProbe:
          httpGet:
            path: /ready
            port: 3000
        env:
        - name: DB_PASSWORD
          valueFrom:
            secretKeyRef:
              name: myapp-secrets
              key: db-password
```

### 3. CI/CD Issues (10 Patterns)

| Pattern | Severity | Description |
|---------|----------|-------------|
| Hardcoded secrets | Critical | API keys in workflow files |
| No pull_request trigger | Medium | Tests not run on PRs |
| Tests on push to main | High | Testing after merge (too late) |
| No timeout specified | Medium | Workflows can hang indefinitely |
| ubuntu-latest usage | Low | Unpinned runner versions |
| No dependency caching | Medium | Slow builds |
| Deployment without tests | Critical | Deploying untested code |
| No artifact retention | Low | Storage waste |
| sudo usage | High | Security risk |
| No matrix testing | Low | Testing single version only |

**Example Detection**:
```yaml
# ❌ BAD: Security and performance issues
name: Deploy
on: [push]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - run: npm install
      - run: |
          export API_KEY="sk-1234567890"
          kubectl apply -f k8s/

# ✅ GOOD: Secure and fast
name: CI/CD
on:
  push:
    branches: [develop]
  pull_request:
    branches: [main, develop]
jobs:
  test:
    runs-on: ubuntu-22.04
    timeout-minutes: 30
    strategy:
      matrix:
        node-version: [18, 20, 22]
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: ${{ matrix.node-version }}
      - uses: actions/cache@v3
        with:
          path: ~/.npm
          key: ${{ runner.os }}-node-${{ hashFiles('**/package-lock.json') }}
      - run: npm ci
      - run: npm test
      - run: npm run build
      - uses: actions/upload-artifact@v3
        with:
          name: dist
          path: dist/
          retention-days: 7
  deploy:
    needs: test
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-22.04
    steps:
      - uses: actions/checkout@v3
      - run: |
          kubectl apply -f k8s/
        env:
          KUBE_CONFIG: ${{ secrets.KUBE_CONFIG }}
          API_KEY: ${{ secrets.API_KEY }}
```

### 4. Infrastructure as Code (IaC) Issues (10 Patterns)

| Pattern | Severity | Description |
|---------|----------|-------------|
| Hardcoded credentials | Critical | Access keys in Terraform files |
| No backend configuration | High | Statefile not remotely stored |
| Missing required_version | Medium | Terraform version unpinned |
| Public S3 buckets | Critical | Data exposed to internet |
| Security group 0.0.0.0/0 | Critical | Open to all IPs |
| Missing tags | Low | No cost tracking or ownership |
| Database without encryption | Critical | Data at rest unencrypted |
| No lifecycle policy | Medium | Resources not cleaned up |
| Hardcoded passwords | Critical | Database passwords in plain text |
| Missing DeletionPolicy | Medium | Accidental resource deletion |

**Example Detection**:
```hcl
# ❌ BAD: Multiple security issues
provider "aws" {
  access_key = "AKIAIOSFODNN7EXAMPLE"
  secret_key = "wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY"
}

resource "aws_s3_bucket" "data" {
  bucket = "my-bucket"
  acl    = "public-read"
}

resource "aws_db_instance" "main" {
  engine   = "postgres"
  username = "admin"
  password = "mypassword123"
}

# ✅ GOOD: Secure and managed
terraform {
  required_version = ">= 1.0"
  backend "s3" {
    bucket = "terraform-state"
    key    = "prod/terraform.tfstate"
    region = "us-east-1"
    encrypt = true
  }
}

provider "aws" {
  region = var.aws_region
}

resource "aws_s3_bucket" "data" {
  bucket = "my-bucket"
  
  tags = {
    Environment = "production"
    ManagedBy   = "terraform"
    Owner       = "platform-team"
  }
}

resource "aws_s3_bucket_public_access_block" "data" {
  bucket = aws_s3_bucket.data.id
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_db_instance" "main" {
  engine              = "postgres"
  username            = var.db_username
  password            = var.db_password
  storage_encrypted   = true
  deletion_protection = true
  
  lifecycle {
    prevent_destroy = true
  }
  
  tags = {
    Environment = "production"
    ManagedBy   = "terraform"
  }
}
```

### 5. Deployment Issues (5 Patterns)

| Pattern | Severity | Description |
|---------|----------|-------------|
| No health checks | High | Deploy without verifying app health |
| No rollback strategy | High | Can't revert bad deployments |
| Direct production deployment | Critical | No staging environment |
| No deployment strategy | Medium | Missing blue/green or canary |
| No smoke tests | Medium | Basic functionality not verified |

**Example Detection**:
```yaml
# ❌ BAD: Unsafe deployment
- name: Deploy to Production
  run: |
    kubectl apply -f k8s/
    echo "Deployed!"

# ✅ GOOD: Safe deployment with checks
- name: Deploy to Staging
  run: kubectl apply -f k8s/ -n staging

- name: Run Smoke Tests
  run: |
    kubectl wait --for=condition=ready pod -l app=myapp -n staging --timeout=300s
    curl -f https://staging.example.com/health || exit 1
    npm run test:smoke

- name: Deploy to Production (Blue/Green)
  if: success()
  run: |
    # Deploy to green environment
    kubectl apply -f k8s/ -n production-green
    
    # Wait for readiness
    kubectl wait --for=condition=ready pod -l app=myapp -n production-green --timeout=300s
    
    # Switch traffic
    kubectl patch service myapp -n production -p '{"spec":{"selector":{"version":"green"}}}'
    
    # Monitor for 5 minutes
    sleep 300
    
    # Check error rate
    if [ $(kubectl logs -l app=myapp -n production-green --tail=1000 | grep ERROR | wc -l) -gt 10 ]; then
      echo "High error rate detected - rolling back"
      kubectl patch service myapp -n production -p '{"spec":{"selector":{"version":"blue"}}}'
      exit 1
    fi
    
    echo "Deployment successful"
```

## CLI Usage

### Basic Analysis

```bash
# Analyze all infrastructure categories
odavl insight infrastructure

# Analyze specific categories
odavl insight infrastructure --categories docker,kubernetes

# Analyze with custom workspace
odavl insight infrastructure /path/to/project

# JSON output
odavl insight infrastructure --json > report.json

# Exclude patterns
odavl insight infrastructure --exclude "**/test/**,**/dist/**"
```

### CLI Options

| Option | Description | Default |
|--------|-------------|---------|
| `[workspace]` | Path to workspace directory | `process.cwd()` |
| `-c, --categories` | Categories to check (comma-separated) | `all` |
| `--json` | Output as JSON | `false` |
| `-e, --exclude` | Exclude patterns (comma-separated) | `node_modules,dist,.git` |

### Output Example

```
🏗️  Infrastructure Analysis Results
────────────────────────────────────────────────────────────

Detected Tools: Docker, Kubernetes, GitHub Actions

Infrastructure Score: 65/100
Total Issues: 23

By Type:
  🐳 docker: 6
  ☸️  kubernetes: 8
  🔄 cicd: 5
  🏗️  iac: 2
  🚀 deployment: 2

By Severity:
  Critical: 3
  High: 7
  Medium: 10
  Low: 3

Category Metrics:
  🐳 Docker Issues: 6
  ☸️  Kubernetes Issues: 8
  🔄 CI/CD Issues: 5
  🏗️  IaC Issues: 2
  🚀 Deployment Issues: 2

Top Issues:
  1. 🐳 [critical] Running as root user
     Dockerfile:15
     💡 Add USER instruction before CMD to run as non-root

  2. ☸️ [critical] Hardcoded secret in manifest: password
     k8s/deployment.yaml:23
     💡 Use Kubernetes Secrets with secretKeyRef or external secrets manager

  3. 🔄 [critical] Hardcoded secret in CI/CD pipeline: api_key
     .github/workflows/deploy.yml:18
     💡 Use secrets: ${{ secrets.API_KEY }} or environment variables

  4. ☸️ [high] Deployment missing resource limits
     k8s/deployment.yaml:1
     💡 Add resources: limits: memory: "512Mi"

  5. 🔄 [high] Tests run after push to main/master (too late)
     .github/workflows/ci.yml:1
     💡 Use branch protection rules to require tests on PRs before merging

  ... and 18 more issues

────────────────────────────────────────────────────────────
Analysis completed in 1234ms

💡 Tip: Use --json flag for machine-readable output
💡 Filter categories: --categories docker,kubernetes
📖 Learn more: docs/insight/infrastructure-detector.md
```

## Programmatic API

### TypeScript/JavaScript

```typescript
import { InfrastructureDetector } from '@odavl-studio/insight-core/detector';

const detector = new InfrastructureDetector({
  workspaceRoot: '/path/to/project',
  excludePatterns: ['**/node_modules/**', '**/dist/**'],
  categories: ['docker', 'kubernetes'], // Optional: filter categories
});

const result = await detector.analyze('/path/to/project');

console.log(`Score: ${result.metrics.infrastructureScore}/100`);
console.log(`Total Issues: ${result.issues.length}`);

// Filter critical issues
const critical = result.issues.filter(i => i.severity === 'critical');
console.log(`Critical Issues: ${critical.length}`);

// Group by type
const byType = result.issues.reduce((acc, issue) => {
  acc[issue.type] = (acc[issue.type] || 0) + 1;
  return acc;
}, {} as Record<string, number>);

console.log('Issues by type:', byType);
```

### Configuration Options

```typescript
interface InfrastructureConfig {
  workspaceRoot: string;                    // Required: workspace path
  excludePatterns?: string[];               // Default: ['**/node_modules/**', '**/dist/**', '**/.git/**']
  categories?: string[];                    // Optional: filter categories (docker, kubernetes, cicd, iac, deployment)
}
```

### Result Structure

```typescript
interface InfrastructureAnalysisResult {
  issues: InfrastructureIssue[];           // All detected issues
  metrics: InfrastructureMetrics;          // Analysis metrics
}

interface InfrastructureIssue {
  type: 'docker' | 'kubernetes' | 'cicd' | 'iac' | 'deployment';
  severity: 'critical' | 'high' | 'medium' | 'low';
  file: string;                            // File path
  line: number;                            // Line number
  message: string;                         // Issue description
  suggestion: string;                      // Fix suggestion
  category: string;                        // Issue category
  details: {
    pattern: string;                       // Detection pattern
    tool: string;                          // Tool (docker, kubectl, terraform, etc.)
    securityImpact: 'critical' | 'high' | 'medium' | 'low';
    performanceImpact: 'critical' | 'high' | 'medium' | 'low';
  };
}

interface InfrastructureMetrics {
  infrastructureScore: number;             // Overall score (0-100)
  totalIssues: number;                     // Total issues found
  dockerIssues: number;                    // Docker issues
  k8sIssues: number;                       // Kubernetes issues
  cicdIssues: number;                      // CI/CD issues
  iacIssues: number;                       // IaC issues
  deploymentIssues: number;                // Deployment issues
  detectedTools: string[];                 // Detected tools (Docker, Kubernetes, etc.)
  analysisTime: number;                    // Analysis duration (ms)
}
```

## Scoring System

The Infrastructure Score is calculated based on issue severity and count:

```
Score = 100 - (critical * 15 + high * 10 + medium * 5 + low * 2)
Minimum Score: 0
Maximum Score: 100
```

**Score Ranges**:
- **90-100**: Excellent (production-ready)
- **70-89**: Good (minor improvements needed)
- **50-69**: Fair (several issues to address)
- **0-49**: Poor (critical issues requiring immediate attention)

## Integration with CI/CD

### GitHub Actions

```yaml
name: Infrastructure Check
on: [push, pull_request]

jobs:
  infrastructure:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: pnpm/action-setup@v2
      - uses: actions/setup-node@v3
        with:
          node-version: 20
      
      - name: Install ODAVL CLI
        run: pnpm install -g @odavl-studio/cli
      
      - name: Run Infrastructure Analysis
        run: |
          odavl insight infrastructure --json > infrastructure-report.json
          
      - name: Check Score
        run: |
          SCORE=$(jq '.metrics.infrastructureScore' infrastructure-report.json)
          if [ "$SCORE" -lt 70 ]; then
            echo "❌ Infrastructure score too low: $SCORE/100"
            exit 1
          fi
          echo "✅ Infrastructure score: $SCORE/100"
      
      - name: Upload Report
        uses: actions/upload-artifact@v3
        with:
          name: infrastructure-report
          path: infrastructure-report.json
```

### GitLab CI

```yaml
infrastructure:
  stage: test
  image: node:20-alpine
  script:
    - npm install -g pnpm
    - pnpm install -g @odavl-studio/cli
    - odavl insight infrastructure --json > infrastructure-report.json
    - SCORE=$(jq '.metrics.infrastructureScore' infrastructure-report.json)
    - |
      if [ "$SCORE" -lt 70 ]; then
        echo "❌ Infrastructure score too low: $SCORE/100"
        exit 1
      fi
    - echo "✅ Infrastructure score: $SCORE/100"
  artifacts:
    reports:
      infrastructure: infrastructure-report.json
    paths:
      - infrastructure-report.json
```

## Best Practices

### 1. Docker Best Practices

- **Use specific tags**: `node:20-alpine` instead of `node:latest`
- **Multi-stage builds**: Separate build and runtime stages
- **Run as non-root**: Add `USER node` before `CMD`
- **Add health checks**: `HEALTHCHECK CMD wget -O- http://localhost:3000/health`
- **Use .dockerignore**: Exclude node_modules, .git, tests, etc.
- **Layer caching**: Order commands from least to most frequently changed

### 2. Kubernetes Best Practices

- **Resource limits**: Always set memory and CPU limits
- **Probes**: Add liveness and readiness probes
- **SecurityContext**: `runAsNonRoot: true`, `runAsUser: 1000`
- **Secrets**: Use secretKeyRef, never hardcode passwords
- **Replicas**: Set `replicas: 3` for high availability
- **PodDisruptionBudget**: Prevent all pods being evicted
- **Namespaces**: Organize resources by environment

### 3. CI/CD Best Practices

- **Pull request triggers**: Run tests on PRs, not just main
- **Timeouts**: Add `timeout-minutes: 30` to prevent hanging
- **Caching**: Cache dependencies (actions/cache, npm ci)
- **Matrix testing**: Test multiple versions (Node 18, 20, 22)
- **Secrets**: Use ${{ secrets.API_KEY }}, never hardcode
- **Pinned versions**: Use `ubuntu-22.04`, not `ubuntu-latest`
- **Artifact retention**: Set `retention-days: 7` to save storage

### 4. IaC Best Practices

- **Remote backend**: Store Terraform state in S3/GCS
- **Version pinning**: `required_version = ">= 1.0"`
- **Variables**: Use `var.db_password`, never hardcode
- **Encryption**: Enable `storage_encrypted = true`
- **Tags**: Add Environment, ManagedBy, Owner tags
- **Lifecycle**: `prevent_destroy = true` for critical resources
- **Private buckets**: Block public access by default

### 5. Deployment Best Practices

- **Staging first**: Deploy to staging, then production
- **Health checks**: Verify app health before switching traffic
- **Smoke tests**: Test critical endpoints after deployment
- **Rollback strategy**: Blue/green or canary deployments
- **Monitoring**: Track error rates and performance metrics

## Troubleshooting

### Issue: "No infrastructure files found"

**Cause**: Detector couldn't find Docker, Kubernetes, CI/CD, or IaC files.

**Solution**:
```bash
# Check current directory
ls -la

# Verify file existence
find . -name "Dockerfile" -o -name "*.yaml" -o -name "*.tf"

# Run from correct directory
cd /path/to/project
odavl insight infrastructure
```

### Issue: "Analysis taking too long"

**Cause**: Large workspace with many files.

**Solution**:
```bash
# Exclude unnecessary directories
odavl insight infrastructure --exclude "**/test/**,**/dist/**,**/build/**"

# Filter by category
odavl insight infrastructure --categories docker,kubernetes
```

### Issue: "False positives detected"

**Cause**: Detector may flag intentional patterns (e.g., ubuntu-latest in dev workflows).

**Solution**:
- Review suggestions carefully
- Use `--json` flag to filter results programmatically
- Exclude specific files with `--exclude` option
- Report false positives: [GitHub Issues](https://github.com/Monawlo812/odavl/issues)

## Performance

- **Average analysis time**: 1-3 seconds for typical projects
- **Large projects (100+ files)**: 5-10 seconds
- **Memory usage**: ~50MB
- **File discovery**: Recursive with exclusion patterns
- **Caching**: None (stateless analysis)

## Limitations

- **Language support**: Detects English error messages only
- **Custom tools**: Only supports standard tools (Docker, Kubernetes, GitHub Actions, GitLab CI, Terraform, CloudFormation)
- **Context awareness**: Does not understand project-specific architecture
- **Fix automation**: Provides suggestions only, no auto-fix (use ODAVL Autopilot)

## Roadmap

**Week 9-10** (Future Enhancements):
- Jenkins pipeline support
- Azure DevOps pipelines
- CircleCI configurations
- Helm chart validation
- Pulumi support
- Custom rule engine

## Related Documentation

- [ODAVL Insight Overview](./README.md)
- [Database Detector](./database-detector.md)
- [Next.js Detector](./nextjs-detector.md)
- [Architecture Detector](./architecture-detector.md)
- [ODAVL Autopilot](../autopilot/README.md) (auto-fix infrastructure issues)
- [ODAVL Guardian](../guardian/README.md) (pre-deploy testing)

## Support

- **Documentation**: https://docs.odavl.studio/insight/infrastructure
- **GitHub Issues**: https://github.com/Monawlo812/odavl/issues
- **Discord**: https://discord.gg/odavl
- **Email**: support@odavl.studio

## License

MIT License - see [LICENSE](../../LICENSE) for details.
