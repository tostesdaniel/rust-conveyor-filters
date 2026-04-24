import { createHash } from "node:crypto";

/**
 * Stable hash over the fields a player can edit that change a filter's
 * meaning. Used to skip re-categorization on cosmetic edits (e.g. reordering
 * items or bumping min/max without changing the item-set).
 */
export function computeFilterContentHash(input: {
  name: string;
  description: string | null;
  itemShortnames: string[];
  categoryNames: string[];
}): string {
  const parts = [
    input.name.toLowerCase().trim(),
    (input.description ?? "").toLowerCase().trim(),
    [...input.itemShortnames].sort().join(","),
    [...input.categoryNames].sort().join(","),
  ];
  return createHash("sha256").update(parts.join("\n")).digest("hex");
}
