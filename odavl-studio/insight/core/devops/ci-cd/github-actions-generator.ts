/**
 * @fileoverview GitHub Actions workflow generator
 * Generates complete CI/CD workflows for GitHub Actions
 */

export interface GitHubActionsOptions {
  appName: string;
  registry?: 'ghcr' | 'docker-hub' | 'ecr' | 'acr' | 'gcr';
  deployTarget?: 'eks' | 'aks' | 'gke' | 'none';
  enableSecurity?: boolean;
  enableTesting?: boolean;
  workflowTriggers?: string[];
}

export class GitHubActionsGenerator {
  /**
   * Generate complete GitHub Actions workflow
   */
  static generate(options: GitHubActionsOptions): string {
    const {
      appName,
      registry = 'ghcr',
      deployTarget = 'none',
      enableSecurity = true,
      enableTesting = true,
      workflowTriggers = ['push', 'pull_request'],
    } = options;

    return `name: CI/CD Pipeline

on:
  ${this.generateTriggers(workflowTriggers)}

env:
  REGISTRY: ${this.getRegistryURL(registry)}
  IMAGE_NAME: \${{ github.repository }}

jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'pnpm'

      - name: Install pnpm
        uses: pnpm/action-setup@v3
        with:
          version: 9

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Run linter
        run: pnpm lint

      - name: TypeScript check
        run: pnpm typecheck
${
  enableTesting
    ? `
  test:
    runs-on: ubuntu-latest
    needs: lint
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'pnpm'

      - name: Install pnpm
        uses: pnpm/action-setup@v3
        with:
          version: 9

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Run tests
        run: pnpm test:coverage

      - name: Upload coverage
        uses: codecov/codecov-action@v4
        with:
          files: ./coverage/lcov.info
          token: \${{ secrets.CODECOV_TOKEN }}
`
    : ''
}
  build:
    runs-on: ubuntu-latest
    needs: ${enableTesting ? 'test' : 'lint'}
    permissions:
      contents: read
      packages: write
      id-token: write
    steps:
      - uses: actions/checkout@v4

      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v3

      - name: Set up QEMU
        uses: docker/setup-qemu-action@v3

      - name: Log into registry
        uses: docker/login-action@v3
        with:
          registry: \${{ env.REGISTRY }}
          username: \${{ github.actor }}
          password: \${{ secrets.GITHUB_TOKEN }}

      - name: Extract metadata
        id: meta
        uses: docker/metadata-action@v5
        with:
          images: \${{ env.REGISTRY }}/\${{ env.IMAGE_NAME }}
          tags: |
            type=ref,event=branch
            type=ref,event=pr
            type=semver,pattern={{version}}
            type=semver,pattern={{major}}.{{minor}}
            type=sha,prefix={{branch}}-

      - name: Build and push
        uses: docker/build-push-action@v5
        with:
          context: .
          platforms: linux/amd64,linux/arm64
          push: \${{ github.event_name != 'pull_request' }}
          tags: \${{ steps.meta.outputs.tags }}
          labels: \${{ steps.meta.outputs.labels }}
          cache-from: type=gha
          cache-to: type=gha,mode=max
${
  enableSecurity
    ? `
  security:
    runs-on: ubuntu-latest
    needs: build
    if: github.event_name != 'pull_request'
    permissions:
      contents: read
      security-events: write
    steps:
      - uses: actions/checkout@v4

      - name: Run Trivy vulnerability scanner
        uses: aquasecurity/trivy-action@master
        with:
          image-ref: \${{ env.REGISTRY }}/\${{ env.IMAGE_NAME }}:latest
          format: 'sarif'
          output: 'trivy-results.sarif'
          severity: 'CRITICAL,HIGH'

      - name: Upload Trivy results to GitHub Security
        uses: github/codeql-action/upload-sarif@v3
        with:
          sarif_file: 'trivy-results.sarif'

      - name: Run Snyk Container scan
        uses: snyk/actions/docker@master
        env:
          SNYK_TOKEN: \${{ secrets.SNYK_TOKEN }}
        with:
          image: \${{ env.REGISTRY }}/\${{ env.IMAGE_NAME }}:latest
          args: --severity-threshold=high --json-file-output=snyk-results.json

      - name: Upload Snyk results
        uses: actions/upload-artifact@v4
        with:
          name: snyk-scan-results
          path: snyk-results.json
`
    : ''
}${deployTarget !== 'none' ? this.generateDeployJob(deployTarget, registry) : ''}
`;
  }

  /**
   * Generate workflow triggers
   */
  private static generateTriggers(triggers: string[]): string {
    let config = '';

    triggers.forEach((trigger) => {
      switch (trigger) {
        case 'push':
          config += `  push:
    branches: [ main, develop ]
`;
          break;
        case 'pull_request':
          config += `  pull_request:
    branches: [ main, develop ]
`;
          break;
        case 'schedule':
          config += `  schedule:
    - cron: '0 0 * * 0'  # Weekly on Sunday
`;
          break;
        case 'workflow_dispatch':
          config += `  workflow_dispatch:
`;
          break;
      }
    });

    return config;
  }

  /**
   * Get registry URL
   */
  private static getRegistryURL(registry: string): string {
    switch (registry) {
      case 'ghcr':
        return 'ghcr.io';
      case 'docker-hub':
        return 'docker.io';
      case 'ecr':
        return '${{ secrets.AWS_ACCOUNT_ID }}.dkr.ecr.${{ secrets.AWS_REGION }}.amazonaws.com';
      case 'acr':
        return '${{ secrets.AZURE_REGISTRY_NAME }}.azurecr.io';
      case 'gcr':
        return 'gcr.io/${{ secrets.GCP_PROJECT_ID }}';
      default:
        return 'ghcr.io';
    }
  }

  /**
   * Generate deploy job
   */
  private static generateDeployJob(target: string, registry: string): string {
    switch (target) {
      case 'eks':
        return `
  deploy:
    runs-on: ubuntu-latest
    needs: build
    if: github.ref == 'refs/heads/main'
    environment: production
    steps:
      - uses: actions/checkout@v4

      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v4
        with:
          aws-access-key-id: \${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: \${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: \${{ secrets.AWS_REGION }}

      - name: Update kubeconfig
        run: |
          aws eks update-kubeconfig --name \${{ secrets.EKS_CLUSTER_NAME }} --region \${{ secrets.AWS_REGION }}

      - name: Deploy to EKS
        run: |
          kubectl set image deployment/\${{ env.IMAGE_NAME }} \${{ env.IMAGE_NAME }}=\${{ env.REGISTRY }}/\${{ env.IMAGE_NAME }}:latest
          kubectl rollout status deployment/\${{ env.IMAGE_NAME }}
`;

      case 'aks':
        return `
  deploy:
    runs-on: ubuntu-latest
    needs: build
    if: github.ref == 'refs/heads/main'
    environment: production
    steps:
      - uses: actions/checkout@v4

      - name: Azure Login
        uses: azure/login@v2
        with:
          creds: \${{ secrets.AZURE_CREDENTIALS }}

      - name: Get AKS credentials
        run: |
          az aks get-credentials --resource-group \${{ secrets.AKS_RESOURCE_GROUP }} --name \${{ secrets.AKS_CLUSTER_NAME }}

      - name: Deploy to AKS
        run: |
          kubectl set image deployment/\${{ env.IMAGE_NAME }} \${{ env.IMAGE_NAME }}=\${{ env.REGISTRY }}/\${{ env.IMAGE_NAME }}:latest
          kubectl rollout status deployment/\${{ env.IMAGE_NAME }}
`;

      case 'gke':
        return `
  deploy:
    runs-on: ubuntu-latest
    needs: build
    if: github.ref == 'refs/heads/main'
    environment: production
    steps:
      - uses: actions/checkout@v4

      - name: Authenticate to Google Cloud
        uses: google-github-actions/auth@v2
        with:
          credentials_json: \${{ secrets.GCP_CREDENTIALS }}

      - name: Get GKE credentials
        uses: google-github-actions/get-gke-credentials@v2
        with:
          cluster_name: \${{ secrets.GKE_CLUSTER_NAME }}
          location: \${{ secrets.GCP_REGION }}

      - name: Deploy to GKE
        run: |
          kubectl set image deployment/\${{ env.IMAGE_NAME }} \${{ env.IMAGE_NAME }}=\${{ env.REGISTRY }}/\${{ env.IMAGE_NAME }}:latest
          kubectl rollout status deployment/\${{ env.IMAGE_NAME }}
`;

      default:
        return '';
    }
  }

  /**
   * Generate workflow with Helm deployment
   */
  static generateWithHelm(options: GitHubActionsOptions & { chartPath: string; valuesFile: string }): string {
    const baseWorkflow = this.generate(options);
    const helmDeployStep = `
      - name: Deploy with Helm
        run: |
          helm upgrade --install \${{ env.IMAGE_NAME }} ${options.chartPath} \\
            --values ${options.valuesFile} \\
            --set image.tag=\${{ github.sha }} \\
            --wait --timeout 10m
`;

    return baseWorkflow.replace('kubectl rollout status', helmDeployStep);
  }

  /**
   * Generate release workflow
   */
  static generateReleaseWorkflow(appName: string): string {
    return `name: Release

on:
  push:
    tags:
      - 'v*'

jobs:
  release:
    runs-on: ubuntu-latest
    permissions:
      contents: write
      packages: write
    steps:
      - uses: actions/checkout@v4

      - name: Create Release
        uses: actions/create-release@v1
        env:
          GITHUB_TOKEN: \${{ secrets.GITHUB_TOKEN }}
        with:
          tag_name: \${{ github.ref }}
          release_name: Release \${{ github.ref }}
          draft: false
          prerelease: false

      - name: Build and push Docker image
        uses: docker/build-push-action@v5
        with:
          context: .
          platforms: linux/amd64,linux/arm64
          push: true
          tags: |
            ghcr.io/\${{ github.repository }}:\${{ github.ref_name }}
            ghcr.io/\${{ github.repository }}:latest
`;
  }
}
