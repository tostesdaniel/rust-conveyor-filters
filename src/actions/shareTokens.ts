"use server";

import {
  createShareToken,
  findShareToken,
  findTokenRevocationStatus,
  revokeShareToken,
} from "@/data";
import { pooledDb as txDb } from "@/db/pooled-connection";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { createServerAction, ZSAError } from "zsa";

import { authenticatedProcedure } from "@/lib/safe-action";
import { sharedFilters } from "@/db/schema";

export const createShareTokenAction = authenticatedProcedure
  .createServerAction()
  .handler(async ({ ctx }) => {
    try {
      const [shareToken] = await createShareToken(ctx.userId);

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
      const shareToken = await findShareToken(ctx.userId);

      if (!shareToken) {
        const [newToken, error] = await createShareTokenAction();

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

export const revokeShareTokenAction = authenticatedProcedure
  .createServerAction()
  .handler(async ({ ctx }) => {
    try {
      const existingToken = await findShareToken(ctx.userId);

      if (!existingToken) {
        throw new Error("Share token not found");
      }

      await txDb.transaction(async (tx) => {
        await revokeShareToken(existingToken.token, tx);

        const [newToken] = await createShareToken(ctx.userId, tx);

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
      const token = await findTokenRevocationStatus(input.token);

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
