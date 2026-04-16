import { headers } from "next/headers";
import { setSubscriberStatus } from "@/services/badges";
import {
  addSubscriberRole,
  removeSubscriberRole,
} from "@/services/discord-bot";
import type { BillingSubscriptionItemWebhookEvent } from "@clerk/backend";
import { clerkClient } from "@clerk/nextjs/server";
import { Webhook } from "svix";

async function getDiscordUserId(clerkUserId: string): Promise<string | null> {
  try {
    const client = await clerkClient();
    const user = await client.users.getUser(clerkUserId);
    const discordAccount = user.externalAccounts?.find(
      (account) => account.provider === "oauth_discord",
    );
    return discordAccount?.providerUserId ?? null;
  } catch {
    return null;
  }
}

export async function POST(req: Request) {
  const WEBHOOK_SECRET = process.env.CLERK_BILLING_WEBHOOK_SECRET;
  if (!WEBHOOK_SECRET) {
    throw new Error("CLERK_BILLING_WEBHOOK_SECRET is not set");
  }

  const wh = new Webhook(WEBHOOK_SECRET);

  const headerPayload = await headers();
  const svix_id = headerPayload.get("svix-id");
  const svix_timestamp = headerPayload.get("svix-timestamp");
  const svix_signature = headerPayload.get("svix-signature");

  if (!svix_id || !svix_timestamp || !svix_signature) {
    return new Response("Error: Missing Svix headers", { status: 400 });
  }

  const body = await req.text();
  let evt: BillingSubscriptionItemWebhookEvent;

  try {
    evt = wh.verify(body, {
      "svix-id": svix_id,
      "svix-timestamp": svix_timestamp,
      "svix-signature": svix_signature,
    }) as BillingSubscriptionItemWebhookEvent;
  } catch (err) {
    console.error("Error: Could not verify billing webhook:", err);
    return new Response("Error: Verification error", { status: 400 });
  }

  const { type, data: subscriptionItem } = evt;

  if (!type.startsWith("subscriptionItem.")) {
    return new Response(`Ignored: unsupported billing event ${type}`, {
      status: 200,
    });
  }

  try {
    if (subscriptionItem.plan?.slug !== "supporter") {
      return new Response("Ignored: not supporter plan", { status: 200 });
    }

    const payerId = subscriptionItem.payer?.user_id;
    if (!payerId) {
      return new Response("Ignored: supporter plan is not attached to a user", {
        status: 200,
      });
    }

    if (
      type === "subscriptionItem.active" ||
      (type === "subscriptionItem.updated" &&
        subscriptionItem.status === "active")
    ) {
      await setSubscriberStatus(payerId, true);

      const discordUserId = await getDiscordUserId(payerId);
      if (discordUserId) {
        await addSubscriberRole(discordUserId);
      }
    } else if (type === "subscriptionItem.ended") {
      await setSubscriberStatus(payerId, false);

      const discordUserId = await getDiscordUserId(payerId);
      if (discordUserId) {
        await removeSubscriberRole(discordUserId);
      }
    } else if (type === "subscriptionItem.canceled") {
      return new Response(
        "Ignored: supporter remains active until period end",
        {
          status: 200,
        },
      );
    }
  } catch (error) {
    console.error(`Error handling billing webhook event ${type}:`, error);
    return new Response("Error: Internal server error", { status: 500 });
  }

  return new Response("Webhook received", { status: 200 });
}
