"use client";

import { useDonateBannerState } from "@/hooks/use-donate-banner-state";
import { DonateBannerDialog } from "@/components/features/donation/donate-banner-dialog";

export function BannerWrapper() {
  const { isVisible, dismiss } = useDonateBannerState();

  if (!isVisible) return null;

  return <DonateBannerDialog onDismiss={dismiss} />;
}
