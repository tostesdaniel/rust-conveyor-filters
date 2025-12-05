import { sql } from "drizzle-orm";

const TSQUERY_RESERVED_CHARS = /[!&|:()*'"\\]+/g;

/**
 * Converts a human-entered search string into a safe PostgreSQL tsquery.
 * We strip characters that have special meaning to the tsquery parser
 * (e.g. backslashes, quotes, boolean operators) so malformed input cannot
 * crash the query executor.
 */
export function createTsQuery(query: string) {
  const sanitized = query
    .normalize("NFKC")
    .replace(TSQUERY_RESERVED_CHARS, " ")
    .trim();

  // Split on whitespace after sanitization and rebuild the tsquery using ANDs.
  const tokens = sanitized.split(/\s+/).filter(Boolean);

  if (tokens.length === 0) {
    // Fall back to an empty tsquery which never matches rather than throwing.
    return sql`plainto_tsquery('english', '')`;
  }

  const tsQuery = tokens.join(" & ");

  return sql`to_tsquery('english', ${tsQuery})`;
}
