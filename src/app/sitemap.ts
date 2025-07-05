import type { MetadataRoute } from "next";

import { siteConfig } from "@/config/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = `${siteConfig.url}`;
  const lastModified = new Date().toISOString();

  return [
    { url: baseUrl, lastModified },
    { url: `${baseUrl}/filters`, lastModified },
    { url: `${baseUrl}/donate`, lastModified },
    { url: `${baseUrl}/feedback`, lastModified },
    { url: `${baseUrl}/about`, lastModified },
    { url: `${baseUrl}/steam-guide`, lastModified },
    {
      url: `${baseUrl}/privacy-policy`,
      lastModified: new Date("2024-08-24").toISOString(),
    },
    {
      url: `${baseUrl}/terms-of-service`,
      lastModified: new Date("2024-08-24").toISOString(),
    },
  ];
}
