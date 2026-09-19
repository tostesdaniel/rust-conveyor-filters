import type { SnapshotItem } from "@/scripts/items/snapshot";
import { describe, expect, it } from "vitest";

import { planItemSync, redirectPairs, toRow } from "./item-sync";
import type { Item } from "./schema";

function item(
  overrides: Partial<SnapshotItem> & { itemId: number; shortname: string },
): SnapshotItem {
  return {
    name: overrides.shortname.toUpperCase(),
    category: "Items",
    insertable: true,
    hidden: false,
    redirectTo: null,
    icon: null,
    ...overrides,
  };
}

function row(snapshotItem: SnapshotItem, id: number): Item {
  return { id, ...toRow(snapshotItem) } as Item;
}

const light = item({ itemId: 1, shortname: "industrial.wall.light" });
const redLight = item({
  itemId: 2,
  shortname: "industrial.wall.light.red",
  insertable: false,
  redirectTo: 1,
});
const barrel = item({
  itemId: 3,
  shortname: "box.wooden",
  hidden: true,
  insertable: false,
});
const barrelSkin = item({
  itemId: 4,
  shortname: "storage_barrel_b",
  redirectTo: 3,
});

describe("redirectPairs", () => {
  it("moves a non-insertable redirect to its insertable target", () => {
    expect(redirectPairs([light, redLight])).toEqual([{ from: 2, to: 1 }]);
  });

  it("leaves force-shown redirects alone", () => {
    expect(redirectPairs([barrel, barrelSkin])).toEqual([]);
  });

  it("never moves rows onto a hidden target", () => {
    const hiddenTarget = { ...light, insertable: false, hidden: true };
    expect(redirectPairs([hiddenTarget, redLight])).toEqual([]);
  });
});

describe("planItemSync", () => {
  it("is empty when the table already matches", () => {
    const snapshot = [light, redLight];
    const rows = snapshot.map((i, n) => row(i, n + 1));
    expect(planItemSync(snapshot, rows, new Set())).toEqual({
      inserts: [],
      updates: [],
      retire: [],
      repoints: [],
    });
  });

  it("inserts new items and updates changed ones", () => {
    const renamed = { ...light, name: "Industrial Light" };
    const plan = planItemSync([renamed, redLight], [row(light, 1)], new Set());
    expect(plan.inserts).toEqual([toRow(redLight)]);
    expect(plan.updates).toEqual([toRow(renamed)]);
  });

  it("updates an item that stopped being insertable", () => {
    const plan = planItemSync(
      [light, redLight],
      [row(light, 1), row({ ...redLight, insertable: true }, 2)],
      new Set(),
    );
    expect(plan.updates).toEqual([toRow(redLight)]);
  });

  it("retires insertable rows the snapshot dropped, and only those", () => {
    const gone = item({ itemId: 9, shortname: "gone" });
    const goneHidden = item({
      itemId: 10,
      shortname: "gone.hidden",
      insertable: false,
    });
    const plan = planItemSync(
      [light],
      [row(light, 1), row(gone, 2), row(goneHidden, 3)],
      new Set(),
    );
    expect(plan.retire).toEqual([9]);
    expect(plan.inserts).toEqual([]);
    expect(plan.updates).toEqual([]);
  });

  it("repoints only redirects a saved filter still holds", () => {
    const blueLight = {
      ...redLight,
      itemId: 5,
      shortname: "industrial.wall.light.blue",
    };
    const snapshot = [light, redLight, blueLight];
    const rows = snapshot.map((i, n) => row(i, n + 1));
    expect(planItemSync(snapshot, rows, new Set([5])).repoints).toEqual([
      { from: 5, to: 1 },
    ]);
  });
});
