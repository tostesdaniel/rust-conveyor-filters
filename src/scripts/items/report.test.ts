import { describe, expect, it } from "vitest";

import { CONTAINER_TABLE_GAME_BUILD } from "@/lib/output-containers/container-table";

import { diffItems, renderReport, type BaselineItem } from "./report";
import type { SnapshotItem } from "./snapshot";

function item(
  overrides: Partial<SnapshotItem> & { itemId: number; shortname: string },
): SnapshotItem {
  return {
    name: overrides.shortname,
    description: `A ${overrides.shortname}.`,
    category: "Items",
    stackSize: 1,
    itemType: "Generic",
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

  it("tracks reworded descriptions", () => {
    const reworded = diffItems(
      [baseline(light, { description: "A lamp." })],
      [light],
    );
    expect(reworded.redescribed).toEqual([{ item: light, from: "A lamp." }]);
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

describe("container table section", () => {
  const furnace = item({ itemId: 10, shortname: "furnace", name: "Furnace" });
  const hammer = item({ itemId: 11, shortname: "hammer", name: "Hammer" });
  const lamp = item({ itemId: 12, shortname: "lamp", name: "Lamp" });

  function report(before: BaselineItem[], after: SnapshotItem[]) {
    return renderReport({
      previousManifestId: "1",
      manifestId: "2",
      items: after,
      diff: diffItems(before, after),
      iconChanges: [],
    });
  }

  it("flags a changed container item and names both game builds", () => {
    const text = report(
      [baseline(furnace, { name: "Old Furnace" }), baseline(lamp)],
      [furnace, lamp],
    );
    expect(text).toContain("### Container table (1)");
    expect(text).toContain(`\`${CONTAINER_TABLE_GAME_BUILD}\``);
    expect(text).toMatch(/Game build `2`/);
    expect(text).toContain(
      "- `furnace` Furnace (container): renamed from Old Furnace",
    );
  });

  it("flags an item a container's accept list names", () => {
    const text = report([baseline(hammer, { insertable: true })], []);
    expect(text).toContain(
      "- `hammer` Hammer (named by `cupboard.tool`): not in this game build",
    );
  });

  it("flags a new item a container's accept list names", () => {
    const text = report([], [hammer]);
    expect(text).toContain(
      "- `hammer` Hammer (named by `cupboard.tool`): new in this game build",
    );
  });

  it("flags an item moving into or out of a category a container accepts", () => {
    const pie = item({ itemId: 13, shortname: "pie", category: "Items" });
    const text = report([baseline(pie, { category: "Food" })], [pie]);
    expect(text).toContain(
      "- `pie` pie (named by `fridge`, `mini fridge`, `hitchtroughcombo`): moved from Food to Items",
    );
  });

  it("asks for a socket check on new storage-like items", () => {
    const box = item({
      itemId: 14,
      shortname: "box.metal",
      name: "Metal Box",
      category: "Items",
    });
    const shirt = item({
      itemId: 15,
      shortname: "cratecostume",
      category: "Attire",
    });
    const fridge = item({
      itemId: 16,
      shortname: "fridge.retro",
      category: "Electrical",
    });
    const text = report([], [box, shirt, fridge]);
    expect(text).toContain("### Container table (2)");
    expect(text).toContain("check for a storage adaptor socket");
    expect(text).toContain("- `box.metal` Metal Box (Items)");
    expect(text).toContain("- `fridge.retro` fridge.retro (Electrical)");
    const section = text.slice(
      text.indexOf("### Container table"),
      text.indexOf("### Icons needed"),
    );
    expect(section).not.toContain("- `cratecostume`");
  });

  it("is omitted when no container item changed", () => {
    const text = report([baseline(lamp, { name: "Old Lamp" })], [lamp]);
    expect(text).not.toContain("Container table");
  });
});
