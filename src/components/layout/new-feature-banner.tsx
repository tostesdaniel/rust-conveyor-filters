import { cookies } from "next/headers";

import { NewFeatureBannerStrip } from "@/components/layout/new-feature-banner-strip";

export const NEW_FEATURE_BANNER_CAMPAIGN_ID = "item-updates-boost-2026-09";

export async function NewFeatureBanner({
  campaignId = NEW_FEATURE_BANNER_CAMPAIGN_ID,
  className,
}: {
  campaignId?: string;
  className?: string;
}) {
  const cookieName = `new-feature-banner-dismissed_${campaignId}`;
  if ((await cookies()).has(cookieName)) return null;

  return (
    <NewFeatureBannerStrip cookieName={cookieName} className={className} />
  );
}
