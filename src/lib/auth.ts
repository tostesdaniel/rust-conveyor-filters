import { auth } from "@clerk/nextjs/server";
import { ZSAError } from "zsa";

export async function getAuthenticatedUser() {
  const { userId } = auth();
  if (!userId) {
    throw new ZSAError("NOT_AUTHORIZED", "Unauthorized");
  }
  return { userId };
}
