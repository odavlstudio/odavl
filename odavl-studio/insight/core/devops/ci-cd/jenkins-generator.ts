/**
 * @fileoverview Jenkins pipeline generator
 * Generates complete Jenkinsfile with declarative pipeline
 */

export interface JenkinsOptions {
  appName: string;
  registry?: 'docker-hub' | 'ecr' | 'acr' | 'gcr';
  deployTarget?: 'eks' | 'aks' | 'gke' | 'none';
  enableSecurity?: boolean;
  enableTesting?: boolean;
  nodeLabel?: string;
}

export class JenkinsGenerator {
  /**
   * Generate complete Jenkinsfile
   */
  static generate(options: JenkinsOptions): string {
    const {
      appName,
      registry = 'docker-hub',
      deployTarget = 'none',
      enableSecurity = true,
      enableTesting = true,
      nodeLabel = 'docker',
    } = options;

    return `// Jenkinsfile for ${appName}

pipeline {
  agent {
    label '${nodeLabel}'
  }

  environment {
    REGISTRY = '${this.getRegistryURL(registry)}'
    IMAGE_NAME = "${appName}"
    DOCKER_CREDENTIALS = credentials('docker-registry')
    GIT_COMMIT_SHORT = sh(returnStdout: true, script: 'git rev-parse --short HEAD').trim()
  }

  stages {
    stage('Checkout') {
      steps {
        checkout scm
      }
    }

    stage('Lint') {
      steps {
        script {
          sh '''
            npm install -g pnpm@9
            pnpm install --frozen-lockfile
            pnpm lint
            pnpm typecheck
          '''
        }
      }
    }
${
  enableTesting
    ? `
    stage('Test') {
      steps {
        script {
          sh '''
            pnpm test:coverage
          '''
        }
      }
      post {
        always {
          junit 'reports/junit.xml'
          publishCoverage adapters: [istanbulCoberturaAdapter('coverage/cobertura-coverage.xml')]
        }
      }
    }
`
    : ''
}
    stage('Build') {
      steps {
        script {
          docker.withRegistry("\${REGISTRY}", 'docker-credentials') {
            def app = docker.build("\${IMAGE_NAME}:\${GIT_COMMIT_SHORT}")
            app.push()
            app.push('latest')
          }
        }
      }
    }
${
  enableSecurity
    ? `
    stage('Security Scan') {
      parallel {
        stage('Trivy Scan') {
          steps {
            script {
              sh '''
                docker run --rm -v /var/run/docker.sock:/var/run/docker.sock \\
                  aquasec/trivy:latest image \\
                  --exit-code 0 \\
                  --severity HIGH,CRITICAL \\
                  --format json \\
                  --output trivy-results.json \\
                  \${IMAGE_NAME}:\${GIT_COMMIT_SHORT}
              '''
            }
          }
          post {
            always {
              archiveArtifacts artifacts: 'trivy-results.json', fingerprint: true
            }
          }
        }

        stage('Snyk Scan') {
          steps {
            snykSecurity(
              snykInstallation: 'snyk',
              snykTokenId: 'snyk-token',
              severity: 'high',
              targetFile: 'package.json'
            )
          }
        }
      }
    }
`
    : ''
}${deployTarget !== 'none' ? this.generateDeployStage(deployTarget) : ''}
  }

  post {
    always {
      cleanWs()
    }
    success {
      echo 'Pipeline succeeded!'
      // Add notification here (Slack, email, etc.)
    }
    failure {
      echo 'Pipeline failed!'
      // Add notification here
    }
  }
}
`;
  }

  /**
   * Get registry URL
   */
  private static getRegistryURL(registry: string): string {
    switch (registry) {
      case 'docker-hub':
        return 'https://index.docker.io/v1/';
      case 'ecr':
        return 'https://${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com';
      case 'acr':
        return 'https://${AZURE_REGISTRY_NAME}.azurecr.io';
      case 'gcr':
        return 'https://gcr.io';
      default:
        return 'https://index.docker.io/v1/';
    }
  }

  /**
   * Generate deploy stage
   */
  private static generateDeployStage(target: string): string {
    switch (target) {
      case 'eks':
        return `
    stage('Deploy to EKS') {
      when {
        branch 'main'
      }
      steps {
        script {
          withAWS(credentials: 'aws-credentials', region: env.AWS_REGION) {
            sh '''
              aws eks update-kubeconfig --name \${EKS_CLUSTER_NAME} --region \${AWS_REGION}
              kubectl set image deployment/\${IMAGE_NAME} \${IMAGE_NAME}=\${REGISTRY}/\${IMAGE_NAME}:\${GIT_COMMIT_SHORT}
              kubectl rollout status deployment/\${IMAGE_NAME}
            '''
          }
        }
      }
    }
`;

      case 'aks':
        return `
    stage('Deploy to AKS') {
      when {
        branch 'main'
      }
      steps {
        script {
          withCredentials([azureServicePrincipal('azure-credentials')]) {
            sh '''
              az login --service-principal -u \${AZURE_CLIENT_ID} -p \${AZURE_CLIENT_SECRET} --tenant \${AZURE_TENANT_ID}
              az aks get-credentials --resource-group \${AKS_RESOURCE_GROUP} --name \${AKS_CLUSTER_NAME}
              kubectl set image deployment/\${IMAGE_NAME} \${IMAGE_NAME}=\${REGISTRY}/\${IMAGE_NAME}:\${GIT_COMMIT_SHORT}
              kubectl rollout status deployment/\${IMAGE_NAME}
            '''
          }
        }
      }
    }
`;

      case 'gke':
        return `
    stage('Deploy to GKE') {
      when {
        branch 'main'
      }
      steps {
        script {
          withCredentials([file(credentialsId: 'gcp-credentials', variable: 'GCP_KEY_FILE')]) {
            sh '''
              gcloud auth activate-service-account --key-file=\${GCP_KEY_FILE}
              gcloud config set project \${GCP_PROJECT_ID}
              gcloud container clusters get-credentials \${GKE_CLUSTER_NAME} --region \${GCP_REGION}
              kubectl set image deployment/\${IMAGE_NAME} \${IMAGE_NAME}=\${REGISTRY}/\${IMAGE_NAME}:\${GIT_COMMIT_SHORT}
              kubectl rollout status deployment/\${IMAGE_NAME}
            '''
          }
        }
      }
    }
`;

      default:
        return '';
    }
  }

  /**
   * Generate multi-branch pipeline
   */
  static generateMultiBranch(options: JenkinsOptions): string {
    const { appName, nodeLabel = 'docker' } = options;

    return `// Multi-branch Jenkinsfile

pipeline {
  agent {
    label '${nodeLabel}'
  }

  environment {
    IMAGE_NAME = "${appName}"
  }

  stages {
    stage('Build') {
      steps {
        script {
          def image = docker.build("\${IMAGE_NAME}:\${BRANCH_NAME}-\${BUILD_NUMBER}")
          image.push()
        }
      }
    }

    stage('Deploy to Dev') {
      when {
        branch 'develop'
      }
      steps {
        sh 'kubectl --context=dev set image deployment/${appName} ${appName}=\${IMAGE_NAME}:develop-\${BUILD_NUMBER}'
      }
    }

    stage('Deploy to Staging') {
      when {
        branch 'staging'
      }
      steps {
        sh 'kubectl --context=staging set image deployment/${appName} ${appName}=\${IMAGE_NAME}:staging-\${BUILD_NUMBER}'
      }
    }

    stage('Deploy to Production') {
      when {
        branch 'main'
      }
      steps {
        input message: 'Deploy to production?', ok: 'Deploy'
        sh 'kubectl --context=production set image deployment/${appName} ${appName}=\${IMAGE_NAME}:main-\${BUILD_NUMBER}'
      }
    }
  }
}
`;
  }

  /**
   * Generate shared library pipeline
   */
  static generateSharedLibrary(appName: string): string {
    return `// Jenkinsfile using shared library

@Library('odavl-pipeline-library') _

pipeline {
  agent any

  stages {
    stage('Build and Deploy') {
      steps {
        script {
          odavlPipeline {
            appName = '${appName}'
            dockerRegistry = 'ghcr.io'
            kubernetesCluster = 'production'
            enableSecurityScan = true
            enableTesting = true
          }
        }
      }
    }
  }
}
`;
  }
}
