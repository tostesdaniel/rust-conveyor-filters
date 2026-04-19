"use client";

import { useEngagementScore } from "@/hooks/use-engagement-score";

export function useDonateBannerState() {
  const { bannerDue, markBannerShown, dismissBanner } = useEngagementScore();

  return {
    visible: bannerDue,
    markShown: markBannerShown,
    dismiss: dismissBanner,
  };
}
