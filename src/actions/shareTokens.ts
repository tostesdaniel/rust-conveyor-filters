"use server";

import { db } from "@/db";
import { pooledDb } from "@/db/pooled-connection";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { createServerAction } from "zsa";

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

      await pooledDb.transaction(async (tx) => {
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
        throw new Error("Invalid share token");
      }

      if (token.revoked) {
        throw new Error("Share token revoked");
      }

      return { valid: true };
    } catch (error) {
      throw new Error("Failed to validate share token");
    }
  });
