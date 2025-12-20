import { db } from "@/db";
import { z } from "zod";

import { feedback } from "@/db/schema";

import { createTRPCRouter, protectedProcedure } from "../trpc";

export const feedbackRouter = createTRPCRouter({
  create: protectedProcedure
    .input(
      z.object({
        feedback: z.string().min(30).max(255),
        feedbackType: z.enum(["bug", "feature", "general"]),
        rating: z.enum(["1", "2", "3", "4", "5"]),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      await db.insert(feedback).values({
        ...input,
        authorId: ctx.userId,
      });

      return { success: true };
    }),
});
