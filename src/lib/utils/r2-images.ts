type ImageSize = "tiny" | "small" | "medium" | "full";

const R2_BUCKET_URL = process.env.NEXT_PUBLIC_R2_BUCKET_URL;

/**
 * Generates a URL for an image stored in Cloudflare R2
 * @param imageName - The name of the image file (e.g., 'rifle.bolt.webp')
 * @param size - The size variant of the image ('tiny', 'small', 'medium', 'full')
 * @returns The complete URL to the image in R2
 */
export function getR2ImageUrl(imageName: string, size: ImageSize): string {
  return `${R2_BUCKET_URL}/items/${size}/${imageName}`;
}
