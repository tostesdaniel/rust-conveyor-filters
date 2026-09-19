import { execFile } from "node:child_process";
import fs from "node:fs/promises";
import path from "node:path";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

const APP_ID = "258550";
const DEPOT_ID = "258554";
const DEPOT_DOWNLOADER_VERSION = "3.4.0";

export const CACHE_DIR = path.join(
  process.cwd(),
  "node_modules",
  ".cache",
  "rust-items",
);
const TOOL_DIR = path.join(
  CACHE_DIR,
  `DepotDownloader-${DEPOT_DOWNLOADER_VERSION}`,
);
const DEPOT_DIR = path.join(CACHE_DIR, "depot");

// Forward slashes only. A backslash regex matches nothing and DepotDownloader
// still reports success.
const FILE_LIST = [
  "regex:^Bundles/items/.*\\.json$",
  "Bundles/shared/items.preload.bundle",
].join("\n");

// Fewer items means the filelist regex stopped matching, which DepotDownloader
// never reports.
const MIN_ITEM_FILES = 1000;

function releaseAsset() {
  const arch = process.arch === "arm64" ? "arm64" : "x64";
  switch (process.platform) {
    case "win32":
      return `windows-${arch}`;
    case "darwin":
      return `macos-${arch}`;
    default:
      return `linux-${arch}`;
  }
}

async function exists(p: string) {
  return fs.access(p).then(
    () => true,
    () => false,
  );
}

async function ensureDepotDownloader() {
  if (process.env.DEPOT_DOWNLOADER) return process.env.DEPOT_DOWNLOADER;

  const exe = path.join(
    TOOL_DIR,
    process.platform === "win32" ? "DepotDownloader.exe" : "DepotDownloader",
  );
  if (await exists(exe)) return exe;

  const url = `https://github.com/SteamRE/DepotDownloader/releases/download/DepotDownloader_${DEPOT_DOWNLOADER_VERSION}/DepotDownloader-${releaseAsset()}.zip`;
  console.error(`downloading ${url}`);
  const res = await fetch(url);
  if (!res.ok)
    throw new Error(`DepotDownloader download failed: ${res.status}`);

  await fs.mkdir(TOOL_DIR, { recursive: true });
  const zip = path.join(TOOL_DIR, "DepotDownloader.zip");
  await fs.writeFile(zip, Buffer.from(await res.arrayBuffer()));
  // Git Bash puts GNU tar first on PATH, which can't read zips.
  if (process.platform === "win32") {
    await execFileAsync("C:\\Windows\\System32\\tar.exe", [
      "-xf",
      zip,
      "-C",
      TOOL_DIR,
    ]);
  } else {
    await execFileAsync("unzip", ["-o", "-q", zip, "-d", TOOL_DIR]);
    await fs.chmod(exe, 0o755);
  }
  await fs.rm(zip);
  return exe;
}

function parseManifestId(output: string) {
  const match = output.match(/Manifest (\d+) \(/);
  if (!match)
    throw new Error(`no manifest ID in DepotDownloader output:\n${output}`);
  return match[1];
}

async function depotDownloader(args: string[]) {
  const exe = await ensureDepotDownloader();
  const { stdout } = await execFileAsync(
    exe,
    ["-app", APP_ID, "-depot", DEPOT_ID, ...args],
    { maxBuffer: 64 * 1024 * 1024 },
  );
  return stdout;
}

/** The current game build's manifest ID. Transfers no content. */
export async function probeManifestId() {
  const dir = path.join(CACHE_DIR, "manifest-probe");
  const stdout = await depotDownloader(["-manifest-only", "-dir", dir]);
  await fs.rm(dir, { recursive: true, force: true });
  return parseManifestId(stdout);
}

/** Re-runs only fetch changed chunks, since DepotDownloader keeps its state in DEPOT_DIR. */
export async function fetchItemFiles() {
  await fs.mkdir(DEPOT_DIR, { recursive: true });
  const fileList = path.join(CACHE_DIR, "filelist.txt");
  await fs.writeFile(fileList, FILE_LIST);

  const stdout = await depotDownloader([
    "-filelist",
    fileList,
    "-dir",
    DEPOT_DIR,
  ]);
  const manifestId = parseManifestId(stdout);

  const itemsDir = path.join(DEPOT_DIR, "Bundles", "items");
  const bundlePath = path.join(
    DEPOT_DIR,
    "Bundles",
    "shared",
    "items.preload.bundle",
  );
  const jsonCount = (await fs.readdir(itemsDir)).filter((f) =>
    f.endsWith(".json"),
  ).length;
  if (jsonCount < MIN_ITEM_FILES) {
    throw new Error(
      `expected at least ${MIN_ITEM_FILES} item JSON files, got ${jsonCount}`,
    );
  }
  if (!(await exists(bundlePath))) throw new Error(`missing ${bundlePath}`);

  return { manifestId, itemsDir, bundlePath };
}
