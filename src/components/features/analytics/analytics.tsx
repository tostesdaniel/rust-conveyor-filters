import Script from "next/script";

export function Analytics() {
  const siteId = "1";

  if (process.env.NODE_ENV !== "production") {
    return null;
  }

  return (
    <Script
      src='/api/script.js'
      data-site-id={siteId}
      strategy='afterInteractive'
    />
  );
}
