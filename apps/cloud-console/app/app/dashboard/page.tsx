'use client';

import { useProjects, useUsageStats, useMembers } from '@/lib/api-hooks';
import Card, { CardBody } from '@/components/ui/Card';
import { generateMetadata } from '@/components/seo/Metadata';

export const metadata = generateMetadata({
  title: 'Dashboard',
  description: 'View your ODAVL projects, usage statistics, and team activity',
  canonical: '/app/dashboard',
  noindex: true, // Block authenticated page from search engines
});

export default function DashboardPage() {
  const { data: projects, loading: projectsLoading } = useProjects('ACTIVE');
  const { data: usage, loading: usageLoading } = useUsageStats();
  const { data: members, loading: membersLoading } = useMembers();

  const loading = projectsLoading || usageLoading || membersLoading;

  return (
    <div className="px-8 py-6 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">Welcome back! Here's what's happening with your projects.</p>
      </div>

      {loading ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardBody>
                <div className="animate-pulse">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded mb-3 w-24"></div>
                  <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-16"></div>
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
          <Card>
            <CardBody>
              <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Total Projects</h3>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">{projects?.length ?? 0}</p>
            </CardBody>
          </Card>
          <Card>
            <CardBody>
              <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Insight Scans</h3>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">{usage?.analysesUsed ?? 0}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                of {usage?.limits.analyses === -1 ? '∞' : usage?.limits.analyses} this month
              </p>
            </CardBody>
          </Card>
          <Card>
            <CardBody>
              <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Autopilot Runs</h3>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">{usage?.fixesUsed ?? 0}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                of {usage?.limits.fixes === -1 ? '∞' : usage?.limits.fixes} this month
              </p>
            </CardBody>
          </Card>
          <Card>
            <CardBody>
              <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Guardian Tests</h3>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">{usage?.auditsUsed ?? 0}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                of {usage?.limits.audits === -1 ? '∞' : usage?.limits.audits} this month
              </p>
            </CardBody>
          </Card>
        </div>
      )}

      <div className="grid lg:grid-cols-2 gap-5 mb-8">
        <Card>
          <CardBody>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Recent Projects</h2>
          {projectsLoading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="py-3 border-b border-gray-100 dark:border-gray-700 animate-pulse">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                </div>
              ))}
            </div>
          ) : projects && projects.length > 0 ? (
            <div className="space-y-3">
              {projects.slice(0, 5).map((project) => (
                <div key={project.id} className="py-3 border-b border-gray-100 dark:border-gray-700 last:border-0">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900 dark:text-white">{project.name}</h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        {project.language} • {project.branch}
                      </p>
                      <div className="flex items-center gap-4 mt-2 text-xs text-gray-600 dark:text-gray-400">
                        <span>{project._count?.errorSignatures ?? 0} issues</span>
                        <span>{project._count?.fixAttestations ?? 0} fixes</span>
                        <span>{project._count?.auditResults ?? 0} audits</span>
                      </div>
                    </div>
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      project.status === 'ACTIVE' 
                        ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400' 
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300'
                    }`}>
                      {project.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 dark:text-gray-400 text-center py-8">No projects yet. Create your first project to get started.</p>
          )}
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Team Members</h2>
          {membersLoading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="flex items-center gap-3 py-3 border-b border-gray-100 dark:border-gray-700 animate-pulse">
                  <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
                  <div className="flex-1">
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-32 mb-2"></div>
                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-20"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : members && members.length > 0 ? (
            <div className="space-y-3">
              {members.slice(0, 5).map((member) => (
                <div key={member.id} className="flex items-center gap-3 py-3 border-b border-gray-100 dark:border-gray-700 last:border-0">
                  <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center text-blue-600 dark:text-blue-400 font-semibold">
                    {member.user.name?.charAt(0).toUpperCase() ?? member.user.email.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900 dark:text-white">{member.user.name ?? member.user.email}</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{member.role}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 dark:text-gray-400 text-center py-8">No team members yet.</p>
          )}
          </CardBody>
        </Card>
      </div>

      {usage && (
        <Card className="bg-gradient-to-r from-blue-500 to-blue-600 border-none">
          <CardBody>
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-white mb-2">Current Plan: {usage.tier}</h2>
                <p className="text-blue-100 text-sm">
                {usage.status === 'active' 
                  ? `Your subscription renews ${usage.currentPeriodEnd ? new Date(usage.currentPeriodEnd).toLocaleDateString() : 'soon'}`
                  : 'Upgrade to unlock unlimited scans and priority support'}
                </p>
              </div>
              {usage.tier === 'FREE' && (
                <a
                  href="/app/billing"
                  className="bg-white text-blue-600 px-5 py-2 rounded-lg font-semibold hover:bg-blue-50 transition-all duration-200 shadow-sm"
                >
                  Upgrade Now
                </a>
              )}
            </div>
          </CardBody>
        </Card>
      )}
    </div>
  );
}
