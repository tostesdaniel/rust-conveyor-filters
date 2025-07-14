/**
 * Constructs the API URL based on the environment.
 *
 * @param {string} endpoint - The API endpoint to append to the base URL (e.g. "steam-guide").
 * @returns {string} The full API URL.
 */
export function getApiUrl(endpoint: string): string {
  const environment: string | undefined = process.env.NODE_ENV;
  if (environment === "production") {
    return `https://rustconveyorfilters.com/api/${endpoint}`;
  }
  if (environment === "preview") {
    const vercelUrl: string | undefined = process.env.VERCEL_URL;
    if (!vercelUrl) {
      throw new Error("VERCEL_URL is not defined in preview environment");
    }
    return `https://${vercelUrl}/api/${endpoint}`;
  }
  return `http://localhost:3000/api/${endpoint}`;
}
