import "server-only";

import { db } from "@/db";

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

/** Icon rows for the given shortnames, in the order asked. */
export async function getItemIconRows(
  shortnames: readonly string[],
): Promise<ItemIconRow[]> {
  const rows = await db.query.items.findMany({
    columns: {
      shortname: true,
      name: true,
      imagePath: true,
      iconVersion: true,
    },
    where: (items, { and, eq, inArray }) =>
      and(
        inArray(items.shortname, [...shortnames]),
        eq(items.insertable, true),
      ),
  });
  const byShortname = new Map(rows.map((row) => [row.shortname, row]));
  return shortnames.flatMap((shortname) => {
    const row = byShortname.get(shortname);
    return row ? [row] : [];
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
