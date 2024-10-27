"use server";

import { db } from "@/db";
import { eq, sql } from "drizzle-orm";
import { z } from "zod";
import { createServerAction } from "zsa";

import { filterEvents, filters } from "@/db/schema";

export const logFilterEvent = createServerAction()
  .input(
    z.object({
      filterId: z.number(),
      eventType: z.enum(["view", "export"]),
      success: z.boolean(),
      userId: z.string().nullable(),
      ip: z.string().nullable(),
    }),
  )
  .handler(async ({ input }) => {
    const { filterId, eventType, success, userId, ip } = input;

    await db.insert(filterEvents).values({
      filterId,
      eventType,
      userId: userId || null,
      ip: userId ? null : ip,
    });

    if (success) {
      await db
        .update(filters)
        .set({
          [eventType === "view" ? "viewCount" : "exportCount"]: sql`${
            filters[eventType === "view" ? "viewCount" : "exportCount"]
          } + 1`,
          popularityScore: sql`
          GREATEST(0, ${filters.popularityScore}) + 
          ${eventType === "view" ? 1 : 5}
        `,
        })
        .where(eq(filters.id, filterId));
    }

    return { success };
  });
