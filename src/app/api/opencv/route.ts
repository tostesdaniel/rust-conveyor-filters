import { promises as fs } from "fs";
import { createRequire } from "module";

export async function GET() {
  try {
    const require = createRequire(import.meta.url);
    const resolved = require.resolve("opencv.js");
    const content = await fs.readFile(resolved, "utf8");

let cached: string | null = null;

    if (cached === null) {
      const require = createRequire(import.meta.url);
      cached = await fs.readFile(require.resolve("opencv.js"), "utf8");
    }

    return new Response(cached, {
      headers: {
        "Content-Type": "application/javascript; charset=utf-8",
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch (err) {
    console.error("Failed to serve opencv.js from node_modules", err);
    return new Response("/* failed to load opencv.js */", {
      status: 500,
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  }
}
