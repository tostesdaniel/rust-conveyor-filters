import { db } from "@/db";
import { notifyFeedbackSubmission } from "@/services/discord-bot";
import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { checkRateLimit } from "@/lib/rate-limit";
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
      const allowed = await checkRateLimit(
        { prefix: "rl:feedback-create", tokens: 5, window: "1d" },
        ctx.userId,
      );
      if (!allowed) {
        throw new TRPCError({
          code: "TOO_MANY_REQUESTS",
          message: "You have sent a lot of feedback today. Try again tomorrow.",
        });
      }

      await db.insert(feedback).values({
        ...input,
        authorId: ctx.userId,
      });

      void notifyFeedbackSubmission({
        ...input,
        authorId: ctx.userId,
      });

      return { success: true };
    }),
});
