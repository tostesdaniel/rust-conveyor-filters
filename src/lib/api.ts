/**
 * Constructs the API URL based on the environment.
 *
 * @param {string} endpoint - The API endpoint to append to the base URL (e.g. "steam-guide").
 * @returns {string} The full API URL.
 */
export function getApiUrl(endpoint: string): string {
  const environment: string | undefined =
    process.env.NEXT_PUBLIC_VERCEL_ENV ?? process.env.NODE_ENV;

  if (environment === "production") {
    const productionUrl = process.env.NEXT_PUBLIC_VERCEL_PROJECT_PRODUCTION_URL;
    return `https://${productionUrl}/api/${endpoint}`;
  }
  if (environment === "preview") {
    const vercelUrl: string | undefined = process.env.NEXT_PUBLIC_VERCEL_URL;
    if (!vercelUrl) {
      throw new Error(
        "NEXT_PUBLIC_VERCEL_URL is not defined in preview environment",
      );
    }
    return `https://${vercelUrl}/api/${endpoint}`;
  }
  return `http://localhost:3000/api/${endpoint}`;
}
