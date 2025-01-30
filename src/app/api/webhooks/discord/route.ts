import { headers } from "next/headers";
import { updateUserCountChannel } from "@/services/discord-bot";
import type { WebhookEvent } from "@clerk/nextjs/server";
import { Webhook } from "svix";

export async function POST(req: Request) {
  const WEBHOOK_SECRET = process.env.DISCORD_WEBHOOK_SECRET;
  if (!WEBHOOK_SECRET) {
    throw new Error("WEBHOOK_SECRET is not set");
  }

  const wh = new Webhook(WEBHOOK_SECRET);

  const headerPayload = headers();
  const svix_id = headerPayload.get("svix-id");
  const svix_timestamp = headerPayload.get("svix-timestamp");
  const svix_signature = headerPayload.get("svix-signature");
  if (!svix_id || !svix_timestamp || !svix_signature) {
    return new Response("Error: Missing Svix headers", {
      status: 400,
    });
  }

  const payload = await req.json();
  const body = JSON.stringify(payload);
  let evt: WebhookEvent;

  try {
    evt = wh.verify(body, {
      "svix-id": svix_id,
      "svix-timestamp": svix_timestamp,
      "svix-signature": svix_signature,
    }) as WebhookEvent;
  } catch (err) {
    console.error("Error: Could not verify webhook:", err);
    return new Response("Error: Verification error", {
      status: 400,
    });
  }

  const eventType = evt.type;
  if (eventType === "user.created" || eventType === "user.deleted") {
    await updateUserCountChannel();
  }

  return new Response("Webhook received", { status: 200 });
}
