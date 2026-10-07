import "server-only";

import { db } from "@/db";
import bundledSnapshot from "@/db/item-snapshot.json";
import type { ItemSnapshot } from "@/scripts/items/snapshot";

import type { Item } from "@/db/schema";

export async function getItems() {
  return await db.query.items.findMany({
    where: (items, { eq }) => eq(items.insertable, true),
    orderBy: (items, { asc }) => [asc(items.name)],
  });
}

export type ItemIcons = ReadonlyMap<string, string | null>;

let itemIconsPromise: Promise<ItemIcons> | null = null;

/**
 * Icon version by image path, for every insertable item. Filter covers only
 * store the path, so this is where they get their version. Items only change
 * when the boot sync runs, so the cache lives as long as the process.
 */
export async function getItemIcons(): Promise<ItemIcons> {
  if (!itemIconsPromise) {
    itemIconsPromise = db.query.items
      .findMany({
        columns: { imagePath: true, iconVersion: true },
        where: (items, { eq }) => eq(items.insertable, true),
      })
      .then(
        (rows) => new Map(rows.map((row) => [row.imagePath, row.iconVersion])),
      );

    itemIconsPromise.catch(() => {
      itemIconsPromise = null;
    });
  }

  return itemIconsPromise;
}

export type ItemIconRow = Pick<
  Item,
  "shortname" | "name" | "imagePath" | "iconVersion"
>;

/** Icon rows in the order asked from the snapshot. */
export function getItemIconRows(shortnames: readonly string[]): ItemIconRow[] {
  const { items } = bundledSnapshot as ItemSnapshot;
  return shortnames.flatMap((shortname) => {
    const item = items.find(
      (item) => item.shortname === shortname && item.insertable,
    );
    if (!item) return [];
    return [
      {
        shortname: item.shortname,
        name: item.name,
        imagePath: item.shortname,
        iconVersion: item.icon?.fingerprint ?? null,
      },
    ];
  });
}

export async function getOutputContainerItemId(shortname: string) {
  const item = await db.query.items.findFirst({
    columns: { id: true },
    where: (items, { and, eq }) =>
      and(eq(items.shortname, shortname), eq(items.insertable, true)),
  });
  return item?.id ?? null;
}
