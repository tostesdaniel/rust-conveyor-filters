import createMDX from "@next/mdx";

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  pageExtensions: ["js", "jsx", "mdx", "ts", "tsx"],
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "cdn.rustconveyorfilters.com" },
      { protocol: "https", hostname: "images.steamusercontent.com" },
    ],
    minimumCacheTTL: 2678400, // 31 days
  },
};

const withMDX = createMDX();

export default withMDX(nextConfig);
