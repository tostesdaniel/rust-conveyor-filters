import { createHash } from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import {
  ListObjectsV2Command,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";

export const ICONS_DIR = path.join(process.cwd(), "public", "items");
// getR2ImageUrl serves `items/<size>/<name>.webp` from this bucket.
const BUCKET = "rustconveyorfilters";
const KEY_PREFIX = "items/";

export interface LocalIcon {
  key: string;
  file: string;
  md5: string;
}

export function r2Client() {
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
  if (!accountId || !accessKeyId || !secretAccessKey) {
    throw new Error(
      "CLOUDFLARE_ACCOUNT_ID, R2_ACCESS_KEY_ID and R2_SECRET_ACCESS_KEY must be set",
    );
  }
  return new S3Client({
    region: "auto",
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId, secretAccessKey },
    // The SDK's default CRC32 headers aren't something R2 has always taken.
    // Uploads send Content-MD5 instead.
    requestChecksumCalculation: "WHEN_REQUIRED",
    responseChecksumValidation: "WHEN_REQUIRED",
  });
}

export async function readLocalIcons(dir = ICONS_DIR): Promise<LocalIcon[]> {
  const entries = await fs.readdir(dir, { recursive: true });
  const icons: LocalIcon[] = [];
  for (const entry of entries) {
    if (!entry.endsWith(".webp")) continue;
    const file = path.join(dir, entry);
    const md5 = createHash("md5")
      .update(await fs.readFile(file))
      .digest("hex");
    icons.push({
      key: KEY_PREFIX + entry.split(path.sep).join("/"),
      file,
      md5,
    });
  }
  return icons;
}

/** Key to ETag for everything under `items/`. */
export async function listBucketIcons(client: S3Client) {
  const etags = new Map<string, string>();
  let token: string | undefined;
  do {
    const page = await client.send(
      new ListObjectsV2Command({
        Bucket: BUCKET,
        Prefix: KEY_PREFIX,
        ContinuationToken: token,
      }),
    );
    for (const object of page.Contents ?? []) {
      if (object.Key && object.ETag) etags.set(object.Key, object.ETag);
    }
    token = page.IsTruncated ? page.NextContinuationToken : undefined;
  } while (token);
  return etags;
}

/**
 * Icons the bucket is missing or holds other bytes for. R2's ETag is the MD5
 * of a single-part upload. A multipart ETag never matches, which only costs a
 * re-upload. Nothing here deletes: filter covers name icons by plain string,
 * so an icon the site stopped listing can still be on screen.
 */
export function pendingUploads(
  local: LocalIcon[],
  remote: Map<string, string>,
): LocalIcon[] {
  return local.filter(
    (icon) =>
      remote.get(icon.key)?.replaceAll('"', "").toLowerCase() !== icon.md5,
  );
}

export async function uploadIcon(client: S3Client, icon: LocalIcon) {
  await client.send(
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: icon.key,
      Body: await fs.readFile(icon.file),
      ContentType: "image/webp",
      ContentMD5: Buffer.from(icon.md5, "hex").toString("base64"),
    }),
  );
}
