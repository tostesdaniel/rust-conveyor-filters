import { NextResponse } from "next/server";
import { db } from "@/db";
import { setDonatorStatus } from "@/services/badges";
import {
  verifyKofiWebhook,
  type KoFiWebhookPayload,
} from "@/services/donations/kofi";
import { clerkClient } from "@clerk/nextjs/server";

import { donations } from "@/db/schema";

/**
 * Handles incoming Ko-fi webhook POST requests, verifies the payload, records the donation, and updates user badge status if applicable.
 *
 * Expects a form-encoded "data" field containing a JSON string of the Ko-fi webhook payload. Validates the webhook signature, associates the donation with a user if the email matches, and updates the user's donator badge. Returns a JSON response indicating success or an error status.
 */
export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const dataString = formData.get("data");

    if (!dataString || typeof dataString !== "string") {
      return NextResponse.json(
        { error: "Invalid request format" },
        { status: 400 },
      );
    }

    const body: KoFiWebhookPayload = JSON.parse(dataString);

    const isValid = await verifyKofiWebhook(body);

    if (!isValid) {
      return NextResponse.json(
        { error: "Invalid webhook signature" },
        { status: 401 },
      );
    }

    let userId = undefined;
    if (body.email) {
      const client = await clerkClient();
      const users = await client.users.getUserList({
        emailAddress: [body.email],
      });
      if (users.data[0]) userId = users.data[0].id;
    }

    await db.insert(donations).values({
      userId,
      email: body.email,
      platform: "kofi",
      type: body.type,
      amount: body.amount,
      currency: body.currency,
      transactionId: body.kofi_transaction_id,
    });

    // If we found a userId, update their badge
    if (userId) {
      await setDonatorStatus(userId, true);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Ko-fi webhook error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
