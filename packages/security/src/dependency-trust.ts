/**
 * ODAVL Security — Dependency Trust Scorer
 * Risk scoring for npm packages (GitHub-style)
 */

export interface TrustScore {
  package: string;
  score: number; // 0-100
  factors: {
    maintainers: number;
    downloads: number;
    age: number;
    vulnerabilities: number;
  };
  recommendation: 'trusted' | 'review' | 'risky';
}

export class DependencyTrust {
  /**
   * Calculate trust score for a package
   * Stub: Production would call npm API + GitHub API
   */
  async score(packageName: string): Promise<TrustScore> {
    // Stub: Default safe score
    return {
      package: packageName,
      score: 75,
      factors: {
        maintainers: 5,
        downloads: 1000000,
        age: 365,
        vulnerabilities: 0
      },
      recommendation: 'trusted'
    };
  }

  /**
   * Batch score multiple packages
   */
  async scoreAll(packages: string[]): Promise<TrustScore[]> {
    return Promise.all(packages.map(pkg => this.score(pkg)));
  }

  /**
   * Check if package meets minimum trust threshold
   */
  isTrusted(score: TrustScore, threshold: number = 70): boolean {
    return score.score >= threshold;
  }
}
