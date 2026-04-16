"use client";

import { useAuth, useUser } from "@clerk/nextjs";

/**
 * Returns true if the user has any ad-free entitlement:
 * - Active subscriber (ad_free feature)
 * - Pre-migration legacy donator (isLegacyDonator metadata)
 * - Discord Nitro Booster (isNitroBooster metadata)
 *
 * New 3rd-party donators (isDonator) get a badge but NOT ad-free.
 */
export function useIsAdFree(): boolean {
  const { has } = useAuth();
  const { user } = useUser();

  const meta = user?.publicMetadata as UserPublicMetadata | undefined;
  const hasAdFreeFeature = !!has?.({ feature: "ad_free" });
  const isLegacyDonator = !!meta?.isLegacyDonator;
  const isNitroBooster = !!meta?.isNitroBooster;

  return hasAdFreeFeature || isLegacyDonator || isNitroBooster;
}
