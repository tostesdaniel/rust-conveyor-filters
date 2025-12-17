// Cursor data structure - minimal, sort-specific
export interface CursorData {
  id: number;
  v: number | string; // value for current sort (popularityScore, createdAt timestamp, etc.)
  s: "p" | "n" | "u" | "m"; // sort type shorthand: p=popular, n=new, u=updated, m=mostUsed
}

/**
 * Convert a CursorData object into a URL-safe opaque string.
 *
 * @param cursor - CursorData containing `id`, `v`, and `s` used to build the cursor
 * @returns The base64url-encoded representation of the cursor
 */
export function encodeCursor(cursor: CursorData): string {
  const json = JSON.stringify(cursor);
  return Buffer.from(json).toString("base64url");
}

/**
 * Decode a base64url-encoded cursor string into a CursorData object.
 *
 * @param encoded - The base64url-encoded cursor string
 * @returns `CursorData` if decoding and validation succeed, `null` otherwise
 */
export function decodeCursor(encoded: string): CursorData | null {
  try {
    const json = Buffer.from(encoded, "base64url").toString("utf-8");
    const cursor = JSON.parse(json) as CursorData;

    // Validate structure
    if (
      typeof cursor.id !== "number" ||
      (typeof cursor.v !== "number" && typeof cursor.v !== "string") ||
      !["p", "n", "u", "m"].includes(cursor.s)
    ) {
      return null;
    }

    return cursor;
  } catch {
    return null;
  }
}
