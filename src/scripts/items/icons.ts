import { createHash } from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

import type { IconSource, SnapshotIcon, SnapshotItem } from "./snapshot";

const ICON_SIZE = 512;
const PUBLIC_DIR = path.join(process.cwd(), "public", "items");
const SIZES = [
  { name: "tiny", size: 24 },
  { name: "small", size: 48 },
  { name: "medium", size: 80 },
  { name: "full", size: ICON_SIZE },
] as const;

// Game icons shipped at 256 or 1024 px land up to 2.9 away from the CDN's 512
// copy of the same art once resampled. The smallest real redraw measured was
// 5.25 (rifle.sks, September 2026).
const COMPARE_SIZE = 128;
const SAME_ICON_THRESHOLD = 4;

const CDN_URL = "https://files.facepunch.com/rust/item";
const CDN_CONCURRENCY = 16;

export interface DecodedIcon {
  pixels: Buffer;
  size: number;
}

export interface IconChange {
  shortname: string;
  source: IconSource;
  isNew: boolean;
}

/**
 * Decodes an icon to square RGBA, at most 512 px. Smaller icons keep their
 * size: the CDN's 512 px copies of the game's 256 px icons are blurry
 * upscales, so there's nothing to gain from making our own.
 */
export async function decodeIcon(input: Buffer): Promise<DecodedIcon> {
  const image = sharp(input).ensureAlpha();
  const { width = 0, height = 0 } = await image.metadata();
  const size = Math.min(Math.max(width, height), ICON_SIZE);

  // The 514 px icons are 512 px art in a transparent 1 px frame, and
  // cropping it keeps them sharper than resampling.
  if (width === ICON_SIZE + 2 && height === ICON_SIZE + 2) {
    image.extract({ left: 1, top: 1, width: ICON_SIZE, height: ICON_SIZE });
  } else if (width !== size || height !== size) {
    image.resize(size, size, {
      fit: "contain",
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    });
  }

  const pixels = await image.raw().toBuffer();
  // Re-encoded PNGs disagree on the colour under fully transparent pixels.
  for (let i = 0; i < pixels.length; i += 4) {
    if (pixels[i + 3] === 0) pixels.fill(0, i, i + 3);
  }
  return { pixels, size };
}

export function fingerprint({ pixels, size }: DecodedIcon) {
  return createHash("sha256")
    .update(`${size}:`)
    .update(pixels)
    .digest("hex")
    .slice(0, 16);
}

function fromRaw({ pixels, size }: DecodedIcon) {
  return sharp(pixels, { raw: { width: size, height: size, channels: 4 } });
}

/** Mean per-channel difference at 128 px, premultiplied so RGB under transparent pixels doesn't count. */
export async function iconDistance(a: DecodedIcon, b: DecodedIcon) {
  const [x, y] = await Promise.all(
    [a, b].map((i) =>
      fromRaw(i).resize(COMPARE_SIZE, COMPARE_SIZE).raw().toBuffer(),
    ),
  );
  let sum = 0;
  for (let i = 0; i < x.length; i += 4) {
    const xa = x[i + 3] / 255;
    const ya = y[i + 3] / 255;
    for (let c = 0; c < 3; c++) sum += Math.abs(x[i + c] * xa - y[i + c] * ya);
    sum += Math.abs(x[i + 3] - y[i + 3]);
  }
  return sum / x.length;
}

export async function looksSame(a: DecodedIcon, b: DecodedIcon) {
  return (await iconDistance(a, b)) < SAME_ICON_THRESHOLD;
}

async function readStoredIcon(shortname: string) {
  try {
    const file = await fs.readFile(
      path.join(PUBLIC_DIR, "full", `${shortname}.webp`),
    );
    return await decodeIcon(file);
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === "ENOENT") return null;
    throw err;
  }
}

async function storeIcon(
  item: SnapshotItem,
  icon: DecodedIcon,
  source: IconSource,
  takenAt: Date,
): Promise<IconChange> {
  const full = path.join(PUBLIC_DIR, "full", `${item.shortname}.webp`);
  const isNew = await fs.access(full).then(
    () => false,
    () => true,
  );

  for (const { name, size } of SIZES) {
    const dir = path.join(PUBLIC_DIR, name);
    await fs.mkdir(dir, { recursive: true });
    const target = Math.min(size, icon.size);
    const image = fromRaw(icon);
    if (target !== icon.size) image.resize(target, target);
    await image
      .webp({ quality: 90 })
      .toFile(path.join(dir, `${item.shortname}.webp`));
  }

  item.icon = {
    fingerprint: fingerprint(icon),
    source,
    takenAt: takenAt.toISOString(),
  };
  return { shortname: item.shortname, source, isNew };
}

/**
 * The CDN kept serving old art for sprites the game redrew, so it only beats
 * a stored icon it was published after. Otherwise every CDN pass would undo
 * the last local run.
 */
export function isCdnNewer(stored: SnapshotIcon | null, lastModified: Date) {
  return stored === null || lastModified > new Date(stored.takenAt);
}

async function mapConcurrent<T>(
  items: T[],
  limit: number,
  fn: (item: T) => Promise<void>,
) {
  let next = 0;
  const workers = Array.from({ length: limit }, async () => {
    while (next < items.length) await fn(items[next++]);
  });
  await Promise.all(workers);
}

/** Mutates `items` in place with the icons it took. */
export async function takeCdnIcons(items: SnapshotItem[]) {
  const changes: IconChange[] = [];
  const failures: string[] = [];

  await mapConcurrent(
    items.filter((i) => i.insertable),
    CDN_CONCURRENCY,
    async (item) => {
      // BunnyCDN only answers 304 when If-Modified-Since equals Last-Modified
      // exactly. That holds for icons taken from the CDN, whose takenAt is
      // that header. Game icons carry the local run's time and still get a
      // 200, so the date check below stays.
      const headers: HeadersInit = item.icon
        ? { "If-Modified-Since": new Date(item.icon.takenAt).toUTCString() }
        : {};
      const res = await fetch(`${CDN_URL}/${item.shortname}_512.png`, {
        headers,
      });
      if (res.status === 304 || res.status === 404) {
        await res.body?.cancel();
        return;
      }
      if (!res.ok) {
        await res.body?.cancel();
        failures.push(`${item.shortname}: HTTP ${res.status}`);
        return;
      }

      const header = res.headers.get("last-modified");
      const lastModified = header ? new Date(header) : new Date();
      if (!isCdnNewer(item.icon, lastModified)) {
        await res.body?.cancel();
        return;
      }

      const icon = await decodeIcon(Buffer.from(await res.arrayBuffer()));
      const print = fingerprint(icon);
      if (print === item.icon?.fingerprint) return;

      // A resample of art we already store isn't worth a rewrite. An icon
      // committed before the snapshot existed only gets recorded.
      const stored = await readStoredIcon(item.shortname);
      if (stored && (await looksSame(stored, icon))) {
        item.icon ??= {
          fingerprint: print,
          source: "cdn",
          takenAt: lastModified.toISOString(),
        };
        return;
      }

      changes.push(await storeIcon(item, icon, "cdn", lastModified));
    },
  );

  if (failures.length > 0) {
    throw new Error(`CDN icon fetch failed:\n${failures.join("\n")}`);
  }
  return changes;
}

/**
 * Mutates `items` in place. The game install wins whenever its pixels differ,
 * since the CDN's copies are resamples of the game's at best.
 */
export async function takeGameIcons(
  items: SnapshotItem[],
  gameItemsDir: string,
  takenAt: Date,
) {
  const changes: IconChange[] = [];

  for (const item of items.filter((i) => i.insertable)) {
    let file: Buffer;
    try {
      file = await fs.readFile(
        path.join(gameItemsDir, `${item.shortname}.png`),
      );
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code === "ENOENT") continue;
      throw err;
    }

    const icon = await decodeIcon(file);
    if (fingerprint(icon) === item.icon?.fingerprint) continue;
    changes.push(await storeIcon(item, icon, "game", takenAt));
  }

  return changes;
}
