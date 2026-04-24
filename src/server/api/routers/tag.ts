import { db } from "@/db";
import { categorizeAndStore } from "@/services/ai-categorize";
import { checkUserOwnsFilter } from "@/services/filters";
import { TRPCError } from "@trpc/server";
import { Ratelimit } from "@upstash/ratelimit";
import type { Redis } from "@upstash/redis";
import { asc, desc, eq, sql } from "drizzle-orm";
import { z } from "zod";

import { getRedisClient } from "@/lib/redis";
import { filterTagAssignments, filterTags } from "@/db/schema";

import { createTRPCRouter, protectedProcedure, publicProcedure } from "../trpc";

export const tagRouter = createTRPCRouter({
  listActive: publicProcedure.query(async () => {
    const tagUsage = db
      .select({
        tagId: filterTagAssignments.tagId,
        usageCount: sql<number>`count(*)::int`.as("usage_count"),
      })
      .from(filterTagAssignments)
      .groupBy(filterTagAssignments.tagId)
      .as("tag_usage");

    const rows = await db
      .select({
        slug: filterTags.slug,
        label: filterTags.label,
        description: filterTags.description,
        usageCount: sql<number>`coalesce(${tagUsage.usageCount}, 0)::int`.as(
          "usage_count",
        ),
      })
      .from(filterTags)
      .leftJoin(tagUsage, eq(filterTags.id, tagUsage.tagId))
      .where(eq(filterTags.status, "active"))
      .orderBy(
        desc(sql`coalesce(${tagUsage.usageCount}, 0)`),
        asc(filterTags.sortOrder),
      );

    return rows;
  }),

  requestSuggestion: protectedProcedure
    .input(z.object({ filterId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      if (process.env.AI_CATEGORIZATION_DISABLED === "1") {
        throw new TRPCError({
          code: "SERVICE_UNAVAILABLE",
          message: "AI categorization is currently disabled.",
        });
      }

      const ownsFilter = await checkUserOwnsFilter(input.filterId, ctx.userId);
      if (!ownsFilter) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You do not own this filter.",
        });
      }

      const redis = (await getRedisClient()) as Redis;
      const rateLimit = new Ratelimit({
        redis,
        limiter: Ratelimit.fixedWindow(3, "1d"),
        prefix: "rl:tag-suggest",
      });
      const { success } = await rateLimit.limit(`user:${ctx.userId}`);
      if (!success) {
        throw new TRPCError({
          code: "TOO_MANY_REQUESTS",
          message: "Limit reached. Try again in 24 hours.",
        });
      }

      try {
        const result = await categorizeAndStore({
          filterId: input.filterId,
          allowProposals: false,
        });
        return {
          tags: result.assignedTags,
          provider: result.provider,
        };
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to generate suggestions: ${message}`,
        });
      }
    }),
});
