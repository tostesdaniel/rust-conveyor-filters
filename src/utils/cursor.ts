// Cursor data structure - minimal, sort-specific
export interface CursorData {
  id: number;
  v: number | string; // value for current sort (popularityScore, createdAt timestamp, etc.)
  s: "p" | "n" | "u" | "m"; // sort type shorthand: p=popular, n=new, u=updated, m=mostUsed
}

/**
 * Encode cursor to opaque base64 string for URL safety
 */
export function encodeCursor(cursor: CursorData): string {
  const json = JSON.stringify(cursor);
  return Buffer.from(json).toString("base64url");
}

/**
 * Decode cursor from base64 string
 * Returns null if decoding fails or data is invalid
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

