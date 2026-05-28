import { db } from "@/db";
import { TRPCError } from "@trpc/server";
import { eq } from "drizzle-orm";
import { z } from "zod";

import { userPreferences } from "@/db/schema";

import { createTRPCRouter, protectedProcedure } from "../trpc";

const uncategorizedPositionSchema = z.enum(["top", "bottom"]);

export const userPreferencesRouter = createTRPCRouter({
  get: protectedProcedure.query(async ({ ctx }) => {
    const row = await db.query.userPreferences.findFirst({
      where: eq(userPreferences.userId, ctx.userId),
    });

    return row ?? { userId: ctx.userId, uncategorizedPosition: "top" as const };
  }),

  update: protectedProcedure
    .input(
      z.object({
        uncategorizedPosition: uncategorizedPositionSchema,
      }),
    )
    .mutation(async ({ ctx, input }) => {
      try {
        await db
          .insert(userPreferences)
          .values({
            userId: ctx.userId,
            uncategorizedPosition: input.uncategorizedPosition,
          })
          .onConflictDoUpdate({
            target: userPreferences.userId,
            set: { uncategorizedPosition: input.uncategorizedPosition },
          });

        return { success: true };
      } catch (error) {
        console.error("Error updating user preferences:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to update preferences",
        });
      }
    }),
});
