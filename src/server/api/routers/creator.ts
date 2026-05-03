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

import { findClerkUserByUsername } from "@/lib/public-creator";

import { createTRPCRouter, publicProcedure } from "../trpc";

export const creatorRouter = createTRPCRouter({
  getPublicProfile: publicProcedure
    .input(
      z.object({
        username: z.string().min(1).max(256),
      }),
    )
    .query(async ({ input }) => {
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
