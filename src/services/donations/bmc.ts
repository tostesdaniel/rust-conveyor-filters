import crypto from "crypto";

import { secureCompare } from "@/lib/secure-compare";

export interface BuyMeACoffeeWebhookPayload {
  type: "donation.created" | "membership.started"; // Others types are ignored for now
  data: {
    id: number;
    amount: number;
    object: "payment" | "membership";
    status: "succeeded" | "refunded";
    currency: string;
    supporter_email: string;
  } & (
    | { transaction_id: string; psp_id?: never }
    | { psp_id: string; transaction_id?: never }
  );
}

export function getTransactionId(data: BuyMeACoffeeWebhookPayload["data"]) {
  return (data.transaction_id || data.psp_id) as string;
}

export async function verifyBMCWebhook(
  payload: string,
  signature: string | null,
): Promise<boolean> {
  const webhookSecret = process.env.BMC_VERIFICATION_TOKEN;

  if (!webhookSecret) {
    throw new Error("BMC_VERIFICATION_TOKEN is not set");
  }

  if (!signature) {
    return false;
  }

  const hmac = crypto.createHmac("sha256", webhookSecret);
  hmac.update(payload);
  const expectedSignature = hmac.digest("hex");

  return secureCompare(signature, expectedSignature);
}
