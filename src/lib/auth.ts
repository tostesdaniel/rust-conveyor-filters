import { auth } from "@clerk/nextjs/server";
import { TRPCError } from "@trpc/server";

export async function getAuthenticatedUser() {
  const { userId } = await auth();
  if (!userId) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "Unauthorized",
    });
  }
  return { userId };
}
