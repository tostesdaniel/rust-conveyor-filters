import { promises as fs } from "fs";
import { createRequire } from "module";

export async function GET() {
  try {
    const require = createRequire(import.meta.url);
    const resolved = require.resolve("opencv.js");
    const content = await fs.readFile(resolved, "utf8");

    return new Response(content, {
      headers: {
        "Content-Type": "application/javascript; charset=utf-8",
        "Cache-Control": "public, max-age=0, must-revalidate",
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
