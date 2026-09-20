/**
 * The corner badges stamped onto each icon in a Discord item update, so the
 * grid reads as a changelog.
 *
 * Path data is copied from Lucide (https://lucide.dev): merge and refresh-cw
 * under Lucide's ISC license, plus and minus under Feather's MIT license,
 * both reproduced in THIRD-PARTY-NOTICES.md.
 */
import sharp from "sharp";

export type BadgeKind = "added" | "removed" | "merged" | "redrawn";

/** The disc matches the grid background. */
const DISC = "#020618";

const BADGES: Record<BadgeKind, { color: string; paths: string[] }> = {
  added: { color: "#22c55e", paths: ["M5 12h14", "M12 5v14"] },
  removed: { color: "#ef4444", paths: ["M5 12h14"] },
  merged: {
    color: "#f59e0b",
    paths: [
      "m8 6 4-4 4 4",
      "M12 2v10.3a4 4 0 0 1-1.172 2.872L4 22",
      "m20 22-5-5",
    ],
  },
  redrawn: {
    color: "#38bdf8",
    paths: [
      "M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8",
      "M21 3v5h-5",
      "M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16",
      "M8 16H3v5",
    ],
  },
};

/** Lucide draws on a 24px grid, inset here to leave the disc a visible rim. */
const GLYPH_INSET = 2;
/**
 * Width after the inset scale, not before, since scaling the group scales the
 * stroke too. Anything past Lucide's own 2 closes refresh-cw into a blob at
 * badge size.
 */
const STROKE = 2;

function svg(kind: BadgeKind, size: number) {
  const { color, paths } = BADGES[kind];
  const inner = 24 - GLYPH_INSET * 2;
  const d = paths.map((p) => `<path d="${p}"/>`).join("");
  return Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24">` +
      `<circle cx="12" cy="12" r="12" fill="${DISC}"/>` +
      `<g transform="translate(${GLYPH_INSET} ${GLYPH_INSET}) scale(${inner / 24})" ` +
      `fill="none" stroke="${color}" stroke-width="${STROKE / (inner / 24)}" ` +
      `stroke-linecap="round" stroke-linejoin="round">` +
      `${d}</g></svg>`,
  );
}

export function renderBadge(kind: BadgeKind, size: number) {
  return sharp(svg(kind, size)).png().toBuffer();
}
