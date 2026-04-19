import "server-only";

export type SupporterInterval = "monthly" | "yearly";

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export function getPaynowConfig() {
  return {
    apiKey: requireEnv("PAYNOW_API_KEY"),
    storeId: requireEnv("PAYNOW_STORE_ID"),
    webhookSecret: requireEnv("PAYNOW_WEBHOOK_SECRET"),
    products: {
      monthly: requireEnv("PAYNOW_PRODUCT_ID_MONTHLY"),
      yearly: requireEnv("PAYNOW_PRODUCT_ID_YEARLY"),
    } satisfies Record<SupporterInterval, string>,
  };
}

export function getProductIdForInterval(interval: SupporterInterval): string {
  return getPaynowConfig().products[interval];
}

export function getIntervalForProductId(
  productId: string,
): SupporterInterval | null {
  const { products } = getPaynowConfig();
  if (productId === products.monthly) return "monthly";
  if (productId === products.yearly) return "yearly";
  return null;
}
