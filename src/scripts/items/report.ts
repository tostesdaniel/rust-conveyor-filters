import fs from "node:fs/promises";

import type { IconChange } from "./icons";
import type { ItemSnapshot, SnapshotItem } from "./snapshot";

/** What the diff needs from the previous state, a snapshot or a DB export. */
export interface BaselineItem {
  itemId: number;
  shortname: string;
  name: string;
  category: string;
  insertable: boolean;
  redirectTo: number | null;
}

interface DbExportRow {
  itemid: number;
  shortname: string;
  name: string;
  category: string;
  insertable?: boolean;
}

/**
 * Reads either a snapshot or a JSON export of the `items` table. The first
 * run has no snapshot, so it diffs against what prod holds.
 */
export async function readBaseline(file: string): Promise<BaselineItem[]> {
  const data = JSON.parse(await fs.readFile(file, "utf8")) as
    | ItemSnapshot
    | DbExportRow[];
  if (!Array.isArray(data)) return data.items;
  return data.map((row) => ({
    itemId: row.itemid,
    shortname: row.shortname,
    name: row.name,
    category: row.category,
    insertable: row.insertable ?? true,
    redirectTo: null,
  }));
}

export interface ItemDiff {
  added: SnapshotItem[];
  missingFromBuild: BaselineItem[];
  nowInsertable: SnapshotItem[];
  noLongerInsertable: SnapshotItem[];
  renamed: { item: SnapshotItem; from: string }[];
  recategorized: { item: SnapshotItem; from: string }[];
  reshortnamed: { item: SnapshotItem; from: string }[];
}

export function diffItems(
  baseline: BaselineItem[],
  items: SnapshotItem[],
): ItemDiff {
  const before = new Map(baseline.map((i) => [i.itemId, i]));
  const after = new Set(items.map((i) => i.itemId));
  const diff: ItemDiff = {
    added: [],
    missingFromBuild: baseline.filter((i) => !after.has(i.itemId)),
    nowInsertable: [],
    noLongerInsertable: [],
    renamed: [],
    recategorized: [],
    reshortnamed: [],
  };

  for (const item of items) {
    const old = before.get(item.itemId);
    if (!old) {
      if (item.insertable) diff.added.push(item);
      continue;
    }
    if (!old.insertable && item.insertable) diff.nowInsertable.push(item);
    if (old.insertable && !item.insertable) diff.noLongerInsertable.push(item);
    if (!item.insertable) continue;
    if (old.name !== item.name) diff.renamed.push({ item, from: old.name });
    if (old.category !== item.category) {
      diff.recategorized.push({ item, from: old.category });
    }
    if (old.shortname !== item.shortname) {
      diff.reshortnamed.push({ item, from: old.shortname });
    }
  }

  return diff;
}

function whyNotInsertable(item: SnapshotItem, byId: Map<number, SnapshotItem>) {
  if (item.redirectTo !== null) {
    return `redirects to \`${byId.get(item.redirectTo)?.shortname}\``;
  }
  return item.hidden ? "hidden" : "not insertable";
}

function section(title: string, lines: string[]) {
  if (lines.length === 0) return [];
  return [`### ${title} (${lines.length})`, "", ...lines, ""];
}

export function renderReport({
  previousManifestId,
  manifestId,
  items,
  diff,
  iconChanges,
}: {
  previousManifestId: string | null;
  manifestId: string;
  items: SnapshotItem[];
  diff: ItemDiff | null;
  iconChanges: IconChange[];
}) {
  const byId = new Map(items.map((i) => [i.itemId, i]));
  const insertable = items.filter((i) => i.insertable);
  const noIcon = insertable.filter((i) => i.icon === null);
  const bySource = (s: string) =>
    insertable.filter((i) => i.icon?.source === s);
  const code = (s: string) => `\`${s}\``;

  const lines = [
    "## Item update",
    "",
    `Game build ${code(manifestId)}${previousManifestId ? `, previously ${code(previousManifestId)}` : ""}.`,
    `${insertable.length} of ${items.length} items are insertable. Icons: ${bySource("cdn").length} from the CDN, ${bySource("game").length} from the game, ${noIcon.length} placeholders.`,
    "",
  ];

  if (diff) {
    lines.push(
      ...section(
        "Added",
        diff.added.map(
          (i) => `- ${code(i.shortname)} ${i.name} (${i.category})`,
        ),
      ),
      ...section(
        "Insertable again",
        diff.nowInsertable.map((i) => `- ${code(i.shortname)} ${i.name}`),
      ),
      ...section(
        "No longer insertable",
        diff.noLongerInsertable.map(
          (i) =>
            `- ${code(i.shortname)} ${i.name}: ${whyNotInsertable(i, byId)}`,
        ),
      ),
      ...section(
        "Not in this game build",
        diff.missingFromBuild.map((i) => `- ${code(i.shortname)} ${i.name}`),
      ),
      ...section(
        "Renamed",
        diff.renamed.map(
          ({ item, from }) =>
            `- ${code(item.shortname)} ${from} → ${item.name}`,
        ),
      ),
      ...section(
        "Recategorized",
        diff.recategorized.map(
          ({ item, from }) =>
            `- ${code(item.shortname)} ${from} → ${item.category}`,
        ),
      ),
      ...section(
        "Shortname changed",
        diff.reshortnamed.map(
          ({ item, from }) => `- ${code(from)} → ${code(item.shortname)}`,
        ),
      ),
    );
  }

  const changed = iconChanges.filter((c) => !c.isNew);
  lines.push(
    ...section(
      "Icons changed",
      changed.map((c) => `- ${code(c.shortname)} from the ${c.source}`),
    ),
    ...section(
      "Icons needed",
      noIcon.map((i) => `- ${code(i.shortname)} ${i.name}`),
    ),
  );

  return lines.join("\n");
}
