"server-only";

import { db } from "@/db";
import { and, eq } from "drizzle-orm";

import { shareTokens } from "@/db/schema";

export async function findShareTokenId(userId: string) {
  return await db.query.shareTokens.findFirst({
    where: and(eq(shareTokens.revoked, false), eq(shareTokens.userId, userId)),
    columns: {
      id: true,
    },
  });
}
