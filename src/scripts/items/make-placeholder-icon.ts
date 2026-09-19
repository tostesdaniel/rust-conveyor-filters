import path from "node:path";
import sharp from "sharp";

import { PLACEHOLDER_ICON } from "@/components/shared/item-icon";

const RUST_DIR =
  process.env.RUST_DIR ?? "C:/Program Files (x86)/Steam/steamapps/common/Rust";
const SOURCE = path.join(RUST_DIR, "Bundles/items/blueprintbase.png");
const PUBLIC_DIR = path.join(process.cwd(), "public", "items");

const SIZES = [
  { name: "tiny", size: 24, label: false },
  { name: "small", size: 48, label: false },
  { name: "medium", size: 80, label: true },
  { name: "full", size: 512, label: true },
] as const;

const label = Buffer.from(`
<svg width="512" height="512" xmlns="http://www.w3.org/2000/svg">
  <text x="256" y="275" text-anchor="middle" font-family="Arial, Helvetica, sans-serif"
    font-size="54" font-weight="900" fill="#ffffff" stroke="#1d1d1d" stroke-width="10"
    paint-order="stroke">PLACEHOLDER</text>
</svg>`);

async function main() {
  const base = await sharp(SOURCE)
    .resize(512, 512, { fit: "contain" })
    .png()
    .toBuffer();
  const labelled = await sharp(base)
    .composite([{ input: label }])
    .png()
    .toBuffer();

  for (const { name, size, label: withLabel } of SIZES) {
    const dest = path.join(PUBLIC_DIR, name, `${PLACEHOLDER_ICON}.webp`);
    await sharp(withLabel ? labelled : base)
      .resize(size, size)
      .webp({ quality: 90 })
      .toFile(dest);
    console.log(`wrote ${dest}`);
  }
}

main();
