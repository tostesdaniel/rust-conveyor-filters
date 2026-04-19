import { createHmac, timingSafeEqual } from "node:crypto";
import { headers } from "next/headers";
import { setNitroBoosterStatus } from "@/services/badges";
import {
  findClerkUserIdByDiscordUserId,
  updateUserCountChannel,
} from "@/services/discord-bot";
import type { WebhookEvent } from "@clerk/nextjs/server";
import { Webhook } from "svix";

type DiscordBoostWebhookEvent = {
  type: "guild.member.boost.updated";
  data: {
    discordUserId: string;
    isNitroBooster: boolean;
    premiumSince: string | null;
  };
};

function hasSvixHeaders(headerPayload: Headers): boolean {
  return Boolean(
    headerPayload.get("svix-id") &&
      headerPayload.get("svix-timestamp") &&
      headerPayload.get("svix-signature"),
  );
}

function isValidDiscordSignature(body: string, signature: string): boolean {
  const webhookSecret = process.env.DISCORD_BOT_WEBHOOK_SECRET;
  if (!webhookSecret) {
    throw new Error("DISCORD_BOT_WEBHOOK_SECRET is not set");
  }

  const normalizedSignature = signature.startsWith("sha256=")
    ? signature.slice("sha256=".length)
    : signature;
  const expectedSignature = createHmac("sha256", webhookSecret)
    .update(body)
    .digest("hex");

  if (
    normalizedSignature.length !== expectedSignature.length ||
    normalizedSignature.length % 2 !== 0
  ) {
    return false;
  }

  try {
    return timingSafeEqual(
      Buffer.from(normalizedSignature, "hex"),
      Buffer.from(expectedSignature, "hex"),
    );
  } catch {
    return false;
  }
}

async function handleClerkWebhook(rawBody: string, headerPayload: Headers) {
  const webhookSecret = process.env.DISCORD_WEBHOOK_SECRET;
  if (!webhookSecret) {
    throw new Error("DISCORD_WEBHOOK_SECRET is not set");
  }

  const wh = new Webhook(webhookSecret);
  let evt: WebhookEvent;

  try {
    evt = wh.verify(rawBody, {
      "svix-id": headerPayload.get("svix-id")!,
      "svix-timestamp": headerPayload.get("svix-timestamp")!,
      "svix-signature": headerPayload.get("svix-signature")!,
    }) as WebhookEvent;
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

async function handleDiscordBoostWebhook(rawBody: string, signature: string) {
  if (!isValidDiscordSignature(rawBody, signature)) {
    return new Response("Error: Verification error", {
      status: 401,
    });
  }

  let evt: DiscordBoostWebhookEvent;
  try {
    evt = JSON.parse(rawBody) as DiscordBoostWebhookEvent;
  } catch {
    return new Response("Error: Invalid JSON payload", {
      status: 400,
    });
  }

  if (evt.type !== "guild.member.boost.updated") {
    return new Response("Ignored: unsupported event", { status: 200 });
  }

  const clerkUserId = await findClerkUserIdByDiscordUserId(
    evt.data.discordUserId,
  );
  if (!clerkUserId) {
    console.warn(
      `Discord boost webhook received for unlinked Discord user ${evt.data.discordUserId}`,
    );
    return new Response("Ignored: no linked Clerk user", { status: 200 });
  }

  await setNitroBoosterStatus(clerkUserId, evt.data.isNitroBooster);
  return new Response("Webhook received", { status: 200 });
}

export async function POST(req: Request) {
  const rawBody = await req.text();
  const headerPayload = await headers();
  if (hasSvixHeaders(headerPayload)) {
    return handleClerkWebhook(rawBody, headerPayload);
  }

  const discordSignature = headerPayload.get("x-discord-signature");
  if (discordSignature) {
    return handleDiscordBoostWebhook(rawBody, discordSignature);
  }

  return new Response("Error: Missing webhook signature headers", {
    status: 400,
  });
}
