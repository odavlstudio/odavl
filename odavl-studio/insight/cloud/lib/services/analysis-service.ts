/**
 * Analysis Job Service
 * Handles creation, execution, and status tracking of analysis jobs
 */

import { PrismaClient, AnalysisStatus, IssueSeverity } from '@prisma/client';
import type { OdavlSession } from '@odavl-studio/auth/odavl-id';

const prisma = new PrismaClient();

export interface CreateAnalysisParams {
  projectId: string;
  userId: string;
  detectors: string[];
  language?: string;
  path?: string;
}

export interface AnalysisResult {
  id: string;
  status: AnalysisStatus;
  progress: number;
  totalIssues: number;
  severity: {
    critical: number;
    high: number;
    medium: number;
    low: number;
    info: number;
  };
  startedAt?: Date;
  finishedAt?: Date;
  duration?: number;
  error?: string;
}

export interface IssueInput {
  filePath: string;
  line: number;
  column?: number;
  endLine?: number;
  endColumn?: number;
  severity: IssueSeverity;
  detector: string;
  message: string;
  ruleId?: string;
  category?: string;
  code?: string;
  pattern?: string;
  suggestion?: string;
  autoFixable?: boolean;
  confidence?: number;
  metadata?: Record<string, any>;
}

/**
 * Create a new analysis job
 */
export async function createAnalysis(params: CreateAnalysisParams): Promise<string> {
  const analysis = await prisma.analysis.create({
    data: {
      projectId: params.projectId,
      userId: params.userId,
      detectors: JSON.stringify(params.detectors),
      language: params.language,
      path: params.path,
      status: AnalysisStatus.QUEUED,
      progress: 0,
    },
  });

  return analysis.id;
}

/**
 * Get analysis by ID
 */
export async function getAnalysis(analysisId: string): Promise<AnalysisResult | null> {
  const analysis = await prisma.analysis.findUnique({
    where: { id: analysisId },
  });

  if (!analysis) {
    return null;
  }

  return {
    id: analysis.id,
    status: analysis.status,
    progress: analysis.progress,
    totalIssues: analysis.totalIssues,
    severity: {
      critical: analysis.critical,
      high: analysis.high,
      medium: analysis.medium,
      low: analysis.low,
      info: analysis.info,
    },
    startedAt: analysis.startedAt || undefined,
    finishedAt: analysis.finishedAt || undefined,
    duration: analysis.duration || undefined,
    error: analysis.error || undefined,
  };
}

/**
 * Get analysis with issues (paginated)
 */
export async function getAnalysisWithIssues(
  analysisId: string,
  page: number = 1,
  limit: number = 50
) {
  const skip = (page - 1) * limit;

  const [analysis, issues, totalIssues] = await Promise.all([
    prisma.analysis.findUnique({
      where: { id: analysisId },
      include: {
        project: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    }),
    prisma.analysisIssue.findMany({
      where: { analysisId },
      skip,
      take: limit,
      orderBy: [
        { severity: 'asc' }, // CRITICAL first (enum order)
        { createdAt: 'asc' },
      ],
    }),
    prisma.analysisIssue.count({
      where: { analysisId },
    }),
  ]);

  if (!analysis) {
    return null;
  }

  return {
    analysis: {
      id: analysis.id,
      status: analysis.status,
      progress: analysis.progress,
      totalIssues: analysis.totalIssues,
      severity: {
        critical: analysis.critical,
        high: analysis.high,
        medium: analysis.medium,
        low: analysis.low,
        info: analysis.info,
      },
      startedAt: analysis.startedAt,
      finishedAt: analysis.finishedAt,
      duration: analysis.duration,
      error: analysis.error,
      project: analysis.project,
    },
    issues: issues.map(issue => ({
      id: issue.id,
      filePath: issue.filePath,
      line: issue.line,
      column: issue.column,
      endLine: issue.endLine,
      endColumn: issue.endColumn,
      severity: issue.severity,
      detector: issue.detector,
      message: issue.message,
      ruleId: issue.ruleId,
      category: issue.category,
      code: issue.code,
      pattern: issue.pattern,
      suggestion: issue.suggestion,
      autoFixable: issue.autoFixable,
      confidence: issue.confidence,
      metadata: issue.metadata ? JSON.parse(issue.metadata) : null,
    })),
    pagination: {
      page,
      limit,
      total: totalIssues,
      totalPages: Math.ceil(totalIssues / limit),
    },
  };
}

/**
 * Update analysis status
 */
export async function updateAnalysisStatus(
  analysisId: string,
  status: AnalysisStatus,
  data?: {
    progress?: number;
    error?: string;
  }
): Promise<void> {
  const updateData: any = {
    status,
    updatedAt: new Date(),
  };

  if (data?.progress !== undefined) {
    updateData.progress = data.progress;
  }

  if (data?.error) {
    updateData.error = data.error;
  }

  if (status === AnalysisStatus.RUNNING && !updateData.startedAt) {
    updateData.startedAt = new Date();
  }

  if (status === AnalysisStatus.COMPLETED || status === AnalysisStatus.FAILED) {
    updateData.finishedAt = new Date();

    // Calculate duration if we have startedAt
    const analysis = await prisma.analysis.findUnique({
      where: { id: analysisId },
      select: { startedAt: true },
    });

    if (analysis?.startedAt) {
      updateData.duration = Date.now() - analysis.startedAt.getTime();
    }
  }

  await prisma.analysis.update({
    where: { id: analysisId },
    data: updateData,
  });
}

/**
 * Add issues to analysis
 */
export async function addAnalysisIssues(
  analysisId: string,
  issues: IssueInput[]
): Promise<void> {
  // Create issues
  await prisma.analysisIssue.createMany({
    data: issues.map(issue => ({
      analysisId,
      filePath: issue.filePath,
      line: issue.line,
      column: issue.column,
      endLine: issue.endLine,
      endColumn: issue.endColumn,
      severity: issue.severity,
      detector: issue.detector,
      message: issue.message,
      ruleId: issue.ruleId,
      category: issue.category,
      code: issue.code,
      pattern: issue.pattern,
      suggestion: issue.suggestion,
      autoFixable: issue.autoFixable || false,
      confidence: issue.confidence,
      metadata: issue.metadata ? JSON.stringify(issue.metadata) : null,
    })),
  });

  // Update summary counts
  const severityCounts = issues.reduce(
    (acc, issue) => {
      acc[issue.severity.toLowerCase() as keyof typeof acc]++;
      return acc;
    },
    { critical: 0, high: 0, medium: 0, low: 0, info: 0 }
  );

  await prisma.analysis.update({
    where: { id: analysisId },
    data: {
      totalIssues: issues.length,
      critical: { increment: severityCounts.critical },
      high: { increment: severityCounts.high },
      medium: { increment: severityCounts.medium },
      low: { increment: severityCounts.low },
      info: { increment: severityCounts.info },
    },
  });
}

/**
 * Check if user owns analysis
 */
export async function userOwnsAnalysis(
  analysisId: string,
  userId: string
): Promise<boolean> {
  const analysis = await prisma.analysis.findFirst({
    where: {
      id: analysisId,
      userId,
    },
  });

  return !!analysis;
}

/**
 * Get user's analyses (paginated)
 */
export async function getUserAnalyses(
  userId: string,
  page: number = 1,
  limit: number = 20
) {
  const skip = (page - 1) * limit;

  const [analyses, total] = await Promise.all([
    prisma.analysis.findMany({
      where: { userId },
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        project: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    }),
    prisma.analysis.count({
      where: { userId },
    }),
  ]);

  return {
    analyses: analyses.map(a => ({
      id: a.id,
      projectId: a.projectId,
      projectName: a.project.name,
      status: a.status,
      progress: a.progress,
      totalIssues: a.totalIssues,
      severity: {
        critical: a.critical,
        high: a.high,
        medium: a.medium,
        low: a.low,
        info: a.info,
      },
      createdAt: a.createdAt,
      finishedAt: a.finishedAt,
    })),
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

/**
 * Get project's analyses (paginated)
 */
export async function getProjectAnalyses(
  projectId: string,
  userId: string,
  page: number = 1,
  limit: number = 20
) {
  const skip = (page - 1) * limit;

  // Verify user owns project
  const project = await prisma.project.findFirst({
    where: {
      id: projectId,
      userId,
    },
  });

  if (!project) {
    throw new Error('Project not found or access denied');
  }

  const [analyses, total] = await Promise.all([
    prisma.analysis.findMany({
      where: { projectId },
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.analysis.count({
      where: { projectId },
    }),
  ]);

  return {
    analyses: analyses.map(a => ({
      id: a.id,
      status: a.status,
      progress: a.progress,
      totalIssues: a.totalIssues,
      severity: {
        critical: a.critical,
        high: a.high,
        medium: a.medium,
        low: a.low,
        info: a.info,
      },
      createdAt: a.createdAt,
      finishedAt: a.finishedAt,
    })),
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}
