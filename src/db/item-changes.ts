/**
 * The part of a snapshot sync a player would notice, which is what the Discord
 * post is built from. Row counts like `updated` are useless there: a build
 * that only bumps icon versions changes 871 rows and nothing anyone can see.
 */
import type { SnapshotItem } from "@/scripts/items/snapshot";

import type { ItemSyncPlan } from "./item-sync";
import type { Item } from "./schema";

export interface ChangedItem {
  shortname: string;
  name: string;
}

export interface RemovedItem extends ChangedItem {
  /** Display name of the item saved filters moved to, when the game merged this one. */
  mergedInto: string | null;
}

export interface RenamedItem extends ChangedItem {
  from: string;
}

export interface ItemUpdateChanges {
  manifestId: string;
  added: ChangedItem[];
  removed: RemovedItem[];
  renamed: RenamedItem[];
  redrawn: ChangedItem[];
  /** Saved filters the repoint touched, not rows. */
  filtersChanged: number;
}

export function hasVisibleChanges(changes: ItemUpdateChanges) {
  return (
    changes.added.length > 0 ||
    changes.removed.length > 0 ||
    changes.renamed.length > 0 ||
    changes.redrawn.length > 0
  );
}

export function describeChanges(
  manifestId: string,
  plan: ItemSyncPlan,
  rows: Item[],
  snapshot: SnapshotItem[],
  filtersChanged: number,
): ItemUpdateChanges {
  const before = new Map(rows.map((r) => [r.itemId, r]));
  const nameOf = new Map(snapshot.map((i) => [i.itemId, i.name]));
  const redirectOf = new Map(snapshot.map((i) => [i.itemId, i.redirectTo]));

  const changes: ItemUpdateChanges = {
    manifestId,
    added: [],
    removed: [],
    renamed: [],
    redrawn: [],
    filtersChanged,
  };

  for (const row of plan.inserts) {
    if (row.insertable) changes.added.push(named(row));
  }

  for (const row of plan.updates) {
    const old = before.get(row.itemId)!;
    if (!old.insertable && row.insertable) {
      changes.added.push(named(row));
      continue;
    }
    if (old.insertable && !row.insertable) {
      const target = redirectOf.get(row.itemId);
      changes.removed.push({
        ...named(row),
        mergedInto: target ? (nameOf.get(target) ?? null) : null,
      });
      continue;
    }
    if (!row.insertable) continue;
    if (old.name !== row.name) {
      changes.renamed.push({ ...named(row), from: old.name });
      // A rename carries its own line, so its icon isn't counted twice.
    } else if (old.iconVersion && old.iconVersion !== row.iconVersion) {
      changes.redrawn.push(named(row));
    }
  }

  for (const itemId of plan.retire) {
    const old = before.get(itemId);
    if (old) changes.removed.push({ ...named(old), mergedInto: null });
  }

  return changes;
}

function named(row: { shortname: string; name: string }): ChangedItem {
  return { shortname: row.shortname, name: row.name };
}
