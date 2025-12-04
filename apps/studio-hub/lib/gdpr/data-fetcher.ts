/**
 * GDPR Data Fetching Helpers
 *
 * Centralizes data fetching logic for GDPR export and delete operations
 */

import { prisma } from '@/lib/monitoring/database';

export interface UserDataExport {
  user: any;
  organization: any;
  projects: any[];
  apiKeys: any[];
  insightIssues: any[];
  autopilotRuns: any[];
  guardianTests: any[];
  auditLogs: any[];
}

/**
 * Fetch all user data for GDPR export
 */
export async function fetchUserDataForExport(
  userId: string,
  includeDeleted: boolean = false
): Promise<UserDataExport | null> {
  // Fetch user data
  const userData = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      name: true,
      image: true,
      role: true,
      createdAt: true,
      updatedAt: true,
      orgId: true,
      emailVerified: true,
      deletedAt: true,
    },
  });

  if (!userData) {
    return null;
  }

  // Fetch related data in parallel
  const [organization, projects, apiKeys, insightIssues, autopilotRuns, guardianTests, auditLogs] =
    await Promise.all([
      // Organization
      userData.orgId
        ? prisma.organization.findUnique({
            where: { id: userData.orgId },
            select: {
              id: true,
              name: true,
              slug: true,
              plan: true,
              createdAt: true,
            },
          })
        : null,

      // Projects
      prisma.project.findMany({
        where: { orgId: userData.orgId || '' },
        select: {
          id: true,
          name: true,
          slug: true,
          createdAt: true,
        },
      }),

      // API Keys
      prisma.apiKey.findMany({
        where: { orgId: userData.orgId || '' },
        select: {
          id: true,
          name: true,
          lastUsedAt: true,
          createdAt: true,
        },
      }),

      // Insight Issues
      prisma.insightIssue.findMany({
        where: {
          project: {
            orgId: userData.orgId || '',
          },
        },
        select: {
          id: true,
          severity: true,
          message: true,
          filePath: true,
          detector: true,
          createdAt: true,
          resolvedAt: true,
        },
        take: 500,
      }),

      // Autopilot Runs
      prisma.autopilotRun.findMany({
        where: {
          project: {
            orgId: userData.orgId || '',
          },
        },
        select: {
          id: true,
          status: true,
          createdAt: true,
          completedAt: true,
        },
        take: 500,
      }),

      // Guardian Tests
      prisma.guardianTest.findMany({
        where: {
          project: {
            orgId: userData.orgId || '',
          },
        },
        select: {
          id: true,
          url: true,
          status: true,
          createdAt: true,
          completedAt: true,
        },
        take: 500,
      }),

      // Audit Logs
      prisma.auditLog.findMany({
        where: { userId },
        select: {
          id: true,
          action: true,
          metadata: true,
          timestamp: true,
        },
        take: 1000,
      }),
    ]);

  return {
    user: userData,
    organization,
    projects,
    apiKeys,
    insightIssues,
    autopilotRuns,
    guardianTests,
    auditLogs,
  };
}

/**
 * Format user data as CSV
 */
export function formatDataAsCSV(data: UserDataExport): string {
  const sections: string[] = [];

  // User Info
  sections.push('=== USER INFORMATION ===');
  sections.push(`Email,${data.user.email}`);
  sections.push(`Name,${data.user.name || 'N/A'}`);
  sections.push(`Role,${data.user.role}`);
  sections.push(`Created At,${data.user.createdAt.toISOString()}`);
  sections.push('');

  // Organization
  if (data.organization) {
    sections.push('=== ORGANIZATION ===');
    sections.push(`Name,${data.organization.name}`);
    sections.push(`Plan,${data.organization.plan}`);
    sections.push('');
  }

  // Projects
  sections.push('=== PROJECTS ===');
  sections.push('Name,Slug,Created At');
  data.projects.forEach((p) => {
    sections.push(`${p.name},${p.slug},${p.createdAt.toISOString()}`);
  });
  sections.push('');

  // Issues
  sections.push('=== INSIGHT ISSUES ===');
  sections.push('Severity,Message,File,Detector,Created At');
  data.insightIssues.forEach((i) => {
    const msg = i.message.replace(/,/g, ';'); // Escape commas
    sections.push(
      `${i.severity},${msg},${i.filePath},${i.detector},${i.createdAt.toISOString()}`
    );
  });
  sections.push('');

  // Autopilot Runs
  sections.push('=== AUTOPILOT RUNS ===');
  sections.push('Status,Created At,Completed At');
  data.autopilotRuns.forEach((r) => {
    sections.push(
      `${r.status},${r.createdAt.toISOString()},${r.completedAt?.toISOString() || 'N/A'}`
    );
  });
  sections.push('');

  // Guardian Tests
  sections.push('=== GUARDIAN TESTS ===');
  sections.push('URL,Status,Created At');
  data.guardianTests.forEach((t) => {
    sections.push(`${t.url},${t.status},${t.createdAt.toISOString()}`);
  });

  return sections.join('\n');
}

/**
 * Delete all user data (soft delete with grace period)
 */
export async function scheduleUserDataDeletion(
  userId: string,
  gracePeriodDays: number = 30
): Promise<Date> {
  const deletionDate = new Date();
  deletionDate.setDate(deletionDate.getDate() + gracePeriodDays);

  await prisma.user.update({
    where: { id: userId },
    data: {
      deletedAt: deletionDate,
    },
  });

  return deletionDate;
}

/**
 * Cancel scheduled deletion (restore user)
 */
export async function cancelUserDataDeletion(userId: string): Promise<void> {
  await prisma.user.update({
    where: { id: userId },
    data: {
      deletedAt: null,
    },
  });
}

/**
 * Permanently delete user data (after grace period)
 */
export async function permanentlyDeleteUserData(userId: string): Promise<void> {
  // Delete in correct order to respect foreign key constraints
  await prisma.$transaction([
    // Delete audit logs
    prisma.auditLog.deleteMany({ where: { userId } }),

    // Delete user data
    prisma.user.delete({ where: { id: userId } }),
  ]);
}
