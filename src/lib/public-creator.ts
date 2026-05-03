import "server-only";

import { clerkClient, type User } from "@clerk/nextjs/server";

/**
 * Resolve a Clerk user by primary username (exact match).
 */
export async function findClerkUserByUsername(
  username: string,
): Promise<User | null> {
  const client = await clerkClient();
  const list = await client.users.getUserList({ username: [username] });
  return list.data[0] ?? null;
}
