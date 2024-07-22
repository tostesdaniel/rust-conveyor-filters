import { auth } from "@clerk/nextjs/server";

export async function getAuthenticatedUser() {
  const { userId } = auth();
  if (!userId) {
    throw new Error("Unauthorized");
  }
  return { userId };
}
