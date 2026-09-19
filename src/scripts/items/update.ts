/**
 * Rebuilds the Item snapshot from the dedicated-server depot and takes CDN
 * icons for it. Exits early when the game build hasn't changed.
 *
 *   bun items:update [--force] [--baseline <snapshot or items table export>]
 */
import { execFile } from "node:child_process";
import fs from "node:fs/promises";
import path from "node:path";
import { parseArgs, promisify } from "node:util";

import { CACHE_DIR, fetchItemFiles, probeManifestId } from "./depot";
import { takeCdnIcons } from "./icons";
import { diffItems, readBaseline, renderReport } from "./report";
import {
  buildItems,
  hashItemData,
  readItemJson,
  readSnapshot,
  writeSnapshot,
  type ItemFlags,
} from "./snapshot";

const execFileAsync = promisify(execFile);

async function extractFlags(bundlePath: string) {
  const python =
    process.env.PYTHON ?? (process.platform === "win32" ? "python" : "python3");
  const { stdout } = await execFileAsync(
    python,
    [path.join(import.meta.dirname, "extract_flags.py"), bundlePath],
    { maxBuffer: 64 * 1024 * 1024 },
  );
  return JSON.parse(stdout) as ItemFlags[];
}

async function main() {
  const { values } = parseArgs({
    options: {
      force: { type: "boolean", default: false },
      baseline: { type: "string" },
    },
  });

  const previous = await readSnapshot();
  if (previous && !values.force) {
    const manifestId = await probeManifestId();
    if (manifestId === previous.gameBuild.manifestId) {
      console.error(`game build ${manifestId} is already in the snapshot`);
      return;
    }
  }

  const { manifestId, itemsDir, bundlePath } = await fetchItemFiles();
  const flags = await extractFlags(bundlePath);
  const items = buildItems(
    flags,
    await readItemJson(itemsDir),
    previous?.items ?? [],
  );
  const { hash: itemDataHash } = await hashItemData(itemsDir);

  console.error(
    `taking CDN icons for ${items.filter((i) => i.insertable).length} items`,
  );
  const iconChanges = await takeCdnIcons(items);

  await writeSnapshot({ gameBuild: { manifestId, itemDataHash }, items });

  const baseline = values.baseline
    ? await readBaseline(values.baseline)
    : previous?.items;
  const report = renderReport({
    previousManifestId: previous?.gameBuild.manifestId ?? null,
    manifestId,
    items,
    diff: baseline ? diffItems(baseline, items) : null,
    iconChanges,
  });
  const reportPath = path.join(CACHE_DIR, "report.md");
  await fs.writeFile(reportPath, report);
  console.log(report);
  console.error(`report written to ${reportPath}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
