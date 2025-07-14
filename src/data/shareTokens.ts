import "server-only";

import { db } from "@/db";
import { generateShareToken } from "@/utils/share-token";
import { and, eq } from "drizzle-orm";

import type { DbTransaction } from "@/types/db-transaction";
import { shareTokens } from "@/db/schema";

/**
 * Creates a new share token for the specified user and inserts it into the database.
 *
 * If a token for the user already exists, the operation does nothing. Optionally supports execution within a database transaction.
 *
 * @param userId - The ID of the user for whom the share token is created
 * @returns The inserted share token record(s), or an empty array if no new record was created
 */
export async function createShareToken(userId: string, tx?: DbTransaction) {
  const dbInstance = tx || db;

  return await dbInstance
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

export async function findShareTokenByToken(token: string) {
  return await db.query.shareTokens.findFirst({
    where: and(eq(shareTokens.token, token), eq(shareTokens.revoked, false)),
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

export async function revokeShareToken(token: string, tx?: DbTransaction) {
  const dbInstance = tx || db;

  await dbInstance
    .update(shareTokens)
    .set({
      revoked: true,
    })
    .where(eq(shareTokens.token, token));
}
