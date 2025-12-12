/**
 * @fileoverview Docker multi-architecture build support
 * Enables building images for multiple CPU architectures (amd64, arm64, etc.)
 */

export interface MultiArchBuildOptions {
  imageName: string;
  imageTag: string;
  platforms: ('linux/amd64' | 'linux/arm64' | 'linux/arm/v7')[];
  pushToRegistry?: boolean;
  registryUrl?: string;
  buildxBuilder?: string;
}

export class MultiArchBuilder {
  /**
   * Build multi-architecture Docker image
   */
  static async build(options: MultiArchBuildOptions): Promise<void> {
    const { imageName, imageTag, platforms, pushToRegistry = false, registryUrl, buildxBuilder = 'multiarch' } = options;

    // Create buildx builder if not exists
    await this.ensureBuilder(buildxBuilder);

    // Build for multiple platforms
    await this.buildMultiPlatform(options);
  }

  /**
   * Ensure buildx builder exists
   */
  private static async ensureBuilder(builderName: string): Promise<void> {
    try {
      const { execSync } = await import('child_process');

      // Check if builder exists
      try {
        execSync(`docker buildx inspect ${builderName}`, { stdio: 'ignore' });
        return; // Builder exists
      } catch {
        // Builder doesn't exist, create it
      }

      // Create new builder
      execSync(`docker buildx create --name ${builderName} --use`, {
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'pipe'],
      });

      // Bootstrap builder
      execSync(`docker buildx inspect --bootstrap`, {
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'pipe'],
      });
    } catch (error: unknown) {
      throw new Error(`Failed to create buildx builder: ${error}`);
    }
  }

  /**
   * Build for multiple platforms
   */
  private static async buildMultiPlatform(options: MultiArchBuildOptions): Promise<void> {
    const { imageName, imageTag, platforms, pushToRegistry, registryUrl } = options;

    try {
      const { execSync } = await import('child_process');

      const platformsStr = platforms.join(',');
      const fullImageName = registryUrl ? `${registryUrl}/${imageName}:${imageTag}` : `${imageName}:${imageTag}`;
      const pushFlag = pushToRegistry ? '--push' : '--load';

      const cmd = `docker buildx build --platform ${platformsStr} -t ${fullImageName} ${pushFlag} .`;

      execSync(cmd, {
        encoding: 'utf8',
        stdio: 'inherit',
      });
    } catch (error: unknown) {
      throw new Error(`Multi-arch build failed: ${error}`);
    }
  }

  /**
   * Generate GitHub Actions workflow for multi-arch builds
   */
  static generateGitHubActionsWorkflow(): string {
    return `name: Build Multi-Arch Docker Images

on:
  push:
    branches: [main]
    tags: ['v*']
  pull_request:
    branches: [main]

env:
  REGISTRY: ghcr.io
  IMAGE_NAME: $\{{ github.repository }}

jobs:
  build:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      packages: write

    steps:
      - name: Checkout repository
        uses: actions/checkout@v4

      - name: Set up QEMU
        uses: docker/setup-qemu-action@v3

      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v3

      - name: Log in to Container Registry
        uses: docker/login-action@v3
        with:
          registry: $\{{ env.REGISTRY }}
          username: $\{{ github.actor }}
          password: $\{{ secrets.GITHUB_TOKEN }}

      - name: Extract metadata
        id: meta
        uses: docker/metadata-action@v5
        with:
          images: $\{{ env.REGISTRY }}/$\{{ env.IMAGE_NAME }}
          tags: |
            type=ref,event=branch
            type=ref,event=pr
            type=semver,pattern={{version}}
            type=semver,pattern={{major}}.{{minor}}
            type=sha

      - name: Build and push Docker image
        uses: docker/build-push-action@v5
        with:
          context: .
          platforms: linux/amd64,linux/arm64
          push: $\{{ github.event_name != 'pull_request' }}
          tags: $\{{ steps.meta.outputs.tags }}
          labels: $\{{ steps.meta.outputs.labels }}
          cache-from: type=gha
          cache-to: type=gha,mode=max

      - name: Scan image with Trivy
        uses: aquasecurity/trivy-action@master
        with:
          image-ref: $\{{ env.REGISTRY }}/$\{{ env.IMAGE_NAME }}:$\{{ steps.meta.outputs.version }}
          format: 'sarif'
          output: 'trivy-results.sarif'

      - name: Upload Trivy results to GitHub Security
        uses: github/codeql-action/upload-sarif@v3
        with:
          sarif_file: 'trivy-results.sarif'
`;
  }
}
