import Script from "next/script";

export function Analytics() {
  if (process.env.NODE_ENV !== "production") {
    return null;
  }

  return (
    <Script
      src={`${process.env.NEXT_PUBLIC_RYBBIT_HOST}/api/script.js`}
      data-site-id='1'
      data-track-errors='true'
      strategy='afterInteractive'
    />
  );
}
