import bundledSnapshot from "@/db/item-snapshot.json";
import type { ItemSnapshot } from "@/scripts/items/snapshot";
import { describe, expect, it } from "vitest";

import {
  planOutputContainer,
  type PlannerRow,
} from "@/lib/output-containers/capacity-planner";
import { OUTPUT_CONTAINERS } from "@/lib/output-containers/container-table";

const largeBox = OUTPUT_CONTAINERS["box.wooden.large"];

function item(
  shortname: string,
  stackSize: number,
  max = 0,
  {
    category = "Resources",
    itemType = "Generic",
  }: { category?: string; itemType?: "Generic" | "Liquid" } = {},
): PlannerRow {
  return { kind: "item", shortname, stackSize, itemType, category, max };
}

const fragments = (max = 0) => item("metal.fragments", 1000, max);
const wood = (max = 0) => item("wood", 1000, max);
const stones = (max = 0) => item("stones", 1000, max);
const sulfur = (max = 0) => item("sulfur", 1000, max);
const hqMetal = (max = 0) => item("metal.refined", 100, max);
const metalOre = (max = 0) => item("metal.ore", 1000, max);
const sulfurOre = (max = 0) => item("sulfur.ore", 1000, max);
const hqOre = (max = 0) => item("hq.metal.ore", 100, max);
const charcoal = (max = 0) => item("charcoal", 1000, max);

describe("planOutputContainer on plain boxes", () => {
  it.each([
    ["box.wooden.large", 48],
    ["coffin.storage", 48],
    ["storage_barrel_b", 48],
    ["wicker.barrel", 48],
    ["krieg.storage.vertical", 48],
    ["vending.machine", 30],
    ["box.wooden", 18],
    ["electric.wallcabinet", 18],
  ] as const)(
    "fills %s with %i stacks of one uncapped row",
    (shortname, slots) => {
      const [plan] = planOutputContainer(OUTPUT_CONTAINERS[shortname], [
        wood(),
      ]);

      expect(plan.max).toBe(slots * 1000);
    },
  );
});

describe("planOutputContainer on a large wood box", () => {
  it("keeps a capped row and splits the rest by stack size, remainder to the top", () => {
    const plan = planOutputContainer(largeBox, [
      fragments(5000),
      wood(),
      stones(),
      sulfur(),
      hqMetal(),
    ]);

    expect(plan.map((row) => row.max)).toEqual([
      5000, 11000, 11000, 11000, 1000,
    ]);
  });

  it("gives every row the share it would get if it were left at 0", () => {
    const plan = planOutputContainer(largeBox, [
      fragments(5000),
      wood(),
      stones(),
      sulfur(),
      hqMetal(),
    ]);

    expect(plan.map((row) => row.splitShare)).toEqual([
      10000, 11000, 11000, 11000, 1000,
    ]);
    expect(plan.some((row) => row.aboveShare)).toBe(false);
  });

  it("flags a Max typed above the row's share after a split", () => {
    const plan = planOutputContainer(largeBox, [
      fragments(5000),
      wood(20000),
      stones(11000),
      sulfur(11000),
      hqMetal(1000),
    ]);

    expect(plan[1]).toMatchObject({
      max: 20000,
      splitShare: 11000,
      aboveShare: true,
    });
  });

  it("gives a row with no slots left one stack and the shares-slots flag", () => {
    const plan = planOutputContainer(largeBox, [fragments(48000), wood()]);

    expect(plan[1]).toMatchObject({ max: 1000, sharesSlots: true });
    expect(plan[0]).toMatchObject({ sharesSlots: false });
  });

  it("keeps a capped row's Max and leaves the shares-slots flag off when others fill the box", () => {
    const plan = planOutputContainer(largeBox, [fragments(48000), wood(3000)]);

    expect(plan[1]).toMatchObject({
      max: 3000,
      sharesSlots: false,
      aboveShare: true,
    });
  });

  it("proposes the Row capacity for a Max above what the box can hold", () => {
    const [plan] = planOutputContainer(largeBox, [wood(60000)]);

    expect(plan).toMatchObject({
      max: 48000,
      rowCapacity: 48000,
      aboveCapacity: true,
    });
  });

  it("doesn't flag a Max the box can hold", () => {
    const [plan] = planOutputContainer(largeBox, [wood(48000)]);

    expect(plan).toMatchObject({ max: 48000, aboveCapacity: false });
  });

  it("flags a water row as not accepted, keeps its Max and leaves it out of the split", () => {
    const plan = planOutputContainer(largeBox, [
      item("water", 1000, 500, { itemType: "Liquid" }),
      wood(),
    ]);

    expect(plan[0]).toMatchObject({
      max: 500,
      notAccepted: true,
      slotGroup: null,
      rowCapacity: null,
    });
    expect(plan[1]).toMatchObject({ max: 48000, notAccepted: false });
  });
});

describe("planOutputContainer with a row added after a split", () => {
  const split = () => [
    fragments(5000),
    wood(11000),
    stones(11000),
    sulfur(11000),
    hqMetal(1000),
  ];

  it("gives a new row at 0 the slots left after the author lowered a row, and leaves the others alone", () => {
    const rows = split();
    rows[1] = wood(5000);
    const plan = planOutputContainer(largeBox, [...rows, charcoal()]);

    expect(plan.map((row) => row.max)).toEqual([
      5000, 5000, 11000, 11000, 1000, 6000,
    ]);
    expect(plan[5].sharesSlots).toBe(false);
  });

  it("gives a new row one stack and the shares-slots flag once the split filled the box", () => {
    const plan = planOutputContainer(largeBox, [...split(), charcoal()]);

    expect(plan.map((row) => row.max)).toEqual([
      5000, 11000, 11000, 11000, 1000, 1000,
    ]);
    expect(plan[5]).toMatchObject({ sharesSlots: true });
  });

  it("keeps the shares-slots flag on a row the split gave one stack", () => {
    const plan = planOutputContainer(largeBox, [...split(), charcoal(1000)]);

    expect(plan[5]).toMatchObject({
      max: 1000,
      sharesSlots: true,
      aboveShare: false,
    });
  });

  it("does not flag an ordinary capped row as sharing slots", () => {
    const plan = planOutputContainer(largeBox, split());

    expect(plan.some((row) => row.sharesSlots)).toBe(false);
  });
});

describe("planOutputContainer on ovens", () => {
  it("caps wood by the furnace's fuel slot and ore by its input slots", () => {
    const plan = planOutputContainer(OUTPUT_CONTAINERS.furnace, [
      wood(),
      metalOre(),
      sulfurOre(),
      fragments(),
      charcoal(),
    ]);

    expect(plan.map((row) => row.max)).toEqual([1000, 1000, 1000, 0, 0]);
    expect(plan.map((row) => row.slotGroup)).toEqual([
      "fuel",
      "input",
      "input",
      null,
      null,
    ]);
  });

  it("marks a furnace's results and charcoal as going to the box, with no cap", () => {
    const plan = planOutputContainer(OUTPUT_CONTAINERS.furnace, [
      wood(),
      metalOre(),
      fragments(),
      charcoal(),
    ]);

    for (const row of plan.slice(2)) {
      expect(row).toMatchObject({
        max: 0,
        goesToBox: true,
        notAccepted: false,
        stopsOven: false,
        rowCapacity: null,
      });
    }
  });

  it("gives a furnace's third ore row one stack and the shares-slots flag", () => {
    const plan = planOutputContainer(OUTPUT_CONTAINERS.furnace, [
      metalOre(),
      sulfurOre(),
      hqOre(),
    ]);

    expect(plan[2]).toMatchObject({ max: 100, sharesSlots: true });
  });

  it("lowers a large furnace's wood to what its fuel slots hold and splits the ore", () => {
    const plan = planOutputContainer(OUTPUT_CONTAINERS["furnace.large"], [
      wood(3000),
      metalOre(),
      sulfurOre(),
      hqOre(),
    ]);

    expect(plan[0]).toMatchObject({
      max: 2000,
      rowCapacity: 2000,
      aboveCapacity: true,
    });
    expect(plan.slice(1).map((row) => row.max)).toEqual([2000, 2000, 100]);
  });

  it("takes wood as fuel and crude oil as input in a small oil refinery", () => {
    const plan = planOutputContainer(OUTPUT_CONTAINERS["small.oil.refinery"], [
      wood(),
      item("crude.oil", 500),
      item("lowgradefuel", 500),
    ]);

    expect(plan.map((row) => row.max)).toEqual([1000, 500, 0]);
    expect(plan[2]).toMatchObject({ goesToBox: true });
  });

  it("flags wood as not accepted by the electric furnace, which has no fuel slot", () => {
    const plan = planOutputContainer(OUTPUT_CONTAINERS["electric.furnace"], [
      wood(500),
      metalOre(),
    ]);

    expect(plan[0]).toMatchObject({ max: 500, notAccepted: true });
    expect(plan[1]).toMatchObject({ max: 2000, slotGroup: "input" });
  });

  it("warns when a result row on a fuel oven has a Max above 0", () => {
    const plan = planOutputContainer(OUTPUT_CONTAINERS.furnace, [
      fragments(5000),
      charcoal(),
    ]);

    expect(plan[0]).toMatchObject({
      max: 5000,
      goesToBox: true,
      stopsOven: true,
    });
    expect(plan[1]).toMatchObject({ stopsOven: false });
  });

  it("doesn't warn about a result row on the electric furnace, which pauses instead", () => {
    const [plan] = planOutputContainer(OUTPUT_CONTAINERS["electric.furnace"], [
      fragments(5000),
    ]);

    expect(plan).toMatchObject({ goesToBox: true, stopsOven: false });
  });

  it("never lets fuel rows and input rows share slots", () => {
    const plan = planOutputContainer(OUTPUT_CONTAINERS["furnace.large"], [
      metalOre(),
      wood(),
      charcoal(),
    ]);

    expect(plan.map((row) => row.max)).toEqual([5000, 2000, 0]);
  });
});

describe("planOutputContainer on a dropbox", () => {
  it("fits any item in its 12 main slots", () => {
    const plan = planOutputContainer(OUTPUT_CONTAINERS.dropbox, [
      wood(),
      item("rifle.ak", 1),
    ]);

    expect(plan.map((row) => row.max)).toEqual([6000, 6]);
    expect(plan.some((row) => row.notAccepted)).toBe(false);
  });
});

describe("planOutputContainer on fridges", () => {
  it.each([
    ["fridge", 240, 24],
    ["mini fridge", 90, 9],
  ] as const)(
    "takes Food and the bota bag in a %s and flags the rest",
    (shortname, apples, botabags) => {
      const plan = planOutputContainer(OUTPUT_CONTAINERS[shortname], [
        item("apple", 10, 0, { category: "Food" }),
        item("botabag", 1, 0, { category: "Items" }),
        item("rifle.ak", 1, 1, { category: "Weapon" }),
      ]);

      expect(plan[0]).toMatchObject({ notAccepted: false, slotGroup: "main" });
      expect(plan[1]).toMatchObject({ notAccepted: false, slotGroup: "main" });
      expect(plan[2]).toMatchObject({ max: 1, notAccepted: true });
      expect(plan.slice(0, 2).map((row) => row.max)).toEqual([
        apples,
        botabags,
      ]);
    },
  );
});

describe("planOutputContainer on a tool cupboard", () => {
  const cupboard = OUTPUT_CONTAINERS["cupboard.tool"];

  it("caps resources by the 24 resource slots and tools by the 5 tool slots", () => {
    const plan = planOutputContainer(cupboard, [
      wood(),
      item("metal.fragments", 1000),
      item("hammer", 1, 0, { category: "Tool" }),
      item("wiretool", 1, 0, { category: "Electrical" }),
    ]);

    expect(plan.map((row) => row.max)).toEqual([12000, 12000, 3, 2]);
    expect(plan.map((row) => row.slotGroup)).toEqual([
      "resources",
      "resources",
      "tools",
      "tools",
    ]);
  });

  it("flags the blocked Resources and a weapon as not accepted", () => {
    const plan = planOutputContainer(cupboard, [
      sulfur(500),
      sulfurOre(),
      item("gunpowder", 1000, 0, { category: "Resources" }),
      item("rifle.ak", 1, 1, { category: "Weapon" }),
      wood(),
    ]);

    expect(plan.slice(0, 4).map((row) => row.notAccepted)).toEqual([
      true,
      true,
      true,
      true,
    ]);
    expect(plan[0].max).toBe(500);
    expect(plan[4]).toMatchObject({ max: 24000, notAccepted: false });
  });
});

describe("planOutputContainer on a locker", () => {
  const locker = OUTPUT_CONTAINERS.locker;
  const clothing = (shortname: string, max = 1) =>
    item(shortname, 1, max, { category: "Attire" });
  const kit = [
    "metal.facemask",
    "metal.plate.torso",
    "roadsign.kilt",
    "hoodie",
    "pants",
    "shoes.boots",
    "roadsign.gloves",
  ].map((shortname) => clothing(shortname));
  const belt = [
    item("rifle.ak", 1, 1, { category: "Weapon" }),
    item("ammo.rifle", 128, 0, { category: "Ammunition" }),
    item("syringe.medical", 2, 0, { category: "Medical" }),
    item("largemedkit", 1, 0, { category: "Medical" }),
    item("bandage", 3, 0, { category: "Medical" }),
  ];

  it("refills one kit: clothing, a backpack and six belt slots", () => {
    const plan = planOutputContainer(locker, [
      ...kit,
      clothing("largebackpack"),
      ...belt,
    ]);

    expect(plan.map((row) => row.max)).toEqual([
      1, 1, 1, 1, 1, 1, 1, 1, 1, 256, 2, 1, 3,
    ]);
    expect(plan.map((row) => row.slotGroup)).toEqual([
      ...Array(7).fill("clothing"),
      "backpack",
      ...Array(5).fill("belt"),
    ]);
    expect(plan.some((row) => row.sharesSlots)).toBe(false);
  });

  it("gives an eighth clothing row one stack and the shares-slots flag", () => {
    const plan = planOutputContainer(locker, [
      ...kit,
      clothing("tactical.gloves", 0),
    ]);

    expect(plan[7]).toMatchObject({
      max: 1,
      slotGroup: "clothing",
      sharesSlots: true,
    });
  });

  it("puts a shield in the backpack slot, which the game flags the same way", () => {
    const [plan] = planOutputContainer(locker, [clothing("wooden.shield", 0)]);

    expect(plan).toMatchObject({ max: 1, slotGroup: "backpack" });
  });
});

describe("planOutputContainer with a category row", () => {
  const snapshot = bundledSnapshot as ItemSnapshot;
  const insertable = snapshot.items.filter((entry) => entry.insertable);
  const category = (name: string, max = 0): PlannerRow => ({
    kind: "category",
    category: name,
    items: insertable.filter((entry) => entry.category === name),
    max,
  });

  it("counts the item rows of its category on top of its own share", () => {
    const plan = planOutputContainer(largeBox, [
      category("Resources"),
      wood(10000),
    ]);

    expect(plan[0]).toMatchObject({
      max: 48000,
      slotGroup: "main",
      stackSize: 1000,
    });
    expect(plan[1]).toMatchObject({ max: 10000 });
  });

  it("keeps the Max it proposed, unflagged, once the split writes it", () => {
    const plan = planOutputContainer(largeBox, [
      category("Resources", 48000),
      wood(10000),
    ]);

    expect(plan[0]).toMatchObject({
      max: 48000,
      splitShare: 48000,
      aboveShare: false,
      aboveCapacity: false,
    });
    expect(plan[1]).toMatchObject({ max: 10000, aboveShare: false });
  });

  it("splits a capped category's slots with its item rows left at 0", () => {
    const plan = planOutputContainer(largeBox, [
      category("Resources", 20000),
      wood(),
      stones(),
    ]);

    expect(plan.map((row) => row.max)).toEqual([20000, 7000, 6000]);
    expect(plan[0]).toMatchObject({
      splitShare: 48000,
      rowCapacity: 48000,
      aboveShare: false,
      aboveCapacity: false,
    });
  });

  it("never holds more than the box when its item rows fill it", () => {
    const [plan] = planOutputContainer(largeBox, [
      category("Resources"),
      wood(48000),
    ]);

    expect(plan).toMatchObject({
      max: 48000,
      splitShare: 48000,
      rowCapacity: 48000,
      sharesSlots: true,
    });
  });

  it("lowers a category Max above what the box holds beside its item rows", () => {
    const [plan] = planOutputContainer(largeBox, [
      category("Resources", 60000),
      wood(10000),
    ]);

    expect(plan).toMatchObject({
      max: 48000,
      rowCapacity: 48000,
      aboveCapacity: true,
    });
  });

  it("counts an Attire row in a locker against the clothing slots only", () => {
    const plan = planOutputContainer(OUTPUT_CONTAINERS.locker, [
      category("Attire"),
      item("largebackpack", 1, 0, { category: "Attire" }),
    ]);

    expect(plan[0]).toMatchObject({
      max: 7,
      slotGroup: "clothing",
      stackSize: 1,
    });
    expect(plan[1]).toMatchObject({ max: 1, slotGroup: "backpack" });
  });

  it("flags a Weapon row on a fridge as not accepted and keeps its Max", () => {
    const [plan] = planOutputContainer(OUTPUT_CONTAINERS.fridge, [
      category("Weapon", 5),
    ]);

    expect(plan).toMatchObject({
      max: 5,
      notAccepted: true,
      slotGroup: null,
    });
  });
});
