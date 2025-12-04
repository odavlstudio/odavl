import { z } from 'zod';
import { router, protectedProcedure } from '../trpc';
import { requireOrgAccess } from '../context';

export const guardianRouter = router({
  /**
   * Get all tests for organization
   */
  getTests: protectedProcedure
    .input(
      z.object({
        projectId: z.string().optional(),
        limit: z.number().min(1).max(100).default(50),
      })
    )
    .query(async ({ ctx, input }) => {
      const orgId = ctx.user.orgId;
      if (!orgId) {
        throw new Error('User not assigned to organization');
      }

      await requireOrgAccess(ctx, orgId);

      const tests = await ctx.prisma.guardianTest.findMany({
        where: {
          project: {
            orgId,
            ...(input.projectId && { id: input.projectId }),
          },
        },
        take: input.limit,
        orderBy: { createdAt: 'desc' },
        include: {
          project: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
        },
      });

      return tests;
    }),

  /**
   * Get single test details
   */
  getTest: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const orgId = ctx.user.orgId;
      if (!orgId) {
        throw new Error('User not assigned to organization');
      }

      const test = await ctx.prisma.guardianTest.findFirst({
        where: {
          id: input.id,
          project: { orgId },
        },
        include: {
          project: true,
        },
      });

      if (!test) {
        throw new Error('Test not found');
      }

      return test;
    }),

  /**
   * Get test statistics
   */
  getStats: protectedProcedure
    .input(
      z.object({
        projectId: z.string().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const orgId = ctx.user.orgId;
      if (!orgId) {
        throw new Error('User not assigned to organization');
      }

      await requireOrgAccess(ctx, orgId);

      const where = {
        project: {
          orgId,
          ...(input.projectId && { id: input.projectId }),
        },
      };

      const tests = await ctx.prisma.guardianTest.findMany({
        where,
        select: {
          passed: true,
          score: true,
        },
      });

      const total = tests.length;
      const passed = tests.filter((t) => t.passed).length;
      const avgScore =
        tests.reduce((sum, t) => sum + (t.score || 0), 0) / total || 0;

      return {
        total,
        passed,
        failed: total - passed,
        passRate: total > 0 ? (passed / total) * 100 : 0,
        avgScore: Math.round(avgScore),
      };
    }),
});
