/**
 * Posts an item update to the Discord announcement channel once the items are
 * live, from the rows `syncItemSnapshot` queues.
 */
import type { ItemUpdateChanges, RemovedItem } from "@/db/item-changes";
import { asc, eq, isNull, sql } from "drizzle-orm";
import type { NodePgQueryResultHKT } from "drizzle-orm/node-postgres";
import type { PgDatabase } from "drizzle-orm/pg-core";

import { itemAnnouncements } from "@/db/schema";
import type * as schema from "@/db/schema";

import { buildIconGrid, type GridEntry } from "./item-icon-grid";
import { fetchLatestRustNews, type RustNewsPost } from "./rust-news";

type Db = PgDatabase<NodePgQueryResultHKT, typeof schema>;

const DISCORD_TOKEN = process.env.DISCORD_TOKEN;
const CHANNEL_ID = process.env.DISCORD_ITEM_UPDATES_CHANNEL_ID;
const ROLE_ID = process.env.DISCORD_ITEM_UPDATES_ROLE_ID;

const ANNOUNCE_LOCK = 7_106_318_543;

const EMBED_COLOR = 0xe8_b1_30;
const EMBED_DESCRIPTION_MAX = 4096;
const SITE_URL = "https://rustconveyorfilters.com";
const GRID_FILENAME = "item-changes.png";

const MAX_ANNOUNCEMENT_AGE_MS = 3 * 24 * 60 * 60 * 1000;

const MARKDOWN_CHARS = /[\\*_~`|>[\]]/g;

function escapeMarkdown(raw: string) {
  return raw.replace(MARKDOWN_CHARS, "\\$&");
}

function section(heading: string, lines: string[]) {
  return lines.length === 0 ? [] : [`**${heading}**`, ...lines, ""];
}

function nameList(items: { name: string }[], max = 40) {
  const shown = items.slice(0, max).map((i) => escapeMarkdown(i.name));
  const rest = items.length - shown.length;
  return [rest > 0 ? `${shown.join(", ")} and ${rest} more` : shown.join(", ")];
}

function bulletList<T>(items: T[], line: (item: T) => string, max = 20) {
  const rest = items.length - max;
  return [
    ...items.slice(0, max).map(line),
    ...(rest > 0 ? [`- and ${rest} more`] : []),
  ];
}

/**
 * One paragraph per target rather than a line per item, so items
 * that redirect to the same target won't be listed multiple times.
 */
function mergeGroups(merged: RemovedItem[], max = 20) {
  const byTarget = new Map<string, RemovedItem[]>();
  for (const item of merged.slice(0, max)) {
    const target = item.mergedInto!;
    byTarget.set(target, [...(byTarget.get(target) ?? []), item]);
  }

  const rest = merged.length - max;
  return [
    ...[...byTarget].flatMap(([target, items], i) => [
      ...(i > 0 ? [""] : []),
      `Filters with the following items now contain **${escapeMarkdown(target)}** instead:`,
      nameList(items)[0],
    ]),
    ...(rest > 0 ? ["", `and ${rest} more merged elsewhere`] : []),
  ];
}

export function buildDescription(changes: ItemUpdateChanges) {
  const merged = changes.removed.filter((i) => i.mergedInto !== null);
  const lines = [
    ...section(
      `➕ New in the conveyor picker (${changes.added.length})`,
      changes.added.length > 0 ? nameList(changes.added) : [],
    ),
    ...section(
      `➖ Removed from the picker (${changes.removed.length})`,
      bulletList(changes.removed, (i) => `- ${escapeMarkdown(i.name)}`),
    ),
    ...section(
      `➡️ Merged into another item (${merged.length})`,
      mergeGroups(merged),
    ),
    ...section(
      `✏️ Renamed (${changes.renamed.length})`,
      bulletList(
        changes.renamed,
        (i) => `- ${escapeMarkdown(i.from)} → ${escapeMarkdown(i.name)}`,
      ),
    ),
  ];

  if (changes.redrawn.length > 0) {
    lines.push(
      `🔄 ${changes.redrawn.length} icons now match the game's new art.`,
    );
  }

  const description = lines.join("\n").trim();
  return description.length > EMBED_DESCRIPTION_MAX
    ? `${description.slice(0, EMBED_DESCRIPTION_MAX - 1)}…`
    : description;
}

/** Added first, then what left, then what only changed its art. */
export function gridEntries(changes: ItemUpdateChanges): GridEntry[] {
  return [
    ...changes.added.map((i) => ({
      shortname: i.shortname,
      kind: "added" as const,
    })),
    ...changes.removed.map<GridEntry>((i) => ({
      shortname: i.shortname,
      kind: i.mergedInto ? "merged" : "removed",
    })),
    ...changes.redrawn.map((i) => ({
      shortname: i.shortname,
      kind: "redrawn" as const,
    })),
  ];
}

export function buildMessage({
  changes,
  news,
  hasGrid,
  roleId,
}: {
  changes: ItemUpdateChanges;
  news: RustNewsPost | null;
  hasGrid: boolean;
  roleId?: string;
}) {
  return {
    content: roleId ? `<@&${roleId}>` : undefined,
    allowed_mentions: { parse: [], roles: roleId ? [roleId] : [] },
    embeds: [
      {
        color: EMBED_COLOR,
        title: news ? `Items updated: ${news.title}` : "Items updated",
        url: news?.link ?? SITE_URL,
        description: buildDescription(changes),
        image: hasGrid ? { url: `attachment://${GRID_FILENAME}` } : undefined,
        footer: { text: "rustconveyorfilters.com" },
        timestamp: new Date().toISOString(),
      },
    ],
  };
}

async function post(changes: ItemUpdateChanges) {
  const grid = await buildIconGrid(gridEntries(changes));
  const message = buildMessage({
    changes,
    news: await fetchLatestRustNews(),
    hasGrid: grid !== null,
    roleId: ROLE_ID,
  });

  const form = new FormData();
  form.append("payload_json", JSON.stringify(message));
  if (grid) {
    form.append(
      "files[0]",
      new Blob([new Uint8Array(grid)], { type: "image/png" }),
      GRID_FILENAME,
    );
  }

  const res = await fetch(
    `https://discord.com/api/v10/channels/${CHANNEL_ID}/messages`,
    {
      method: "POST",
      headers: { Authorization: `Bot ${DISCORD_TOKEN}` },
      body: form,
    },
  );
  if (!res.ok) {
    throw new Error(`Discord item update failed: ${await res.text()}`);
  }

  const { id } = (await res.json()) as { id: string };
  await publish(id);
}

async function publish(messageId: string) {
  try {
    const res = await fetch(
      `https://discord.com/api/v10/channels/${CHANNEL_ID}/messages/${messageId}/crosspost`,
      { method: "POST", headers: { Authorization: `Bot ${DISCORD_TOKEN}` } },
    );
    if (!res.ok) {
      console.warn(`items: crosspost failed, ${await res.text()}`);
    }
  } catch (err) {
    console.warn("items: crosspost failed", err);
  }
}

/**
 * Posts every queued announcement that hasn't gone out. Called on boot after
 * the sync, so a post that failed last time gets another try.
 */
export async function postPendingItemUpdates(db: Db) {
  if (!DISCORD_TOKEN || !CHANNEL_ID) return;

  await db.transaction(async (tx) => {
    await tx.execute(sql`select pg_advisory_xact_lock(${ANNOUNCE_LOCK})`);
    const pending = await tx
      .select()
      .from(itemAnnouncements)
      .where(isNull(itemAnnouncements.postedAt))
      .orderBy(asc(itemAnnouncements.createdAt));

    for (const row of pending) {
      const stale =
        Date.now() - row.createdAt.getTime() > MAX_ANNOUNCEMENT_AGE_MS;
      if (stale) {
        console.warn(
          `items: game build ${row.manifestId} is too old to announce`,
        );
      } else {
        await post(row.changes);
        console.log(`items: announced game build ${row.manifestId}`);
      }
      await tx
        .update(itemAnnouncements)
        .set({ postedAt: new Date() })
        .where(eq(itemAnnouncements.manifestId, row.manifestId));
    }
  });
}
