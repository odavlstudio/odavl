/**
 * Project Detail Page
 * Route: /insight/projects/:projectId
 * 
 * Shows project overview and list of analyses
 */

import { Suspense } from 'react';
import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { redirect } from 'next/navigation';
import { notFound } from 'next/navigation';
import {
  GitBranch,
  Calendar,
  AlertCircle,
  CheckCircle,
  Clock,
  XCircle,
  Pause,
  TrendingUp,
  TrendingDown,
  Activity,
  Code,
  ExternalLink,
  ArrowLeft
} from 'lucide-react';

interface ProjectDetailProps {
  params: {
    projectId: string;
  };
}

async function getProject(projectId: string, userId: string) {
  const project = await prisma.project.findFirst({
    where: {
      id: projectId,
      userId
    },
    include: {
      analyses: {
        orderBy: { createdAt: 'desc' },
        take: 50, // Show last 50 analyses
        select: {
          id: true,
          status: true,
          progress: true,
          totalIssues: true,
          critical: true,
          high: true,
          medium: true,
          low: true,
          info: true,
          createdAt: true,
          startedAt: true,
          finishedAt: true,
          duration: true,
          error: true
        }
      }
    }
  });

  if (!project) {
    notFound();
  }

  return project;
}

function StatusBadge({ status, progress }: { status: string; progress?: number }) {
  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return {
          icon: CheckCircle,
          text: 'Completed',
          classes: 'text-green-700 bg-green-50 border-green-200'
        };
      case 'RUNNING':
        return {
          icon: Activity,
          text: `Running ${progress !== undefined ? `(${progress}%)` : ''}`,
          classes: 'text-blue-700 bg-blue-50 border-blue-200'
        };
      case 'FAILED':
        return {
          icon: XCircle,
          text: 'Failed',
          classes: 'text-red-700 bg-red-50 border-red-200'
        };
      case 'QUEUED':
        return {
          icon: Clock,
          text: 'Queued',
          classes: 'text-yellow-700 bg-yellow-50 border-yellow-200'
        };
      case 'CANCELLED':
        return {
          icon: Pause,
          text: 'Cancelled',
          classes: 'text-gray-700 bg-gray-50 border-gray-200'
        };
      default:
        return {
          icon: AlertCircle,
          text: status,
          classes: 'text-gray-700 bg-gray-50 border-gray-200'
        };
    }
  };

  const config = getStatusConfig(status);
  const Icon = config.icon;

  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 text-sm font-medium rounded-full border ${config.classes}`}>
      <Icon className="w-4 h-4" />
      {config.text}
    </span>
  );
}

function SeverityBadge({ 
  severity, 
  count 
}: { 
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info'; 
  count: number 
}) {
  if (count === 0) return null;

  const config = {
    critical: 'text-red-700 bg-red-100',
    high: 'text-orange-700 bg-orange-100',
    medium: 'text-yellow-700 bg-yellow-100',
    low: 'text-blue-700 bg-blue-100',
    info: 'text-gray-700 bg-gray-100'
  };

  return (
    <span className={`px-2 py-1 text-xs font-semibold rounded ${config[severity]}`}>
      {count} {severity}
    </span>
  );
}

async function ProjectHeader({ projectId, userId }: { projectId: string; userId: string }) {
  const project = await getProject(projectId, userId);
  
  // Calculate summary stats
  const completedAnalyses = project.analyses.filter(a => a.status === 'COMPLETED');
  const totalIssues = completedAnalyses.reduce((sum, a) => sum + a.totalIssues, 0);
  const avgIssues = completedAnalyses.length > 0 
    ? Math.round(totalIssues / completedAnalyses.length) 
    : 0;

  const lastAnalysis = project.analyses[0];

  return (
    <>
      {/* Back Button */}
      <Link
        href="/insight/projects"
        className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 mb-4"
      >
        <ArrowLeft className="w-4 h-4 mr-1" />
        Back to Projects
      </Link>

      {/* Project Info */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {project.name}
            </h1>
            
            {project.gitRemote && (
              <div className="flex items-center text-sm text-gray-600 gap-2 mb-3">
                <GitBranch className="w-4 h-4" />
                <span className="font-mono text-xs">{project.gitBranch || 'main'}</span>
                <a
                  href={project.gitRemote}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800"
                >
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            )}

            <div className="flex items-center gap-3 text-sm text-gray-600">
              {project.language && (
                <span className="flex items-center gap-1">
                  <Code className="w-4 h-4" />
                  {project.language}
                </span>
              )}
              {project.framework && (
                <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded">
                  {project.framework}
                </span>
              )}
            </div>
          </div>

          <Link
            href={`/api/insight/analysis?projectId=${project.id}`}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
          >
            Run New Analysis
          </Link>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-4 border-t border-gray-200">
          <div>
            <p className="text-sm text-gray-600 mb-1">Total Analyses</p>
            <p className="text-2xl font-bold text-gray-900">{project.analyses.length}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600 mb-1">Completed</p>
            <p className="text-2xl font-bold text-green-600">{completedAnalyses.length}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600 mb-1">Avg Issues</p>
            <p className="text-2xl font-bold text-gray-900">{avgIssues}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600 mb-1">Last Analysis</p>
            <div className="flex items-center gap-2">
              {lastAnalysis && <StatusBadge status={lastAnalysis.status} progress={lastAnalysis.progress} />}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

async function AnalysesList({ projectId, userId }: { projectId: string; userId: string }) {
  const project = await getProject(projectId, userId);

  if (project.analyses.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
        <Activity className="w-12 h-12 mx-auto text-gray-400 mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          No analyses yet
        </h3>
        <p className="text-gray-600 mb-6">
          Run your first analysis to start detecting issues in your codebase
        </p>
        <Link
          href={`/api/insight/analysis?projectId=${project.id}`}
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Run Analysis
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      {/* Table Header */}
      <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900">Analysis History</h2>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Date
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Issues
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Duration
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {project.analyses.map((analysis) => (
              <tr key={analysis.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center text-sm">
                    <Calendar className="w-4 h-4 text-gray-400 mr-2" />
                    <div>
                      <div className="text-gray-900">
                        {new Date(analysis.createdAt).toLocaleDateString()}
                      </div>
                      <div className="text-gray-500 text-xs">
                        {new Date(analysis.createdAt).toLocaleTimeString()}
                      </div>
                    </div>
                  </div>
                </td>

                <td className="px-6 py-4 whitespace-nowrap">
                  <StatusBadge status={analysis.status} progress={analysis.progress} />
                  {analysis.error && (
                    <div className="mt-1 text-xs text-red-600 max-w-xs truncate" title={analysis.error}>
                      {analysis.error}
                    </div>
                  )}
                </td>

                <td className="px-6 py-4 whitespace-nowrap">
                  {analysis.status === 'COMPLETED' ? (
                    <div className="flex items-center gap-2 flex-wrap">
                      <SeverityBadge severity="critical" count={analysis.critical} />
                      <SeverityBadge severity="high" count={analysis.high} />
                      <SeverityBadge severity="medium" count={analysis.medium} />
                      <SeverityBadge severity="low" count={analysis.low} />
                      <SeverityBadge severity="info" count={analysis.info} />
                    </div>
                  ) : (
                    <span className="text-sm text-gray-500">—</span>
                  )}
                </td>

                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {analysis.duration 
                    ? `${(analysis.duration / 1000).toFixed(1)}s`
                    : '—'
                  }
                </td>

                <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                  <Link
                    href={`/insight/analyses/${analysis.id}`}
                    className="text-blue-600 hover:text-blue-800 font-medium"
                  >
                    View Details →
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
        <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
        <div className="grid grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-16 bg-gray-100 rounded"></div>
          ))}
        </div>
      </div>
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="h-16 bg-gray-100 rounded"></div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default async function ProjectDetailPage({ params }: ProjectDetailProps) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id) {
    redirect('/auth/signin');
  }

  const { projectId } = params;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Suspense fallback={<LoadingSkeleton />}>
        <ProjectHeader projectId={projectId} userId={session.user.id} />
        <AnalysesList projectId={projectId} userId={session.user.id} />
      </Suspense>
    </div>
  );
}
