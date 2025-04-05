"use server";

import { db } from "@/db";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { createServerAction, ZSAError } from "zsa";

import { authenticatedProcedure } from "@/lib/safe-action";
import { generateShareToken } from "@/lib/share-token";
import { sharedFilters, shareTokens } from "@/db/schema";

export const createShareToken = authenticatedProcedure
  .createServerAction()
  .handler(async ({ ctx }) => {
    try {
      const [shareToken] = await db
        .insert(shareTokens)
        .values({
          userId: ctx.userId,
          token: generateShareToken(),
        })
        .onConflictDoNothing()
        .returning();

      return {
        token: shareToken.token,
        createdAt: shareToken.createdAt,
      };
    } catch (error) {
      throw new Error("Failed to create share token");
    }
  });

export const getShareToken = authenticatedProcedure
  .createServerAction()
  .handler(async ({ ctx }) => {
    try {
      const shareToken = await db.query.shareTokens.findFirst({
        where: and(
          eq(shareTokens.userId, ctx.userId),
          eq(shareTokens.revoked, false),
        ),
      });

      if (!shareToken) {
        const [newToken, error] = await createShareToken();

        if (error) {
          throw new Error(error.message);
        }

        return newToken;
      }

      return {
        token: shareToken.token,
        createdAt: shareToken.createdAt,
      };
    } catch (error) {
      throw new Error("Failed to get share token");
    }
  });

export const revokeShareToken = authenticatedProcedure
  .createServerAction()
  .handler(async ({ ctx }) => {
    try {
      const existingToken = await db.query.shareTokens.findFirst({
        where: and(
          eq(shareTokens.userId, ctx.userId),
          eq(shareTokens.revoked, false),
        ),
      });

      if (!existingToken) {
        throw new Error("Share token not found");
      }

      await db.transaction(async (tx) => {
        await tx
          .update(shareTokens)
          .set({
            revoked: true,
          })
          .where(eq(shareTokens.token, existingToken.token));

        const [newToken] = await tx
          .insert(shareTokens)
          .values({
            userId: ctx.userId,
            token: generateShareToken(),
          })
          .returning();

        await tx
          .update(sharedFilters)
          .set({
            shareTokenId: newToken.id,
          })
          .where(eq(sharedFilters.shareTokenId, existingToken.id));
      });
    } catch (error) {
      throw new Error("Failed to revoke share token");
    }
  });

export const validateToken = createServerAction()
  .input(
    z.object({
      token: z.string(),
    }),
  )
  .handler(async ({ input }) => {
    try {
      const token = await db.query.shareTokens.findFirst({
        where: eq(shareTokens.token, input.token),
        columns: {
          revoked: true,
        },
      });

      if (!token) {
        throw new ZSAError("NOT_FOUND", "Token invalid or does not exist");
      }

      if (token.revoked) {
        throw new ZSAError("FORBIDDEN", "Token has been revoked");
      }

      return { valid: true };
    } catch (error) {
      if (error instanceof ZSAError) {
        throw error;
      }

      throw new ZSAError(
        "INTERNAL_SERVER_ERROR",
        "Please try again or request support on Discord.",
      );
    }
  });
