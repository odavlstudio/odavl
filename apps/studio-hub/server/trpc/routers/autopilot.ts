import { z } from 'zod';
import { AutopilotStatus } from '@prisma/client';
import { router, protectedProcedure } from '../trpc';
import { requireOrgAccess } from '../context';

export const autopilotRouter = router({
  /**
   * Get all autopilot runs for organization
   */
  getRuns: protectedProcedure
    .input(
      z.object({
        projectId: z.string().optional(),
        status: z.nativeEnum(AutopilotStatus).optional(),
        limit: z.number().min(1).max(100).default(50),
      })
    )
    .query(async ({ ctx, input }) => {
      const orgId = ctx.user.orgId;
      if (!orgId) {
        throw new Error('User not assigned to organization');
      }

      await requireOrgAccess(ctx, orgId);

      const runs = await ctx.prisma.autopilotRun.findMany({
        where: {
          project: {
            orgId,
            ...(input.projectId && { id: input.projectId }),
          },
          ...(input.status && { status: input.status }),
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
          edits: true,
        },
      });

      return runs;
    }),

  /**
   * Get single run details with full edit history
   */
  getRun: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const orgId = ctx.user.orgId;
      if (!orgId) {
        throw new Error('User not assigned to organization');
      }

      const run = await ctx.prisma.autopilotRun.findFirst({
        where: {
          id: input.id,
          project: { orgId },
        },
        include: {
          project: true,
          edits: {
            orderBy: { createdAt: 'asc' },
          },
        },
      });

      if (!run) {
        throw new Error('Run not found');
      }

      return run;
    }),

  /**
   * Get run statistics
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

      const [total, byStatus, totalEdits] = await Promise.all([
        ctx.prisma.autopilotRun.count({ where }),
        ctx.prisma.autopilotRun.groupBy({
          by: ['status'],
          where,
          _count: true,
        }),
        ctx.prisma.autopilotEdit.count({
          where: {
            run: { project: where.project },
          },
        }),
      ]);

      return {
        total,
        totalEdits,
        byStatus: byStatus.reduce(
          (acc, item) => {
            acc[item.status] = item._count;
            return acc;
          },
          {} as Record<string, number>
        ),
      };
    }),
});
