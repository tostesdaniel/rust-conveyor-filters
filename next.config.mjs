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
  rewrites: async () => {
    return [
      {
        source: "/api/script.js",
        destination: `${process.env.NEXT_PUBLIC_RYBBIT_HOST}/api/script.js`,
      },
      {
        source: "/api/track",
        destination: `${process.env.NEXT_PUBLIC_RYBBIT_HOST}/api/track`,
      },
    ];
  },
};

const withMDX = createMDX();

export default withMDX(nextConfig);
