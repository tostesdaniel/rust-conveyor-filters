"use client";

import { useUser } from "@clerk/nextjs";

/**
 * Returns true if the user has any ad-free entitlement:
 * - Active PayNow subscriber (isSubscriber metadata)
 * - Pre-migration legacy donator (isLegacyDonator metadata)
 * - Server booster of our Discord (isServerBooster metadata)
 *
 * New 3rd-party donators (isDonator) get a badge but NOT ad-free.
 */
export function useIsAdFree(): boolean {
  const { user } = useUser();

  const meta = user?.publicMetadata as UserPublicMetadata | undefined;
  const isSubscriber = !!meta?.isSubscriber;
  const isLegacyDonator = !!meta?.isLegacyDonator;
  const isServerBooster = !!meta?.isServerBooster;

  return isSubscriber || isLegacyDonator || isServerBooster;
}
