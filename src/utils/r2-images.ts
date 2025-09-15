type ImageSize = "tiny" | "small" | "medium" | "full";

/**
 * Generates a URL for an image stored in Cloudflare R2
 * @param imageName - The name of the image file (e.g., 'rifle.bolt.webp')
 * @param size - The size variant of the image ('tiny', 'small', 'medium', 'full')
 * @returns The complete URL to the image in R2
 */
export function getR2ImageUrl(imageName: string, size: ImageSize): string {
  if (process.env.NODE_ENV === "development") {
    return `/items/${size}/${imageName}`;
  }
  return `https://cdn.rustconveyorfilters.com/items/${size}/${imageName}`;
}
