import { db } from "@/db";
import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import { clerkClient } from "@clerk/nextjs/server";
import { TRPCError } from "@trpc/server";
import { and, desc, eq, gt, or } from "drizzle-orm";
import { z } from "zod";

import { getProductIdForInterval } from "@/config/paynow";
import { siteConfig } from "@/config/site";
import {
  cancelPaynowSubscription,
  createPaynowCheckout,
  findOrCreatePaynowCustomer,
} from "@/lib/paynow/client";
import { paynowCustomers, subscriptions } from "@/db/schema";

const intervalSchema = z.enum(["monthly", "yearly"]);

async function resolvePaynowCustomerId(clerkUserId: string): Promise<string> {
  const existing = await db.query.paynowCustomers.findFirst({
    where: eq(paynowCustomers.clerkUserId, clerkUserId),
  });
  if (existing) return existing.paynowCustomerId;

  const paynowCustomerId = await findOrCreatePaynowCustomer(clerkUserId);

  await db
    .insert(paynowCustomers)
    .values({ clerkUserId, paynowCustomerId })
    .onConflictDoNothing({ target: paynowCustomers.clerkUserId });

  try {
    const client = await clerkClient();
    await client.users.updateUserMetadata(clerkUserId, {
      publicMetadata: { paynowCustomerId },
    });
  } catch (error) {
    console.error(
      `Failed to sync paynowCustomerId to Clerk for ${clerkUserId}`,
      error,
    );
  }

  return paynowCustomerId;
}

export const billingRouter = createTRPCRouter({
  createCheckout: protectedProcedure
    .input(z.object({ interval: intervalSchema }))
    .mutation(async ({ ctx, input }) => {
      const paynowCustomerId = await resolvePaynowCustomerId(ctx.userId);
      const productId = getProductIdForInterval(input.interval);

      const checkout = await createPaynowCheckout({
        customerId: paynowCustomerId,
        productId,
        metadata: { clerkUserId: ctx.userId, interval: input.interval },
        returnUrl: `${siteConfig.url}/donate?checkout=success`,
        cancelUrl: `${siteConfig.url}/donate?checkout=canceled`,
      });

      return {
        token: checkout.token,
        url: checkout.url,
      };
    }),

  getMySubscription: protectedProcedure.query(async ({ ctx }) => {
    const now = new Date();
    const rows = await db
      .select()
      .from(subscriptions)
      .where(
        and(
          eq(subscriptions.clerkUserId, ctx.userId),
          or(
            eq(subscriptions.status, "active"),
            and(
              eq(subscriptions.status, "canceled"),
              eq(subscriptions.benefitsRevoked, false),
              gt(subscriptions.currentPeriodEnd, now),
            ),
          ),
        ),
      )
      .orderBy(desc(subscriptions.createdAt))
      .limit(1);

    return rows[0] ?? null;
  }),

  cancelSubscription: protectedProcedure.mutation(async ({ ctx }) => {
    const active = await db.query.subscriptions.findFirst({
      where: and(
        eq(subscriptions.clerkUserId, ctx.userId),
        eq(subscriptions.status, "active"),
      ),
    });

    if (!active) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "No active subscription found",
      });
    }

    await cancelPaynowSubscription(active.paynowSubscriptionId);

    return { success: true };
  }),

  scheduleIntervalSwitch: protectedProcedure
    .input(z.object({ target: intervalSchema }))
    .mutation(async ({ ctx, input }) => {
      const active = await db.query.subscriptions.findFirst({
        where: and(
          eq(subscriptions.clerkUserId, ctx.userId),
          eq(subscriptions.status, "active"),
        ),
      });

      if (!active) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "No active subscription found",
        });
      }

      if (active.interval === input.target) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Subscription is already on the requested interval",
        });
      }

      await db
        .update(subscriptions)
        .set({ pendingSwitch: input.target, updatedAt: new Date() })
        .where(eq(subscriptions.id, active.id));

      return { success: true };
    }),
});
