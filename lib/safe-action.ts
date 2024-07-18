import { auth } from "@clerk/nextjs/server";
import { createServerActionProcedure } from "zsa";

export const authenticatedAction = createServerActionProcedure().handler(() => {
  const { userId } = auth();

  if (!userId) {
    throw new Error("Unauthorized");
  }

  return { userId };
});
