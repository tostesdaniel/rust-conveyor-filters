import { z } from "zod";

/**
 * PayNow sends event_type in uppercase (e.g. "ON_ORDER_COMPLETED") even
 * though the docs show lowercase. Normalise to lowercase for all comparisons.
 */
export function normalizeEventType(raw: string): string {
  return raw.toLowerCase();
}

/**
 * Order body — shape of `body` for `on_order_completed` events.
 * Contains checkout metadata (where we put clerkUserId) and line items
 * (where the subscription_id lives).
 */
export const paynowOrderBodySchema = z
  .object({
    id: z.string(),
    customer: z
      .object({
        id: z.string(),
        name: z.string().nullable().optional(),
        metadata: z.record(z.string(), z.string()).optional(),
      })
      .passthrough()
      .optional(),
    checkout: z
      .object({
        id: z.string().optional(),
        metadata: z.record(z.string(), z.string()).optional(),
      })
      .passthrough()
      .optional(),
    subscription_id: z.string().nullable().optional(),
    /** "subscription_initial" | "subscription_renewal" | "one_time" | "mixed" */
    type: z.string().optional(),
    lines: z
      .array(
        z
          .object({
            product_id: z.string().optional(),
            subscription_id: z.string().nullable().optional(),
            subscription_interval_scale: z.string().optional(),
            subscription_interval_value: z.number().int().optional(),
          })
          .passthrough(),
      )
      .optional(),
    status: z.string().optional(),
    created_at: z.string().optional(),
    completed_at: z.string().optional(),
  })
  .passthrough();

export type PaynowOrderBody = z.infer<typeof paynowOrderBodySchema>;

/**
 * Subscription body — shape of `body` for `on_subscription_*` events.
 */
export const paynowSubscriptionBodySchema = z
  .object({
    id: z.string(),
    status: z.enum(["created", "active", "canceled"]).optional(),
    customer_id: z.string().optional(),
    customer: z
      .object({
        id: z.string(),
        metadata: z.record(z.string(), z.string()).optional(),
      })
      .passthrough()
      .optional(),
    product_id: z.string().optional(),
    interval_value: z.number().int().optional(),
    interval_scale: z
      .enum(["invalid", "day", "week", "month", "year"])
      .optional(),
    current_period_start: z.string().nullable().optional(),
    current_period_end: z.string().nullable().optional(),
    canceled_at: z.string().nullable().optional(),
    active_at: z.string().nullable().optional(),
    created_at: z.string().optional(),
  })
  .passthrough();

export type PaynowSubscriptionBody = z.infer<
  typeof paynowSubscriptionBodySchema
>;

/**
 * Generic webhook envelope.
 * PayNow wraps all event data under `body`.
 * `event_type` is uppercase in practice (e.g. "ON_ORDER_COMPLETED").
 */
export const paynowWebhookEnvelopeSchema = z
  .object({
    event_type: z.string(),
    event_id: z.string().optional(),
    body: z.unknown().optional(),
  })
  .passthrough();

export type PaynowWebhookEnvelope = z.infer<typeof paynowWebhookEnvelopeSchema>;

export const SUBSCRIPTION_EVENT_TYPES = [
  "on_order_completed",
  "on_subscription_activated",
  "on_subscription_renewed",
  "on_subscription_canceled",
  "on_refund",
  "on_chargeback",
] as const;

export type PaynowSubscriptionEventType =
  (typeof SUBSCRIPTION_EVENT_TYPES)[number];

export function isSubscriptionEventType(
  value: string,
): value is PaynowSubscriptionEventType {
  return (SUBSCRIPTION_EVENT_TYPES as readonly string[]).includes(
    normalizeEventType(value),
  );
}
