import { reassignSharedFiltersToToken } from "@/data/sharedFilters";
import {
  createShareToken,
  findShareToken,
  revokeShareToken,
} from "@/data/shareTokens";
import { db } from "@/db";
import { TRPCError } from "@trpc/server";

import { checkRateLimit } from "@/lib/rate-limit";

import { createTRPCRouter, protectedProcedure } from "../trpc";

export const shareTokenRouter = createTRPCRouter({
  get: protectedProcedure.query(async ({ ctx }) => {
    const shareToken = await findShareToken(ctx.userId);

    if (!shareToken) {
      // Create a new token if one doesn't exist
      const [newToken] = await createShareToken(ctx.userId);
      return {
        token: newToken.token,
        createdAt: newToken.createdAt,
      };
    }

    return {
      token: shareToken.token,
      createdAt: shareToken.createdAt,
    };
  }),

  revoke: protectedProcedure.mutation(async ({ ctx }) => {
    try {
      const existingToken = await findShareToken(ctx.userId);

      if (!existingToken) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Share token not found",
        });
      }

      const allowed = await checkRateLimit(
        { prefix: "rl:share-token-revoke", tokens: 5, window: "1h" },
        ctx.userId,
      );
      if (!allowed) {
        throw new TRPCError({
          code: "TOO_MANY_REQUESTS",
          message: "Too many token revocations. Try again in an hour.",
        });
      }

      await db.transaction(async (tx) => {
        await revokeShareToken(existingToken.token, tx);

        const [newToken] = await createShareToken(ctx.userId, tx);

        await reassignSharedFiltersToToken(
          {
            fromTokenId: existingToken.id,
            toTokenId: newToken.id,
          },
          tx,
        );
      });

      return { success: true };
    } catch (error) {
      if (error instanceof TRPCError) {
        throw error;
      }
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to revoke share token",
      });
    }
  }),
});
