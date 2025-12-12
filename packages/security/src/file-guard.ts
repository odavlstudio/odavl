/**
 * ODAVL Security — File Guard
 * Protect critical paths from automated modifications
 */

import micromatch from 'micromatch';

export class FileGuard {
  private protectedPatterns: string[] = [
    'security/**',
    'auth/**',
    '**/*.spec.*',
    '**/*.test.*',
    'public-api/**',
    '.github/workflows/**'
  ];

  /**
   * Check if file path is protected
   */
  isProtected(filePath: string): boolean {
    return micromatch.isMatch(filePath, this.protectedPatterns);
  }

  /**
   * Add custom protected pattern
   */
  addPattern(pattern: string): void {
    this.protectedPatterns.push(pattern);
  }

  /**
   * Validate file changes against protection rules
   */
  validate(filePaths: string[]): { allowed: string[]; blocked: string[] } {
    const allowed: string[] = [];
    const blocked: string[] = [];

    for (const path of filePaths) {
      if (this.isProtected(path)) {
        blocked.push(path);
      } else {
        allowed.push(path);
      }
    }

    return { allowed, blocked };
  }
}
