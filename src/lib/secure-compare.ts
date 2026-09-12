import "server-only";

import { createHash, timingSafeEqual } from "node:crypto";

export function secureCompare(
  a: string | null | undefined,
  b: string | null | undefined,
): boolean {
  if (typeof a !== "string" || typeof b !== "string") {
    return false;
  }

  const digestA = createHash("sha256").update(a, "utf8").digest();
  const digestB = createHash("sha256").update(b, "utf8").digest();

  return timingSafeEqual(digestA, digestB);
}
