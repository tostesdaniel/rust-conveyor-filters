import { checkUserOwnsFilter } from "@/services/filters";
import { z } from "zod";
import { createServerActionProcedure } from "zsa";

import { getAuthenticatedUser } from "@/lib/auth";

export const authenticatedProcedure = createServerActionProcedure().handler(
  async () => {
    return await getAuthenticatedUser();
  },
);

export const ownsFilterProcedure = createServerActionProcedure(
  authenticatedProcedure,
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
