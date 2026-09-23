import { headers } from "next/headers";
import { updateUserCountChannel } from "@/services/discord-bot";
import type { WebhookEvent } from "@clerk/nextjs/server";
import { Webhook } from "svix";

export async function POST(req: Request) {
  const webhookSecret = process.env.DISCORD_WEBHOOK_SECRET;
  if (!webhookSecret) {
    throw new Error("DISCORD_WEBHOOK_SECRET is not set");
  }

  const [rawBody, headerPayload] = await Promise.all([req.text(), headers()]);
  const svixId = headerPayload.get("svix-id");
  const svixTimestamp = headerPayload.get("svix-timestamp");
  const svixSignature = headerPayload.get("svix-signature");
  if (!svixId || !svixTimestamp || !svixSignature) {
    return new Response("Error: Missing svix headers", { status: 400 });
  }

  const wh = new Webhook(webhookSecret);
  let evt: WebhookEvent;

  try {
    // verify() returns undefined and throws on a bad signature, so the body
    // gets parsed separately. Malformed JSON lands in the same 400 below.
    wh.verify(rawBody, {
      "svix-id": svixId,
      "svix-timestamp": svixTimestamp,
      "svix-signature": svixSignature,
    });
    evt = JSON.parse(rawBody) as WebhookEvent;
  } catch (err) {
    console.error("Error: Could not verify Clerk webhook:", err);
    return new Response("Error: Verification error", {
      status: 400,
    });
  }

  if (evt.type === "user.created" || evt.type === "user.deleted") {
    await updateUserCountChannel();
  }

  return new Response("Webhook received", { status: 200 });
}
