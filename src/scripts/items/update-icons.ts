/**
 * Refreshes Item icons without touching the item data.
 *
 *   bun items:icons           CDN icons newer than the stored ones
 *   bun items:icons --local   every icon whose pixels differ in the game install
 *
 * RUST_DIR overrides the install path for --local.
 */
import fs from "node:fs/promises";
import path from "node:path";
import { parseArgs } from "node:util";

import { CACHE_DIR } from "./depot";
import { takeCdnIcons, takeGameIcons } from "./icons";
import { renderReport } from "./report";
import { hashItemData, readSnapshot, writeSnapshot } from "./snapshot";

const RUST_DIR =
  process.env.RUST_DIR ?? "C:/Program Files (x86)/Steam/steamapps/common/Rust";

async function main() {
  const { values } = parseArgs({
    options: { local: { type: "boolean", default: false } },
  });

  const snapshot = await readSnapshot();
  if (!snapshot)
    throw new Error("no item snapshot yet, run items:update first");

  let iconChanges;
  if (values.local) {
    const itemsDir = path.join(RUST_DIR, "Bundles", "items");
    const { hash } = await hashItemData(itemsDir);
    // An install Steam hasn't patched yet would stamp last month's sprites as
    // fresh, and the CDN could then never replace them.
    if (hash !== snapshot.gameBuild.itemDataHash) {
      throw new Error(
        `the item data in ${itemsDir} doesn't match game build ${snapshot.gameBuild.manifestId}. ` +
          "Update Rust in Steam, or run items:update if the snapshot is behind.",
      );
    }
    iconChanges = await takeGameIcons(snapshot.items, itemsDir, new Date());
  } else {
    iconChanges = await takeCdnIcons(snapshot.items);
  }

  await writeSnapshot(snapshot);

  const report = renderReport({
    previousManifestId: null,
    manifestId: snapshot.gameBuild.manifestId,
    items: snapshot.items,
    diff: null,
    iconChanges,
  });
  const reportPath = path.join(CACHE_DIR, "icons-report.md");
  await fs.mkdir(CACHE_DIR, { recursive: true });
  await fs.writeFile(reportPath, report);
  console.log(report);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
