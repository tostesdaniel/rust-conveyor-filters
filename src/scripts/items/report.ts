import fs from "node:fs/promises";

import {
  CONTAINER_TABLE_GAME_BUILD,
  containersNaming,
  isOutputContainer,
} from "@/lib/output-containers/container-table";

import type { IconChange } from "./icons";
import type { ItemSnapshot, SnapshotItem } from "./snapshot";

/** What the diff needs from the previous state, a snapshot or a DB export. */
export interface BaselineItem {
  itemId: number;
  shortname: string;
  name: string;
  description: string;
  category: string;
  insertable: boolean;
  redirectTo: number | null;
}

interface DbExportRow {
  itemid: number;
  shortname: string;
  name: string;
  description?: string;
  category: string;
  insertable?: boolean;
}

/** Reads either a snapshot or a JSON export of the `items` table. */
export async function readBaseline(file: string): Promise<BaselineItem[]> {
  const data = JSON.parse(await fs.readFile(file, "utf8")) as
    | ItemSnapshot
    | DbExportRow[];
  if (!Array.isArray(data)) return data.items;
  return data.map((row) => ({
    itemId: row.itemid,
    shortname: row.shortname,
    name: row.name,
    description: row.description ?? "",
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
  redescribed: { item: SnapshotItem; from: string }[];
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
    redescribed: [],
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
    if (old.description !== item.description) {
      diff.redescribed.push({ item, from: old.description });
    }
  }

  return diff;
}

const code = (s: string) => `\`${s}\``;

interface FlaggedItem {
  shortname: string;
  name: string;
  isContainer: boolean;
  namedBy: string[];
  changes: string[];
}

const STORAGE_CATEGORIES = ["Construction", "Items", "Electrical", "Misc"];
const STORAGE_HINT =
  /box|storage|barrel|locker|cabinet|fridge|coffin|chest|crate|stash|cupboard|furnace|oven|refinery|vending|shel(f|ves)/;

function containerTableChanges(diff: ItemDiff) {
  const { byShortname, byCategory } = containersNaming();
  const flagged = new Map<number, FlaggedItem>();

  function flag(
    item: { itemId: number; shortname: string; name: string },
    change: string,
    {
      previousShortname,
      categories = [],
    }: { previousShortname?: string; categories?: string[] } = {},
  ) {
    const shortnames = previousShortname
      ? [item.shortname, previousShortname]
      : [item.shortname];
    const isContainer = shortnames.some(isOutputContainer);
    const namedBy = new Set([
      ...shortnames.flatMap((s) => [...(byShortname.get(s) ?? [])]),
      ...categories.flatMap((c) => [...(byCategory.get(c) ?? [])]),
    ]);
    if (!isContainer && namedBy.size === 0) return;
    const entry = flagged.get(item.itemId) ?? {
      shortname: item.shortname,
      name: item.name,
      isContainer,
      namedBy: [],
      changes: [],
    };
    entry.isContainer ||= isContainer;
    entry.namedBy = [...new Set([...entry.namedBy, ...namedBy])];
    entry.changes.push(change);
    flagged.set(item.itemId, entry);
  }

  for (const i of diff.added) flag(i, "new in this game build");
  for (const i of diff.nowInsertable) flag(i, "insertable again");
  for (const i of diff.noLongerInsertable) flag(i, "no longer insertable");
  for (const i of diff.missingFromBuild) flag(i, "not in this game build");
  for (const { item, from } of diff.renamed) {
    flag(item, `renamed from ${from}`);
  }
  for (const { item, from } of diff.recategorized) {
    flag(item, `moved from ${from} to ${item.category}`, {
      categories: [from, item.category],
    });
  }
  for (const { item, from } of diff.reshortnamed) {
    flag(item, `shortname was ${code(from)}`, { previousShortname: from });
  }
  for (const { item } of diff.redescribed) flag(item, "description changed");

  const possibleStorage = diff.added.filter(
    (i) =>
      STORAGE_CATEGORIES.includes(i.category) &&
      STORAGE_HINT.test(i.shortname) &&
      !isOutputContainer(i.shortname),
  );

  return { changed: [...flagged.values()], possibleStorage };
}

const addedLine = (i: SnapshotItem) =>
  `- ${code(i.shortname)} ${i.name} (${i.category})`;

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

function containerTableSection(diff: ItemDiff, manifestId: string) {
  const { changed, possibleStorage } = containerTableChanges(diff);
  const count = changed.length + possibleStorage.length;
  if (count === 0) return [];

  const lines = [
    `### Container table (${count})`,
    "",
    `The Output container rules were read by hand from game build ${code(CONTAINER_TABLE_GAME_BUILD)}. This is game build ${code(manifestId)}. Recheck the rules for these items against the prefabs and the server code.`,
    "",
    ...changed.map((c) => {
      const role = [
        ...(c.isContainer ? ["container"] : []),
        ...(c.namedBy.length > 0
          ? [`named by ${c.namedBy.map(code).join(", ")}`]
          : []),
      ].join(", ");
      return `- ${code(c.shortname)} ${c.name} (${role}): ${c.changes.join("; ")}`;
    }),
  ];
  if (changed.length > 0) lines.push("");
  if (possibleStorage.length > 0) {
    lines.push(
      "New items that look like storage. The item JSON can't show whether one takes a Storage Adaptor, so check for a storage adaptor socket in its prefab and add it to the table if it has one:",
      "",
      ...possibleStorage.map(addedLine),
      "",
    );
  }
  return lines;
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

  const lines = [
    "## Item update",
    "",
    `Game build ${code(manifestId)}${previousManifestId ? `, previously ${code(previousManifestId)}` : ""}.`,
    `${insertable.length} of ${items.length} items are insertable. Icons: ${bySource("cdn").length} from the CDN, ${bySource("game").length} from the game, ${noIcon.length} placeholders.`,
    "",
  ];

  if (diff) {
    lines.push(
      ...section("Added", diff.added.map(addedLine)),
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
      ...section(
        "Description changed",
        diff.redescribed.map(
          ({ item, from }) =>
            `- ${code(item.shortname)} ${from} → ${item.description}`,
        ),
      ),
    );
  }

  if (diff) lines.push(...containerTableSection(diff, manifestId));

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
