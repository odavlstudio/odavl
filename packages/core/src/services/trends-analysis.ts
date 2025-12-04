/**
 * ODAVL Studio - Trends Analysis Service
 * Phase 3.1: Advanced Analytics Dashboard
 * 
 * Provides comprehensive trend analysis across all products:
 * - Error trends over time
 * - Quality improvements
 * - Autopilot success rates
 * - Guardian test performance
 * - Usage patterns
 */

export interface TrendDataPoint {
  timestamp: Date;
  value: number;
  label?: string;
  metadata?: Record<string, any>;
}

export interface TrendAnalysis {
  period: 'hour' | 'day' | 'week' | 'month' | 'quarter' | 'year';
  dataPoints: TrendDataPoint[];
  statistics: {
    average: number;
    median: number;
    min: number;
    max: number;
    change: number; // Percentage change from previous period
    trend: 'up' | 'down' | 'stable';
    volatility: number; // Standard deviation
  };
  forecast?: TrendDataPoint[]; // Predicted future values
}

export interface ErrorTrend {
  projectId: string;
  errorType: string;
  trend: TrendAnalysis;
  resolution: {
    resolvedCount: number;
    unresolvedCount: number;
    avgResolutionTime: number; // in hours
  };
}

export interface QualityTrend {
  projectId: string;
  overallScore: number; // 0-100
  trends: {
    codeComplexity: TrendAnalysis;
    testCoverage: TrendAnalysis;
    securityIssues: TrendAnalysis;
    performance: TrendAnalysis;
    maintainability: TrendAnalysis;
  };
}

export interface AutopilotTrend {
  projectId: string;
  cycles: {
    total: number;
    successful: number;
    failed: number;
    successRate: number; // percentage
  };
  improvements: {
    linesChanged: TrendAnalysis;
    filesModified: TrendAnalysis;
    issuesFixed: TrendAnalysis;
  };
  trustScores: TrendAnalysis;
}

export interface GuardianTrend {
  projectId: string;
  tests: {
    total: number;
    passed: number;
    failed: number;
    passRate: number;
  };
  performance: {
    avgLoadTime: TrendAnalysis;
    avgResponseTime: TrendAnalysis;
    errorRate: TrendAnalysis;
  };
  accessibility: {
    score: TrendAnalysis;
    violations: TrendAnalysis;
  };
}

class TrendsAnalysisService {
  /**
   * Calculate trend statistics from data points
   */
  private calculateStatistics(dataPoints: TrendDataPoint[]): TrendAnalysis['statistics'] {
    const values = dataPoints.map(dp => dp.value);
    
    // Sort for median calculation
    const sortedValues = [...values].sort((a, b) => a - b);
    const median = sortedValues[Math.floor(sortedValues.length / 2)];
    
    // Calculate average
    const average = values.reduce((sum, val) => sum + val, 0) / values.length;
    
    // Calculate standard deviation (volatility)
    const variance = values.reduce((sum, val) => sum + Math.pow(val - average, 2), 0) / values.length;
    const volatility = Math.sqrt(variance);
    
    // Calculate change from first to last period
    const firstValue = values[0] || 0;
    const lastValue = values[values.length - 1] || 0;
    const change = firstValue !== 0 ? ((lastValue - firstValue) / firstValue) * 100 : 0;
    
    // Determine trend direction
    let trend: 'up' | 'down' | 'stable' = 'stable';
    if (Math.abs(change) > 5) { // More than 5% change
      trend = change > 0 ? 'up' : 'down';
    }
    
    return {
      average,
      median,
      min: Math.min(...values),
      max: Math.max(...values),
      change,
      trend,
      volatility
    };
  }

  /**
   * Generate simple forecast using linear regression
   */
  private generateForecast(
    dataPoints: TrendDataPoint[],
    periodsAhead: number = 5
  ): TrendDataPoint[] {
    if (dataPoints.length < 2) return [];
    
    // Simple linear regression
    const n = dataPoints.length;
    const x = dataPoints.map((_, i) => i);
    const y = dataPoints.map(dp => dp.value);
    
    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = y.reduce((a, b) => a + b, 0);
    const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
    const sumX2 = x.reduce((sum, xi) => sum + xi * xi, 0);
    
    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;
    
    // Generate forecast
    const lastTimestamp = dataPoints[dataPoints.length - 1].timestamp;
    const timeInterval = dataPoints.length > 1
      ? dataPoints[1].timestamp.getTime() - dataPoints[0].timestamp.getTime()
      : 24 * 60 * 60 * 1000; // Default to 1 day
    
    return Array.from({ length: periodsAhead }, (_, i) => ({
      timestamp: new Date(lastTimestamp.getTime() + (i + 1) * timeInterval),
      value: Math.max(0, slope * (n + i) + intercept), // Prevent negative forecasts
      label: 'Forecast'
    }));
  }

  /**
   * Analyze error trends for a project
   */
  async getErrorTrends(
    projectId: string,
    period: TrendAnalysis['period'] = 'day',
    startDate?: Date,
    endDate?: Date
  ): Promise<ErrorTrend[]> {
    // TODO: Implement with Prisma
    // Query error logs grouped by type and time period
    
    console.log(`📊 Analyzing error trends for project ${projectId}`);
    
    // Mock implementation
    const mockDataPoints: TrendDataPoint[] = [
      { timestamp: new Date('2025-11-01'), value: 45 },
      { timestamp: new Date('2025-11-08'), value: 38 },
      { timestamp: new Date('2025-11-15'), value: 32 },
      { timestamp: new Date('2025-11-22'), value: 28 },
      { timestamp: new Date('2025-11-29'), value: 22 }
    ];
    
    const trend: TrendAnalysis = {
      period,
      dataPoints: mockDataPoints,
      statistics: this.calculateStatistics(mockDataPoints),
      forecast: this.generateForecast(mockDataPoints, 3)
    };
    
    return [{
      projectId,
      errorType: 'TypeScript',
      trend,
      resolution: {
        resolvedCount: 67,
        unresolvedCount: 22,
        avgResolutionTime: 4.5
      }
    }];
  }

  /**
   * Calculate quality score trends
   */
  async getQualityTrends(
    projectId: string,
    period: TrendAnalysis['period'] = 'week'
  ): Promise<QualityTrend> {
    console.log(`📊 Calculating quality trends for project ${projectId}`);
    
    // Mock data for demonstration
    const complexityData: TrendDataPoint[] = [
      { timestamp: new Date('2025-11-01'), value: 15.2 },
      { timestamp: new Date('2025-11-08'), value: 14.8 },
      { timestamp: new Date('2025-11-15'), value: 14.1 },
      { timestamp: new Date('2025-11-22'), value: 13.5 }
    ];
    
    const coverageData: TrendDataPoint[] = [
      { timestamp: new Date('2025-11-01'), value: 72 },
      { timestamp: new Date('2025-11-08'), value: 75 },
      { timestamp: new Date('2025-11-15'), value: 78 },
      { timestamp: new Date('2025-11-22'), value: 81 }
    ];
    
    const securityData: TrendDataPoint[] = [
      { timestamp: new Date('2025-11-01'), value: 12 },
      { timestamp: new Date('2025-11-08'), value: 9 },
      { timestamp: new Date('2025-11-15'), value: 7 },
      { timestamp: new Date('2025-11-22'), value: 5 }
    ];
    
    return {
      projectId,
      overallScore: 78.5,
      trends: {
        codeComplexity: {
          period,
          dataPoints: complexityData,
          statistics: this.calculateStatistics(complexityData),
          forecast: this.generateForecast(complexityData)
        },
        testCoverage: {
          period,
          dataPoints: coverageData,
          statistics: this.calculateStatistics(coverageData),
          forecast: this.generateForecast(coverageData)
        },
        securityIssues: {
          period,
          dataPoints: securityData,
          statistics: this.calculateStatistics(securityData),
          forecast: this.generateForecast(securityData)
        },
        performance: {
          period,
          dataPoints: [],
          statistics: {
            average: 0,
            median: 0,
            min: 0,
            max: 0,
            change: 0,
            trend: 'stable',
            volatility: 0
          }
        },
        maintainability: {
          period,
          dataPoints: [],
          statistics: {
            average: 0,
            median: 0,
            min: 0,
            max: 0,
            change: 0,
            trend: 'stable',
            volatility: 0
          }
        }
      }
    };
  }

  /**
   * Analyze Autopilot performance trends
   */
  async getAutopilotTrends(
    projectId: string,
    period: TrendAnalysis['period'] = 'day'
  ): Promise<AutopilotTrend> {
    console.log(`🤖 Analyzing Autopilot trends for project ${projectId}`);
    
    const linesChangedData: TrendDataPoint[] = [
      { timestamp: new Date('2025-11-01'), value: 120 },
      { timestamp: new Date('2025-11-08'), value: 145 },
      { timestamp: new Date('2025-11-15'), value: 132 },
      { timestamp: new Date('2025-11-22'), value: 158 }
    ];
    
    const trustScoreData: TrendDataPoint[] = [
      { timestamp: new Date('2025-11-01'), value: 0.72 },
      { timestamp: new Date('2025-11-08'), value: 0.76 },
      { timestamp: new Date('2025-11-15'), value: 0.81 },
      { timestamp: new Date('2025-11-22'), value: 0.85 }
    ];
    
    return {
      projectId,
      cycles: {
        total: 124,
        successful: 107,
        failed: 17,
        successRate: 86.3
      },
      improvements: {
        linesChanged: {
          period,
          dataPoints: linesChangedData,
          statistics: this.calculateStatistics(linesChangedData),
          forecast: this.generateForecast(linesChangedData)
        },
        filesModified: {
          period,
          dataPoints: [],
          statistics: {
            average: 0,
            median: 0,
            min: 0,
            max: 0,
            change: 0,
            trend: 'stable',
            volatility: 0
          }
        },
        issuesFixed: {
          period,
          dataPoints: [],
          statistics: {
            average: 0,
            median: 0,
            min: 0,
            max: 0,
            change: 0,
            trend: 'stable',
            volatility: 0
          }
        }
      },
      trustScores: {
        period,
        dataPoints: trustScoreData,
        statistics: this.calculateStatistics(trustScoreData),
        forecast: this.generateForecast(trustScoreData)
      }
    };
  }

  /**
   * Analyze Guardian test trends
   */
  async getGuardianTrends(
    projectId: string,
    period: TrendAnalysis['period'] = 'day'
  ): Promise<GuardianTrend> {
    console.log(`🛡️ Analyzing Guardian trends for project ${projectId}`);
    
    const loadTimeData: TrendDataPoint[] = [
      { timestamp: new Date('2025-11-01'), value: 2.4 },
      { timestamp: new Date('2025-11-08'), value: 2.2 },
      { timestamp: new Date('2025-11-15'), value: 1.9 },
      { timestamp: new Date('2025-11-22'), value: 1.7 }
    ];
    
    const accessibilityScoreData: TrendDataPoint[] = [
      { timestamp: new Date('2025-11-01'), value: 82 },
      { timestamp: new Date('2025-11-08'), value: 85 },
      { timestamp: new Date('2025-11-15'), value: 88 },
      { timestamp: new Date('2025-11-22'), value: 91 }
    ];
    
    return {
      projectId,
      tests: {
        total: 245,
        passed: 228,
        failed: 17,
        passRate: 93.1
      },
      performance: {
        avgLoadTime: {
          period,
          dataPoints: loadTimeData,
          statistics: this.calculateStatistics(loadTimeData),
          forecast: this.generateForecast(loadTimeData)
        },
        avgResponseTime: {
          period,
          dataPoints: [],
          statistics: {
            average: 0,
            median: 0,
            min: 0,
            max: 0,
            change: 0,
            trend: 'stable',
            volatility: 0
          }
        },
        errorRate: {
          period,
          dataPoints: [],
          statistics: {
            average: 0,
            median: 0,
            min: 0,
            max: 0,
            change: 0,
            trend: 'stable',
            volatility: 0
          }
        }
      },
      accessibility: {
        score: {
          period,
          dataPoints: accessibilityScoreData,
          statistics: this.calculateStatistics(accessibilityScoreData),
          forecast: this.generateForecast(accessibilityScoreData)
        },
        violations: {
          period,
          dataPoints: [],
          statistics: {
            average: 0,
            median: 0,
            min: 0,
            max: 0,
            change: 0,
            trend: 'stable',
            volatility: 0
          }
        }
      }
    };
  }

  /**
   * Get comparative analysis across multiple projects
   */
  async compareProjects(projectIds: string[]): Promise<{
    projects: Array<{
      projectId: string;
      qualityScore: number;
      errorCount: number;
      autopilotSuccessRate: number;
      guardianPassRate: number;
      rank: number;
    }>;
    insights: string[];
  }> {
    console.log(`📊 Comparing ${projectIds.length} projects`);
    
    // Mock comparative data
    const projects = projectIds.map((id, index) => ({
      projectId: id,
      qualityScore: 75 + Math.random() * 20,
      errorCount: Math.floor(Math.random() * 50),
      autopilotSuccessRate: 80 + Math.random() * 15,
      guardianPassRate: 85 + Math.random() * 12,
      rank: index + 1
    }));
    
    // Sort by quality score
    projects.sort((a, b) => b.qualityScore - a.qualityScore);
    projects.forEach((p, i) => p.rank = i + 1);
    
    const insights = [
      `Top performer: ${projects[0].projectId} with quality score ${projects[0].qualityScore.toFixed(1)}`,
      `Average quality score: ${(projects.reduce((sum, p) => sum + p.qualityScore, 0) / projects.length).toFixed(1)}`,
      `${projects.filter(p => p.autopilotSuccessRate > 90).length} projects have >90% Autopilot success rate`
    ];
    
    return { projects, insights };
  }
}

export const trendsAnalysisService = new TrendsAnalysisService();
