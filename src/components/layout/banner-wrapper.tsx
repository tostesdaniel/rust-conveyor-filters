"use client";

import { useDonateBannerState } from "@/hooks/use-donate-banner-state";
import { useIsAdFree } from "@/hooks/use-is-ad-free";
import { DonateBannerDialog } from "@/components/features/donation/donate-banner-dialog";

export function BannerWrapper() {
  const isAdFree = useIsAdFree();
  const { isVisible, dismiss } = useDonateBannerState();

  if (isAdFree || !isVisible) return null;

  return <DonateBannerDialog onDismiss={dismiss} />;
}
