/**
 * The strip of new item icons attached to a Discord item update, built from
 * the icons the image already ships in public/items.
 */
import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const ICONS_DIR = path.join(process.cwd(), "public", "items", "medium");
const ICON = 80;
const PADDING = 8;
const COLUMNS = 8;
const MAX_ICONS = COLUMNS * 5;
const BACKGROUND = { r: 0x02, g: 0x06, b: 0x18, alpha: 1 };

export function gridSize(count: number) {
  const columns = Math.min(count, COLUMNS);
  const rows = Math.ceil(count / COLUMNS);
  return {
    width: columns * ICON + (columns + 1) * PADDING,
    height: rows * ICON + (rows + 1) * PADDING,
  };
}

/** Null when none of the icons are on disk, which leaves the post text-only. */
export async function buildIconGrid(
  shortnames: string[],
): Promise<Buffer | null> {
  const found: { input: Buffer; left: number; top: number }[] = [];

  for (const shortname of shortnames.slice(0, MAX_ICONS)) {
    let icon: Buffer;
    try {
      icon = await fs.readFile(path.join(ICONS_DIR, `${shortname}.webp`));
    } catch {
      continue;
    }
    const index = found.length;
    found.push({
      input: await sharp(icon).resize(ICON, ICON).png().toBuffer(),
      left: (index % COLUMNS) * (ICON + PADDING) + PADDING,
      top: Math.floor(index / COLUMNS) * (ICON + PADDING) + PADDING,
    });
  }

  if (found.length === 0) return null;

  const { width, height } = gridSize(found.length);
  return sharp({
    create: { width, height, channels: 4, background: BACKGROUND },
  })
    .composite(found)
    .png()
    .toBuffer();
}
