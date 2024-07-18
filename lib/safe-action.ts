import { auth } from "@clerk/nextjs/server";
import { z } from "zod";
import { createServerActionProcedure } from "zsa";

import { checkUserOwnsFilter } from "@/lib/queries";

export const authenticatedAction = createServerActionProcedure().handler(() => {
  const { userId } = auth();

  if (!userId) {
    throw new Error("Unauthorized");
  }

  return { userId };
});

export const ownsFilterProcedure = createServerActionProcedure(
  authenticatedAction,
)
  .input(
    z.object({
      filterId: z.number(),
    }),
  )
  .handler(async ({ ctx, input }) => {
    const ownsFilter = await checkUserOwnsFilter(input.filterId, ctx.userId);

    if (!ownsFilter) {
      throw new Error("Unauthorized");
    }

    return { ownsFilter };
  });
