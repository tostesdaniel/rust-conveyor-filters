import type { MetadataRoute } from "next";
import { getPublicCreatorSitemapEntries } from "@/data/creator-public";

import { siteConfig } from "@/config/site";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = `${siteConfig.url}`;
  const lastModified = new Date().toISOString();

  const staticEntries: MetadataRoute.Sitemap = [
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

  let creatorEntries: MetadataRoute.Sitemap = [];
  try {
    const creators = await getPublicCreatorSitemapEntries();
    creatorEntries = creators.map((creator) => ({
      url: `${baseUrl}/users/${encodeURIComponent(creator.username)}`,
      lastModified: creator.lastModified.toISOString(),
    }));
  } catch {
    // Never let a data hiccup break the sitemap; serve the static entries.
    creatorEntries = [];
  }

  return [...staticEntries, ...creatorEntries];
}
