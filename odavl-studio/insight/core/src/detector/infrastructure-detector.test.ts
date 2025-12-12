/**
 * ODAVL Insight - Infrastructure Detector Tests
 * 
 * Tests for infrastructure-detector.ts
 * Covers: Docker, Kubernetes, CI/CD, IaC, Deployment issues
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import { InfrastructureDetector, analyzeInfrastructure } from './infrastructure-detector';

// Test workspace directory
const TEST_WORKSPACE = path.join(process.cwd(), 'test-workspace-infrastructure');

describe('InfrastructureDetector', () => {
  beforeEach(async () => {
    // Create test workspace
    await fs.mkdir(TEST_WORKSPACE, { recursive: true });
  });

  afterEach(async () => {
    // Clean up test workspace
    try {
      await fs.rm(TEST_WORKSPACE, { recursive: true, force: true });
    } catch (error) {
      // Ignore cleanup errors
    }
  });

  describe('Docker Issues', () => {
    it('should detect :latest tag usage', async () => {
      const dockerfile = `FROM node:latest
COPY . .
RUN npm install
CMD ["node", "index.js"]`;

      await fs.writeFile(path.join(TEST_WORKSPACE, 'Dockerfile'), dockerfile);

      const detector = new InfrastructureDetector();
      const result = await detector.analyze(TEST_WORKSPACE);

      const issue = result.issues.find(i => i.message.includes(':latest'));
      expect(issue).toBeDefined();
      expect(issue?.severity).toBe('high');
      expect(issue?.category).toBe('docker-tags');
    });

    it('should detect missing USER instruction', async () => {
      const dockerfile = `FROM node:20-alpine
COPY . .
RUN npm install
CMD ["node", "index.js"]`;

      await fs.writeFile(path.join(TEST_WORKSPACE, 'Dockerfile'), dockerfile);

      const detector = new InfrastructureDetector();
      const result = await detector.analyze(TEST_WORKSPACE);

      const issue = result.issues.find(i => i.message.includes('root user'));
      expect(issue).toBeDefined();
      expect(issue?.severity).toBe('critical');
      expect(issue?.category).toBe('docker-security');
    });

    it('should detect missing multi-stage build', async () => {
      const dockerfile = `FROM node:20-alpine
COPY package*.json ./
RUN npm install
COPY . .
CMD ["node", "index.js"]`;

      await fs.writeFile(path.join(TEST_WORKSPACE, 'Dockerfile'), dockerfile);

      const detector = new InfrastructureDetector();
      const result = await detector.analyze(TEST_WORKSPACE);

      const issue = result.issues.find(i => i.message.includes('multi-stage'));
      expect(issue).toBeDefined();
      expect(issue?.severity).toBe('medium');
    });

    it('should detect COPY . . usage', async () => {
      const dockerfile = `FROM node:20-alpine
COPY . .
RUN npm install
CMD ["node", "index.js"]`;

      await fs.writeFile(path.join(TEST_WORKSPACE, 'Dockerfile'), dockerfile);

      const detector = new InfrastructureDetector();
      const result = await detector.analyze(TEST_WORKSPACE);

      const issue = result.issues.find(i => i.message.includes('COPY . .'));
      expect(issue).toBeDefined();
      expect(issue?.severity).toBe('medium');
      expect(issue?.category).toBe('docker-optimization');
    });

    it('should detect missing .dockerignore', async () => {
      const dockerfile = `FROM node:20-alpine
COPY . .
USER node
CMD ["node", "index.js"]`;

      await fs.writeFile(path.join(TEST_WORKSPACE, 'Dockerfile'), dockerfile);

      const detector = new InfrastructureDetector();
      const result = await detector.analyze(TEST_WORKSPACE);

      const issue = result.issues.find(i => i.message.includes('.dockerignore'));
      expect(issue).toBeDefined();
      expect(issue?.severity).toBe('medium');
    });

    it('should detect inefficient layer caching', async () => {
      const dockerfile = `FROM node:20-alpine
COPY . .
RUN npm install
USER node
CMD ["node", "index.js"]`;

      await fs.writeFile(path.join(TEST_WORKSPACE, 'Dockerfile'), dockerfile);

      const detector = new InfrastructureDetector();
      const result = await detector.analyze(TEST_WORKSPACE);

      const issue = result.issues.find(i => i.message.includes('layer caching'));
      expect(issue).toBeDefined();
      expect(issue?.severity).toBe('medium');
    });

    it('should detect hardcoded secrets in ENV', async () => {
      const dockerfile = `FROM node:20-alpine
ENV API_KEY="sk-1234567890abcdef"
ENV DATABASE_PASSWORD="mypassword123"
COPY . .
USER node
CMD ["node", "index.js"]`;

      await fs.writeFile(path.join(TEST_WORKSPACE, 'Dockerfile'), dockerfile);

      const detector = new InfrastructureDetector();
      const result = await detector.analyze(TEST_WORKSPACE);

      const secretIssues = result.issues.filter(i => i.message.includes('Hardcoded secret'));
      expect(secretIssues.length).toBeGreaterThan(0);
      expect(secretIssues[0].severity).toBe('critical');
      expect(secretIssues[0].category).toBe('docker-security');
    });

    it('should detect missing HEALTHCHECK', async () => {
      const dockerfile = `FROM node:20-alpine
EXPOSE 3000
COPY . .
USER node
CMD ["node", "index.js"]`;

      await fs.writeFile(path.join(TEST_WORKSPACE, 'Dockerfile'), dockerfile);

      const detector = new InfrastructureDetector();
      const result = await detector.analyze(TEST_WORKSPACE);

      const issue = result.issues.find(i => i.message.includes('HEALTHCHECK'));
      expect(issue).toBeDefined();
      expect(issue?.severity).toBe('medium');
    });

    it('should detect multiple exposed ports', async () => {
      const dockerfile = `FROM node:20-alpine
EXPOSE 3000
EXPOSE 3001
EXPOSE 3002
EXPOSE 3003
COPY . .
USER node
CMD ["node", "index.js"]`;

      await fs.writeFile(path.join(TEST_WORKSPACE, 'Dockerfile'), dockerfile);

      const detector = new InfrastructureDetector();
      const result = await detector.analyze(TEST_WORKSPACE);

      const issue = result.issues.find(i => i.message.includes('Multiple ports exposed'));
      expect(issue).toBeDefined();
      expect(issue?.severity).toBe('high');
    });

    it('should detect apt-get without cleanup', async () => {
      const dockerfile = `FROM ubuntu:22.04
RUN apt-get update && apt-get install -y curl wget
COPY . .
CMD ["node", "index.js"]`;

      await fs.writeFile(path.join(TEST_WORKSPACE, 'Dockerfile'), dockerfile);

      const detector = new InfrastructureDetector();
      const result = await detector.analyze(TEST_WORKSPACE);

      const issue = result.issues.find(i => i.message.includes('apt-get'));
      expect(issue).toBeDefined();
      expect(issue?.severity).toBe('low');
    });

    it('should NOT flag well-configured Dockerfile', async () => {
      const dockerfile = `FROM node:20.10-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build

FROM node:20.10-alpine
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
USER node
EXPOSE 3000
HEALTHCHECK CMD curl -f http://localhost:3000/health || exit 1
CMD ["node", "dist/index.js"]`;

      await fs.writeFile(path.join(TEST_WORKSPACE, 'Dockerfile'), dockerfile);
      await fs.writeFile(path.join(TEST_WORKSPACE, '.dockerignore'), 'node_modules\n.git\n*.md');

      const detector = new InfrastructureDetector();
      const result = await detector.analyze(TEST_WORKSPACE);

      // Should have minimal or no issues
      const criticalIssues = result.issues.filter(i => i.severity === 'critical');
      expect(criticalIssues.length).toBe(0);
    });
  });

  describe('Kubernetes Issues', () => {
    it('should detect missing resource limits', async () => {
      const k8sDir = path.join(TEST_WORKSPACE, 'k8s');
      await fs.mkdir(k8sDir, { recursive: true });

      const deployment = `apiVersion: apps/v1
kind: Deployment
metadata:
  name: myapp
spec:
  replicas: 3
  selector:
    matchLabels:
      app: myapp
  template:
    metadata:
      labels:
        app: myapp
    spec:
      containers:
      - name: myapp
        image: myapp:1.0.0
        ports:
        - containerPort: 8080`;

      await fs.writeFile(path.join(k8sDir, 'deployment.yaml'), deployment);

      const detector = new InfrastructureDetector();
      const result = await detector.analyze(TEST_WORKSPACE);

      const issue = result.issues.find(i => i.message.includes('resource limits'));
      expect(issue).toBeDefined();
      expect(issue?.severity).toBe('high');
      expect(issue?.category).toBe('k8s-resources');
    });

    it('should detect missing liveness probe', async () => {
      const k8sDir = path.join(TEST_WORKSPACE, 'k8s');
      await fs.mkdir(k8sDir, { recursive: true });

      const deployment = `apiVersion: apps/v1
kind: Deployment
metadata:
  name: myapp
spec:
  template:
    spec:
      containers:
      - name: myapp
        image: myapp:1.0.0`;

      await fs.writeFile(path.join(k8sDir, 'deployment.yaml'), deployment);

      const detector = new InfrastructureDetector();
      const result = await detector.analyze(TEST_WORKSPACE);

      const issue = result.issues.find(i => i.message.includes('liveness probe'));
      expect(issue).toBeDefined();
      expect(issue?.severity).toBe('high');
      expect(issue?.category).toBe('k8s-health');
    });

    it('should detect missing readiness probe', async () => {
      const k8sDir = path.join(TEST_WORKSPACE, 'k8s');
      await fs.mkdir(k8sDir, { recursive: true });

      const deployment = `apiVersion: apps/v1
kind: Deployment
metadata:
  name: myapp
spec:
  template:
    spec:
      containers:
      - name: myapp
        image: myapp:1.0.0`;

      await fs.writeFile(path.join(k8sDir, 'deployment.yaml'), deployment);

      const detector = new InfrastructureDetector();
      const result = await detector.analyze(TEST_WORKSPACE);

      const issue = result.issues.find(i => i.message.includes('readiness probe'));
      expect(issue).toBeDefined();
      expect(issue?.severity).toBe('high');
    });

    it('should detect missing securityContext', async () => {
      const k8sDir = path.join(TEST_WORKSPACE, 'k8s');
      await fs.mkdir(k8sDir, { recursive: true });

      const deployment = `apiVersion: apps/v1
kind: Deployment
metadata:
  name: myapp
spec:
  template:
    spec:
      containers:
      - name: myapp
        image: myapp:1.0.0`;

      await fs.writeFile(path.join(k8sDir, 'deployment.yaml'), deployment);

      const detector = new InfrastructureDetector();
      const result = await detector.analyze(TEST_WORKSPACE);

      const issue = result.issues.find(i => i.message.includes('root user'));
      expect(issue).toBeDefined();
      expect(issue?.severity).toBe('critical');
      expect(issue?.category).toBe('k8s-security');
    });

    it('should detect privileged containers', async () => {
      const k8sDir = path.join(TEST_WORKSPACE, 'k8s');
      await fs.mkdir(k8sDir, { recursive: true });

      const deployment = `apiVersion: apps/v1
kind: Deployment
metadata:
  name: myapp
spec:
  template:
    spec:
      containers:
      - name: myapp
        image: myapp:1.0.0
        securityContext:
          privileged: true`;

      await fs.writeFile(path.join(k8sDir, 'deployment.yaml'), deployment);

      const detector = new InfrastructureDetector();
      const result = await detector.analyze(TEST_WORKSPACE);

      const issue = result.issues.find(i => i.message.includes('privileged mode'));
      expect(issue).toBeDefined();
      expect(issue?.severity).toBe('critical');
    });

    it('should detect :latest image tag', async () => {
      const k8sDir = path.join(TEST_WORKSPACE, 'k8s');
      await fs.mkdir(k8sDir, { recursive: true });

      const deployment = `apiVersion: apps/v1
kind: Deployment
metadata:
  name: myapp
spec:
  template:
    spec:
      containers:
      - name: myapp
        image: myapp:latest`;

      await fs.writeFile(path.join(k8sDir, 'deployment.yaml'), deployment);

      const detector = new InfrastructureDetector();
      const result = await detector.analyze(TEST_WORKSPACE);

      const issue = result.issues.find(i => i.message.includes(':latest'));
      expect(issue).toBeDefined();
      expect(issue?.severity).toBe('high');
    });

    it('should detect single replica deployment', async () => {
      const k8sDir = path.join(TEST_WORKSPACE, 'k8s');
      await fs.mkdir(k8sDir, { recursive: true });

      const deployment = `apiVersion: apps/v1
kind: Deployment
metadata:
  name: myapp
spec:
  replicas: 1
  template:
    spec:
      containers:
      - name: myapp
        image: myapp:1.0.0`;

      await fs.writeFile(path.join(k8sDir, 'deployment.yaml'), deployment);

      const detector = new InfrastructureDetector();
      const result = await detector.analyze(TEST_WORKSPACE);

      const issue = result.issues.find(i => i.message.includes('Single replica'));
      expect(issue).toBeDefined();
      expect(issue?.severity).toBe('medium');
      expect(issue?.category).toBe('k8s-availability');
    });

    it('should detect hardcoded secrets', async () => {
      const k8sDir = path.join(TEST_WORKSPACE, 'k8s');
      await fs.mkdir(k8sDir, { recursive: true });

      const deployment = `apiVersion: apps/v1
kind: Deployment
metadata:
  name: myapp
spec:
  template:
    spec:
      containers:
      - name: myapp
        image: myapp:1.0.0
        env:
        - name: DB_PASSWORD
          value: "mypassword123"`;

      await fs.writeFile(path.join(k8sDir, 'deployment.yaml'), deployment);

      const detector = new InfrastructureDetector();
      const result = await detector.analyze(TEST_WORKSPACE);

      const issue = result.issues.find(i => i.message.includes('Hardcoded secret'));
      expect(issue).toBeDefined();
      expect(issue?.severity).toBe('critical');
    });

    it('should detect hostNetwork usage', async () => {
      const k8sDir = path.join(TEST_WORKSPACE, 'k8s');
      await fs.mkdir(k8sDir, { recursive: true });

      const deployment = `apiVersion: apps/v1
kind: Deployment
metadata:
  name: myapp
spec:
  template:
    spec:
      hostNetwork: true
      containers:
      - name: myapp
        image: myapp:1.0.0`;

      await fs.writeFile(path.join(k8sDir, 'deployment.yaml'), deployment);

      const detector = new InfrastructureDetector();
      const result = await detector.analyze(TEST_WORKSPACE);

      const issue = result.issues.find(i => i.message.includes('host network'));
      expect(issue).toBeDefined();
      expect(issue?.severity).toBe('high');
    });

    it('should NOT flag well-configured Kubernetes deployment', async () => {
      const k8sDir = path.join(TEST_WORKSPACE, 'k8s');
      await fs.mkdir(k8sDir, { recursive: true });

      const deployment = `apiVersion: apps/v1
kind: Deployment
metadata:
  name: myapp
  namespace: production
spec:
  replicas: 3
  selector:
    matchLabels:
      app: myapp
  template:
    metadata:
      labels:
        app: myapp
    spec:
      securityContext:
        runAsNonRoot: true
        runAsUser: 1000
      containers:
      - name: myapp
        image: myapp:1.2.3
        ports:
        - containerPort: 8080
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
            port: 8080
        readinessProbe:
          httpGet:
            path: /ready
            port: 8080`;

      await fs.writeFile(path.join(k8sDir, 'deployment.yaml'), deployment);

      const detector = new InfrastructureDetector();
      const result = await detector.analyze(TEST_WORKSPACE);

      const criticalIssues = result.issues.filter(i => 
        i.file.includes('deployment.yaml') && i.severity === 'critical'
      );
      expect(criticalIssues.length).toBe(0);
    });
  });

  describe('CI/CD Issues', () => {
    it('should detect hardcoded secrets in GitHub Actions', async () => {
      const workflowsDir = path.join(TEST_WORKSPACE, '.github', 'workflows');
      await fs.mkdir(workflowsDir, { recursive: true });

      const workflow = `name: Deploy
on: [push]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Deploy
        run: |
          export API_KEY="sk-1234567890"
          ./deploy.sh`;

      await fs.writeFile(path.join(workflowsDir, 'deploy.yml'), workflow);

      const detector = new InfrastructureDetector();
      const result = await detector.analyze(TEST_WORKSPACE);

      const issue = result.issues.find(i => i.message.includes('Hardcoded secret'));
      expect(issue).toBeDefined();
      expect(issue?.severity).toBe('critical');
      expect(issue?.category).toBe('cicd-security');
    });

    it('should detect missing pull_request trigger', async () => {
      const workflowsDir = path.join(TEST_WORKSPACE, '.github', 'workflows');
      await fs.mkdir(workflowsDir, { recursive: true });

      const workflow = `name: CI
on:
  push:
    branches: [main]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - run: npm test`;

      await fs.writeFile(path.join(workflowsDir, 'ci.yml'), workflow);

      const detector = new InfrastructureDetector();
      const result = await detector.analyze(TEST_WORKSPACE);

      const issue = result.issues.find(i => i.message.includes('pull_request'));
      expect(issue).toBeDefined();
      expect(issue?.severity).toBe('medium');
    });

    it('should detect tests running on push to main', async () => {
      const workflowsDir = path.join(TEST_WORKSPACE, '.github', 'workflows');
      await fs.mkdir(workflowsDir, { recursive: true });

      const workflow = `name: CI
on:
  push:
    branches:
      - main
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - run: npm test`;

      await fs.writeFile(path.join(workflowsDir, 'ci.yml'), workflow);

      const detector = new InfrastructureDetector();
      const result = await detector.analyze(TEST_WORKSPACE);

      const issue = result.issues.find(i => i.message.includes('push to main'));
      expect(issue).toBeDefined();
      expect(issue?.severity).toBe('high');
    });

    it('should detect missing timeout', async () => {
      const workflowsDir = path.join(TEST_WORKSPACE, '.github', 'workflows');
      await fs.mkdir(workflowsDir, { recursive: true });

      const workflow = `name: CI
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - run: npm test`;

      await fs.writeFile(path.join(workflowsDir, 'ci.yml'), workflow);

      const detector = new InfrastructureDetector();
      const result = await detector.analyze(TEST_WORKSPACE);

      const issue = result.issues.find(i => i.message.includes('timeout'));
      expect(issue).toBeDefined();
      expect(issue?.severity).toBe('medium');
    });

    it('should detect ubuntu-latest usage', async () => {
      const workflowsDir = path.join(TEST_WORKSPACE, '.github', 'workflows');
      await fs.mkdir(workflowsDir, { recursive: true });

      const workflow = `name: CI
on: [push]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - run: npm test`;

      await fs.writeFile(path.join(workflowsDir, 'ci.yml'), workflow);

      const detector = new InfrastructureDetector();
      const result = await detector.analyze(TEST_WORKSPACE);

      const issue = result.issues.find(i => i.message.includes('ubuntu-latest'));
      expect(issue).toBeDefined();
      expect(issue?.severity).toBe('low');
    });

    it('should detect missing dependency caching', async () => {
      const workflowsDir = path.join(TEST_WORKSPACE, '.github', 'workflows');
      await fs.mkdir(workflowsDir, { recursive: true });

      const workflow = `name: CI
on: [push]
jobs:
  test:
    runs-on: ubuntu-22.04
    steps:
      - uses: actions/checkout@v3
      - run: npm install
      - run: npm test`;

      await fs.writeFile(path.join(workflowsDir, 'ci.yml'), workflow);

      const detector = new InfrastructureDetector();
      const result = await detector.analyze(TEST_WORKSPACE);

      const issue = result.issues.find(i => i.message.includes('caching'));
      expect(issue).toBeDefined();
      expect(issue?.severity).toBe('medium');
    });

    it('should detect deployment without tests', async () => {
      const workflowsDir = path.join(TEST_WORKSPACE, '.github', 'workflows');
      await fs.mkdir(workflowsDir, { recursive: true });

      const workflow = `name: Deploy
on: [push]
jobs:
  deploy:
    runs-on: ubuntu-22.04
    steps:
      - uses: actions/checkout@v3
      - run: kubectl apply -f k8s/`;

      await fs.writeFile(path.join(workflowsDir, 'deploy.yml'), workflow);

      const detector = new InfrastructureDetector();
      const result = await detector.analyze(TEST_WORKSPACE);

      const issue = result.issues.find(i => i.message.includes('without running tests'));
      expect(issue).toBeDefined();
      expect(issue?.severity).toBe('critical');
    });

    it('should detect sudo usage', async () => {
      const workflowsDir = path.join(TEST_WORKSPACE, '.github', 'workflows');
      await fs.mkdir(workflowsDir, { recursive: true });

      const workflow = `name: CI
on: [push]
jobs:
  test:
    runs-on: ubuntu-22.04
    steps:
      - run: sudo apt-get install -y docker`;

      await fs.writeFile(path.join(workflowsDir, 'ci.yml'), workflow);

      const detector = new InfrastructureDetector();
      const result = await detector.analyze(TEST_WORKSPACE);

      const issue = result.issues.find(i => i.message.includes('sudo'));
      expect(issue).toBeDefined();
      expect(issue?.severity).toBe('high');
    });

    it('should detect missing matrix testing', async () => {
      const workflowsDir = path.join(TEST_WORKSPACE, '.github', 'workflows');
      await fs.mkdir(workflowsDir, { recursive: true });

      const workflow = `name: CI
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-22.04
    steps:
      - uses: actions/setup-node@v3
        with:
          node-version: 20
      - run: npm test`;

      await fs.writeFile(path.join(workflowsDir, 'test-single-version.yml'), workflow);

      const detector = new InfrastructureDetector();
      const result = await detector.analyze(TEST_WORKSPACE);

      const issue = result.issues.find(i => i.message.includes('matrix'));
      expect(issue).toBeDefined();
      expect(issue?.severity).toBe('low');
    });

    it('should NOT flag well-configured GitHub Actions', async () => {
      const workflowsDir = path.join(TEST_WORKSPACE, '.github', 'workflows');
      await fs.mkdir(workflowsDir, { recursive: true });

      const workflow = `name: CI
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
          node-version: \${{ matrix.node-version }}
          
      - uses: actions/cache@v3
        with:
          path: ~/.npm
          key: \${{ runner.os }}-node-\${{ hashFiles('**/package-lock.json') }}
          
      - run: npm ci
      - run: npm test
      - run: npm run build
      
      - uses: actions/upload-artifact@v3
        with:
          name: dist
          path: dist/
          retention-days: 7`;

      await fs.writeFile(path.join(workflowsDir, 'ci.yml'), workflow);

      const detector = new InfrastructureDetector();
      const result = await detector.analyze(TEST_WORKSPACE);

      const criticalIssues = result.issues.filter(i => 
        i.file.includes('ci.yml') && i.severity === 'critical'
      );
      expect(criticalIssues.length).toBe(0);
    });
  });

  describe('Infrastructure as Code (IaC) Issues', () => {
    it('should detect hardcoded credentials in Terraform', async () => {
      const terraformDir = path.join(TEST_WORKSPACE, 'terraform');
      await fs.mkdir(terraformDir, { recursive: true });

      const tf = `provider "aws" {
  access_key = "AKIAIOSFODNN7EXAMPLE"
  secret_key = "wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY"
}`;

      await fs.writeFile(path.join(terraformDir, 'main.tf'), tf);

      const detector = new InfrastructureDetector();
      const result = await detector.analyze(TEST_WORKSPACE);

      const issues = result.issues.filter(i => i.message.includes('Hardcoded credential'));
      expect(issues.length).toBeGreaterThan(0);
      expect(issues[0].severity).toBe('critical');
    });

    it('should detect missing backend configuration', async () => {
      const terraformDir = path.join(TEST_WORKSPACE, 'terraform');
      await fs.mkdir(terraformDir, { recursive: true });

      const tf = `resource "aws_instance" "example" {
  ami           = "ami-0c55b159cbfafe1f0"
  instance_type = "t2.micro"
}`;

      await fs.writeFile(path.join(terraformDir, 'main.tf'), tf);

      const detector = new InfrastructureDetector();
      const result = await detector.analyze(TEST_WORKSPACE);

      const issue = result.issues.find(i => i.message.includes('backend'));
      expect(issue).toBeDefined();
      expect(issue?.severity).toBe('high');
    });

    it('should detect public S3 bucket', async () => {
      const terraformDir = path.join(TEST_WORKSPACE, 'terraform');
      await fs.mkdir(terraformDir, { recursive: true });

      const tf = `resource "aws_s3_bucket" "example" {
  bucket = "my-bucket"
  acl    = "public-read"
}`;

      await fs.writeFile(path.join(terraformDir, 's3.tf'), tf);

      const detector = new InfrastructureDetector();
      const result = await detector.analyze(TEST_WORKSPACE);

      const issue = result.issues.find(i => i.message.includes('public access'));
      expect(issue).toBeDefined();
      expect(issue?.severity).toBe('critical');
    });

    it('should detect security group with 0.0.0.0/0', async () => {
      const terraformDir = path.join(TEST_WORKSPACE, 'terraform');
      await fs.mkdir(terraformDir, { recursive: true });

      const tf = `resource "aws_security_group" "example" {
  ingress {
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }
}`;

      await fs.writeFile(path.join(terraformDir, 'security.tf'), tf);

      const detector = new InfrastructureDetector();
      const result = await detector.analyze(TEST_WORKSPACE);

      const issue = result.issues.find(i => i.message.includes('0.0.0.0/0'));
      expect(issue).toBeDefined();
      expect(issue?.severity).toBe('high');
    });

    it('should detect database without encryption', async () => {
      const terraformDir = path.join(TEST_WORKSPACE, 'terraform');
      await fs.mkdir(terraformDir, { recursive: true });

      const tf = `resource "aws_db_instance" "example" {
  engine         = "postgres"
  instance_class = "db.t3.micro"
}`;

      await fs.writeFile(path.join(terraformDir, 'database.tf'), tf);

      const detector = new InfrastructureDetector();
      const result = await detector.analyze(TEST_WORKSPACE);

      const issue = result.issues.find(i => i.message.includes('encryption'));
      expect(issue).toBeDefined();
      expect(issue?.severity).toBe('critical');
    });
  });

  describe('Deployment Issues', () => {
    it('should detect deployment without health checks', async () => {
      const workflowsDir = path.join(TEST_WORKSPACE, '.github', 'workflows');
      await fs.mkdir(workflowsDir, { recursive: true });

      const workflow = `name: Deploy
on: [push]
jobs:
  deploy:
    runs-on: ubuntu-22.04
    steps:
      - run: kubectl apply -f k8s/deployment.yaml`;

      await fs.writeFile(path.join(workflowsDir, 'deploy.yml'), workflow);

      const detector = new InfrastructureDetector();
      const result = await detector.analyze(TEST_WORKSPACE);

      const issue = result.issues.find(i => 
        i.type === 'deployment' && i.message.includes('health checks')
      );
      expect(issue).toBeDefined();
      expect(issue?.severity).toBe('high');
    });

    it('should detect missing rollback strategy', async () => {
      const workflowsDir = path.join(TEST_WORKSPACE, '.github', 'workflows');
      await fs.mkdir(workflowsDir, { recursive: true });

      const workflow = `name: Deploy
on: [push]
jobs:
  deploy:
    runs-on: ubuntu-22.04
    steps:
      - run: kubectl apply -f k8s/
      - run: kubectl set image deployment/myapp myapp=myapp:latest`;

      await fs.writeFile(path.join(workflowsDir, 'deploy.yml'), workflow);

      const detector = new InfrastructureDetector();
      const result = await detector.analyze(TEST_WORKSPACE);

      const issue = result.issues.find(i => 
        i.type === 'deployment' && i.message.includes('rollback')
      );
      expect(issue).toBeDefined();
      expect(issue?.severity).toBe('high');
    });

    it('should detect direct production deployment', async () => {
      const k8sDir = path.join(TEST_WORKSPACE, 'k8s');
      await fs.mkdir(k8sDir, { recursive: true });

      const deployment = `apiVersion: apps/v1
kind: Deployment
metadata:
  name: myapp
  namespace: production
spec:
  replicas: 3`;

      await fs.writeFile(path.join(k8sDir, 'deployment.yaml'), deployment);

      const detector = new InfrastructureDetector();
      const result = await detector.analyze(TEST_WORKSPACE);

      const issue = result.issues.find(i => 
        i.type === 'deployment' && i.message.includes('staging')
      );
      expect(issue).toBeDefined();
      expect(issue?.severity).toBe('medium');
    });

    it('should detect missing smoke tests', async () => {
      const workflowsDir = path.join(TEST_WORKSPACE, '.github', 'workflows');
      await fs.mkdir(workflowsDir, { recursive: true });

      const workflow = `name: Deploy
on: [push]
jobs:
  deploy:
    runs-on: ubuntu-22.04
    steps:
      - run: kubectl apply -f k8s/
      - run: echo "Deployed successfully"`;

      await fs.writeFile(path.join(workflowsDir, 'deploy.yml'), workflow);

      const detector = new InfrastructureDetector();
      const result = await detector.analyze(TEST_WORKSPACE);

      const issue = result.issues.find(i => 
        i.type === 'deployment' && i.message.includes('smoke tests')
      );
      expect(issue).toBeDefined();
      expect(issue?.severity).toBe('high');
    });
  });

  describe('Metrics Calculation', () => {
    it('should calculate infrastructure score correctly', async () => {
      // Good Dockerfile
      const dockerfile = `FROM node:20.10-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .

FROM node:20.10-alpine
WORKDIR /app
COPY --from=builder /app/dist ./dist
USER node
EXPOSE 3000
HEALTHCHECK CMD curl -f http://localhost:3000/health || exit 1
CMD ["node", "dist/index.js"]`;

      await fs.writeFile(path.join(TEST_WORKSPACE, 'Dockerfile'), dockerfile);

      const detector = new InfrastructureDetector();
      const result = await detector.analyze(TEST_WORKSPACE);

      expect(result.metrics.infrastructureScore).toBeGreaterThan(50);
      expect(result.metrics.totalFiles).toBeGreaterThan(0);
    });

    it('should track issue counts by category', async () => {
      // Create multiple infrastructure files with issues
      const dockerfile = `FROM node:latest
COPY . .
CMD ["node", "index.js"]`;

      await fs.writeFile(path.join(TEST_WORKSPACE, 'Dockerfile'), dockerfile);

      const k8sDir = path.join(TEST_WORKSPACE, 'k8s');
      await fs.mkdir(k8sDir, { recursive: true });

      const deployment = `apiVersion: apps/v1
kind: Deployment
metadata:
  name: myapp
spec:
  replicas: 1
  template:
    spec:
      containers:
      - name: myapp
        image: myapp:latest`;

      await fs.writeFile(path.join(k8sDir, 'deployment.yaml'), deployment);

      const detector = new InfrastructureDetector();
      const result = await detector.analyze(TEST_WORKSPACE);

      expect(result.metrics.dockerIssues).toBeGreaterThan(0);
      expect(result.metrics.k8sIssues).toBeGreaterThan(0);
    });
  });

  describe('Configuration Options', () => {
    it('should respect custom directories', async () => {
      const customK8sDir = path.join(TEST_WORKSPACE, 'kubernetes');
      await fs.mkdir(customK8sDir, { recursive: true });

      const deployment = `apiVersion: apps/v1
kind: Deployment`;

      await fs.writeFile(path.join(customK8sDir, 'deployment.yaml'), deployment);

      const detector = new InfrastructureDetector({
        k8sDir: 'kubernetes',
      });

      const result = await detector.analyze(TEST_WORKSPACE);
      expect(result.metrics.k8sManifests).toBeGreaterThan(0);
    });

    it('should allow disabling specific checks', async () => {
      const dockerfile = `FROM node:latest
COPY . .
CMD ["node", "index.js"]`;

      await fs.writeFile(path.join(TEST_WORKSPACE, 'Dockerfile'), dockerfile);

      const detector = new InfrastructureDetector({
        checkDocker: false,
      });

      const result = await detector.analyze(TEST_WORKSPACE);
      expect(result.metrics.dockerIssues).toBe(0);
    });
  });

  describe('Helper Function', () => {
    it('should provide convenience analyzeInfrastructure function', async () => {
      const dockerfile = `FROM node:20-alpine
USER node
CMD ["node", "index.js"]`;

      await fs.writeFile(path.join(TEST_WORKSPACE, 'Dockerfile'), dockerfile);

      const result = await analyzeInfrastructure(TEST_WORKSPACE);

      expect(result.issues).toBeDefined();
      expect(result.metrics).toBeDefined();
      expect(result.timestamp).toBeDefined();
    });
  });

  describe('Performance', () => {
    it('should analyze multiple files quickly', async () => {
      // Create 10 infrastructure files
      for (let i = 0; i < 10; i++) {
        const dockerfile = `FROM node:20-alpine
USER node
CMD ["node", "index${i}.js"]`;
        await fs.writeFile(path.join(TEST_WORKSPACE, `Dockerfile.${i}`), dockerfile);
      }

      const startTime = performance.now();
      const detector = new InfrastructureDetector();
      await detector.analyze(TEST_WORKSPACE);
      const duration = performance.now() - startTime;

      // Should complete in less than 1 second for 10 files
      expect(duration).toBeLessThan(1000);
    });
  });
});
