/**
 * Insight Projects Overview Page
 * Route: /insight/projects
 * 
 * Shows list of user's projects with analysis summaries
 */

import { Suspense } from 'react';
import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { redirect } from 'next/navigation';
import { PlanUpsellBanner, FeatureLimitWarning } from '@/components/PlanUpsellBanner';
import { getInsightPlanForUser } from '@odavl-studio/insight-config/plans';
import { 
  GitBranch, 
  Calendar, 
  AlertCircle, 
  CheckCircle, 
  Clock,
  TrendingUp,
  ExternalLink
} from 'lucide-react';

interface ProjectWithAnalyses {
  id: string;
  name: string;
  gitRemote: string | null;
  gitBranch: string | null;
  language: string | null;
  framework: string | null;
  createdAt: Date;
  updatedAt: Date;
  _count: {
    analyses: number;
  };
  analyses: Array<{
    id: string;
    status: string;
    totalIssues: number;
    critical: number;
    high: number;
    medium: number;
    low: number;
    info: number;
    createdAt: Date;
    finishedAt: Date | null;
  }>;
}

async function getProjects(userId: string): Promise<ProjectWithAnalyses[]> {
  return prisma.project.findMany({
    where: { userId },
    include: {
      _count: {
        select: { analyses: true }
      },
      analyses: {
        take: 1,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          status: true,
          totalIssues: true,
          critical: true,
          high: true,
          medium: true,
          low: true,
          info: true,
          createdAt: true,
          finishedAt: true,
        }
      }
    },
    orderBy: { updatedAt: 'desc' }
  });
}

function ProjectCard({ project }: { project: ProjectWithAnalyses }) {
  const lastAnalysis = project.analyses[0];
  const hasAnalyses = project._count.analyses > 0;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'RUNNING':
        return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'FAILED':
        return 'text-red-600 bg-red-50 border-red-200';
      case 'QUEUED':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'CANCELLED':
        return 'text-gray-600 bg-gray-50 border-gray-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getSeverityColor = (severity: 'critical' | 'high' | 'medium' | 'low') => {
    switch (severity) {
      case 'critical':
        return 'text-red-700 bg-red-100';
      case 'high':
        return 'text-orange-700 bg-orange-100';
      case 'medium':
        return 'text-yellow-700 bg-yellow-100';
      case 'low':
        return 'text-blue-700 bg-blue-100';
    }
  };

  return (
    <Link 
      href={`/insight/projects/${project.id}`}
      className="block bg-white border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-shadow duration-200"
    >
      {/* Project Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="text-xl font-semibold text-gray-900 mb-1">
            {project.name}
          </h3>
          {project.gitRemote && (
            <div className="flex items-center text-sm text-gray-600 gap-2">
              <GitBranch className="w-4 h-4" />
              <span className="font-mono text-xs">{project.gitBranch || 'main'}</span>
              <ExternalLink className="w-3 h-3" />
            </div>
          )}
        </div>
        
        {/* Language/Framework Badge */}
        {(project.language || project.framework) && (
          <span className="px-3 py-1 text-xs font-medium text-blue-700 bg-blue-50 rounded-full">
            {project.framework || project.language}
          </span>
        )}
      </div>

      {/* Analysis Summary */}
      {hasAnalyses && lastAnalysis ? (
        <div className="space-y-3">
          {/* Status */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {lastAnalysis.status === 'COMPLETED' ? (
                <CheckCircle className="w-4 h-4 text-green-600" />
              ) : lastAnalysis.status === 'RUNNING' ? (
                <Clock className="w-4 h-4 text-blue-600 animate-spin" />
              ) : lastAnalysis.status === 'FAILED' ? (
                <AlertCircle className="w-4 h-4 text-red-600" />
              ) : (
                <Clock className="w-4 h-4 text-yellow-600" />
              )}
              <span className={`px-2 py-1 text-xs font-medium rounded border ${getStatusColor(lastAnalysis.status)}`}>
                {lastAnalysis.status}
              </span>
            </div>
            
            <div className="flex items-center text-xs text-gray-500">
              <Calendar className="w-3 h-3 mr-1" />
              {new Date(lastAnalysis.createdAt).toLocaleDateString()}
            </div>
          </div>

          {/* Issue Counts */}
          {lastAnalysis.status === 'COMPLETED' && lastAnalysis.totalIssues > 0 && (
            <div className="flex items-center gap-2 flex-wrap">
              {lastAnalysis.critical > 0 && (
                <span className={`px-2 py-1 text-xs font-semibold rounded ${getSeverityColor('critical')}`}>
                  {lastAnalysis.critical} Critical
                </span>
              )}
              {lastAnalysis.high > 0 && (
                <span className={`px-2 py-1 text-xs font-semibold rounded ${getSeverityColor('high')}`}>
                  {lastAnalysis.high} High
                </span>
              )}
              {lastAnalysis.medium > 0 && (
                <span className={`px-2 py-1 text-xs font-semibold rounded ${getSeverityColor('medium')}`}>
                  {lastAnalysis.medium} Medium
                </span>
              )}
              {lastAnalysis.low > 0 && (
                <span className={`px-2 py-1 text-xs font-semibold rounded ${getSeverityColor('low')}`}>
                  {lastAnalysis.low} Low
                </span>
              )}
            </div>
          )}

          {/* Analysis Count */}
          <div className="flex items-center justify-between text-sm text-gray-600 pt-2 border-t border-gray-100">
            <span>{project._count.analyses} analysis runs</span>
            <TrendingUp className="w-4 h-4" />
          </div>
        </div>
      ) : (
        <div className="text-center py-6 text-gray-500">
          <AlertCircle className="w-8 h-8 mx-auto mb-2 text-gray-400" />
          <p className="text-sm">No analyses yet</p>
          <p className="text-xs mt-1">Run your first analysis to see insights</p>
        </div>
      )}
    </Link>
  );
}

async function ProjectsList() {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id) {
    redirect('/auth/signin');
  }

  const projects = await getProjects(session.user.id);

  if (projects.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-50 mb-4">
          <GitBranch className="w-8 h-8 text-blue-600" />
        </div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          No projects yet
        </h3>
        <p className="text-gray-600 mb-6 max-w-md mx-auto">
          Create your first project to start analyzing your codebase with ODAVL Insight
        </p>
        <Link
          href="/insight/projects/new"
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Create Project
        </Link>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {projects.map((project) => (
        <ProjectCard key={project.id} project={project} />
      ))}
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <div key={i} className="bg-white border border-gray-200 rounded-lg p-6 animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-3/4 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
          <div className="h-20 bg-gray-100 rounded"></div>
        </div>
      ))}
    </div>
  );
}

async function PlanAwareness() {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id) {
    return null;
  }

  // Get user's plan (from session or database)
  // For now, we'll assume it's stored in user record
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { 
      role: true,
      subscription: {
        select: {
          tier: true,
          usedAnalyses: true,
          maxProjects: true,
          currentPeriodStart: true,
          currentPeriodEnd: true
        }
      }
    }
  });

  const subscription = user?.subscription;
  const planTier = subscription?.tier?.toLowerCase() as 'free' | 'pro' | 'team' | 'enterprise' || 'free';

  // Check if user is on FREE plan
  if (planTier === 'free') {
    // Get analysis count for current period
    const analysisCount = subscription?.usedAnalyses || 0;
    const limit = 10; // Free plan limit

    if (analysisCount >= limit) {
      return (
        <PlanUpsellBanner
          currentPlan="free"
          feature="cloud-analysis"
          limitReached={true}
        />
      );
    } else if (analysisCount >= limit * 0.8) {
      return (
        <FeatureLimitWarning
          featureName="Cloud Analyses"
          current={analysisCount}
          limit={limit}
          resetDate={subscription?.currentPeriodEnd || undefined}
        />
      );
    }
  }

  return null;
}

export default function InsightProjectsPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Page Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Projects
            </h1>
            <p className="text-gray-600">
              Manage and analyze your codebase projects
            </p>
          </div>
          
          <Link
            href="/insight/projects/new"
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
          >
            <span className="mr-2">+</span>
            New Project
          </Link>
        </div>
      </div>

      {/* Plan Awareness */}
      <Suspense fallback={null}>
        <PlanAwareness />
      </Suspense>

      {/* Projects Grid */}
      <Suspense fallback={<LoadingSkeleton />}>
        <ProjectsList />
      </Suspense>
    </div>
  );
}
