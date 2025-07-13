"server-only";

import { db } from "@/db";
import { and, eq } from "drizzle-orm";

import { generateShareToken } from "@/lib/share-token";
import { shareTokens } from "@/db/schema";

export async function createShareToken(userId: string) {
  return await db
    .insert(shareTokens)
    .values({
      userId,
      token: generateShareToken(),
    })
    .onConflictDoNothing()
    .returning();
}

export async function findShareTokenId(userId: string) {
  return await db.query.shareTokens.findFirst({
    where: and(eq(shareTokens.revoked, false), eq(shareTokens.userId, userId)),
    columns: {
      id: true,
    },
  });
}

export async function findShareToken(userId: string) {
  return await db.query.shareTokens.findFirst({
    where: and(eq(shareTokens.userId, userId), eq(shareTokens.revoked, false)),
  });
}

export async function findTokenRevocationStatus(token: string) {
  return await db.query.shareTokens.findFirst({
    where: eq(shareTokens.token, token),
    columns: {
      revoked: true,
    },
  });
}
