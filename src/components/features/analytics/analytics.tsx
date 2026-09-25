import Script from "next/script";

const MASK_PATTERNS = JSON.stringify([
  "/my-filters/edit/*",
  "/auth/sign-in/**",
]);

export function Analytics() {
  const host = process.env.NEXT_PUBLIC_RYBBIT_HOST;

  if (process.env.NODE_ENV !== "production" || !host) {
    return null;
  }

  return (
    <Script
      src={`${host}/api/script.js`}
      data-site-id='1'
      data-mask-patterns={MASK_PATTERNS}
      data-tag={process.env.NEXT_PUBLIC_COMMIT_SHA?.slice(0, 7)}
      strategy='afterInteractive'
    />
  );
}
