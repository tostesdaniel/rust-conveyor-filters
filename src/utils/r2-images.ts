export type ImageSize = "tiny" | "small" | "medium" | "full";

/**
 * Generates a URL for an image stored in Cloudflare R2
 * @param imageName - The name of the image file (e.g., 'rifle.bolt.webp')
 * @param size - The size variant of the image ('tiny', 'small', 'medium', 'full')
 * @param version - The item's icon version. The CDN caches icons as immutable
 * for a year, so a redraw only reaches browsers under a new URL.
 * @returns The complete URL to the image in R2
 */
export function getR2ImageUrl(
  imageName: string,
  size: ImageSize,
  version?: string | null,
): string {
  const query = version ? `?v=${version}` : "";
  if (process.env.NODE_ENV === "development") {
    return `/items/${size}/${imageName}${query}`;
  }
  return `https://cdn.rustconveyorfilters.com/items/${size}/${imageName}${query}`;
}
