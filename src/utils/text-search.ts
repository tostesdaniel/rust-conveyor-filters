import { sql } from "drizzle-orm";

/**
 * Converts a search query string into a PostgreSQL tsquery expression.
 *
 * @param query - The search query string to convert
 * @returns A SQL template literal for the tsquery
 */
export function createTsQuery(query: string) {
  const cleanQuery = query.trim().replace(/\s+/g, " & ");

  return sql`to_tsquery('english', ${cleanQuery})`;
}
