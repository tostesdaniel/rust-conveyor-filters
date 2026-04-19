import "server-only";

import { getPaynowConfig } from "@/config/paynow";

const PAYNOW_API_BASE = "https://api.paynow.gg";

export type PaynowCheckoutLine = {
  product_id: string;
  quantity: number;
  subscription: boolean;
};

export type PaynowCheckoutMetadata = Record<string, string>;

type PaynowFetchOptions = {
  method?: "GET" | "POST" | "PATCH" | "DELETE" | "PUT";
  path: string;
  body?: unknown;
  extraHeaders?: Record<string, string>;
};

async function paynowFetch<TResponse>(
  opts: PaynowFetchOptions,
): Promise<TResponse> {
  const { apiKey } = getPaynowConfig();
  const response = await fetch(`${PAYNOW_API_BASE}${opts.path}`, {
    method: opts.method ?? "GET",
    headers: {
      Authorization: `APIKey ${apiKey}`,
      "Content-Type": "application/json",
      ...opts.extraHeaders,
    },
    body: opts.body ? JSON.stringify(opts.body) : undefined,
    cache: "no-store",
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(
      `PayNow request failed (${response.status} ${response.statusText}) at ${opts.method ?? "GET"} ${opts.path}: ${text}`,
    );
  }

  if (response.status === 204) {
    return undefined as TResponse;
  }

  return (await response.json()) as TResponse;
}

type ManagementCustomerResponse = {
  id: string;
  name: string | null;
  metadata: Record<string, string>;
};

type CheckoutResponse = {
  id: string;
  token: string;
  url: string;
};

type SubscriptionResponse = {
  id: string;
  status: "created" | "active" | "canceled";
  current_period_end: string | null;
  product_id: string;
};

/**
 * Creates a new PayNow customer via the Management API and returns their id.
 *
 * The caller (billing router) is responsible for deduplication — it checks
 * the local `paynow_customers` table first and only calls this when no record
 * exists, so we always create rather than upsert here.
 *
 * The `paynow_name` storefront-auth platform is not supported for generic
 * web stores; the Management API `POST /v1/stores/{id}/customers` is the
 * correct server-side approach.
 */
export async function findOrCreatePaynowCustomer(
  clerkUserId: string,
): Promise<string> {
  const { storeId } = getPaynowConfig();

  const customer = await paynowFetch<ManagementCustomerResponse>({
    method: "POST",
    path: `/v1/stores/${storeId}/customers`,
    body: {
      name: clerkUserId,
      metadata: { clerkUserId },
    },
  });

  return customer.id;
}

export async function createPaynowCheckout(params: {
  customerId: string;
  productId: string;
  metadata?: PaynowCheckoutMetadata;
  returnUrl?: string;
  cancelUrl?: string;
}): Promise<CheckoutResponse> {
  const { storeId } = getPaynowConfig();
  return paynowFetch<CheckoutResponse>({
    method: "POST",
    path: `/v1/stores/${storeId}/checkouts`,
    body: {
      customer_id: params.customerId,
      lines: [
        {
          product_id: params.productId,
          quantity: 1,
          subscription: true,
        },
      ],
      metadata: params.metadata,
      return_url: params.returnUrl,
      cancel_url: params.cancelUrl,
      auto_redirect: false,
    },
  });
}

export async function cancelPaynowSubscription(
  subscriptionId: string,
): Promise<void> {
  const { storeId } = getPaynowConfig();
  await paynowFetch<void>({
    method: "POST",
    path: `/v1/stores/${storeId}/subscriptions/${subscriptionId}/cancel`,
  });
}

export async function getPaynowSubscription(
  subscriptionId: string,
): Promise<SubscriptionResponse> {
  const { storeId } = getPaynowConfig();
  return paynowFetch<SubscriptionResponse>({
    method: "GET",
    path: `/v1/stores/${storeId}/subscriptions/${subscriptionId}`,
  });
}
