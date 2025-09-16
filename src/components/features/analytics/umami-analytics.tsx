import Script from "next/script";

export function UmamiAnalytics() {
  const umamiWebsiteId = process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID;

  if (!umamiWebsiteId || process.env.NODE_ENV !== "production") {
    return null;
  }

  return (
    <Script
      id='umami-analytics'
      src='https://umami.rustconveyorfilters.com/script.js'
      data-website-id={umamiWebsiteId}
      strategy='afterInteractive'
    />
  );
}
