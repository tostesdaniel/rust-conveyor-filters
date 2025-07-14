import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { setDonatorStatus } from "@/services/badges";
import {
  getTransactionId,
  verifyBMCWebhook,
  type BuyMeACoffeeWebhookPayload,
} from "@/services/donations/bmc";
import { clerkClient } from "@clerk/nextjs/server";

import { donations } from "@/db/schema";

/**
 * Handles Buy Me A Coffee webhook POST requests for donation and membership events.
 *
 * Verifies the webhook signature, processes donation or membership events, records the transaction in the database, and updates the user's donator status if applicable. Returns a JSON response indicating success, ignored event, unauthorized access, or internal server error.
 */
export async function POST(request: Request) {
  try {
    const rawBody = await request.text();
    const signature = (await headers()).get("x-signature-sha256");

    const isValid = await verifyBMCWebhook(rawBody, signature);
    if (!isValid) {
      return NextResponse.json({ success: false }, { status: 401 });
    }

    const body: BuyMeACoffeeWebhookPayload = JSON.parse(rawBody);

    const isIgnoredEvent =
      body.type !== "donation.created" && body.type !== "membership.started";
    if (isIgnoredEvent) {
      return NextResponse.json({
        message: "Ignored non-donation event",
      });
    }

    let userId = undefined;
    const { data } = body;
    if (data.supporter_email) {
      const client = await clerkClient();
      const users = await client.users.getUserList({
        emailAddress: [data.supporter_email],
      });
      if (users.data[0]) userId = users.data[0].id;
    }

    await db.insert(donations).values({
      userId,
      email: data.supporter_email,
      platform: "buyMeACoffee",
      amount: data.amount.toString(),
      currency: data.currency,
      type: data.object === "payment" ? "Donation" : "Subscription",
      transactionId: getTransactionId(data),
    });

    if (userId) {
      await setDonatorStatus(userId, true);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Buy Me A Coffee webhook error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
