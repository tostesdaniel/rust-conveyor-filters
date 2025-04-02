import createMDX from "@next/mdx";

/** @type {import('next').NextConfig} */
const nextConfig = {
  pageExtensions: ["js", "jsx", "mdx", "ts", "tsx"],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: `${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com`,
      },
      { protocol: "https", hostname: "steamuserimages-a.akamaihd.net" },
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
