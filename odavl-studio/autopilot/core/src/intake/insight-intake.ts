/**
 * ODAVL Autopilot Insight Intake Module
 * Phase Ω-P3: Real-time ingestion of Insight findings for self-healing
 * 
 * Responsibilities:
 * - Parse Insight detector outputs (P1-P2 detectors)
 * - Normalize issues into AutopilotFixCandidate[]
 * - Assign riskWeight using OMS file taxonomy
 * - Map issues to potential recipes
 */

export interface InsightFinding {
  detector: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  message: string;
  file: string;
  line?: number;
  column?: number;
  code?: string;
  category: ProblemCategory;
}

export type ProblemCategory =
  | 'syntax'
  | 'import'
  | 'build'
  | 'security'
  | 'performance'
  | 'circular'
  | 'isolation'
  | 'network'
  | 'package-drift';

export interface AutopilotFixCandidate {
  id: string;
  finding: InsightFinding;
  riskWeight: number; // 0-1 from OMS file taxonomy
  potentialRecipes: string[]; // Recipe IDs that can fix this
  priority: number; // Higher = more urgent
  estimatedLOC: number; // Expected LOC change
}

export class InsightIntake {
  private omsFileTaxonomy = new Map<string, number>([
    // Security files (highest risk)
    ['security/', 0.9],
    ['auth/', 0.85],
    ['database/', 0.8],
    
    // Core infrastructure
    ['packages/core/', 0.7],
    ['packages/types/', 0.65],
    
    // Tests (lowest risk)
    ['**/*.test.ts', 0.2],
    ['**/*.spec.ts', 0.2],
    
    // Default
    ['**/*', 0.5],
  ]);

  private recipeMappings = new Map<ProblemCategory, string[]>([
    ['syntax', ['fix-typescript-errors', 'fix-eslint-errors']],
    ['import', ['organize-imports', 'fix-unused-imports', 'resolve-import-paths']],
    ['build', ['fix-build-errors', 'update-tsconfig']],
    ['security', ['fix-security-vulnerabilities', 'update-dependencies']],
    ['performance', ['optimize-bundle-size', 'reduce-complexity']],
    ['circular', ['break-circular-dependencies']],
    ['isolation', ['enforce-module-boundaries']],
    ['network', ['optimize-network-requests']],
    ['package-drift', ['update-dependencies', 'fix-package-conflicts']],
  ]);

  /**
   * Parse Insight findings from detector output
   */
  async parseInsightFindings(detectorOutput: any): Promise<InsightFinding[]> {
    const findings: InsightFinding[] = [];

    // Parse different detector formats
    if (Array.isArray(detectorOutput)) {
      for (const item of detectorOutput) {
        findings.push(this.normalizeDetectorItem(item));
      }
    } else if (detectorOutput.issues) {
      for (const issue of detectorOutput.issues) {
        findings.push(this.normalizeDetectorItem(issue));
      }
    }

    return findings;
  }

  /**
   * Convert Insight findings into Autopilot fix candidates
   */
  async createFixCandidates(findings: InsightFinding[]): Promise<AutopilotFixCandidate[]> {
    const candidates: AutopilotFixCandidate[] = [];

    for (let i = 0; i < findings.length; i++) {
      const finding = findings[i];
      const riskWeight = this.calculateRiskWeight(finding.file);
      const potentialRecipes = this.recipeMappings.get(finding.category) || [];
      const priority = this.calculatePriority(finding);
      const estimatedLOC = this.estimateLOCChange(finding);

      candidates.push({
        id: `fix-${i}-${Date.now()}`,
        finding,
        riskWeight,
        potentialRecipes,
        priority,
        estimatedLOC,
      });
    }

    // Sort by priority (descending)
    return candidates.sort((a, b) => b.priority - a.priority);
  }

  /**
   * Calculate risk weight based on file path
   */
  private calculateRiskWeight(filePath: string): number {
    for (const [pattern, weight] of this.omsFileTaxonomy) {
      if (this.matchPattern(filePath, pattern)) {
        return weight;
      }
    }
    return 0.5; // Default
  }

  /**
   * Calculate priority score (0-100)
   */
  private calculatePriority(finding: InsightFinding): number {
    let score = 0;

    // Severity weight (40%)
    const severityScores = { critical: 40, high: 30, medium: 20, low: 10 };
    score += severityScores[finding.severity];

    // Category weight (30%)
    const categoryScores: Record<ProblemCategory, number> = {
      security: 30,
      build: 25,
      syntax: 20,
      import: 15,
      circular: 15,
      'package-drift': 10,
      performance: 10,
      network: 10,
      isolation: 5,
    };
    score += categoryScores[finding.category] || 10;

    // File risk weight (30%)
    score += this.calculateRiskWeight(finding.file) * 30;

    return Math.min(100, Math.round(score));
  }

  /**
   * Estimate LOC change for fix
   */
  private estimateLOCChange(finding: InsightFinding): number {
    const categoryEstimates: Record<ProblemCategory, number> = {
      syntax: 5,
      import: 3,
      build: 10,
      security: 15,
      performance: 20,
      circular: 25,
      isolation: 15,
      network: 10,
      'package-drift': 5,
    };
    return categoryEstimates[finding.category] || 10;
  }

  /**
   * Normalize detector output into standard format
   */
  private normalizeDetectorItem(item: any): InsightFinding {
    return {
      detector: item.detector || item.source || 'unknown',
      severity: this.normalizeSeverity(item.severity || item.level),
      message: item.message || item.description || 'Unknown issue',
      file: item.file || item.filePath || item.path || '',
      line: item.line || item.startLine,
      column: item.column || item.startColumn,
      code: item.code || item.ruleId,
      category: this.inferCategory(item),
    };
  }

  /**
   * Normalize severity levels
   */
  private normalizeSeverity(severity: any): 'critical' | 'high' | 'medium' | 'low' {
    const sev = String(severity).toLowerCase();
    if (sev.includes('critical') || sev === '4') return 'critical';
    if (sev.includes('high') || sev === 'error' || sev === '3') return 'high';
    if (sev.includes('medium') || sev === 'warning' || sev === '2') return 'medium';
    return 'low';
  }

  /**
   * Infer problem category from detector output
   */
  private inferCategory(item: any): ProblemCategory {
    const msg = (item.message || '').toLowerCase();
    const code = (item.code || '').toLowerCase();
    const detector = (item.detector || '').toLowerCase();

    if (detector.includes('security') || msg.includes('vulnerability')) return 'security';
    if (detector.includes('circular') || msg.includes('circular')) return 'circular';
    if (detector.includes('import') || code.includes('import')) return 'import';
    if (detector.includes('build') || msg.includes('build')) return 'build';
    if (detector.includes('performance')) return 'performance';
    if (detector.includes('network')) return 'network';
    if (detector.includes('package')) return 'package-drift';
    if (detector.includes('isolation')) return 'isolation';
    if (msg.includes('syntax') || code.includes('parse')) return 'syntax';

    return 'syntax'; // Default
  }

  /**
   * Simple glob pattern matching
   */
  private matchPattern(path: string, pattern: string): boolean {
    if (pattern === '**/*') return true;
    const regex = new RegExp('^' + pattern.replace(/\*/g, '.*').replace(/\?/g, '.') + '$');
    return regex.test(path);
  }
}
