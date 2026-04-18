import { headers } from "next/headers";
import { handlePaynowSubscriptionEvent } from "@/services/subscriptions";

import { getPaynowConfig } from "@/config/paynow";
import {
  isSubscriptionEventType,
  normalizeEventType,
  paynowWebhookEnvelopeSchema,
} from "@/lib/paynow/types";
import { verifyPaynowSignature } from "@/lib/paynow/verify-signature";

export async function POST(req: Request) {
  const { webhookSecret } = getPaynowConfig();

  const headerPayload = await headers();
  const signature = headerPayload.get("paynow-signature");
  const timestamp = headerPayload.get("paynow-timestamp");

  const rawBody = await req.text();

  const verification = verifyPaynowSignature({
    rawBody,
    signatureHeader: signature,
    timestampHeader: timestamp,
    secret: webhookSecret,
  });

  if (!verification.ok) {
    console.error(`PayNow webhook rejected: ${verification.reason}`);
    return new Response("Invalid signature", { status: 401 });
  }

  let parsedBody: unknown;
  try {
    parsedBody = JSON.parse(rawBody);
  } catch {
    return new Response("Invalid JSON body", { status: 400 });
  }

  const envelopeResult = paynowWebhookEnvelopeSchema.safeParse(parsedBody);
  if (!envelopeResult.success) {
    console.error(
      "PayNow webhook envelope failed validation",
      envelopeResult.error.flatten(),
    );
    return new Response("Invalid payload", { status: 400 });
  }

  const envelope = envelopeResult.data;
  const normalizedType = normalizeEventType(envelope.event_type);

  if (!isSubscriptionEventType(normalizedType)) {
    return new Response(`Ignored event ${envelope.event_type}`, {
      status: 200,
    });
  }

  try {
    await handlePaynowSubscriptionEvent(normalizedType, envelope);
  } catch (error) {
    console.error(
      `PayNow webhook handler failed for ${envelope.event_type}`,
      error,
    );
    return new Response("Internal error", { status: 500 });
  }

  return new Response("ok", { status: 200 });
}
