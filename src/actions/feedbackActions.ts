"use server";

import { db } from "@/db";
import { z } from "zod";

import { authenticatedProcedure } from "@/lib/safe-action";
import { feedback } from "@/db/schema";

export const createFeedbackAction = authenticatedProcedure
  .createServerAction()
  .input(
    z.object({
      feedback: z.string().min(30).max(255),
      feedbackType: z.enum(["bug", "feature", "general"]),
      rating: z.enum(["1", "2", "3", "4", "5"]),
    }),
  )
  .handler(async ({ input, ctx }) => {
    const { userId } = ctx;

    await db.insert(feedback).values({
      ...input,
      authorId: userId,
    });
  });
