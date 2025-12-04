import { z } from 'zod';
import { router, protectedProcedure } from '../trpc';
import { requireOrgAccess } from '../context';

export const organizationRouter = router({
  /**
   * Get current user's organizations
   */
  getOrganizations: protectedProcedure.query(async ({ ctx }) => {
    const orgs = await ctx.prisma.organization.findMany({
      where: {
        users: {
          some: {
            id: ctx.user.id,
          },
        },
      },
      include: {
        _count: {
          select: {
            users: true,
            projects: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return orgs;
  }),

  /**
   * Get organization details
   */
  getOrganization: protectedProcedure
    .input(z.object({ orgId: z.string() }))
    .query(async ({ ctx, input }) => {
      await requireOrgAccess(ctx, input.orgId);

      const org = await ctx.prisma.organization.findUnique({
        where: { id: input.orgId },
        include: {
          users: {
            select: {
              id: true,
              name: true,
              email: true,
              image: true,
              role: true,
            },
          },
          projects: {
            select: {
              id: true,
              name: true,
              slug: true,
              createdAt: true,
            },
            orderBy: { createdAt: 'desc' },
          },
          _count: {
            select: {
              users: true,
              projects: true,
            },
          },
        },
      });

      return org;
    }),

  /**
   * Get organization usage statistics
   */
  getUsage: protectedProcedure
    .input(z.object({ orgId: z.string() }))
    .query(async ({ ctx, input }) => {
      await requireOrgAccess(ctx, input.orgId);

      const [insightCount, autopilotCount, guardianCount] = await Promise.all([
        ctx.prisma.insightIssue.count({
          where: { project: { orgId: input.orgId } },
        }),
        ctx.prisma.autopilotRun.count({
          where: { project: { orgId: input.orgId } },
        }),
        ctx.prisma.guardianTest.count({
          where: { project: { orgId: input.orgId } },
        }),
      ]);

      return {
        insight: insightCount,
        autopilot: autopilotCount,
        guardian: guardianCount,
      };
    }),
});
