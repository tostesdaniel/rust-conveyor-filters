import type { SnapshotItem } from "@/scripts/items/snapshot";
import { describe, expect, it } from "vitest";

import { describeChanges, hasVisibleChanges } from "./item-changes";
import { planItemSync, toRow } from "./item-sync";
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

function changesFor(snapshot: SnapshotItem[], rows: Item[], referenced = 0) {
  const plan = planItemSync(snapshot, rows, new Set<number>());
  return describeChanges("build-1", plan, rows, snapshot, referenced);
}

describe("describeChanges", () => {
  it("lists items the picker gained, whether new or unhidden", () => {
    const fresh = item({ itemId: 1, shortname: "door.charge", name: "Charge" });
    const unhidden = item({ itemId: 2, shortname: "photo", name: "Photo" });
    const rows = [row({ ...unhidden, insertable: false }, 2)];

    const changes = changesFor([fresh, unhidden], rows);

    expect(changes.added.map((i) => i.name)).toEqual(["Charge", "Photo"]);
  });

  it("names the item a removed one was merged into", () => {
    const light = item({ itemId: 1, shortname: "light", name: "Light" });
    const red = item({
      itemId: 2,
      shortname: "light.red",
      name: "Red Light",
      insertable: false,
      redirectTo: 1,
    });
    const rows = [row(light, 1), row({ ...red, insertable: true }, 2)];

    const changes = changesFor([light, red], rows);

    expect(changes.removed).toEqual([
      { shortname: "light.red", name: "Red Light", mergedInto: "Light" },
    ]);
  });

  it("reports an item missing from the build as removed", () => {
    const gone = item({ itemId: 9, shortname: "mlrs", name: "MLRS" });

    const changes = changesFor([], [row(gone, 9)]);

    expect(changes.removed).toEqual([
      { shortname: "mlrs", name: "MLRS", mergedInto: null },
    ]);
  });

  it("counts a redrawn icon but not a first one", () => {
    const redrawn = item({
      itemId: 1,
      shortname: "ak",
      icon: { fingerprint: "new", source: "cdn", takenAt: "" },
    });
    const first = item({
      itemId: 2,
      shortname: "bow",
      icon: { fingerprint: "first", source: "cdn", takenAt: "" },
    });
    const rows = [
      row(
        {
          ...redrawn,
          icon: { fingerprint: "old", source: "cdn", takenAt: "" },
        },
        1,
      ),
      row({ ...first, icon: null }, 2),
    ];

    const changes = changesFor([redrawn, first], rows);

    expect(changes.iconsRedrawn).toBe(1);
  });

  it("treats a renamed item as a rename, not a redraw", () => {
    const renamed = item({
      itemId: 1,
      shortname: "ak",
      name: "AK-47",
      icon: { fingerprint: "new", source: "cdn", takenAt: "" },
    });
    const rows = [
      row(
        {
          ...renamed,
          name: "Assault Rifle",
          icon: { fingerprint: "old", source: "cdn", takenAt: "" },
        },
        1,
      ),
    ];

    const changes = changesFor([renamed], rows);

    expect(changes.renamed).toEqual([
      { shortname: "ak", name: "AK-47", from: "Assault Rifle" },
    ]);
    expect(changes.iconsRedrawn).toBe(0);
  });

  it("stays quiet when only the category moved", () => {
    const moved = item({ itemId: 1, shortname: "ak", category: "Weapons" });
    const rows = [row({ ...moved, category: "Tool" }, 1)];

    const changes = changesFor([moved], rows);

    expect(hasVisibleChanges(changes)).toBe(false);
  });
});
