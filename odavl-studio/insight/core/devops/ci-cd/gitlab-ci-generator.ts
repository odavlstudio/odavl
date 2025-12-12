/**
 * @fileoverview GitLab CI/CD pipeline generator
 * Generates complete .gitlab-ci.yml with stages, jobs, and deployment
 */

export interface GitLabCIOptions {
  appName: string;
  registry?: 'gitlab' | 'docker-hub' | 'ecr' | 'acr' | 'gcr';
  deployTarget?: 'eks' | 'aks' | 'gke' | 'none';
  enableSecurity?: boolean;
  enableTesting?: boolean;
  stages?: string[];
}

export class GitLabCIGenerator {
  /**
   * Generate complete .gitlab-ci.yml
   */
  static generate(options: GitLabCIOptions): string {
    const {
      appName,
      registry = 'gitlab',
      deployTarget = 'none',
      enableSecurity = true,
      enableTesting = true,
      stages = ['build', 'test', 'security', 'deploy'],
    } = options;

    return `# GitLab CI/CD Pipeline for ${appName}

stages:
${stages.map((stage) => `  - ${stage}`).join('\n')}

variables:
  DOCKER_DRIVER: overlay2
  DOCKER_TLS_CERTDIR: "/certs"
  REGISTRY: ${this.getRegistryURL(registry)}
  IMAGE_NAME: \${REGISTRY}/\${CI_PROJECT_PATH}

# Global before_script
default:
  before_script:
    - echo "Running CI/CD pipeline for ${appName}"

# Docker image build
build:
  stage: build
  image: docker:24-dind
  services:
    - docker:24-dind
  before_script:
    - docker login -u \${CI_REGISTRY_USER} -p \${CI_REGISTRY_PASSWORD} \${CI_REGISTRY}
  script:
    - docker build -t \${IMAGE_NAME}:\${CI_COMMIT_SHORT_SHA} -t \${IMAGE_NAME}:latest .
    - docker push \${IMAGE_NAME}:\${CI_COMMIT_SHORT_SHA}
    - docker push \${IMAGE_NAME}:latest
  only:
    - main
    - develop
    - tags

# Lint and TypeScript check
lint:
  stage: build
  image: node:20-alpine
  cache:
    paths:
      - node_modules/
  before_script:
    - npm install -g pnpm@9
    - pnpm install --frozen-lockfile
  script:
    - pnpm lint
    - pnpm typecheck
  only:
    - main
    - develop
    - merge_requests
${
  enableTesting
    ? `
# Unit tests
test:
  stage: test
  image: node:20-alpine
  cache:
    paths:
      - node_modules/
  before_script:
    - npm install -g pnpm@9
    - pnpm install --frozen-lockfile
  script:
    - pnpm test:coverage
  coverage: '/All files[^|]*\\|[^|]*\\s+([\\d\\.]+)/'
  artifacts:
    reports:
      coverage_report:
        coverage_format: cobertura
        path: coverage/cobertura-coverage.xml
    paths:
      - coverage/
  only:
    - main
    - develop
    - merge_requests
`
    : ''
}${
      enableSecurity
        ? `
# Security scan with Trivy
trivy_scan:
  stage: security
  image: aquasec/trivy:latest
  script:
    - trivy image --exit-code 0 --severity HIGH,CRITICAL \${IMAGE_NAME}:latest --format json --output trivy-results.json
  artifacts:
    reports:
      container_scanning: trivy-results.json
    paths:
      - trivy-results.json
    expire_in: 1 week
  only:
    - main
    - develop

# Security scan with Snyk
snyk_scan:
  stage: security
  image: snyk/snyk:node
  script:
    - snyk container test \${IMAGE_NAME}:latest --severity-threshold=high --json-file-output=snyk-results.json
  artifacts:
    paths:
      - snyk-results.json
    expire_in: 1 week
  allow_failure: true
  only:
    - main
    - develop
`
        : ''
    }${deployTarget !== 'none' ? this.generateDeployJob(deployTarget) : ''}
`;
  }

  /**
   * Get registry URL
   */
  private static getRegistryURL(registry: string): string {
    switch (registry) {
      case 'gitlab':
        return '$CI_REGISTRY';
      case 'docker-hub':
        return 'docker.io';
      case 'ecr':
        return '$AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com';
      case 'acr':
        return '$AZURE_REGISTRY_NAME.azurecr.io';
      case 'gcr':
        return 'gcr.io/$GCP_PROJECT_ID';
      default:
        return '$CI_REGISTRY';
    }
  }

  /**
   * Generate deploy job
   */
  private static generateDeployJob(target: string): string {
    switch (target) {
      case 'eks':
        return `
# Deploy to AWS EKS
deploy:
  stage: deploy
  image: amazon/aws-cli:latest
  before_script:
    - curl -LO "https://dl.k8s.io/release/\$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/linux/amd64/kubectl"
    - chmod +x kubectl
    - mv kubectl /usr/local/bin/
    - aws eks update-kubeconfig --name \${EKS_CLUSTER_NAME} --region \${AWS_REGION}
  script:
    - kubectl set image deployment/\${CI_PROJECT_NAME} \${CI_PROJECT_NAME}=\${IMAGE_NAME}:\${CI_COMMIT_SHORT_SHA}
    - kubectl rollout status deployment/\${CI_PROJECT_NAME}
  environment:
    name: production
    url: https://\${CI_PROJECT_NAME}.example.com
  only:
    - main
`;

      case 'aks':
        return `
# Deploy to Azure AKS
deploy:
  stage: deploy
  image: mcr.microsoft.com/azure-cli:latest
  before_script:
    - curl -LO "https://dl.k8s.io/release/\$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/linux/amd64/kubectl"
    - chmod +x kubectl
    - mv kubectl /usr/local/bin/
    - az login --service-principal -u \${AZURE_CLIENT_ID} -p \${AZURE_CLIENT_SECRET} --tenant \${AZURE_TENANT_ID}
    - az aks get-credentials --resource-group \${AKS_RESOURCE_GROUP} --name \${AKS_CLUSTER_NAME}
  script:
    - kubectl set image deployment/\${CI_PROJECT_NAME} \${CI_PROJECT_NAME}=\${IMAGE_NAME}:\${CI_COMMIT_SHORT_SHA}
    - kubectl rollout status deployment/\${CI_PROJECT_NAME}
  environment:
    name: production
    url: https://\${CI_PROJECT_NAME}.example.com
  only:
    - main
`;

      case 'gke':
        return `
# Deploy to Google GKE
deploy:
  stage: deploy
  image: google/cloud-sdk:alpine
  before_script:
    - echo \${GCP_SERVICE_KEY} | gcloud auth activate-service-account --key-file=-
    - gcloud config set project \${GCP_PROJECT_ID}
    - gcloud container clusters get-credentials \${GKE_CLUSTER_NAME} --region \${GCP_REGION}
  script:
    - kubectl set image deployment/\${CI_PROJECT_NAME} \${CI_PROJECT_NAME}=\${IMAGE_NAME}:\${CI_COMMIT_SHORT_SHA}
    - kubectl rollout status deployment/\${CI_PROJECT_NAME}
  environment:
    name: production
    url: https://\${CI_PROJECT_NAME}.example.com
  only:
    - main
`;

      default:
        return '';
    }
  }

  /**
   * Generate pipeline with Helm deployment
   */
  static generateWithHelm(options: GitLabCIOptions & { chartPath: string; valuesFile: string }): string {
    const basePipeline = this.generate(options);
    const helmDeployJob = `
# Deploy with Helm
deploy:
  stage: deploy
  image: alpine/helm:latest
  before_script:
    - curl -LO "https://dl.k8s.io/release/\$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/linux/amd64/kubectl"
    - chmod +x kubectl
    - mv kubectl /usr/local/bin/
  script:
    - helm upgrade --install \${CI_PROJECT_NAME} ${options.chartPath} \\
        --values ${options.valuesFile} \\
        --set image.tag=\${CI_COMMIT_SHORT_SHA} \\
        --wait --timeout 10m
  environment:
    name: production
  only:
    - main
`;

    return basePipeline + helmDeployJob;
  }

  /**
   * Generate multi-environment pipeline
   */
  static generateMultiEnvironment(options: GitLabCIOptions): string {
    const { appName } = options;

    return `# GitLab CI/CD Multi-Environment Pipeline

stages:
  - build
  - test
  - deploy_staging
  - deploy_production

variables:
  DOCKER_DRIVER: overlay2
  REGISTRY: \${CI_REGISTRY}
  IMAGE_NAME: \${REGISTRY}/\${CI_PROJECT_PATH}

# Build stage
build:
  stage: build
  image: docker:24-dind
  services:
    - docker:24-dind
  script:
    - docker build -t \${IMAGE_NAME}:\${CI_COMMIT_SHORT_SHA} .
    - docker push \${IMAGE_NAME}:\${CI_COMMIT_SHORT_SHA}

# Test stage
test:
  stage: test
  image: node:20-alpine
  script:
    - npm install -g pnpm@9
    - pnpm install --frozen-lockfile
    - pnpm test:coverage

# Deploy to staging
deploy_staging:
  stage: deploy_staging
  script:
    - kubectl config use-context staging
    - kubectl set image deployment/${appName} ${appName}=\${IMAGE_NAME}:\${CI_COMMIT_SHORT_SHA}
  environment:
    name: staging
    url: https://staging-${appName}.example.com
  only:
    - develop

# Deploy to production
deploy_production:
  stage: deploy_production
  script:
    - kubectl config use-context production
    - kubectl set image deployment/${appName} ${appName}=\${IMAGE_NAME}:\${CI_COMMIT_SHORT_SHA}
  environment:
    name: production
    url: https://${appName}.example.com
  when: manual
  only:
    - main
`;
  }
}
