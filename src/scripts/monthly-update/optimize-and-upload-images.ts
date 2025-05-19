import { exec } from "child_process";
import fs from "fs/promises";
import path from "path";
import { promisify } from "util";
import sharp from "sharp";

const execAsync = promisify(exec);

const SIZES = [
  { name: "tiny", size: 24 },
  { name: "small", size: 48 },
  { name: "medium", size: 80 },
  { name: "full", size: 512 },
] as const;

const SOURCE_DIR = path.join(__dirname, "items-sink");
const PUBLIC_DIR = path.join(process.cwd(), "public", "items");
const RCLONE_REMOTE = "rustconveyorfilters:items";

async function getImageFiles(dir: string): Promise<string[]> {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  return entries
    .filter((entry) => entry.isFile() && /\.(png)$/i.test(entry.name))
    .map((entry) => entry.name);
}

async function ensureDir(dir: string) {
  await fs.mkdir(dir, { recursive: true });
}

async function uploadToR2(localPath: string, remotePath: string) {
  const cmd = `rclone copyto --no-update-modtime ${localPath} ${remotePath}`;
  await execAsync(cmd);
}

async function processImage(imageName: string) {
  const srcPath = path.join(SOURCE_DIR, imageName);
  const baseName = path.parse(imageName).name;
  const webpName = `${baseName}.webp`;
  if (!webpName || webpName === ".webp") {
    console.warn(`Skipping invalid image name: ${imageName}`);
    return;
  }
  for (const { name, size } of SIZES) {
    const publicDir = path.join(PUBLIC_DIR, name);
    await ensureDir(publicDir);
    const destPath = path.join(publicDir, webpName);
    await sharp(srcPath)
      .resize(size, size, { fit: "cover" })
      .webp({ quality: 90 })
      .toFile(destPath);
    const r2Path = `${RCLONE_REMOTE}/${name}/${webpName}`;
    console.log(`Uploading to R2: ${r2Path}`);
    try {
      await uploadToR2(destPath, r2Path);
      console.log(`Uploaded ${name}/${webpName} to R2.`);
    } catch (err) {
      console.error(`Failed to upload ${name}/${webpName}:`, err);
    }
  }
}

async function main() {
  try {
    const images = await getImageFiles(SOURCE_DIR);
    if (images.length === 0) {
      console.log("No images found in source directory.");
      return;
    }
    console.log(`Processing ${images.length} images...`);
    for (const imageName of images) {
      try {
        await processImage(imageName);
        console.log(`Processed ${imageName}`);
      } catch (err) {
        console.error(`Error processing ${imageName}:`, err);
      }
    }
    console.log("All images processed.");
  } catch (err) {
    console.error("Fatal error:", err);
    process.exit(1);
  }
}

main();
