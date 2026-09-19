import type { ItemSnapshot, SnapshotItem } from "@/scripts/items/snapshot";
import { and, eq, inArray, sql } from "drizzle-orm";
import type { NodePgQueryResultHKT } from "drizzle-orm/node-postgres";
import type { PgDatabase } from "drizzle-orm/pg-core";

import bundledSnapshot from "./item-snapshot.json";
import type * as schema from "./schema";
import { filterItems, items, type Item, type NewItem } from "./schema";

type Db = PgDatabase<NodePgQueryResultHKT, typeof schema>;

// Only this sync takes it. Replicas booting together queue here instead of
// racing the filter_items repoint.
const SYNC_LOCK = 7_106_318_542;

/** Game item IDs: a redirect item whose saved filter rows move to its target. */
export interface Repoint {
  from: number;
  to: number;
}

export interface ItemSyncPlan {
  inserts: NewItem[];
  updates: NewItem[];
  /** Game item IDs of insertable rows the snapshot no longer has. */
  retire: number[];
  repoints: Repoint[];
}

export interface ItemSyncResult {
  manifestId: string;
  inserted: number;
  updated: number;
  retired: number;
  repointed: number;
  dropped: number;
}

export function toRow(item: SnapshotItem): NewItem {
  return {
    itemId: item.itemId,
    shortname: item.shortname,
    name: item.name,
    category: item.category,
    imagePath: item.shortname,
    insertable: item.insertable,
    iconVersion: item.icon?.fingerprint ?? null,
  };
}

function sameRow(a: NewItem, b: Item) {
  return (
    a.shortname === b.shortname &&
    a.name === b.name &&
    a.category === b.category &&
    a.imagePath === b.imagePath &&
    a.insertable === b.insertable &&
    a.iconVersion === b.iconVersion
  );
}

/**
 * Redirects whose target the picker still offers. A hidden target would move
 * saved rows onto an item nobody can see, so those stay put.
 */
export function redirectPairs(snapshot: SnapshotItem[]): Repoint[] {
  const insertable = new Set(
    snapshot.filter((i) => i.insertable).map((i) => i.itemId),
  );
  return snapshot
    .filter(
      (i) =>
        !i.insertable && i.redirectTo !== null && insertable.has(i.redirectTo),
    )
    .map((i) => ({ from: i.itemId, to: i.redirectTo! }));
}

/**
 * `referenced` is the redirect items some saved filter still holds. Going by
 * state rather than by what changed this build also catches redirects that
 * went non-insertable before the sync existed.
 */
export function planItemSync(
  snapshot: SnapshotItem[],
  rows: Item[],
  referenced: Set<number>,
): ItemSyncPlan {
  const byItemId = new Map(rows.map((r) => [r.itemId, r]));
  const plan: ItemSyncPlan = {
    inserts: [],
    updates: [],
    retire: [],
    repoints: redirectPairs(snapshot).filter((p) => referenced.has(p.from)),
  };

  for (const item of snapshot) {
    const row = toRow(item);
    const existing = byItemId.get(item.itemId);
    if (!existing) plan.inserts.push(row);
    else if (!sameRow(row, existing)) plan.updates.push(row);
  }

  const inSnapshot = new Set(snapshot.map((i) => i.itemId));
  plan.retire = rows
    .filter((r) => r.insertable && !inSnapshot.has(r.itemId))
    .map((r) => r.itemId);

  return plan;
}

function isEmpty(plan: ItemSyncPlan) {
  return (
    plan.inserts.length === 0 &&
    plan.updates.length === 0 &&
    plan.retire.length === 0 &&
    plan.repoints.length === 0
  );
}

async function readPlan(db: Db, snapshot: SnapshotItem[]) {
  const rows = await db.select().from(items);
  const sources = redirectPairs(snapshot).map((p) => p.from);
  const referenced =
    sources.length === 0
      ? []
      : await db
          .selectDistinct({ itemId: items.itemId })
          .from(filterItems)
          .innerJoin(items, eq(items.id, filterItems.itemId))
          .where(inArray(items.itemId, sources));
  return planItemSync(snapshot, rows, new Set(referenced.map((r) => r.itemId)));
}

async function applyPlan(tx: Db, plan: ItemSyncPlan) {
  const writes = [...plan.inserts, ...plan.updates];
  if (writes.length > 0) {
    await tx
      .insert(items)
      .values(writes)
      .onConflictDoUpdate({
        target: items.itemId,
        set: {
          shortname: sql`excluded.shortname`,
          name: sql`excluded.name`,
          category: sql`excluded.category`,
          imagePath: sql`excluded.image_path`,
          insertable: sql`excluded.insertable`,
          iconVersion: sql`excluded.icon_version`,
        },
      });
  }

  if (plan.retire.length > 0) {
    await tx
      .update(items)
      .set({ insertable: false })
      .where(inArray(items.itemId, plan.retire));
  }

  let repointed = 0;
  let dropped = 0;
  if (plan.repoints.length === 0) return { repointed, dropped };

  // Targets can be rows the upsert above just created.
  const ids = await tx
    .select({ id: items.id, itemId: items.itemId })
    .from(items)
    .where(
      inArray(
        items.itemId,
        plan.repoints.flatMap((p) => [p.from, p.to]),
      ),
    );
  const idOf = new Map(ids.map((r) => [r.itemId, r.id]));

  // One pair at a time: two colours of the same light in one filter both land
  // on the plain light, and the second has to see the first's row to drop.
  for (const { from, to } of plan.repoints) {
    const fromId = idOf.get(from)!;
    const toId = idOf.get(to)!;
    const deleted = await tx
      .delete(filterItems)
      .where(
        and(
          eq(filterItems.itemId, fromId),
          inArray(
            filterItems.filterId,
            tx
              .select({ filterId: filterItems.filterId })
              .from(filterItems)
              .where(eq(filterItems.itemId, toId)),
          ),
        ),
      );
    const moved = await tx
      .update(filterItems)
      .set({ itemId: toId })
      .where(eq(filterItems.itemId, fromId));
    dropped += deleted.rowCount ?? 0;
    repointed += moved.rowCount ?? 0;
  }

  return { repointed, dropped };
}

/**
 * Brings the items table in line with the snapshot this build shipped with.
 * Rows are never deleted, since saved filters reference them. Returns null
 * when there was nothing to do.
 */
export async function syncItemSnapshot(
  db: Db,
  snapshot: ItemSnapshot = bundledSnapshot as ItemSnapshot,
): Promise<ItemSyncResult | null> {
  // Unchanged boots stop here, without a transaction or the lock.
  if (isEmpty(await readPlan(db, snapshot.items))) return null;

  return db.transaction(async (tx) => {
    await tx.execute(sql`select pg_advisory_xact_lock(${SYNC_LOCK})`);
    // Another replica may have applied it while this one waited.
    const plan = await readPlan(tx, snapshot.items);
    if (isEmpty(plan)) return null;

    const { repointed, dropped } = await applyPlan(tx, plan);
    return {
      manifestId: snapshot.gameBuild.manifestId,
      inserted: plan.inserts.length,
      updated: plan.updates.length,
      retired: plan.retire.length,
      repointed,
      dropped,
    };
  });
}
