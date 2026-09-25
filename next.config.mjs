import createMDX from "@next/mdx";

const rybbitHost = process.env.NEXT_PUBLIC_RYBBIT_HOST;

const RYBBIT_PROXY_PATHS = [
  "script.js",
  "replay.js",
  "metrics.js",
  "track",
  "identify",
  "session-replay/record/:siteId",
  "site/tracking-config/:siteId",
];

const clerk = [
  "https://*.clerk.accounts.dev",
  "https://clerk.rustconveyorfilters.com",
  "https://challenges.cloudflare.com",
];

const googleAnalytics = [
  "https://www.googletagmanager.com",
  "https://*.google-analytics.com",
  "https://*.analytics.google.com",
];

const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline' ${[...clerk, ...googleAnalytics, "https://s.nitropay.com"].join(" ")}`,
  "style-src 'self' 'unsafe-inline'",
  `img-src 'self' data: blob: https://cdn.rustconveyorfilters.com https://images.steamusercontent.com https://img.clerk.com ${googleAnalytics.join(" ")}`,
  "font-src 'self' data:",
  `connect-src 'self' ${[...clerk, ...googleAnalytics].join(" ")}`,
  "worker-src 'self' blob:",
  `frame-src 'self' ${clerk.join(" ")}`,
  "form-action 'self'",
  "frame-ancestors 'self'",
  "base-uri 'self'",
  "object-src 'none'",
].join("; ");

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  pageExtensions: ["js", "jsx", "mdx", "ts", "tsx"],
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "cdn.rustconveyorfilters.com" },
      { protocol: "https", hostname: "images.steamusercontent.com" },
      { protocol: "https", hostname: "img.clerk.com" },
    ],
    localPatterns: [{ pathname: "/items/**" }, { pathname: "/**", search: "" }],
    minimumCacheTTL: 2678400, // 31 days
    qualities: [75, 90, 100],
  },
  headers: async () => {
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
          { key: "X-Content-Type-Options", value: "nosniff" },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=(), payment=()",
          },
          { key: "X-DNS-Prefetch-Control", value: "on" },
          // No report-uri, so violations only reach the browser console. Watch
          // one there before enforcing: NitroPay fans out to ad origins that
          // cannot be listed from source, and a wrong Clerk host kills sign-in.
          { key: "Content-Security-Policy-Report-Only", value: csp },
        ],
      },
    ];
  },
  rewrites: async () => {
    if (!rybbitHost) return [];
    return RYBBIT_PROXY_PATHS.map((path) => ({
      source: `/analytics/${path}`,
      destination: `${rybbitHost}/api/${path}`,
    }));
  },
};

const withMDX = createMDX();

export default withMDX(nextConfig);
