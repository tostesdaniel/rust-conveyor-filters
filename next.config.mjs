import createMDX from "@next/mdx";

/** @type {import('next').NextConfig} */
const nextConfig = {
  pageExtensions: ["js", "jsx", "mdx", "ts", "tsx"],
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.steamusercontent.com" },
      { protocol: "https", hostname: "cdn.rustconveyorfilters.com" },
    ],
    minimumCacheTTL: 2678400, // 31 days
  },
  rewrites: async () => [
    {
      source: "/script.js",
      destination: "https://umami.rustconveyorfilters.com/script.js",
    },
    {
      source: "/api/send",
      destination: "https://umami.rustconveyorfilters.com/api/send",
    },
  ],
};

const withMDX = createMDX();

export default withMDX(nextConfig);
