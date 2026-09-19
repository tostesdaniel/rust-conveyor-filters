import sharp from "sharp";
import { describe, expect, it } from "vitest";

import { decodeIcon, fingerprint, isCdnNewer, looksSame } from "./icons";

function drawing(size: number, fill: string, shape = "circle") {
  const body =
    shape === "circle"
      ? `<circle cx="50" cy="50" r="30" fill="${fill}"/>`
      : `<rect x="20" y="30" width="60" height="40" fill="${fill}"/>`;
  return sharp(
    Buffer.from(
      `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 100 100">${body}</svg>`,
    ),
  )
    .png()
    .toBuffer();
}

describe("isCdnNewer", () => {
  const stored = {
    fingerprint: "x",
    source: "game" as const,
    takenAt: "2026-09-18T12:00:00.000Z",
  };

  it("takes any CDN icon when nothing is stored", () => {
    expect(isCdnNewer(null, new Date("2020-01-01"))).toBe(true);
  });

  it("keeps a game icon over older CDN art", () => {
    expect(isCdnNewer(stored, new Date("2026-06-11T00:06:08Z"))).toBe(false);
  });

  it("takes CDN art published after the stored icon was taken", () => {
    expect(isCdnNewer(stored, new Date("2026-10-01T00:00:00Z"))).toBe(true);
  });
});

describe("decodeIcon", () => {
  it("keeps icons smaller than 512 px at their own size", async () => {
    const icon = await decodeIcon(await drawing(256, "#c83232"));
    expect(icon.size).toBe(256);
    expect(icon.pixels.length).toBe(256 * 256 * 4);
  });

  it("downscales larger icons to 512 px", async () => {
    expect((await decodeIcon(await drawing(1024, "#c83232"))).size).toBe(512);
  });

  it("crops the transparent frame off 514 px icons instead of resampling", async () => {
    const art = await drawing(512, "#c83232");
    const framed = await sharp(art)
      .extend({
        top: 1,
        bottom: 1,
        left: 1,
        right: 1,
        background: { r: 0, g: 0, b: 0, alpha: 0 },
      })
      .png()
      .toBuffer();
    expect(fingerprint(await decodeIcon(framed))).toBe(
      fingerprint(await decodeIcon(art)),
    );
  });

  it("gives re-encodes of the same pixels the same fingerprint", async () => {
    const png = await drawing(512, "#c83232");
    const uncompressed = await sharp(png)
      .png({ compressionLevel: 0 })
      .toBuffer();
    expect(fingerprint(await decodeIcon(png))).toBe(
      fingerprint(await decodeIcon(uncompressed)),
    );
  });
});

describe("looksSame", () => {
  it("matches the same art shipped at a different resolution", async () => {
    const small = await decodeIcon(await drawing(256, "#c83232"));
    const large = await decodeIcon(await drawing(1024, "#c83232"));
    expect(await looksSame(small, large)).toBe(true);
  });

  it("matches a lossy WebP copy of the same icon", async () => {
    const png = await drawing(512, "#3264c8");
    const webp = await sharp(png).webp({ quality: 90 }).toBuffer();
    expect(await looksSame(await decodeIcon(png), await decodeIcon(webp))).toBe(
      true,
    );
  });

  it("ignores the colour under fully transparent pixels", async () => {
    const clear = (r: number, g: number) =>
      sharp({
        create: {
          width: 512,
          height: 512,
          channels: 4,
          background: { r, g, b: 0, alpha: 0 },
        },
      })
        .png()
        .toBuffer();
    expect(
      await looksSame(
        await decodeIcon(await clear(255, 0)),
        await decodeIcon(await clear(0, 255)),
      ),
    ).toBe(true);
  });

  it("tells a redrawn icon apart", async () => {
    const before = await decodeIcon(await drawing(512, "#c83232"));
    const recoloured = await decodeIcon(await drawing(512, "#32c832"));
    const reshaped = await decodeIcon(await drawing(512, "#c83232", "rect"));
    expect(await looksSame(before, recoloured)).toBe(false);
    expect(await looksSame(before, reshaped)).toBe(false);
  });
});
