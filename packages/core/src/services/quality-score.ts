/**
 * ODAVL Studio - Quality Score Calculator
 * Phase 3.1: Advanced Analytics Dashboard
 * 
 * Calculates comprehensive quality scores based on multiple metrics:
 * - Code complexity
 * - Test coverage
 * - Security vulnerabilities
 * - Performance metrics
 * - Maintainability index
 * - Technical debt ratio
 */

export interface QualityMetrics {
  // Code Quality (0-100)
  codeQuality: {
    score: number;
    complexity: number; // Cyclomatic complexity
    duplication: number; // Percentage
    codeSmells: number;
    maintainabilityIndex: number;
  };
  
  // Testing (0-100)
  testing: {
    score: number;
    coverage: number; // Percentage
    unitTests: number;
    integrationTests: number;
    e2eTests: number;
    testQuality: number; // Assertion density
  };
  
  // Security (0-100)
  security: {
    score: number;
    vulnerabilities: {
      critical: number;
      high: number;
      medium: number;
      low: number;
    };
    securityHotspots: number;
    dependencyIssues: number;
  };
  
  // Performance (0-100)
  performance: {
    score: number;
    buildTime: number; // seconds
    bundleSize: number; // KB
    loadTime: number; // seconds
    memoryUsage: number; // MB
  };
  
  // Documentation (0-100)
  documentation: {
    score: number;
    coverage: number; // Percentage of documented code
    quality: number; // Readability score
    examples: number;
  };
  
  // Automation (0-100)
  automation: {
    score: number;
    autopilotSuccessRate: number;
    cicdIntegration: boolean;
    automatedTests: number;
    deploymentAutomation: boolean;
  };
}

export interface QualityScore {
  overall: number; // 0-100, weighted average
  grade: 'A+' | 'A' | 'B+' | 'B' | 'C+' | 'C' | 'D' | 'F';
  metrics: QualityMetrics;
  weights: {
    codeQuality: number;
    testing: number;
    security: number;
    performance: number;
    documentation: number;
    automation: number;
  };
  recommendations: Array<{
    category: string;
    priority: 'high' | 'medium' | 'low';
    message: string;
    impact: number; // Potential score improvement
  }>;
  history?: Array<{
    timestamp: Date;
    score: number;
    change: number;
  }>;
}

export interface ProjectComparison {
  projectId: string;
  projectName: string;
  score: QualityScore;
  rank: number;
  percentile: number; // Compared to all projects
}

class QualityScoreCalculator {
  // Default weights for different categories
  private readonly DEFAULT_WEIGHTS = {
    codeQuality: 0.25,
    testing: 0.20,
    security: 0.25,
    performance: 0.15,
    documentation: 0.10,
    automation: 0.05
  };

  /**
   * Calculate code quality score
   */
  private calculateCodeQualityScore(metrics: QualityMetrics['codeQuality']): number {
    // Lower complexity is better (normalize to 0-100)
    const complexityScore = Math.max(0, 100 - (metrics.complexity * 2));
    
    // Lower duplication is better
    const duplicationScore = Math.max(0, 100 - metrics.duplication);
    
    // Fewer code smells is better (assume max 50 smells)
    const codeSmellsScore = Math.max(0, 100 - (metrics.codeSmells * 2));
    
    // Maintainability index is already 0-100
    const maintainabilityScore = metrics.maintainabilityIndex;
    
    // Weighted average
    return (
      complexityScore * 0.3 +
      duplicationScore * 0.25 +
      codeSmellsScore * 0.25 +
      maintainabilityScore * 0.2
    );
  }

  /**
   * Calculate testing score
   */
  private calculateTestingScore(metrics: QualityMetrics['testing']): number {
    // Coverage is straightforward
    const coverageScore = metrics.coverage;
    
    // Test count score (assume good project has 100+ tests)
    const totalTests = metrics.unitTests + metrics.integrationTests + metrics.e2eTests;
    const testCountScore = Math.min(100, (totalTests / 100) * 100);
    
    // Test quality (assertion density)
    const testQualityScore = metrics.testQuality;
    
    // Weighted average
    return (
      coverageScore * 0.5 +
      testCountScore * 0.3 +
      testQualityScore * 0.2
    );
  }

  /**
   * Calculate security score
   */
  private calculateSecurityScore(metrics: QualityMetrics['security']): number {
    const vulns = metrics.vulnerabilities;
    
    // Calculate penalty based on vulnerability severity
    const penalty = (
      vulns.critical * 20 +
      vulns.high * 10 +
      vulns.medium * 5 +
      vulns.low * 1 +
      metrics.securityHotspots * 3 +
      metrics.dependencyIssues * 2
    );
    
    // Start from 100 and subtract penalties
    return Math.max(0, 100 - penalty);
  }

  /**
   * Calculate performance score
   */
  private calculatePerformanceScore(metrics: QualityMetrics['performance']): number {
    // Build time: <30s = 100, >300s = 0
    const buildTimeScore = Math.max(0, Math.min(100, 100 - ((metrics.buildTime - 30) / 270) * 100));
    
    // Bundle size: <500KB = 100, >5MB = 0
    const bundleSizeScore = Math.max(0, Math.min(100, 100 - ((metrics.bundleSize - 500) / 4500) * 100));
    
    // Load time: <2s = 100, >10s = 0
    const loadTimeScore = Math.max(0, Math.min(100, 100 - ((metrics.loadTime - 2) / 8) * 100));
    
    // Memory usage: <100MB = 100, >1GB = 0
    const memoryScore = Math.max(0, Math.min(100, 100 - ((metrics.memoryUsage - 100) / 900) * 100));
    
    // Weighted average
    return (
      buildTimeScore * 0.2 +
      bundleSizeScore * 0.3 +
      loadTimeScore * 0.3 +
      memoryScore * 0.2
    );
  }

  /**
   * Calculate documentation score
   */
  private calculateDocumentationScore(metrics: QualityMetrics['documentation']): number {
    return (
      metrics.coverage * 0.5 +
      metrics.quality * 0.3 +
      Math.min(100, metrics.examples * 10) * 0.2
    );
  }

  /**
   * Calculate automation score
   */
  private calculateAutomationScore(metrics: QualityMetrics['automation']): number {
    const autopilotScore = metrics.autopilotSuccessRate;
    const cicdScore = metrics.cicdIntegration ? 100 : 0;
    const automatedTestsScore = Math.min(100, (metrics.automatedTests / 50) * 100);
    const deploymentScore = metrics.deploymentAutomation ? 100 : 0;
    
    return (
      autopilotScore * 0.4 +
      cicdScore * 0.2 +
      automatedTestsScore * 0.2 +
      deploymentScore * 0.2
    );
  }

  /**
   * Assign grade based on score
   */
  private assignGrade(score: number): QualityScore['grade'] {
    if (score >= 97) return 'A+';
    if (score >= 93) return 'A';
    if (score >= 87) return 'B+';
    if (score >= 83) return 'B';
    if (score >= 77) return 'C+';
    if (score >= 73) return 'C';
    if (score >= 60) return 'D';
    return 'F';
  }

  /**
   * Generate recommendations for improvement
   */
  private generateRecommendations(metrics: QualityMetrics): QualityScore['recommendations'] {
    const recommendations: QualityScore['recommendations'] = [];
    
    // Code quality recommendations
    if (metrics.codeQuality.complexity > 15) {
      recommendations.push({
        category: 'Code Quality',
        priority: 'high',
        message: 'High code complexity detected. Consider refactoring complex functions.',
        impact: 5
      });
    }
    
    if (metrics.codeQuality.duplication > 10) {
      recommendations.push({
        category: 'Code Quality',
        priority: 'medium',
        message: 'Code duplication above 10%. Extract common logic into shared utilities.',
        impact: 3
      });
    }
    
    // Testing recommendations
    if (metrics.testing.coverage < 80) {
      recommendations.push({
        category: 'Testing',
        priority: 'high',
        message: 'Test coverage below 80%. Add unit tests for critical paths.',
        impact: 8
      });
    }
    
    if (metrics.testing.e2eTests === 0) {
      recommendations.push({
        category: 'Testing',
        priority: 'medium',
        message: 'No end-to-end tests found. Add E2E tests for critical user flows.',
        impact: 4
      });
    }
    
    // Security recommendations
    if (metrics.security.vulnerabilities.critical > 0) {
      recommendations.push({
        category: 'Security',
        priority: 'high',
        message: `${metrics.security.vulnerabilities.critical} critical vulnerabilities found. Fix immediately!`,
        impact: 15
      });
    }
    
    if (metrics.security.vulnerabilities.high > 0) {
      recommendations.push({
        category: 'Security',
        priority: 'high',
        message: `${metrics.security.vulnerabilities.high} high-severity vulnerabilities. Update dependencies.`,
        impact: 10
      });
    }
    
    // Performance recommendations
    if (metrics.performance.bundleSize > 2000) {
      recommendations.push({
        category: 'Performance',
        priority: 'medium',
        message: 'Large bundle size (>2MB). Use code splitting and lazy loading.',
        impact: 6
      });
    }
    
    if (metrics.performance.loadTime > 5) {
      recommendations.push({
        category: 'Performance',
        priority: 'high',
        message: 'Slow load time (>5s). Optimize assets and enable caching.',
        impact: 7
      });
    }
    
    // Documentation recommendations
    if (metrics.documentation.coverage < 60) {
      recommendations.push({
        category: 'Documentation',
        priority: 'low',
        message: 'Low documentation coverage. Add JSDoc comments to public APIs.',
        impact: 2
      });
    }
    
    // Automation recommendations
    if (!metrics.automation.cicdIntegration) {
      recommendations.push({
        category: 'Automation',
        priority: 'medium',
        message: 'No CI/CD integration detected. Set up automated testing and deployment.',
        impact: 5
      });
    }
    
    if (metrics.automation.autopilotSuccessRate < 70) {
      recommendations.push({
        category: 'Automation',
        priority: 'low',
        message: 'Low Autopilot success rate. Review failed cycles and adjust recipes.',
        impact: 3
      });
    }
    
    // Sort by priority and impact
    return recommendations.sort((a, b) => {
      const priorityWeight = { high: 3, medium: 2, low: 1 };
      const priorityDiff = priorityWeight[b.priority] - priorityWeight[a.priority];
      return priorityDiff !== 0 ? priorityDiff : b.impact - a.impact;
    });
  }

  /**
   * Calculate overall quality score for a project
   */
  async calculateQualityScore(
    projectId: string,
    metrics: QualityMetrics,
    customWeights?: Partial<QualityScore['weights']>
  ): Promise<QualityScore> {
    console.log(`🎯 Calculating quality score for project ${projectId}`);
    
    // Merge custom weights with defaults
    const weights = { ...this.DEFAULT_WEIGHTS, ...customWeights };
    
    // Calculate individual scores
    const codeQualityScore = this.calculateCodeQualityScore(metrics.codeQuality);
    const testingScore = this.calculateTestingScore(metrics.testing);
    const securityScore = this.calculateSecurityScore(metrics.security);
    const performanceScore = this.calculatePerformanceScore(metrics.performance);
    const documentationScore = this.calculateDocumentationScore(metrics.documentation);
    const automationScore = this.calculateAutomationScore(metrics.automation);
    
    // Update metrics with calculated scores
    metrics.codeQuality.score = codeQualityScore;
    metrics.testing.score = testingScore;
    metrics.security.score = securityScore;
    metrics.performance.score = performanceScore;
    metrics.documentation.score = documentationScore;
    metrics.automation.score = automationScore;
    
    // Calculate weighted overall score
    const overall = (
      codeQualityScore * weights.codeQuality +
      testingScore * weights.testing +
      securityScore * weights.security +
      performanceScore * weights.performance +
      documentationScore * weights.documentation +
      automationScore * weights.automation
    );
    
    const grade = this.assignGrade(overall);
    const recommendations = this.generateRecommendations(metrics);
    
    return {
      overall,
      grade,
      metrics,
      weights,
      recommendations
    };
  }

  /**
   * Compare quality scores across multiple projects
   */
  async compareProjects(
    projects: Array<{ projectId: string; projectName: string; metrics: QualityMetrics }>
  ): Promise<ProjectComparison[]> {
    console.log(`📊 Comparing ${projects.length} projects`);
    
    // Calculate scores for all projects
    const scoredProjects = await Promise.all(
      projects.map(async (project) => {
        const score = await this.calculateQualityScore(project.projectId, project.metrics);
        return {
          projectId: project.projectId,
          projectName: project.projectName,
          score,
          rank: 0,
          percentile: 0
        };
      })
    );
    
    // Sort by overall score
    scoredProjects.sort((a, b) => b.score.overall - a.score.overall);
    
    // Assign ranks and percentiles
    scoredProjects.forEach((project, index) => {
      project.rank = index + 1;
      project.percentile = ((scoredProjects.length - index) / scoredProjects.length) * 100;
    });
    
    return scoredProjects;
  }

  /**
   * Get quality score history for a project
   */
  async getScoreHistory(
    projectId: string,
    days: number = 30
  ): Promise<Array<{ timestamp: Date; score: number; change: number }>> {
    console.log(`📈 Fetching ${days}-day quality score history for project ${projectId}`);
    
    // TODO: Implement with Prisma
    // Query historical quality scores from database
    
    // Mock data for demonstration
    const history: Array<{ timestamp: Date; score: number; change: number }> = [];
    const baseScore = 75;
    
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      
      const randomChange = (Math.random() - 0.5) * 4; // ±2 points
      const score = baseScore + (days - i) * 0.15 + randomChange;
      const change = i === days - 1 ? 0 : score - history[history.length - 1].score;
      
      history.push({
        timestamp: date,
        score: Math.min(100, Math.max(0, score)),
        change
      });
    }
    
    return history;
  }

  /**
   * Calculate technical debt ratio
   */
  calculateTechnicalDebt(metrics: QualityMetrics): {
    ratio: number; // Minutes of debt per line of code
    totalDebt: number; // Total minutes
    categories: {
      complexity: number;
      duplication: number;
      security: number;
      testing: number;
    };
  } {
    // Estimate debt in minutes
    const complexityDebt = metrics.codeQuality.complexity * 5;
    const duplicationDebt = metrics.codeQuality.duplication * 10;
    const securityDebt = (
      metrics.security.vulnerabilities.critical * 120 +
      metrics.security.vulnerabilities.high * 60 +
      metrics.security.vulnerabilities.medium * 30 +
      metrics.security.vulnerabilities.low * 10
    );
    const testingDebt = Math.max(0, (80 - metrics.testing.coverage) * 2);
    
    const totalDebt = complexityDebt + duplicationDebt + securityDebt + testingDebt;
    
    return {
      ratio: totalDebt / 1000, // Assume 1000 LOC
      totalDebt,
      categories: {
        complexity: complexityDebt,
        duplication: duplicationDebt,
        security: securityDebt,
        testing: testingDebt
      }
    };
  }
}

export const qualityScoreCalculator = new QualityScoreCalculator();
