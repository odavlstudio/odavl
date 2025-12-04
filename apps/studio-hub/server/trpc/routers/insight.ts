import { z } from 'zod';
import { Severity } from '@prisma/client';
import { router, protectedProcedure } from '../trpc';
import { requireOrgAccess } from '../context';

export const insightRouter = router({
  /**
   * Get all issues for current organization
   */
  getIssues: protectedProcedure
    .input(
      z.object({
        projectId: z.string().optional(),
        severity: z.nativeEnum(Severity).optional(),
        limit: z.number().min(1).max(100).default(50),
        cursor: z.string().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const orgId = ctx.user.orgId;
      if (!orgId) {
        throw new Error('User not assigned to organization');
      }

      await requireOrgAccess(ctx, orgId);

      const issues = await ctx.prisma.insightIssue.findMany({
        where: {
          project: {
            orgId,
            ...(input.projectId && { id: input.projectId }),
          },
          ...(input.severity && { severity: input.severity }),
        },
        take: input.limit + 1,
        ...(input.cursor && {
          cursor: { id: input.cursor },
          skip: 1,
        }),
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

      let nextCursor: string | undefined = undefined;
      if (issues.length > input.limit) {
        const nextItem = issues.pop();
        nextCursor = nextItem!.id;
      }

      return {
        issues,
        nextCursor,
      };
    }),

  /**
   * Get issue statistics
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

      const [total, bySeverity] = await Promise.all([
        ctx.prisma.insightIssue.count({ where }),
        ctx.prisma.insightIssue.groupBy({
          by: ['severity'],
          where,
          _count: true,
        }),
      ]);

      return {
        total,
        bySeverity: bySeverity.reduce(
          (acc, item) => {
            acc[item.severity] = item._count;
            return acc;
          },
          {} as Record<string, number>
        ),
      };
    }),

  /**
   * Get single issue details
   */
  getIssue: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const orgId = ctx.user.orgId;
      if (!orgId) {
        throw new Error('User not assigned to organization');
      }

      const issue = await ctx.prisma.insightIssue.findFirst({
        where: {
          id: input.id,
          project: { orgId },
        },
        include: {
          project: true,
        },
      });

      if (!issue) {
        throw new Error('Issue not found');
      }

      return issue;
    }),
});
