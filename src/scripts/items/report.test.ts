import { describe, expect, it } from "vitest";

import { diffItems, renderReport, type BaselineItem } from "./report";
import type { SnapshotItem } from "./snapshot";

function item(
  overrides: Partial<SnapshotItem> & { itemId: number; shortname: string },
): SnapshotItem {
  return {
    name: overrides.shortname,
    category: "Items",
    insertable: true,
    hidden: false,
    redirectTo: null,
    icon: null,
    ...overrides,
  };
}

function baseline(
  i: SnapshotItem,
  overrides: Partial<BaselineItem> = {},
): BaselineItem {
  return { ...i, ...overrides };
}

describe("diffItems", () => {
  const light = item({ itemId: 1, shortname: "light" });
  const red = item({
    itemId: 2,
    shortname: "light.red",
    insertable: false,
    redirectTo: 1,
  });
  const mlrs = item({
    itemId: 3,
    shortname: "mlrs",
    insertable: false,
    hidden: true,
  });
  const coal = item({ itemId: 4, shortname: "coal" });
  const secret = item({
    itemId: 5,
    shortname: "secret",
    insertable: false,
    hidden: true,
  });
  const wallpaper: BaselineItem = {
    ...item({ itemId: 6, shortname: "wallpaper" }),
  };

  const diff = diffItems(
    [
      baseline(light),
      baseline(red, { insertable: true, redirectTo: null }),
      baseline(mlrs, { insertable: true }),
      wallpaper,
    ],
    [light, red, mlrs, coal, secret],
  );

  it("lists new insertable items only", () => {
    expect(diff.added.map((i) => i.shortname)).toEqual(["coal"]);
  });

  it("lists items that stopped being insertable", () => {
    expect(diff.noLongerInsertable.map((i) => i.shortname)).toEqual([
      "light.red",
      "mlrs",
    ]);
  });

  it("lists baseline items the game no longer defines", () => {
    expect(diff.missingFromBuild.map((i) => i.shortname)).toEqual([
      "wallpaper",
    ]);
  });

  it("tracks renames and category moves of insertable items", () => {
    const renamed = diffItems(
      [baseline(light, { name: "Old", category: "Electrical" })],
      [light],
    );
    expect(renamed.renamed).toEqual([{ item: light, from: "Old" }]);
    expect(renamed.recategorized).toEqual([
      { item: light, from: "Electrical" },
    ]);
  });

  it("explains why an item is no longer insertable", () => {
    const report = renderReport({
      previousManifestId: "1",
      manifestId: "2",
      items: [light, red, mlrs, coal, secret],
      diff,
      iconChanges: [],
    });
    expect(report).toContain("- `light.red` light.red: redirects to `light`");
    expect(report).toContain("- `mlrs` mlrs: hidden");
    expect(report).toContain("### Icons needed (2)");
  });
});
