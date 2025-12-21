import { reassignSharedFiltersToToken } from "@/data/sharedFilters";
import {
  createShareToken,
  findShareToken,
  findTokenRevocationStatus,
  revokeShareToken,
} from "@/data/shareTokens";
import { db } from "@/db";
import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { createTRPCRouter, protectedProcedure, publicProcedure } from "../trpc";

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

  validate: publicProcedure
    .input(
      z.object({
        token: z.string(),
      }),
    )
    .query(async ({ input }) => {
      try {
        const token = await findTokenRevocationStatus(input.token);

        if (!token) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Token invalid or does not exist",
          });
        }

        if (token.revoked) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Token has been revoked",
          });
        }

        return { valid: true };
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }

        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Please try again or request support on Discord.",
        });
      }
    }),
});
