import { headers } from "next/headers";
import { pooledDb as db } from "@/db/pooled-connection";
import { migrateAuthorIdsFlag } from "@/flags";
import { createClerkClient, type WebhookEvent } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";
import { Webhook } from "svix";

import { bookmarks, filters, userCategories } from "@/db/schema";

const devClerkClient = createClerkClient({
  secretKey: process.env.CLERK_DEV_SECRET_KEY,
});

export async function POST(req: Request) {
  if (!migrateAuthorIdsFlag()) {
    return new Response("Not enabled", { status: 400 });
  }

  const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET;

  if (!WEBHOOK_SECRET) {
    throw new Error("WEBHOOK_SECRET is not set");
  }

  const headerPayload = headers();
  const svix_id = headerPayload.get("svix-id");
  const svix_timestamp = headerPayload.get("svix-timestamp");
  const svix_signature = headerPayload.get("svix-signature");

  if (!svix_id || !svix_timestamp || !svix_signature) {
    return new Response("Error occured -- no svix headers", { status: 400 });
  }

  const payload = await req.json();
  const body = JSON.stringify(payload);

  const wh = new Webhook(WEBHOOK_SECRET);

  let evt: WebhookEvent;

  try {
    evt = wh.verify(body, {
      "svix-id": svix_id,
      "svix-timestamp": svix_timestamp,
      "svix-signature": svix_signature,
    }) as WebhookEvent;
  } catch (err) {
    console.error("Error verifying webhook", err);
    return new Response("Error occured", { status: 400 });
  }

  if (evt.type === "user.created") {
    const { id, email_addresses } = evt.data;
    const newUserEmail = email_addresses[0].email_address;

    try {
      const devUsers = await devClerkClient.users.getUserList({
        emailAddress: [newUserEmail],
      });
      const userFound = devUsers.data.find(
        (user) => user.emailAddresses[0].emailAddress === newUserEmail,
      );
      if (userFound) {
        await db.transaction(async (tx) => {
          await tx
            .update(filters)
            .set({
              authorId: id,
            })
            .where(eq(filters.authorId, userFound.id));

          await tx
            .update(userCategories)
            .set({ userId: id })
            .where(eq(userCategories.userId, userFound.id));

          await tx
            .update(bookmarks)
            .set({
              authorId: id,
            })
            .where(eq(bookmarks.authorId, userFound.id));
        });
      }
    } catch (err) {
      console.error("Error processing user:", err);
      return new Response("Error processing user", { status: 500 });
    }

    return new Response("OK", { status: 200 });
  }
}
