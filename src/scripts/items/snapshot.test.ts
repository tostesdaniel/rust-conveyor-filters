import { describe, expect, it } from "vitest";

import {
  buildItems,
  isInsertable,
  serializeSnapshot,
  type ItemFlags,
  type ItemJson,
  type SnapshotItem,
} from "./snapshot";

function flags(
  overrides: Partial<ItemFlags> & { shortname: string },
): ItemFlags {
  return {
    itemId: overrides.shortname.length,
    hidden: false,
    redirectTo: null,
    forceShowInConveyorFilter: false,
    blueprintForceShowInConveyorFilter: false,
    ...overrides,
  };
}

function json(f: ItemFlags, extra: Partial<ItemJson> = {}): [string, ItemJson] {
  return [
    `${f.shortname}.json`,
    {
      itemid: f.itemId,
      shortname: f.shortname,
      Name: f.shortname.toUpperCase(),
      Description: `A ${f.shortname}.`,
      Category: "Items",
      ...extra,
    },
  ];
}

describe("isInsertable", () => {
  it("accepts a plain visible item", () => {
    expect(isInsertable(flags({ shortname: "wood" }))).toBe(true);
  });

  it("rejects hidden items", () => {
    expect(isInsertable(flags({ shortname: "mlrs", hidden: true }))).toBe(
      false,
    );
  });

  it("rejects redirect items even when visible", () => {
    const red = flags({
      shortname: "industrial.wall.light.red",
      redirectTo: 1,
    });
    expect(isInsertable(red)).toBe(false);
  });

  it("keeps redirects whose blueprint is force-shown", () => {
    const barrel = flags({
      shortname: "storage_barrel_b",
      redirectTo: 1,
      blueprintForceShowInConveyorFilter: true,
    });
    expect(isInsertable(barrel)).toBe(true);
  });

  it("doesn't let the blueprint flag override hidden", () => {
    const ammoPack = flags({
      shortname: "minigunammopack",
      hidden: true,
      blueprintForceShowInConveyorFilter: true,
    });
    expect(isInsertable(ammoPack)).toBe(false);
  });

  it("lets the conveyor force-show mod override hidden", () => {
    const photo = flags({
      shortname: "photo",
      hidden: true,
      forceShowInConveyorFilter: true,
    });
    expect(isInsertable(photo)).toBe(true);
  });
});

describe("buildItems", () => {
  const wood = flags({ itemId: 1, shortname: "wood" });
  const car = flags({ itemId: 2, shortname: "2module.car" });
  const red = flags({ itemId: 3, shortname: "light.red", redirectTo: 4 });
  const light = flags({ itemId: 4, shortname: "light" });

  it("takes names and categories from the JSON dump and sorts by shortname", () => {
    const items = buildItems(
      [wood, light, red],
      new Map([
        json(wood, { Name: "Wood", Category: "Resources" }),
        json(light),
        json(red),
      ]),
      [],
    );
    expect(items.map((i) => i.shortname)).toEqual([
      "light",
      "light.red",
      "wood",
    ]);
    expect(items[2]).toMatchObject({
      name: "Wood",
      category: "Resources",
      insertable: true,
    });
    expect(items[1]).toMatchObject({ insertable: false, redirectTo: 4 });
  });

  it("keeps a null description as an empty string", () => {
    const boat = flags({ itemId: 7, shortname: "rhib" });
    const [item] = buildItems(
      [boat],
      new Map([json(boat, { Description: null })]),
      [],
    );
    expect(item.description).toBe("");
  });

  it("ignores dump files the game has no definition for", () => {
    const junk: [string, ItemJson] = [
      "2module car.json",
      {
        itemid: 2,
        shortname: "2module.car",
        Name: "junk",
        Description: "junk",
        Category: "Items",
      },
    ];
    const plushie: [string, ItemJson] = [
      "charity.plushie.05.json",
      {
        itemid: 99,
        shortname: "charity.plushie.05",
        Name: "x",
        Description: "x",
        Category: "Fun",
      },
    ];
    const items = buildItems(
      [car],
      new Map([json(car, { Name: "Car" }), junk, plushie]),
      [],
    );
    expect(items).toHaveLength(1);
    expect(items[0].name).toBe("Car");
  });

  it("fails loudly when a definition has no JSON", () => {
    expect(() => buildItems([wood], new Map(), [])).toThrow(/wood/);
  });

  it("carries icons over from the previous snapshot by itemId", () => {
    const icon = {
      fingerprint: "abc",
      source: "game" as const,
      takenAt: "2026-09-18T00:00:00.000Z",
    };
    const previous = [{ itemId: 1, icon } as SnapshotItem];
    const [item] = buildItems([wood], new Map([json(wood)]), previous);
    expect(item.icon).toEqual(icon);
  });
});

describe("serializeSnapshot", () => {
  it("writes one item per line and round-trips", () => {
    const snapshot = {
      gameBuild: { manifestId: "1", itemDataHash: "h" },
      items: buildItems(
        [
          flags({ itemId: 1, shortname: "wood" }),
          flags({ itemId: 2, shortname: "stones" }),
        ],
        new Map([
          json(flags({ itemId: 1, shortname: "wood" })),
          json(flags({ itemId: 2, shortname: "stones" })),
        ]),
        [],
      ),
    };
    const text = serializeSnapshot(snapshot);
    expect(text.split("\n").filter((l) => l.includes('"itemId"'))).toHaveLength(
      2,
    );
    expect(JSON.parse(text)).toEqual(snapshot);
  });
});
