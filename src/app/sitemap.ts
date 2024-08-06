import type { MetadataRoute } from "next";

import { siteConfig } from "@/config/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = `${siteConfig.url}`;
  const lastModified = new Date().toISOString();
  return [
    { url: baseUrl, lastModified },
    { url: `${baseUrl}/filters`, lastModified },
    { url: `${baseUrl}/feedback`, lastModified },
    { url: `${baseUrl}/about`, lastModified },
  ];
}
