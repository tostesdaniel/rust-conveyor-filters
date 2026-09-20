import { createHash } from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";

export const SNAPSHOT_PATH = path.join(
  process.cwd(),
  "src",
  "db",
  "item-snapshot.json",
);

export type IconSource = "game" | "cdn";

export interface SnapshotIcon {
  /** Hash of the source pixels, so a local run can skip identical game icons. */
  fingerprint: string;
  source: IconSource;
  takenAt: string;
}

export interface SnapshotItem {
  itemId: number;
  shortname: string;
  name: string;
  description: string;
  category: string;
  insertable: boolean;
  hidden: boolean;
  redirectTo: number | null;
  icon: SnapshotIcon | null;
}

export interface GameBuild {
  manifestId: string;
  itemDataHash: string;
}

export interface ItemSnapshot {
  gameBuild: GameBuild;
  items: SnapshotItem[];
}

/** One row per ItemDefinition, as printed by extract_flags.py. */
export interface ItemFlags {
  itemId: number;
  shortname: string;
  hidden: boolean;
  redirectTo: number | null;
  forceShowInConveyorFilter: boolean;
  blueprintForceShowInConveyorFilter: boolean;
}

/** The fields of a `Bundles/items/*.json` file the snapshot keeps. */
export interface ItemJson {
  itemid: number;
  shortname: string;
  Name: string;
  /** Null on 12 items, the boats and the wallpapers among them. */
  Description: string | null;
  Category: string;
}

export function isInsertable(flags: ItemFlags) {
  if (flags.forceShowInConveyorFilter) return true;
  if (flags.hidden) return false;
  // The storage barrel and shelf skins redirect to hidden base items, so
  // their blueprint flag is the only thing keeping them in the picker.
  return flags.redirectTo === null || flags.blueprintForceShowInConveyorFilter;
}

/**
 * The JSON dump carries files the game never loads, like car module copies
 * spelled by display name and a plushie with no ItemDefinition. Only
 * `<shortname>.json` for a real definition counts.
 */
export function buildItems(
  flags: ItemFlags[],
  jsonByFile: Map<string, ItemJson>,
  previous: SnapshotItem[],
): SnapshotItem[] {
  const previousIcons = new Map(previous.map((i) => [i.itemId, i.icon]));

  const items = flags.map((f): SnapshotItem => {
    const json = jsonByFile.get(`${f.shortname}.json`);
    if (!json || json.itemid !== f.itemId) {
      throw new Error(`no item JSON matches ${f.shortname} (${f.itemId})`);
    }
    return {
      itemId: f.itemId,
      shortname: f.shortname,
      name: json.Name,
      description: json.Description ?? "",
      category: json.Category,
      insertable: isInsertable(f),
      hidden: f.hidden,
      redirectTo: f.redirectTo,
      icon: previousIcons.get(f.itemId) ?? null,
    };
  });

  return items.sort((a, b) => a.shortname.localeCompare(b.shortname, "en"));
}

/**
 * A local icon run compares its install's hash against the snapshot's to
 * prove Steam already patched it to that build.
 */
export async function hashItemData(itemsDir: string, bundlePath: string) {
  const files = (await fs.readdir(itemsDir))
    .filter((f) => f.endsWith(".json"))
    .sort();
  const hash = createHash("sha256");
  for (const file of files) {
    const content = await fs.readFile(path.join(itemsDir, file));
    hash.update(file).update("\0").update(content).update("\0");
  }
  hash.update(await fs.readFile(bundlePath));
  return { hash: hash.digest("hex"), fileCount: files.length };
}

export async function readItemJson(itemsDir: string) {
  const files = (await fs.readdir(itemsDir)).filter((f) => f.endsWith(".json"));
  const byFile = new Map<string, ItemJson>();
  for (const file of files) {
    const raw = await fs.readFile(path.join(itemsDir, file), "utf8");
    byFile.set(file, JSON.parse(raw.replace(/^﻿/, "")) as ItemJson);
  }
  return byFile;
}

export async function readSnapshot(
  file = SNAPSHOT_PATH,
): Promise<ItemSnapshot | null> {
  try {
    return JSON.parse(await fs.readFile(file, "utf8")) as ItemSnapshot;
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === "ENOENT") return null;
    throw err;
  }
}

/** One item per line, so a monthly PR diff reads as a list of changed items. */
export function serializeSnapshot(snapshot: ItemSnapshot) {
  const items = snapshot.items.map((i) => `    ${JSON.stringify(i)}`);
  return [
    "{",
    `  "gameBuild": ${JSON.stringify(snapshot.gameBuild)},`,
    `  "items": [`,
    items.join(",\n"),
    "  ]",
    "}",
    "",
  ].join("\n");
}

export async function writeSnapshot(
  snapshot: ItemSnapshot,
  file = SNAPSHOT_PATH,
) {
  await fs.writeFile(file, serializeSnapshot(snapshot));
}
