/**
 * Uploads every icon in public/items that R2 lacks or holds different bytes
 * for. Runs on push to main.
 *
 *   bun items:upload [--dry-run]
 *
 * Needs CLOUDFLARE_ACCOUNT_ID, R2_ACCESS_KEY_ID and R2_SECRET_ACCESS_KEY.
 */
import { parseArgs } from "node:util";

import {
  listBucketIcons,
  pendingUploads,
  r2Client,
  readLocalIcons,
  uploadIcon,
} from "./bucket";
import { mapConcurrent } from "./icons";

const UPLOAD_CONCURRENCY = 16;

async function main() {
  const { values } = parseArgs({
    options: { "dry-run": { type: "boolean", default: false } },
  });

  const client = r2Client();
  const [local, remote] = await Promise.all([
    readLocalIcons(),
    listBucketIcons(client),
  ]);
  const pending = pendingUploads(local, remote);
  console.log(
    `${local.length} local icons, ${remote.size} in the bucket, ${pending.length} to upload`,
  );
  if (pending.length === 0 || values["dry-run"]) {
    for (const icon of pending) console.log(`  ${icon.key}`);
    return;
  }

  await mapConcurrent(pending, UPLOAD_CONCURRENCY, async (icon) => {
    await uploadIcon(client, icon);
    console.log(`  ${icon.key}`);
  });
  console.log(`uploaded ${pending.length} icons`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
