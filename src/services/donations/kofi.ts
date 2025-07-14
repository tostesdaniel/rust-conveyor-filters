export interface KoFiWebhookPayload {
  verification_token: string;
  message_id: string;
  timestamp: string;
  type: "Donation" | "Subscription"; // No Commission or Shop Order
  is_public: boolean;
  from_name: string;
  message: string;
  amount: string;
  url: string;
  email: string;
  currency: string;
  is_subscription_payment: boolean;
  is_first_subscription_payment: boolean;
  kofi_transaction_id: string;
}

export async function verifyKofiWebhook(
  payload: KoFiWebhookPayload,
): Promise<boolean> {
  const verificationToken = process.env.KOFI_VERIFICATION_TOKEN;

  if (!verificationToken) {
    throw new Error("Ko-fi verification token missing");
  }

  return payload.verification_token === verificationToken;
}
