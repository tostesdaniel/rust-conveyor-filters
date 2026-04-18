import "server-only";

import { db } from "@/db";
import { setSubscriberStatus } from "@/services/badges";
import {
  addSubscriberRole,
  removeSubscriberRole,
} from "@/services/discord-bot";
import { clerkClient } from "@clerk/nextjs/server";
import { and, eq, isNotNull, lte } from "drizzle-orm";

import { getIntervalForProductId } from "@/config/paynow";
import { cancelPaynowSubscription } from "@/lib/paynow/client";
import {
  normalizeEventType,
  paynowOrderBodySchema,
  paynowSubscriptionBodySchema,
  type PaynowSubscriptionEventType,
  type PaynowWebhookEnvelope,
} from "@/lib/paynow/types";
import { paynowCustomers, subscriptions } from "@/db/schema";

type SubscriptionRow = typeof subscriptions.$inferSelect;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

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

function parseDate(value: string | null | undefined): Date | null {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

async function grantSupporter(clerkUserId: string) {
  await setSubscriberStatus(clerkUserId, true);
  const discordUserId = await getDiscordUserId(clerkUserId);
  if (discordUserId) {
    await addSubscriberRole(discordUserId);
  }
}

async function revokeSupporter(clerkUserId: string) {
  await setSubscriberStatus(clerkUserId, false);
  const discordUserId = await getDiscordUserId(clerkUserId);
  if (discordUserId) {
    await removeSubscriberRole(discordUserId);
  }
}

/**
 * Resolves the Clerk user id from multiple sources in priority order:
 * 1. Checkout metadata (most reliable for order events)
 * 2. Customer metadata embedded in the webhook body
 * 3. Our paynow_customers table keyed by PayNow customer id
 * 4. Existing subscription row (covers renewals / terminations)
 */
async function resolveClerkUserId(opts: {
  checkoutMetadata?: Record<string, string>;
  customerMetadata?: Record<string, string>;
  paynowCustomerId?: string | null;
  paynowSubscriptionId?: string | null;
}): Promise<string | null> {
  if (opts.checkoutMetadata?.clerkUserId) {
    return opts.checkoutMetadata.clerkUserId;
  }

  if (opts.customerMetadata?.clerkUserId) {
    return opts.customerMetadata.clerkUserId;
  }

  if (opts.paynowCustomerId) {
    const row = await db.query.paynowCustomers.findFirst({
      where: eq(paynowCustomers.paynowCustomerId, opts.paynowCustomerId),
    });
    if (row) return row.clerkUserId;
  }

  if (opts.paynowSubscriptionId) {
    const row = await db.query.subscriptions.findFirst({
      where: eq(subscriptions.paynowSubscriptionId, opts.paynowSubscriptionId),
    });
    if (row) return row.clerkUserId;
  }

  return null;
}

// ---------------------------------------------------------------------------
// on_order_completed
// ---------------------------------------------------------------------------

async function handleOrderCompleted(rawBody: unknown): Promise<void> {
  const result = paynowOrderBodySchema.safeParse(rawBody);
  if (!result.success) {
    console.error(
      "PayNow on_order_completed: body failed validation",
      result.error.flatten(),
    );
    return;
  }
  const order = result.data;

  const orderType = order.type ?? "";
  const isSubscriptionOrder =
    orderType === "subscription_initial" ||
    orderType === "subscription_renewal";

  if (!isSubscriptionOrder) {
    console.log(`PayNow: ignoring order type "${orderType}"`);
    return;
  }

  const paynowCustomerId = order.customer?.id ?? null;
  const paynowSubscriptionId =
    order.subscription_id ??
    order.lines?.find((l) => l.subscription_id)?.subscription_id ??
    null;
  const productId = order.lines?.[0]?.product_id ?? null;

  if (!paynowSubscriptionId || !productId) {
    console.warn(
      "PayNow on_order_completed: missing subscription_id or product_id",
      { paynowSubscriptionId, productId },
    );
    return;
  }

  const clerkUserId = await resolveClerkUserId({
    checkoutMetadata: order.checkout?.metadata,
    customerMetadata: order.customer?.metadata,
    paynowCustomerId,
    paynowSubscriptionId,
  });

  if (!clerkUserId) {
    console.warn(
      `PayNow on_order_completed: cannot resolve clerkUserId for subscription ${paynowSubscriptionId}`,
    );
    return;
  }

  if (orderType === "subscription_initial") {
    const interval = getIntervalForProductId(productId);
    if (!interval) {
      console.warn(
        `PayNow: unknown product_id "${productId}" in on_order_completed`,
      );
      return;
    }

    if (!paynowCustomerId) {
      console.warn(
        `PayNow on_order_completed: missing customer id for subscription ${paynowSubscriptionId}`,
      );
      return;
    }

    const now = new Date();
    await db
      .insert(subscriptions)
      .values({
        paynowSubscriptionId,
        clerkUserId,
        paynowCustomerId,
        productId,
        interval,
        status: "active",
        currentPeriodStart: null,
        currentPeriodEnd: null,
        canceledAt: null,
        pendingSwitch: null,
        createdAt: now,
        updatedAt: now,
      })
      .onConflictDoUpdate({
        target: subscriptions.paynowSubscriptionId,
        set: {
          clerkUserId,
          paynowCustomerId,
          productId,
          interval,
          status: "active",
          canceledAt: null,
          updatedAt: now,
        },
      });

    await grantSupporter(clerkUserId);
    return;
  }

  // subscription_renewal
  const existing: SubscriptionRow | undefined =
    await db.query.subscriptions.findFirst({
      where: eq(subscriptions.paynowSubscriptionId, paynowSubscriptionId),
    });

  if (!existing) {
    console.warn(
      `PayNow on_order_completed renewal: no subscription row for ${paynowSubscriptionId}`,
    );
    return;
  }

  await db
    .update(subscriptions)
    .set({ status: "active", updatedAt: new Date() })
    .where(eq(subscriptions.paynowSubscriptionId, paynowSubscriptionId));

  if (existing.pendingSwitch && existing.pendingSwitch !== existing.interval) {
    try {
      await cancelPaynowSubscription(paynowSubscriptionId);
    } catch (error) {
      console.error(
        `PayNow: failed to cancel ${paynowSubscriptionId} for pending switch`,
        error,
      );
    }
  }
}

// ---------------------------------------------------------------------------
// on_subscription_activated / on_subscription_renewed
// ---------------------------------------------------------------------------

async function handleSubscriptionActivated(rawBody: unknown): Promise<void> {
  const result = paynowSubscriptionBodySchema.safeParse(rawBody);
  if (!result.success) {
    console.warn(
      "PayNow on_subscription_activated: body failed validation",
      result.error.flatten(),
    );
    return;
  }
  const sub = result.data;

  const paynowCustomerId = sub.customer?.id ?? sub.customer_id ?? null;
  const clerkUserId = await resolveClerkUserId({
    customerMetadata: sub.customer?.metadata,
    paynowCustomerId,
    paynowSubscriptionId: sub.id,
  });

  if (!clerkUserId) {
    console.warn(
      `PayNow on_subscription_activated: cannot resolve clerkUserId for ${sub.id}`,
    );
    return;
  }

  if (!sub.product_id) {
    console.warn(
      `PayNow on_subscription_activated: missing product_id for ${sub.id}`,
    );
    return;
  }

  const interval = getIntervalForProductId(sub.product_id);
  if (!interval) {
    console.warn(
      `PayNow on_subscription_activated: unknown product_id ${sub.product_id}`,
    );
    return;
  }

  if (!paynowCustomerId) {
    console.warn(
      `PayNow on_subscription_activated: missing customer id for ${sub.id}`,
    );
    return;
  }

  const now = new Date();
  await db
    .insert(subscriptions)
    .values({
      paynowSubscriptionId: sub.id,
      clerkUserId,
      paynowCustomerId,
      productId: sub.product_id,
      interval,
      status: "active",
      currentPeriodStart: parseDate(sub.current_period_start),
      currentPeriodEnd: parseDate(sub.current_period_end),
      canceledAt: null,
      pendingSwitch: null,
      createdAt: now,
      updatedAt: now,
    })
    .onConflictDoUpdate({
      target: subscriptions.paynowSubscriptionId,
      set: {
        clerkUserId,
        paynowCustomerId,
        productId: sub.product_id,
        interval,
        status: "active",
        currentPeriodStart: parseDate(sub.current_period_start),
        currentPeriodEnd: parseDate(sub.current_period_end),
        canceledAt: null,
        updatedAt: now,
      },
    });

  await grantSupporter(clerkUserId);
}

async function handleSubscriptionRenewed(rawBody: unknown): Promise<void> {
  const result = paynowSubscriptionBodySchema.safeParse(rawBody);
  if (!result.success) return;
  const sub = result.data;

  const existing: SubscriptionRow | undefined =
    await db.query.subscriptions.findFirst({
      where: eq(subscriptions.paynowSubscriptionId, sub.id),
    });

  if (!existing) {
    console.warn(`PayNow on_subscription_renewed: no row for ${sub.id}`);
    return;
  }

  await db
    .update(subscriptions)
    .set({
      status: "active",
      currentPeriodStart: parseDate(sub.current_period_start),
      currentPeriodEnd: parseDate(sub.current_period_end),
      updatedAt: new Date(),
    })
    .where(eq(subscriptions.paynowSubscriptionId, sub.id));

  if (existing.pendingSwitch && existing.pendingSwitch !== existing.interval) {
    try {
      await cancelPaynowSubscription(sub.id);
    } catch (error) {
      console.error(
        `PayNow: failed to cancel ${sub.id} for pending switch`,
        error,
      );
    }
  }
}

// ---------------------------------------------------------------------------
// on_subscription_canceled / on_refund / on_chargeback
// ---------------------------------------------------------------------------

async function handleSubscriptionTerminated(
  rawBody: unknown,
  terminalStatus: "canceled" | "refunded" | "chargeback",
): Promise<void> {
  const result = paynowSubscriptionBodySchema.safeParse(rawBody);
  if (!result.success) {
    // Refund/chargeback may arrive as an order body — try to find sub by order
    console.warn(
      `PayNow ${terminalStatus}: body did not match subscription schema`,
    );
    return;
  }
  const sub = result.data;

  const paynowCustomerId = sub.customer?.id ?? sub.customer_id ?? null;
  const clerkUserId = await resolveClerkUserId({
    customerMetadata: sub.customer?.metadata,
    paynowCustomerId,
    paynowSubscriptionId: sub.id,
  });

  const now = new Date();

  // "canceled" = user opted out: keep benefits until currentPeriodEnd, the
  // revoke-expired-subscriptions cron will flip benefitsRevoked later.
  // "refunded" / "chargeback" = revoke immediately.
  const revokeNow = terminalStatus !== "canceled";

  await db
    .update(subscriptions)
    .set({
      status: terminalStatus,
      canceledAt: parseDate(sub.canceled_at) ?? now,
      benefitsRevoked: revokeNow,
      updatedAt: now,
    })
    .where(eq(subscriptions.paynowSubscriptionId, sub.id));

  if (revokeNow && clerkUserId) {
    await revokeSupporter(clerkUserId);
  }
}

// ---------------------------------------------------------------------------
// Scheduled revocation of canceled subscriptions past their period end
// ---------------------------------------------------------------------------

/**
 * Revokes benefits (supporter badge + Discord role) for every subscription
 * that was canceled by the user and whose paid period has now ended.
 * Idempotent via the `benefitsRevoked` flag.
 */
export async function revokeExpiredSubscriptions(): Promise<{
  processed: number;
}> {
  const now = new Date();

  const expired = await db
    .select()
    .from(subscriptions)
    .where(
      and(
        eq(subscriptions.status, "canceled"),
        eq(subscriptions.benefitsRevoked, false),
        isNotNull(subscriptions.currentPeriodEnd),
        lte(subscriptions.currentPeriodEnd, now),
      ),
    );

  for (const row of expired) {
    try {
      await revokeSupporter(row.clerkUserId);
      await db
        .update(subscriptions)
        .set({ benefitsRevoked: true, updatedAt: new Date() })
        .where(eq(subscriptions.id, row.id));
    } catch (error) {
      console.error(
        `revokeExpiredSubscriptions: failed for subscription ${row.paynowSubscriptionId}`,
        error,
      );
    }
  }

  return { processed: expired.length };
}

// ---------------------------------------------------------------------------
// Main dispatcher
// ---------------------------------------------------------------------------

export async function handlePaynowSubscriptionEvent(
  rawEventType: PaynowSubscriptionEventType,
  envelope: PaynowWebhookEnvelope,
): Promise<void> {
  const eventType = normalizeEventType(rawEventType);
  const body = envelope.body;

  switch (eventType) {
    case "on_order_completed":
      await handleOrderCompleted(body);
      return;
    case "on_subscription_activated":
      await handleSubscriptionActivated(body);
      return;
    case "on_subscription_renewed":
      await handleSubscriptionRenewed(body);
      return;
    case "on_subscription_canceled":
      await handleSubscriptionTerminated(body, "canceled");
      return;
    case "on_refund":
      await handleSubscriptionTerminated(body, "refunded");
      return;
    case "on_chargeback":
      await handleSubscriptionTerminated(body, "chargeback");
      return;
    default: {
      const _exhaustive: never = eventType as never;
      throw new Error(`Unhandled PayNow event type: ${String(_exhaustive)}`);
    }
  }
}
