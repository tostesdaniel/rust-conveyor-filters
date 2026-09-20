/**
 * The changelog image attached to a Discord item update. Each icon displays
 * a corner badge for what happened to it, and each category gets its own row.
 */
import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

import { renderBadge, type BadgeKind } from "./item-badges";

const ICONS_DIR = path.join(process.cwd(), "public", "items", "medium");
const ICON = 80;
const PADDING = 8;
const COLUMNS = 8;
const BADGE = 30;
/** Keeps the badge clear of the cell edge so neighbours don't touch. */
const BADGE_INSET = 2;
const BACKGROUND = { r: 0x02, g: 0x06, b: 0x18, alpha: 1 };

const CAPS: Record<BadgeKind, number> = {
  added: 24,
  removed: 8,
  merged: 8,
  redrawn: 16,
};

export interface GridEntry {
  shortname: string;
  kind: BadgeKind;
}

const ROWS: BadgeKind[][] = [["added"], ["removed", "merged"], ["redrawn"]];

export function gridSize(columns: number, rows: number) {
  return {
    width: columns * ICON + (columns + 1) * PADDING,
    height: rows * ICON + (rows + 1) * PADDING,
  };
}

function capped(entries: GridEntry[]) {
  const taken: Record<string, number> = {};
  return entries.filter((e) => {
    taken[e.kind] = (taken[e.kind] ?? 0) + 1;
    return taken[e.kind] <= CAPS[e.kind];
  });
}

async function readIcon(shortname: string) {
  try {
    return await fs.readFile(path.join(ICONS_DIR, `${shortname}.webp`));
  } catch {
    return null;
  }
}

async function cell(entry: GridEntry, icon: Buffer) {
  const art = await sharp(icon).resize(ICON, ICON).png().toBuffer();
  const badge = await renderBadge(entry.kind, BADGE);
  return sharp({
    create: {
      width: ICON,
      height: ICON,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    },
  })
    .composite([
      { input: art, left: 0, top: 0 },
      {
        input: badge,
        left: ICON - BADGE - BADGE_INSET,
        top: ICON - BADGE - BADGE_INSET,
      },
    ])
    .png()
    .toBuffer();
}

/**
 * Null when none of the icons are on disk, which leaves the post text-only.
 * A category with nothing to show gets no row.
 */
export async function buildIconGrid(
  entries: GridEntry[],
): Promise<Buffer | null> {
  const wanted = capped(entries);
  const placed: { input: Buffer; left: number; top: number }[] = [];
  let row = 0;
  let widest = 0;

  for (const kinds of ROWS) {
    const group = wanted.filter((e) => kinds.includes(e.kind));
    let column = 0;

    for (const entry of group) {
      const icon = await readIcon(entry.shortname);
      if (!icon) continue;
      placed.push({
        input: await cell(entry, icon),
        left: (column % COLUMNS) * (ICON + PADDING) + PADDING,
        top: (row + Math.floor(column / COLUMNS)) * (ICON + PADDING) + PADDING,
      });
      column += 1;
    }

    if (column === 0) continue;
    widest = Math.max(widest, Math.min(column, COLUMNS));
    row += Math.ceil(column / COLUMNS);
  }

  if (placed.length === 0) return null;

  const { width, height } = gridSize(widest, row);

  return sharp({
    create: { width, height, channels: 4, background: BACKGROUND },
  })
    .composite(placed)
    .png()
    .toBuffer();
}
