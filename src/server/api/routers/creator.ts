import {
  getCreatorPublicStats,
  getPublicFilterHierarchyForAuthor,
} from "@/data/creator-public";
import {
  clerkUserToAuthorDisplay,
  clerkUserToBadges,
} from "@/utils/enrich-filter";
import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { getClientIp } from "@/lib/client-ip";
import { findClerkUserByUsername } from "@/lib/public-creator";
import { checkRateLimit } from "@/lib/rate-limit";

import { createTRPCRouter, publicProcedure } from "../trpc";

export const creatorRouter = createTRPCRouter({
  getPublicProfile: publicProcedure
    .input(
      z.object({
        username: z.string().min(1).max(256),
      }),
    )
    .query(async ({ ctx, input }) => {
      const clientIp = getClientIp(ctx.headers);

      const allowed = await checkRateLimit(
        { prefix: "rl:creator-profile", tokens: 120, window: "1m" },
        clientIp,
      );
      if (!allowed) {
        throw new TRPCError({
          code: "TOO_MANY_REQUESTS",
          message: "Too many requests. Try again shortly.",
        });
      }

      const user = await findClerkUserByUsername(input.username);
      if (!user?.username) {
        throw new TRPCError({ code: "NOT_FOUND", message: "User not found" });
      }

      const clerkUserId = user.id;
      const [stats, hierarchy] = await Promise.all([
        getCreatorPublicStats(clerkUserId),
        getPublicFilterHierarchyForAuthor(clerkUserId),
      ]);

      return {
        clerkUserId,
        username: user.username,
        displayName: clerkUserToAuthorDisplay(user),
        imageUrl: user.imageUrl,
        createdAt: user.createdAt,
        badges: clerkUserToBadges(user),
        stats,
        hierarchy,
      };
    }),
});
