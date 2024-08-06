import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: "/", lastModified: new Date().toISOString() },
    { url: "/filters", lastModified: new Date().toISOString() },
    { url: "/feedback", lastModified: new Date().toISOString() },
    { url: "/about", lastModified: new Date().toISOString() },
  ];
}
